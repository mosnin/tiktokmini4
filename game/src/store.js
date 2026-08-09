import { create } from 'zustand'
import {
  initialState, generateLegalMoves, makeMove, gameStatus, positionKey, isInCheck,
  isSquareAttacked, findKing, fromFEN, algebraic, fromAlgebraic,
} from './game/chess.js'
import { evaluate } from './game/ai.js'
import { skinForLevel, levelPayout, TOTAL_LEVELS } from './game/levels.js'
import { sfx } from './audio.js'
import AiWorkerFactory from './game/aiWorker.js?worker&inline'

const KEY = 'checkmate-save-v1'
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} } }
const s = load()

export const PIECE_SETS = [
  { id: 'classic', name: 'Classic', unlock: 'free' },
  { id: 'shadow', name: 'Shadow Ops', unlock: 'ad' },
  { id: 'royal', name: 'Royal Gold', unlock: 'ad' },
  { id: 'crystal', name: 'Crystal', unlock: 'money', cost: 5000 },
  { id: 'obsidian', name: 'Obsidian', unlock: 'money', cost: 25000 },
]

// ---------------- AI worker plumbing ----------------
let worker = null
let reqCounter = 0
const pending = new Map()
function getWorker() {
  if (!worker) {
    worker = new AiWorkerFactory()
    worker.onmessage = e => {
      const { reqId, result, error } = e.data
      const resolver = pending.get(reqId)
      if (resolver) {
        pending.delete(reqId)
        if (error) resolver.reject(new Error(error)); else resolver.resolve(result)
      }
    }
  }
  return worker
}
function askWorker(type, payload) {
  return new Promise((resolve, reject) => {
    const reqId = ++reqCounter
    pending.set(reqId, { resolve, reject })
    getWorker().postMessage({ type, reqId, ...payload })
  })
}

const EVAL_BLUNDER_CP = 250 // 2.5 pawns

function freshSession() {
  const st = initialState()
  return {
    chessState: st,
    states: [st],
    posKeys: [positionKey(st)],
    selected: null,
    legalForSelected: [],
    lastMove: null,
    hintMove: null,
    promotionPending: null,
    aiThinking: false,
    gameOver: null,          // { result: 'win'|'loss'|'draw', reason, stars }
    reviveOffer: null,       // { mandatory }
    revivesUsedThisGame: 0,
    hintUsedThisGame: false,
    freeReviveUsedThisGame: false,
    evalBeforePlayerMove: 0,
  }
}

export const useGame = create((set, get) => ({
  screen: 'title', // title | map | game | cosmetics | results
  build: 'chess-v1',

  // ---- persistent progress ----
  unlockedLevel: s.unlockedLevel ?? 1,
  stars: s.stars ?? {},          // { [level]: 1|2|3 }
  money: s.money ?? 0,
  cosmeticsOwned: s.cosmeticsOwned ?? ['classic'],
  cosmeticSelected: s.cosmeticSelected ?? 'classic',
  gamesCompleted: s.gamesCompleted ?? 0,

  // ---- session (per game) ----
  currentLevel: 1,
  ...freshSession(),

  // ---- ads / modals ----
  adModal: null,          // { kind, onDone }
  lastResults: null,

  save() {
    const g = get()
    localStorage.setItem(KEY, JSON.stringify({
      unlockedLevel: g.unlockedLevel, stars: g.stars, money: g.money,
      cosmeticsOwned: g.cosmeticsOwned, cosmeticSelected: g.cosmeticSelected,
      gamesCompleted: g.gamesCompleted,
    }))
  },

  // ---------------- navigation ----------------
  goTitle() { set({ screen: 'title' }) },
  goMap() { set({ screen: 'map', lastResults: null }) },
  goCosmetics() { set({ screen: 'cosmetics' }) },

  startLevel(level) {
    if (level > get().unlockedLevel) { sfx.deny(); return }
    sfx.click()
    set({ currentLevel: level, screen: 'game', ...freshSession() })
  },

  restartLevel() {
    const level = get().currentLevel
    set({ ...freshSession() })
    sfx.click()
  },

  // ---------------- board interaction ----------------
  tapSquare(sq) {
    const g = get()
    if (g.aiThinking || g.promotionPending || g.gameOver || g.reviveOffer) return
    const st = g.chessState
    if (st.turn !== 'w') return

    // tapping one of the highlighted legal targets commits a move
    if (g.selected !== null) {
      const matches = g.legalForSelected.filter(m => m.to === sq)
      if (matches.length > 0) {
        if (matches.length > 1) {
          set({ promotionPending: { from: g.selected, to: sq, color: 'w', options: matches } })
          return
        }
        get().commitPlayerMove(matches[0])
        return
      }
    }

    const piece = st.board[sq]
    if (piece && piece === piece.toUpperCase()) {
      const legal = generateLegalMoves(st).filter(m => m.from === sq)
      set({ selected: sq, legalForSelected: legal })
      if (legal.length) sfx.click()
    } else {
      set({ selected: null, legalForSelected: [] })
    }
  },

  resolvePromotion(promoLetter) {
    const g = get()
    const p = g.promotionPending
    if (!p) return
    const move = p.options.find(m => m.promotion && m.promotion.toUpperCase() === promoLetter.toUpperCase())
    set({ promotionPending: null })
    if (move) get().commitPlayerMove(move)
  },

  cancelPromotion() { set({ promotionPending: null, selected: null, legalForSelected: [] }) },

  commitPlayerMove(move) {
    const g = get()
    const before = g.chessState
    const evalBefore = evaluate(before)
    const after = makeMove(before, move)
    sfx[move.captured ? 'capture' : 'move']()
    if (move.promotion) sfx.promote()

    const states = [...g.states, after]
    const posKeys = [...g.posKeys, positionKey(after)]
    set({
      chessState: after, states, posKeys, selected: null, legalForSelected: [], hintMove: null,
      lastMove: { from: move.from, to: move.to }, evalBeforePlayerMove: evalBefore,
    })

    const status = gameStatus(after)
    const threefold = posKeys.filter(k => k === posKeys[posKeys.length - 1]).length >= 3
    if (status.inCheck) sfx.check()

    if (status.over) {
      get()._endGame(status.result === 'white' ? 'win' : status.result === 'black' ? 'loss' : 'draw', status.reason)
      return
    }
    if (threefold) { get()._endGame('draw', 'threefold-repetition'); return }

    get()._triggerAiMove()
  },

  async _triggerAiMove() {
    const g = get()
    set({ aiThinking: true })
    const state = g.chessState
    let result
    try {
      result = await askWorker('move', { state, level: g.currentLevel })
    } catch {
      result = null
    }
    // session may have moved on (restart/undo) while awaiting — bail if so
    if (get().chessState !== state) { set({ aiThinking: false }); return }
    if (!result || !result.move) { set({ aiThinking: false }); return }

    const after = makeMove(state, result.move)
    sfx[result.move.captured ? 'capture' : 'move']()
    if (result.move.promotion) sfx.promote()

    const states = [...get().states, after]
    const posKeys = [...get().posKeys, positionKey(after)]
    set({ chessState: after, states, posKeys, aiThinking: false, lastMove: { from: result.move.from, to: result.move.to } })

    const status = gameStatus(after)
    const threefold = posKeys.filter(k => k === posKeys[posKeys.length - 1]).length >= 3
    if (status.inCheck) sfx.check()

    if (status.over) {
      if (status.result === 'black') {
        // player was checkmated — mandatory revive-or-lose
        set({ reviveOffer: { mandatory: true } })
        sfx.heartbeat()
        return
      }
      get()._endGame(status.result === 'white' ? 'win' : 'draw', status.reason)
      return
    }
    if (threefold) { get()._endGame('draw', 'threefold-repetition'); return }

    // blunder detection: eval dropped hard across the player's move + AI reply
    const evalAfter = evaluate(after)
    const drop = get().evalBeforePlayerMove - evalAfter
    if (drop > EVAL_BLUNDER_CP) {
      set({ reviveOffer: { mandatory: false } })
      sfx.heartbeat()
    }
  },

  // ---------------- revive (undo) ----------------
  reviveAvailableFree() {
    const g = get()
    return g.currentLevel <= 4 && !g.freeReviveUsedThisGame
  },
  acceptRevive() {
    const g = get()
    if (!g.reviveOffer) return
    if (get().reviveAvailableFree()) { get()._performRevive(); return }
    get().showAd('revive', () => get()._performRevive())
  },
  declineRevive() {
    const g = get()
    const wasMandatory = g.reviveOffer?.mandatory
    set({ reviveOffer: null })
    if (wasMandatory) get()._endGame('loss', 'checkmate')
  },
  _performRevive() {
    const g = get()
    if (g.states.length < 3) { set({ reviveOffer: null }); return }
    const states = g.states.slice(0, -2)
    const posKeys = g.posKeys.slice(0, -2)
    const wasFree = get().reviveAvailableFree()
    set({
      states, posKeys, chessState: states[states.length - 1],
      reviveOffer: null, selected: null, legalForSelected: [], hintMove: null,
      revivesUsedThisGame: g.revivesUsedThisGame + 1,
      freeReviveUsedThisGame: wasFree ? true : g.freeReviveUsedThisGame,
      lastMove: null, gameOver: null,
    })
    sfx.counterDone()
  },

  // ---------------- hint ----------------
  hintAvailableFree() { return !get().hintUsedThisGame },
  requestHint() {
    const g = get()
    if (g.aiThinking || g.gameOver || g.promotionPending) return
    if (get().hintAvailableFree()) { get()._computeHint(); return }
    get().showAd('hint', () => get()._computeHint())
  },
  async _computeHint() {
    set({ hintUsedThisGame: true })
    const state = get().chessState
    try {
      const result = await askWorker('hint', { state })
      if (result && result.move) {
        set({ hintMove: { from: result.move.from, to: result.move.to } })
        setTimeout(() => {
          if (get().hintMove) set({ hintMove: null })
        }, 3500)
      }
    } catch {}
  },

  // ---------------- end of game / results ----------------
  _endGame(result, reason) {
    const g = get()
    let stars = 0
    if (result === 'win') {
      stars = g.revivesUsedThisGame === 0 ? 3 : g.revivesUsedThisGame === 1 ? 2 : 1
    }
    set({ gameOver: { result, reason, stars } })
    if (result === 'win') sfx.jackpot(); else if (result === 'loss') sfx.lose()

    const payout = result === 'win' ? levelPayout(g.currentLevel, stars) : 0
    const prevStars = g.stars[g.currentLevel] ?? 0
    const newStars = { ...g.stars, [g.currentLevel]: Math.max(prevStars, stars) }
    const newUnlocked = result === 'win' ? Math.min(TOTAL_LEVELS, Math.max(g.unlockedLevel, g.currentLevel + 1)) : g.unlockedLevel
    const gamesCompleted = g.gamesCompleted + 1

    set({
      stars: newStars, unlockedLevel: newUnlocked, gamesCompleted,
      lastResults: {
        level: g.currentLevel, result, reason, stars, payout,
        wheelMult: null, collected: false, revivesUsed: g.revivesUsedThisGame,
      },
    })
    get().save()

    const showInterstitial = gamesCompleted % 2 === 0
    if (showInterstitial) {
      get().showAd('interstitial', () => set({ screen: 'results' }))
    } else {
      set({ screen: 'results' })
    }
  },

  claimWheel(mult) {
    const g = get()
    if (!g.lastResults || g.lastResults.wheelMult || g.lastResults.collected) return
    get().showAd('spin', () => {
      const cur = get()
      set({ lastResults: { ...cur.lastResults, wheelMult: mult } })
      if (mult >= 3) sfx.jackpot(); else sfx.counterDone()
    })
  },

  collect() {
    const g = get()
    const r = g.lastResults
    if (!r || r.collected) return 0
    const total = Math.floor(r.payout * (r.wheelMult ?? 1))
    set({ money: g.money + total, lastResults: { ...r, collected: true, total } })
    get().save()
    return total
  },

  continueFromResults() {
    set({ screen: 'map', lastResults: null })
  },

  // ---------------- cosmetics ----------------
  selectCosmetic(id) {
    const g = get()
    const def = PIECE_SETS.find(p => p.id === id)
    if (!def) return
    if (g.cosmeticsOwned.includes(id)) {
      set({ cosmeticSelected: id }); sfx.click(); get().save(); return
    }
    if (def.unlock === 'ad') {
      get().showAd('cosmetic', () => {
        const cur = get()
        set({ cosmeticsOwned: [...cur.cosmeticsOwned, id], cosmeticSelected: id })
        sfx.counterDone(); get().save()
      })
    } else if (def.unlock === 'money') {
      if (g.money < def.cost) { sfx.deny(); return }
      set({ money: g.money - def.cost, cosmeticsOwned: [...g.cosmeticsOwned, id], cosmeticSelected: id })
      sfx.counterDone(); get().save()
    }
  },

  // ---------------- ad stub (TikTok SDK seam handled in tiktok.js; this is the in-game modal) ----------------
  showAd(kind, onDone) { set({ adModal: { kind, onDone } }) },
  closeAd(granted) {
    const m = get().adModal
    set({ adModal: null })
    if (granted && m?.onDone) m.onDone()
  },

  // ---------------- debug helpers (dev builds only) ----------------
  __forceWin() {
    const g = get()
    if (g.screen !== 'game') return
    get()._endGame('win', 'debug-force')
  },
  __forceLoss() {
    const g = get()
    if (g.screen !== 'game') return
    get()._endGame('loss', 'debug-force')
  },
}))

window.__store = useGame // debug/testing hook

// Read-only chess-logic helpers exposed for automated E2E test scripts to
// script exact moves/positions. Not used by any gameplay code path.
window.__chessDebug = {
  generateLegalMoves, makeMove, isSquareAttacked, findKing, fromFEN, positionKey,
  initialState, algebraic, fromAlgebraic,
}

export function skinForCurrentLevel() {
  return skinForLevel(useGame.getState().currentLevel)
}

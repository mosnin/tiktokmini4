// Minimax + alpha-beta with iterative deepening, piece-square tables, and a
// mobility term. Runs synchronously but the caller (a Web Worker, or a
// setTimeout-chunked fallback) is expected to keep it off the main thread.
import { generateLegalMoves, makeMove, isInCheck, colorOf, fileOf, rankOf } from './chess.js'

const PIECE_VALUE = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000 }

// Piece-square tables, from White's perspective, rank 0 = rank1 .. rank 7 = rank8.
// Indexed by [rank][file]. Mirrored vertically for Black at lookup time.
/* eslint-disable no-multi-spaces */
const PST = {
  P: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [5, 10, 10, -20, -20, 10, 10, 5],
    [5, -5, -10, 0, 0, -10, -5, 5],
    [0, 0, 0, 20, 20, 0, 0, 0],
    [5, 5, 10, 25, 25, 10, 5, 5],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  N: [
    [-50, -40, -30, -30, -30, -30, -40, -50],
    [-40, -20, 0, 5, 5, 0, -20, -40],
    [-30, 5, 10, 15, 15, 10, 5, -30],
    [-30, 0, 15, 20, 20, 15, 0, -30],
    [-30, 5, 15, 20, 20, 15, 5, -30],
    [-30, 0, 10, 15, 15, 10, 0, -30],
    [-40, -20, 0, 0, 0, 0, -20, -40],
    [-50, -40, -30, -30, -30, -30, -40, -50],
  ],
  B: [
    [-20, -10, -10, -10, -10, -10, -10, -20],
    [-10, 5, 0, 0, 0, 0, 5, -10],
    [-10, 10, 10, 10, 10, 10, 10, -10],
    [-10, 0, 10, 10, 10, 10, 0, -10],
    [-10, 5, 5, 10, 10, 5, 5, -10],
    [-10, 0, 5, 10, 10, 5, 0, -10],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-20, -10, -10, -10, -10, -10, -10, -20],
  ],
  R: [
    [0, 0, 0, 5, 5, 0, 0, 0],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [5, 10, 10, 10, 10, 10, 10, 5],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  Q: [
    [-20, -10, -10, -5, -5, -10, -10, -20],
    [-10, 0, 5, 0, 0, 0, 0, -10],
    [-10, 5, 5, 5, 5, 5, 0, -10],
    [0, 0, 5, 5, 5, 5, 0, -5],
    [-5, 0, 5, 5, 5, 5, 0, -5],
    [-10, 0, 5, 5, 5, 5, 0, -10],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-20, -10, -10, -5, -5, -10, -10, -20],
  ],
  K: [
    [20, 30, 10, 0, 0, 10, 30, 20],
    [20, 20, 0, 0, 0, 0, 20, 20],
    [-10, -20, -20, -20, -20, -20, -20, -10],
    [-20, -30, -30, -40, -40, -30, -30, -20],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
  ],
}
const KING_ENDGAME = [
  [-50, -30, -30, -30, -30, -30, -30, -50],
  [-30, -30, 0, 0, 0, 0, -30, -30],
  [-30, -10, 20, 30, 30, 20, -10, -30],
  [-30, -10, 30, 40, 40, 30, -10, -30],
  [-30, -10, 30, 40, 40, 30, -10, -30],
  [-30, -10, 20, 30, 30, 20, -10, -30],
  [-30, -20, -10, 0, 0, -10, -20, -30],
  [-50, -40, -30, -20, -20, -30, -40, -50],
]
/* eslint-enable no-multi-spaces */

function pstValue(piece, sq, endgame) {
  const upper = piece.toUpperCase()
  const white = piece === upper
  const r = rankOf(sq), f = fileOf(sq)
  const table = (upper === 'K' && endgame) ? KING_ENDGAME : PST[upper]
  const row = white ? r : 7 - r
  return table[row][f]
}

function isEndgame(board) {
  let queens = 0, minorsAndRooks = 0
  for (const p of board) {
    if (!p) continue
    const u = p.toUpperCase()
    if (u === 'Q') queens++
    else if (u === 'R' || u === 'B' || u === 'N') minorsAndRooks++
  }
  return queens === 0 || minorsAndRooks <= 4
}

// Static evaluation, positive favors White, in centipawns.
export function evaluate(state, weights = DEFAULT_WEIGHTS) {
  const { board } = state
  const endgame = isEndgame(board)
  let score = 0
  for (let sq = 0; sq < 64; sq++) {
    const p = board[sq]
    if (!p) continue
    const white = p === p.toUpperCase()
    const val = PIECE_VALUE[p.toUpperCase()] + pstValue(p, sq, endgame) * weights.pst
    score += white ? val : -val
  }
  if (weights.mobility) {
    const legalHere = generateLegalMoves(state).length
    const opp = { ...state, turn: state.turn === 'w' ? 'b' : 'w' }
    let oppMoves = 0
    try { oppMoves = generateLegalMoves(opp).length } catch { oppMoves = 0 }
    const mobilityScore = (legalHere - oppMoves) * weights.mobility
    score += state.turn === 'w' ? mobilityScore : -mobilityScore
  }
  return score
}

const DEFAULT_WEIGHTS = { pst: 1, mobility: 2 }

// ---------------- move ordering ----------------

function scoreMoveForOrdering(m, ttMove) {
  if (ttMove && m.from === ttMove.from && m.to === ttMove.to && m.promotion === ttMove.promotion) return 100000
  let s = 0
  if (m.captured) s += 1000 + (PIECE_VALUE[m.captured.toUpperCase()] - PIECE_VALUE[m.piece.toUpperCase()] / 10)
  if (m.promotion) s += 900
  return s
}

function orderMoves(moves, ttMove) {
  return moves.map(m => [m, scoreMoveForOrdering(m, ttMove)])
    .sort((a, b) => b[1] - a[1])
    .map(x => x[0])
}

// ---------------- search ----------------

const MATE_SCORE = 100000

function negamax(state, depth, alpha, beta, weights, deadline, ply) {
  if (Date.now() > deadline) throw new TimeoutSignal()
  const moves = generateLegalMoves(state)
  const inCheck = isInCheck(state, state.turn)
  if (moves.length === 0) {
    if (inCheck) return -MATE_SCORE + ply
    return 0
  }
  if (depth === 0) {
    const val = evaluate(state, weights)
    return state.turn === 'w' ? val : -val
  }
  const ordered = orderMoves(moves, null)
  let best = -Infinity
  for (const m of ordered) {
    const next = makeMove(state, m)
    const val = -negamax(next, depth - 1, -beta, -alpha, weights, deadline, ply + 1)
    if (val > best) best = val
    if (val > alpha) alpha = val
    if (alpha >= beta) break
  }
  return best
}

class TimeoutSignal extends Error {}

// Iterative deepening search under a time budget. Returns { move, depth, score }.
export function searchBestMove(state, { maxDepth = 4, timeBudgetMs = 800, weights = DEFAULT_WEIGHTS } = {}) {
  const moves = generateLegalMoves(state)
  if (moves.length === 0) return null
  if (moves.length === 1) return { move: moves[0], depth: 1, score: 0 }

  const deadline = Date.now() + timeBudgetMs
  let bestMove = moves[0]
  let bestScore = -Infinity
  let reachedDepth = 0

  for (let depth = 1; depth <= maxDepth; depth++) {
    let ordered = orderMoves(moves, bestMove)
    let localBest = null
    let localBestScore = -Infinity
    let alpha = -Infinity
    const beta = Infinity
    try {
      for (const m of ordered) {
        const next = makeMove(state, m)
        const val = -negamax(next, depth - 1, -beta, -alpha, weights, deadline, 1)
        if (val > localBestScore) { localBestScore = val; localBest = m }
        if (val > alpha) alpha = val
      }
    } catch (e) {
      if (e instanceof TimeoutSignal) break
      throw e
    }
    if (localBest) {
      bestMove = localBest
      bestScore = localBestScore
      reachedDepth = depth
    }
    if (Date.now() > deadline) break
    if (Math.abs(localBestScore) > MATE_SCORE - 1000) break // found forced mate, no need to go deeper
  }
  return { move: bestMove, depth: reachedDepth, score: bestScore }
}

// ---------------- level configuration: 24 tiers, Rookie -> Grandmaster ----------------

export const LEVEL_NAMES = [
  'Rookie', 'Pawn Pusher', 'Novice', 'Apprentice', 'Club Player', 'Tactician',
  'Sharp Shooter', 'Strategist', 'Rising Star', 'Challenger', 'Expert', 'Veteran',
  'Master Candidate', 'National Master', 'Senior Master', 'International Master',
  'IM Elite', 'Grandmaster Trainee', 'Grandmaster', 'GM Elite', 'Super GM',
  'World Class', 'Champion', 'Grandmaster',
]

export function levelConfig(level) {
  // level is 1-based, 1..24
  const l = Math.max(1, Math.min(24, level))
  const depth = 1 + Math.floor((l - 1) / 4.2) // ~1 at L1 climbing to ~6 at L24
  const timeBudgetMs = Math.round(300 + (l - 1) * ((1800 - 300) / 23))
  const blunderChance = Math.max(0, 0.3 - (l - 1) * (0.3 / 12)) // 30% at L1 fading to 0 by ~L13
  const mobility = 1 + (l / 24) * 2.5 // stronger levels value mobility/king safety more
  return {
    level: l,
    name: LEVEL_NAMES[l - 1] || `Level ${l}`,
    maxDepth: Math.min(6, depth),
    timeBudgetMs,
    blunderChance,
    weights: { pst: 1, mobility },
  }
}

// Top-level entry: pick the AI's move for the given level, including the
// intentional-blunder mechanic for low levels.
export function chooseAiMove(state, level) {
  const cfg = levelConfig(level)
  const legal = generateLegalMoves(state)
  if (legal.length === 0) return null

  if (Math.random() < cfg.blunderChance) {
    // Blunder: pick a random legal move, weighted slightly away from the very
    // best move but still a real legal move — feels human, not broken.
    const idx = Math.floor(Math.random() * legal.length)
    return { move: legal[idx], depth: 0, score: 0, blunder: true }
  }

  const result = searchBestMove(state, {
    maxDepth: cfg.maxDepth,
    timeBudgetMs: cfg.timeBudgetMs,
    weights: cfg.weights,
  })
  return result
}

export { PIECE_VALUE, DEFAULT_WEIGHTS }

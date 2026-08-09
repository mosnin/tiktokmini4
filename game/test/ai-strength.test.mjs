// Verifies the AI actually gets stronger with level. Plays several quick
// games of levelA vs levelB and reports the score. Run with:
//   node test/ai-strength.test.mjs
import { initialState, makeMove, generateLegalMoves, isInCheck } from '../src/game/chess.js'
import { chooseAiMove } from '../src/game/ai.js'

function playGame(levelWhite, levelBlack, maxPlies = 200) {
  let state = initialState()
  let plies = 0
  while (plies < maxPlies) {
    const legal = generateLegalMoves(state)
    if (legal.length === 0) {
      const inCheck = isInCheck(state, state.turn)
      if (inCheck) return { result: state.turn === 'w' ? 'black' : 'white', reason: 'checkmate', plies }
      return { result: 'draw', reason: 'stalemate', plies }
    }
    if (state.halfmove >= 100) return { result: 'draw', reason: 'fifty-move', plies }
    const level = state.turn === 'w' ? levelWhite : levelBlack
    const picked = chooseAiMove(state, level)
    if (!picked) return { result: 'draw', reason: 'no-move', plies }
    state = makeMove(state, picked.move)
    plies++
  }
  return { result: 'draw', reason: 'move-limit', plies }
}

const N_GAMES = 3
console.log(`Playing ${N_GAMES} games: L1 vs L10 (alternating colors)...\n`)

let l10wins = 0, l1wins = 0, draws = 0
for (let i = 0; i < N_GAMES; i++) {
  const l1IsWhite = i % 2 === 0
  const t0 = Date.now()
  const res = l1IsWhite ? playGame(1, 10) : playGame(10, 1)
  const ms = Date.now() - t0
  const l1Color = l1IsWhite ? 'white' : 'black'
  const l10Color = l1IsWhite ? 'black' : 'white'
  let winner = 'draw'
  if (res.result === l1Color) { winner = 'L1'; l1wins++ }
  else if (res.result === l10Color) { winner = 'L10'; l10wins++ }
  else draws++
  console.log(`Game ${i + 1}: L1=${l1Color}, L10=${l10Color} -> winner=${winner} (${res.reason}, ${res.plies} plies, ${ms}ms)`)
}

console.log(`\nResults: L10 wins=${l10wins}, L1 wins=${l1wins}, draws=${draws}`)
const l10Dominant = l10wins >= N_GAMES - 1 // allow at most 1 draw/upset
console.log(l10Dominant ? 'PASS: L10 dominates L1 as expected' : 'FAIL: L10 did not dominate L1')
process.exit(l10Dominant ? 0 : 1)

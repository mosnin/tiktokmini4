// Perft validation for src/game/chess.js — run with `node test/perft.test.mjs`.
// Must pass before any UI is built on top of the move generator.
import { initialState, fromFEN, perft } from '../src/game/chess.js'

const cases = [
  {
    name: 'startpos',
    state: initialState(),
    expected: { 1: 20, 2: 400, 3: 8902, 4: 197281 },
  },
  {
    // "Kiwipete" — classic perft position covering castling both sides,
    // en passant, and promotions all at once.
    name: 'kiwipete',
    state: fromFEN('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1'),
    expected: { 1: 48, 2: 2039, 3: 97862 },
  },
  {
    // Position 3 from the CPW perft suite — en passant edge cases, few pieces.
    name: 'position3',
    state: fromFEN('8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1'),
    expected: { 1: 14, 2: 191, 3: 2812, 4: 43238 },
  },
  {
    // Position 4 — promotions, castling rights loss via rook capture.
    name: 'position4',
    state: fromFEN('r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1'),
    expected: { 1: 6, 2: 264, 3: 9467 },
  },
  {
    // Position 5 — a middlegame-ish position with pins/discoveries.
    name: 'position5',
    state: fromFEN('rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8'),
    expected: { 1: 44, 2: 1486, 3: 62379 },
  },
]

let allPass = true
for (const c of cases) {
  console.log(`\n${c.name}:`)
  for (const [depthStr, expected] of Object.entries(c.expected)) {
    const depth = parseInt(depthStr, 10)
    const t0 = Date.now()
    const got = perft(c.state, depth)
    const ms = Date.now() - t0
    const pass = got === expected
    if (!pass) allPass = false
    console.log(`  depth ${depth}: got ${got}, expected ${expected} -- ${pass ? 'PASS' : 'FAIL'} (${ms}ms)`)
  }
}

console.log(allPass ? '\nALL PERFT TESTS PASSED' : '\nPERFT TESTS FAILED')
process.exit(allPass ? 0 : 1)

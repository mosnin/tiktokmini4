// Plain-JS chess rules engine. No dependencies. Board is a flat 64-array,
// index = rank*8 + file, where file 0..7 = a..h and rank 0..7 = 1..8.
// So a1 = 0, h1 = 7, a8 = 56, h8 = 63.
// Pieces are single chars: PNBRQK = white, pnbrqk = black, null = empty.

export const FILES = 'abcdefgh'

export function fileOf(sq) { return sq & 7 }
export function rankOf(sq) { return sq >> 3 }
export function sqOf(file, rank) { return rank * 8 + file }
export function inBounds(file, rank) { return file >= 0 && file < 8 && rank >= 0 && rank < 8 }
export function algebraic(sq) { return FILES[fileOf(sq)] + (rankOf(sq) + 1) }
export function fromAlgebraic(s) { return sqOf(FILES.indexOf(s[0]), parseInt(s[1], 10) - 1) }

export function isWhitePiece(p) { return !!p && p === p.toUpperCase() }
export function isBlackPiece(p) { return !!p && p === p.toLowerCase() }
export function colorOf(p) { return isWhitePiece(p) ? 'w' : 'b' }

const KNIGHT_D = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]]
const KING_D = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]]
const BISHOP_D = [[1, 1], [1, -1], [-1, 1], [-1, -1]]
const ROOK_D = [[1, 0], [-1, 0], [0, 1], [0, -1]]

export function initialState() {
  const board = new Array(64).fill(null)
  const back = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
  for (let f = 0; f < 8; f++) {
    board[sqOf(f, 0)] = back[f]
    board[sqOf(f, 1)] = 'P'
    board[sqOf(f, 6)] = 'p'
    board[sqOf(f, 7)] = back[f].toLowerCase()
  }
  return {
    board,
    turn: 'w',
    castling: { wk: true, wq: true, bk: true, bq: true },
    ep: null, // en passant target square (the square a capturing pawn would move to)
    halfmove: 0,
    fullmove: 1,
  }
}

export function cloneState(s) {
  return {
    board: s.board.slice(),
    turn: s.turn,
    castling: { ...s.castling },
    ep: s.ep,
    halfmove: s.halfmove,
    fullmove: s.fullmove,
  }
}

// ---------------- attack detection ----------------

export function isSquareAttacked(board, sq, byColor) {
  const f = fileOf(sq), r = rankOf(sq)
  // pawns: a byColor pawn attacks sq if it sits one rank behind (from its own
  // movement direction) and one file to either side.
  const pawnDir = byColor === 'w' ? -1 : 1 // where to look FROM sq back towards the attacker
  const pawnChar = byColor === 'w' ? 'P' : 'p'
  for (const df of [-1, 1]) {
    const pf = f + df, pr = r + pawnDir
    if (inBounds(pf, pr) && board[sqOf(pf, pr)] === pawnChar) return true
  }
  // knights
  const knightChar = byColor === 'w' ? 'N' : 'n'
  for (const [df, dr] of KNIGHT_D) {
    const nf = f + df, nr = r + dr
    if (inBounds(nf, nr) && board[sqOf(nf, nr)] === knightChar) return true
  }
  // king
  const kingChar = byColor === 'w' ? 'K' : 'k'
  for (const [df, dr] of KING_D) {
    const nf = f + df, nr = r + dr
    if (inBounds(nf, nr) && board[sqOf(nf, nr)] === kingChar) return true
  }
  // sliding: bishop/queen diagonals
  const bishopChars = byColor === 'w' ? ['B', 'Q'] : ['b', 'q']
  for (const [df, dr] of BISHOP_D) {
    let nf = f + df, nr = r + dr
    while (inBounds(nf, nr)) {
      const p = board[sqOf(nf, nr)]
      if (p) { if (bishopChars.includes(p)) return true; break }
      nf += df; nr += dr
    }
  }
  // sliding: rook/queen orthogonals
  const rookChars = byColor === 'w' ? ['R', 'Q'] : ['r', 'q']
  for (const [df, dr] of ROOK_D) {
    let nf = f + df, nr = r + dr
    while (inBounds(nf, nr)) {
      const p = board[sqOf(nf, nr)]
      if (p) { if (rookChars.includes(p)) return true; break }
      nf += df; nr += dr
    }
  }
  return false
}

export function findKing(board, color) {
  const k = color === 'w' ? 'K' : 'k'
  for (let i = 0; i < 64; i++) if (board[i] === k) return i
  return -1
}

export function isInCheck(state, color) {
  const king = findKing(state.board, color)
  if (king < 0) return false
  return isSquareAttacked(state.board, king, color === 'w' ? 'b' : 'w')
}

// ---------------- move generation ----------------
// A move: { from, to, piece, color, captured, promotion, ep, castle, doubleStep }

function addPawnMoves(state, sq, moves) {
  const { board, turn, ep } = state
  const f = fileOf(sq), r = rankOf(sq)
  const white = turn === 'w'
  const dir = white ? 1 : -1
  const startRank = white ? 1 : 6
  const promoRank = white ? 7 : 0
  const piece = white ? 'P' : 'p'

  const push1r = r + dir
  if (inBounds(f, push1r) && !board[sqOf(f, push1r)]) {
    const to = sqOf(f, push1r)
    if (rankOf(to) === promoRank) {
      for (const promo of ['Q', 'R', 'B', 'N']) {
        moves.push({ from: sq, to, piece, color: turn, captured: null, promotion: white ? promo : promo.toLowerCase() })
      }
    } else {
      moves.push({ from: sq, to, piece, color: turn, captured: null, promotion: null })
      if (r === startRank) {
        const push2r = r + dir * 2
        if (!board[sqOf(f, push2r)]) {
          moves.push({ from: sq, to: sqOf(f, push2r), piece, color: turn, captured: null, promotion: null, doubleStep: true })
        }
      }
    }
  }
  for (const df of [-1, 1]) {
    const cf = f + df, cr = r + dir
    if (!inBounds(cf, cr)) continue
    const to = sqOf(cf, cr)
    const target = board[to]
    if (target && colorOf(target) !== turn) {
      if (rankOf(to) === promoRank) {
        for (const promo of ['Q', 'R', 'B', 'N']) {
          moves.push({ from: sq, to, piece, color: turn, captured: target, promotion: white ? promo : promo.toLowerCase() })
        }
      } else {
        moves.push({ from: sq, to, piece, color: turn, captured: target, promotion: null })
      }
    } else if (to === ep) {
      const capSq = sqOf(cf, r)
      moves.push({ from: sq, to, piece, color: turn, captured: board[capSq], promotion: null, ep: true, epCapSq: capSq })
    }
  }
}

function addSliderMoves(state, sq, dirs, moves) {
  const { board, turn } = state
  const f = fileOf(sq), r = rankOf(sq)
  const piece = board[sq]
  for (const [df, dr] of dirs) {
    let nf = f + df, nr = r + dr
    while (inBounds(nf, nr)) {
      const to = sqOf(nf, nr)
      const target = board[to]
      if (!target) {
        moves.push({ from: sq, to, piece, color: turn, captured: null, promotion: null })
      } else {
        if (colorOf(target) !== turn) moves.push({ from: sq, to, piece, color: turn, captured: target, promotion: null })
        break
      }
      nf += df; nr += dr
    }
  }
}

function addStepMoves(state, sq, deltas, moves) {
  const { board, turn } = state
  const f = fileOf(sq), r = rankOf(sq)
  const piece = board[sq]
  for (const [df, dr] of deltas) {
    const nf = f + df, nr = r + dr
    if (!inBounds(nf, nr)) continue
    const to = sqOf(nf, nr)
    const target = board[to]
    if (!target || colorOf(target) !== turn) {
      moves.push({ from: sq, to, piece, color: turn, captured: target || null, promotion: null })
    }
  }
}

function addCastleMoves(state, moves) {
  const { board, turn, castling } = state
  const white = turn === 'w'
  const oppo = white ? 'b' : 'w'
  const rank = white ? 0 : 7
  const kingSq = sqOf(4, rank)
  if (board[kingSq] !== (white ? 'K' : 'k')) return
  if (isSquareAttacked(board, kingSq, oppo)) return // can't castle out of check

  const canK = white ? castling.wk : castling.bk
  const canQ = white ? castling.wq : castling.bq

  if (canK) {
    const f1 = sqOf(5, rank), f2 = sqOf(6, rank), rookSq = sqOf(7, rank)
    if (!board[f1] && !board[f2] && board[rookSq] === (white ? 'R' : 'r') &&
        !isSquareAttacked(board, f1, oppo) && !isSquareAttacked(board, f2, oppo)) {
      moves.push({ from: kingSq, to: f2, piece: board[kingSq], color: turn, captured: null, promotion: null, castle: 'K' })
    }
  }
  if (canQ) {
    const d1 = sqOf(3, rank), d2 = sqOf(2, rank), d3 = sqOf(1, rank), rookSq = sqOf(0, rank)
    if (!board[d1] && !board[d2] && !board[d3] && board[rookSq] === (white ? 'R' : 'r') &&
        !isSquareAttacked(board, d1, oppo) && !isSquareAttacked(board, d2, oppo)) {
      moves.push({ from: kingSq, to: d2, piece: board[kingSq], color: turn, captured: null, promotion: null, castle: 'Q' })
    }
  }
}

export function generatePseudoMoves(state) {
  const { board, turn } = state
  const moves = []
  for (let sq = 0; sq < 64; sq++) {
    const p = board[sq]
    if (!p || colorOf(p) !== turn) continue
    const upper = p.toUpperCase()
    if (upper === 'P') addPawnMoves(state, sq, moves)
    else if (upper === 'N') addStepMoves(state, sq, KNIGHT_D, moves)
    else if (upper === 'B') addSliderMoves(state, sq, BISHOP_D, moves)
    else if (upper === 'R') addSliderMoves(state, sq, ROOK_D, moves)
    else if (upper === 'Q') addSliderMoves(state, sq, [...BISHOP_D, ...ROOK_D], moves)
    else if (upper === 'K') addStepMoves(state, sq, KING_D, moves)
  }
  addCastleMoves(state, moves)
  return moves
}

// Apply a move, returning a brand new state. Does not validate legality.
export function makeMove(state, move) {
  const s = cloneState(state)
  const { board } = s
  const white = move.color === 'w'

  if (move.ep) board[move.epCapSq] = null
  board[move.to] = move.promotion ? move.promotion : move.piece
  board[move.from] = null

  if (move.castle === 'K') {
    const rank = white ? 0 : 7
    board[sqOf(5, rank)] = board[sqOf(7, rank)]
    board[sqOf(7, rank)] = null
  } else if (move.castle === 'Q') {
    const rank = white ? 0 : 7
    board[sqOf(3, rank)] = board[sqOf(0, rank)]
    board[sqOf(0, rank)] = null
  }

  // castling rights
  const upper = move.piece.toUpperCase()
  if (upper === 'K') {
    if (white) { s.castling.wk = false; s.castling.wq = false }
    else { s.castling.bk = false; s.castling.bq = false }
  }
  if (move.from === sqOf(0, 0) || move.to === sqOf(0, 0)) s.castling.wq = false
  if (move.from === sqOf(7, 0) || move.to === sqOf(7, 0)) s.castling.wk = false
  if (move.from === sqOf(0, 7) || move.to === sqOf(0, 7)) s.castling.bq = false
  if (move.from === sqOf(7, 7) || move.to === sqOf(7, 7)) s.castling.bk = false

  // en passant target
  s.ep = move.doubleStep ? (move.from + move.to) / 2 : null

  // halfmove clock
  if (upper === 'P' || move.captured) s.halfmove = 0
  else s.halfmove = state.halfmove + 1

  if (!white) s.fullmove = state.fullmove + 1
  s.turn = white ? 'b' : 'w'
  return s
}

export function generateLegalMoves(state) {
  const pseudo = generatePseudoMoves(state)
  const legal = []
  for (const m of pseudo) {
    const next = makeMove(state, m)
    if (!isInCheck(next, state.turn)) legal.push(m)
  }
  return legal
}

export function gameStatus(state, legalMoves = null) {
  const moves = legalMoves ?? generateLegalMoves(state)
  const inCheck = isInCheck(state, state.turn)
  if (moves.length === 0) {
    return inCheck ? { over: true, result: state.turn === 'w' ? 'black' : 'white', reason: 'checkmate' }
                    : { over: true, result: 'draw', reason: 'stalemate' }
  }
  if (state.halfmove >= 100) return { over: true, result: 'draw', reason: 'fifty-move' }
  if (insufficientMaterial(state.board)) return { over: true, result: 'draw', reason: 'insufficient-material' }
  return { over: false, inCheck }
}

export function insufficientMaterial(board) {
  const pieces = board.filter(Boolean)
  if (pieces.length > 4) return false
  const nonKing = pieces.filter(p => p.toUpperCase() !== 'K')
  if (nonKing.length === 0) return true // K vs K
  if (nonKing.length === 1 && ['B', 'N'].includes(nonKing[0].toUpperCase())) return true // K+minor vs K
  if (nonKing.length === 2 && nonKing.every(p => p.toUpperCase() === 'B')) {
    // K+B vs K+B, same-color bishops only
    const bishopSquares = []
    for (let i = 0; i < 64; i++) if (board[i] && board[i].toUpperCase() === 'B') bishopSquares.push(i)
    if (bishopSquares.length === 2) {
      const c0 = (fileOf(bishopSquares[0]) + rankOf(bishopSquares[0])) % 2
      const c1 = (fileOf(bishopSquares[1]) + rankOf(bishopSquares[1])) % 2
      if (c0 === c1) return true
    }
  }
  return false
}

// Position key for threefold repetition: board + turn + castling rights + ep file.
export function positionKey(state) {
  const b = state.board.map(p => p || '.').join('')
  const c = state.castling
  const ep = state.ep === null ? '-' : FILES[fileOf(state.ep)]
  return `${b}|${state.turn}|${c.wk ? 'K' : ''}${c.wq ? 'Q' : ''}${c.bk ? 'k' : ''}${c.bq ? 'q' : ''}|${ep}`
}

// FEN export, useful for debugging/tests.
export function toFEN(state) {
  let rows = []
  for (let r = 7; r >= 0; r--) {
    let row = '', empty = 0
    for (let f = 0; f < 8; f++) {
      const p = state.board[sqOf(f, r)]
      if (!p) { empty++; continue }
      if (empty) { row += empty; empty = 0 }
      row += p
    }
    if (empty) row += empty
    rows.push(row)
  }
  const board = rows.join('/')
  const c = state.castling
  let castle = `${c.wk ? 'K' : ''}${c.wq ? 'Q' : ''}${c.bk ? 'k' : ''}${c.bq ? 'q' : ''}` || '-'
  const ep = state.ep === null ? '-' : algebraic(state.ep)
  return `${board} ${state.turn} ${castle} ${ep} ${state.halfmove} ${state.fullmove}`
}

export function fromFEN(fen) {
  const [board, turn, castle, ep, halfmove, fullmove] = fen.trim().split(/\s+/)
  const rows = board.split('/')
  const arr = new Array(64).fill(null)
  for (let i = 0; i < 8; i++) {
    const r = 7 - i
    let f = 0
    for (const ch of rows[i]) {
      if (/\d/.test(ch)) f += parseInt(ch, 10)
      else { arr[sqOf(f, r)] = ch; f++ }
    }
  }
  return {
    board: arr,
    turn,
    castling: { wk: castle.includes('K'), wq: castle.includes('Q'), bk: castle.includes('k'), bq: castle.includes('q') },
    ep: ep === '-' ? null : fromAlgebraic(ep),
    halfmove: parseInt(halfmove ?? '0', 10),
    fullmove: parseInt(fullmove ?? '1', 10),
  }
}

// Move notation helper (UCI-style: e2e4, e7e8q)
export function moveToUCI(m) {
  return algebraic(m.from) + algebraic(m.to) + (m.promotion ? m.promotion.toLowerCase() : '')
}

export function findLegalMoveByUCI(state, uci) {
  const from = fromAlgebraic(uci.slice(0, 2))
  const to = fromAlgebraic(uci.slice(2, 4))
  const promo = uci.length > 4 ? uci[4] : null
  const legal = generateLegalMoves(state)
  return legal.find(m => m.from === from && m.to === to &&
    (promo ? m.promotion && m.promotion.toLowerCase() === promo : !m.promotion)) || null
}

export function perft(state, depth) {
  if (depth === 0) return 1
  const moves = generateLegalMoves(state)
  if (depth === 1) return moves.length
  let nodes = 0
  for (const m of moves) nodes += perft(makeMove(state, m), depth - 1)
  return nodes
}

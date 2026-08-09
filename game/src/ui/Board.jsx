import { useRef, useState, useCallback } from 'react'
import { fileOf, rankOf, findKing, isInCheck } from '../game/chess.js'
import { PIECE_PALETTES } from '../game/levels.js'

const GLYPH = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
}

export default function Board({ chessState, skin, pieceSet, selected, legalTargets, lastMove, hintMove, onTapSquare, disabled }) {
  const boardRef = useRef(null)
  const [drag, setDrag] = useState(null) // { sq, x, y, piece }

  const checkSq = isInCheck(chessState, chessState.turn) ? findKing(chessState.board, chessState.turn) : -1

  const palette = pieceSet && pieceSet !== 'classic' ? PIECE_PALETTES[pieceSet] : null
  const pieceStyle = {
    '--pw-fill': palette ? palette.whiteFill : skin.pieceWhiteFill,
    '--pw-stroke': palette ? palette.whiteStroke : skin.pieceWhiteStroke,
    '--pb-fill': palette ? palette.blackFill : skin.pieceBlackFill,
    '--pb-stroke': palette ? palette.blackStroke : skin.pieceBlackStroke,
    '--p-glow': palette ? palette.glow : skin.glow,
  }

  const squareEl = useCallback(sq => {
    if (!boardRef.current) return null
    return boardRef.current.querySelector(`[data-sq="${sq}"]`)
  }, [])

  function handlePointerDown(sq, e) {
    if (disabled) return
    const piece = chessState.board[sq]
    onTapSquare(sq)
    if (piece && piece === piece.toUpperCase() && chessState.turn === 'w') {
      e.preventDefault()
      const rect = boardRef.current.getBoundingClientRect()
      setDrag({ sq, x: e.clientX - rect.left, y: e.clientY - rect.top, piece })
      const move = ev => {
        const r = boardRef.current.getBoundingClientRect()
        setDrag(d => d && { ...d, x: ev.clientX - r.left, y: ev.clientY - r.top })
      }
      const up = ev => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
        setDrag(null)
        const el = document.elementFromPoint(ev.clientX, ev.clientY)
        const dropEl = el && el.closest('[data-sq]')
        if (dropEl) {
          const dropSq = parseInt(dropEl.getAttribute('data-sq'), 10)
          if (dropSq !== sq) onTapSquare(dropSq)
        }
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
    }
  }

  const rows = []
  for (let r = 7; r >= 0; r--) {
    const cells = []
    for (let f = 0; f < 8; f++) {
      const sq = r * 8 + f
      const piece = chessState.board[sq]
      const isLight = (f + r) % 2 === 1
      const isSelected = selected === sq
      const isTarget = legalTargets.includes(sq)
      const isLast = lastMove && (lastMove.from === sq || lastMove.to === sq)
      const isHint = hintMove && (hintMove.from === sq || hintMove.to === sq)
      const isCheck = sq === checkSq
      const isDraggingThis = drag && drag.sq === sq
      const showRank = f === 0
      const showFile = r === 0
      cells.push(
        <div
          key={sq}
          data-sq={sq}
          className={
            'sq' + (isLight ? ' sq-light' : ' sq-dark') +
            (isSelected ? ' sq-selected' : '') +
            (isLast ? ' sq-last' : '') +
            (isHint ? ' sq-hint' : '') +
            (isCheck ? ' sq-check' : '')
          }
          onPointerDown={e => handlePointerDown(sq, e)}
        >
          {isTarget && <div className={piece ? 'dot dot-capture' : 'dot'} />}
          {showRank && <span className="coord coord-rank">{r + 1}</span>}
          {showFile && <span className="coord coord-file">{'abcdefgh'[f]}</span>}
          {piece && !isDraggingThis && (
            <span className={'piece ' + (piece === piece.toUpperCase() ? 'piece-w' : 'piece-b')}>{GLYPH[piece]}</span>
          )}
        </div>,
      )
    }
    rows.push(<div className="board-row" key={r}>{cells}</div>)
  }

  return (
    <div
      className="board-wrap"
      ref={boardRef}
      style={{ '--sq-light': skin.light, '--sq-dark': skin.dark, '--board-border': skin.border, ...pieceStyle }}
    >
      <div className="board-frame" style={{ background: skin.frame, boxShadow: skin.boardShadow }}>
        <div className="board-grid">{rows}</div>
      </div>
      {drag && (
        <span
          className={'piece piece-drag ' + (drag.piece === drag.piece.toUpperCase() ? 'piece-w' : 'piece-b')}
          style={{ left: drag.x, top: drag.y }}
        >
          {GLYPH[drag.piece]}
        </span>
      )}
    </div>
  )
}

const GLYPH = { Q: '♕', R: '♖', B: '♗', N: '♘' }
const NAMES = { Q: 'Queen', R: 'Rook', B: 'Bishop', N: 'Knight' }

export default function PromotionModal({ onPick, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="promo-card" onClick={e => e.stopPropagation()}>
        <div className="promo-title">PROMOTE PAWN</div>
        <div className="promo-row">
          {['Q', 'R', 'B', 'N'].map(p => (
            <button key={p} className="promo-btn" onClick={() => onPick(p)}>
              <span className="promo-glyph">{GLYPH[p]}</span>
              <span className="promo-label">{NAMES[p]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

import { HeartbeatIcon, PlayAdIcon } from './icons.jsx'

export default function ReviveModal({ mandatory, free, onAccept, onDecline }) {
  return (
    <div className="modal-overlay">
      <div className="revive-card">
        <div className="revive-icon-wrap"><HeartbeatIcon size={54} /></div>
        <div className="revive-title">TAKE IT BACK?</div>
        <div className="revive-sub">
          {mandatory
            ? "That's checkmate. Undo your last move and the reply to keep fighting?"
            : 'That move just cost you big. Undo it and the AI reply?'}
        </div>
        <button className="revive-btn revive-btn-accept" onClick={onAccept}>
          {!free && <span className="rs-adchip"><PlayAdIcon size={14} /> AD</span>}
          {free ? 'TAKE IT BACK — FREE' : 'WATCH AD & TAKE IT BACK'}
        </button>
        <button className="revive-btn revive-btn-decline" onClick={onDecline}>
          {mandatory ? 'ACCEPT DEFEAT' : 'NO, KEEP PLAYING'}
        </button>
      </div>
    </div>
  )
}

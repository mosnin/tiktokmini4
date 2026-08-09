import { useEffect, useState } from 'react'
import { PlayAdIcon } from './icons.jsx'

const LABELS = {
  revive: 'REVIVE AD',
  hint: 'HINT AD',
  spin: 'BONUS SPIN AD',
  interstitial: 'ADVERTISEMENT',
  cosmetic: 'UNLOCK AD',
}

export default function AdModal({ kind, onClose }) {
  const [pct, setPct] = useState(0)
  const [done, setDone] = useState(false)
  const DURATION = 3000

  useEffect(() => {
    const t0 = performance.now()
    let raf
    const tick = now => {
      const t = Math.min(1, (now - t0) / DURATION)
      setPct(Math.round(t * 100))
      if (t < 1) raf = requestAnimationFrame(tick)
      else setDone(true)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="modal-overlay ad-overlay">
      <div className="ad-card">
        <div className="ad-badge"><PlayAdIcon size={22} /> {LABELS[kind] || 'ADVERTISEMENT'}</div>
        <div className="ad-fake-screen">
          <div className="ad-fake-logo">CHECKMATE<br />CLIMB</div>
          <div className="ad-fake-sub">this space intentionally fake</div>
        </div>
        <div className="ad-bar-track">
          <div className="ad-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        {!done
          ? <div className="ad-wait">Loading reward{'.'.repeat(1 + Math.floor(pct / 34))}</div>
          : <button className="ad-claim-btn" onClick={() => onClose(true)}>CLAIM REWARD</button>}
      </div>
    </div>
  )
}

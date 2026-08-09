import { useEffect, useRef, useState } from 'react'
import { CrownIcon } from './icons.jsx'
import './title.css'

// CHECKMATE CLIMB boot flow: loading modal -> title logo + PLAY button.
export default function TitleScreen({ onPlay }) {
  const [phase, setPhase] = useState('loading')
  const [pct, setPct] = useState(0)
  const [loaderFading, setLoaderFading] = useState(false)
  const [pressed, setPressed] = useState(false)
  const [flash, setFlash] = useState(false)
  const [overlayOut, setOverlayOut] = useState(false)

  const rafRef = useRef(null)
  const timersRef = useRef([])
  const playedRef = useRef(false)
  const reducedMotionRef = useRef(false)

  useEffect(() => {
    reducedMotionRef.current = typeof window !== 'undefined' && window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const addTimer = (fn, ms) => { const id = setTimeout(fn, ms); timersRef.current.push(id); return id }

    if (reducedMotionRef.current) {
      setPct(100); setPhase('title')
      return () => { timersRef.current.forEach(clearTimeout); timersRef.current = [] }
    }

    const FILL_MS = 1100, FADE_MS = 300
    const start = performance.now()
    function tick(now) {
      const t = Math.min(1, (now - start) / FILL_MS)
      setPct(Math.round((1 - Math.pow(1 - t, 3)) * 100))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    addTimer(() => setLoaderFading(true), FILL_MS)
    addTimer(() => setPhase('title'), FILL_MS + FADE_MS)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      timersRef.current.forEach(clearTimeout); timersRef.current = []
    }
  }, [])

  function handlePlay() {
    if (playedRef.current) return
    playedRef.current = true
    if (reducedMotionRef.current) { onPlay && onPlay(); setOverlayOut(true); return }
    setFlash(true)
    const t1 = setTimeout(() => { setFlash(false); onPlay && onPlay(); setOverlayOut(true) }, 150)
    timersRef.current.push(t1)
  }

  return (
    <div className="ts-root">
      {phase === 'loading' && (
        <div className={`ts-loader${loaderFading ? ' ts-loader-out' : ''}`}>
          <div className="ts-loader-panel">
            <div className="ts-loading-label">LOADING…</div>
            <div className="ts-bar-track">
              <div className="ts-bar-fill" style={{ width: `${pct}%` }} />
              <div className="ts-bar-pct">{pct}%</div>
            </div>
          </div>
        </div>
      )}

      {phase === 'title' && (
        <div className={`ts-title-overlay${overlayOut ? ' ts-title-overlay-out' : ''}`}>
          <div className="ts-logo-block">
            <div className="ts-crown"><CrownIcon size={54} /></div>
            <div className="ts-logo">
              <div className="ts-logo-line ts-logo-check">CHECKMATE</div>
              <div className="ts-logo-line ts-logo-climb">CLIMB</div>
            </div>
            <div className="ts-banner"><span>24 LEVELS &bull; 6 BOARD STYLES &bull; 1 CROWN</span></div>
          </div>

          <div className="ts-play-wrap">
            <button
              type="button"
              className={`ts-play-btn${pressed ? ' ts-play-btn-pressed' : ''}`}
              onPointerDown={() => setPressed(true)}
              onPointerUp={() => setPressed(false)}
              onPointerLeave={() => setPressed(false)}
              onClick={handlePlay}
            >
              PLAY
            </button>
          </div>

          {flash && <div className="ts-flash" />}
        </div>
      )}
    </div>
  )
}

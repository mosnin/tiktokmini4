import { useEffect, useRef, useState } from 'react'
import { useGame } from '../store.js'
import { fmtMoney } from '../consts.js'
import { sfx } from '../audio.js'
import { CoinIcon, PlayAdIcon, StarIcon, TrophyIcon } from './icons.jsx'
import './results.css'

const CONFETTI_COLORS = ['#ffd76e', '#f5a623', '#4ade60', '#ff7a7a', '#6ec6ff', '#ffffff']

function useCountUp(to, from = 0, duration = 900) {
  const [display, setDisplay] = useState(from)
  const rafRef = useRef(0)
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setDisplay(to); return }
    const t0 = performance.now()
    let lastTick = 0, i = 0
    cancelAnimationFrame(rafRef.current)
    const stepFn = now => {
      const t = Math.min((now - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.floor(from + (to - from) * eased))
      if (now - lastTick > 50 && t < 1) { sfx.counterTick?.(i++); lastTick = now }
      if (t < 1) rafRef.current = requestAnimationFrame(stepFn)
      else sfx.counterDone?.()
    }
    rafRef.current = requestAnimationFrame(stepFn)
    return () => cancelAnimationFrame(rafRef.current)
  }, [to, from, duration])
  return display
}

const WEDGES = [1.2, 2, 1.5, 3, 1.5, 5]
const WEDGE_COLORS = ['#5b8def', '#22b53c', '#f5a623', '#e8402f', '#f5a623', '#8b5cf6']
function pickWedge() {
  const r = Math.random()
  if (r < 0.28) return 1
  if (r < 0.55) return 2
  if (r < 0.72) return 4
  if (r < 0.86) return 0
  if (r < 0.95) return 3
  return 5
}

function Wheel({ onClaim, onSkip }) {
  const [angle, setAngle] = useState(0)
  const [landed, setLanded] = useState(null)
  const target = useRef(pickWedge())
  const rafRef = useRef(0)

  useEffect(() => {
    const wedge = target.current
    const final = 360 * 5 + (360 - (wedge * 60 + 30))
    const dur = 4200
    const t0 = performance.now()
    let lastWedgePass = -1
    const stepFn = now => {
      const t = Math.min((now - t0) / dur, 1)
      const eased = 1 - Math.pow(1 - t, 4)
      const a = final * eased
      setAngle(a)
      const pass = Math.floor(a / 60)
      if (pass !== lastWedgePass) { lastWedgePass = pass; sfx.counterTick?.(pass % 8) }
      if (t < 1) rafRef.current = requestAnimationFrame(stepFn)
      else { setLanded(wedge); if (WEDGES[wedge] >= 3) sfx.jackpot?.(); else sfx.counterDone?.() }
    }
    rafRef.current = requestAnimationFrame(stepFn)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <div className="rs-wheel-overlay">
      <div className="rs-wheel-title">{landed !== null ? `x${WEDGES[landed]}!` : 'MULTIPLIER SPIN'}</div>
      <div className="rs-wheel-box">
        <div className="rs-wheel-pointer" />
        <div className="rs-wheel" style={{ transform: `rotate(${angle}deg)` }}>
          {WEDGES.map((w, i) => (
            <div key={i} className="rs-wedge" style={{ transform: `rotate(${i * 60 + 30}deg)` }}><b>x{w}</b></div>
          ))}
          <svg className="rs-wheel-bg" viewBox="0 0 200 200">
            {WEDGES.map((w, i) => {
              const a0 = (i * 60 - 90) * Math.PI / 180
              const a1 = ((i + 1) * 60 - 90) * Math.PI / 180
              const x0 = 100 + 96 * Math.cos(a0), y0 = 100 + 96 * Math.sin(a0)
              const x1 = 100 + 96 * Math.cos(a1), y1 = 100 + 96 * Math.sin(a1)
              return <path key={i} d={`M100,100 L${x0},${y0} A96,96 0 0 1 ${x1},${y1} Z`} fill={WEDGE_COLORS[i]} stroke="#fff" strokeWidth="2.5" />
            })}
            <circle cx="100" cy="100" r="97" fill="none" stroke="#ffd76e" strokeWidth="6" />
            <circle cx="100" cy="100" r="16" fill="#fff" stroke="#e0a416" strokeWidth="4" />
          </svg>
        </div>
      </div>
      {landed !== null && (
        <div className="rs-wheel-actions">
          <button className="rs-btn rs-btn-claim" onClick={() => onClaim(WEDGES[landed])}>
            <span className="rs-adchip"><PlayAdIcon size={15} /> AD</span>CLAIM x{WEDGES[landed]}
          </button>
          <button className="rs-skip" onClick={onSkip}>No thanks</button>
        </div>
      )}
    </div>
  )
}

export default function ResultsScreen() {
  const results = useGame(s => s.lastResults)
  const continueFromResults = useGame(s => s.continueFromResults)
  const startLevel = useGame(s => s.startLevel)
  const claimWheel = useGame(s => s.claimWheel)
  const collect = useGame(s => s.collect)
  const money = useGame(s => s.money)
  const [showWheel, setShowWheel] = useState(false)
  const [collecting, setCollecting] = useState(false)
  const flyRef = useRef(null)
  const pillRef = useRef(null)

  const { level, result, stars = 0, payout = 0, wheelMult, collected } = results ?? {}
  const isWin = result === 'win'
  const isDraw = result === 'draw'
  const bigWin = isWin && (stars >= 3 || (wheelMult ?? 1) >= 3)
  const title = isWin ? (stars >= 3 ? 'FLAWLESS VICTORY!' : 'VICTORY!') : isDraw ? 'DRAW' : 'DEFEATED'

  const pot = Math.floor(payout * (wheelMult ?? 1))
  const shownEarned = useCountUp(pot, wheelMult ? payout : 0)

  const doCollect = () => {
    if (collecting || collected || !isWin) { if (!isWin) continueFromResults(); return }
    setCollecting(true)
    const host = flyRef.current
    const pill = pillRef.current
    if (host && pill) {
      const hr = host.getBoundingClientRect()
      const pr = pill.getBoundingClientRect()
      const startX = hr.width / 2, startY = 30
      const targetX = (pr.left + pr.width / 2) - hr.left
      const targetY = (pr.top + pr.height / 2) - hr.top
      const n = 8, gap = 100
      for (let i = 0; i < n; i++) {
        const el = document.createElement('span')
        el.className = 'rs-flycoin'
        const jx = (Math.random() - 0.5) * 90
        el.style.left = `${startX + jx}px`
        el.style.top = `${startY + (Math.random() - 0.5) * 26}px`
        host.appendChild(el)
        requestAnimationFrame(() => requestAnimationFrame(() => {
          el.style.transitionDelay = `${i * gap}ms`
          el.style.transform = `translate(${targetX - startX - jx}px, ${targetY - startY}px) scale(.45)`
          el.style.opacity = '0'
        }))
        setTimeout(() => {
          sfx.tickUp?.(6 + i * 2)
          pill.classList.remove('coins-hit'); void pill.offsetWidth; pill.classList.add('coins-hit')
        }, i * gap + 420)
      }
      setTimeout(() => { while (host.firstChild) host.removeChild(host.firstChild) }, n * gap + 800)
    }
    setTimeout(() => { collect() }, 420)
    setTimeout(() => { continueFromResults() }, 8 * 100 + 1000)
  }

  if (!results) return null

  return (
    <div className="rs-root">
      <div className="rs-dim" />
      {(bigWin) && (
        <div className="rs-confetti" aria-hidden="true">
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} className="rs-confetti-piece"
              style={{ left: `${(i * 7.3) % 100}%`, background: CONFETTI_COLORS[i % 6], animationDelay: `${(i % 7) * 0.16}s` }} />
          ))}
        </div>
      )}

      <div className="rs-coinpill" ref={pillRef}><CoinIcon size={16} />{fmtMoney(money)}</div>

      <div className="rs-content">
        {bigWin && <div className="rs-bigwin">BIG WIN!</div>}
        <h1 className={`rs-title${!isWin ? ' rs-title-bad' : ''}`}>{title}</h1>
        <div className="rs-sub">Level {level} {isWin ? 'cleared' : isDraw ? 'drawn' : 'lost'}</div>

        <div className="rs-medallion">
          <div className={'rs-sunburst' + (!isWin ? ' rs-sunburst-bad' : '')} />
          <div className={'rs-medallion-core' + (!isWin ? ' rs-medallion-core-bad' : '')}>
            <TrophyIcon size={78} style={!isWin ? { filter: 'grayscale(1) opacity(0.55)' } : undefined} />
          </div>
        </div>

        {isWin && (
          <div className="rs-starsrow">
            {[0, 1, 2].map(i => <StarIcon key={i} size={40} filled={i < stars} />)}
          </div>
        )}

        {isWin && (
          <div className="rs-coinblock" ref={flyRef}>
            <div className="rs-collected-tag">YOU EARNED</div>
            <div className="rs-earned">{fmtMoney(shownEarned)}</div>
          </div>
        )}
      </div>

      <div className="rs-buttons">
        {isWin && !wheelMult && !collected && (
          <button className="rs-btn rs-btn-spin" onClick={() => { sfx.click?.(); setShowWheel(true) }}>
            <span className="rs-adchip"><PlayAdIcon size={15} /> AD</span>SPIN x5
          </button>
        )}
        {isWin
          ? <button className="rs-btn rs-btn-continue" onClick={doCollect} disabled={collecting}>{collecting ? '...' : 'COLLECT'}</button>
          : (
            <>
              <button className="rs-btn rs-btn-continue" onClick={() => startLevel(level)}>TRY AGAIN</button>
              <button className="rs-skip" onClick={continueFromResults}>Back to map</button>
            </>
          )}
      </div>

      {showWheel && (
        <Wheel onClaim={m => { setShowWheel(false); claimWheel(m) }} onSkip={() => { sfx.click?.(); setShowWheel(false) }} />
      )}
    </div>
  )
}

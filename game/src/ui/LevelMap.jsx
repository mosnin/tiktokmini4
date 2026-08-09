import { useEffect, useMemo, useRef } from 'react'
import { useGame } from '../store.js'
import { TOTAL_LEVELS, SKINS, skinForLevel, LEVEL_NAMES } from '../game/levels.js'
import { CoinIcon, LockIcon, StarIcon, HomeIcon } from './icons.jsx'
import { fmtMoney } from '../consts.js'
import { sfx } from '../audio.js'
import './levelmap.css'

const SPACING = 118
const AMPLITUDE = 30 // % offset from center — keep nodes well within the visible width

export default function LevelMap() {
  const unlockedLevel = useGame(s => s.unlockedLevel)
  const stars = useGame(s => s.stars)
  const money = useGame(s => s.money)
  const startLevel = useGame(s => s.startLevel)
  const goTitle = useGame(s => s.goTitle)
  const goCosmetics = useGame(s => s.goCosmetics)
  const scrollRef = useRef(null)

  const nodes = useMemo(() => {
    const arr = []
    for (let lvl = 1; lvl <= TOTAL_LEVELS; lvl++) {
      const idx = lvl - 1
      const left = 50 + Math.sin(idx * 0.85) * AMPLITUDE
      const top = 60 + idx * SPACING
      arr.push({ lvl, left, top })
    }
    return arr
  }, [])

  const totalHeight = 60 + (TOTAL_LEVELS - 1) * SPACING + 160

  useEffect(() => {
    // auto-scroll so the current frontier level is roughly centered on entry
    const el = scrollRef.current
    if (!el) return
    const target = nodes.find(n => n.lvl === unlockedLevel)
    if (target) {
      requestAnimationFrame(() => {
        el.scrollTop = Math.max(0, target.top - el.clientHeight * 0.55)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="lm-root">
      <div className="lm-topbar">
        <button className="lm-iconbtn" onClick={goTitle}><HomeIcon size={30} /></button>
        <div className="lm-title">CHECKMATE CLIMB</div>
        <div className="lm-coins"><CoinIcon size={18} />{fmtMoney(money)}</div>
      </div>
      <button className="lm-cosmetics-btn" onClick={goCosmetics}>PIECE SETS</button>

      <div className="lm-scroll" ref={scrollRef}>
        <div className="lm-path" style={{ height: totalHeight }}>
          <svg className="lm-line-svg" width="100%" height={totalHeight} viewBox={`0 0 100 ${totalHeight}`} preserveAspectRatio="none">
            <polyline
              points={nodes.map(n => `${n.left},${n.top}`).join(' ')}
              fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="0.4 4" vectorEffect="non-scaling-stroke"
            />
          </svg>

          {SKINS.map(skin => {
            const first = nodes[skin.range[0] - 1]
            return (
              <div key={skin.id} className="lm-era-label" style={{ top: first.top - 64 }}>
                <span style={{ background: skin.frame, borderColor: skin.border }}>{skin.name}</span>
              </div>
            )
          })}

          {nodes.map(n => {
            const locked = n.lvl > unlockedLevel
            const s = stars[n.lvl] ?? 0
            const isCurrent = n.lvl === unlockedLevel
            const skin = skinForLevel(n.lvl)
            return (
              <button
                key={n.lvl}
                className={'lm-node' + (locked ? ' lm-node-locked' : '') + (isCurrent ? ' lm-node-current' : '')}
                style={{ left: `${n.left}%`, top: n.top, background: locked ? '#3a4150' : skin.frame, borderColor: locked ? '#20242e' : skin.border }}
                onClick={() => (locked ? sfx.deny() : startLevel(n.lvl))}
              >
                {locked ? <LockIcon size={26} /> : <span className="lm-node-num">{n.lvl}</span>}
                {isCurrent && <span className="lm-node-ping" />}
                <div className="lm-stars">
                  {[0, 1, 2].map(i => <StarIcon key={i} size={13} filled={i < s} />)}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

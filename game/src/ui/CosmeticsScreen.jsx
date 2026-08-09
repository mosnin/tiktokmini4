import { useGame, PIECE_SETS } from '../store.js'
import { PIECE_PALETTES } from '../game/levels.js'
import { BackIcon, CoinIcon, PlayAdIcon, LockIcon } from './icons.jsx'
import { fmtMoney } from '../consts.js'
import './cosmetics.css'

const PREVIEW_SKIN = { light: '#eee', dark: '#999', pieceWhiteFill: '#fff', pieceWhiteStroke: '#333', pieceBlackFill: '#111', pieceBlackStroke: '#ccc', glow: 'none' }

function PiecePreview({ id }) {
  const pal = id !== 'classic' ? PIECE_PALETTES[id] : null
  const style = {
    '--pw-fill': pal ? pal.whiteFill : PREVIEW_SKIN.pieceWhiteFill,
    '--pw-stroke': pal ? pal.whiteStroke : PREVIEW_SKIN.pieceWhiteStroke,
    '--pb-fill': pal ? pal.blackFill : PREVIEW_SKIN.pieceBlackFill,
    '--pb-stroke': pal ? pal.blackStroke : PREVIEW_SKIN.pieceBlackStroke,
    '--p-glow': pal ? pal.glow : PREVIEW_SKIN.glow,
  }
  return (
    <div className="cs-preview" style={style}>
      <span className="piece piece-w">♔</span>
      <span className="piece piece-b">♞</span>
    </div>
  )
}

export default function CosmeticsScreen() {
  const goMap = useGame(s => s.goMap)
  const cosmeticsOwned = useGame(s => s.cosmeticsOwned)
  const cosmeticSelected = useGame(s => s.cosmeticSelected)
  const money = useGame(s => s.money)
  const selectCosmetic = useGame(s => s.selectCosmetic)

  return (
    <div className="cs-root">
      <div className="cs-topbar">
        <button className="cs-iconbtn" onClick={goMap}><BackIcon size={30} /></button>
        <div className="cs-title">PIECE SETS</div>
        <div className="cs-coins"><CoinIcon size={18} />{fmtMoney(money)}</div>
      </div>

      <div className="cs-grid">
        {PIECE_SETS.map(p => {
          const owned = cosmeticsOwned.includes(p.id)
          const selected = cosmeticSelected === p.id
          return (
            <button key={p.id} className={'cs-card' + (selected ? ' cs-card-selected' : '')} onClick={() => selectCosmetic(p.id)}>
              <PiecePreview id={p.id} />
              <div className="cs-name">{p.name}</div>
              {selected && <div className="cs-tag cs-tag-selected">EQUIPPED</div>}
              {!selected && owned && <div className="cs-tag">TAP TO EQUIP</div>}
              {!owned && p.unlock === 'ad' && <div className="cs-tag cs-tag-ad"><PlayAdIcon size={13} /> WATCH AD</div>}
              {!owned && p.unlock === 'money' && (
                <div className="cs-tag cs-tag-money">
                  {money < p.cost ? <LockIcon size={13} /> : <CoinIcon size={13} />} {fmtMoney(p.cost)}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

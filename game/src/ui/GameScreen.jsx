import { useMemo } from 'react'
import { useGame } from '../store.js'
import { skinForLevel, LEVEL_NAMES } from '../game/levels.js'
import { isInCheck } from '../game/chess.js'
import Board from './Board.jsx'
import PromotionModal from './PromotionModal.jsx'
import ReviveModal from './ReviveModal.jsx'
import { BackIcon, CoinIcon, LightbulbIcon, HeartbeatIcon } from './icons.jsx'
import { fmtMoney } from '../consts.js'
import './gamescreen.css'

export default function GameScreen() {
  const currentLevel = useGame(s => s.currentLevel)
  const chessState = useGame(s => s.chessState)
  const selected = useGame(s => s.selected)
  const legalForSelected = useGame(s => s.legalForSelected)
  const lastMove = useGame(s => s.lastMove)
  const hintMove = useGame(s => s.hintMove)
  const aiThinking = useGame(s => s.aiThinking)
  const promotionPending = useGame(s => s.promotionPending)
  const reviveOffer = useGame(s => s.reviveOffer)
  const gameOver = useGame(s => s.gameOver)
  const money = useGame(s => s.money)
  const cosmeticSelected = useGame(s => s.cosmeticSelected)
  const hintUsedThisGame = useGame(s => s.hintUsedThisGame)
  const reviveAvailableFree = useGame(s => s.reviveAvailableFree)

  const tapSquare = useGame(s => s.tapSquare)
  const resolvePromotion = useGame(s => s.resolvePromotion)
  const cancelPromotion = useGame(s => s.cancelPromotion)
  const acceptRevive = useGame(s => s.acceptRevive)
  const declineRevive = useGame(s => s.declineRevive)
  const requestHint = useGame(s => s.requestHint)
  const goMap = useGame(s => s.goMap)

  const skin = useMemo(() => skinForLevel(currentLevel), [currentLevel])
  const legalTargets = useMemo(() => legalForSelected.map(m => m.to), [legalForSelected])
  const inCheck = isInCheck(chessState, chessState.turn)
  const levelName = LEVEL_NAMES[currentLevel - 1] || `Level ${currentLevel}`

  let status = ''
  if (aiThinking) status = 'AI is thinking…'
  else if (inCheck) status = 'CHECK!'
  else if (chessState.turn === 'w') status = 'Your move'
  else status = "AI's move"

  return (
    <div className="gs-root" style={{ background: skin.bg }}>
      <div className="gs-topbar">
        <button className="gs-iconbtn" onClick={goMap}><BackIcon size={30} /></button>
        <div className="gs-level-chip">
          <span className="gs-level-num">LVL {currentLevel}</span>
          <span className="gs-level-name">{levelName}</span>
        </div>
        <div className="gs-coins"><CoinIcon size={18} />{fmtMoney(money)}</div>
      </div>

      <div className={'gs-status' + (inCheck ? ' gs-status-check' : '')}>{status}</div>

      <div className="gs-board-holder">
        <Board
          chessState={chessState}
          skin={skin}
          pieceSet={cosmeticSelected}
          selected={selected}
          legalTargets={legalTargets}
          lastMove={lastMove}
          hintMove={hintMove}
          onTapSquare={tapSquare}
          disabled={aiThinking || !!gameOver || !!reviveOffer || !!promotionPending}
        />
      </div>

      <div className="gs-bottombar">
        <button className="gs-action-btn" onClick={requestHint} disabled={aiThinking || !!gameOver}>
          <LightbulbIcon size={26} />
          <span>{hintUsedThisGame ? 'HINT (AD)' : 'HINT (FREE)'}</span>
        </button>
      </div>

      {promotionPending && <PromotionModal onPick={resolvePromotion} onCancel={cancelPromotion} />}
      {reviveOffer && (
        <ReviveModal
          mandatory={reviveOffer.mandatory}
          free={reviveAvailableFree()}
          onAccept={acceptRevive}
          onDecline={declineRevive}
        />
      )}
    </div>
  )
}

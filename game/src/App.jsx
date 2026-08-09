import { useEffect } from 'react'
import { useGame } from './store.js'
import { sfx, music } from './audio.js'
import { BUILD } from './consts.js'
import TitleScreen from './ui/TitleScreen.jsx'
import LevelMap from './ui/LevelMap.jsx'
import GameScreen from './ui/GameScreen.jsx'
import ResultsScreen from './ui/ResultsScreen.jsx'
import CosmeticsScreen from './ui/CosmeticsScreen.jsx'
import AdModal from './ui/AdModal.jsx'
import './ui/modals.css'
import './ui/board.css'

export default function App() {
  const screen = useGame(s => s.screen)
  const goMap = useGame(s => s.goMap)
  const adModal = useGame(s => s.adModal)
  const closeAd = useGame(s => s.closeAd)

  useEffect(() => {
    const boot = () => { sfx.unlock(); music.start() }
    window.addEventListener('pointerdown', boot, { once: true })
    return () => window.removeEventListener('pointerdown', boot)
  }, [])

  return (
    <>
      {screen === 'title' && <TitleScreen onPlay={goMap} />}
      {screen === 'map' && <LevelMap />}
      {screen === 'game' && <GameScreen />}
      {screen === 'results' && <ResultsScreen />}
      {screen === 'cosmetics' && <CosmeticsScreen />}
      {adModal && <AdModal kind={adModal.kind} onClose={granted => closeAd(granted)} />}
      <div className="build-tag">{BUILD}</div>
    </>
  )
}

// Level metadata: 24 levels grouped into 6 board-skin eras of 4 levels each.
import { LEVEL_NAMES } from './ai.js'

export const TOTAL_LEVELS = 24

export const SKINS = [
  {
    id: 'wood', name: 'Wood Classic', range: [1, 4],
    light: '#f0d9b5', dark: '#b58863', border: '#5a3a22', frame: 'linear-gradient(160deg,#8a5a34,#5c3a1e)',
    boardShadow: '0 18px 40px rgba(40,20,5,0.55)',
    accent: '#e0a84a',
    pieceWhiteFill: '#fbf6ea', pieceWhiteStroke: '#8a5a20', pieceBlackFill: '#2a1c10', pieceBlackStroke: '#e0c48a',
    glow: 'none',
    bg: 'radial-gradient(ellipse at 50% 0%, #4a3524 0%, #241a10 60%, #140d07 100%)',
  },
  {
    id: 'marble', name: 'Marble', range: [5, 8],
    light: '#eef0f2', dark: '#9aa3ad', border: '#5c6672', frame: 'linear-gradient(160deg,#c9ced4,#7c8590)',
    boardShadow: '0 18px 40px rgba(20,25,35,0.5)',
    accent: '#c9b37a',
    pieceWhiteFill: '#ffffff', pieceWhiteStroke: '#8890a0', pieceBlackFill: '#2b2f38', pieceBlackStroke: '#c7ccd3',
    glow: 'none',
    bg: 'radial-gradient(ellipse at 50% 0%, #45505c 0%, #262e38 60%, #14181d 100%)',
  },
  {
    id: 'neon', name: 'Neon Cyber', range: [9, 12],
    light: '#1c2333', dark: '#0c0f1a', border: '#00e5ff', frame: 'linear-gradient(160deg,#171c2b,#0a0d16)',
    boardShadow: '0 0 40px rgba(0,229,255,0.35), 0 18px 40px rgba(0,0,0,0.6)',
    accent: '#ff2ec4',
    pieceWhiteFill: '#eafcff', pieceWhiteStroke: '#00e5ff', pieceBlackFill: '#1a0c22', pieceBlackStroke: '#ff2ec4',
    glow: '0 0 8px currentColor',
    bg: 'radial-gradient(ellipse at 50% 0%, #1a1030 0%, #0c0a18 60%, #05040a 100%)',
  },
  {
    id: 'forest', name: 'Forest Stone', range: [13, 16],
    light: '#c9d2b0', dark: '#5f7350', border: '#33422a', frame: 'linear-gradient(160deg,#57654a,#33402a)',
    boardShadow: '0 18px 40px rgba(10,20,5,0.55)',
    accent: '#8fae5a',
    pieceWhiteFill: '#f3f5e6', pieceWhiteStroke: '#4c5c3a', pieceBlackFill: '#20260f', pieceBlackStroke: '#a9bd8a',
    glow: 'none',
    bg: 'radial-gradient(ellipse at 50% 0%, #2c3620 0%, #1a2013 60%, #0d1009 100%)',
  },
  {
    id: 'gold', name: 'Gold Luxury', range: [17, 20],
    light: '#f4e3ad', dark: '#1a1a1a', border: '#d4af37', frame: 'linear-gradient(160deg,#3a3020,#141210)',
    boardShadow: '0 0 32px rgba(212,175,55,0.3), 0 18px 40px rgba(0,0,0,0.6)',
    accent: '#ffd76e',
    pieceWhiteFill: '#fff6da', pieceWhiteStroke: '#a5791f', pieceBlackFill: '#0d0d0d', pieceBlackStroke: '#d4af37',
    glow: '0 0 6px rgba(212,175,55,0.6)',
    bg: 'radial-gradient(ellipse at 50% 0%, #2a2210 0%, #17130a 60%, #0a0805 100%)',
  },
  {
    id: 'space', name: 'Space Glass', range: [21, 24],
    light: 'rgba(160,180,255,0.28)', dark: 'rgba(30,20,70,0.55)', border: '#8a6bff', frame: 'linear-gradient(160deg,#241a4a,#100a26)',
    boardShadow: '0 0 46px rgba(138,107,255,0.4), 0 18px 40px rgba(0,0,0,0.65)',
    accent: '#8a6bff',
    pieceWhiteFill: '#eef1ff', pieceWhiteStroke: '#8a6bff', pieceBlackFill: '#0c0820', pieceBlackStroke: '#c9b8ff',
    glow: '0 0 10px rgba(138,107,255,0.65)',
    bg: 'radial-gradient(ellipse at 50% 10%, #1c1440 0%, #0d0a24 55%, #050311 100%)',
  },
]

export function skinForLevel(level) {
  return SKINS.find(s => level >= s.range[0] && level <= s.range[1]) || SKINS[0]
}

// Payout: base scales with level tier, multiplied by stars earned (1..3).
export function levelPayout(level, stars) {
  const base = 40 + level * 18
  return Math.round(base * stars)
}

// Cosmetic piece-set palettes — override the active skin's piece colors.
export const PIECE_PALETTES = {
  shadow: { whiteFill: '#cfd6e6', whiteStroke: '#1a1f2b', blackFill: '#05070c', blackStroke: '#66738f', glow: '0 0 6px rgba(0,0,0,0.6)' },
  royal: { whiteFill: '#fff3d0', whiteStroke: '#7a4a0e', blackFill: '#2a0e3d', blackStroke: '#ffd23f', glow: '0 0 8px rgba(255,210,63,0.55)' },
  crystal: { whiteFill: '#eafcff', whiteStroke: '#1f7a9c', blackFill: '#0a1f2b', blackStroke: '#7fdfff', glow: '0 0 10px rgba(127,223,255,0.6)' },
  obsidian: { whiteFill: '#f5e6e6', whiteStroke: '#3a0d0d', blackFill: '#0a0505', blackStroke: '#ff3b3b', glow: '0 0 10px rgba(255,59,59,0.55)' },
}

export { LEVEL_NAMES }

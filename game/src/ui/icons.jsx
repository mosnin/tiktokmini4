/**
 * Hand-drawn cartoon SVG icon set.
 * Bold dark outlines, warm saturated two-tone fills, rounded joins.
 * Every icon: viewBox 0 0 24 24, accepts { size = 24, ...props }.
 */
import React from 'react'

export function CoinIcon({ size = 24, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" {...props}>
      <circle cx="12" cy="12" r="9" fill="#f7b820" stroke="#7a4a0e" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="12" cy="12" r="6.6" fill="none" stroke="#e09a10" strokeWidth="1.2" />
      <path d="M7 8.4C8.2 5.9 10 4.6 12 4.6C13.1 4.6 14.2 5 15.1 5.6C13.5 5.1 11.3 5.4 9.7 6.8C8.6 7.7 7.9 9 7.5 10.2C7.1 9.6 6.9 9 7 8.4Z" fill="#ffe066" opacity="0.9" />
      <path d="M12 6.4V17.6" stroke="#7a4a0e" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M14.6 8.7C14.3 7.6 13.2 7 12 7C10.6 7 9.3 7.7 9.3 8.9C9.3 11.6 14.7 10.4 14.7 13.1C14.7 14.3 13.4 15 12 15C10.7 15 9.6 14.5 9.2 13.3" fill="none" stroke="#7a4a0e" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PlayAdIcon({ size = 24, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" {...props}>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="#3a3f4a" stroke="#20232b" strokeWidth="1.6" strokeLinejoin="round" />
      <rect x="4" y="4" width="16" height="4.5" rx="2.2" fill="#ffffff" opacity="0.08" />
      <path d="M9.3 7.8L16.2 12L9.3 16.2Z" fill="#ffffff" stroke="#ffffff" strokeWidth="1.1" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export function LockIcon({ size = 24, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" {...props}>
      <path d="M8 10V7.5C8 5 9.8 3 12 3C14.2 3 16 5 16 7.5V10" fill="none" stroke="#7c8a99" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="5" y="10" width="14" height="10" rx="3" fill="#8a97a6" stroke="#3f4a56" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M6 11.3C6.5 10.6 8 10.1 9.5 10.1C8 10.7 7 11.4 6.8 12.4C6.4 12 6.1 11.6 6 11.3Z" fill="#c9d3db" opacity="0.9" />
      <circle cx="12" cy="14.3" r="1.4" fill="#3f4a56" />
      <rect x="11.3" y="15" width="1.4" height="2.6" rx="0.5" fill="#3f4a56" />
    </svg>
  )
}

export function StarIcon({ size = 24, filled = true, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" {...props}>
      <path d="M12 2.6L14.9 8.6L21.5 9.5L16.7 14.1L17.9 20.7L12 17.5L6.1 20.7L7.3 14.1L2.5 9.5L9.1 8.6Z"
        fill={filled ? '#ffd23f' : '#3a4150'} stroke={filled ? '#a5710e' : '#232833'} strokeWidth="1.6" strokeLinejoin="round" />
      {filled && <path d="M12 4.8L13.9 9.1L18 9.7L15 12.6L15.7 16.9L12 14.9Z" fill="#fff2b0" opacity="0.55" />}
    </svg>
  )
}

export function LightbulbIcon({ size = 24, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" {...props}>
      <path d="M12 3C8.7 3 6.2 5.5 6.2 8.6C6.2 10.6 7.2 12 8.4 13.1C9 13.6 9.3 14.2 9.3 14.9V15.6H14.7V14.9C14.7 14.2 15 13.6 15.6 13.1C16.8 12 17.8 10.6 17.8 8.6C17.8 5.5 15.3 3 12 3Z"
        fill="#ffe066" stroke="#a5710e" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M8.6 8.2C8.9 6.6 10.2 5.4 12 5.3C10.6 5.8 9.7 6.8 9.4 8.2C9.2 9 9.2 9.7 9.4 10.3C9 9.7 8.5 9 8.6 8.2Z" fill="#fff6c9" opacity="0.9" />
      <rect x="9.3" y="16.4" width="5.4" height="1.6" rx="0.6" fill="#c9925a" stroke="#7a5230" strokeWidth="1" />
      <rect x="9.6" y="18.2" width="4.8" height="1.6" rx="0.6" fill="#a9702f" stroke="#7a5230" strokeWidth="1" />
      <path d="M10.4 20H13.6" stroke="#7a5230" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function HeartbeatIcon({ size = 24, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" {...props}>
      <path d="M12 20.5C6 16.5 2.5 13 2.5 9C2.5 6 4.8 4 7.4 4C9 4 10.6 4.9 12 6.6C13.4 4.9 15 4 16.6 4C19.2 4 21.5 6 21.5 9C21.5 13 18 16.5 12 20.5Z"
        fill="#ff5a6b" stroke="#8a1f2b" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M4.5 10.5H8L9.5 7.5L11.5 13.5L13 10.5H19.5" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function TrophyIcon({ size = 24, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" {...props}>
      <path d="M7 6C4 6 4 10 7.3 10.5" fill="none" stroke="#7a4a0e" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17 6C20 6 20 10 16.7 10.5" fill="none" stroke="#7a4a0e" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 4H17L16.3 11C16 13.5 14.3 15 12 15C9.7 15 8 13.5 7.7 11Z" fill="#f7b820" stroke="#7a4a0e" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8.5 5.5C8 7.5 8.2 9.5 9.3 11C8 10 7.3 8 7.6 6C7.8 5.2 8.2 5 8.5 5.5Z" fill="#ffe066" opacity="0.9" />
      <rect x="11" y="15" width="2" height="3" fill="#e09a10" stroke="#7a4a0e" strokeWidth="1.3" />
      <path d="M8.5 20L9 18H15L15.5 20Z" fill="#e09a10" stroke="#7a4a0e" strokeWidth="1.6" strokeLinejoin="round" />
      <rect x="8" y="19.6" width="8" height="1.4" rx="0.7" fill="#c98a10" stroke="#7a4a0e" strokeWidth="1.2" />
    </svg>
  )
}

export function HomeIcon({ size = 24, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" {...props}>
      <path d="M3 11L12 4L21 11L18.5 11L12 6.3L5.5 11Z" fill="#a9432f" stroke="#5a2416" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M5.5 11L12 6.3L9.5 8L6.5 10.5Z" fill="#d97456" opacity="0.85" />
      <rect x="5.5" y="11" width="13" height="9" fill="#d9b06a" stroke="#6b4420" strokeWidth="1.7" strokeLinejoin="round" />
      <rect x="10.3" y="14.5" width="3.4" height="5.5" rx="0.6" fill="#6b4420" stroke="#4a2f14" strokeWidth="1.3" />
    </svg>
  )
}

export function BackIcon({ size = 24, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" {...props}>
      <circle cx="12" cy="12" r="10" fill="#3a3f4a" stroke="#20232b" strokeWidth="1.5" />
      <path d="M14 7L9 12L14 17" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CrownIcon({ size = 24, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" {...props}>
      <path d="M3 18L4.5 8L9 12L12 5L15 12L19.5 8L21 18Z" fill="#ffd23f" stroke="#8a5709" strokeWidth="1.7" strokeLinejoin="round" />
      <rect x="3" y="18" width="18" height="2.6" rx="1" fill="#e0a416" stroke="#8a5709" strokeWidth="1.4" />
      <circle cx="4.5" cy="8" r="1.4" fill="#ff5a6b" stroke="#8a1f2b" strokeWidth="1" />
      <circle cx="12" cy="5" r="1.4" fill="#5fa8d3" stroke="#1f4f80" strokeWidth="1" />
      <circle cx="19.5" cy="8" r="1.4" fill="#4ade60" stroke="#186b2e" strokeWidth="1" />
    </svg>
  )
}

export function CheckIcon({ size = 24, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" {...props}>
      <circle cx="12" cy="12" r="10" fill="#4ade60" stroke="#186b2e" strokeWidth="1.6" />
      <path d="M7 12.5L10.3 15.8L17 8.5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export const ICONS = {
  coin: CoinIcon,
  playAd: PlayAdIcon,
  lock: LockIcon,
  star: StarIcon,
  lightbulb: LightbulbIcon,
  heartbeat: HeartbeatIcon,
  trophy: TrophyIcon,
  home: HomeIcon,
  back: BackIcon,
  crown: CrownIcon,
  check: CheckIcon,
}

export default ICONS

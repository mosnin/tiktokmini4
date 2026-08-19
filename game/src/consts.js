// Shared small helpers.

function trimNum(n) {
  return n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)
}
export const fmt = n => n >= 1e6 ? trimNum(n / 1e6) + 'M'
  : n >= 1000 ? trimNum(n / 1000) + 'K' : Math.floor(n).toString()

export const fmtMoney = n => '$' + fmt(n)

// Bumped every published build — always visible in the corner of the game so
// there is never ambiguity about which version is actually running.
export const BUILD = 'chess-v2'

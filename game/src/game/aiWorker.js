// Web Worker: runs the AI search off the main thread so the UI never freezes.
// Bundled via `?worker&inline` so it ships as a base64 Blob inside the main
// JS bundle — no separate network request, works in the single-file build.
import { chooseAiMove, searchBestMove } from './ai.js'

self.onmessage = e => {
  const { type, state, level, reqId } = e.data
  try {
    if (type === 'move') {
      const result = chooseAiMove(state, level)
      self.postMessage({ reqId, result })
    } else if (type === 'hint') {
      const result = searchBestMove(state, { maxDepth: 5, timeBudgetMs: 1200, weights: { pst: 1, mobility: 2.5 } })
      self.postMessage({ reqId, result })
    }
  } catch (err) {
    self.postMessage({ reqId, error: String(err && err.message || err) })
  }
}

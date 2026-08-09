// Premium WebAudio synth engine — zero asset files, everything generated at runtime.
// Signal flow:
//   voice -> master (dry bus)
//   voice -> sendGain -> convolver (generated impulse response) -> wetReturn -> master
//   master -> compressor -> destination
// Every public call is try/catch guarded so a locked/suspended AudioContext never throws.

let ctx = null
let master = null       // dry bus, everything passes through this on the way to the compressor
let compressor = null   // final bus glue
let convolver = null    // shared generated reverb
let graphReady = false

function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (!graphReady) buildGraph(ctx)
  return ctx
}

function buildGraph(c) {
  try {
    compressor = c.createDynamicsCompressor()
    const t = c.currentTime
    compressor.threshold.setValueAtTime(-18, t)
    compressor.ratio.setValueAtTime(3, t)
    compressor.knee.setValueAtTime(12, t)
    compressor.attack.setValueAtTime(0.003, t)
    compressor.release.setValueAtTime(0.25, t)
    compressor.connect(c.destination)

    master = c.createGain()
    master.gain.value = 0.9
    master.connect(compressor)

    convolver = c.createConvolver()
    convolver.buffer = makeImpulseResponse(c)
    const wetReturn = c.createGain()
    wetReturn.gain.value = 1
    convolver.connect(wetReturn)
    wetReturn.connect(master)

    graphReady = true
  } catch { /* audio locked until first gesture — retried lazily on next call */ }
}

// ---------- generators ----------

// 1.2s stereo impulse response: exponentially-decaying noise, for the reverb send.
function makeImpulseResponse(c, duration = 1.2, decay = 3.2) {
  const len = Math.max(1, Math.floor(c.sampleRate * duration))
  const buf = c.createBuffer(2, len, c.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) {
      const env = Math.pow(1 - i / len, decay)
      d[i] = (Math.random() * 2 - 1) * env
    }
  }
  return buf
}

function noiseBuffer(c, duration = 0.3, pink = false) {
  const len = Math.max(1, Math.floor(c.sampleRate * duration))
  const buf = c.createBuffer(1, len, c.sampleRate)
  const d = buf.getChannelData(0)
  if (pink) {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + w * 0.0555179
      b1 = 0.99332 * b1 + w * 0.0750759
      b2 = 0.96900 * b2 + w * 0.1538520
      b3 = 0.86650 * b3 + w * 0.3104856
      b4 = 0.55000 * b4 + w * 0.5329522
      b5 = -0.7616 * b5 - w * 0.0168980
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
      b6 = w * 0.115926
    }
  } else {
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  }
  return buf
}

function noiseSource(c, duration = 0.3, pink = false) {
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c, duration, pink)
  return src
}

// ±amt (fraction, e.g. 0.03 == ±3%) random pitch variation so repeats don't feel robotic.
function vary(freq, amt = 0.03) {
  return freq * (1 + (Math.random() * 2 - 1) * amt)
}

// Route a finished voice (its last gain node) into the master/reverb buses.
function out(node, wet = 0.18, dry = 1) {
  try {
    const c = ac()
    if (dry > 0) {
      if (dry === 1) node.connect(master)
      else { const dg = c.createGain(); dg.gain.value = dry; node.connect(dg); dg.connect(master) }
    }
    if (wet > 0) {
      const sg = c.createGain(); sg.gain.value = wet
      node.connect(sg); sg.connect(convolver)
    }
  } catch {}
}

// Simple ADSR envelope applied to a GainNode's .gain AudioParam.
function envelope(param, { t0, peak = 0.2, attack = 0.006, decay = 0.1, sustain = 0.5, sustainTime = 0.06, release = 0.2 }) {
  param.setValueAtTime(0.0001, t0)
  param.linearRampToValueAtTime(peak, t0 + attack)
  param.linearRampToValueAtTime(Math.max(peak * sustain, 0.0001), t0 + attack + decay)
  param.setTargetAtTime(0.0001, t0 + attack + decay + sustainTime, Math.max(release / 3, 0.01))
}

// ---------- chess one-shots ----------

// Wood tap — a piece set down on the board.
function fnMove() {
  const c = ac(), t = c.currentTime
  const src = noiseSource(c, 0.05)
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = vary(950, 0.08); bp.Q.value = 2.4
  const g = c.createGain()
  envelope(g.gain, { t0: t, peak: 0.22, attack: 0.002, decay: 0.03, sustain: 0.1, sustainTime: 0.01, release: 0.05 })
  src.connect(bp).connect(g)
  out(g, 0.16)
  src.start(t); src.stop(t + 0.08)

  const o = c.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(vary(220, 0.04), t)
  const og = c.createGain()
  og.gain.setValueAtTime(0.0001, t)
  og.gain.linearRampToValueAtTime(0.14, t + 0.004)
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.07)
  o.connect(og); out(og, 0.12)
  o.start(t); o.stop(t + 0.08)
}

// Capture thunk — heavier, with a knock.
function fnCapture() {
  const c = ac(), t = c.currentTime
  const o = c.createOscillator(); o.type = 'sine'
  o.frequency.setValueAtTime(160, t)
  o.frequency.exponentialRampToValueAtTime(70, t + 0.14)
  const g = c.createGain()
  g.gain.setValueAtTime(0.35, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.16)
  o.connect(g); out(g, 0.18)
  o.start(t); o.stop(t + 0.18)

  const src = noiseSource(c, 0.08)
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 1.6
  const g2 = c.createGain()
  g2.gain.setValueAtTime(0.3, t)
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.09)
  src.connect(bp).connect(g2); out(g2, 0.16)
  src.start(t); src.stop(t + 0.1)
}

// Check alert ding — bright, urgent.
function fnCheck() {
  const c = ac(), t0 = c.currentTime
  ;[880, 1174.66].forEach((f, i) => {
    const t = t0 + i * 0.09
    const o = c.createOscillator(); o.type = 'square'; o.frequency.value = f
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3000
    const g = c.createGain()
    envelope(g.gain, { t0: t, peak: 0.14, attack: 0.004, decay: 0.06, sustain: 0.3, sustainTime: 0.03, release: 0.12 })
    o.connect(lp).connect(g); out(g, 0.24)
    o.start(t); o.stop(t + 0.2)
  })
}

// Promotion fanfare — short triumphant arpeggio.
function fnPromote() {
  const c = ac(), t0 = c.currentTime
  const notes = [523.25, 659.25, 784.0, 1046.5]
  notes.forEach((f, i) => {
    const t = t0 + i * 0.075
    const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = vary(f, 0.01)
    const g = c.createGain()
    envelope(g.gain, { t0: t, peak: 0.24, attack: 0.006, decay: 0.1, sustain: 0.4, sustainTime: 0.05, release: 0.25 })
    o.connect(g); out(g, 0.3)
    o.start(t); o.stop(t + 0.4)
  })
}

// Descending slide — loss.
function fnLose() {
  const c = ac(), t = c.currentTime, dur = 0.7
  const o = c.createOscillator(); o.type = 'sawtooth'
  o.frequency.setValueAtTime(440, t)
  o.frequency.exponentialRampToValueAtTime(110, t + dur)
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'
  lp.frequency.setValueAtTime(2400, t)
  lp.frequency.exponentialRampToValueAtTime(300, t + dur)
  const g = c.createGain()
  g.gain.setValueAtTime(0.22, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + dur)
  o.connect(lp).connect(g); out(g, 0.28)
  o.start(t); o.stop(t + dur + 0.05)
}

// Heartbeat — the revive prompt.
function fnHeartbeat() {
  const c = ac(), t0 = c.currentTime
  ;[0, 0.32].forEach(dt => {
    const t = t0 + dt
    const o = c.createOscillator(); o.type = 'sine'
    o.frequency.setValueAtTime(90, t)
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12)
    const g = c.createGain()
    g.gain.setValueAtTime(0.32, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
    o.connect(g); out(g, 0.1)
    o.start(t); o.stop(t + 0.16)
  })
}

function fnClick() {
  const c = ac(), t = c.currentTime
  const src = noiseSource(c, 0.06)
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = vary(2200, 0.08); bp.Q.value = 3.5
  const g = c.createGain()
  envelope(g.gain, { t0: t, peak: 0.08, attack: 0.002, decay: 0.03, sustain: 0.15, sustainTime: 0.01, release: 0.04 })
  src.connect(bp).connect(g)
  out(g, 0.12)
  src.start(t); src.stop(t + 0.09)

  const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(vary(1500, 0.04), t)
  const og = c.createGain()
  og.gain.setValueAtTime(0.0001, t)
  og.gain.linearRampToValueAtTime(0.03, t + 0.004)
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
  o.connect(og); out(og, 0.12)
  o.start(t); o.stop(t + 0.06)
}

function fnSwoosh() {
  const c = ac(), t = c.currentTime, dur = 0.35
  const src = noiseSource(c, dur, true)
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2
  bp.frequency.setValueAtTime(400, t)
  bp.frequency.exponentialRampToValueAtTime(3200, t + dur * 0.6)
  bp.frequency.exponentialRampToValueAtTime(900, t + dur)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(0.25, t + dur * 0.35)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(bp).connect(g)
  out(g, 0.2)
  src.start(t); src.stop(t + dur + 0.02)
}

function fnDeny() {
  const c = ac(), t0 = c.currentTime
  ;[0, 0.13].forEach(dt => {
    const t = t0 + dt
    const o = c.createOscillator(); o.type = 'sine'
    o.frequency.setValueAtTime(220, t)
    o.frequency.exponentialRampToValueAtTime(160, t + 0.12)
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.15, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14)
    o.connect(lp).connect(g); out(g, 0.08)
    o.start(t); o.stop(t + 0.16)
  })
}

function coinDing(t, baseFreq = 1800, peak = 0.12) {
  const c = ac()
  const f1 = vary(baseFreq, 0.03)
  const o1 = c.createOscillator(); o1.type = 'sine'; o1.frequency.value = f1
  const g1 = c.createGain()
  g1.gain.setValueAtTime(0.0001, t)
  g1.gain.linearRampToValueAtTime(peak, t + 0.006)
  g1.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)
  o1.connect(g1); out(g1, 0.22)
  o1.start(t); o1.stop(t + 0.4)

  const o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = f1 * 1.5
  const g2 = c.createGain()
  g2.gain.setValueAtTime(0.0001, t)
  g2.gain.linearRampToValueAtTime(peak * 0.5, t + 0.004)
  g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.18)
  o2.connect(g2); out(g2, 0.22)
  o2.start(t); o2.stop(t + 0.2)
}

// ---------- slot-machine juice: tickUp / counterTick / counterDone / jackpot ----------

// Major-pentatonic step sequence (in semitones) used by tickUp/jackpot so any
// run of rising steps always lands on a consonant note, octave after octave.
const PENTA_STEPS = [0, 2, 4, 7, 9]
function pentaSemis(step) {
  const s = Math.max(0, step | 0)
  const octave = Math.floor(s / 5)
  return octave * 12 + PENTA_STEPS[s % 5]
}
function tickUpFreq(step) {
  return 660 * Math.pow(2, pentaSemis(step) / 12)
}

function fnTickUp(step) {
  const c = ac(), t = c.currentTime
  const f = tickUpFreq(step)

  const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(0.12, t + 0.004)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04)
  o.connect(g); out(g, 0.16)
  o.start(t); o.stop(t + 0.05)

  const src = noiseSource(c, 0.015)
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 4000; bp.Q.value = 2.5
  const ng = c.createGain()
  ng.gain.setValueAtTime(0.0001, t)
  ng.gain.linearRampToValueAtTime(0.05, t + 0.002)
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.015)
  src.connect(bp).connect(ng); out(ng, 0.1)
  src.start(t); src.stop(t + 0.02)
}

function fnCounterTick(i) {
  const c = ac(), t = c.currentTime
  const ii = Math.max(0, i | 0)
  const pitchMul = Math.pow(2, Math.floor(ii / 8) / 12)

  const src = noiseSource(c, 0.025)
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'
  bp.frequency.value = (3000 + Math.random() * 2000) * pitchMul
  bp.Q.value = 5
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(0.09, t + 0.002)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.022)
  src.connect(bp).connect(g); out(g, 0)

  src.start(t); src.stop(t + 0.03)

  const o = c.createOscillator(); o.type = 'square'; o.frequency.value = 1200 * pitchMul
  const og = c.createGain()
  og.gain.setValueAtTime(0.0001, t)
  og.gain.linearRampToValueAtTime(0.05, t + 0.001)
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.018)
  o.connect(og); out(og, 0)
  o.start(t); o.stop(t + 0.025)
}

function fnCounterDone() {
  const c = ac(), t0 = c.currentTime
  const notes = [1318.51, 1760.0]
  notes.forEach((f, i) => {
    const t = t0 + i * 0.08
    const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = vary(f, 0.01)
    const o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = vary(f, 0.01)
    const g = c.createGain()
    envelope(g.gain, { t0: t, peak: 0.24, attack: 0.006, decay: 0.08, sustain: 0.4, sustainTime: 0.05, release: 0.2 })
    o.connect(g); o2.connect(g)
    out(g, 0.32)
    o.start(t); o.stop(t + 0.3); o2.start(t); o2.stop(t + 0.3)
  })
  const dur = 0.28
  const src = noiseSource(c, dur)
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 5000
  const g2 = c.createGain()
  g2.gain.setValueAtTime(0.0001, t0 + 0.07)
  g2.gain.linearRampToValueAtTime(0.06, t0 + 0.1)
  g2.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.07 + dur)
  src.connect(hp).connect(g2); out(g2, 0.35)
  src.start(t0 + 0.07); src.stop(t0 + 0.07 + dur + 0.02)
}

function fnJackpot() {
  const c = ac(), t0 = c.currentTime

  let t = t0
  let interval = 0.075
  for (let i = 0; i < 8; i++) {
    const f = 880 * Math.pow(2, pentaSemis(i) / 12)
    coinDing(t, f, 0.22 + i * 0.012)
    t += interval
    interval = Math.max(0.035, interval * 0.9)
  }

  const chord = [440.0, 554.37, 659.25, 880.0]
  const padDur = 1.6
  chord.forEach((f, i) => {
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = vary(f, 0.01); o.detune.value = (i - 1.5) * 3
    const o2 = c.createOscillator(); o2.type = 'triangle'; o2.frequency.value = vary(f, 0.01) * 0.5
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.linearRampToValueAtTime(0.08, t0 + 0.5)
    g.gain.setValueAtTime(0.08, t0 + padDur - 0.5)
    g.gain.linearRampToValueAtTime(0.0001, t0 + padDur)
    o.connect(g); o2.connect(g)
    out(g, 0.3)
    o.start(t0); o.stop(t0 + padDur + 0.05); o2.start(t0); o2.stop(t0 + padDur + 0.05)
  })

  const shimDur = 1.5
  const src = noiseSource(c, shimDur)
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 7500; bp.Q.value = 1.5
  const g3 = c.createGain()
  g3.gain.setValueAtTime(0.0001, t0)
  g3.gain.linearRampToValueAtTime(0.18, t0 + 0.6)
  g3.gain.exponentialRampToValueAtTime(0.0001, t0 + shimDur)
  src.connect(bp).connect(g3); out(g3, 0.4)
  src.start(t0); src.stop(t0 + shimDur + 0.02)

  const tEnd = t0 + 1.5
  const o4 = c.createOscillator(); o4.type = 'sine'
  o4.frequency.setValueAtTime(80, tEnd)
  o4.frequency.exponentialRampToValueAtTime(40, tEnd + 0.25)
  const g4 = c.createGain()
  g4.gain.setValueAtTime(0.5, tEnd)
  g4.gain.exponentialRampToValueAtTime(0.001, tEnd + 0.3)
  o4.connect(g4); out(g4, 0.2)
  o4.start(tEnd); o4.stop(tEnd + 0.32)

  coinDing(tEnd, 1760, 0.35)
}

// ---------- public API ----------

export const sfx = {
  unlock() { try { const c = ac(); c.resume() } catch {} },
  click() { try { fnClick() } catch {} },
  swoosh() { try { fnSwoosh() } catch {} },
  deny() { try { fnDeny() } catch {} },
  move() { try { fnMove() } catch {} },
  capture() { try { fnCapture() } catch {} },
  check() { try { fnCheck() } catch {} },
  promote() { try { fnPromote() } catch {} },
  lose() { try { fnLose() } catch {} },
  heartbeat() { try { fnHeartbeat() } catch {} },

  // ---- slot-machine juice ----
  tickUp(step = 0) { try { fnTickUp(step) } catch {} },
  counterTick(i = 0) { try { fnCounterTick(i) } catch {} },
  counterDone() { try { fnCounterDone() } catch {} },
  jackpot() { try { fnJackpot() } catch {} },
}

// Background music removed by request — start()/stop() are no-ops so callers
// don't need to special-case it.
export const music = {
  start() {},
  stop() {},
  setEnabled() {},
  duck() {},
  unduck() {},
}

// The sound of the house. Everything is synthesised with WebAudio at play
// time — no audio files to ship, license or load.
//
// Browsers only allow audio after a user gesture, so nothing sounds until
// `unlock()` has been called from a click or key press.

import { watch } from 'vue'
import { settings } from './settings'

export type Sfx =
  | 'click'
  | 'select'
  | 'type'
  | 'page'
  | 'scratch'
  | 'chime'
  | 'sting'
  | 'link'
  | 'miss'
  | 'find'
  | 'gavel'
  | 'stamp'
  | 'thunder'
  | 'reveal'

let ctx: AudioContext | null = null
let master: GainNode | null = null
let noise: AudioBuffer | null = null
let ambience: { gain: GainNode; stop: () => void } | null = null
let ambienceWanted = false

function level(): number {
  return settings.muted ? 0 : settings.volume
}

/** Create (or resume) the audio context. Call from a user gesture. */
export function unlock(): void {
  if (typeof window === 'undefined') return
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return
  if (!ctx) {
    ctx = new Ctor()
    master = ctx.createGain()
    master.gain.value = level()
    master.connect(ctx.destination)
    // Two seconds of white noise: the raw material for rain, paper and thuds.
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  if (ctx.state === 'suspended') void ctx.resume()
  if (ambienceWanted) startAmbience()
}

watch(
  () => [settings.volume, settings.muted] as const,
  () => {
    if (ctx && master) master.gain.setTargetAtTime(level(), ctx.currentTime, 0.05)
  },
)
watch(
  () => settings.ambience,
  (on) => {
    if (on && ambienceWanted) startAmbience()
    else if (!on) haltAmbience()
  },
)

// ---------- building blocks ----------

interface ToneOpts {
  freq: number
  /** Glide to this frequency over the duration. */
  to?: number
  type?: OscillatorType
  at?: number
  dur: number
  gain: number
  attack?: number
}

function tone(o: ToneOpts): void {
  if (!ctx || !master) return
  const t0 = ctx.currentTime + (o.at ?? 0)
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = o.type ?? 'sine'
  osc.frequency.setValueAtTime(o.freq, t0)
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + o.dur)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(o.gain, t0 + (o.attack ?? 0.005))
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur)
  osc.connect(g).connect(master)
  osc.start(t0)
  osc.stop(t0 + o.dur + 0.05)
}

interface NoiseOpts {
  at?: number
  dur: number
  gain: number
  filter: BiquadFilterType
  freq: number
  /** Sweep the filter to this frequency over the duration. */
  to?: number
  q?: number
  attack?: number
}

function burst(o: NoiseOpts): void {
  if (!ctx || !master || !noise) return
  const t0 = ctx.currentTime + (o.at ?? 0)
  const src = ctx.createBufferSource()
  src.buffer = noise
  src.loop = true
  const f = ctx.createBiquadFilter()
  f.type = o.filter
  f.frequency.setValueAtTime(o.freq, t0)
  if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t0 + o.dur)
  f.Q.value = o.q ?? 1
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(o.gain, t0 + (o.attack ?? 0.004))
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur)
  src.connect(f).connect(g).connect(master)
  src.start(t0, Math.random() * 1.5)
  src.stop(t0 + o.dur + 0.05)
}

/** A struck bell: a fundamental under a stack of inharmonic partials. */
function bell(freq: number, at: number, gain: number, dur: number): void {
  const partials: [number, number, number][] = [
    [0.5, 0.5, 1],
    [1, 1, 0.9],
    [1.19, 0.45, 0.7],
    [1.5, 0.3, 0.55],
    [2, 0.35, 0.45],
    [2.51, 0.18, 0.3],
    [3.01, 0.1, 0.22],
  ]
  for (const [ratio, amp, life] of partials) {
    tone({ freq: freq * ratio, at, dur: dur * life, gain: gain * amp, attack: 0.003 })
  }
  burst({ at, dur: 0.05, gain: gain * 0.5, filter: 'bandpass', freq: 2400, q: 0.8 })
}

// ---------- the effects ----------

export function sfx(name: Sfx): void {
  if (!ctx || level() === 0) return
  switch (name) {
    case 'click':
      burst({ dur: 0.035, gain: 0.16, filter: 'bandpass', freq: 1900, q: 2.5 })
      tone({ freq: 320, to: 180, dur: 0.05, gain: 0.06, type: 'triangle' })
      break
    case 'select':
      tone({ freq: 660, dur: 0.09, gain: 0.07, type: 'triangle' })
      tone({ freq: 990, at: 0.05, dur: 0.12, gain: 0.05, type: 'triangle' })
      break
    case 'type':
      burst({
        dur: 0.022,
        gain: 0.07,
        filter: 'bandpass',
        freq: 2600 + Math.random() * 1400,
        q: 3,
        attack: 0.001,
      })
      break
    case 'page':
      burst({ dur: 0.28, gain: 0.14, filter: 'bandpass', freq: 700, to: 3600, q: 0.9, attack: 0.04 })
      break
    case 'scratch':
      for (let i = 0; i < 4; i++) {
        burst({
          at: i * 0.075,
          dur: 0.06 + Math.random() * 0.03,
          gain: 0.05,
          filter: 'highpass',
          freq: 3800,
          attack: 0.01,
        })
      }
      break
    case 'chime':
      bell(196, 0, 0.22, 3.2)
      break
    case 'sting':
      // A cold little minor stab over a low drum.
      tone({ freq: 73.4, dur: 0.9, gain: 0.3, type: 'sine' })
      burst({ dur: 0.18, gain: 0.2, filter: 'lowpass', freq: 240 })
      for (const [f, at] of [
        [293.7, 0],
        [349.2, 0.02],
        [440, 0.04],
        [587.3, 0.28],
      ] as const) {
        tone({ freq: f, at, dur: 1.1, gain: 0.07, type: 'sawtooth', attack: 0.01 })
      }
      break
    case 'link':
      bell(523.3, 0, 0.07, 1.2)
      bell(659.3, 0.14, 0.07, 1.4)
      break
    case 'miss':
      tone({ freq: 130, to: 48, dur: 0.32, gain: 0.3 })
      burst({ dur: 0.12, gain: 0.12, filter: 'lowpass', freq: 300 })
      break
    case 'find':
      bell(880, 0, 0.05, 0.9)
      bell(1318.5, 0.09, 0.05, 1.1)
      bell(1760, 0.18, 0.04, 1.2)
      break
    case 'gavel':
      tone({ freq: 150, to: 60, dur: 0.22, gain: 0.4 })
      burst({ dur: 0.09, gain: 0.3, filter: 'bandpass', freq: 900, q: 1.2 })
      break
    case 'stamp':
      tone({ freq: 95, to: 40, dur: 0.3, gain: 0.45 })
      burst({ dur: 0.14, gain: 0.22, filter: 'lowpass', freq: 500 })
      break
    case 'thunder':
      burst({ dur: 3.2, gain: 0.4, filter: 'lowpass', freq: 190, to: 60, attack: 0.08 })
      burst({ at: 0.25, dur: 2.2, gain: 0.2, filter: 'lowpass', freq: 120, attack: 0.3 })
      break
    case 'reveal':
      tone({ freq: 55, dur: 2.4, gain: 0.3, attack: 0.4 })
      for (const [f, at] of [
        [220, 0],
        [261.6, 0.5],
        [329.6, 1.0],
      ] as const) {
        tone({ freq: f, at, dur: 2.2, gain: 0.06, type: 'sawtooth', attack: 0.3 })
      }
      break
  }
}

/** Strike the hour: one bell per stroke, as a long-case clock would. */
export function strikeClock(strokes: number): void {
  if (!ctx || level() === 0) return
  const n = Math.max(1, Math.min(12, strokes))
  for (let i = 0; i < n; i++) bell(174.6, i * 0.85, 0.2, 3)
}

// ---------- ambience ----------

/** Rain on the windows, and a clock that will not stop. */
export function startAmbience(): void {
  ambienceWanted = true
  if (!ctx || !master || !noise || ambience || !settings.ambience) return
  const out = ctx.createGain()
  out.gain.value = 0.0001
  out.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 2.5)
  out.connect(master)

  const rain = ctx.createBufferSource()
  rain.buffer = noise
  rain.loop = true
  const hiss = ctx.createBiquadFilter()
  hiss.type = 'bandpass'
  hiss.frequency.value = 5200
  hiss.Q.value = 0.4
  const hissGain = ctx.createGain()
  hissGain.gain.value = 0.045
  rain.connect(hiss).connect(hissGain).connect(out)

  const rumble = ctx.createBufferSource()
  rumble.buffer = noise
  rumble.loop = true
  rumble.playbackRate.value = 0.6
  const low = ctx.createBiquadFilter()
  low.type = 'lowpass'
  low.frequency.value = 420
  const lowGain = ctx.createGain()
  lowGain.gain.value = 0.06
  rumble.connect(low).connect(lowGain).connect(out)

  rain.start()
  rumble.start(0, 0.7)

  let tock = false
  const tick = window.setInterval(() => {
    if (!ctx || ctx.state !== 'running' || level() === 0) return
    tock = !tock
    const t0 = ctx.currentTime
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.frequency.value = tock ? 1050 : 1400
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(0.018, t0 + 0.002)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.04)
    osc.connect(g).connect(out)
    osc.start(t0)
    osc.stop(t0 + 0.06)
  }, 1000)

  ambience = {
    gain: out,
    stop: () => {
      window.clearInterval(tick)
      rain.stop()
      rumble.stop()
      out.disconnect()
    },
  }
}

function haltAmbience(): void {
  if (!ctx || !ambience) return
  const a = ambience
  ambience = null
  a.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.3)
  window.setTimeout(a.stop, 1500)
}

export function stopAmbience(): void {
  ambienceWanted = false
  haltAmbience()
}

// The sounds of the game: the detective's own small noises (a page, a pen, a
// stamp), the voices of the household, and the weather. All but the weather
// is synthesised with WebAudio at play time; the weather, the music and the
// hour bell are recordings, looped (credited in the settings menu and the
// README). The weather is the setting's own — rain, a blizzard, the sea, a
// train — and is heard as from wherever the detective stands: plainly out of
// doors, and through the walls within.
//
// Browsers only allow audio after a user gesture, so nothing sounds until
// `unlock()` has been called from a click or key press.

import { watch } from 'vue'
import bellUrl from '../assets/bell.mp3'
import drumrollUrl from '../assets/drumroll.mp3'
import blizzardUrl from '../assets/blizzard-loop.mp3'
import oceanUrl from '../assets/ocean-loop.mp3'
import rainUrl from '../assets/rain-loop.mp3'
import trainUrl from '../assets/train-loop.mp3'
import walkingAlongUrl from '../assets/walking-along.mp3'
import gloomHorizonUrl from '../assets/gloom-horizon.mp3'
import fogUrl from '../assets/fog-loop.mp3'
import shoreUrl from '../assets/shore-loop.mp3'
import type { VoiceDef } from '../content/schema'
import { settings } from './settings'

export type Sfx =
  | 'click'
  | 'select'
  | 'type'
  | 'page'
  | 'scratch'
  | 'sting'
  | 'link'
  | 'miss'
  | 'find'
  | 'gavel'
  | 'stamp'
  | 'thunder'
  | 'reveal'
  | 'whistle'
  | 'ring'
  | 'pickup'
  | 'hangup'
  | 'tumbler'
  | 'dial'
  | 'rattle'
  | 'switch'
  | 'unlock'

let ctx: AudioContext | null = null
let master: GainNode | null = null
let noise: AudioBuffer | null = null

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
  startStorm()
  startMusic()
  loadBell()
  loadDrumroll()
}

watch(
  () => [settings.volume, settings.muted] as const,
  () => {
    if (ctx && master) master.gain.setTargetAtTime(level(), ctx.currentTime, 0.05)
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
  /** Where the sound goes, if not straight to the ear. */
  out?: AudioNode
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
  osc.connect(g).connect(o.out ?? master)
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
  /** Where the sound goes, if not straight to the ear. */
  out?: AudioNode
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
  src.connect(f).connect(g).connect(o.out ?? master)
  src.start(t0, Math.random() * 1.5)
  src.stop(t0 + o.dur + 0.05)
}

/** A struck bell: a fundamental under a stack of inharmonic partials. */
function bell(freq: number, at: number, gain: number, dur: number, out?: AudioNode): void {
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
    tone({ freq: freq * ratio, at, dur: dur * life, gain: gain * amp, attack: 0.003, out })
  }
  burst({ at, dur: 0.05, gain: gain * 0.5, filter: 'bandpass', freq: 2400, q: 0.8, out })
}

// ---------- the effects ----------

export function sfx(name: Sfx): void {
  if (!ctx || level() === 0) return
  // (A little give in the pitch, so that the same click over and over is not the same click.)
  const p = 0.92 + Math.random() * 0.16
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
      thunder(0)
      break
    case 'whistle':
      // A police whistle: a shrill note with the pea trilling in it.
      for (let i = 0; i < 14; i++) {
        tone({ freq: i % 2 ? 2650 : 2480, at: i * 0.045, dur: 0.06, gain: 0.035, type: 'sine', attack: 0.004 })
      }
      break
    case 'ring':
      // A telephone ringing at the other end: two short burrs, a pause, two more.
      for (const at of [0, 0.6, 1.8, 2.4]) {
        tone({ freq: 400, at, dur: 0.4, gain: 0.03, type: 'square', attack: 0.01 })
        tone({ freq: 450, at, dur: 0.4, gain: 0.03, type: 'square', attack: 0.01 })
      }
      break
    case 'pickup':
      burst({ dur: 0.05, gain: 0.18, filter: 'bandpass', freq: 1400, q: 2 })
      tone({ freq: 140, to: 90, dur: 0.12, gain: 0.12 })
      break
    case 'hangup':
      tone({ freq: 110, to: 55, dur: 0.18, gain: 0.3 })
      burst({ dur: 0.08, gain: 0.22, filter: 'lowpass', freq: 700 })
      burst({ at: 0.12, dur: 0.05, gain: 0.1, filter: 'bandpass', freq: 1600, q: 2 })
      break
    // ----- the locks -----
    case 'tumbler':
      // A letter wheel turned a notch: the pawl ticks over, twice, on brass.
      burst({ dur: 0.018, gain: 0.12, filter: 'bandpass', freq: 3200 * p, q: 5, attack: 0.001 })
      burst({ at: 0.035, dur: 0.015, gain: 0.07, filter: 'bandpass', freq: 3800 * p, q: 5, attack: 0.001 })
      tone({ freq: 2100 * p, dur: 0.04, gain: 0.025, type: 'triangle', attack: 0.001 })
      break
    case 'dial':
      // A safe's dial turned a sixth: its ratchet ticks over the graduations while it
      // turns (as the dial does, over 0.3 s), then drops into its detent.
      for (let i = 0; i < 6; i++) {
        burst({
          at: i * 0.042 + Math.random() * 0.006,
          dur: 0.012,
          gain: 0.07 + Math.random() * 0.03,
          filter: 'bandpass',
          freq: (3300 + Math.random() * 500) * p,
          q: 7,
          attack: 0.001,
        })
      }
      burst({ at: 0.27, dur: 0.02, gain: 0.16, filter: 'bandpass', freq: 2400 * p, q: 8, attack: 0.001 })
      tone({ at: 0.27, freq: 900 * p, to: 700 * p, dur: 0.06, gain: 0.04, type: 'triangle', attack: 0.001 })
      burst({ at: 0.28, dur: 0.05, gain: 0.06, filter: 'lowpass', freq: 400 })
      break
    case 'rattle':
      // Tried, and held: the bolt thuds against its keeper and rattles there.
      tone({ freq: 120, to: 70, dur: 0.15, gain: 0.25 })
      burst({ dur: 0.06, gain: 0.15, filter: 'lowpass', freq: 600 })
      for (let i = 0; i < 4; i++) {
        burst({
          at: 0.05 + i * 0.055 + Math.random() * 0.01,
          dur: 0.025,
          gain: 0.12 * (1 - i * 0.2),
          filter: 'bandpass',
          freq: 2600 + Math.random() * 600,
          q: 6,
          attack: 0.001,
        })
      }
      break
    case 'switch':
      // A lamp's switch snapped over, and the faint sing of a filament.
      burst({ dur: 0.012, gain: 0.2, filter: 'highpass', freq: 2500, attack: 0.001 })
      burst({ at: 0.012, dur: 0.04, gain: 0.08, filter: 'bandpass', freq: 1100 * p, q: 3 })
      tone({ at: 0.02, freq: 1760 * p, to: 1480 * p, dur: 0.25, gain: 0.012, attack: 0.01 })
      break
    case 'unlock':
      // The bolt draws back along its plate (as LockPlate draws it: 0.1 s in, over 0.55 s),
      // comes home against its stop, and the thing gives.
      burst({ at: 0.1, dur: 0.5, gain: 0.07, filter: 'bandpass', freq: 1500, to: 900, q: 1.5, attack: 0.08 })
      burst({ at: 0.1, dur: 0.5, gain: 0.03, filter: 'highpass', freq: 5000, attack: 0.1 })
      tone({ at: 0.62, freq: 180, to: 80, dur: 0.18, gain: 0.3 })
      burst({ at: 0.62, dur: 0.05, gain: 0.2, filter: 'bandpass', freq: 2200, q: 4, attack: 0.001 })
      burst({ at: 0.62, dur: 0.1, gain: 0.15, filter: 'lowpass', freq: 500 })
      bell(880, 0.8, 0.04, 0.9)
      bell(1318.5, 0.89, 0.04, 1.1)
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

/**
 * How long the thunder is behind the lightning, in milliseconds: two seconds
 * with the storm a way off (`near` 0), and none at all when it is overhead (1).
 */
export function thunderDelay(near: number): number {
  const n = Math.min(1, Math.max(0, near))
  return Math.round(2000 * (1 - n))
}

/**
 * A stroke of thunder, and the long roll after it. The nearer the storm, the
 * louder it is and the harder the crack at the front of it.
 */
export function thunder(near = 0): void {
  if (!ctx || level() === 0 || !settings.storm) return
  const n = Math.min(1, Math.max(0, near))
  // Through the storm's own door: indoors the crack is lost in the walls and
  // only the roll comes through.
  const out = storm?.muffle
  // Loud enough to be heard over the rain and the music: it passes through
  // the storm's own level on the way out, which halves it.
  const loud = 1 + 0.5 * n
  burst({ dur: 0.7 + 0.3 * n, gain: (0.7 + 0.6 * n) * loud, filter: 'bandpass', freq: 1700, to: 380, q: 0.6, attack: 0.008, out })
  burst({ at: 0.04, dur: 5.5, gain: 1.5 * loud, filter: 'lowpass', freq: 240, to: 55, attack: 0.07, out })
  burst({ at: 0.3, dur: 4.6, gain: 0.85 * loud, filter: 'lowpass', freq: 130, attack: 0.3, out })
  // It rolls, and rolls again, as it goes off over the hills.
  burst({ at: 2.4, dur: 4.8, gain: 0.7 * loud, filter: 'lowpass', freq: 115, to: 50, attack: 0.6, out })
  burst({ at: 5.2, dur: 4.6, gain: 0.45 * loud, filter: 'lowpass', freq: 95, to: 45, attack: 0.9, out })
  burst({ at: 7.6, dur: 3.6, gain: 0.25 * loud, filter: 'lowpass', freq: 80, to: 40, attack: 1.1, out })
}

/** A room for the piano to sound in: a long, soft tail of noise, convolved. Made once. */
let hall: ConvolverNode | null = null
function roomFor(): AudioNode | undefined {
  if (!ctx || !master) return undefined
  if (!hall) {
    const seconds = 3.2
    const length = Math.floor(ctx.sampleRate * seconds)
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate)
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch)
      for (let i = 0; i < length; i++) {
        // Louder early reflections, then a smooth die-away.
        const t = i / length
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.4) * (i < 2000 ? 1 : 0.7)
      }
    }
    hall = ctx.createConvolver()
    hall.buffer = impulse
    const wet = ctx.createGain()
    wet.gain.value = 0.55
    hall.connect(wet).connect(master)
  }
  return hall
}

/** One note of a rather distant piano: harmonic partials that die at different rates, and a soft hammer. */
function pianoNote(freq: number, at: number, gain: number, dur: number): void {
  const room = roomFor()
  const partials: [number, number, number][] = [
    [1, 1, 1],
    [2, 0.5, 0.7],
    [3, 0.25, 0.5],
    [4, 0.12, 0.35],
    [5, 0.06, 0.25],
  ]
  for (const [ratio, amp, life] of partials) {
    // Dry, and into the room.
    tone({ freq: freq * ratio, at, dur: dur * life, gain: gain * amp * 0.8, attack: 0.004 })
    tone({ freq: freq * ratio, at, dur: dur * life, gain: gain * amp, attack: 0.004, out: room })
  }
  burst({ at, dur: 0.02, gain: gain * 0.25, filter: 'lowpass', freq: 1800 })
}

/**
 * The music steps back — for the title card, say — and comes forward again
 * when asked. Ramped, so it is never a cut.
 */
export function holdMusic(hold: boolean): void {
  const t = tune ? tunes[tune] : null
  if (!ctx || !t?.out || !settings.music) return
  t.out.gain.setTargetAtTime(hold ? 0 : MUSIC_LEVEL * t.level, ctx.currentTime, hold ? 0.8 : 1.5)
}

/**
 * The case's title card: a slow minor figure on the piano, D minor, four notes
 * rising and a low chord left to ring under them.
 */
export function piano(): void {
  if (!ctx || !master || level() === 0) return
  const D3 = 146.83
  const F3 = 174.61
  const A3 = 220
  const D4 = 293.66
  const Bb3 = 233.08
  pianoNote(D3 / 2, 0, 0.14, 5)
  pianoNote(A3 / 2, 0.02, 0.08, 5)
  for (const [f, at] of [
    [D3, 0.1],
    [F3, 0.55],
    [A3, 1.0],
    [D4, 1.45],
  ] as const) {
    pianoNote(f, at, 0.13, 3.2)
  }
  // A B-flat over the top, and back to the A: the question, and no answer.
  pianoNote(Bb3 * 2, 2.4, 0.1, 2.4)
  pianoNote(A3 * 2, 3.2, 0.09, 3)
}

let bellSound: AudioBuffer | null = null
let bellAsked = false

/** Fetched as soon as there is sound at all, to be ready by the first hour. */
function loadBell(): void {
  if (!ctx || bellAsked) return
  bellAsked = true
  const audio = ctx
  fetch(bellUrl)
    .then((r) => r.arrayBuffer())
    .then((data) => audio.decodeAudioData(data))
    .then((buffer) => (bellSound = buffer))
    .catch(() => {
      // The hour will be struck by the synthesised bell instead.
    })
}

let drumrollSound: AudioBuffer | null = null
let drumrollAsked = false
function loadDrumroll(): void {
  if (!ctx || drumrollAsked) return
  drumrollAsked = true
  const audio = ctx
  fetch(drumrollUrl)
    .then((r) => r.arrayBuffer())
    .then((data) => audio.decodeAudioData(data))
    .then((buffer) => (drumrollSound = buffer))
    .catch(() => {})
}
/** Where the blow falls in the drumroll recording, in seconds. */
export const DRUMROLL_IMPACT = 1.2
/** A drumroll, and the cymbal crash of the blow at DRUMROLL_IMPACT. */
export function drumroll(): void {
  if (!ctx || !master || level() === 0) return
  if (!drumrollSound) {
    // Without the recording: a roll on the drum, and the blow.
    for (let i = 0; i < 24; i++) burst({ at: i * 0.05, dur: 0.05, gain: 0.04 + i * 0.004, filter: 'lowpass', freq: 400 })
    setTimeout(() => sfx('stamp'), DRUMROLL_IMPACT * 1000)
    return
  }
  const src = ctx.createBufferSource()
  src.buffer = drumrollSound
  const g = ctx.createGain()
  g.gain.value = 0.9
  src.connect(g).connect(master)
  src.start(ctx.currentTime)
}

/** The hour: one bell, struck once. A recording; synthesised if it is not to hand. */
export function chime(): void {
  if (!ctx || !master || level() === 0) return
  if (!bellSound) {
    bell(554.4, 0.15, 0.2, 3.2)
    return
  }
  const src = ctx.createBufferSource()
  src.buffer = bellSound
  const g = ctx.createGain()
  g.gain.value = 0.8
  src.connect(g).connect(master)
  src.start(ctx.currentTime + 0.15)
}

// ---------- the weather outside: the ambience ----------

/** Where the detective stands, as the weather hears it. */
export type Shelter = 'outside' | 'glass' | 'inside'

/** What can be heard outside: one of these per setting — or nothing, before one is chosen. */
export type Ambience = 'rain' | 'blizzard' | 'ocean' | 'shore' | 'train' | 'fog' | 'smog' | 'none'

/**
 * The stretch of each recording that repeats, in seconds. Each file carries a
 * little of its loop on either side (scripts/make-loop.sh), so the silence an
 * mp3 decodes with at its edges is never played.
 */
const LOOPS: Record<string, { start: number; length: number }> = {
  [rainUrl]: { start: 0.25, length: 168.417667 },
  [oceanUrl]: { start: 0.25, length: 49.379771 },
  [blizzardUrl]: { start: 0.25, length: 56.072333 },
  [trainUrl]: { start: 0.25, length: 3.530854 },
  [fogUrl]: { start: 0.25, length: 125.146417 },
  [shoreUrl]: { start: 0.25, length: 180.095896 },
}

/**
 * What each ambience is made of, and how loud each part is (the recordings
 * were not made at one level). The train: a blizzard beyond the glass, quieter,
 * under the engine's own breath.
 */
const AMBIENCE: Record<Ambience, { url: string; level: number }[]> = {
  none: [],
  rain: [{ url: rainUrl, level: 0.5 }],
  blizzard: [{ url: blizzardUrl, level: 0.42 }],
  ocean: [{ url: oceanUrl, level: 0.9 }],
  // The sea heard from a hotel on the front: distant, and nothing like the yacht's.
  shore: [{ url: shoreUrl, level: 0.85 }],
  train: [
    { url: blizzardUrl, level: 0.22 },
    { url: trainUrl, level: 0.9 },
  ],
  // A night wind in a city street, for a fog; and under the Yard's rain, a smog.
  fog: [{ url: fogUrl, level: 1.2 }],
  smog: [
    { url: rainUrl, level: 0.35 },
    { url: fogUrl, level: 0.9 },
  ],
}

/** How much of the weather gets through: the filter's reach, and the level. */
const SHELTER: Record<Shelter, { reach: number; level: number }> = {
  outside: { reach: 18000, level: 0.5 },
  glass: { reach: 2600, level: 0.5 },
  inside: { reach: 520, level: 0.55 },
}

let storm: { muffle: BiquadFilterNode; out: GainNode } | null = null
let shelter: Shelter = 'outside'
let ambience: Ambience = 'none'
const buffers = new Map<string, AudioBuffer>()
const asked = new Set<string>()
/** What is playing now, and as what. */
let playingAmbience: { kind: Ambience; sources: AudioBufferSourceNode[]; out: GainNode } | null = null

function stormLevel(): number {
  return settings.storm ? SHELTER[shelter].level : 0
}

function startStorm(): void {
  if (!ctx || !master) return
  if (!storm) {
    const muffle = ctx.createBiquadFilter()
    muffle.type = 'lowpass'
    muffle.Q.value = 0.5
    muffle.frequency.value = SHELTER[shelter].reach
    const out = ctx.createGain()
    out.gain.value = 0
    muffle.connect(out).connect(master)
    storm = { muffle, out }
  }
  if (!settings.storm) return
  if (ambience === 'none') {
    stopAmbience()
    return
  }
  const layers = AMBIENCE[ambience]
  // Every part of it must be to hand before any of it starts.
  const missing = layers.filter((l) => !buffers.has(l.url))
  if (missing.length > 0) {
    const audio = ctx
    for (const l of missing) {
      if (asked.has(l.url)) continue
      asked.add(l.url)
      fetch(l.url)
        .then((r) => r.arrayBuffer())
        .then((data) => audio.decodeAudioData(data))
        .then((buffer) => {
          buffers.set(l.url, buffer)
          startStorm()
        })
        .catch(() => {
          // No weather, then; the game is none the worse.
        })
    }
    return
  }
  if (playingAmbience && playingAmbience.kind !== ambience) stopAmbience()
  if (!playingAmbience) {
    // In over a couple of seconds, as the last weather dies away: a crossfade.
    const out = ctx.createGain()
    out.gain.value = 0
    out.gain.setTargetAtTime(1, ctx.currentTime, 0.7)
    out.connect(storm.muffle)
    const sources = layers.map((l) => {
      const src = ctx!.createBufferSource()
      src.buffer = buffers.get(l.url)!
      const loop = LOOPS[l.url]
      src.loop = true
      src.loopStart = loop.start
      src.loopEnd = loop.start + loop.length
      const quiet = ctx!.createGain()
      quiet.gain.value = l.level
      src.connect(quiet).connect(out)
      // Not always from the top: the weather was going before you came.
      src.start(0, loop.start + Math.random() * loop.length)
      return src
    })
    playingAmbience = { kind: ambience, sources, out }
  }
  storm.out.gain.setTargetAtTime(stormLevel(), ctx.currentTime, 0.8)
}

/** Let what is playing die away over a couple of seconds. */
function stopAmbience(): void {
  if (!ctx || !playingAmbience) return
  const { sources, out } = playingAmbience
  out.gain.setTargetAtTime(0, ctx.currentTime, 0.6)
  for (const src of sources) src.stop(ctx.currentTime + 2.5)
  playingAmbience = null
}

/** A new setting: what is outside changes, over a couple of seconds. */
export function setAmbience(next: Ambience): void {
  if (ambience === next) return
  ambience = next
  if (!ctx || !storm) return
  if (settings.storm) startStorm()
}

/** Step indoors or out: the weather follows, over a second or so. */
export function setShelter(next: Shelter): void {
  shelter = next
  if (!ctx || !storm) return
  const now = ctx.currentTime
  storm.muffle.frequency.cancelScheduledValues(now)
  storm.muffle.frequency.setTargetAtTime(SHELTER[next].reach, now, 0.35)
  storm.out.gain.setTargetAtTime(stormLevel(), now, 0.35)
}

watch(
  () => settings.storm,
  (on) => {
    if (!ctx || !storm) return
    if (on) startStorm()
    else {
      storm.out.gain.setTargetAtTime(0, ctx.currentTime, 0.3)
      stopAmbience()
    }
  },
)

// ---------- music ----------

/**
 * What is playing: the night's tune, under the whole evening; or the final
 * hour's, from midnight until the truth is told. Both are Kevin MacLeod's.
 */
export type Tune = 'night' | 'midnight'

/** Under the voices and the storm, not over them. */
const MUSIC_LEVEL = 0.4

interface TuneTrack {
  url: string
  /** As `RAIN_LOOP`: the track itself, between its lead-in and lead-out. */
  loop: { start: number; length: number }
  /** Against the night's tune (1): the recordings were not made at one loudness. */
  level: number
  out: GainNode | null
  buffer: AudioBuffer | null
  asked: boolean
  playing: AudioBufferSourceNode | null
}
const track = (url: string, start: number, length: number, level = 1): TuneTrack => ({
  url,
  loop: { start, length },
  level,
  out: null,
  buffer: null,
  asked: false,
  playing: null,
})
const tunes: Record<Tune, TuneTrack> = {
  night: track(walkingAlongUrl, 0.25, 132.07381),
  // (Measured 7.4 LU louder than the night's tune, at -15.7 LUFS against -23.1: brought down to match.)
  midnight: track(gloomHorizonUrl, 0.25, 84.738209, 0.43),
}
/** The tune asked for: none, for a moment, as midnight strikes. */
let tune: Tune | null = 'night'

/**
 * Change the tune. Whatever was playing fades quickly and stops; the new one
 * starts from its beginning. With nothing, the music falls silent.
 */
export function playTune(next: Tune | null): void {
  if (next === tune) return
  tune = next
  if (!ctx) return
  for (const [name, t] of Object.entries(tunes) as [Tune, TuneTrack][]) {
    if (name === next || !t.playing || !t.out) continue
    t.out.gain.setTargetAtTime(0, ctx.currentTime, 0.25)
    t.playing.stop(ctx.currentTime + 1.5)
    t.playing = null
  }
  startMusic()
}

function startMusic(): void {
  if (!ctx || !master || !settings.music || !tune) return
  const t = tunes[tune]
  if (!t.out) {
    t.out = ctx.createGain()
    t.out.gain.value = 0
    t.out.connect(master)
  }
  if (!t.buffer) {
    if (t.asked) return
    t.asked = true
    const audio = ctx
    fetch(t.url)
      .then((r) => r.arrayBuffer())
      .then((data) => audio.decodeAudioData(data))
      .then((buffer) => {
        t.buffer = buffer
        startMusic()
      })
      .catch(() => {
        // No music, then; the game is none the worse.
      })
    return
  }
  if (!t.playing) {
    // (A fresh start from silence: anything left of a fade is let go.)
    t.out.gain.cancelScheduledValues(ctx.currentTime)
    t.out.gain.setValueAtTime(0, ctx.currentTime)
    t.playing = ctx.createBufferSource()
    t.playing.buffer = t.buffer
    t.playing.loop = true
    t.playing.loopStart = t.loop.start
    t.playing.loopEnd = t.loop.start + t.loop.length
    t.playing.connect(t.out)
    t.playing.start(0, t.loop.start)
  }
  t.out.gain.setTargetAtTime(MUSIC_LEVEL * t.level, ctx.currentTime, 0.6)
}

watch(
  () => settings.music,
  (on) => {
    if (!ctx) return
    if (on) startMusic()
    else {
      for (const t of Object.values(tunes)) {
        if (!t.out || !t.playing) continue
        t.out.gain.setTargetAtTime(0, ctx.currentTime, 0.3)
        t.playing.stop(ctx.currentTime + 2)
        t.playing = null
      }
    }
  },
)

// ---------- voices ----------

const DEFAULT_VOICE: VoiceDef = { pitch: 200, wave: 'triangle' }

/** Steps of a major pentatonic scale, in semitones: any of them sounds like a note. */
const SCALE = [-5, -3, 0, 2, 4, 7]

/**
 * One syllable of a character's voice: a short pitched blip under the text
 * as it is typed. Each blip lands on a note of a scale about the voice's own
 * pitch, so speech has a lilt and a low voice still sings rather than thuds.
 */
export function speak(voice: VoiceDef = DEFAULT_VOICE): void {
  if (!ctx || !master || level() === 0 || !settings.voices) return
  const t0 = ctx.currentTime
  const lilt = voice.lilt ?? 2
  const steps = SCALE.filter((s) => Math.abs(s) <= Math.max(2, lilt * 2))
  const freq = voice.pitch * 2 ** (steps[Math.floor(Math.random() * steps.length)] / 12)
  const dur = voice.clip ?? 0.06

  // Take the edge off the brighter waves, but never so far that a deep voice
  // loses the overtones that make it a note.
  const soften = ctx.createBiquadFilter()
  soften.type = 'lowpass'
  soften.frequency.value = Math.min(6000, Math.max(1800, freq * 6))
  soften.connect(master)

  const loud = (voice.wave === 'sine' || voice.wave === 'triangle' ? 0.16 : 0.07) * (voice.gain ?? 1)
  const sound = (hz: number, type: OscillatorType, peak: number, length: number) => {
    const osc = ctx!.createOscillator()
    osc.type = type
    osc.frequency.setValueAtTime(hz, t0)
    const g = ctx!.createGain()
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.006)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + length)
    osc.connect(g).connect(soften)
    osc.start(t0)
    osc.stop(t0 + length + 0.03)
  }

  sound(freq, voice.wave, loud, dur)
  // A ring: the same note an octave and a twelfth up, quieter and a little
  // longer, as a struck note has. It is what the ear takes the pitch from.
  const ring = voice.ring ?? 0
  if (ring > 0) {
    sound(freq * 2, 'sine', 0.12 * ring * (voice.gain ?? 1), dur * 1.5)
    sound(freq * 3, 'sine', 0.05 * ring * (voice.gain ?? 1), dur * 1.2)
  }
}

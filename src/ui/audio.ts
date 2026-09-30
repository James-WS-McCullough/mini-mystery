// The sounds of the game: the detective's own small noises (a page, a pen, a
// stamp), the voices of the household, and the storm. All but the rain is
// synthesised with WebAudio at play time; the rain, the music and the hour
// bell are recordings, looped (credited in the settings menu and the README).
// The storm is heard as from wherever the detective stands: plainly out of
// doors, and through the walls within.
//
// Browsers only allow audio after a user gesture, so nothing sounds until
// `unlock()` has been called from a click or key press.

import { watch } from 'vue'
import bellUrl from '../assets/bell.mp3'
import rainUrl from '../assets/rain-loop.mp3'
import musicUrl from '../assets/walking-along.mp3'
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

/** One note of a rather distant piano: harmonic partials that die at different rates, and a soft hammer. */
function pianoNote(freq: number, at: number, gain: number, dur: number): void {
  const partials: [number, number, number][] = [
    [1, 1, 1],
    [2, 0.5, 0.7],
    [3, 0.25, 0.5],
    [4, 0.12, 0.35],
    [5, 0.06, 0.25],
  ]
  for (const [ratio, amp, life] of partials) {
    tone({ freq: freq * ratio, at, dur: dur * life, gain: gain * amp, attack: 0.004 })
  }
  burst({ at, dur: 0.02, gain: gain * 0.25, filter: 'lowpass', freq: 1800 })
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

// ---------- the storm ----------

/** Where the detective stands, as the weather hears it. */
export type Shelter = 'outside' | 'glass' | 'inside'

/**
 * The stretch of the recording that repeats, in seconds. The file carries a
 * little of the loop on either side of it (scripts/make-rain-loop.sh), so the
 * silence an mp3 decodes with at its edges is never played.
 */
const RAIN_LOOP = { start: 0.25, length: 168.417667 }

/** How much of the storm gets through: the filter's reach, and the level. */
const SHELTER: Record<Shelter, { reach: number; level: number }> = {
  outside: { reach: 18000, level: 0.5 },
  glass: { reach: 2600, level: 0.5 },
  inside: { reach: 520, level: 0.55 },
}

/** The rain's own level, under the thunder's. */
const RAIN_LEVEL = 0.5

let storm: { muffle: BiquadFilterNode; out: GainNode } | null = null
let shelter: Shelter = 'outside'
let rain: AudioBuffer | null = null
let rainAsked = false
let raining: AudioBufferSourceNode | null = null

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
  if (!rain) {
    if (rainAsked) return
    rainAsked = true
    const audio = ctx
    fetch(rainUrl)
      .then((r) => r.arrayBuffer())
      .then((data) => audio.decodeAudioData(data))
      .then((buffer) => {
        rain = buffer
        startStorm()
      })
      .catch(() => {
        // No rain, then; the game is none the worse.
      })
    return
  }
  if (!raining) {
    raining = ctx.createBufferSource()
    raining.buffer = rain
    raining.loop = true
    raining.loopStart = RAIN_LOOP.start
    raining.loopEnd = RAIN_LOOP.start + RAIN_LOOP.length
    const quiet = ctx.createGain()
    quiet.gain.value = RAIN_LEVEL
    raining.connect(quiet).connect(storm.muffle)
    // Not always from the top: the storm was going before you came.
    raining.start(0, RAIN_LOOP.start + Math.random() * RAIN_LOOP.length)
  }
  storm.out.gain.setTargetAtTime(stormLevel(), ctx.currentTime, 0.8)
}

/** Step indoors or out: the storm follows, over a second or so. */
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
      raining?.stop(ctx.currentTime + 2)
      raining = null
    }
  },
)

// ---------- music ----------

/** As `RAIN_LOOP`: the track itself, between its lead-in and lead-out. */
const MUSIC_LOOP = { start: 0.25, length: 132.07381 }
/** Under the voices and the storm, not over them. */
const MUSIC_LEVEL = 0.4

let musicOut: GainNode | null = null
let music: AudioBuffer | null = null
let musicAsked = false
let playing: AudioBufferSourceNode | null = null

function startMusic(): void {
  if (!ctx || !master || !settings.music) return
  if (!musicOut) {
    musicOut = ctx.createGain()
    musicOut.gain.value = 0
    musicOut.connect(master)
  }
  if (!music) {
    if (musicAsked) return
    musicAsked = true
    const audio = ctx
    fetch(musicUrl)
      .then((r) => r.arrayBuffer())
      .then((data) => audio.decodeAudioData(data))
      .then((buffer) => {
        music = buffer
        startMusic()
      })
      .catch(() => {
        // No music, then; the game is none the worse.
      })
    return
  }
  if (!playing) {
    playing = ctx.createBufferSource()
    playing.buffer = music
    playing.loop = true
    playing.loopStart = MUSIC_LOOP.start
    playing.loopEnd = MUSIC_LOOP.start + MUSIC_LOOP.length
    playing.connect(musicOut)
    playing.start(0, MUSIC_LOOP.start)
  }
  musicOut.gain.setTargetAtTime(MUSIC_LEVEL, ctx.currentTime, 0.6)
}

watch(
  () => settings.music,
  (on) => {
    if (!ctx) return
    if (on) startMusic()
    else if (musicOut) {
      musicOut.gain.setTargetAtTime(0, ctx.currentTime, 0.3)
      playing?.stop(ctx.currentTime + 2)
      playing = null
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

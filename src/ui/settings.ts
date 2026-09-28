// Player preferences, persisted per browser. Presentation only — nothing here
// may influence the mystery itself.

import { reactive, watch } from 'vue'
import type { Address } from '../engine/address'
import { readJson, writeJson } from './storage'

export type TextSpeed = 'slow' | 'normal' | 'fast' | 'instant'

export interface Settings {
  /** Master volume, 0..1. */
  volume: number
  muted: boolean
  /** The household's voices, blipping under their words as they are typed. */
  voices: boolean
  /** The background music. */
  music: boolean
  /** Rain and thunder, heard from wherever the detective stands. */
  storm: boolean
  textSpeed: TextSpeed
  reducedMotion: boolean
  /** What the household calls the player. */
  address: Address
}

const KEY = 'mini-mystery:settings'

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

const DEFAULTS: Settings = {
  volume: 0.7,
  muted: false,
  voices: true,
  storm: true,
  music: true,
  textSpeed: 'normal',
  reducedMotion: prefersReducedMotion(),
  address: 'plain',
}

export const settings = reactive<Settings>({ ...DEFAULTS, ...readJson<Partial<Settings>>(KEY, {}) })

watch(settings, (s) => writeJson(KEY, s), { deep: true })

/** The forms of address, as the player is offered them. */
export const ADDRESS_CHOICES: { id: Address; label: string; text: string }[] = [
  { id: 'sir', label: 'Sir', text: '“Sir”, and “Mr Detective”' },
  { id: 'plain', label: 'Detective', text: 'Plain “detective”, from everyone' },
  { id: 'maam', label: 'Ma’am', text: '“Ma’am”, and “Mrs Detective”' },
]

/** Milliseconds per character for the dialogue typewriter. */
export function charDelay(speed: TextSpeed): number {
  switch (speed) {
    case 'slow':
      return 42
    case 'normal':
      return 22
    case 'fast':
      return 9
    case 'instant':
      return 0
  }
}

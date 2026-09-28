// Player preferences, persisted per browser. Presentation only — nothing here
// may influence the mystery itself.

import { reactive, watch } from 'vue'
import { readJson, writeJson } from './storage'

export type TextSpeed = 'slow' | 'normal' | 'fast' | 'instant'

export interface Settings {
  /** Master volume, 0..1. */
  volume: number
  muted: boolean
  /** The rain-and-clock ambience loop. */
  ambience: boolean
  textSpeed: TextSpeed
  reducedMotion: boolean
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
  ambience: true,
  textSpeed: 'normal',
  reducedMotion: prefersReducedMotion(),
}

export const settings = reactive<Settings>({ ...DEFAULTS, ...readJson<Partial<Settings>>(KEY, {}) })

watch(settings, (s) => writeJson(KEY, s), { deep: true })

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

// Sergeant Pike's lessons. A tutorial is a list of steps: each is due when the
// night has reached a certain point, is spoken once, and some of them are then
// kept up as a task until the detective has done as asked. What glows on the
// page and what is barred follow from which steps are done. The steps read the
// night through a small view (TutorView), so a lesson knows nothing of the
// store, and a test can hand it a night of its own.

import type { SettingPack } from '../content/schema'
import type { CastMember, CharId, Mystery, QuestionKey, RoomId } from '../engine/types'
import type { Pillars } from '../engine/verdict'
import type { Phase, Stage } from '../stores/night/shared'

export type TutorialId = 'first-case'

/** A question as a lesson names it: one of the questions, or the pressing. */
export type Asked = QuestionKey['kind'] | 'press'

/** The night, as a lesson reads it. */
export interface TutorView {
  phase: Phase
  stage: Stage
  round: number
  mystery: Mystery
  pack: SettingPack
  cast: CastMember[]
  /** The rooms searched so far. */
  searched: RoomId[]
  /** The exhibits in hand. */
  found: string[]
  /** Who is in the chair, if anybody. */
  activeChar: CharId | null
  questionsLeft: number
  /** The detective's own marks against a guest. */
  signsOf(c: CharId): Pillars
  /** Has this been put to them? */
  asked(c: CharId, q: Asked): boolean
  /** Who has owned to something under pressing. */
  confessed: CharId[]
  /** Contradictions in the notebook, drawn or not; those drawn; and those still to draw. */
  contradictions: number
  drawn: number
  undrawn: number
  /** Whom a drawn contradiction stands against. */
  pressable: CharId[]
  /** Whom the detective has struck off the list. */
  struck: CharId[]
  /** Whom the detective has named on the accusation screen. */
  accused: CharId | null
  /** On the accusation screen: the household has had its say, and the board is up. */
  gathered: boolean
  /** What the case board shows against a guest, from what is pinned. */
  shown(c: CharId): Pillars
  /** Has the lesson's step been spoken; has its task been done? */
  seen(step: string): boolean
  done(step: string): boolean
}

export interface TutorStep {
  id: string
  /** Due: Pike speaks, once, the first time this holds. */
  when: (v: TutorView) => boolean
  /** What he says, a line at a time. Slots: {sir}, and the lesson's own. */
  lines: (v: TutorView) => string[]
  /** A beat before he speaks, where the page is still settling (ms). */
  delay?: number
  /** Kept up after he has spoken, until `until` holds: a word on what is wanted, live. */
  task?: (v: TutorView) => string
  until?: (v: TutorView) => boolean
  /** What glows, while he speaks and while the task is up: spot names (see v-spot). */
  lit?: (v: TutorView) => string[]
}

/** What the detective may do: null for anything. */
export interface TutorLocks {
  rooms: RoomId[] | null
  guests: CharId[] | null
  questions: Asked[] | null
  compare: boolean
  strike: boolean
  accuse: boolean
  skipSearch: boolean
  /** Pointing the finger, once on the accusation screen. */
  submit: boolean
}

export const OPEN: TutorLocks = {
  rooms: null,
  guests: null,
  questions: null,
  compare: true,
  strike: true,
  accuse: true,
  skipSearch: true,
  submit: true,
}

export interface Tutorial {
  id: TutorialId
  steps: TutorStep[]
  locks: (v: TutorView) => TutorLocks
  /** The lesson's own slots: the scene, the weapon, whoever is cleared. */
  slots: (v: TutorView) => Record<string, string>
}

/** The weapon found, if it has been. */
export function weaponOf(v: TutorView) {
  const item = v.mystery.evidence.find((e) => e.fact.kind === 'weapon' && v.found.includes(e.id))
  return item && item.fact.kind === 'weapon' ? { item, means: item.fact.means } : null
}

/** What the means mark under each name should say, by the sheets, once the weapon is known. */
export function meansDue(v: TutorView): Map<CharId, 'established' | 'ruledOut'> | null {
  const weapon = weaponOf(v)
  if (!weapon) return null
  return new Map(v.cast.map((c) => [c.id, c.means.includes(weapon.means) ? 'established' : 'ruledOut']))
}

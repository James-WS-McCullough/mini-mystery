// The Evening Timeline (playtest): the murder is a moment in a whole evening.
// The detective arrives the following night and asks what happened last night;
// every guest's account is a run of half-hour slots, each sentence a claim with
// a time on it. Nothing here is shared with the hour-long game's engine but the
// content packs, the dice and the house rules (liars lie alone, a whole account
// from the honest), so the existing game is untouched.

import type { Pronouns } from '../types'

/** A guest at the table: who they are, and nothing dealt. */
export interface TGuest {
  id: number
  defId: string
  name: string
  shortName: string
  title: string
  portrait: string
  pronouns: Pronouns
}

/** Half-hour slots of last night: 0 is seven o'clock, 7 is half past ten. */
export const SLOTS = 8
export const SLOT_WORDS = ['seven', 'half past seven', 'eight', 'half past eight', 'nine', 'half past nine', 'ten', 'half past ten', 'eleven'] as const
export const SLOT_CLOCK = ['7:00', '7:30', '8:00', '8:30', '9:00', '9:30', '10:00', '10:30'] as const

/** Who is who, as the dealing decides it: one murderer, one with a secret of their own, and the honest. */
export type TimelineRole = 'murderer' | 'secretive' | 'witness' | 'discoverer' | 'guest'

/** A room of the house, or a guest's own bedroom upstairs: `bed:<CharId>`. */
export type Place = string

/** The victim, as an entry in company lists and sightings. */
export const VICTIM = -1

/**
 * What a guest says, each a structured fact with a time on it. Prose is
 * rendered from these and never adds to them.
 */
export type TClaim =
  /** "From <from> to <to> I was in <room>, with <with>": every slot from..to, and nobody else there. */
  | { kind: 'stay'; from: number; to: number; room: Place; with: number[]; owned?: boolean }
  /** "At <slot> I saw <target> in <room>." */
  | { kind: 'saw'; slot: number; target: number; room: Place }
  /** "The last I saw of him, he was in <room> at <slot>, alive." */
  | { kind: 'lastSeen'; slot: number; room: Place }
  /** "I went into <room> at <slot>, and found him dead." */
  | { kind: 'found'; slot: number; room: Place }
  /** "I looked into <room> at <slot>: nobody was there." */
  | { kind: 'empty'; slot: number; room: Place }

export interface TSpoken {
  speaker: number
  claim: TClaim
}

/** What is to be found by searching, or printed on the case sheet. */
export interface TEvidence {
  id: string
  room: Place
  name: string
  /** What it proves about the time of death: no earlier than, no later than (slots). */
  earliest?: number
  latest?: number
  /** Put in front of the detective from the start: the doctor's note on the case sheet. */
  plain?: boolean
}

export interface TimelineTruth {
  roles: TimelineRole[]
  /** schedule[c][slot]: where each guest truly was. */
  schedule: Place[][]
  /** The victim's evening, to the slot he died in (null after). */
  victim: (Place | null)[]
  murderSlot: number
  /** The slot the body was found in, and by whom. */
  foundSlot: number
  finder: number
  scene: Place
  /** What the guest with a secret was hiding: the slots, and what they were doing. */
  secret?: { by: number; slots: number[]; what: string }
}

/** What each guest says when asked, already dealt. */
export interface TAccount {
  /** "What happened last night?": their whole evening, as told. */
  evening: TClaim[]
  /** "When did you last see him?" */
  lastSeen: TClaim[]
  /** Pressed on a contradiction: what they give up (empty: they stand by their story). */
  pressed: TClaim[]
  /** What they say as they give it up, or as they refuse. */
  pressLine: string
}

export type Difficulty = 'easy' | 'normal' | 'hard'

export interface TimelineCase {
  seed: number
  difficulty: Difficulty
  packId: string
  cast: TGuest[]
  victimName: string
  victimShort: string
  /** He/she, for the words. */
  victimPronouns: 'he' | 'she' | 'they'
  /** The rooms of the house, and the bedrooms upstairs (one a guest). */
  rooms: { id: Place; name: string; where?: string; bed?: number }[]
  scene: Place
  truth: TimelineTruth
  accounts: TAccount[]
  evidence: TEvidence[]
  /** How many keep a secret of their own beside the murderer (public: on the case sheet). */
  secretive: number
  /** The bot's run: how many questions and searches it needed. */
  solution: { questions: number; searches: number; steps: string[] }
}

/** A contradiction between two things said: who it stands against. */
export interface TContradiction {
  key: string
  reason: 'unseen-company' | 'company-not-returned' | 'seen-elsewhere' | 'said-empty'
  /** The two statements, by their index in the heard list. */
  a: number
  b: number
  implicated: number[]
  slot: number
}

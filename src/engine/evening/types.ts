// The Evening Timeline, as a variant of the ordinary night: the night is dealt
// just as always, and then the whole afternoon and evening around it. The
// detective is not told when it was done. Every guest's "where were you?"
// becomes "what happened last night?": an account of every hour, and the hour
// it was done is in there among the others, told truly or not, just as the
// ordinary night has it. Find out when it was done (the last anybody saw him,
// the doctor, a smashed watch), and their accounts of that hour are the
// alibis the rest of the night is played on.

import type { CharId, ItemId, RoomId } from '../types'

/** Hours of the evening, one a slot; the last is the hour the setting's window names. */
export const EVENING_SLOTS = 5

/** Somewhere a guest may be: a room of the place, or their own room, alone. */
export type EPlace = RoomId | typeof UPSTAIRS
export const UPSTAIRS = 'upstairs'

/** The victim, in a company list. */
export const EVICTIM = -1

/**
 * What a guest says of the evening, each with its hours on it. Prose is
 * rendered from these and never adds to them.
 */
export type EClaim =
  /** "From <from> until <to + 1> I was in <room>, with <with>": every hour from..to, nobody else there. */
  | { kind: 'stay'; from: number; to: number; room: EPlace; with: number[] }
  /** "I could not tell you where I was, from <from> to <to + 1>." */
  | { kind: 'blank'; from: number; to: number }
  /** "The last I saw of him was at <slot>, in <room>" — or, `left`, "he left <room> at <slot>". */
  | { kind: 'lastSeen'; slot: number; room: RoomId; left?: boolean }
  /** "At <time> I heard a cry from somewhere in the house": it was done by then. */
  | { kind: 'heard'; slot: number; time: string }

export interface Evening {
  /** "2:30", one for each hour and one past the last (when the evening ends). */
  clock: string[]
  /** "half past two", likewise. */
  words: string[]
  /** The hour it was done in: the one the ordinary night is about. */
  murder: number
  /** Where each guest truly was, hour by hour. */
  schedule: EPlace[][]
  /** Where the victim was, hour by hour, to the hour it was done. */
  victim: (RoomId | null)[]
  /** Each guest's evening, as they tell it. */
  told: EClaim[][]
  /** The doctor's word on the case sheet: dead by the end of this hour. */
  latest: number
  /** A watch smashed in the struggle, stopped at the time: an item in the room, and the hour it says. */
  watch: { item: ItemId; slot: number; time: string } | null
}

/** One account heard: who said it, and the claim. */
export interface EHeard {
  id: number
  speaker: CharId
  claim: EClaim
}

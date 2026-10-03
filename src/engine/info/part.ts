// What a part with something to tell does with it, beyond knowing it: what a
// liar passing for it says, what the Drunk believing themself it says, and what
// the Careful Murderer passing for it tells truly. One module per part (see
// index.ts); policy.ts and the dealing ask here.

import { liesAboutWhereabouts } from '../deck'
import type { AfterEvidence, AfterParts } from '../dealing/night'
import type { Ties } from '../dealing/ties'
import type { Rng } from '../rng'
import type { CastMember, CharId, Claim, Relationship, RoleId, RoomId } from '../types'
import { otherSex, type Sex } from '../types'

/** The night, as one telling of a part sees it. */
export interface Telling {
  rng: Rng
  cast: CastMember[]
  roles: RoleId[]
  relationships: Relationship[]
  /** Whoever is telling it. */
  speaker: CharId
  /** The murderer (-1 where there is none). */
  culprit: CharId
  sceneRoom: RoomId
  /** Per CharId: the motives that person could have. A lie is a likely story. */
  fitting: Relationship[][]
  /** On a night with a passage: where it might run, where it does, and whether the murderer went by it. */
  passage?: { rooms: RoomId[]; truly: RoomId; used: boolean }
  /** Who was truly in the corridor after, if anybody was seen there. */
  corridor: CharId | null
  /** The rooms, which of them somebody truly spent the hour in, and where each guest was. */
  rooms?: { all: RoomId[]; used: ReadonlySet<RoomId>; at?: readonly RoomId[] }
}

/** The Careful Murderer's telling: the truth of the night to choose from, and what others are tied to. */
export interface CarefulTelling {
  rng: Rng
  cast: CastMember[]
  roles: RoleId[]
  relationships: Relationship[]
  culprit: CharId
  sceneRoom: RoomId
  locations: readonly RoomId[]
  passageRoom: RoomId | null
  ties: Ties
  /** Everybody but the Careful Murderer. */
  others: CharId[]
}

/** The night once the liars' stories are told: where each says they were, and with whom. */
export type AfterTheLies = AfterParts & { lies: ReadonlyMap<CharId, { room: RoomId; companions: CharId[] }> }

export interface InfoPart {
  /** What the part truly knows, dealt with the rest of what is known (see KNOWN_IN_TURN). */
  knows?(night: AfterEvidence, me: CharId): Claim | null
  /** What the part truly knows of the liars' stories, dealt once they are told. */
  knowsOfTheLies?(night: AfterTheLies, me: CharId): Claim | null
  /** What one passing for the part falsely says they know. Never truly incriminates the murderer. */
  fabricate(t: Telling): Claim | null
  /** What the Drunk, believing themself the part, says: sincere, and wrong. */
  corrupt?(t: Telling): Claim
  /** What the Careful Murderer, passing for the part, tells truly without naming themselves. */
  careful?(t: CarefulTelling): Claim | null
}

// ---- accomplices the parts share ----

/** Two of the household the Steward had an eye on: anybody but themselves (and `without`). */
export function watched(rng: Rng, cast: CastMember[], speaker: CharId, without: CharId[] = []): [CharId, CharId] {
  const [a, b] = rng
    .sample(
      cast.map((m) => m.id).filter((c) => c !== speaker && !without.includes(c)),
      2,
    )
    .sort((x, y) => x - y)
  return [a, b]
}

/** How many of two of the household are lying about the hour — got wrong. */
export function wrongCount(rng: Rng, cast: CastMember[], roles: RoleId[], speaker: CharId): Claim {
  const pair = watched(rng, cast, speaker)
  const truly = pair.filter((c) => liesAboutWhereabouts(roles[c])).length
  return { kind: 'liarsAmong', pair, count: rng.pick([0, 1, 2].filter((k) => k !== truly)) }
}

/** The sex the murderer is not — if the murderer is a man or a woman, and there is one. */
export function wrongSex(cast: CastMember[], culprit: CharId): Sex | null {
  if (culprit < 0) return null
  const theirs = cast[culprit].pronouns
  return theirs === 'they' ? null : otherSex(theirs)
}

/** Three of the household, in seat order, none of them from `without`. */
export function shortlist(rng: Rng, cast: CastMember[], without: CharId[]): CharId[] {
  const pool = cast.map((m) => m.id).filter((c) => !without.includes(c))
  return rng.sample(pool, 3).sort((a, b) => a - b)
}

/** Habits that are not the murderer's, nor (where said) the speaker's own. */
export function safeTraits(cast: CastMember[], culprit: CharId, speaker?: CharId): string[] {
  return [...new Set(cast.map((m) => m.trait))].filter(
    (t) => (culprit < 0 || t !== cast[culprit].trait) && (speaker === undefined || t !== cast[speaker].trait),
  )
}

// One phase of dealing a night (see generate.ts).

import { INFO, KNOWN_OF_THE_LIES } from '../info'
import { truthClassOf } from '../deck'
import { LIE_IN_TURN, LiarPart, partOf } from '../parts'
import type { CharId, RoomId } from '../types'
import type { AfterParts } from './night'

/** The night as the liars see it, telling where they were (see Part.lie). */
export type Lying = AfterParts & {
  /** Where each liar says they were, and with whom, as they are told. */
  lies: Map<CharId, { room: RoomId; companions: CharId[] }>
  /** Rooms where somebody honest truly spent the hour alone, and will say so. */
  kept: RoomId[]
  /** Rooms somebody truly spent the hour in. */
  occupiedRooms: Set<RoomId>
}

/** Where the liars say they were; and what is known of the rooms and pairs that tells against them. */
export function tellLies(night: AfterParts) {
  const {
    rng, roles, culprit, cast, careful, amnesiac, locations, companions, knowledge, committeeLies, ties, kind,
  } = night
  const occupiedRooms = new Set(locations.filter((r) => r !== ''))
  const lies = new Map<CharId, { room: RoomId; companions: CharId[] }>(committeeLies)
  /** Rooms where somebody honest truly spent the hour alone, and will say so. */
  const kept = rng.shuffle(
    cast
      .map((m) => m.id)
      .filter(
        (c) => truthClassOf(roles[c]) === 'honest' && c !== amnesiac && ties.free(c, 'keptRoom') && companions[c].length === 0,
      )
      .map((c) => locations[c]),
  )
  // The liars whose lie is their own, each in turn; then everybody else who lies, alone.
  const lying: Lying = { ...night, lies, kept, occupiedRooms }
  for (const [role, step] of LIE_IN_TURN) {
    const me = roles.indexOf(role)
    if (me < 0) continue
    const failed = partOf(role, kind)[step]?.(lying, me)
    if (failed) return failed
  }
  const whispered = ties.holding(['whispered'])[0] ?? -1
  const loneLiars = cast
    .map((m) => m.id)
    .filter((c) => truthClassOf(roles[c]) === 'concealer' && !lies.has(c))
    // (The Careful Murderer chooses first, and nobody else chooses the same.)
    .sort((a, b) => Number(careful && b === culprit) - Number(careful && a === culprit))
  for (const c of loneLiars) {
    const part = partOf(roles[c], kind)
    const failed = part instanceof LiarPart ? part.lieAlone(lying, c) : undefined
    if (failed) return failed
  }

  // What the parts that know the rooms, and the pairs, make of the stories told.
  for (const role of KNOWN_OF_THE_LIES) {
    const me = roles.indexOf(role)
    const known = me >= 0 ? INFO[role]!.knowsOfTheLies!({ ...night, lies }, me) : null
    if (known) knowledge[me].push(known)
  }

  return { occupiedRooms, lies, kept, whispered, loneLiars }
}

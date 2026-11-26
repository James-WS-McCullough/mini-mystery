// Where everybody is at one hour, by what has been said, and what will not
// fit: the plan the timeline shows for a tapped hour, and the one that moves
// as a guest tells their evening.

import { EVICTIM, type EHeard, type EPlace } from './types'

export interface Placement {
  who: number
  /** Whose word puts them there: their own, or another's. */
  by: number
  own: boolean
}

export interface SlotView {
  /** place → who is placed there, and on whose word. */
  rooms: Map<EPlace, Placement[]>
  /** Those placed in two rooms at once. */
  doubled: Set<number>
  /** Rooms where somebody said they were alone, or did not name somebody else placed there. */
  clashes: Map<EPlace, string[]>
}

export function slotView(heard: readonly EHeard[], slot: number, name: (c: number) => string): SlotView {
  const rooms = new Map<EPlace, Placement[]>()
  const put = (room: EPlace, who: number, by: number) => {
    const list = rooms.get(room) ?? []
    if (!list.some((x) => x.who === who && x.by === by)) list.push({ who, by, own: who === by })
    rooms.set(room, list)
  }
  for (const { speaker, claim } of heard) {
    if (claim.kind === 'stay' && slot >= claim.from && slot <= claim.to) {
      // (Everybody in their own room is somewhere different: upstairs is not one room.)
      put(claim.room, speaker, speaker)
      for (const w of claim.with) if (w !== speaker) put(claim.room, w, speaker)
    }
    if (claim.kind === 'lastSeen' && claim.slot - (claim.left ? 1 : 0) === slot) put(claim.room, EVICTIM, speaker)
  }
  const where = new Map<number, Set<EPlace>>()
  for (const [room, list] of rooms) for (const p of list) where.set(p.who, (where.get(p.who) ?? new Set()).add(room))
  const doubled = new Set([...where].filter(([, r]) => r.size > 1).map(([c]) => c))
  // An account of a room is whole: anybody else placed there, and not named, will not fit.
  const clashes = new Map<EPlace, string[]>()
  for (const { speaker, claim } of heard) {
    if (claim.kind !== 'stay' || slot < claim.from || slot > claim.to || claim.room === 'upstairs') continue
    const others = (rooms.get(claim.room) ?? []).map((p) => p.who).filter((w, i, all) => w !== speaker && all.indexOf(w) === i)
    const missing = others.filter((w) => !claim.with.includes(w))
    if (missing.length === 0) continue
    const note =
      claim.with.length === 0
        ? `${name(speaker)} says they were alone here`
        : `${name(speaker)} does not name ${missing.map(name).join(' or ')}`
    clashes.set(claim.room, [...(clashes.get(claim.room) ?? []), note])
  }
  return { rooms, doubled, clashes }
}

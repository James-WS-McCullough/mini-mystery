// Who is where at one half hour, as pins on the house plan: from the board's
// half-hour view and from a statement being told alike. Whoever will not fit
// (placed in two rooms at once, or in a room where somebody's whole account of
// it leaves them out) is flagged.

import type { SettingPack } from '../../content/schema'
import type { SlotView } from '../../engine/timeline/board'
import type { Placement } from '../../ui/placements'

export function pinsOf(view: SlotView, pack: SettingPack, name: (c: number) => string): Placement[] {
  const out: Placement[] = []
  for (const [room, list] of view.rooms) {
    // (Upstairs is on no plan of the ground floor.)
    if (!pack.rooms.some((r) => r.id === room)) continue
    for (const who of new Set(list.map((p) => p.who))) {
      out.push({
        key: `${who}@${room}`,
        room,
        kind: 'person',
        char: who,
        accounts: list.filter((p) => p.who === who).map((p) => (p.own ? `${name(who)}, on their own word` : `on ${name(p.by)}’s word`)),
        noteIds: [],
      })
    }
  }
  return out
}

/** Whether a pin will not fit with the rest of what has been said. */
export function clashes(view: SlotView, p: Placement): boolean {
  return (p.char !== undefined && view.doubled.has(p.char)) || view.clashes.has(p.room)
}

/** Who is upstairs at the half hour, in whose room. */
export function upstairsOf(view: SlotView, pack: SettingPack): { who: number; room: string }[] {
  const out: { who: number; room: string }[] = []
  for (const [room, list] of view.rooms) {
    if (pack.rooms.some((r) => r.id === room)) continue
    for (const who of new Set(list.map((p) => p.who))) out.push({ who, room })
  }
  return out
}

// Who is where at one hour, as pins on the plan: from the timeline's hour
// view and from an evening being told alike. Whoever will not fit (placed in
// two rooms at once, or in a room where somebody's whole account of it
// leaves them out) is flagged.

import type { SettingPack } from '../../content/schema'
import type { SlotView } from '../../engine/evening/board'
import { UPSTAIRS } from '../../engine/evening/types'
import type { Placement } from '../../ui/placements'

export function pinsOf(view: SlotView, pack: SettingPack, name: (c: number) => string): Placement[] {
  const out: Placement[] = []
  for (const [room, list] of view.rooms) {
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

/** Who is in their own room at the hour, off the plan. */
export function upstairsOf(view: SlotView): number[] {
  return [...new Set((view.rooms.get(UPSTAIRS) ?? []).map((p) => p.who))]
}

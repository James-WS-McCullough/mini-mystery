// Who the detective's notes put where. Read straight off the notebook, so the
// plan of the house shows only what has actually been said — and says who
// said it. Nothing here judges a claim true or false: two accounts that
// cannot both stand simply appear side by side, for the detective to notice.

import { describeClaim, type RenderCtx } from '../engine/render'
import type { AttrRef, CharId, RoomId, SoundKind } from '../engine/types'
import type { NoteEntry } from '../stores/game'

export interface Placement {
  key: string
  room: RoomId
  kind: 'person' | 'glimpse' | 'sound'
  /** Set for `person`. */
  char?: CharId
  /** Set for `glimpse`: all that was seen of them. */
  attr?: AttrRef
  /** Set for `sound`. */
  sound?: SoundKind
  /** One line per note that puts them here: "the Colonel — says …". */
  accounts: string[]
  noteIds: string[]
}

export function placementsFrom(notebook: readonly NoteEntry[], ctx: RenderCtx): Placement[] {
  const byKey = new Map<string, Placement>()
  const name = (id: CharId) => ctx.mystery.cast[id]?.shortName ?? ''

  function put(n: NoteEntry, key: string, base: Omit<Placement, 'key' | 'accounts' | 'noteIds'>) {
    let p = byKey.get(key)
    if (!p) {
      p = { key, ...base, accounts: [], noteIds: [] }
      byKey.set(key, p)
    }
    if (p.noteIds.includes(n.id)) return
    p.noteIds.push(n.id)
    p.accounts.push(`${name(n.speaker)}: ${describeClaim(ctx, n.speaker, n.claim)}`)
  }

  for (const n of notebook) {
    const c = n.claim
    switch (c.kind) {
      case 'whereabouts':
        put(n, `p|${n.speaker}|${c.room}`, { room: c.room, kind: 'person', char: n.speaker })
        for (const other of c.companions) {
          put(n, `p|${other}|${c.room}`, { room: c.room, kind: 'person', char: other })
        }
        break
      case 'sighting':
        put(n, `p|${c.target}|${c.room}`, { room: c.room, kind: 'person', char: c.target })
        break
      case 'glimpse':
        put(n, `g|${JSON.stringify(c.attr)}|${c.room}`, {
          room: c.room,
          kind: 'glimpse',
          attr: c.attr,
        })
        break
      case 'heard':
        put(n, `s|${c.sound}|${c.room}`, { room: c.room, kind: 'sound', sound: c.sound })
        break
    }
  }
  return [...byKey.values()]
}

// Two things said that cannot both be the whole truth, slot by slot: what the
// detective pairs on the board, and what lets them press a guest. Every one is
// found here from the words alone, so a pairing the player makes is checked
// against this list.

import { VICTIM, type TContradiction, type TSpoken } from './types'

type Stay = TSpoken & { claim: { kind: 'stay' } }

/** The slots two stretches share. */
function overlap(a: Stay['claim'], b: Stay['claim']): number[] {
  const out: number[] = []
  for (let t = Math.max(a.from, b.from); t <= Math.min(a.to, b.to); t++) out.push(t)
  return out
}

export function findContradictions(heard: readonly TSpoken[]): TContradiction[] {
  const out: TContradiction[] = []
  const add = (c: Omit<TContradiction, 'key'>) => {
    const key = `${c.reason}:${Math.min(c.a, c.b)}:${Math.max(c.a, c.b)}`
    if (!out.some((x) => x.key === key)) out.push({ ...c, key })
  }
  heard.forEach((x, i) => {
    heard.forEach((y, j) => {
      if (i === j || x.speaker === y.speaker) return
      // Two in the same room at the same time, and one does not name the other.
      if (x.claim.kind === 'stay' && y.claim.kind === 'stay' && i < j && x.claim.room === y.claim.room) {
        const shared = overlap(x.claim, y.claim)
        if (shared.length === 0) return
        const xNames = x.claim.with.includes(y.speaker)
        const yNames = y.claim.with.includes(x.speaker)
        if (xNames && yNames) return
        add({
          reason: !xNames && !yNames ? 'unseen-company' : 'company-not-returned',
          a: i,
          b: j,
          implicated: [x.speaker, y.speaker],
          slot: shared[0],
        })
      }
      // Somebody says they were with a guest who puts themselves somewhere else.
      if (x.claim.kind === 'stay' && y.claim.kind === 'stay' && x.claim.with.includes(y.speaker) && x.claim.room !== y.claim.room) {
        const shared = overlap(x.claim, y.claim)
        if (shared.length > 0) {
          add({ reason: 'company-not-returned', a: i, b: j, implicated: [x.speaker, y.speaker], slot: shared[0] })
        }
      }
      // Seen in one room by somebody, and in another by their own account.
      if (x.claim.kind === 'saw' && x.claim.target !== VICTIM && y.claim.kind === 'stay' && y.speaker === x.claim.target) {
        const { slot, room } = x.claim
        if (slot >= y.claim.from && slot <= y.claim.to && room !== y.claim.room) {
          add({ reason: 'seen-elsewhere', a: i, b: j, implicated: [x.speaker, y.speaker], slot })
        }
      }
      // A room said to have stood empty, and somebody who says they were in it.
      if (x.claim.kind === 'empty' && y.claim.kind === 'stay' && y.claim.room === x.claim.room) {
        const { slot } = x.claim
        if (slot >= y.claim.from && slot <= y.claim.to) {
          add({ reason: 'said-empty', a: i, b: j, implicated: [x.speaker, y.speaker], slot })
        }
      }
    })
  })
  return out
}

/** The contradiction a pair of statements makes, if any (either order). */
export function pairOf(list: readonly TContradiction[], a: number, b: number): TContradiction | undefined {
  return list.find((c) => (c.a === a && c.b === b) || (c.a === b && c.b === a))
}

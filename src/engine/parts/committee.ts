// The Committee: four (or however many make a majority) who did it together,
// and agreed one story between them before you came.

import type { GenFailure } from '../dealing/night'
import { CONCEALER_STRATEGIES, motivesOf } from '../dealing/night'
import type { Passing } from '../dealing/parts'
import type { Suspecting } from '../dealing/suspicion'
import type { CharId, RoleId } from '../types'
import { LiarPart, type Bluff } from './part'

/** One of the Committee: tells the story they agreed, as the part they agreed. */
export class CommitteeMember extends LiarPart {
  readonly bluff: Bluff = { kind: 'agreed' }

  /**
   * The story, agreed beforehand by all of them (settled once, by the first):
   * where each was and who each is. It holds between them: pairs who vouch
   * for each other, and those alone seen where they say by another of them, or
   * borne out by a trace one of them hands over as the Collector. It breaks
   * only against the honest: a room one of them truly had, a part one of them
   * truly plays. And they put it on one of the honest: seen at the scene, and
   * with a grudge, so they say; who has an alibi of their own, and a letter to
   * show how fond of him they were.
   */
  pass(p: Passing): GenFailure | void {
    const { rng, pack, script, defs, roles, members, sceneRoom, cast, relationships, allRooms, theftRoom } = p
    const { locations, companions, traitDef, evidence, traceRooms, passageRoom, motiveItem, locked, saw } = p
    const { coverRoles, fabricated, committeeLies } = p
    const cr = rng.fork('committee')
    const honest = cast.map((m) => m.id).filter((c) => !members.includes(c))
    const standing = honest.filter(
      (c) =>
        locations[c] !== passageRoom &&
        (companions[c].length > 0 ? companions[c].every((o) => !members.includes(o)) : traceRooms.has(locations[c])),
    )
    if (standing.length === 0) return 'no-frame'
    const smeared = cr.pick(standing)
    p.marks.set('committee', smeared)
    // Pairs and those alone.
    const order = cr.shuffle([...members])
    const shape = cr.pick(shapesOf(members.length))
    const units: CharId[][] = []
    let at = 0
    for (const size of shape) {
      units.push(order.slice(at, at + size))
      at += size
    }
    // Where they say they were: one unit, at least, in a room an honest guest
    // truly had alone (not the one they smear); the rest where nobody was.
    const honestAlone = cr.shuffle(
      honest.filter((c) => c !== smeared && companions[c].length === 0).map((c) => locations[c]),
    )
    const taken = new Set(locations.filter((r) => r !== ''))
    const empty = cr.shuffle(
      allRooms.filter((r) => r !== sceneRoom && r !== locked && r !== theftRoom && r !== passageRoom && !taken.has(r)),
    )
    const clash = honestAlone.length > 0 && cr.chance(0.75)
    // (Where the empty rooms run out, another room an honest guest had: one
    // more place the story breaks.)
    const spareClash = honestAlone.slice(clash ? 1 : 0)
    units.forEach((unit, i) => {
      const room = i === 0 && clash ? honestAlone[0] : (empty.pop() ?? spareClash.shift())
      if (!room) return
      for (const c of unit) committeeLies.set(c, { room, companions: unit.filter((o) => o !== c) })
    })
    if (committeeLies.size !== members.length) return 'lie-room'
    // Who they claim to be: parts that tell nothing against one another.
    const can = (r: RoleId) => script.innocents.includes(r)
    const honestRoles = new Set(honest.map((c) => roles[c]))
    const covers: RoleId[] = []
    const pairMember = units.find((u) => u.length === 2)?.[0]
    // One saw the smeared guest at the scene; one knows of a grudge.
    if (can('witness')) covers.push('witness')
    if (can('gossip')) covers.push('gossip')
    const spare = cr.shuffle((['collector', 'confidant', 'companion'] as RoleId[]).filter(can))
    covers.push(...spare)
    // Where the rooms did not clash, a part must: one of the honest three's own.
    if (!clash) {
      const theirs = covers.find((r) => honestRoles.has(r))
      if (!theirs) {
        const steal = cr.shuffle([...honestRoles]).find((r) => r !== null && !covers.includes(r))
        if (!steal) return 'cover-pool'
        covers.splice(Math.min(2, covers.length), 0, steal)
      } else if (covers.indexOf(theirs) >= members.length) {
        covers.splice(covers.indexOf(theirs), 1)
        covers.splice(Math.min(2, covers.length), 0, theirs)
      }
    }
    if (covers.length < members.length) return 'cover-pool'
    // The Companion's part goes to one of a pair, where there is a pair.
    const parts = covers.slice(0, members.length)
    const seats = cr.shuffle([...members])
    const alibiAt = parts.indexOf('companion')
    if (alibiAt >= 0 && pairMember !== undefined) {
      const j = seats.indexOf(pairMember)
      ;[seats[alibiAt], seats[j]] = [seats[j], seats[alibiAt]]
    }
    seats.forEach((c, i) => {
      coverRoles.set(c, parts[i])
      cast[c].strategy = cr.pick(CONCEALER_STRATEGIES)
    })
    const holder = (r: RoleId) => seats[parts.indexOf(r)]
    // The smear.
    if (parts.includes('witness')) {
      fabricated.set(holder('witness'), { kind: 'sighting', target: smeared, room: sceneRoom })
    }
    if (parts.includes('gossip')) {
      const fake = motivesOf(defs[smeared])
      fabricated.set(holder('gossip'), { kind: 'relationship', subject: smeared, rel: cr.pick(fake) })
      // And the truth of it, on paper: nobody was fonder of him.
      relationships[smeared] = 'devoted'
      evidence.push({
        id: 'doc-fond',
        room: cr.pick(pack.docRooms.filter((r) => r !== locked)),
        name: motiveItem('devoted'),
        fact: { kind: 'motiveDocument', subject: smeared, rel: 'devoted' },
      })
    }
    // The Confidant's word for one of their own.
    if (parts.includes('confidant')) {
      const c = holder('confidant')
      fabricated.set(c, { kind: 'alignment', target: cr.pick(members.filter((o) => o !== c)), alignment: 'good' })
    }
    // Those alone are seen where they say, by another of them; or the
    // Collector hands over a trace that bears them out.
    const alone = units.filter((u) => u.length === 1).map((u) => u[0])
    const collector = parts.includes('collector') ? holder('collector') : -1
    const backed = alone.find((c) => c !== collector && !honestAlone.includes(committeeLies.get(c)!.room))
    // (One passing for the Collector must have something to hand over.)
    if (collector >= 0 && backed === undefined) return 'empty-handed'
    if (collector >= 0 && backed !== undefined) {
      const room = committeeLies.get(backed)!.room
      evidence.push({
        id: 'trace-committee',
        room,
        name: traitDef(cast[backed].trait)?.evidenceName ?? 'a telltale trace',
        fact: { kind: 'trace', room, attr: { kind: 'trait', trait: cast[backed].trait }, givenBy: collector },
        heldBy: collector,
        forged: true,
      })
    }
    for (const c of alone) {
      if (c === backed && collector >= 0) continue
      const seer = cr.pick(members.filter((o) => o !== c))
      saw(seer, { kind: 'sighting', target: c, room: committeeLies.get(c)!.room })
    }
  }

  /** All of them point at the one they agreed on (settled once, by the first). */
  pointsAt(s: Suspecting): void {
    if (s.smeared < 0) return
    for (const m of s.members) {
      s.suspicionTarget.set(m, s.smeared)
      s.trusts.delete(m)
      s.grounds.delete(m)
    }
  }
}

/**
 * The ways the Committee may stand, as pairs who vouch for each other and
 * those alone: for four, as it always was; for any other number, a pair or
 * two, and the rest alone.
 */
function shapesOf(size: number): number[][] {
  if (size === 4) return [[2, 1, 1], [2, 2], [1, 1, 1, 1], [2, 1, 1]]
  const pairs = (k: number) => [...new Array<number>(k).fill(2), ...new Array<number>(size - 2 * k).fill(1)]
  return [pairs(1), pairs(Math.floor(size / 2)), pairs(0), pairs(1)]
}

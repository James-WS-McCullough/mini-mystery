// One phase of dealing a night (see generate.ts).

import { ROLES } from '../roles'
import { INFO_ROLES, liesAboutRole, liesAboutWhereabouts, truthClassOf } from '../deck'
import { fabricateInfo } from '../policy'
import { INFO } from '../info'
import type { CharId, Claim, RoleId, RoomId } from '../types'
import { CONCEALER_STRATEGIES, HONEST_STRATEGIES, CAREFUL_TRUTHS, motivesOf } from './night'
import type { AfterKnowledge } from './night'

/** How they will behave, who pretends to be whom, and what the pretenders will say. */
export function castParts(night: AfterKnowledge) {
  const {
    rng, pack, script, defs, roles, hoax, hoaxer, committee, members, culprit, sceneRoom, cast, careful,
    viaPassage, perjurer, forger, framer, honestIds, relationships, allRooms, theftRoom, locations,
    companions, truth, traitDef, evidence, traceRooms, passageRoom, motiveItem, locked, saw, ties,
  } = night
  // ---- strategies, covers, lies ----
  for (const m of cast) {
    m.strategy =
      liesAboutRole(roles[m.id]) || liesAboutWhereabouts(roles[m.id])
        ? rng.pick(CONCEALER_STRATEGIES)
        : rng.pick(HONEST_STRATEGIES)
  }

  // Anyone who needs to be somebody else takes a role from the script — which
  // may or may not be in the house tonight. Nobody is told which.
  const coverPool = rng.shuffle(INFO_ROLES.filter((r) => script.innocents.includes(r)))
  if (coverPool.length === 0) return 'cover-pool'
  const coverRoles = new Map<CharId, RoleId>()
  const fabricated = new Map<CharId, Claim>()
  // The Perjurer passes for the Companion, and has nothing to tell but the
  // alibi; the Forger for the Collector, with something to hand over.
  if (perjurer >= 0) coverRoles.set(perjurer, 'companion')
  if (forger >= 0) coverRoles.set(forger, 'collector')
  // The murderer may take the Red Herring's part when pressed: "I looked in,
  // yes, and he was alive when I left — and then I went to <the room they
  // lie about>." The Red Herring, pressed, says the same, and the room bears
  // them out; it does not bear out the murderer.
  // Or the Thief's ("I was robbing the box in that room, and that is why I
  // lied") or the Blackmailer's ("I have been bleeding half the house"): a
  // bad role, owned to, that would explain the lie — a double bluff. Each has
  // its tell: the box in the room they name is untouched, or the forced one
  // is elsewhere; and nobody in the house says they were bled by them, while
  // the Blackmailer says truly where they were, which this one cannot.
  // This is the Cunning Murderer's part, and nobody else's.
  // Or the Clinger's ("I was alone, and begged a friend to say otherwise"),
  // settled with the others where the guests were placed. Its tell: nothing
  // of theirs in the room they fall back to.

  // The Framer has chosen somebody who spent the hour alone, honestly, and
  // has taken away whatever of theirs was left in that room: nothing bears
  // their account out now. And the Framer saw them at the scene — so the
  // Framer will say. Nothing is found of it; there is only the gap where an
  // alibi should be.
  let framed = -1
  if (framer >= 0) {
    const standing = honestIds.filter(
      (c) =>
        !ROLES[roles[c]].alone &&
        // (Not the Clinger's kind friend: their room must bear them out, once they own to it.)
        ties.free(c, 'frame') &&
        // (Nobody alone at the end of the passage: their account clears nobody.)
        locations[c] !== passageRoom &&
        companions[c].length === 0 &&
        traceRooms.has(locations[c]),
    )
    if (standing.length === 0) return 'no-frame'
    framed = rng.pick(standing)
    ties.tie(framed, 'framed')
    const taken = evidence.findIndex((e) => e.id === `trace-${locations[framed]}`)
    if (taken >= 0) evidence.splice(taken, 1)
    traceRooms.delete(locations[framed])
    if (script.innocents.includes('witness')) coverRoles.set(framer, 'witness')
    fabricated.set(framer, { kind: 'sighting', target: framed, room: sceneRoom })
    cast[framer].strategy = 'deflector'
  }
  // The Hoaxer, too, has somebody to put it on: one whose own account will
  // stand, seen at the scene (so the Hoaxer says), and named when asked.
  let hoaxed = -1
  if (hoax) {
    const standing = honestIds.filter(
      (c) =>
        !ROLES[roles[c]].alone &&
        locations[c] !== passageRoom &&
        (companions[c].length > 0
          ? companions[c].every((o) => truthClassOf(roles[o]) === 'honest')
          : traceRooms.has(locations[c])),
    )
    if (standing.length === 0) return 'no-frame'
    hoaxed = rng.pick(standing)
    if (script.innocents.includes('witness')) coverRoles.set(hoaxer, 'witness')
    fabricated.set(hoaxer, { kind: 'sighting', target: hoaxed, room: sceneRoom })
    cast[hoaxer].strategy = 'deflector'
  }
  // The Careful Murderer is somebody nobody at the table is: no honest guest
  // will say the same, nor any other liar, nor the Drunk in their cups. And
  // what they tell of the part is true, where the truth of it would not name
  // them: they lie about themselves, and about nobody else.
  if (careful) {
    const free = coverPool.filter((r) => !roles.includes(r) && r !== truth.drunkBelievedRole)
    const truthful = free.filter(
      (r) => CAREFUL_TRUTHS.includes(r) && (r !== 'architect' || passageRoom !== null),
    )
    const cover = truthful.length > 0 ? rng.pick(truthful) : free.length > 0 ? rng.pick(free) : null
    if (cover === null) return 'cover-pool'
    coverRoles.set(culprit, cover)
    const others = cast.map((m) => m.id).filter((c) => c !== culprit)
    const told: Claim | null = !truthful.includes(cover)
      ? fabricateInfo(rng, cover, cast, roles, relationships, culprit, culprit, sceneRoom, defs.map(motivesOf),
          passageRoom !== null
            ? { rooms: allRooms.filter((r) => r !== sceneRoom), truly: passageRoom, used: false }
            : undefined,
          truth.corridor ?? null,
          { all: allRooms, used: new Set(locations), at: locations })
      : INFO[cover]!.careful!({ rng, cast, roles, relationships, culprit, sceneRoom, locations, passageRoom, ties, others })
    if (!told) return 'fabrication'
    fabricated.set(culprit, told)
  }
  // ---- the Committee's story ----
  // Four did it, and agreed beforehand where each of them was, and who each
  // of them is. The story holds between them: pairs who vouch for each other,
  // and those alone seen where they say by another of them, or borne out by a
  // trace one of them hands over as the Collector. It breaks only against the
  // honest three: a room one of them truly had, a part one of them truly
  // plays. And they put it on one of the three: seen at the scene, and with a
  // grudge, so they say; who has an alibi of their own, and a letter to show
  // how fond of him they were.
  const committeeLies = new Map<CharId, { room: RoomId; companions: CharId[] }>()
  let smeared = -1
  if (committee) {
    const cr = rng.fork('committee')
    const honest = cast.map((m) => m.id).filter((c) => !members.includes(c))
    const standing = honest.filter(
      (c) =>
        locations[c] !== passageRoom &&
        (companions[c].length > 0 ? companions[c].every((o) => !members.includes(o)) : traceRooms.has(locations[c])),
    )
    if (standing.length === 0) return 'no-frame'
    smeared = cr.pick(standing)
    // Pairs and those alone.
    const order = cr.shuffle([...members])
    const shape = cr.pick([[2, 1, 1], [2, 2], [1, 1, 1, 1], [2, 1, 1]])
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
  const bluffers = cast
    .map((m) => m.id)
    .filter((c) => liesAboutRole(roles[c]) && !coverRoles.has(c))
  // (Not the Careful Murderer's part: that one is nobody's.)
  const covers = coverPool.filter((r) => !careful || r !== coverRoles.get(culprit))
  if (covers.length === 0) return 'cover-pool'
  bluffers.forEach((c, i) => {
    const cover = covers[i % covers.length]
    coverRoles.set(c, cover)
    if (fabricated.has(c)) return
    const fab = fabricateInfo(
      rng,
      cover,
      cast,
      roles,
      relationships,
      c,
      culprit,
      sceneRoom,
      defs.map(motivesOf),
      passageRoom !== null
        ? { rooms: allRooms.filter((r) => r !== sceneRoom), truly: passageRoom, used: viaPassage }
        : undefined,
      truth.corridor ?? null,
      { all: allRooms, used: new Set(locations), at: locations },
    )
    if (!fab) return
    fabricated.set(c, fab)
  })
  if (bluffers.some((c) => !fabricated.has(c))) return 'fabrication'

  return { coverPool, coverRoles, fabricated, framed, hoaxed, committeeLies, smeared, bluffers, covers }
}

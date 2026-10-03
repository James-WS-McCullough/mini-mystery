// One phase of dealing a night (see generate.ts).

import { INFO_ROLES, liesAboutRole, liesAboutWhereabouts } from '../deck'
import { fabricateInfo } from '../policy'
import { PASS_IN_TURN, partOf } from '../parts'
import type { CharId, Claim, RoleId, RoomId } from '../types'
import { CONCEALER_STRATEGIES, HONEST_STRATEGIES, motivesOf } from './night'
import type { AfterKnowledge } from './night'

/** The night as those who pass for somebody see it, settling who and what they will say (see Part.pass). */
export type Passing = AfterKnowledge & {
  /** The parts on the script a liar may pass for, in the order they are given out. */
  coverPool: RoleId[]
  /** Who each liar passes for. */
  coverRoles: Map<CharId, RoleId>
  /** What each liar will say their part tells them. */
  fabricated: Map<CharId, Claim>
  /** Where each of the Committee says they were, as they agreed. */
  committeeLies: Map<CharId, { room: RoomId; companions: CharId[] }>
  /** Whom each part has marked to put it on: the Framer's, the Hoaxer's, the Committee's. */
  marks: Map<RoleId, CharId>
}

/** How they will behave, who pretends to be whom, and what the pretenders will say. */
export function castParts(night: AfterKnowledge) {
  const {
    rng, script, defs, roles, culprit, sceneRoom, cast, careful, viaPassage, perjurer, forger, relationships,
    allRooms, locations, truth, passageRoom, kind,
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
  // Those with the one part to pass for (see their bluff).
  for (const c of [perjurer, forger]) if (c >= 0) coverRoles.set(c, partOf(roles[c]).coverOn(script)!)
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

  // Those whose part settles who they pass for, and what they say of it, each in turn.
  const committeeLies = new Map<CharId, { room: RoomId; companions: CharId[] }>()
  const marks = new Map<RoleId, CharId>()
  const passing: Passing = { ...night, coverPool, coverRoles, fabricated, committeeLies, marks }
  for (const role of PASS_IN_TURN) {
    const me = roles.indexOf(role)
    if (me < 0) continue
    const failed = partOf(role, kind).pass?.(passing, me)
    if (failed) return failed
  }
  const framed = marks.get('framer') ?? -1
  const hoaxed = marks.get('hoaxer') ?? -1
  const smeared = marks.get('committee') ?? -1
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

// What a part does with the truth of a guest's night: how they tell it, and
// what they give up when it is put to them that their story cannot stand.
// Inheritance follows how far a part may be believed (its truth class); each
// part overrides only what is its own. Parts hold nothing of a night: a
// guest's night is their Guest (truth and told), and a part is called on it.

import type { Lying } from '../dealing/lies'
import type { Passing } from '../dealing/parts'
import type { Knowing } from '../dealing/knowledge'
import type { Suspecting } from '../dealing/suspicion'
import type { Laying } from '../dealing/evidence'
import { INFO } from '../info'
import { ROLES as REGISTRY } from '../roles'
import { truthClassOf } from '../deck'
import type { Placing } from '../dealing/placing'
import type { GenFailure } from '../dealing/night'
import type { PolicyContext } from '../policy'
import { DRUNK_BELIEFS, INFO_ROLES, ROLES, WORTH_BUYING, type RoleSpec } from '../roles'
import type {
  CastMember, CharId, Claim, Guest, GroundTruth, PressOutcome, PublicScript, Relationship, RoleId, RoomId, Whereabouts,
} from '../types'
import { isMotiveGrade } from '../types'

/** What a part has to work with, for one guest on one night. */
export interface Telling {
  /** The guest. */
  c: CharId
  me: CastMember
  /** The night's ground truth. */
  truth: GroundTruth
  /** All that was decided as the night was dealt. */
  ctx: PolicyContext
  /** The truth of this guest's own night. */
  guest: Pick<Guest, 'truth'>
}

/**
 * Who a part may say they are. Known to the detective as much as to the
 * dealing (the case file says it of each part), and so to the solver too.
 */
export type Bluff =
  /** Says who they are: the honest. */
  | { kind: 'own' }
  /** Always the one part (where it is on the script, unless always). */
  | { kind: 'only'; role: RoleId; always?: boolean }
  /** Any part on the script with something to tell. */
  | { kind: 'any' }
  /** The Committee's: parts on the script agreed between them, never the same twice. */
  | { kind: 'agreed' }
  /** The Drunk's: a part they sincerely believe themself, with something to tell. */
  | { kind: 'believed' }

/** What of the script decides who a part may say they are. */
export type ScriptForBluffs = Pick<PublicScript, 'innocents' | 'suspicious' | 'murderers'>

export abstract class Part {
  constructor(readonly id: RoleId) {}

  /** Who they may say they are. */
  abstract readonly bluff: Bluff

  /**
   * Where they spent the hour, and with whom, where that is their part's to
   * say: placed in turn (PLACED_IN_TURN), before everybody else is placed.
   * Returns why the night cannot be dealt so, if it cannot.
   */
  place?(p: Placing, me: CharId): GenFailure | void

  /** Where they say they were, where that lie is their own to tell: told in turn (LIE_IN_TURN). */
  lie?(l: Lying, me: CharId): GenFailure | void
  /** (The Cunning Murderer's, playing the Clinger: told where the Clinger's lie would be.) */
  lieAsClinger?(l: Lying, me: CharId): GenFailure | void

  /**
   * Who they pass for, and what they will say of it, where that is their own
   * to settle (the rest are given a part in turn): passed in turn (PASS_IN_TURN).
   */
  pass?(p: Passing, me: CharId): GenFailure | void

  /** What others come to know of them, before the afternoon's quarrel is heard (OTHERS_KNOW_IN_TURN). */
  othersKnow?(k: Knowing, me: CharId): GenFailure | void
  /** What others come to know of them, after it (OTHERS_LEARN_IN_TURN). */
  othersLearn?(k: Knowing, me: CharId): GenFailure | void

  /** Whom they (or those they have a hold on) point at, where that is their part's to say (POINTED_IN_TURN). */
  pointsAt?(s: Suspecting, me: CharId): void

  /** Will stand up when the household is gathered at the last, and say it was them. */
  readonly confessesAtTheLast: boolean = false

  /** Carried the weapon off from the scene, to where they spent the hour. */
  readonly carriesTheWeapon: boolean = false

  /** What they leave about the place to be found (LEFT_EARLY_IN_TURN; LEFT_LATER_IN_TURN). */
  leaves?(e: Laying, me: CharId): GenFailure | void
  /** What they take up before the detective can find it (TAKEN_IN_TURN). */
  takes?(e: Laying, me: CharId): void

  /**
   * Which parts they may be heard to claim, on this script: their bluff, and
   * their own (owned to when pressed). Whoever has claimed any other is not
   * playing this part.
   */
  mayClaim(script: ScriptForBluffs): (role: RoleId) => boolean {
    const b = this.bluff
    const onScript = (r: RoleId) => script.innocents.includes(r)
    const telling = (r: RoleId) => INFO_ROLES.includes(r) && onScript(r)
    const own = (r: RoleId) => r === this.id
    switch (b.kind) {
      case 'own':
        return own
      case 'only':
        return b.always || onScript(b.role) ? (r) => r === b.role || own(r) : (r) => telling(r) || own(r)
      case 'any':
        return (r) => telling(r) || own(r)
      case 'agreed':
        return (r) => onScript(r) || own(r)
      case 'believed':
        return (r) => (DRUNK_BELIEFS.includes(r) && onScript(r)) || own(r)
    }
  }

  /** The one part they always pass for tonight, if theirs is such a bluff (null: they choose, or do not pass). */
  coverOn(script: ScriptForBluffs): RoleId | null {
    const b = this.bluff
    return b.kind === 'only' && (b.always || script.innocents.includes(b.role)) ? b.role : null
  }

  /** What the registry knows of the part. */
  get spec(): RoleSpec {
    return ROLES[this.id]
  }

  /** Who they say they are. */
  abstract claimsToBe(t: Telling): RoleId
  /** Where they say they spent the hour, and with whom (null: they cannot say). */
  abstract saysWhere(t: Telling): Whereabouts | null
  /** What they say their part tells them. */
  abstract saysTheyKnow(t: Telling): Claim[]
  /** How they say they stood with the dead man. */
  abstract ownsTo(t: Telling): Relationship
  /** What they give up when it is put to them that their story cannot stand. */
  abstract press(t: Telling): PressOutcome
}

/** What their part tells them, and not what came their way by chance. */
const byPart = (t: Telling) => t.guest.truth.knows.filter((k) => !t.guest.truth.byChance.includes(k))
/** Where they truly were, as a claim. */
export const trueWhere = (t: Telling): Claim => ({ kind: 'whereabouts', ...t.guest.truth.where })

/** Somebody who tells the truth, all of it. */
export class HonestPart extends Part {
  readonly bluff: Bluff = { kind: 'own' }
  claimsToBe(_t: Telling): RoleId {
    return this.id
  }
  saysWhere(t: Telling): Whereabouts | null {
    return t.guest.truth.where
  }
  saysTheyKnow(t: Telling) {
    return byPart(t)
  }
  ownsTo(t: Telling) {
    return t.guest.truth.standing
  }
  press(_t: Telling): PressOutcome {
    return { kind: 'standFirm', claims: [], lineKey: 'press.hold' }
  }
}

/**
 * Somebody who passes for another part: they claim it, tell what it would
 * know (invented, as the dealing decided), and hide any grudge they bore him.
 */
abstract class PassingPart extends Part {
  readonly bluff: Bluff = { kind: 'any' }
  claimsToBe(t: Telling): RoleId {
    return t.ctx.coverRoles.get(t.c)!
  }
  saysTheyKnow(t: Telling): Claim[] {
    const fab = t.ctx.fabricated.get(t.c)
    return fab ? [fab] : []
  }
  ownsTo(t: Telling): Relationship {
    return isMotiveGrade(t.guest.truth.standing) ? 'cordial' : t.guest.truth.standing
  }
}

/** Somebody who lies about who they are and where they were (a concealer). */
export class LiarPart extends PassingPart {
  saysWhere(t: Telling): Whereabouts | null {
    return { ...t.ctx.lies.get(t.c)! }
  }

  /** Where they say they were, when nothing else has told them what to say: alone, somewhere. */
  lieAlone(l: Lying, c: CharId): GenFailure | void {
    const { rng, cast, culprit, careful, sceneRoom, theftRoom, locked, locations, allRooms, occupiedRooms, traceRooms, lies } = l
    // A liar never claims a room holding a trace that would fit them: a trace
    // that bears out an account must always be bearing out a true one.
    const fitsMe = (r: RoomId) => traceRooms.get(r) === cast[c].trait
    // Nor the scene itself, though nobody was in it (as when the murderer came
    // by the passage): nobody innocent of it would put themselves there.
    const carefulRoom = careful && c !== culprit ? lies.get(culprit)?.room : undefined
    // Nor a room that was locked all evening.
    const emptyRooms = allRooms.filter((r) => !occupiedRooms.has(r) && r !== sceneRoom && r !== carefulRoom && r !== locked)
    const occupiedOptions = allRooms.filter(
      (r) => occupiedRooms.has(r) && r !== sceneRoom && r !== theftRoom && r !== locations[c] && !fitsMe(r),
    )
    // The culprit leans toward an occupied room: that collision is the
    // opportunity-breaking contradiction the accusation phase depends on.
    const occupiedChance = c === culprit ? 0.75 : 0.5
    const preferred = rng.chance(occupiedChance) && occupiedOptions.length > 0 ? occupiedOptions : emptyRooms
    // (Where the one kind of room is all taken, the other will do.)
    const pool = preferred.length > 0 ? preferred : occupiedOptions.length > 0 ? occupiedOptions : emptyRooms
    if (pool.length === 0) return 'lie-room'
    lies.set(c, { room: rng.pick(pool), companions: [] })
  }
  press(_t: Telling): PressOutcome {
    return { kind: 'deflect', claims: [], lineKey: 'press.hold' }
  }
}

/** Somebody who lies about who they are, and says truly where they were (masked). */
export class MaskedPart extends PassingPart {
  saysWhere(t: Telling): Whereabouts | null {
    return t.guest.truth.where
  }
  press(_t: Telling): PressOutcome {
    return { kind: 'standFirm', claims: [], lineKey: 'press.hold' }
  }
}

/** Somebody sincerely mistaken in who they are, and so in all they know by it (the Drunk). */
export class MistakenPart extends HonestPart {
  readonly bluff: Bluff = { kind: 'believed' }

  /** What they believe their part tells them: sincere, and wrong. */
  believes(k: Knowing, me: CharId): void {
    const believed = k.truth.drunkBelievedRole
    if (!believed) return
    const part = INFO[believed]?.corrupt ? INFO[believed]! : INFO.confidant!
    k.knowledge[me].push(
      part.corrupt!({ rng: k.rng, cast: k.cast, roles: k.roles, relationships: [], speaker: me, culprit: k.culprit, sceneRoom: k.sceneRoom, fitting: [], corridor: null }),
    )
  }
  claimsToBe(t: Telling): RoleId {
    return t.truth.drunkBelievedRole!
  }
  press(_t: Telling): PressOutcome {
    return { kind: 'baffled', claims: [], lineKey: 'press.hold' }
  }
}

/** One of the murderer's friends: alone in the hour, whatever they say. */
export class Accomplice extends LiarPart {
  place(p: Placing, me: CharId): GenFailure | void {
    if (!p.together([me])) return 'rooms-exhausted'
  }
}

/**
 * Will stand up at the last and say they did it, though they could not have:
 * where it is the chance they lacked, they were in company all the hour.
 */
export class Martyr extends MaskedPart {
  readonly confessesAtTheLast = true

  place(p: Placing, me: CharId): GenFailure | void {
    if (p.martyrLacks !== 'opportunity') {
      if (!p.together([me])) return 'rooms-exhausted'
      return
    }
    const other = p.good.pop()
    if (other === undefined) return 'no-company'
    p.partners.set('martyr', other)
    if (!p.together([me, other])) return 'rooms-exhausted'
  }
}

/** Sought out company on purpose: spent the hour with one of the innocent, who will say the same. */
export class Companion extends HonestPart {
  place(p: Placing, me: CharId): GenFailure | void {
    const other = p.good.pop()
    if (other === undefined) return 'no-company'
    p.partners.set('companion', other)
    if (!p.together([me, other])) return 'rooms-exhausted'
  }
}

/** Passes for the Companion, and swears the murderer was beside them. */
export class Perjurer extends Accomplice {
  readonly bluff: Bluff = { kind: 'only', role: 'companion', always: true }

  /**
   * Each swears the other was beside them, in a room they chose badly:
   * somebody was there, alone, and the room will bear that somebody out.
   */
  lie(l: Lying, me: CharId): GenFailure | void {
    const room = l.kept.find((r) => l.traceRooms.has(r)) ?? l.kept[0]
    if (!room) return 'lie-room'
    l.lies.set(me, { room, companions: [l.culprit] })
    l.lies.set(l.culprit, { room, companions: [me] })
  }
}

/** Passes for the Collector, and hands over something made to bear the murderer out. */
export class Forger extends Accomplice {
  readonly bluff: Bluff = { kind: 'only', role: 'collector', always: true }

  /**
   * Made to order: the murderer's own mark, in the room the murderer means
   * to claim (an empty one, where nothing true can gainsay it), to hand over.
   */
  lie(l: Lying, me: CharId): GenFailure | void {
    const { rng, cast, culprit, allRooms, occupiedRooms, sceneRoom, theftRoom, locked } = l
    const empty = rng.shuffle(
      allRooms.filter((r) => !occupiedRooms.has(r) && r !== sceneRoom && r !== theftRoom && r !== locked),
    )
    const room = empty[0]
    if (!room) return 'lie-room'
    l.lies.set(culprit, { room, companions: [] })
    l.evidence.push({
      id: 'trace-forged',
      room,
      name: l.traitDef(cast[culprit].trait)?.evidenceName ?? 'a telltale trace',
      fact: { kind: 'trace', room, attr: { kind: 'trait', trait: cast[culprit].trait }, givenBy: me },
      heldBy: me,
      forged: true,
    })
  }
}

/** Carried the weapon off from the scene, to where they spent the hour. */
export class Cleaner extends Accomplice {
  readonly carriesTheWeapon = true

  /** The place where it was done, and nothing it was done with. */
  leaves(e: Laying): GenFailure | void {
    e.evidence.push({
      id: 'scene-bare',
      room: e.sceneRoom,
      name: e.pack.bareScene ?? 'the place where it was done, and nothing it was done with',
      fact: { kind: 'sceneCleared' },
    })
  }

  /** Somebody saw the Cleaner where they truly were: which is where the weapon is, and not where they will say. */
  othersKnow(k: Knowing, me: CharId): GenFailure | void {
    const seers = k.honestIds.filter((c) => !k.companions[c].includes(me))
    if (seers.length > 0) k.saw(k.rng.pick(seers), { kind: 'sighting', target: me, room: k.locations[me] })
  }
}

/** Has paid a witness to say nothing of what they know, and left the money where it can be found. */
export class Sponsor extends Accomplice {
  /** What the Sponsor paid, where the Sponsor spent the hour: to whoever's silence was worth the most. */
  leaves(e: Laying, me: CharId): GenFailure | void {
    const { rng, roles, ties, pack, cast, locations } = e
    const buyable = WORTH_BUYING.map((r) => roles.indexOf(r))
    const bribed =
      buyable.find((c) => c >= 0 && ties.free(c, 'bribe') && rng.chance(0.7)) ??
      buyable.find((c) => c >= 0 && ties.free(c, 'bribe')) ??
      -1
    if (bribed < 0) return 'no-seam'
    ties.tie(bribed, 'bribed')
    e.evidence.push({
      id: 'bribe',
      room: locations[me],
      name: (pack.bribeItem ?? 'an envelope of banknotes, with {name}’s name on it').replace('{name}', cast[bribed].shortName),
      fact: { kind: 'bribe', to: bribed },
    })
  }
}

/** Knows a thing or two, and took something up before you could search for it: handed over when asked who they are. */
export class Collector extends HonestPart {
  /**
   * A trace, which now bears nobody out until the Collector has been asked.
   * Never their own (from where they spent the hour, or fitting them), or the
   * one honest guest who hands things over would look just like the Forger.
   * Or the key, half the time, where there is a locked room.
   */
  takes(e: Laying, me: CharId): void {
    const { rng, lockRng, keyItem, locations, cast, ties, evidence } = e
    if (keyItem && keyItem.room !== locations[me] && lockRng!.chance(0.5)) {
      keyItem.heldBy = me
      ties.tie(me, 'holdsKey')
      return
    }
    const traces = evidence.filter(
      (x) =>
        x.fact.kind === 'trace' &&
        x.room !== locations[me] &&
        // (Not what bears out the Clinger, or their friend, once they own to the truth.)
        !cast.some((m) => !ties.free(m.id, 'collectTrace') && locations[m.id] === x.room) &&
        !(x.fact.attr.kind === 'trait' && x.fact.attr.trait === cast[me].trait),
    )
    if (traces.length > 0) {
      const taken = rng.pick(traces)
      taken.heldBy = me
      if (taken.fact.kind === 'trace') taken.fact = { ...taken.fact, givenBy: me }
    }
  }
}

/**
 * Has given the murderer a room to have been in, and an honest guest who will
 * swear to having seen them there. It was chosen badly: somebody else was in
 * it, alone, and the room bears that somebody out.
 */
export class Whisperer extends Accomplice {
  lie(l: Lying): GenFailure | void {
    const { rng, cast, culprit, kept, traceRooms, honestIds, locations, ties } = l
    // (Whoever holds the trace: the two accounts collide either way.)
    const room = kept.find((r) => traceRooms.has(r) && traceRooms.get(r) !== cast[culprit].trait)
    if (!room) return 'lie-room'
    l.lies.set(culprit, { room, companions: [] })
    // (Not the one who keeps the Sweetheart's secret: one lie to a mouth.)
    const mouths = honestIds.filter((c) => locations[c] !== room && ties.free(c, 'whisper'))
    if (mouths.length === 0) return 'no-seam'
    const whispered = rng.pick(mouths)
    ties.tie(whispered, 'whispered')
    l.saw(whispered, { kind: 'sighting', target: culprit, room })
  }
}

/** Passes for the Witness, who saw somebody innocent at the scene: so they say. */
export class Framer extends Accomplice {
  readonly bluff: Bluff = { kind: 'only', role: 'witness' }

  /**
   * Has chosen somebody who spent the hour alone, honestly, and has taken
   * away whatever of theirs was left in that room: nothing bears their account
   * out now. And the Framer saw them at the scene, so the Framer will say.
   * Nothing is found of it; there is only the gap where an alibi should be.
   */
  pass(p: Passing, me: CharId): GenFailure | void {
    const { rng, roles, honestIds, ties, locations, passageRoom, companions, traceRooms, evidence } = p
    const standing = honestIds.filter(
      (c) =>
        !REGISTRY[roles[c]].alone &&
        // (Not the Clinger's kind friend: their room must bear them out, once they own to it.)
        ties.free(c, 'frame') &&
        // (Nobody alone at the end of the passage: their account clears nobody.)
        locations[c] !== passageRoom &&
        companions[c].length === 0 &&
        traceRooms.has(locations[c]),
    )
    if (standing.length === 0) return 'no-frame'
    const framed = rng.pick(standing)
    ties.tie(framed, 'framed')
    p.marks.set('framer', framed)
    const taken = evidence.findIndex((e) => e.id === `trace-${locations[framed]}`)
    if (taken >= 0) evidence.splice(taken, 1)
    traceRooms.delete(locations[framed])
    const cover = this.coverOn(p.script)
    if (cover) p.coverRoles.set(me, cover)
    p.fabricated.set(me, { kind: 'sighting', target: framed, room: p.sceneRoom })
    p.cast[me].strategy = 'deflector'
  }

  /** Has one name to give, and gives it. */
  pointsAt(s: Suspecting, me: CharId): void {
    if (s.framed < 0) return
    s.suspicionTarget.set(me, s.framed)
    s.trusts.delete(me)
  }
}

/** Helps him fake his death, and passes for the Witness who saw somebody else at the scene. */
export class Hoaxer extends LiarPart {
  readonly bluff: Bluff = { kind: 'only', role: 'witness' }

  /**
   * Has somebody to put it on too: one whose own account will stand, seen at
   * the scene (so the Hoaxer says), and named when asked.
   */
  pass(p: Passing, me: CharId): GenFailure | void {
    const { rng, roles, honestIds, locations, passageRoom, companions, traceRooms } = p
    const standing = honestIds.filter(
      (c) =>
        !REGISTRY[roles[c]].alone &&
        locations[c] !== passageRoom &&
        (companions[c].length > 0
          ? companions[c].every((o) => truthClassOf(roles[o]) === 'honest')
          : traceRooms.has(locations[c])),
    )
    if (standing.length === 0) return 'no-frame'
    const hoaxed = rng.pick(standing)
    p.marks.set('hoaxer', hoaxed)
    const cover = this.coverOn(p.script)
    if (cover) p.coverRoles.set(me, cover)
    p.fabricated.set(me, { kind: 'sighting', target: hoaxed, room: p.sceneRoom })
    p.cast[me].strategy = 'deflector'
  }

  /** Has one name to give, and gives it. */
  pointsAt(s: Suspecting, me: CharId): void {
    if (s.hoaxed < 0) return
    s.suspicionTarget.set(me, s.hoaxed)
    s.trusts.delete(me)
  }

  /** Half the time somebody knew how fond of him the Hoaxer was, and will say so. */
  othersLearn(k: Knowing, me: CharId): GenFailure | void {
    if (!k.rng.chance(0.5)) return
    const knew = k.honestIds.filter((c) => c !== k.quarrelHearer)
    if (knew.length > 0) k.saw(k.rng.pick(knew), { kind: 'relationship', subject: me, rel: 'devoted' })
  }
}

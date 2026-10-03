// The suspicious: those who look worse than they are, and the lesser guilt
// each owns to when pressed.

import type { GenFailure } from '../dealing/night'
import type { Lying } from '../dealing/lies'
import type { Placing } from '../dealing/placing'
import type { Knowing } from '../dealing/knowledge'
import type { Suspecting } from '../dealing/suspicion'
import type { Laying } from '../dealing/evidence'
import type { CharId, PressOutcome, Whereabouts } from '../types'
import { HonestPart, LiarPart, MaskedPart, trueWhere, type SolverTraits, type Telling } from './part'

/** Cannot remember where they were. Only the room itself can tell you. */
export class Amnesiac extends HonestPart {
  saysWhere(): Whereabouts | null {
    return null
  }
}

/** Nothing worse than a secret: where they were, and with whom. */
export class Sweetheart extends LiarPart {
  readonly solver: SolverTraits = { leftOutOfCompany: true, claimsSolitude: true }

  /** With somebody honest, who will say they were alone; as will they, somewhere else. */
  place(p: Placing, me: CharId): GenFailure | void {
    const other = p.good.pop()
    if (other === undefined) return 'no-company'
    p.partners.set('sweetheart', other)
    p.ties.tie(me, 'keepsSecret')
    p.ties.tie(other, 'hidesCompany')
    if (!p.together([me, other])) return 'rooms-exhausted'
  }

  /**
   * Alone, they say, and somewhere else (and the one they were with says they
   * were alone too, where they truly were). Somebody honest saw the
   * Sweetheart where they really spent the hour, which gives both the lie.
   */
  lie(l: Lying, me: CharId): GenFailure | void {
    const { rng, cast, sceneRoom, theftRoom, locked, locations, traceRooms, honestIds, ties } = l
    const room = rng
      .shuffle(l.allRooms)
      .find(
        (r) => r !== sceneRoom && r !== theftRoom && r !== locked && r !== locations[me] && traceRooms.get(r) !== cast[me].trait,
      )
    if (!room) return 'lie-room'
    l.lies.set(me, { room, companions: [] })
    const seers = honestIds.filter((c) => ties.free(c, 'seeSweetheart') && locations[c] !== locations[me])
    if (seers.length === 0) return 'no-seam'
    l.saw(rng.pick(seers), { kind: 'sighting', target: me, room: locations[me] })
  }

  press(t: Telling): PressOutcome {
    return { kind: 'confess', claims: [{ kind: 'role', role: 'sweetheart' }, trueWhere(t)], lineKey: 'press.confess' }
  }
}

/** Frightened, and found out: alone after all, and where. */
export class Clinger extends LiarPart {
  readonly solver: SolverTraits = {
    pairsDoNotBind: true,
    namedOutOfKindness: true,
    claimsCompany: true,
    ownedRoomBearsThemOut: true,
  }

  /**
   * Alone, and could not bear to say so: somebody kind, alone too and
   * somewhere else, will swear they were together. (Not the Spinster, who
   * knows better.)
   */
  place(p: Placing, me: CharId): GenFailure | void {
    const soul = p.good.filter((c) => c !== p.spinster).pop()
    if (soul === undefined) return 'no-company'
    p.partners.set('clinger', soul)
    p.ties.tie(me, 'clings')
    p.ties.tie(soul, 'vouches')
    p.good.splice(p.good.indexOf(soul), 1)
    if (!p.together([me]) || !p.together([soul])) return 'rooms-exhausted'
  }

  /**
   * With their kind friend, they say, in the friend's room. Somebody honest
   * saw the Clinger where they really were, which gives them both the lie
   * (and who will say so: nobody paid to keep quiet).
   */
  lie(l: Lying, me: CharId): GenFailure | void {
    const { rng, locations, honestIds, ties, clingerOf } = l
    l.lies.set(me, { room: locations[clingerOf], companions: [clingerOf] })
    const seers = honestIds.filter((c) => ties.free(c, 'seeClinger') && locations[c] !== locations[me])
    if (seers.length === 0) return 'no-seam'
    const seer = rng.pick(seers)
    ties.tie(seer, 'sawClinger')
    l.saw(seer, { kind: 'sighting', target: me, room: locations[me] })
  }

  press(t: Telling): PressOutcome {
    return clingerPress(t, t.guest.truth.where.room)
  }
}

/** The Clinger's breakdown, naming the room they say they were truly in. */
export function clingerPress(t: Telling, room: string): PressOutcome {
  return {
    kind: 'confess',
    claims: [{ kind: 'role', role: 'clinger' }, { kind: 'whereabouts', room, companions: [] }],
    lineKey: 'press.confess.clinger',
    slots: { room, person: t.ctx.cast[t.ctx.clingerOf ?? t.c].shortName },
  }
}

/** Robbing the box in that room, and that is why they lied. */
export class Thief extends LiarPart {
  readonly solver: SolverTraits = { forcedTheBox: true }

  /** The box they forced, in the room they robbed. */
  leaves(e: Laying): GenFailure | void {
    if (!e.theftRoom) return
    e.evidence.push({
      id: 'lockbox',
      room: e.theftRoom,
      name: 'a lockbox with its hasp forced',
      fact: { kind: 'forcedLockbox', room: e.theftRoom },
    })
  }

  /** The crash, heard by somebody honest. */
  othersKnow(k: Knowing): GenFailure | void {
    // (Nobody honest in the house to hear it: then nobody did.)
    if (!k.theftRoom || k.honestIds.length === 0) return
    k.crashHearer = k.rng.pick(k.honestIds)
    k.saw(k.crashHearer, { kind: 'heard', sound: 'crash', room: k.theftRoom })
  }

  /** Glimpsed near the theft, most of the time. */
  othersLearn(k: Knowing, me: CharId): GenFailure | void {
    if (!k.theftRoom || k.honestIds.length === 0 || !k.rng.chance(0.75)) return
    k.saw(k.rng.pick(k.honestIds), { kind: 'sighting', target: me, room: k.theftRoom })
  }

  press(t: Telling): PressOutcome {
    const { where, standing } = t.guest.truth
    return {
      kind: 'confess',
      claims: [
        { kind: 'role', role: 'thief' },
        { kind: 'theft', room: where.room },
        { kind: 'whereabouts', room: where.room, companions: where.companions },
        { kind: 'relationship', subject: t.c, rel: standing },
      ],
      lineKey: 'press.confess',
    }
  }
}

/** "I looked in, for a minute, no more; he was alive. Then I went to <room>." */
export class RedHerring extends MaskedPart {
  readonly solver: SolverTraits = { wasAtTheSceneBefore: true }

  /**
   * Somebody saw them at the scene, within the hour. It is a true sighting,
   * and it looks exactly like one of the murderer; and the Red Herring, who
   * says truly they spent the hour elsewhere, will not mention it.
   */
  othersKnow(k: Knowing, me: CharId): GenFailure | void {
    if (k.honestIds.length === 0) return 'no-seam'
    k.saw(k.rng.pick(k.honestIds), { kind: 'sighting', target: me, room: k.sceneRoom })
  }

  /** Gone from the scene before it was done: the hour they spent alone, in a room of their own. */
  place(p: Placing, me: CharId): GenFailure | void {
    if (!p.together([me])) return 'rooms-exhausted'
  }

  press(t: Telling): PressOutcome {
    return herringPress(t, this.saysWhere(t)!)
  }
}

/** The Red Herring's confession, naming the room they say they went on to. */
export function herringPress(t: Telling, where: Whereabouts): PressOutcome {
  return {
    kind: 'confess',
    claims: [{ kind: 'role', role: 'redherring' }, { kind: 'whereabouts', ...where }],
    lineKey: 'press.confess.herring',
    slots: { scene: t.truth.sceneRoom, room: where.room },
  }
}

/** Bleeding half the house: and their grudge, owned to. */
export class Blackmailer extends MaskedPart {
  readonly solver: SolverTraits = { bleedsTheHouse: true }

  /**
   * Their victims: they will say whom they fear, and why. (Not one who knows
   * the Blackmailer to be no murderer: they would clear the very name they point at.)
   */
  othersKnow(k: Knowing, me: CharId): GenFailure | void {
    const bled = k.honestIds.filter(
      (c) => !k.knowledge[c].some((x) => x.kind === 'alignment' && x.target === me && x.alignment === 'good'),
    )
    const victims = k.rng.sample(bled, Math.min(bled.length, k.rng.chance(0.5) ? 3 : 2))
    k.victims.push(...victims)
    for (const v of victims) k.saw(v, { kind: 'blackmailed', by: me })
  }

  /** Whoever is being bled looks no further than the one bleeding them: and the murderer goes unremarked. */
  pointsAt(s: Suspecting, me: CharId): void {
    for (const v of s.victims) {
      s.suspicionTarget.set(v, me)
      s.grounds.delete(v)
      s.trusts.delete(v)
    }
  }

  press(t: Telling): PressOutcome {
    return {
      kind: 'confess',
      claims: [{ kind: 'role', role: 'blackmailer' }, { kind: 'relationship', subject: t.c, rel: t.guest.truth.standing }],
      lineKey: 'press.confess',
    }
  }
}

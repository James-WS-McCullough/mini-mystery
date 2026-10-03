// The suspicious: those who look worse than they are, and the lesser guilt
// each owns to when pressed.

import type { GenFailure } from '../dealing/night'
import type { Lying } from '../dealing/lies'
import type { Placing } from '../dealing/placing'
import type { CharId, PressOutcome, Whereabouts } from '../types'
import { HonestPart, LiarPart, MaskedPart, trueWhere, type Telling } from './part'

/** Cannot remember where they were. Only the room itself can tell you. */
export class Amnesiac extends HonestPart {
  saysWhere(): Whereabouts | null {
    return null
  }
}

/** Nothing worse than a secret: where they were, and with whom. */
export class Sweetheart extends LiarPart {
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
  press(t: Telling): PressOutcome {
    return {
      kind: 'confess',
      claims: [{ kind: 'role', role: 'blackmailer' }, { kind: 'relationship', subject: t.c, rel: t.guest.truth.standing }],
      lineKey: 'press.confess',
    }
  }
}

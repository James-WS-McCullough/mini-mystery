// The murderer, of whichever kind tonight.

import type { GenFailure } from '../dealing/night'
import type { Lying } from '../dealing/lies'
import type { Placing } from '../dealing/placing'
import type { Passing } from '../dealing/parts'
import { motivesOf } from '../dealing/night'
import { INFO } from '../info'
import { CAREFUL_TRUTHS } from '../roles'
import type { AfterSuspicion } from '../dealing/night'
import type { Claim } from '../types'
import type { CharId, PressOutcome, Relationship, RoleId } from '../types'
import { LiarPart, type ScriptForBluffs, type SolverTraits, type Telling } from './part'
import { clingerPress, herringPress } from './suspicious'

/** Did it, and will tell you they are somebody else. */
export class Murderer extends LiarPart {
  readonly solver: SolverTraits = { mayConfess: true }

  constructor() {
    super('murderer')
  }

  /** At the scene (placed before anybody); or, gone by the passage, alone at its other end. */
  place(p: Placing, me: CharId): GenFailure | void {
    if (p.viaPassage && !p.together([me])) return 'rooms-exhausted'
  }

  /** The best account is the true one: alone, in the room at the end of the passage. */
  lie(l: Lying, me: CharId): GenFailure | void {
    if (l.viaPassage) l.lies.set(me, { room: l.locations[me], companions: [] })
  }

  /**
   * Any part with something to tell; and, where the Cunning Murderer may walk,
   * the lesser guilt they own to when pressed (a part on the script to play).
   */
  mayClaim(script: ScriptForBluffs): (role: RoleId) => boolean {
    const passing = super.mayClaim(script)
    const acts: RoleId[] = script.murderers?.includes('cunning')
      ? (['redherring', 'thief', 'blackmailer', 'clinger'] as RoleId[]).filter((r) => script.suspicious.includes(r))
      : []
    return (r) => passing(r) || acts.includes(r)
  }
}

/**
 * The Careful Murderer owns to their grudge: it would be found out anyway, and
 * a lie that a paper gives away is just the attention they avoid.
 */
export class CarefulMurderer extends Murderer {
  ownsTo(t: Telling): Relationship {
    return t.guest.truth.standing
  }

  /**
   * Somebody nobody at the table is: no honest guest will say the same, nor
   * any other liar, nor the Drunk in their cups. And what they tell of the
   * part is true, where the truth of it would not name them: they lie about
   * themselves, and about nobody else.
   */
  pass(p: Passing, me: CharId): GenFailure | void {
    const { rng, cast, roles, relationships, sceneRoom, locations, passageRoom, ties, allRooms, truth, defs } = p
    const free = p.coverPool.filter((r) => !roles.includes(r) && r !== truth.drunkBelievedRole)
    const truthful = free.filter((r) => CAREFUL_TRUTHS.includes(r) && (r !== 'architect' || passageRoom !== null))
    const cover = truthful.length > 0 ? rng.pick(truthful) : free.length > 0 ? rng.pick(free) : null
    if (cover === null) return 'cover-pool'
    p.coverRoles.set(me, cover)
    const others = cast.map((m) => m.id).filter((c) => c !== me)
    const told: Claim | null = !truthful.includes(cover)
      ? (INFO[cover] ?? INFO.confidant!).fabricate({
          rng, cast, roles, relationships, speaker: me, culprit: me, sceneRoom, fitting: defs.map(motivesOf),
          passage: passageRoom !== null ? { rooms: allRooms.filter((r) => r !== sceneRoom), truly: passageRoom, used: false } : undefined,
          corridor: truth.corridor ?? null,
          rooms: { all: allRooms, used: new Set(locations), at: locations },
        })
      : INFO[cover]!.careful!({ rng, cast, roles, relationships, culprit: me, sceneRoom, locations, passageRoom, ties, others })
    if (!told) return 'fabrication'
    p.fabricated.set(me, told)
  }

  /** Somewhere nobody was, nor was robbed: no account in the house will meet theirs. (They choose first.) */
  lieAlone(l: Lying, me: CharId): GenFailure | void {
    const quiet = l.allRooms.filter(
      (r) => !l.occupiedRooms.has(r) && r !== l.sceneRoom && r !== l.locked && r !== l.theftRoom,
    )
    if (quiet.length === 0) return 'lie-room'
    l.lies.set(me, { room: l.rng.pick(quiet), companions: [] })
  }
}

/**
 * The Cunning Murderer, pressed, owns to a lesser guilt that would explain
 * the lie: the part they play, borrowed, with the one thing in it that is
 * not so (its tell).
 */
export class CunningMurderer extends Murderer {
  /** Playing the Thief: a room worth robbing, and not the one that was robbed, nor one whose trace would fit them. */
  lie(l: Lying, me: CharId): GenFailure | void {
    super.lie(l, me)
    if (!l.playsThief) return
    const { rng, pack, cast, sceneRoom, theftRoom, locked, traceRooms, occupiedRooms } = l
    const rooms = rng.shuffle(
      pack.valuableRooms.filter((r) => r !== sceneRoom && r !== theftRoom && r !== locked && traceRooms.get(r) !== cast[me].trait),
    )
    // Occupied for choice: that collision is the opportunity-breaking contradiction.
    const room = rooms.find((r) => occupiedRooms.has(r)) ?? rooms[0]
    if (!room) return 'lie-room'
    l.lies.set(me, { room, companions: [] })
  }

  /** Playing the Clinger: with the kind friend, they say, in the friend's room. */
  lieAsClinger(l: Lying, me: CharId): GenFailure | void {
    if (l.clung === me) l.lies.set(me, { room: l.locations[l.clingerOf], companions: [l.clingerOf] })
  }

  press(t: Telling): PressOutcome {
    const where = this.saysWhere(t)!
    switch (t.ctx.act) {
      case 'herring':
        // The Red Herring's room bears them out. The murderer's does not.
        return herringPress(t, where)
      case 'thief':
        // A theft, in the room they lie about: whose box was never forced.
        return {
          kind: 'confess',
          claims: [{ kind: 'role', role: 'thief' }, { kind: 'theft', room: where.room }, { kind: 'whereabouts', ...where }],
          lineKey: 'press.confess',
        }
      case 'blackmailer':
        // Nobody in the house will say they were bled by them; and the
        // Blackmailer says truly where they were, which this one cannot.
        return {
          kind: 'confess',
          claims: [{ kind: 'role', role: 'blackmailer' }, { kind: 'relationship', subject: t.c, rel: 'cordial' }],
          lineKey: 'press.confess',
        }
      case 'clinger':
        // Alone, they say at last, in a room with nothing of theirs in it.
        return t.ctx.fallback ? clingerPress(t, t.ctx.fallback) : super.press(t)
      default:
        return super.press(t)
    }
  }
}

/** Kills again: whoever knows most against them is dead by the third hour, in the room where they spent the evening. */
export class SerialMurderer extends Murderer {
  /**
   * The murderer leaves nothing of themselves: they are a harder murderer,
   * and are caught without the dead. (Not anybody the murderer's friend has
   * work for; nor whoever has the key to the locked room, or knows where it
   * lies: the door must open.)
   */
  strikesAgain(a: AfterSuspicion, me: CharId): GenFailure | void {
    const { rng, knowledge, honestIds, ties, locations, sceneRoom, config, evidence, pack, cast, truth } = a
    const knows = (c: CharId) =>
      knowledge[c].some(
        (k) =>
          (k.kind === 'sighting' && k.target === me) ||
          k.kind === 'glimpse' ||
          k.kind === 'culpritAttr' ||
          k.kind === 'among' ||
          (k.kind === 'passing' && k.target === me) ||
          (k.kind === 'alignment' && k.target === me) ||
          (k.kind === 'relationship' && k.subject === me),
      )
    const living = honestIds.filter((c) => ties.free(c, 'secondVictim') && locations[c] !== sceneRoom)
    const marked = living.filter(knows)
    const pool = marked.length > 0 ? marked : living
    if (pool.length === 0) return 'no-seam'
    const victim = rng.pick(pool)
    const room = locations[victim]
    const round = Math.min(2, config.rounds - 1)
    evidence.push({
      id: 'second-body',
      room,
      name: (pack.secondBody ?? '{name}, dead and silenced').replace('{name}', cast[victim].shortName),
      fact: { kind: 'killed', victim, room },
      from: round,
      plain: true,
    })
    truth.second = { victim, room, round }
  }
}

/** Owns to it at the last, when the household is gathered. */
export class RegretfulMurderer extends Murderer {
  readonly confessesAtTheLast = true
}

// What a part does with the truth of a guest's night: how they tell it, and
// what they give up when it is put to them that their story cannot stand.
// Inheritance follows how far a part may be believed (its truth class); each
// part overrides only what is its own. Parts hold nothing of a night: a
// guest's night is their Guest (truth and told), and a part is called on it.

import type { Placing } from '../dealing/placing'
import type { GenFailure } from '../dealing/night'
import type { PolicyContext } from '../policy'
import { DRUNK_BELIEFS, INFO_ROLES, ROLES, type RoleSpec } from '../roles'
import type {
  CastMember, CharId, Claim, Guest, GroundTruth, PressOutcome, PublicScript, Relationship, RoleId, Whereabouts,
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
}

/** Passes for the Collector, and hands over something made to bear the murderer out. */
export class Forger extends Accomplice {
  readonly bluff: Bluff = { kind: 'only', role: 'collector', always: true }
}

/** Passes for the Witness, who saw somebody innocent at the scene: so they say. */
export class Framer extends Accomplice {
  readonly bluff: Bluff = { kind: 'only', role: 'witness' }
}

/** Helps him fake his death, and passes for the Witness who saw somebody else at the scene. */
export class Hoaxer extends LiarPart {
  readonly bluff: Bluff = { kind: 'only', role: 'witness' }
}

/** One of the Committee: tells the story they agreed, as the part they agreed. */
export class CommitteeMember extends LiarPart {
  readonly bluff: Bluff = { kind: 'agreed' }
}


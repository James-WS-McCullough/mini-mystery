// What a part does with the truth of a guest's night: how they tell it, and
// what they give up when it is put to them that their story cannot stand.
// Inheritance follows how far a part may be believed (its truth class); each
// part overrides only what is its own. Parts hold nothing of a night: a
// guest's night is their Guest (truth and told), and a part is called on it.

import type { PolicyContext } from '../policy'
import { ROLES, type RoleSpec } from '../roles'
import type { CastMember, CharId, Claim, Guest, GroundTruth, PressOutcome, Relationship, RoleId, Whereabouts } from '../types'
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

export abstract class Part {
  constructor(readonly id: RoleId) {}

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
  claimsToBe(t: Telling): RoleId {
    return t.truth.drunkBelievedRole!
  }
  press(_t: Telling): PressOutcome {
    return { kind: 'baffled', claims: [], lineKey: 'press.hold' }
  }
}

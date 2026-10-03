// The murderer, of whichever kind tonight.

import type { PressOutcome, Relationship } from '../types'
import { LiarPart, type Telling } from './part'
import { clingerPress, herringPress } from './suspicious'

/** Did it, and will tell you they are somebody else. */
export class Murderer extends LiarPart {
  constructor() {
    super('murderer')
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
}

/**
 * The Cunning Murderer, pressed, owns to a lesser guilt that would explain
 * the lie: the part they play, borrowed, with the one thing in it that is
 * not so (its tell).
 */
export class CunningMurderer extends Murderer {
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

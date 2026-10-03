// The suspicious: those who look worse than they are, and the lesser guilt
// each owns to when pressed.

import type { PressOutcome, Whereabouts } from '../types'
import { HonestPart, LiarPart, MaskedPart, trueWhere, type Telling } from './part'

/** Cannot remember where they were. Only the room itself can tell you. */
export class Amnesiac extends HonestPart {
  saysWhere(): Whereabouts | null {
    return null
  }
}

/** Nothing worse than a secret: where they were, and with whom. */
export class Sweetheart extends LiarPart {
  press(t: Telling): PressOutcome {
    return { kind: 'confess', claims: [{ kind: 'role', role: 'sweetheart' }, trueWhere(t)], lineKey: 'press.confess' }
  }
}

/** Frightened, and found out: alone after all, and where. */
export class Clinger extends LiarPart {
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

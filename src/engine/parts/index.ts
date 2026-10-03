// Every part, by its role; and a guest's night told through theirs, with
// whatever somebody else's story has made of it (the ties).

import type { PolicyContext } from '../policy'
import { ROLES } from '../roles'
import type { CharId, Guest, PressOutcome, RoleId, ToldAccount, TrueAccount } from '../types'
import { CarefulMurderer, CunningMurderer, Murderer } from './murderers'
import {
  Accomplice, Cleaner, Companion, Forger, Framer, HonestPart, Hoaxer, LiarPart, MaskedPart, Martyr, MistakenPart, Perjurer,
  Whisperer, trueWhere, type Part, type Telling,
} from './part'
import { CommitteeMember } from './committee'
import { Amnesiac, Blackmailer, Clinger, RedHerring, Sweetheart, Thief } from './suspicious'

export { HonestPart, LiarPart, MaskedPart, MistakenPart, Part, type Bluff, type ScriptForBluffs, type Telling } from './part'

/** The parts with something of their own; every other is told by its truth class. */
const OWN: Partial<Record<RoleId, Part>> = {
  amnesiac: new Amnesiac('amnesiac'),
  sweetheart: new Sweetheart('sweetheart'),
  clinger: new Clinger('clinger'),
  thief: new Thief('thief'),
  redherring: new RedHerring('redherring'),
  blackmailer: new Blackmailer('blackmailer'),
  perjurer: new Perjurer('perjurer'),
  forger: new Forger('forger'),
  framer: new Framer('framer'),
  hoaxer: new Hoaxer('hoaxer'),
  committee: new CommitteeMember('committee'),
  companion: new Companion('companion'),
  martyr: new Martyr('martyr'),
  whisperer: new Whisperer('whisperer'),
  cleaner: new Cleaner('cleaner'),
}
const MURDERERS = { plain: new Murderer(), careful: new CarefulMurderer(), cunning: new CunningMurderer() }

/**
 * The parts placed by their own say, in this order, before everybody else is
 * placed (the order decides the dice; a new part goes in its place in it).
 */
export const PLACED_IN_TURN: readonly RoleId[] = [
  'companion', 'sweetheart', 'clinger', 'redherring', 'murderer',
  'perjurer', 'forger', 'framer', 'cleaner', 'whisperer', 'sponsor', 'martyr',
]

/**
 * The liars whose lie is their own, told in this order (it decides the dice,
 * and the order the stories are heard in): each step a part, and which of
 * its tellings. Every other liar then lies alone (LiarPart.lieAlone).
 */
export const LIE_IN_TURN: readonly (readonly [RoleId, 'lie' | 'lieAsClinger'])[] = [
  ['murderer', 'lie'],
  ['perjurer', 'lie'],
  ['whisperer', 'lie'],
  ['sweetheart', 'lie'],
  ['murderer', 'lieAsClinger'],
  ['clinger', 'lie'],
  ['forger', 'lie'],
]

/**
 * Those whose part settles who they pass for, and what they will say of it,
 * in this order (it decides the dice); the rest are given a part in turn.
 * (The Committee's story is settled once, by the first of them.)
 */
export const PASS_IN_TURN: readonly RoleId[] = ['framer', 'hoaxer', 'murderer', 'committee']

/** Those others come to know of before the quarrel is heard, in this order; and after it. */
export const OTHERS_KNOW_IN_TURN: readonly RoleId[] = ['blackmailer', 'cleaner', 'redherring', 'thief']
export const OTHERS_LEARN_IN_TURN: readonly RoleId[] = ['hoaxer', 'thief']

/** The part a role plays tonight (the murderer's, by the kind of murderer they are). */
export function partOf(role: RoleId, murderer?: string): Part {
  if (role === 'murderer') return murderer === 'careful' ? MURDERERS.careful : murderer === 'cunning' ? MURDERERS.cunning : MURDERERS.plain
  const own = OWN[role]
  if (own) return own
  if (ROLES[role].class === 'accomplice') return new Accomplice(role)
  switch (ROLES[role].truth) {
    case 'concealer':
      return new LiarPart(role)
    case 'masked':
      return new MaskedPart(role)
    case 'unreliable':
      return new MistakenPart(role)
    default:
      return new HonestPart(role)
  }
}

/** A guest's night as they tell it: their part's telling, with what any tie of theirs makes of it. */
export function tell(c: CharId, ctx: PolicyContext, truth: TrueAccount): ToldAccount {
  const t: Telling = { c, me: ctx.cast[c], truth: ctx.truth, ctx, guest: { truth } }
  const part = partOf(truth.role, ctx.truth.murderer)
  const where = part.saysWhere(t)
  return {
    role: part.claimsToBe(t),
    // The one who keeps the Sweetheart's secret says they were alone; the one
    // who swears to the Clinger (or the murderer playing the part), that they were not.
    where:
      where && c === ctx.sweetheartOf
        ? { room: where.room, companions: [] }
        : where && c === ctx.clingerOf && ctx.clung !== undefined
          ? { room: where.room, companions: [ctx.clung] }
          : where,
    standing: part.ownsTo(t),
    // Paid to keep quiet: not a word of what their part tells them.
    knows: ctx.bribe?.to === c ? [{ kind: 'silent' }] : part.saysTheyKnow(t),
    saw: truth.byChance,
  }
}

/** What a guest gives up when pressed: what somebody else's story made them say, or what their part has to own to. */
export function pressOf(c: CharId, ctx: PolicyContext, guest: Pick<Guest, 'truth'>): PressOutcome {
  const t: Telling = { c, me: ctx.cast[c], truth: ctx.truth, ctx, guest }
  // Who paid, and then, at last, what they were paid not to say.
  if (ctx.bribe?.to === c) {
    return { kind: 'recant', claims: [{ kind: 'bribed', by: ctx.bribe.by }, ...ctx.bribe.withheld], lineKey: 'press.bribed' }
  }
  // Whose story they were repeating.
  if (ctx.whisper?.to === c) {
    return { kind: 'recant', claims: [{ kind: 'toldBy', by: ctx.whisper.by }], lineKey: 'press.recant' }
  }
  // The other half of the Sweetheart's secret: not alone, after all.
  if (c === ctx.sweetheartOf) return { kind: 'confess', claims: [trueWhere(t)], lineKey: 'press.confess.company' }
  // Said it to be kind: they were alone, and the Clinger was not with them.
  if (c === ctx.clingerOf && ctx.clung !== undefined) {
    return {
      kind: 'confess',
      claims: [trueWhere(t)],
      lineKey: 'press.confess.vouched',
      slots: { room: guest.truth.where.room, person: ctx.cast[ctx.clung].shortName },
    }
  }
  return partOf(guest.truth.role, ctx.truth.murderer).press(t)
}

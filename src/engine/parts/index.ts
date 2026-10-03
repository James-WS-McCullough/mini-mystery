// Every part, by its role; and a guest's night told through theirs, with
// whatever somebody else's story has made of it (the ties).

import type { PolicyContext } from '../policy'
import { ROLES } from '../roles'
import type { CharId, Guest, PressOutcome, RoleId, ToldAccount, TrueAccount } from '../types'
import { CarefulMurderer, CunningMurderer, Murderer } from './murderers'
import { HonestPart, LiarPart, MaskedPart, MistakenPart, trueWhere, type Part, type Telling } from './part'
import { Amnesiac, Blackmailer, Clinger, RedHerring, Sweetheart, Thief } from './suspicious'

export { HonestPart, LiarPart, MaskedPart, MistakenPart, Part, type Telling } from './part'

/** The parts with something of their own; every other is told by its truth class. */
const OWN: Partial<Record<RoleId, Part>> = {
  amnesiac: new Amnesiac('amnesiac'),
  sweetheart: new Sweetheart('sweetheart'),
  clinger: new Clinger('clinger'),
  thief: new Thief('thief'),
  redherring: new RedHerring('redherring'),
  blackmailer: new Blackmailer('blackmailer'),
}
const MURDERERS = { plain: new Murderer(), careful: new CarefulMurderer(), cunning: new CunningMurderer() }

/** The part a role plays tonight (the murderer's, by the kind of murderer they are). */
export function partOf(role: RoleId, murderer?: string): Part {
  if (role === 'murderer') return murderer === 'careful' ? MURDERERS.careful : murderer === 'cunning' ? MURDERERS.cunning : MURDERERS.plain
  const own = OWN[role]
  if (own) return own
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

// How the household addresses the player. Presentation only: the choice is
// the player's own, made outside the case, and changes no fact of the mystery.
//
// Lines carry two slots. `{sir}` is the servant's word — "sir", "ma’am" — and
// `{detective}` is everybody else's: "Mr Detective", "Mrs Detective". With the
// plain form both come out as "detective", from everyone.

export type Address = 'sir' | 'plain' | 'maam'

export const ADDRESSES: readonly Address[] = ['sir', 'plain', 'maam']

const FORMS: Record<Address, { sir: string; detective: string }> = {
  sir: { sir: 'sir', detective: 'Mr Detective' },
  plain: { sir: 'detective', detective: 'detective' },
  maam: { sir: 'ma’am', detective: 'Mrs Detective' },
}

export function addressSlots(address: Address = 'plain'): { sir: string; detective: string } {
  return FORMS[address] ?? FORMS.plain
}

/** For text outside the dialogue banks: the narrator, the sergeant. */
export function addressPlayer(
  text: string,
  address: Address = 'plain',
  /** Other words the text may carry: the place's own, for instance. */
  extra: Record<string, string> = {},
): string {
  const forms: Record<string, string> = { ...extra, ...addressSlots(address) }
  return text
    .replace(/\{(\w+)\}/g, (m, k: string) => forms[k] ?? m)
    .replace(/(^|[.!?…]\s+)([a-z])/g, (_, lead: string, ch: string) => lead + ch.toUpperCase())
}

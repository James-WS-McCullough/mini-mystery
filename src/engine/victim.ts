// The victim's words: the slots a pack's text may carry wherever it speaks of
// whoever is dead, and the pronouns that go with them. Used by the dealing
// (the papers are named as they are laid), the renderer and the screens alike.

import type { VictimDef } from '../content/schema'

/** The pronouns for the slots `{he}`, `{him}`, `{his}`, `{himself}`, `{He}`, `{His}`, and `{man}`. */
export function victimPronouns(v: Pick<VictimDef, 'pronouns'>): Record<string, string> {
  const she = v.pronouns === 'she'
  const they = v.pronouns === 'they'
  const he = they ? 'they' : she ? 'she' : 'he'
  const his = they ? 'their' : she ? 'her' : 'his'
  return {
    he,
    him: they ? 'them' : she ? 'her' : 'him',
    his,
    himself: they ? 'themselves' : she ? 'herself' : 'himself',
    He: he[0].toUpperCase() + he.slice(1),
    His: his[0].toUpperCase() + his.slice(1),
    man: they ? 'person' : she ? 'woman' : 'man',
  }
}

/** Every slot the victim fills: the names, and the pronouns. */
export function victimSlots(v: VictimDef): Record<string, string> {
  return {
    victim: v.name,
    Victim: v.shortName,
    respectful: v.respectful,
    firstName: v.firstName,
    lastName: v.lastName,
    ...victimPronouns(v),
  }
}

/**
 * A pack's line, with the victim's slots filled. Other slots are left for
 * whoever fills them. A name like "the Reverend" may land at the start of a
 * sentence, and is capitalised there.
 */
export function victimFill(v: VictimDef, text: string): string {
  const slots = victimSlots(v)
  const filled = text.replace(/\{(\w+)\}/g, (m, k: string) => slots[k] ?? m)
  // (Only where the text itself began with the slot: an item's name, "a letter in {Victim}’s hand", stays lower.)
  const cased = filled.replace(/([.!?…]\s+|[.!?…]”\s+)([a-z])/g, (_, lead: string, ch: string) => lead + ch.toUpperCase())
  return text.startsWith('{') ? cased[0].toUpperCase() + cased.slice(1) : cased
}

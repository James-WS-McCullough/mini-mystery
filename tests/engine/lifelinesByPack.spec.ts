// The help hidden about a place is the setting's to choose: the Yard has no
// Sergeant Pike to send (he is at the table) and does not wire itself, so its
// telegram is a chit for the Registry; every other setting hides all five.

import { describe, expect, it } from 'vitest'
import { PACKS } from '../../src/content'
import { LIFELINES, lifelineOf } from '../../src/content/lifelines'
import { generateMystery } from '../../src/engine/generate'
import { DEALING, deal } from '../deal'

describe('lifelines by setting', () => {
  it('the Yard never hides the sergeant, and speaks of Records, not the Yard', { timeout: DEALING }, async () => {
    const yard = PACKS.yard1928
    const cases = await deal(40, (seed) => generateMystery({ seed, pack: yard }))
    const kinds = new Set(cases.flatMap((m) => (m.lifelines ?? []).map((l) => l.kind)))
    expect(kinds.has('pike')).toBe(false)
    expect([...kinds].sort()).toEqual(['coffee', 'expert', 'note', 'telegram'])
    const wire = lifelineOf(yard, 'telegram')
    expect(wire.name).not.toMatch(/Yard/)
    expect(wire.about!.replace('{name}', 'Finn')).toBe('the Registry’s file on Finn')
    expect(wire.icon).toBe(LIFELINES.telegram.icon)
  })

  it('the manor hides all five, in the usual words', { timeout: DEALING }, async () => {
    const cases = await deal(60, (seed) => generateMystery({ seed, pack: PACKS.manor1920s }))
    const kinds = new Set(cases.flatMap((m) => (m.lifelines ?? []).map((l) => l.kind)))
    expect([...kinds].sort()).toEqual(['coffee', 'expert', 'note', 'pike', 'telegram'])
    expect(lifelineOf(PACKS.manor1920s, 'telegram')).toEqual(LIFELINES.telegram)
  })
})

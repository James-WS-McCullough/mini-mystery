// Traits are dealt afresh each case. The deal must follow the characters'
// leanings, keep the table in pairs, and know nothing about guilt.

import { describe, expect, it } from 'vitest'
import { manor1920s } from '../../src/content/manor1920s'
import { generateMystery } from '../../src/engine/generate'
import { Rng } from '../../src/engine/rng'
import { FURTIVE_BELOW, dealTraits, leaningOf } from '../../src/engine/traits'
import { deal } from '../deal'

const pack = manor1920s
const byId = (id: string) => pack.characters.find((c) => c.id === id)!

describe('dealTraits', () => {
  it('gives every guest one of the pack’s traits', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const rng = new Rng(seed)
      const guests = rng.sample(pack.characters, 7)
      const deal = dealTraits(rng, guests, pack.traits)
      expect(deal).toHaveLength(7)
      for (const d of deal) expect(pack.traits.map((t) => t.id)).toContain(d.trait)
    }
  })

  it('lays the table in pairs: two or three shared traits, the rest alone', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const rng = new Rng(seed)
      const deal = dealTraits(rng, rng.sample(pack.characters, 7), pack.traits)
      const sizes = new Map<string, number>()
      for (const d of deal) sizes.set(d.trait, (sizes.get(d.trait) ?? 0) + 1)
      const shape = [...sizes.values()].sort((a, b) => b - a).join('')
      expect(['22111', '2221']).toContain(shape)
    }
  })

  it('follows the leanings: Miss Hart smokes far more often than the Reverend', () => {
    const smokes = { josephine: 0, vicar: 0 }
    const guests = pack.characters.slice(0, 7)
    expect(guests.map((g) => g.id)).toEqual(expect.arrayContaining(['josephine', 'vicar']))
    for (let seed = 1; seed <= 3000; seed++) {
      const deal = dealTraits(new Rng(seed), guests, pack.traits)
      guests.forEach((g, i) => {
        if (deal[i].trait !== 'smoker') return
        if (g.id === 'josephine') smokes.josephine++
        if (g.id === 'vicar') smokes.vicar++
      })
    }
    expect(smokes.vicar).toBeGreaterThan(0)
    expect(smokes.josephine).toBeGreaterThan(smokes.vicar * 4)
  })

  it('marks a guest furtive exactly when the trait is out of character', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const rng = new Rng(seed)
      const guests = rng.sample(pack.characters, 7)
      dealTraits(rng, guests, pack.traits).forEach((d, i) => {
        expect(d.furtive).toBe(leaningOf(guests[i], d.trait) <= FURTIVE_BELOW)
      })
    }
    expect(leaningOf(byId('vicar'), 'smoker')).toBeLessThanOrEqual(FURTIVE_BELOW)
    expect(leaningOf(byId('josephine'), 'smoker')).toBeGreaterThan(FURTIVE_BELOW)
  })

  it('treats a character with no leanings as neutral, never furtive', () => {
    const plain = Array.from({ length: 7 }, (_, i) => ({
      ...byId('colonel'),
      id: `guest${i}`,
      leanings: undefined,
    }))
    for (let seed = 1; seed <= 50; seed++) {
      for (const d of dealTraits(new Rng(seed), plain, pack.traits)) {
        expect(d.furtive).toBe(false)
      }
    }
  })

  it('copes with more guests than traits', () => {
    const crowd = [...pack.characters, ...pack.characters].map((c, i) => ({ ...c, id: `g${i}` }))
    const deal = dealTraits(new Rng(1), crowd, pack.traits.slice(0, 3))
    expect(deal.filter(Boolean)).toHaveLength(crowd.length)
  })
})

const dealt1x400 = await deal(400, (seed) => generateMystery({ seed, pack }))
describe('traits in a generated case', () => {
  const cases = dealt1x400

  it('never describes the culprit by a trait that nobody else has', () => {
    let alone = 0
    for (const m of cases) {
      const c = m.truth.roles.indexOf('culprit')
      const culprit = m.cast[c]
      if (m.cast.filter((g) => g.trait === culprit.trait).length > 1) continue
      alone++
      m.policies.forEach((policy, speaker) => {
        if (speaker === c) return
        for (const claim of policy.knowledge.flatMap((a) => a.claims)) {
          if (claim.kind !== 'glimpse' && claim.kind !== 'culpritAttr') continue
          if (claim.attr.kind === 'trait') expect(claim.attr.trait, `seed ${m.seed}`).not.toBe(culprit.trait)
        }
      })
    }
    // And such culprits do turn up: nobody is spared suspicion for a trait of their own.
    expect(alone).toBeGreaterThan(0)
  })

  it('makes no one more furtive for being guilty', () => {
    // Being furtive is a matter of character and trait alone: the guilty are
    // furtive about as often as the innocent.
    let guilty = 0
    let guiltyFurtive = 0
    let innocent = 0
    let innocentFurtive = 0
    for (const m of cases) {
      const culprit = m.truth.roles.indexOf('culprit')
      for (const c of m.cast) {
        if (c.id === culprit) {
          guilty++
          if (c.furtive) guiltyFurtive++
        } else {
          innocent++
          if (c.furtive) innocentFurtive++
        }
      }
    }
    const gap = Math.abs(guiltyFurtive / guilty - innocentFurtive / innocent)
    expect(gap).toBeLessThan(0.08)
  })
})

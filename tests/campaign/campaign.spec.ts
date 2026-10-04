// The campaign after the first case: each case is dealt fresh on its own
// script and setting, and holds to what it asks for (who is dead, which parts
// walk, who is at the table and in which part, and who had cause).

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { CAMPAIGN, HIDDEN_FROM, campaignCase } from '../../src/campaign'
import { packOf } from '../../src/content'
import { pinDeck, SIMPLE_SCRIPT, KNOT_SCRIPT } from '../../src/engine/deck'
import { generateMystery } from '../../src/engine/generate'
import { Rng } from '../../src/engine/rng'
import { isMotiveGrade, type Mystery } from '../../src/engine/types'
import { useGame, type SaveGame } from '../../src/stores/game'
import { DEALING, deal } from '../deal'

const SEEDS = 12

/** Does the night hold to what the case asked for? */
function holds(c: (typeof CAMPAIGN)[number], m: Mystery) {
  if (c.victim) expect(m.victim.id).toBe(c.victim)
  for (const p of c.pins ?? []) {
    if (p.role) expect(m.truth.roles).toContain(p.role)
    if (p.character) {
      const at = m.cast.findIndex((x) => x.defId === p.character)
      expect(at).toBeGreaterThanOrEqual(0)
      if (p.role) expect(m.truth.roles[at]).toBe(p.role)
      if (p.motive) expect(isMotiveGrade(m.truth.relationships[at])).toBe(true)
    }
  }
}

describe('the campaign', () => {
  it('runs from Case 0 to Case 12, no case twice, the first alone a fixed number', () => {
    expect(CAMPAIGN.map((c) => c.chapter)).toEqual(Array.from({ length: 13 }, (_, i) => `Case ${i}`))
    expect(HIDDEN_FROM).toBe(6)
    expect(new Set(CAMPAIGN.map((c) => c.id)).size).toBe(CAMPAIGN.length)
    expect(CAMPAIGN.filter((c) => c.seed !== undefined).map((c) => c.id)).toEqual(['first-case'])
  })

  it('tells the player nothing but the setting and the shape: no lifelines until the train', () => {
    expect(campaignCase('village')!.script.lifelines).toBe(false)
    expect(campaignCase('train')!.script.lifelines).toBe(true)
    expect(campaignCase('yacht')!.script.passage).toBe(true)
    expect(campaignCase('village-drunk')!.script.passage).toBeUndefined()
  })

  for (const c of CAMPAIGN.slice(1)) {
    it(`${c.chapter}, ${c.name}: holds to what it asks for, whatever the number`, { timeout: DEALING }, async () => {
      const nights = await deal(SEEDS, (seed) =>
        generateMystery({ seed, pack: packOf(c.pack), script: c.script, victim: c.victim, pins: c.pins }),
      )
      for (const m of nights) {
        expect(m.cast).toHaveLength(7)
        holds(c, m)
      }
      if (c.id === 'yacht') expect(nights.every((m) => m.truth.murderer === 'serial')).toBe(true)
      // The later cases: each its own kind of night, and its own friend of the murderer's.
      const kinds = new Set(nights.map((m) => (m.truth.hoax ? 'hoax' : m.truth.suicide ? 'suicide' : m.truth.murderer ?? 'plain')))
      const friends = new Set(nights.flatMap((m) => m.truth.roles.filter((r) => ['perjurer', 'sponsor', 'cleaner', 'forger', 'framer', 'whisperer', 'martyr'].includes(r))))
      if (c.id === 'theatre') {
        expect([...kinds]).toEqual(['regretful'])
        expect([...friends]).toEqual(['perjurer'])
      }
      if (c.id === 'college') {
        expect([...kinds].every((k) => k === 'artful' || k === 'suicide')).toBe(true)
        expect(kinds.has('artful')).toBe(true)
        expect(nights.every((m) => m.truth.locked)).toBe(true)
      }
      if (c.id === 'train-sponsor') expect([...friends]).toEqual(['sponsor'])
      if (c.id === 'hotel') expect([...kinds]).toEqual(['cunning'])
      if (c.id === 'blackwood') {
        expect([...kinds]).toEqual(['hoax'])
        expect(nights.every((m) => m.victim.id === 'blackwood')).toBe(true)
      }
      if (c.id === 'college-cleaner') expect([...friends]).toEqual(['cleaner'])
      if (c.id === 'yard') {
        expect([...kinds]).toEqual(['careful'])
        expect(nights.every((m) => m.victim.id === 'craddock' && m.cast.some((x) => x.defId === 'pike'))).toBe(true)
      }
      if (c.id === 'partner') {
        // (The partner is dead; his lordship is at the table with cause, and is the murderer's friend, never the murderer.)
        for (const m of nights) {
          const lord = m.cast.findIndex((x) => x.defId === 'lord')
          expect(m.truth.roles.indexOf('murderer')).not.toBe(lord)
          expect(m.cast.some((x) => x.defId === 'trent')).toBe(false)
        }
      }
    })
  }
})

describe('pinning the deck', () => {
  const rng = () => new Rng('pins')

  it('deals the part asked for in the place of one of its class', () => {
    const deck = pinDeck(rng(), ['murderer', 'thief', 'loner', 'witness', 'gossip', 'porter', 'steward'], SIMPLE_SCRIPT, [{ role: 'drunk' }])!
    expect(deck).toContain('drunk')
    expect(deck.filter((r) => r === 'thief' || r === 'loner')).toHaveLength(1)
    expect(deck.slice(3)).toEqual(['witness', 'gossip', 'porter', 'steward'])
  })

  it('seats the murderer’s friend in a suspicious guest’s place, and sends the Drunk home', () => {
    const deck = pinDeck(rng(), ['murderer', 'drunk', 'loner', 'witness', 'gossip', 'porter', 'steward'], KNOT_SCRIPT, [{ role: 'sponsor' }])!
    expect(deck).toContain('sponsor')
    expect(deck).not.toContain('drunk')
    expect(deck).toHaveLength(7)
  })

  it('leaves a deck that has the part alone, and refuses what cannot be', () => {
    const deck: readonly string[] = ['murderer', 'thief', 'drunk', 'witness', 'gossip', 'porter', 'steward']
    expect(pinDeck(rng(), deck as never, SIMPLE_SCRIPT, [{ role: 'drunk' }])).toEqual(deck)
    expect(pinDeck(rng(), deck as never, KNOT_SCRIPT, [{ role: 'drunk' }, { role: 'sponsor' }])).toBeNull()
  })
})

describe('a campaign case at the table', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('is dealt fresh each time, and resumes on the number it was dealt', () => {
    const village = campaignCase('village')!
    const game = useGame()
    game.startCase(village)
    const seed = game.mystery!.seed
    expect(game.campaignId).toBe('village')
    expect(game.packId).toBe('village1926')
    expect(game.lifelinesOn).toBe(false)
    expect(game.mystery!.cast).toHaveLength(7)
    game.begin()
    const save = JSON.parse(JSON.stringify(game.exportSave())) as SaveGame
    expect(save.seed).toBe(seed)
    expect(save.campaign).toBe('village')

    setActivePinia(createPinia())
    const resumed = useGame()
    expect(resumed.restore(save)).toBe(true)
    expect(resumed.mystery!.seed).toBe(seed)
    expect(resumed.campaignId).toBe('village')
    expect(resumed.phase).toBe('gather')
  })

  it('seats his lordship at the partner’s death, in the case’s own words', () => {
    const partner = campaignCase('partner')!
    const game = useGame()
    game.startCase(partner)
    holds(partner, game.mystery!)
    expect(game.introText).toContain('Mr. Hugo Trent was found')
    expect(game.introText).not.toMatch(/\{\w+\}/)
  })
})

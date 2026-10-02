// How someone talks is theirs: each character has the manners of speaking
// that suit them, and never falls into one that does not.

import { describe, expect, it } from 'vitest'
import { manor1920s as pack } from '../../src/content/manor1920s'
import { generateMystery } from '../../src/engine/generate'
import { TEMPERAMENTS } from '../../src/engine/types'
import { breath, deal } from '../deal'

const cases = await deal(150, (seed) => generateMystery({ seed, pack }))
const sheet = (defId: string) => pack.characters.find((c) => c.id === defId)!

describe('manners of speaking', () => {
  it('every character has at least two manners, all of them real', () => {
    for (const c of pack.characters) {
      const suited = Object.entries(c.manners ?? {}).filter(([, w]) => (w ?? 0) > 0)
      expect(suited.length, c.id).toBeGreaterThanOrEqual(2)
      for (const [manner] of suited) expect(TEMPERAMENTS).toContain(manner)
    }
  })

  it('nobody ever speaks out of character', () => {
    for (const m of cases) {
      for (const guest of m.cast) {
        const weight = sheet(guest.defId).manners?.[guest.temperament] ?? 0
        expect(weight, `seed ${m.seed}: ${guest.shortName} was ${guest.temperament}`).toBeGreaterThan(0)
      }
    }
  })

  it('every manner a character can have turns up, given enough evenings', async () => {
    const seen = new Map<string, Set<string>>()
    for (let seed = 1; seed <= 250; seed++) {
      await breath()
      for (const guest of generateMystery({ seed, pack }).cast) {
        seen.set(guest.defId, (seen.get(guest.defId) ?? new Set()).add(guest.temperament))
      }
    }
    for (const c of pack.characters) {
      const suited = Object.entries(c.manners ?? {}).filter(([, w]) => (w ?? 0) >= 0.3).map(([k]) => k)
      for (const manner of suited) expect(seen.get(c.id)?.has(manner), `${c.id} never ${manner}`).toBe(true)
    }
  })

  it('a manner says nothing about guilt', () => {
    // The manner is chosen from the character sheet alone, so the murderer is
    // spread across manners much as the innocent are.
    const guilty = new Map<string, number>()
    const innocent = new Map<string, number>()
    for (const m of cases) {
      const culprit = m.truth.roles.indexOf('culprit')
      for (const guest of m.cast) {
        const tally = guest.id === culprit ? guilty : innocent
        tally.set(guest.temperament, (tally.get(guest.temperament) ?? 0) + 1)
      }
    }
    for (const manner of TEMPERAMENTS) {
      const g = (guilty.get(manner) ?? 0) / cases.length
      const i = (innocent.get(manner) ?? 0) / (cases.length * 6)
      expect(Math.abs(g - i), manner).toBeLessThan(0.1)
    }
  })

  it('every manner has words of its own for every kind of answer', () => {
    const openers = Object.keys(pack.dialogue)
      .filter((k) => k.endsWith('.any') && !k.startsWith('press.') && !k.startsWith('reaction.weaponhint'))
      .map((k) => k.slice(0, -4))
    for (const manner of TEMPERAMENTS) {
      for (const key of openers) {
        expect(pack.dialogue[`${key}.${manner}`]?.length ?? 0, `${key}.${manner}`).toBeGreaterThan(0)
      }
    }
  })
})

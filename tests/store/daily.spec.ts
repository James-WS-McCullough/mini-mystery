// The daily case: the same for everyone on the same day, and not always at the manor.

import { describe, expect, it } from 'vitest'
import { PACKS, PACK_IDS } from '../../src/content'
import { generateMystery } from '../../src/engine/generate'
import { dailyPack, dailySeed } from '../../src/ui/profile'

/** A run of days from the 28th of September 2026: one round of the settings, and a couple over. */
const week = Array.from({ length: PACK_IDS.length + 2 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 8, 28 + i))
  return d.toISOString().slice(0, 10)
})

describe('the daily case', () => {
  it('takes each setting in turn, a day each', () => {
    const packs = week.map(dailyPack)
    expect(new Set(packs.slice(0, PACK_IDS.length)).size).toBe(PACK_IDS.length)
    for (let i = PACK_IDS.length; i < week.length; i++) expect(packs[i]).toBe(packs[i - PACK_IDS.length])
    // Across a month's end, too.
    expect(dailyPack('2026-10-31')).not.toBe(dailyPack('2026-11-01'))
  })

  it('opens, whichever setting the day falls to', () => {
    for (const iso of week.slice(0, PACK_IDS.length)) {
      const m = generateMystery({ seed: dailySeed(iso), pack: PACKS[dailyPack(iso)] })
      expect(m.solution, iso).toBeTruthy()
    }
  })
})

// The daily case: the same for everyone on the same day, and not always at the manor.

import { describe, expect, it } from 'vitest'
import { PACKS, PACK_IDS } from '../../src/content'
import { generateMystery } from '../../src/engine/generate'
import { dailyPack, dailySeed } from '../../src/ui/profile'

const week = ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']

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

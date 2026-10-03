import { describe, expect, it } from 'vitest'
import { manor1920s } from '../../src/content/manor1920s'
import { KNOT_SCRIPT, SIMPLE_SCRIPT, TWIST_SCRIPT, WEB_SCRIPT, type Script } from '../../src/engine/deck'
import { generateMystery } from '../../src/engine/generate'

// Nights on which the Collector, or one passing for them, once had nothing to
// hand over: no trace they might take (none left, or only their own), a trace
// the Framer then took from their pocket, and a Committee member with nothing
// to back.
const ONCE_EMPTY: [string, Script, number][] = [
  ['simple', SIMPLE_SCRIPT, 29],
  ['twist', TWIST_SCRIPT, 10],
  ['knot', KNOT_SCRIPT, 49],
  ['knot', KNOT_SCRIPT, 51],
  ['web', WEB_SCRIPT, 2],
  ['web', WEB_SCRIPT, 25],
]

describe('the Collector', () => {
  // (Dealt again, a night may have no Collector at all now; most still do.)
  const nights = ONCE_EMPTY.map(([, script, seed]) => generateMystery({ seed, pack: manor1920s, script }))
  const claimants = nights.flatMap((m) => m.guests.filter((g) => g.told.role === 'collector').map((g) => ({ m, g })))

  it('has something to hand over, whoever says they are the Collector', () => {
    expect(claimants.length).toBeGreaterThanOrEqual(4)
    for (const { m, g } of claimants) expect(m.evidence.some((e) => e.heldBy === g.id)).toBe(true)
  })
})

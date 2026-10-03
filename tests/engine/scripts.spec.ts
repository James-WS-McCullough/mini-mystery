import { describe, expect, it } from 'vitest'
import { manor1920s } from '../../src/content/manor1920s'
import { checkScript } from '../../src/engine/checkScript'
import { KNOT_SCRIPT, SCRIPTS, SIMPLE_SCRIPT, TWIST_SCRIPT, WEB_SCRIPT, smallScript, type Script } from '../../src/engine/deck'
import { generateMystery } from '../../src/engine/generate'
import { Rng } from '../../src/engine/rng'
import type { NightKind, RoleId } from '../../src/engine/types'
import { breath, DEALING } from '../deal'

const about = (s: Script) => checkScript(s).map((p) => p.about)

describe('an evening, as its script sets it', () => {
  it('the four on the title page (and the small household) can all be dealt', () => {
    for (const s of [...Object.values(SCRIPTS), smallScript(SIMPLE_SCRIPT)]) expect(checkScript(s), s.id).toEqual([])
  })

  it('says, in words, what a script asks that cannot be dealt', () => {
    expect(about({ ...SIMPLE_SCRIPT, innocents: [...SIMPLE_SCRIPT.innocents, 'architect'] })).toContain('architect')
    expect(about({ ...TWIST_SCRIPT, nights: { plain: 1, artful: 1 } })).toContain('nights')
    expect(about({ ...TWIST_SCRIPT, nights: { plain: 1, regretful: 1 } })).toContain('nights')
    expect(about({ ...KNOT_SCRIPT, accompliceChance: 1, nights: { plain: 1, careful: 1 } })).toContain('nights')
    expect(about({ ...SIMPLE_SCRIPT, innocents: ['collector', 'companion', 'collector', 'companion'] })).toContain('innocents')
    expect(about({ ...SIMPLE_SCRIPT, innocents: ['thief'] as RoleId[] })).toContain('thief')
    expect(about({ ...WEB_SCRIPT, suspiciousCount: 0, innocentCount: 2 })).toContain('nights')
    // The Committee is a majority, and outnumbers an ordinary night's liars.
    expect(about({ ...WEB_SCRIPT, suspiciousCount: 2, innocentCount: 2 })).toContain('nights')
    // (Five at the table: three of the Committee, two innocent. With the Companion and a passage, one
    // more innocent must be alone at its end; without the passage, two will do.)
    const five = { ...WEB_SCRIPT, suspiciousCount: 1, innocentCount: 3 }
    expect(about(five)).toEqual(['nights'])
    expect(about({ ...five, passage: false, innocents: five.innocents.filter((r) => r !== 'architect') })).toEqual([])
    expect(about({ ...SIMPLE_SCRIPT, lockedRoom: 2 })).toContain('lockedRoom')
    expect(about({ ...TWIST_SCRIPT, innocents: ['oracle' as RoleId, 'gossip', 'collector', 'companion', 'architect'] })).toContain('oracle')
    for (const p of checkScript({ ...TWIST_SCRIPT, innocents: ['gossip', 'collector', 'companion', 'porter'] })) {
      expect(p.text.length).toBeGreaterThan(10)
    }
  })

  it(
    'any evening it passes can be dealt: a Custom evening of chance parts and nights, every time',
    async () => {
      const rng = new Rng('custom evenings')
      const NIGHTS: NightKind[] = ['plain', 'serial', 'cunning', 'careful', 'regretful', 'artful', 'suicide', 'hoax', 'committee']
      let tried = 0
      let dealt = 0
      for (let i = 0; i < 400 && dealt < 12; i++) {
        const keep = <T>(xs: readonly T[], p: number) => xs.filter(() => rng.chance(p))
        const custom: Script = {
          id: 'custom',
          innocents: keep(WEB_SCRIPT.innocents, 0.75),
          suspicious: keep(WEB_SCRIPT.suspicious, 0.7),
          accomplices: rng.chance(0.5) ? keep(WEB_SCRIPT.accomplices, 0.6) : [],
          accompliceChance: rng.pick([0.5, 1]),
          suspiciousCount: rng.pick([1, 2, 2, 3]),
          innocentCount: rng.pick([2, 3, 4, 4]),
          passage: rng.chance(0.5),
          lockedRoom: rng.pick([0, 0.4]),
          nights: Object.fromEntries(keep(NIGHTS, 0.5).map((k) => [k, rng.pick([1, 2, 3])])),
        }
        tried++
        if (checkScript(custom).length > 0) continue
        for (const seed of [1, 2]) {
          await breath()
          const m = generateMystery({ seed, pack: manor1920s, script: custom })
          expect(m.truth.roles.length).toBe(1 + custom.suspiciousCount + (custom.innocentCount ?? 4))
        }
        dealt++
      }
      expect(dealt, `${tried} tried`).toBeGreaterThanOrEqual(12)
    },
    DEALING,
  )
})

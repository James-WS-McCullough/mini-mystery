import { beforeAll, describe, expect, it } from 'vitest'
import { manor1920s } from '../../src/content/manor1920s'
import { KNOT_SCRIPT, SIMPLE_SCRIPT, TWIST_SCRIPT, WEB_SCRIPT, type Script } from '../../src/engine/deck'
import { allSpoken, generateMystery } from '../../src/engine/generate'
import { partOf } from '../../src/engine/parts'
import type { Mystery, NightKind, RoleId } from '../../src/engine/types'
import { DEALING, deal, seedsOf } from '../deal'

let nights: Mystery[] = []
beforeAll(async () => {
  for (const script of [SIMPLE_SCRIPT, TWIST_SCRIPT, KNOT_SCRIPT, WEB_SCRIPT] as Script[]) {
    nights.push(...(await deal(40, (seed) => generateMystery({ seed, pack: manor1920s, script }))))
  }
  // And a few of every kind of night, whatever their dice.
  const kinds: [Script, NightKind][] = [
    [TWIST_SCRIPT, 'cunning'], [TWIST_SCRIPT, 'careful'], [KNOT_SCRIPT, 'regretful'],
    [WEB_SCRIPT, 'hoax'], [WEB_SCRIPT, 'committee'], [WEB_SCRIPT, 'suicide'], [WEB_SCRIPT, 'artful'],
  ]
  for (const [script, kind] of kinds) {
    const seeds = seedsOf(script, kind, 6)
    nights.push(...(await deal(seeds.length, (i) => generateMystery({ seed: seeds[i - 1], pack: manor1920s, script }))))
  }
}, DEALING)

const claimsOf = (m: Mystery, c: number): RoleId[] => [
  ...new Set(allSpoken(m).flatMap((s) => (s.speaker === c && s.claim.kind === 'role' ? [s.claim.role] : []))),
]

describe('who each part may say they are', () => {
  it('holds of everybody, on every night: the bluff of their part, or their own', () => {
    expect(nights.length).toBeGreaterThan(190)
    let checked = 0
    for (const m of nights) {
      for (const g of m.cast) {
        const role = m.truth.roles[g.id]
        const may = partOf(role, m.truth.murderer).mayClaim(m.caseSheet.script)
        for (const r of claimsOf(m, g.id)) {
          expect(may(r), `seed ${m.seed}: ${role} claimed ${r}`).toBe(true)
          checked++
        }
      }
    }
    expect(checked).toBeGreaterThan(1000)
  })

  it('those with one part to pass for always pass for it', () => {
    for (const m of nights) {
      for (const g of m.cast) {
        const cover = partOf(m.truth.roles[g.id]).coverOn(m.caseSheet.script)
        if (!cover) continue
        expect(claimsOf(m, g.id), `seed ${m.seed}`).toContain(cover)
      }
    }
  })

  it('the Committee never claims the same part twice among them', () => {
    const committees = nights.filter((m) => m.truth.committee)
    expect(committees.length).toBeGreaterThan(3)
    for (const m of committees) {
      const parts = m.truth.committee!.flatMap((c) => claimsOf(m, c))
      expect(new Set(parts).size, `seed ${m.seed}`).toBe(parts.length)
    }
  })
})

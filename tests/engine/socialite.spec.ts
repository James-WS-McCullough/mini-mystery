import { beforeAll, describe, expect, it } from 'vitest'
import { manor1920s } from '../../src/content/manor1920s'
import { claimIsTrue } from '../../src/engine/claims'
import { findContradictions } from '../../src/engine/contradictions'
import { KNOT_SCRIPT, SIMPLE_SCRIPT, TWIST_SCRIPT, buildDeck, roleClassOf, truthClassOf } from '../../src/engine/deck'
import { allSpoken, generateMystery } from '../../src/engine/generate'
import { renderClaim, type RenderCtx } from '../../src/engine/render'
import { Rng } from '../../src/engine/rng'
import { enumerateWorlds, isConsistent } from '../../src/engine/solver/worlds'
import type { Claim, Mystery } from '../../src/engine/types'
import { DEALING, deal } from '../deal'

/** The first `count` seeds whose deck holds the Socialite, found from their dice. */
const socialiteSeeds = (script: typeof SIMPLE_SCRIPT, count: number) => {
  const out: number[] = []
  for (let seed = 1; seed < 3000 && out.length < count; seed++) {
    if (buildDeck(new Rng(`${seed}:deck`), script).includes('socialite')) out.push(seed)
  }
  return out
}

let nights: Mystery[] = []
beforeAll(async () => {
  for (const script of [SIMPLE_SCRIPT, TWIST_SCRIPT, KNOT_SCRIPT]) {
    const seeds = socialiteSeeds(script, 25)
    nights.push(...(await deal(seeds.length, (i) => generateMystery({ seed: seeds[i - 1], pack: manor1920s, script }))))
  }
  nights = nights.filter((m) => m.truth.roles.includes('socialite'))
}, DEALING)

const said = (m: Mystery, c: number): Claim[] => m.policies[c].knowledge.flatMap((a) => a.claims)
const list = (m: Mystery, c: number) => said(m, c).find((k) => k.kind === 'guestList')
/** Who says they are a part, other than the speaker. */
const claimants = (m: Mystery, role: string, not: number) =>
  m.guests.filter((g) => g.id !== not && g.told.role === role).map((g) => g.id)

describe('the Socialite', () => {
  it('turns up, and is honest', () => {
    expect(nights.length).toBeGreaterThan(40)
    expect(truthClassOf('socialite')).toBe('honest')
  })

  it('names truly one part here and one away: never her own, never the murderer’s side', () => {
    for (const m of nights) {
      const c = m.truth.roles.indexOf('socialite')
      const k = list(m, c)
      expect(k, `seed ${m.seed}`).toBeDefined()
      if (k?.kind !== 'guestList') continue
      expect(claimIsTrue(k, c, m.truth, m.cast)).toBe(true)
      for (const r of [k.here, k.away]) {
        expect(r).not.toBe('socialite')
        expect(['innocent', 'suspicious']).toContain(roleClassOf(r))
      }
    }
  })

  it('most often names as away a part somebody is passing for', () => {
    let named = 0
    for (const m of nights) {
      const c = m.truth.roles.indexOf('socialite')
      const k = list(m, c)
      if (k?.kind === 'guestList' && claimants(m, k.away, c).length > 0) named++
    }
    expect(named / nights.length).toBeGreaterThan(0.4)
  })

  it('a part said to be away, claimed by somebody, is a contradiction between the two', () => {
    let seen = 0
    for (const m of nights) {
      const c = m.truth.roles.indexOf('socialite')
      const spoken = allSpoken(m)
      const statements = spoken.map((s, i) => ({ id: `s${i}`, ...s }))
      const found = findContradictions(statements, m.evidence, m.caseSheet).filter((x) => x.reason === 'part-said-away')
      const k = list(m, c)
      if (k?.kind !== 'guestList') continue
      for (const o of claimants(m, k.away, c)) {
        // (Whoever says it is not what they say.)
        expect(truthClassOf(m.truth.roles[o]), `seed ${m.seed}`).not.toBe('honest')
        expect(found.some((x) => x.implicated.includes(c) && x.implicated.includes(o)), `seed ${m.seed}`).toBe(true)
        seen++
      }
    }
    expect(seen).toBeGreaterThan(10)
  })

  it('a liar passing for her says an honest guest’s own part is away', () => {
    let seen = 0
    for (const m of nights) {
      for (const g of m.guests) {
        if (g.told.role !== 'socialite' || g.truth.role === 'socialite') continue
        const k = list(m, g.id)
        if (k?.kind !== 'guestList') continue
        if (m.truth.roles[g.id] === 'murderer' && m.truth.murderer === 'careful') continue
        expect(claimIsTrue(k, g.id, m.truth, m.cast)).toBe(false)
        seen++
      }
    }
    expect(seen).toBeGreaterThan(5)
  })

  it('the solver takes her word: no world seats a part she says is away', () => {
    for (const m of nights.slice(0, 15)) {
      const c = m.truth.roles.indexOf('socialite')
      const k = list(m, c)
      if (k?.kind !== 'guestList') continue
      const input = { cast: m.cast, caseSheet: m.caseSheet, spoken: allSpoken(m), evidence: m.evidence.map((e) => e.fact) }
      expect(isConsistent(m.truth.roles, input)).toBe(true)
      const { worlds } = enumerateWorlds(input, { all: true })
      for (const w of worlds) if (w[c] === 'socialite') expect(w).not.toContain(k.away)
    }
  })

  it('is heard in her own words', () => {
    const m = nights[0]
    const ctx: RenderCtx = { mystery: m, pack: manor1920s }
    const text = renderClaim(ctx, 0, { kind: 'guestList', here: 'witness', away: 'sleuth' }, 'x')
    expect(text).toContain('Witness')
    expect(text).toContain('Sleuth')
    expect(text).not.toMatch(/\{\w+\}/)
  })
})

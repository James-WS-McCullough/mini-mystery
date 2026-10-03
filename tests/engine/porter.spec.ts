import { beforeAll, describe, expect, it } from 'vitest'
import { manor1920s } from '../../src/content/manor1920s'
import { claimIsTrue } from '../../src/engine/claims'
import { findContradictions } from '../../src/engine/contradictions'
import { CLASSIC_SCRIPT, CONSPIRACY_SCRIPT, FOGGY_SCRIPT, buildDeck, truthClassOf } from '../../src/engine/deck'
import { allSpoken, generateMystery } from '../../src/engine/generate'
import { renderClaim, type RenderCtx } from '../../src/engine/render'
import { Rng } from '../../src/engine/rng'
import { enumerateWorlds } from '../../src/engine/solver/worlds'
import type { Claim, Mystery } from '../../src/engine/types'
import { DEALING, deal } from '../deal'

/** The first `count` seeds whose deck holds the Porter, found from their dice. */
const porterSeeds = (script: typeof CLASSIC_SCRIPT, count: number) => {
  const out: number[] = []
  for (let seed = 1; seed < 3000 && out.length < count; seed++) {
    if (buildDeck(new Rng(`${seed}:deck`), script).includes('porter')) out.push(seed)
  }
  return out
}

let nights: Mystery[] = []
beforeAll(async () => {
  for (const script of [CLASSIC_SCRIPT, FOGGY_SCRIPT, CONSPIRACY_SCRIPT]) {
    const seeds = porterSeeds(script, 20)
    nights.push(...(await deal(seeds.length, (i) => generateMystery({ seed: seeds[i - 1], pack: manor1920s, script }))))
  }
  nights = nights.filter((m) => m.truth.roles.includes('porter'))
}, DEALING)

const porterOf = (m: Mystery) => m.truth.roles.indexOf('porter')
const said = (m: Mystery, c: number): Claim[] => m.policies[c].knowledge.flatMap((a) => a.claims)
const report = (m: Mystery, c: number) => said(m, c).find((k) => k.kind === 'roomState')

describe('the Porter', () => {
  it('turns up, and is honest', () => {
    expect(nights.length).toBeGreaterThan(20)
    expect(truthClassOf('porter')).toBe('honest')
  })

  it('says truly whether one room had anybody in it that hour; never the scene, nor their own', () => {
    let empty = 0
    let used = 0
    for (const m of nights) {
      const c = porterOf(m)
      const k = report(m, c)
      expect(k, `seed ${m.seed}`).toBeDefined()
      if (k?.kind !== 'roomState') continue
      expect(k.room).not.toBe(m.truth.sceneRoom)
      expect(k.room).not.toBe(m.truth.locations[c])
      expect(claimIsTrue(k, c, m.truth, m.cast)).toBe(true)
      if (k.occupied) used++
      else empty++
    }
    expect(empty).toBeGreaterThan(0)
    expect(used).toBeGreaterThan(0)
  })

  it('a liar claiming to be the Porter reports a room falsely', () => {
    let seen = 0
    for (const m of nights) {
      for (const [c, p] of m.policies.entries()) {
        if (c === porterOf(m)) continue
        const claimsPorter = p.role.some((a) => a.claims.some((k) => k.kind === 'role' && k.role === 'porter'))
        const k = report(m, c)
        if (!claimsPorter || !k) continue
        seen++
        expect(claimIsTrue(k, c, m.truth, m.cast), `seed ${m.seed}`).toBe(false)
      }
    }
    // (Liars borrow the part now and then; never with a true report.)
    expect(seen).toBeGreaterThan(0)
  })

  it('is the one who knows about the key, when a door is locked', () => {
    const locked = nights.filter((m) => m.truth.locked && !m.truth.hoax)
    expect(locked.length).toBeGreaterThan(3)
    let theirs = 0
    for (const m of locked) {
      const seen = m.policies[porterOf(m)].seen
      if ([seen, seen.also].some((a) => a?.lineKey.startsWith('seen.key'))) theirs++
    }
    expect(theirs / locked.length).toBeGreaterThan(0.6)
  })

  it('an empty room said to be used, or a guest said to be in an empty one, is a thread to pull', () => {
    let threads = 0
    for (const m of nights) {
      const c = porterOf(m)
      const k = report(m, c)
      if (k?.kind !== 'roomState' || k.occupied) continue
      const statements = allSpoken(m).map((s, i) => ({ id: `s${i}`, speaker: s.speaker, claim: s.claim }))
      const t = findContradictions(statements, m.evidence, m.caseSheet).filter((x) => x.reason === 'room-said-empty')
      for (const x of t) {
        expect(x.implicated).toContain(c)
        threads++
      }
    }
    expect(threads).toBeGreaterThan(0)
  })

  it('the solver takes their word: no world puts anybody in a room they swore was empty', () => {
    for (const m of nights.slice(0, 15)) {
      const c = porterOf(m)
      const k = report(m, c)
      if (k?.kind !== 'roomState') continue
      const result = enumerateWorlds({
        cast: m.cast,
        caseSheet: m.caseSheet,
        spoken: allSpoken(m),
        evidence: m.evidence.map((e) => e.fact),
      })
      expect(result.culprits.length, `seed ${m.seed}`).toBeGreaterThan(0)
      expect(result.culprits).toContain(m.solution!.culprit)
    }
  })

  it('has words for both answers', () => {
    const m = nights[0]
    const ctx: RenderCtx = { mystery: m, pack: manor1920s }
    for (const occupied of [true, false]) {
      const text = renderClaim(ctx, porterOf(m), { kind: 'roomState', room: m.truth.locations[0], occupied }, 'x')
      expect(text.length).toBeGreaterThan(10)
      expect(text).not.toMatch(/\{|claim\./)
    }
  })
})

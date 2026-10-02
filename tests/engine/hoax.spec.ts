import { describe, expect, it } from 'vitest'
import { manor1920s } from '../../src/content/manor1920s'
import { findContradictions } from '../../src/engine/contradictions'
import { BOTH_SCRIPT, CLASSIC_SCRIPT, FOGGY_SCRIPT, HELPERS, WEB_SCRIPT, roleClassOf, scriptParts } from '../../src/engine/deck'
import { allSpoken, generateMystery } from '../../src/engine/generate'
import { claimIsTrue } from '../../src/engine/claims'
import { enumerateWorlds } from '../../src/engine/solver/worlds'
import type { Mystery } from '../../src/engine/types'
import { judgeAccusation } from '../../src/engine/verdict'

/** The Tangled Web: the only evening on which he may not be dead. */
const nights = Array.from({ length: 200 }, (_, i) => generateMystery({ seed: i + 1, pack: manor1920s, script: WEB_SCRIPT }))
const hoaxes = nights.filter((m) => m.truth.hoax)
const hoaxerOf = (m: Mystery) => m.truth.roles.indexOf('hoaxer')
const facts = (m: Mystery) => m.evidence.map((e) => e.fact)
const LOOKS_FOR_THE_MURDERER = ['witness', 'oracle', 'discoverer', 'sleuth']

describe('a night he is not dead', () => {
  it('comes on The Tangled Web only, and the case file says it may', () => {
    expect(hoaxes.length).toBeGreaterThan(4)
    for (const m of nights) {
      expect(m.caseSheet.script.hoax).toBe(true)
      expect(scriptParts(m.caseSheet.script).find((p) => p.id === 'murderer')?.roles).toEqual(['culprit', 'hoaxer'])
    }
    for (const script of [CLASSIC_SCRIPT, FOGGY_SCRIPT, BOTH_SCRIPT]) {
      for (let seed = 1; seed <= 30; seed++) {
        const m = generateMystery({ seed, pack: manor1920s, script })
        expect(m.truth.hoax).toBeFalsy()
        expect(m.caseSheet.script.hoax).toBeFalsy()
        expect(m.truth.roles).not.toContain('hoaxer')
      }
    }
  })

  it('has the Hoaxer where the murderer would be, no murderer, and nobody’s friend', () => {
    for (const m of hoaxes) {
      const roles = m.truth.roles
      expect(roles).not.toContain('culprit')
      expect(roles.filter((r) => r === 'hoaxer')).toHaveLength(1)
      expect(roleClassOf('hoaxer')).toBe('murderer')
      expect(roles.some((r) => HELPERS.includes(r))).toBe(false)
      for (const r of LOOKS_FOR_THE_MURDERER) expect(roles).not.toContain(r)
      expect(m.truth.murderer).toBeUndefined()
      expect(m.truth.suicide).toBeFalsy()
    }
  })

  it('the Hoaxer was at the scene, lies about it, and was fond of him: on paper, and sometimes on somebody’s word', () => {
    let spoken = 0
    for (const m of hoaxes) {
      const h = hoaxerOf(m)
      expect(m.truth.locations[h]).toBe(m.truth.sceneRoom)
      expect(m.truth.relationships[h]).toBe('devoted')
      const where = m.policies[h].alibi.flatMap((a) => a.claims).find((c) => c.kind === 'whereabouts')!
      expect(claimIsTrue(where, h, m.truth, m.cast)).toBe(false)
      const role = m.policies[h].knowledge.flatMap((a) => a.claims).find((c) => c.kind === 'role')!
      expect(role.kind === 'role' && role.role).not.toBe('hoaxer')
      expect(
        m.evidence.some((e) => e.fact.kind === 'motiveDocument' && e.fact.subject === h && e.fact.rel === 'devoted'),
      ).toBe(true)
      const says = m.policies.some((p, c) =>
        c !== h &&
        [p.seen, ...(p.seen.also ? [p.seen.also] : [])].some((a) =>
          a.claims.some((k) => k.kind === 'relationship' && k.subject === h && k.rel === 'devoted'),
        ),
      )
      if (says) spoken++
    }
    expect(spoken).toBeGreaterThan(0)
  })

  it('the Hoaxer puts it on somebody whose account stands, and is caught out by it', () => {
    for (const m of hoaxes) {
      const h = hoaxerOf(m)
      const framed = m.truth.hoaxed!
      expect(framed).toBeGreaterThanOrEqual(0)
      const said = m.policies[h].knowledge.flatMap((a) => a.claims)
      expect(said).toContainEqual({ kind: 'sighting', target: framed, room: m.truth.sceneRoom })
      expect(m.policies[h].suspect.claims).toContainEqual({ kind: 'suspicion', target: framed })
      const statements = allSpoken(m).map((s, i) => ({ id: `s${i}`, speaker: s.speaker, claim: s.claim }))
      const threads = findContradictions(statements, m.evidence, m.caseSheet)
      expect(threads.some((t) => t.implicated.includes(h))).toBe(true)
    }
  })

  it('has a door locked all night, with no key to be found and nobody who has seen one', () => {
    for (const m of hoaxes) {
      const room = m.truth.locked!
      expect(room).toBeTruthy()
      expect(room).not.toBe(m.truth.sceneRoom)
      expect(m.truth.locations).not.toContain(room)
      expect(m.evidence.some((e) => e.room === room)).toBe(false)
      expect(m.evidence.some((e) => e.fact.kind === 'key')).toBe(false)
      for (const p of m.policies) {
        expect(p.seen.lineKey.startsWith('seen.key')).toBe(false)
        expect(p.seen.also?.lineKey.startsWith('seen.key') ?? false).toBe(false)
      }
      expect((m.lifelines ?? []).some((l) => l.room === room)).toBe(false)
    }
  })

  it('is solved by saying he is not dead; naming anybody, the Hoaxer included, is wrong', () => {
    for (const m of hoaxes) {
      const left = enumerateWorlds({ cast: m.cast, caseSheet: m.caseSheet, spoken: allSpoken(m), evidence: facts(m) }).culprits
      expect(left, `seed ${m.seed}`).toEqual([-2])
      expect(m.solution?.culprit).toBe(-2)
      const gathered = { spoken: allSpoken(m), evidence: facts(m) }
      const right = judgeAccusation(m, { accused: -2, citedSpoken: [], citedEvidence: [], gathered })
      expect(right.correct).toBe(true)
      expect(right.tier).toBe('airtight')
      expect(judgeAccusation(m, { accused: -1, citedSpoken: [], citedEvidence: [], gathered }).correct).toBe(false)
      expect(judgeAccusation(m, { accused: hoaxerOf(m), citedSpoken: [], citedEvidence: [], gathered }).correct).toBe(false)
    }
  })
})

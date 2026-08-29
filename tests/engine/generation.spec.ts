import { describe, expect, it } from 'vitest'
import { manor1920s } from '../../src/content/manor1920s'
import { claimIsTrue } from '../../src/engine/claims'
import { findContradictions } from '../../src/engine/contradictions'
import { FOGGY_SCRIPT, truthClassOf } from '../../src/engine/deck'
import { allSpoken, generateMystery } from '../../src/engine/generate'
import { enumerateWorlds } from '../../src/engine/solver/worlds'

const SEEDS = Array.from({ length: 50 }, (_, i) => i + 1)

describe('generateMystery (seed sweep)', () => {
  for (const seed of SEEDS) {
    it(`seed ${seed} produces a solvable, fair mystery`, () => {
      const mystery = generateMystery({ seed, pack: manor1920s })
      const { cast, caseSheet, truth, policies, evidence } = mystery
      const culprit = truth.roles.indexOf('culprit')

      // The full obtainable record identifies exactly the true culprit.
      const spoken = allSpoken(mystery)
      const worlds = enumerateWorlds({
        cast,
        caseSheet,
        spoken,
        evidence: evidence.map((e) => e.fact),
      })
      expect(worlds.culprits).toEqual([culprit])

      // The rule-solver found it within the budget, following leads only.
      expect(mystery.solution).toBeDefined()
      expect(mystery.solution!.culprit).toBe(culprit)
      expect(mystery.solution!.questionsUsed).toBeLessThanOrEqual(
        mystery.config.rounds * mystery.config.questionsPerRound,
      )
      expect(mystery.solution!.searchesUsed).toBeLessThanOrEqual(mystery.config.rounds)

      // No statement-count tells: every character answers every question.
      for (const m of cast) {
        const policy = policies[m.id]
        expect(policy.role.length).toBeGreaterThan(0)
        expect(policy.alibi.length).toBeGreaterThan(0)
        expect(policy.knowledge.length).toBeGreaterThan(0)
        for (const other of cast) {
          if (other.id !== m.id) expect(policy.aboutPerson[String(other.id)]).toBeDefined()
        }
        expect(policy.aboutPerson['victim']).toBeDefined()
        for (const item of evidence) expect(policy.aboutEvidence[item.id]).toBeDefined()
      }

      // Honest characters never utter a false structural claim.
      for (const s of spoken) {
        if (truthClassOf(truth.roles[s.speaker]) === 'honest') {
          expect(claimIsTrue(s.claim, s.speaker, truth, cast)).not.toBe(false)
        }
      }

      // Press material: some discoverable contradiction implicates the culprit.
      const statements = spoken.map((s, i) => ({ id: `s${i}`, speaker: s.speaker, claim: s.claim }))
      const contradictions = findContradictions(statements, evidence, caseSheet)
      expect(contradictions.some((c) => c.implicated.includes(culprit))).toBe(true)

      // No contradiction is ever between honest characters alone.
      for (const c of contradictions) {
        expect(c.implicated.some((id) => truthClassOf(truth.roles[id]) !== 'honest')).toBe(true)
      }

      // Determinism: the same seed regenerates the same mystery.
      const again = generateMystery({ seed, pack: manor1920s })
      expect(again.truth).toEqual(truth)
      expect(again.cast.map((m) => m.defId)).toEqual(cast.map((m) => m.defId))
    })
  }
})

describe('generateMystery (Foggy Night script — the Drunk in the pool)', () => {
  let drunkSeen = 0
  for (const seed of Array.from({ length: 15 }, (_, i) => i + 1)) {
    it(`foggy seed ${seed} is solvable whatever herrings were drawn`, () => {
      const mystery = generateMystery({ seed, pack: manor1920s, script: FOGGY_SCRIPT })
      const culprit = mystery.truth.roles.indexOf('culprit')

      const worlds = enumerateWorlds({
        cast: mystery.cast,
        caseSheet: mystery.caseSheet,
        spoken: allSpoken(mystery),
        evidence: mystery.evidence.map((e) => e.fact),
      })
      expect(worlds.culprits).toEqual([culprit])
      expect(mystery.solution?.culprit).toBe(culprit)

      const drunk = mystery.truth.roles.indexOf('drunk')
      if (drunk >= 0) {
        drunkSeen++
        expect(mystery.truth.drunkBelievedRole).not.toBeNull()
        // The drunk never strategically lies: whereabouts/sightings are true.
        for (const s of allSpoken(mystery)) {
          if (s.speaker !== drunk) continue
          if (s.claim.kind === 'whereabouts' || s.claim.kind === 'sighting') {
            expect(claimIsTrue(s.claim, s.speaker, mystery.truth, mystery.cast)).toBe(true)
          }
        }
        expect(mystery.policies[drunk].press.kind).toBe('baffled')
      }
    })
  }
  it('the drunk actually appears on some foggy nights', () => {
    expect(drunkSeen).toBeGreaterThan(0)
  })
})

describe('the trio roles', () => {
  it('the begrudged always lacks the means; the loner is always alone and benign', () => {
    let begrudgedSeen = 0
    let lonerSeen = 0
    for (let seed = 1; seed <= 30; seed++) {
      const mystery = generateMystery({ seed, pack: manor1920s })
      const { truth, cast } = mystery
      const begrudged = truth.roles.indexOf('begrudged')
      const loner = truth.roles.indexOf('loner')
      if (begrudged >= 0) {
        begrudgedSeen++
        expect(cast[begrudged].means).not.toContain(truth.methodMeans)
        expect(['hostile', 'indebted', 'jilted']).toContain(truth.relationships[begrudged])
      }
      if (loner >= 0) {
        lonerSeen++
        expect(truth.companions[loner]).toHaveLength(0)
        expect(truth.relationships[loner]).toBe('cordial')
        // Nobody TRULY vouches for the loner (a liar may still frame them).
        for (const s of allSpoken(mystery)) {
          expect(
            s.claim.kind === 'sighting' &&
              s.claim.target === loner &&
              s.claim.room === truth.locations[loner],
          ).toBe(false)
        }
      }
      // The culprit always had the means.
      const culprit = truth.roles.indexOf('culprit')
      expect(cast[culprit].means).toContain(truth.methodMeans)
    }
    expect(begrudgedSeen).toBeGreaterThan(0)
    expect(lonerSeen).toBeGreaterThan(0)
  })
})

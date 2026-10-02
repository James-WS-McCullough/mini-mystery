import { beforeAll, describe, expect, it } from 'vitest'
import { manor1920s } from '../../src/content/manor1920s'
import { claimIsTrue } from '../../src/engine/claims'
import { findContradictions } from '../../src/engine/contradictions'
import { BOTH_SCRIPT, CLASSIC_SCRIPT, FOGGY_SCRIPT, HELPERS, WEB_SCRIPT, roleClassOf, scriptParts, truthClassOf } from '../../src/engine/deck'
import { allSpoken, generateMystery } from '../../src/engine/generate'
import { enumerateWorlds } from '../../src/engine/solver/worlds'
import { isMotiveGrade, type Mystery } from '../../src/engine/types'
import { judgeAccusation } from '../../src/engine/verdict'
import { DEALING, deal, seedsOf } from '../deal'

let web: Mystery[] = []
let four: Mystery[] = []
let knot: Mystery[] = []
beforeAll(async () => {
  // Only the nights the Committee sits, found by their dice; and a few others.
  const seeds = seedsOf(WEB_SCRIPT, 'committee', 14)
  four = await deal(seeds.length, (i) => generateMystery({ seed: seeds[i - 1], pack: manor1920s, script: WEB_SCRIPT }))
  web = [...four, ...(await deal(12, (seed) => generateMystery({ seed, pack: manor1920s, script: WEB_SCRIPT })))]
  knot = await deal(30, (seed) => generateMystery({ seed, pack: manor1920s, script: BOTH_SCRIPT }))
}, DEALING)
const membersOf = (m: Mystery) => m.truth.committee!
const facts = (m: Mystery) => m.evidence.map((e) => e.fact)
const threadsOf = (m: Mystery) =>
  findContradictions(
    allSpoken(m).map((s, i) => ({ id: `s${i}`, speaker: s.speaker, claim: s.claim })),
    m.evidence,
    m.caseSheet,
  )
const gathered = (m: Mystery) => ({ spoken: allSpoken(m), evidence: facts(m) })

describe('the Committee', () => {
  it('sits only on The Tangled Web, and the case file says it may', () => {
    expect(four.length).toBeGreaterThan(4)
    for (const m of web) {
      expect(m.caseSheet.script.committee).toBe(true)
      expect(scriptParts(m.caseSheet.script).find((p) => p.id === 'murderer')?.roles).toContain('committee')
      expect(m.caseSheet.script.murderers).toContain('committee')
    }
    for (const script of [CLASSIC_SCRIPT, FOGGY_SCRIPT, BOTH_SCRIPT]) {
      expect(script.murderers?.committee).toBeUndefined()
    }
    for (const m of knot) expect(m.truth.committee).toBeFalsy()
  })

  it('is four of the seven, and the other three are innocent', () => {
    for (const m of four) {
      expect(membersOf(m)).toHaveLength(4)
      expect(m.truth.roles.filter((r) => r === 'committee')).toHaveLength(4)
      expect(roleClassOf('committee')).toBe('murderer')
      for (const c of m.cast.map((g) => g.id).filter((c) => !membersOf(m).includes(c))) {
        expect(truthClassOf(m.truth.roles[c])).toBe('honest')
        expect(roleClassOf(m.truth.roles[c])).toBe('innocent')
      }
      expect(m.truth.roles.some((r) => HELPERS.includes(r))).toBe(false)
    }
  })

  it('all four were at the scene, could have done it, and had cause; and say they were somewhere else, as somebody else', () => {
    for (const m of four) {
      const weapon = m.evidence.find((e) => e.fact.kind === 'weapon')!
      for (const c of membersOf(m)) {
        expect(m.truth.locations[c]).toBe(m.truth.sceneRoom)
        expect(weapon.fact.kind === 'weapon' && m.cast[c].means.includes(weapon.fact.means)).toBe(true)
        expect(isMotiveGrade(m.truth.relationships[c])).toBe(true)
        const where = m.policies[c].alibi.flatMap((a) => a.claims).find((k) => k.kind === 'whereabouts')!
        expect(claimIsTrue(where, c, m.truth, m.cast)).toBe(false)
        const role = m.policies[c].knowledge.flatMap((a) => a.claims).find((k) => k.kind === 'role')!
        expect(role.kind === 'role' && role.role).not.toBe('committee')
      }
      // Never the same part twice among them.
      const parts = membersOf(m).map(
        (c) => m.policies[c].knowledge.flatMap((a) => a.claims).find((k) => k.kind === 'role')!,
      )
      expect(new Set(parts.map((p) => (p.kind === 'role' ? p.role : ''))).size).toBe(4)
    }
  })

  it('their story holds among themselves, and breaks against the innocent, more than once', () => {
    for (const m of four) {
      const members = membersOf(m)
      const threads = threadsOf(m)
      const against = threads.filter((t) => t.implicated.some((c) => members.includes(c)))
      expect(against.length, `seed ${m.seed}`).toBeGreaterThanOrEqual(2)
      for (const t of against) {
        // Every crack runs to one of the innocent, or to the evidence.
        const innocent = t.implicated.some((c) => !members.includes(c))
        expect(innocent || t.evidenceId !== undefined, `seed ${m.seed} ${t.reason}`).toBe(true)
      }
    }
  })

  it('put it on one of the innocent, who has an alibi of their own', () => {
    for (const m of four) {
      const smeared = m.truth.smeared!
      expect(membersOf(m)).not.toContain(smeared)
      for (const c of membersOf(m)) {
        expect(m.policies[c].suspect.claims).toContainEqual({ kind: 'suspicion', target: smeared })
      }
      const saidAtScene = membersOf(m).some((c) =>
        m.policies[c].knowledge
          .flatMap((a) => a.claims)
          .some((k) => k.kind === 'sighting' && k.target === smeared && k.room === m.truth.sceneRoom),
      )
      expect(saidAtScene).toBe(true)
    }
  })

  it('is solved by saying it was more than one and naming all four; one of them, or three, is wrong', () => {
    for (const m of four) {
      const result = enumerateWorlds({ cast: m.cast, caseSheet: m.caseSheet, ...gathered(m) })
      expect(result.culprits, `seed ${m.seed}`).toEqual([-3])
      expect(result.committees).toEqual([membersOf(m).join(',')])
      expect(m.solution?.culprit).toBe(-3)
      expect(m.solution?.committee).toEqual(membersOf(m))
      const all = judgeAccusation(m, { accused: -3, together: membersOf(m), citedSpoken: [], citedEvidence: [], gathered: gathered(m) })
      expect(all.correct).toBe(true)
      expect(all.tier).toBe('airtight')
      const three = judgeAccusation(m, { accused: -3, together: membersOf(m).slice(1), citedSpoken: [], citedEvidence: [] })
      expect(three.correct).toBe(false)
      const one = judgeAccusation(m, { accused: membersOf(m)[0], citedSpoken: [], citedEvidence: [] })
      expect(one.correct).toBe(false)
    }
  })
})

describe('more than one, on a night with an accomplice', () => {
  it('naming the murderer and their accomplice together is right; and naming the murderer alone still is', () => {
    const paired = knot.filter((m) => m.truth.roles.some((r) => HELPERS.includes(r)))
    expect(paired.length).toBeGreaterThan(3)
    for (const m of paired) {
      const culprit = m.truth.roles.indexOf('culprit')
      const helper = m.truth.roles.findIndex((r) => HELPERS.includes(r))
      const other = m.cast.map((g) => g.id).find((c) => c !== culprit && c !== helper)!
      const both = judgeAccusation(m, { accused: -3, together: [helper, culprit], citedSpoken: [], citedEvidence: [], gathered: gathered(m) })
      expect(both.correct).toBe(true)
      expect(both.others).toBe(m.cast.length - 2)
      expect(judgeAccusation(m, { accused: -3, together: [culprit, other], citedSpoken: [], citedEvidence: [] }).correct).toBe(false)
      expect(judgeAccusation(m, { accused: -3, together: [culprit, helper, other], citedSpoken: [], citedEvidence: [] }).correct).toBe(false)
      expect(judgeAccusation(m, { accused: culprit, citedSpoken: [], citedEvidence: [] }).correct).toBe(true)
    }
  })
})

// The Evening Timeline (playtest): every evening dealt is one only its murderer
// could have done, by everything there is to be had out of the house; the
// honest tell the truth, the liars hide only their stretch, and the rule-based
// detective solves it inside the clock.
import { describe, expect, it } from 'vitest'
import { manor1920s } from '../../src/content/manor1920s'
import { BUDGET } from '../../src/engine/timeline/bot'
import { findContradictions } from '../../src/engine/timeline/contradictions'
import { generateTimeline } from '../../src/engine/timeline/generate'
import { sayAll } from '../../src/engine/timeline/render'
import { murderSlots, whoCould } from '../../src/engine/timeline/solver'
import { SLOTS, VICTIM, type TClaim, type TSpoken, type TimelineCase } from '../../src/engine/timeline/types'

const cases: TimelineCase[] = (['easy', 'normal', 'hard'] as const).flatMap((difficulty) =>
  Array.from({ length: 20 }, (_, i) => generateTimeline({ seed: i + 1, pack: manor1920s, difficulty })),
)
const culpritOf = (tc: TimelineCase) => tc.truth.roles.indexOf('murderer')
const secretOf = (tc: TimelineCase) => tc.truth.roles.indexOf('secretive')
const everything = (tc: TimelineCase): TSpoken[] =>
  tc.cast.flatMap((g) =>
    [...tc.accounts[g.id].evening, ...tc.accounts[g.id].lastSeen, ...tc.accounts[g.id].pressed].map((claim) => ({ speaker: g.id, claim })),
  )

/** Whether a claim is so, on the truth of the evening. */
function isTrue(tc: TimelineCase, speaker: number, claim: TClaim): boolean {
  const at = (c: number, t: number) => (c === VICTIM ? tc.truth.victim[t] : tc.truth.schedule[c][t])
  switch (claim.kind) {
    case 'stay':
      for (let t = claim.from; t <= claim.to; t++) {
        if (at(speaker, t) !== claim.room) return false
        const there = [...tc.cast.map((g) => g.id), VICTIM].filter((c) => c !== speaker && at(c, t) === claim.room)
        if (there.length !== claim.with.length || there.some((c) => !claim.with.includes(c))) return false
      }
      return true
    case 'saw':
      return at(claim.target, claim.slot) === claim.room
    case 'lastSeen':
      return tc.truth.victim[claim.slot] === claim.room
    case 'found':
      return claim.slot === tc.truth.foundSlot && claim.room === tc.scene && speaker === tc.truth.finder
    case 'empty':
      return tc.cast.every((g) => tc.truth.schedule[g.id][claim.slot] !== claim.room)
  }
}

describe('the Evening Timeline', () => {
  it('deals every evening asked for, at every difficulty', () => {
    expect(cases).toHaveLength(60)
  })

  it('has him alone with the murderer at the scene at the moment, found later by the finder', () => {
    for (const tc of cases) {
      const { murderSlot: m, foundSlot: D, schedule, victim } = tc.truth
      expect(m).toBeGreaterThanOrEqual(1)
      expect(D).toBeGreaterThan(m)
      expect(D).toBeLessThan(SLOTS)
      expect(victim[m]).toBe(tc.scene)
      expect(schedule[culpritOf(tc)][m]).toBe(tc.scene)
      for (const g of tc.cast) if (g.id !== culpritOf(tc)) expect(schedule[g.id][m]).not.toBe(tc.scene)
      expect(schedule[tc.truth.finder][D]).toBe(tc.scene)
    }
  })

  it('the honest tell nothing but the truth; the liars only hide their stretch, and own up truly', () => {
    for (const tc of cases) {
      for (const g of tc.cast) {
        const { evening, lastSeen, pressed } = tc.accounts[g.id]
        const liar = g.id === culpritOf(tc) || g.id === secretOf(tc)
        for (const claim of pressed) expect(isTrue(tc, g.id, claim)).toBe(true)
        if (!liar) for (const claim of [...evening, ...lastSeen]) expect(isTrue(tc, g.id, claim), sayAll(tc, g.id, [claim])).toBe(true)
        // Liars lie alone: never company that was not there.
        if (liar) for (const claim of evening) if (claim.kind === 'stay' && !isTrue(tc, g.id, claim)) expect(claim.with).toEqual([])
      }
    }
  })

  it('leaves only the murderer able to have done it, and the true evening always stands', () => {
    for (const tc of cases) {
      const input = { n: tc.cast.length, scene: tc.scene, secretive: tc.secretive, heard: everything(tc), evidence: tc.evidence }
      expect([...whoCould(input).keys()]).toEqual([culpritOf(tc)])
      expect(murderSlots(input, culpritOf(tc), new Set([culpritOf(tc), secretOf(tc)]))).toContain(tc.truth.murderSlot)
    }
  })

  it('lets the murderer and the guest with a secret each be caught in a contradiction', () => {
    for (const tc of cases) {
      const found = findContradictions(everything(tc))
      expect(found.some((c) => c.implicated.includes(culpritOf(tc)))).toBe(true)
      expect(found.some((c) => c.implicated.includes(secretOf(tc)))).toBe(true)
    }
  })

  it('is solved by the rule-based detective inside the clock, and never at once', () => {
    for (const tc of cases) {
      expect(tc.solution.questions).toBeGreaterThanOrEqual(6)
      expect(tc.solution.questions).toBeLessThanOrEqual(BUDGET.hours * BUDGET.questions)
      expect(tc.solution.searches).toBeLessThanOrEqual(BUDGET.hours)
    }
  })

  it('gives the doctor’s note only on the easy evenings, and the watch on all but the hard', () => {
    for (const tc of cases) {
      expect(tc.evidence.some((e) => e.id === 'doctor')).toBe(tc.difficulty === 'easy')
      expect(tc.evidence.some((e) => e.id === 'watch')).toBe(tc.difficulty !== 'hard')
    }
  })

  it('deals the same evening for the same seed', () => {
    const a = generateTimeline({ seed: 7, pack: manor1920s })
    const b = generateTimeline({ seed: 7, pack: manor1920s })
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })
})

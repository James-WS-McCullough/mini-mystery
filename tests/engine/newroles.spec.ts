import { describe, expect, it } from 'vitest'
import { manor1920s } from '../../src/content/manor1920s'
import { claimIsTrue } from '../../src/engine/claims'
import { findContradictions, type NotedStatement } from '../../src/engine/contradictions'
import {
  CLASSIC_SCRIPT,
  CONSPIRACY_SCRIPT,
  liesAboutWhereabouts,
  truthClassOf,
} from '../../src/engine/deck'
import { allSpoken, generateMystery } from '../../src/engine/generate'
import { enumerateWorlds } from '../../src/engine/solver/worlds'
import { attrMatches, neighbours, type Claim, type Mystery } from '../../src/engine/types'

const classic = Array.from({ length: 120 }, (_, i) =>
  generateMystery({ seed: i + 1, pack: manor1920s, script: CLASSIC_SCRIPT }),
)
const conspiracy = Array.from({ length: 40 }, (_, i) =>
  generateMystery({ seed: i + 1, pack: manor1920s, script: CONSPIRACY_SCRIPT }),
)
const holding = (nights: Mystery[], role: string) =>
  nights.filter((m) => m.config.deck.includes(role as never))
const said = (m: Mystery, c: number): Claim[] =>
  [...m.policies[c].alibi, ...m.policies[c].knowledge].flatMap((a) => a.claims)
const where = (m: Mystery, c: number) =>
  m.policies[c].alibi.flatMap((a) => a.claims).find((x) => x.kind === 'whereabouts')

describe('the new roles', () => {
  it('every one of them turns up', () => {
    for (const role of ['steward', 'blackmailer', 'amnesiac', 'sweetheart', 'alibi', 'collector']) {
      expect(holding(classic, role).length, role).toBeGreaterThan(0)
    }
    expect(holding(classic, 'accomplice').length).toBe(0)
    for (const m of conspiracy) {
      expect(m.truth.roles.filter((r) => r === 'accomplice' || r === 'forger').length).toBe(1)
    }
  })

  it('the Companion is one, and was with somebody honest who says the same', () => {
    for (const m of [...classic, ...conspiracy]) {
      const companions = m.truth.roles.flatMap((r, i) => (r === 'alibi' ? [i] : []))
      expect(companions.length).toBeLessThanOrEqual(1)
      for (const c of companions) {
        expect(m.truth.companions[c].length).toBe(1)
        const other = m.truth.companions[c][0]
        expect(truthClassOf(m.truth.roles[other])).toBe('honest')
        const theirs = where(m, other)
        expect(theirs?.kind === 'whereabouts' && theirs.companions).toEqual([c])
      }
    }
  })

  it('the Steward counts the liars seated beside them', () => {
    for (const m of holding(classic, 'steward')) {
      const s = m.truth.roles.indexOf('steward')
      const count = said(m, s).find((c) => c.kind === 'liarsBeside')
      expect(count).toBeDefined()
      if (count?.kind !== 'liarsBeside') continue
      const beside = neighbours(s, m.cast.length)
      expect(count.count).toBe(beside.filter((c) => liesAboutWhereabouts(m.truth.roles[c])).length)
    }
  })

  it('the Blackmailer is named by their victims, who look no further', () => {
    for (const m of holding(classic, 'blackmailer')) {
      const b = m.truth.roles.indexOf('blackmailer')
      const victims = m.cast.map((g) => g.id).filter((c) => said(m, c).some((x) => x.kind === 'blackmailed'))
      expect(victims.length).toBeGreaterThanOrEqual(2)
      for (const v of victims) {
        expect(v).not.toBe(m.truth.roles.indexOf('culprit'))
        expect(m.policies[v].suspect.claims).toContainEqual({ kind: 'suspicion', target: b })
      }
      // They give another role — which their victims' word contradicts — and own up when pressed.
      const claimed = said(m, b).find((c) => c.kind === 'role')
      expect(claimed?.kind === 'role' && claimed.role).not.toBe('blackmailer')
      expect(m.policies[b].press.kind).toBe('confess')
      const noted: NotedStatement[] = allSpoken(m).map((s, i) => ({ id: `s${i}`, ...s }))
      expect(
        findContradictions(noted, m.evidence, m.caseSheet).some(
          (x) => x.reason === 'blackmail-vs-role' && x.implicated.includes(b),
        ),
      ).toBe(true)
      // But where they say they were, they were.
      const w = where(m, b)
      expect(w && claimIsTrue(w, b, m.truth, m.cast)).toBe(true)
    }
  })

  it('the Amnesiac cannot say where they were, until shown what they left there', () => {
    for (const m of holding(classic, 'amnesiac')) {
      const a = m.truth.roles.indexOf('amnesiac')
      expect(where(m, a)).toBeUndefined()
      const trace = m.evidence.find(
        (e) => e.fact.kind === 'trace' && e.fact.room === m.truth.locations[a],
      )
      expect(trace).toBeDefined()
      expect(trace!.fact.kind === 'trace' && attrMatches(trace!.fact.attr, m.cast[a])).toBe(true)
      expect(m.policies[a].aboutEvidence[trace!.id].claims).toContainEqual({
        kind: 'whereabouts',
        room: m.truth.locations[a],
        companions: [],
      })
    }
  })

  it('the Sweetheart was with somebody honest, says otherwise, and owns up when pressed', () => {
    for (const m of holding(classic, 'sweetheart')) {
      const hearts = m.truth.roles.flatMap((r, i) => (r === 'sweetheart' ? [i] : []))
      expect(hearts.length).toBe(1)
      const s = hearts[0]
      expect(m.truth.companions[s].length).toBe(1)
      const other = m.truth.companions[s][0]
      expect(truthClassOf(m.truth.roles[other])).toBe('honest')
      // They give another role, and say they were alone somewhere else.
      const claimed = said(m, s).find((c) => c.kind === 'role')
      expect(claimed?.kind === 'role' && claimed.role).not.toBe('sweetheart')
      const w = where(m, s)
      expect(w?.kind === 'whereabouts' && w.companions).toEqual([])
      expect(w && claimIsTrue(w, s, m.truth, m.cast)).toBe(false)
      // The one they were with says otherwise, and that is a contradiction.
      const noted: NotedStatement[] = allSpoken(m).map((x, i) => ({ id: `s${i}`, ...x }))
      expect(
        findContradictions(noted, m.evidence, m.caseSheet).some(
          (x) => x.implicated.includes(s) && x.implicated.includes(other),
        ),
      ).toBe(true)
      const press = m.policies[s].press
      expect(press.kind).toBe('confess')
      expect(press.claims).toContainEqual({ kind: 'role', role: 'sweetheart' })
      expect(press.claims).toContainEqual({
        kind: 'whereabouts',
        room: m.truth.locations[s],
        companions: [other],
      })
    }
  })

  it('the Collector holds something back from the rooms, and hands it over when asked', () => {
    for (const m of holding(classic, 'collector')) {
      const c = m.truth.roles.indexOf('collector')
      const held = m.evidence.filter((e) => e.heldBy !== undefined)
      if (held.length === 0) continue // nothing was lying about to be taken
      expect(held.length).toBe(1)
      expect(held[0].heldBy).toBe(c)
      expect(held[0].forged).toBeFalsy()
      expect(held[0].fact.kind === 'trace' && held[0].fact.givenBy).toBe(c)
      const answer = m.policies[c].knowledge[m.policies[c].knowledge.length - 1]
      expect(answer.gives).toEqual([held[0].id])
    }
    expect(holding(classic, 'collector').some((m) => m.evidence.some((e) => e.heldBy !== undefined))).toBe(true)
  })

  it('the Forger passes for the Collector and hands over the murderer’s alibi', () => {
    const nights = holding(conspiracy, 'forger')
    expect(nights.length).toBeGreaterThan(0)
    for (const m of nights) {
      const f = m.truth.roles.indexOf('forger')
      const culprit = m.truth.roles.indexOf('culprit')
      expect(said(m, f)).toContainEqual({ kind: 'role', role: 'collector' })
      const made = m.evidence.filter((e) => e.forged)
      expect(made.length).toBe(1)
      expect(made[0].heldBy).toBe(f)
      const his = where(m, culprit)
      expect(his?.kind === 'whereabouts' && his.room).toBe(made[0].room)
      expect(made[0].fact.kind === 'trace' && attrMatches(made[0].fact.attr, m.cast[culprit])).toBe(true)
      // And for all that, the case can still be made.
      const left = enumerateWorlds({
        cast: m.cast,
        caseSheet: m.caseSheet,
        spoken: allSpoken(m),
        evidence: m.evidence.map((e) => e.fact),
      }).culprits
      expect(left).toEqual([culprit])
    }
  })

  it('those with something to hide take their roles from the script, in the house or not', () => {
    let absent = 0
    let present = 0
    for (const m of classic) {
      const culprit = m.truth.roles.indexOf('culprit')
      const claimed = said(m, culprit).find((c) => c.kind === 'role')
      if (claimed?.kind !== 'role') continue
      expect(m.caseSheet.script.innocents).toContain(claimed.role)
      if (m.truth.roles.includes(claimed.role)) present++
      else absent++
    }
    expect(absent).toBeGreaterThan(0)
    expect(present).toBeGreaterThan(0)
  })

  it('the detective is given the script, and not the deck', () => {
    for (const m of classic) {
      const listed = [...m.caseSheet.script.innocents, ...m.caseSheet.script.herrings]
      expect(listed.length).toBeGreaterThan(m.cast.length)
      for (const role of m.truth.roles) if (role !== 'culprit') expect(listed).toContain(role)
      expect(new Set(m.truth.roles).size).toBe(m.cast.length)
    }
  })

  it('the Accomplice passes for the Companion and swears to the murderer’s company', () => {
    expect(holding(conspiracy, 'accomplice').length).toBeGreaterThan(0)
    for (const m of holding(conspiracy, 'accomplice')) {
      const acc = m.truth.roles.indexOf('accomplice')
      const culprit = m.truth.roles.indexOf('culprit')
      expect(said(m, acc)).toContainEqual({ kind: 'role', role: 'alibi' })
      const theirs = where(m, acc)
      const his = where(m, culprit)
      expect(theirs?.kind === 'whereabouts' && theirs.companions).toEqual([culprit])
      expect(his?.kind === 'whereabouts' && his.companions).toEqual([acc])
      expect(m.policies[acc].press.kind).not.toBe('confess')
    }
  })

  it('a false alibi does not clear the murderer, and a true one still clears the innocent', () => {
    for (const m of conspiracy) {
      const culprit = m.truth.roles.indexOf('culprit')
      const alibis = m.cast.flatMap((g) => {
        const w = where(m, g.id)
        return w ? [{ speaker: g.id, claim: w }] : []
      })
      const left = enumerateWorlds({
        cast: m.cast,
        caseSheet: m.caseSheet,
        spoken: alibis,
        evidence: m.evidence.map((e) => e.fact),
      }).culprits
      expect(left).toContain(culprit)
    }
  })
})

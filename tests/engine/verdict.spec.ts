import { describe, expect, it } from 'vitest'
import { manor1920s } from '../../src/content/manor1920s'
import { findContradictions } from '../../src/engine/contradictions'
import { allSpoken, generateMystery } from '../../src/engine/generate'
import { findLinks } from '../../src/engine/links'
import { evaluateCase, judgeAccusation, truePillars, type ThreadInfo } from '../../src/engine/verdict'
import { breath } from '../deal'

describe('the case board', () => {
  // A night on which the murderer does not own to having been at the scene:
  // their opportunity must be shown by a thread, and cannot be read off their word.
  const mystery = (() => {
    for (let seed = 7; seed < 60; seed++) {
      const m = generateMystery({ seed, pack: manor1920s })
      const c = m.truth.roles.indexOf('culprit')
      const claimsScene = m.policies[c].alibi.some((a) =>
        a.claims.some((k) => k.kind === 'whereabouts' && k.room === m.truth.sceneRoom),
      )
      if (!claimsScene) return m
    }
    throw new Error('no such night')
  })()
  const culprit = mystery.truth.roles.indexOf('culprit')
  const innocent = mystery.cast.map((m) => m.id).find((c) => c !== culprit)!
  const statements = allSpoken(mystery).map((s, i) => ({
    id: `s${i}`,
    speaker: s.speaker,
    claim: s.claim,
  }))
  // Simulate a detective who realised every drawable thread.
  const allThreads: ThreadInfo[] = [
    ...findContradictions(statements, mystery.evidence, mystery.caseSheet).map(
      (c): ThreadInfo => ({
        type: 'contradiction',
        reason: c.reason,
        implicated: c.implicated,
        supports: [],
      }),
    ),
    ...findLinks(statements, mystery.evidence, mystery.caseSheet).map(
      (l): ThreadInfo => ({ type: 'link', reason: l.reason, implicated: [], supports: l.supports }),
    ),
  ]
  const everything = {
    citedSpoken: allSpoken(mystery),
    citedEvidence: mystery.evidence.map((e) => e.fact),
    citedThreads: allThreads,
  }

  it('a fully cited correct accusation, threads and all, is airtight', () => {
    const verdict = judgeAccusation(mystery, { accused: culprit, ...everything })
    expect(verdict.correct).toBe(true)
    expect(verdict.tier).toBe('airtight')
    expect(verdict.pillars.means).toBe('established')
    expect(verdict.pillars.motive).toBe('established')
    expect(verdict.pillars.opportunity).toBe('established')
    expect(verdict.score).toBe(1)
    expect(verdict.board.remaining).toEqual([culprit])
    expect(verdict.board.states[culprit]).toBe('sole')
    for (const m of mystery.cast) {
      if (m.id !== culprit) expect(verdict.board.states[m.id]).toBe('cleared')
    }
  })

  it('without their own account or a thread against it, a sole-suspect case is merely strong', () => {
    const verdict = judgeAccusation(mystery, {
      accused: culprit,
      ...everything,
      citedSpoken: everything.citedSpoken.filter(
        (s) => !(s.speaker === culprit && s.claim.kind === 'whereabouts'),
      ),
      citedThreads: [],
      gathered: { spoken: everything.citedSpoken, evidence: everything.citedEvidence },
    })
    expect(verdict.pillars.opportunity).toBe('unknown')
    expect(verdict.board.remaining).toEqual([culprit])
    expect(verdict.conviction).toBeLessThan(3)
    expect(verdict.cleared).toBe(verdict.others)
    expect(verdict.tier).toBe('strong')
  })

  it('judges the accused on what is pinned, and the rest on the whole night’s work', () => {
    // Three exhibits pinned against the accused; everything else merely gathered.
    const pinned = judgeAccusation(mystery, {
      accused: culprit,
      ...everything,
      gathered: { spoken: allSpoken(mystery), evidence: mystery.evidence.map((e) => e.fact) },
    })
    const nothingGathered = judgeAccusation(mystery, {
      accused: culprit,
      ...everything,
      gathered: { spoken: [], evidence: [] },
    })
    expect(pinned.conviction).toBe(3)
    expect(nothingGathered.conviction).toBe(3)
    expect(pinned.cleared).toBe(pinned.others)
    expect(nothingGathered.cleared).toBe(0)
    expect(pinned.tier).toBe('airtight')
    // All three signs shown, and nobody cleared: a strong case, no more.
    expect(nothingGathered.tier).toBe('strong')
    expect(nothingGathered.score).toBeCloseTo(0.5)
  })

  it('alone by their own account, with nothing to bear it out, they had the chance', () => {
    const own = everything.citedSpoken.filter((s) => s.speaker === culprit && s.claim.kind === 'whereabouts')
    expect(own.length).toBeGreaterThan(0)
    const bare = judgeAccusation(mystery, { accused: culprit, citedSpoken: own, citedEvidence: [] })
    expect(bare.pillars.opportunity).toBe('established')
    // Borne out by something, it is no longer theirs to answer for.
    const backed = judgeAccusation(mystery, {
      accused: culprit,
      citedSpoken: own,
      citedEvidence: [],
      citedThreads: [{ type: 'link', reason: 'alibi-trace', implicated: [], supports: [culprit] }],
    })
    expect(backed.pillars.opportunity).not.toBe('established')
  })

  it('knows how matters truly stood with each of them', () => {
    const truly = truePillars(mystery, culprit)
    expect(truly).toEqual({ means: 'established', motive: 'established', opportunity: 'established' })
    for (const m of mystery.cast) {
      if (m.id === culprit) continue
      expect(truePillars(mystery, m.id).opportunity).toBe('ruledOut')
    }
  })

  it('counts the Loner as having had the chance: nothing says they stayed where they were', async () => {
    let lonely = 0
    for (let seed = 1; seed <= 40; seed++) {
      await breath()
      const m = generateMystery({ seed, pack: manor1920s })
      const loner = m.truth.roles.indexOf('loner')
      if (loner < 0) continue
      lonely++
      expect(truePillars(m, loner).opportunity, `seed ${seed}`).toBe('established')
    }
    expect(lonely).toBeGreaterThan(0)
  })

  it('a correct accusation with no case put forward is thin', () => {
    const verdict = judgeAccusation(mystery, { accused: culprit, citedSpoken: [], citedEvidence: [] })
    expect(verdict.correct).toBe(true)
    expect(verdict.tier).toBe('thin')
    expect(verdict.score).toBe(0)
    expect(verdict.board.remaining).toHaveLength(mystery.cast.length)
  })

  it('a wrong accusation loses regardless of the case', () => {
    const verdict = judgeAccusation(mystery, { accused: innocent, ...everything })
    expect(verdict.correct).toBe(false)
    expect(verdict.tier).toBe('wrong')
    expect(verdict.score).toBe(0)
    // The full case still points at the true culprit — the board doesn't lie.
    expect(verdict.board.remaining).toEqual([culprit])
  })

  it('evaluateCase with nothing put forward clears no one', () => {
    const board = evaluateCase(mystery, [], [])
    expect(board.clearedCount).toBe(0)
    expect(board.states.every((s) => s === 'open')).toBe(true)
  })

  it('the culprit can never be cleared by true material', () => {
    const board = evaluateCase(mystery, everything.citedSpoken, everything.citedEvidence)
    expect(board.states[culprit]).not.toBe('cleared')
  })
})

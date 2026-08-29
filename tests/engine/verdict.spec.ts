import { describe, expect, it } from 'vitest'
import { manor1920s } from '../../src/content/manor1920s'
import { findContradictions } from '../../src/engine/contradictions'
import { allSpoken, generateMystery } from '../../src/engine/generate'
import { findLinks } from '../../src/engine/links'
import { evaluateCase, judgeAccusation, type ThreadInfo } from '../../src/engine/verdict'

describe('the case board', () => {
  const mystery = generateMystery({ seed: 7, pack: manor1920s })
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

  it('without the trio threaded, a sole-suspect case is merely strong', () => {
    const verdict = judgeAccusation(mystery, { accused: culprit, ...everything, citedThreads: [] })
    expect(verdict.board.remaining).toEqual([culprit])
    expect(verdict.tier).toBe('strong')
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

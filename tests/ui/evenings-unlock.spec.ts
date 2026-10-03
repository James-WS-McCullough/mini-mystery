import { describe, expect, it } from 'vitest'
import { COMMENDATIONS, eveningsSolved, fileCase, ownEveningsOpen, profile, type CaseRecord } from '../../src/ui/profile'

const filed = (script: CaseRecord['script'], tier: CaseRecord['tier'], extra: Partial<CaseRecord> = {}): CaseRecord => ({
  seed: 1,
  script,
  ...(script !== 'custom' ? { mode: script } : {}),
  daily: null,
  tier,
  accused: 'X',
  culprit: 'X',
  cleared: 0,
  pillars: { means: 'unknown', motive: 'unknown', opportunity: 'unknown' },
  stats: { accusedAtRound: 3, wrongGuesses: 0, threadsDrawn: 0 } as CaseRecord['stats'],
  at: Date.now(),
  ...extra,
})

describe('evenings of your own, opened', () => {
  it('once a case is solved on each of the four evenings; a wrong name or your own evening counts for nothing', () => {
    profile.cases = []
    profile.commendations = {}
    expect(ownEveningsOpen.value).toBe(false)
    fileCase(filed('simple', 'thin', { daily: '2026-10-03' }))
    fileCase(filed('twist', 'airtight'))
    fileCase(filed('knot', 'strong'))
    fileCase(filed('web', 'wrong'))
    fileCase(filed('custom', 'airtight'))
    expect(eveningsSolved.value).toEqual(['simple', 'twist', 'knot'])
    expect(ownEveningsOpen.value).toBe(false)
    expect('host' in profile.commendations).toBe(false)

    const earned = fileCase(filed('web', 'strong'))
    expect(earned.map((c) => c.id)).toContain('host')
    expect(ownEveningsOpen.value).toBe(true)

    // Kept, though the cases that opened it fall off the record.
    profile.cases = []
    expect(ownEveningsOpen.value).toBe(true)
    expect(COMMENDATIONS.some((c) => c.id === 'host')).toBe(true)
  })
})

import { describe, expect, it } from 'vitest'
import { manor1920s } from '../../src/content/manor1920s'
import type { NotedStatement } from '../../src/engine/contradictions'
import { allSpoken, generateMystery } from '../../src/engine/generate'
import { findLinks, matchLink } from '../../src/engine/links'
import { scriptOf } from '../../src/engine/solver/worlds'
import type { CaseSheet, EvidenceItem } from '../../src/engine/types'
import { breath } from '../deal'

const caseSheet: CaseSheet = {
  script: scriptOf(['murderer', 'witness', 'observer', 'confidant', 'companion', 'companion', 'thief']),
  sceneRoom: 'study',
  victimName: 'V',
  windowLabel: 'w',
}

describe('findLinks', () => {
  it('links a mutual alibi', () => {
    const statements: NotedStatement[] = [
      { id: 'a', speaker: 0, claim: { kind: 'whereabouts', room: 'library', companions: [1] } },
      { id: 'b', speaker: 1, claim: { kind: 'whereabouts', room: 'library', companions: [0] } },
    ]
    const links = findLinks(statements, [], caseSheet)
    const mutual = links.find((l) => l.reason === 'mutual-alibi')
    expect(mutual).toBeDefined()
    expect(mutual!.supports.sort()).toEqual([0, 1])
  })

  it('does not link a one-sided or mismatched alibi', () => {
    const statements: NotedStatement[] = [
      { id: 'a', speaker: 0, claim: { kind: 'whereabouts', room: 'library', companions: [1] } },
      { id: 'b', speaker: 1, claim: { kind: 'whereabouts', room: 'kitchen', companions: [0] } },
    ]
    expect(findLinks(statements, [], caseSheet).filter((l) => l.reason === 'mutual-alibi')).toHaveLength(0)
  })

  it('links a sighting that vouches for an account', () => {
    const statements: NotedStatement[] = [
      { id: 'a', speaker: 0, claim: { kind: 'whereabouts', room: 'library', companions: [] } },
      { id: 'b', speaker: 1, claim: { kind: 'sighting', target: 0, room: 'library' } },
    ]
    const vouched = findLinks(statements, [], caseSheet).find((l) => l.reason === 'vouched')
    expect(vouched).toBeDefined()
    expect(vouched!.supports).toEqual([0])
  })

  it('links an account confirmed by a document, and matchLink realises it', () => {
    const doc: EvidenceItem = {
      id: 'doc',
      room: 'study',
      name: 'a ledger',
      fact: { kind: 'motiveDocument', subject: 0, rel: 'indebted' },
    }
    const statements: NotedStatement[] = [
      { id: 'a', speaker: 0, claim: { kind: 'relationship', subject: 0, rel: 'indebted' } },
    ]
    const links = findLinks(statements, [doc], caseSheet)
    expect(links.some((l) => l.reason === 'account-confirmed')).toBe(true)
    expect(matchLink(['a', 'doc'], links)).toHaveLength(1)
    expect(matchLink(['a'], links)).toHaveLength(0)
  })

  it('every generated mystery holds at least one drawable corroboration', async () => {
    for (let seed = 1; seed <= 20; seed++) {
      await breath()
      const mystery = generateMystery({ seed, pack: manor1920s })
      const statements = allSpoken(mystery).map((s, i) => ({
        id: `s${i}`,
        speaker: s.speaker,
        claim: s.claim,
      }))
      const links = findLinks(statements, mystery.evidence, mystery.caseSheet, mystery.cast)
      expect(links.length).toBeGreaterThan(0)
      // The Companion and whoever they were with each vouch for the other.
      if (mystery.config.deck.includes('companion')) {
        expect(links.some((l) => l.reason === 'mutual-alibi')).toBe(true)
      }
    }
  })
})

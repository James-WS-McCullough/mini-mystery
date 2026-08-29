import { describe, expect, it } from 'vitest'
import {
  findContradictions,
  matchContradiction,
  type NotedStatement,
} from '../../src/engine/contradictions'
import type { CaseSheet, EvidenceItem } from '../../src/engine/types'

const caseSheet: CaseSheet = {
  deck: ['culprit', 'witness', 'oracle', 'confidant', 'alibi', 'alibi', 'thief'],
  sceneRoom: 'study',
  victimName: 'V',
  windowLabel: 'w',
  seats: [1, 2, 3, 4, 5, 6, 7],
}

describe('findContradictions', () => {
  it('flags two "alone" claims in the same room', () => {
    const res = findContradictions(
      [
        { id: 'a', speaker: 0, claim: { kind: 'whereabouts', room: 'library', companions: [] } },
        { id: 'b', speaker: 1, claim: { kind: 'whereabouts', room: 'library', companions: [] } },
      ],
      [],
      caseSheet,
    )
    expect(res.some((c) => c.reason === 'companion-mismatch')).toBe(true)
  })

  it('flags a sighting against a whereabouts claim', () => {
    const res = findContradictions(
      [
        { id: 'a', speaker: 0, claim: { kind: 'whereabouts', room: 'library', companions: [] } },
        { id: 'b', speaker: 1, claim: { kind: 'sighting', target: 0, room: 'kitchen' } },
      ],
      [],
      caseSheet,
    )
    expect(res.some((c) => c.reason === 'whereabouts-vs-sighting')).toBe(true)
    expect(res[0].implicated.sort()).toEqual([0, 1])
  })

  it('proves a relationship lie against a motive document', () => {
    const doc: EvidenceItem = {
      id: 'doc',
      room: 'study',
      name: 'an angry letter',
      fact: { kind: 'motiveDocument', subject: 0, rel: 'hostile' },
    }
    const res = findContradictions(
      [{ id: 'a', speaker: 0, claim: { kind: 'relationship', subject: 0, rel: 'cordial' } }],
      [doc],
      caseSheet,
    )
    const proven = res.find((c) => c.reason === 'relationship-vs-document')
    expect(proven).toBeDefined()
    expect(proven!.proven).toBe(true)
    expect(proven!.implicated).toEqual([0])
  })

  it('flags a role claimed by more people than the deck allows', () => {
    const res = findContradictions(
      [
        { id: 'a', speaker: 0, claim: { kind: 'role', role: 'witness' } },
        { id: 'b', speaker: 1, claim: { kind: 'role', role: 'witness' } },
      ],
      [],
      caseSheet,
    )
    const over = res.find((c) => c.reason === 'role-overclaimed')
    expect(over).toBeDefined()
    expect(over!.implicated.sort()).toEqual([0, 1])
  })

  it('matchContradiction realises only the exact contradictory pair', () => {
    const statements: NotedStatement[] = [
      { id: 'a', speaker: 0, claim: { kind: 'whereabouts', room: 'library', companions: [] } },
      { id: 'b', speaker: 1, claim: { kind: 'sighting', target: 0, room: 'kitchen' } },
      { id: 'c', speaker: 2, claim: { kind: 'role', role: 'oracle' } },
    ]
    const found = findContradictions(statements, [], caseSheet)
    expect(matchContradiction(['a', 'b'], found).map((c) => c.reason)).toContain(
      'whereabouts-vs-sighting',
    )
    expect(matchContradiction(['a', 'c'], found)).toHaveLength(0)
    expect(matchContradiction(['a'], found)).toHaveLength(0)
  })

  it('matchContradiction pairs a statement with physical evidence', () => {
    const doc: EvidenceItem = {
      id: 'doc',
      room: 'study',
      name: 'an angry letter',
      fact: { kind: 'motiveDocument', subject: 0, rel: 'hostile' },
    }
    const statements: NotedStatement[] = [
      { id: 'a', speaker: 0, claim: { kind: 'relationship', subject: 0, rel: 'cordial' } },
    ]
    const found = findContradictions(statements, [doc], caseSheet)
    const matched = matchContradiction(['a', 'doc'], found)
    expect(matched).toHaveLength(1)
    expect(matched[0].proven).toBe(true)
  })

  it('does not flag corroborating companions', () => {
    const res = findContradictions(
      [
        { id: 'a', speaker: 0, claim: { kind: 'whereabouts', room: 'library', companions: [1] } },
        { id: 'b', speaker: 1, claim: { kind: 'whereabouts', room: 'library', companions: [0] } },
      ],
      [],
      caseSheet,
    )
    expect(res).toHaveLength(0)
  })
})

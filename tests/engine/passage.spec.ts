import { describe, expect, it } from 'vitest'
import { manor1920s } from '../../src/content/manor1920s'
import { claimIsTrue } from '../../src/engine/claims'
import { findContradictions, type NotedStatement } from '../../src/engine/contradictions'
import {
  CLASSIC_SCRIPT,
  CONSPIRACY_SCRIPT,
  FOGGY_SCRIPT,
  PASSAGE_SCRIPT,
  truthClassOf,
} from '../../src/engine/deck'
import { allSpoken, generateMystery } from '../../src/engine/generate'
import { findLinks } from '../../src/engine/links'
import { enumerateWorlds, isConsistent } from '../../src/engine/solver/worlds'
import {
  TEMPERAMENTS,
  type CaseSheet,
  type CastMember,
  type EvidenceFact,
  type Mystery,
  type RoleId,
  type Spoken,
} from '../../src/engine/types'
import { pillarsFor, truePillars } from '../../src/engine/verdict'

const nights = Array.from({ length: 80 }, (_, i) =>
  generateMystery({ seed: i + 1, pack: manor1920s, script: PASSAGE_SCRIPT }),
)
const used = nights.filter((m) => m.truth.passage!.used)
const unused = nights.filter((m) => !m.truth.passage!.used)
const culpritOf = (m: Mystery) => m.truth.roles.indexOf('culprit')
const facts = (m: Mystery) => m.evidence.map((e) => e.fact)
const noted = (spoken: Spoken[]): NotedStatement[] =>
  spoken.map((s, i) => ({ id: `s${i}`, speaker: s.speaker, claim: s.claim }))
const where = (m: Mystery, c: number) =>
  m.policies[c].alibi.flatMap((a) => a.claims).find((x) => x.kind === 'whereabouts')
const alibis = (m: Mystery): Spoken[] =>
  m.cast.flatMap((g) => {
    const w = where(m, g.id)
    return w ? [{ speaker: g.id, claim: w }] : []
  })
const left = (m: Mystery, spoken: Spoken[], evidence = facts(m)) =>
  enumerateWorlds({ cast: m.cast, caseSheet: m.caseSheet, spoken, evidence }).culprits

describe('the secret passage', () => {
  it('runs from the scene to one other room, where somebody spent the hour alone', () => {
    for (const m of nights) {
      const p = m.truth.passage!
      expect(p.room).not.toBe(m.truth.sceneRoom)
      expect(m.caseSheet.passageRooms).toContain(p.room)
      expect(m.caseSheet.passageRooms).not.toContain(m.truth.sceneRoom)
      const there = m.cast.filter((g) => m.truth.locations[g.id] === p.room)
      expect(there.length).toBe(1)
      expect(m.truth.companions[there[0].id]).toEqual([])
    }
  })

  it('is sometimes the murderer’s way, and sometimes nobody’s', () => {
    expect(used.length).toBeGreaterThan(15)
    expect(unused.length).toBeGreaterThan(15)
    for (const m of used) expect(m.truth.locations[culpritOf(m)]).toBe(m.truth.passage!.room)
    for (const m of unused) {
      expect(m.truth.locations[culpritOf(m)]).toBe(m.truth.sceneRoom)
      const kept = m.cast.find((g) => m.truth.locations[g.id] === m.truth.passage!.room)!
      expect(truthClassOf(m.truth.roles[kept.id])).toBe('honest')
    }
  })

  it('is to be found by searching the room it leads to, and nowhere else', () => {
    for (const m of nights) {
      const found = m.evidence.filter((e) => e.fact.kind === 'passage')
      expect(found.length).toBe(1)
      expect(found[0].room).toBe(m.truth.passage!.room)
      expect(found[0].fact).toEqual({ kind: 'passage', room: m.truth.passage!.room })
      expect(found[0].heldBy).toBeUndefined()
    }
  })

  it('is part of both the harder evenings, and solved there as anywhere', () => {
    for (const script of [FOGGY_SCRIPT, CONSPIRACY_SCRIPT]) {
      expect(script.passage).toBe(true)
      expect(script.innocents).toContain('architect')
      let went = 0
      for (let seed = 1; seed <= 30; seed++) {
        const m = generateMystery({ seed, pack: manor1920s, script })
        const c = culpritOf(m)
        expect(m.truth.passage, `${script.id} ${seed}`).toBeTruthy()
        expect(m.caseSheet.passageRooms?.length).toBeGreaterThan(0)
        expect(m.evidence.filter((e) => e.fact.kind === 'passage').length).toBe(1)
        expect(left(m, allSpoken(m))).toEqual([c])
        if (m.truth.passage!.used) {
          went++
          expect(m.truth.locations[c]).toBe(m.truth.passage!.room)
          // A friend who has made the murderer an alibi leaves them no need of the wall.
          for (const made of ['accomplice', 'forger', 'whisperer']) {
            expect(m.truth.roles).not.toContain(made)
          }
        }
      }
      expect(went, script.id).toBeGreaterThan(0)
    }
  })

  it('there is none on a classic evening', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const m = generateMystery({ seed, pack: manor1920s, script: CLASSIC_SCRIPT })
      expect(m.truth.passage ?? null).toBeNull()
      expect(m.caseSheet.passageRooms).toBeUndefined()
      expect(m.truth.roles).not.toContain('architect')
      expect(m.evidence.some((e) => e.fact.kind === 'passage')).toBe(false)
    }
  })
})

describe('the murderer who went by it', () => {
  it('says truly where they were, and the room bears them out', () => {
    for (const m of used) {
      const c = culpritOf(m)
      const said = where(m, c)!
      expect(claimIsTrue(said, c, m.truth, m.cast)).toBe(true)
      expect(said).toEqual({ kind: 'whereabouts', room: m.truth.passage!.room, companions: [] })
      const links = findLinks(noted(allSpoken(m)), m.evidence, m.caseSheet, m.cast)
      expect(links.some((l) => l.reason === 'alibi-trace' && l.supports.includes(c))).toBe(true)
      expect(links.some((l) => l.reason === 'by-the-passage')).toBe(true)
      // And still they are not what they say they are.
      const role = m.policies[c].knowledge.flatMap((a) => a.claims).find((k) => k.kind === 'role')
      expect(role).not.toEqual({ kind: 'role', role: 'culprit' })
    }
  })

  it('is not cleared by it, with the passage found or not', () => {
    for (const m of used) {
      const c = culpritOf(m)
      expect(left(m, alibis(m))).toContain(c)
      expect(left(m, alibis(m), facts(m).filter((f) => f.kind !== 'passage'))).toContain(c)
    }
  })

  it('is the one the whole night’s work leaves standing', () => {
    for (const m of nights) {
      expect(left(m, allSpoken(m))).toEqual([culpritOf(m)])
      expect(m.solution?.culprit).toBe(culpritOf(m))
    }
  })
})

describe('to have been alone in a room', () => {
  // Three guests, and nobody lying but the murderer. Two say they were alone,
  // each in a room that bears them out; the third says nothing.
  const guest = (id: number, trait: string): CastMember => ({
    id,
    defId: `c${id}`,
    name: `Guest ${id}`,
    shortName: `G${id}`,
    title: '',
    portrait: '?',
    pronouns: 'they',
    trait,
    means: [],
    temperament: 'gracious',
    strategy: 'open',
    defense: 'calm',
  })
  const three = [guest(0, 'cane'), guest(1, 'smoker'), guest(2, 'gloves')]
  const script = { innocents: ['witness', 'oracle', 'gossip'] as RoleId[], herrings: [], helpers: [], herringCount: 0 }
  const sheet = (passageRooms?: string[]): CaseSheet => ({
    script,
    sceneRoom: 'study',
    victimName: 'V',
    windowLabel: 'w',
    ...(passageRooms ? { passageRooms } : {}),
  })
  const accounts: Spoken[] = [
    { speaker: 0, claim: { kind: 'whereabouts', room: 'library', companions: [] } },
    { speaker: 1, claim: { kind: 'whereabouts', room: 'kitchen', companions: [] } },
  ]
  const traces: EvidenceFact[] = [
    { kind: 'trace', room: 'library', attr: { kind: 'trait', trait: 'cane' } },
    { kind: 'trace', room: 'kitchen', attr: { kind: 'trait', trait: 'smoker' } },
  ]
  const old = ['library', 'kitchen', 'dining']
  const suspects = (caseSheet: CaseSheet, spoken: Spoken[], evidence: EvidenceFact[]) =>
    enumerateWorlds({ cast: three, caseSheet, spoken, evidence }).culprits.sort()

  it('on any other evening, clears them', () => {
    expect(suspects(sheet(), accounts, traces)).toEqual([2])
  })

  it('clears nobody until the passage is found', () => {
    expect(suspects(sheet(old), accounts, traces)).toEqual([0, 1, 2])
  })

  it('clears all but whoever was at the end of it, once it is', () => {
    const found: EvidenceFact[] = [...traces, { kind: 'passage', room: 'library' }]
    expect(suspects(sheet(old), accounts, found)).toEqual([0, 2])
  })

  it('takes an honest Architect’s word for where it runs', () => {
    const told: Spoken[] = [
      ...accounts,
      { speaker: 1, claim: { kind: 'role', role: 'architect' } },
      { speaker: 1, claim: { kind: 'passage', room: 'library' } },
    ]
    const withArchitect = { ...sheet(old), script: { ...script, innocents: [...script.innocents, 'architect' as RoleId] } }
    // Guest 1 is the Architect, or is the murderer and lying: either way, not guest 2's doing alone.
    expect(suspects(withArchitect, told, traces)).toEqual([0, 1, 2])
    // And with guest 1 borne out by somebody who was with them, the word holds.
    const together: Spoken[] = [
      { speaker: 0, claim: { kind: 'whereabouts', room: 'library', companions: [] } },
      { speaker: 1, claim: { kind: 'whereabouts', room: 'kitchen', companions: [2] } },
      { speaker: 2, claim: { kind: 'whereabouts', room: 'kitchen', companions: [1] } },
      { speaker: 1, claim: { kind: 'passage', room: 'dining' } },
    ]
    expect(suspects(withArchitect, together, traces)).toEqual([])
  })

  it('two who were together answer for each other, passage or no passage', () => {
    const together: Spoken[] = [
      { speaker: 0, claim: { kind: 'whereabouts', room: 'library', companions: [1] } },
      { speaker: 1, claim: { kind: 'whereabouts', room: 'library', companions: [0] } },
    ]
    expect(suspects(sheet(old), together, [{ kind: 'passage', room: 'library' }])).toEqual([2])
  })

  it('there is one passage: it cannot be found in one room and truly said to be in another', () => {
    const told: Spoken[] = [
      { speaker: 1, claim: { kind: 'whereabouts', room: 'kitchen', companions: [2] } },
      { speaker: 2, claim: { kind: 'whereabouts', room: 'kitchen', companions: [1] } },
      { speaker: 1, claim: { kind: 'passage', room: 'dining' } },
    ]
    expect(suspects(sheet(old), told, [{ kind: 'passage', room: 'library' }])).toEqual([])
  })

  it('in every generated night, finding the passage only ever narrows the field', () => {
    let narrowed = 0
    for (const m of nights) {
      const rooms = (passage: boolean) =>
        facts(m).filter((f) => f.kind === 'trace' || (passage && f.kind === 'passage'))
      const before = left(m, alibis(m), rooms(false))
      const after = left(m, alibis(m), rooms(true))
      for (const c of after) expect(before).toContain(c)
      expect(after).toContain(culpritOf(m))
      if (after.length < before.length) narrowed++
    }
    expect(narrowed).toBeGreaterThan(nights.length / 2)
  })
})

describe('the Architect', () => {
  const holding = nights.filter((m) => m.truth.roles.includes('architect'))

  it('is sometimes in the house, and sometimes not', () => {
    expect(holding.length).toBeGreaterThan(10)
    expect(holding.length).toBeLessThan(nights.length)
  })

  it('knows where the passage runs, and says so', () => {
    for (const m of holding) {
      const a = m.truth.roles.indexOf('architect')
      expect(truthClassOf('architect')).toBe('honest')
      const said = m.policies[a].knowledge.at(-1)!.claims
      expect(said).toContainEqual({ kind: 'role', role: 'architect' })
      expect(said).toContainEqual({ kind: 'passage', room: m.truth.passage!.room })
    }
  })

  it('may be somebody else’s cover — who sends you to the wrong room, and is found out there', () => {
    let liars = 0
    for (const m of nights) {
      m.policies.forEach((p, c) => {
        const said = p.knowledge.at(-1)!.claims
        const passage = said.find((k) => k.kind === 'passage')
        if (!passage || m.truth.roles[c] === 'architect') return
        liars++
        expect(claimIsTrue(passage, c, m.truth, m.cast)).toBe(false)
        const threads = findContradictions(noted(allSpoken(m)), m.evidence, m.caseSheet)
        expect(
          threads.some(
            (t) => t.reason === 'passage-conflict' && t.proven && t.implicated.includes(c) && t.evidenceId === 'passage',
          ),
        ).toBe(true)
      })
    }
    expect(liars).toBeGreaterThan(0)
  })
})

describe('means, motive and opportunity on such a night', () => {
  it('the passage and their own account show the murderer’s opportunity', () => {
    for (const m of used) {
      const c = culpritOf(m)
      const pillars = pillarsFor(m, c, {
        spoken: [{ speaker: c, claim: where(m, c)! }],
        evidence: facts(m).filter((f) => f.kind === 'passage'),
        threads: [{ type: 'link', reason: 'alibi-trace', implicated: [], supports: [c] }],
      })
      expect(pillars.opportunity).toBe('established')
      expect(truePillars(m, c).opportunity).toBe('established')
    }
  })

  it('a trace is no alibi while the passage is unfound', () => {
    const m = nights[0]
    const g = m.cast.find((x) => where(m, x.id) !== undefined && m.truth.companions[x.id].length === 0)!
    const pillars = pillarsFor(m, g.id, {
      spoken: [{ speaker: g.id, claim: where(m, g.id)! }],
      evidence: [],
      threads: [{ type: 'link', reason: 'alibi-trace', implicated: [], supports: [g.id] }],
    })
    expect(pillars.opportunity).toBe('unknown')
  })
})

describe('what is said of it', () => {
  it('every manner has words for the passage when it is shown them', () => {
    for (const manner of TEMPERAMENTS) {
      expect(manor1920s.dialogue[`evidence.passage.${manner}`]?.length ?? 0, manner).toBeGreaterThan(0)
    }
    expect(manor1920s.dialogue['claim.passage'].length).toBeGreaterThan(3)
    expect(manor1920s.roleNames.architect).toBe('the Architect')
  })
})

describe('the Discoverer', () => {
  const both = [
    ...nights,
    ...Array.from({ length: 40 }, (_, i) => generateMystery({ seed: i + 1, pack: manor1920s, script: FOGGY_SCRIPT })),
  ]
  const holding = both.filter((m) => m.truth.roles.includes('discoverer'))

  it('found the body, and says truly whether the door was locked from the inside', () => {
    expect(holding.length).toBeGreaterThan(8)
    for (const m of holding) {
      const d = m.truth.roles.indexOf('discoverer')
      const said = m.policies[d].knowledge.at(-1)!.claims
      expect(said).toContainEqual({ kind: 'door', locked: m.truth.passage!.used })
      expect(claimIsTrue({ kind: 'door', locked: m.truth.passage!.used }, d, m.truth, m.cast)).toBe(true)
    }
  })

  it('a locked door fixes it on whoever was at the end of the passage; an open one clears them', () => {
    for (const m of holding) {
      const c = culpritOf(m)
      const d = m.truth.roles.indexOf('discoverer')
      const kept = m.cast.find((g) => m.truth.locations[g.id] === m.truth.passage!.room)!
      const spoken: Spoken[] = [
        ...alibis(m),
        { speaker: d, claim: { kind: 'role', role: 'discoverer' } },
        { speaker: d, claim: { kind: 'door', locked: m.truth.passage!.used } },
      ]
      const rooms = facts(m).filter((f) => f.kind === 'trace' || f.kind === 'passage')
      const open = left(m, spoken, rooms)
      expect(open).toContain(c)
      if (m.truth.passage!.used) {
        // Only the Discoverer's word, and the Discoverer may be lying: the field is the passage room, or the liars.
        expect(open).toContain(kept.id)
      } else if (where(m, kept.id) !== undefined) {
        // The murderer walked in at the door, so being alone at the end of the passage is no longer damning —
        // unless the Discoverer is the murderer bluffing, which a world may still allow.
        expect(open).toContain(c)
      }
    }
  })

  it('somebody bluffing the Discoverer says the door the other way round, and is caught by the true one', () => {
    let liars = 0
    for (const m of both) {
      m.policies.forEach((p, c) => {
        const door = p.knowledge.at(-1)!.claims.find((k) => k.kind === 'door')
        if (!door || m.truth.roles[c] === 'discoverer') return
        liars++
        expect(claimIsTrue(door, c, m.truth, m.cast)).toBe(false)
        if (m.truth.roles.includes('discoverer')) {
          const threads = findContradictions(noted(allSpoken(m)), m.evidence, m.caseSheet)
          expect(threads.some((t) => t.reason === 'door-conflict' && t.implicated.includes(c))).toBe(true)
        }
      })
    }
    expect(liars).toBeGreaterThan(0)
  })

  it('is not on a classic evening, where no door is ever locked from the inside', () => {
    expect(CLASSIC_SCRIPT.innocents).not.toContain('discoverer')
    const m = generateMystery({ seed: 3, pack: manor1920s, script: CLASSIC_SCRIPT })
    const honest = m.truth.roles.findIndex((r) => truthClassOf(r) === 'honest')
    const input = {
      cast: m.cast,
      caseSheet: m.caseSheet,
      spoken: [{ speaker: honest, claim: { kind: 'door', locked: true } }] as Spoken[],
      evidence: [],
    }
    expect(isConsistent(m.truth.roles, input)).toBe(false)
    input.spoken = [{ speaker: honest, claim: { kind: 'door', locked: false } }]
    expect(isConsistent(m.truth.roles, input)).toBe(true)
  })
})


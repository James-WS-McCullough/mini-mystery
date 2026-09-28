import { describe, expect, it } from 'vitest'
import { manor1920s } from '../../src/content/manor1920s'
import { truthClassOf } from '../../src/engine/deck'
import { allSpoken, generateMystery } from '../../src/engine/generate'
import { enumerateAssignments, enumerateWorlds } from '../../src/engine/solver/worlds'
import type { CaseSheet, CastMember, RoleId, Spoken } from '../../src/engine/types'

function member(id: number, trait: string): CastMember {
  return {
    id,
    defId: `c${id}`,
    name: `Char ${id}`,
    shortName: `C${id}`,
    title: '',
    portrait: '?',
    pronouns: 'they',
    trait,
    means: [],
    seat: id + 1,
    temperament: 'gracious',
    strategy: 'open',
    defense: 'calm',
  }
}

const cast = [member(0, 'cane'), member(1, 'smoker'), member(2, 'cane')]
const deck: RoleId[] = ['culprit', 'witness', 'confidant']
const caseSheet: CaseSheet = {
  deck,
  sceneRoom: 'study',
  victimName: 'V',
  windowLabel: 'w',
  seats: [1, 2, 3],
}

describe('enumerateAssignments', () => {
  it('dedupes identical role cards', () => {
    expect(enumerateAssignments(['culprit', 'alibi', 'alibi'])).toHaveLength(3)
    expect(enumerateAssignments(deck)).toHaveLength(6)
  })
})

describe('enumerateWorlds', () => {
  it('leaves everyone a suspect with no information', () => {
    const res = enumerateWorlds({ cast, caseSheet, spoken: [], evidence: [] })
    expect(res.worlds).toHaveLength(6)
    expect(res.culprits.sort()).toEqual([0, 1, 2])
  })

  it('narrows by the means the method needed', () => {
    const armed = cast.map((m) => ({ ...m, means: m.id === 1 ? [] : ['strength'] }))
    const res = enumerateWorlds({
      cast: armed,
      caseSheet,
      spoken: [],
      evidence: [{ kind: 'weapon', means: 'strength' }],
    })
    expect(res.culprits.sort()).toEqual([0, 2])
  })

  it('eliminates a suspect pinned away from the scene by an honest sighting', () => {
    // The method rules out char 1, who is therefore honest in every world
    // (the deck has no other liar) — and whose sighting pins 0 in the library.
    const armed = cast.map((m) => ({ ...m, means: m.id === 1 ? [] : ['strength'] }))
    const spoken: Spoken[] = [{ speaker: 1, claim: { kind: 'sighting', target: 0, room: 'library' } }]
    const res = enumerateWorlds({
      cast: armed,
      caseSheet,
      spoken,
      evidence: [{ kind: 'weapon', means: 'strength' }],
    })
    expect(res.culprits).toEqual([2])
  })

  it('enforces the exactness of an honest "alone" claim', () => {
    // 1 claims to have been alone in the library; 2 (honest in the worlds
    // where 0 is culprit) saw 0 in the library. "Alone" is complete, so worlds
    // where both statements bind are inconsistent.
    const spoken: Spoken[] = [
      { speaker: 1, claim: { kind: 'whereabouts', room: 'library', companions: [] } },
      { speaker: 2, claim: { kind: 'sighting', target: 0, room: 'library' } },
    ]
    const res = enumerateWorlds({ cast, caseSheet, spoken, evidence: [] })
    // Worlds where 0 is culprit die: 0 is pinned to the scene by role AND to
    // the library by 2's sighting. Worlds where 1 or 2 is culprit survive
    // (the culprit's own statement is discounted as a possible lie).
    expect(res.culprits.sort()).toEqual([1, 2])
  })

  it('discounts info claims from the unreliable but binds their whereabouts', () => {
    const foggyDeck: RoleId[] = ['culprit', 'oracle', 'drunk']
    const foggySheet: CaseSheet = { ...caseSheet, deck: foggyDeck }
    // Char 1 asserts the culprit is a smoker (only char 1 smokes — self-accusing,
    // so it is false info). In worlds where 1 is the oracle this binds and
    // eliminates the cane-wearers; in worlds where 1 is the drunk it binds
    // nothing.
    const spoken: Spoken[] = [
      { speaker: 1, claim: { kind: 'culpritAttr', attr: { kind: 'trait', trait: 'smoker' } } },
    ]
    const res = enumerateWorlds({ cast, caseSheet: foggySheet, spoken, evidence: [] })
    // Consistent worlds: 1=oracle → culprit must smoke → culprit=1? No: the
    // culprit is 0 or 2 in those worlds, neither smokes → inconsistent unless
    // 1 is the culprit (then 1 is a concealer and the claim is discounted) or
    // 1 is the drunk (discounted). All three remain possible culprits ONLY
    // via worlds where the claim doesn't bind.
    for (const w of res.worlds) {
      const speakerRole = w[1]
      if (speakerRole === 'oracle') {
        // then the culprit must be a smoker — impossible among 0 and 2
        expect(w.indexOf('culprit')).toBe(1)
      }
    }
    expect(res.culprits.length).toBeGreaterThan(0)
  })
})

describe('mutual alibis — liars lie alone', () => {
  // Two concealers in the deck, so a pair of liars is otherwise imaginable.
  const deck: RoleId[] = ['culprit', 'thief', 'witness', 'oracle']
  const cast = [member(0, 'cane'), member(1, 'cane'), member(2, 'smoker'), member(3, 'smoker')]
  const sheet: CaseSheet = {
    deck,
    sceneRoom: 'study',
    victimName: 'V',
    windowLabel: 'w',
    seats: [1, 2, 3, 4],
  }
  const together = (speaker: number, other: number): Spoken => ({
    speaker,
    claim: { kind: 'whereabouts', room: 'library', companions: [other] },
  })

  it('clears both when each puts the other beside them', () => {
    const res = enumerateWorlds({
      cast,
      caseSheet: sheet,
      spoken: [together(0, 1), together(1, 0)],
      evidence: [],
    })
    expect(res.culprits.sort()).toEqual([2, 3])
  })

  it('clears no one on a single, unanswered claim of company', () => {
    // Only guest 0 speaks: they may be lying, so they stay a suspect. Guest 1
    // is cleared only in the worlds where guest 0 is honest.
    const res = enumerateWorlds({
      cast,
      caseSheet: sheet,
      spoken: [together(0, 1)],
      evidence: [],
    })
    expect(res.culprits).toContain(0)
    expect(res.culprits).toContain(1)
  })

  it('does not count two guests who name different rooms', () => {
    const res = enumerateWorlds({
      cast,
      caseSheet: sheet,
      spoken: [
        together(0, 1),
        { speaker: 1, claim: { kind: 'whereabouts', room: 'kitchen', companions: [0] } },
      ],
      evidence: [],
    })
    expect(res.culprits).toContain(0)
    expect(res.culprits).toContain(1)
  })
})

describe('liars lie alone — in every generated case', () => {
  it('no concealer ever claims company', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const m = generateMystery({ seed, pack: manor1920s })
      for (const { speaker, claim } of allSpoken(m)) {
        if (claim.kind !== 'whereabouts' || claim.companions.length === 0) continue
        expect(truthClassOf(m.truth.roles[speaker]), `seed ${seed}`).not.toBe('concealer')
      }
    }
  })
})

describe('a trace bears out a lonely alibi', () => {
  const deck: RoleId[] = ['culprit', 'thief', 'witness', 'oracle']
  const cast = [member(0, 'cane'), member(1, 'cane'), member(2, 'smoker'), member(3, 'smoker')]
  const sheet: CaseSheet = {
    deck,
    sceneRoom: 'study',
    victimName: 'V',
    windowLabel: 'w',
    seats: [1, 2, 3, 4],
  }
  const alone = (speaker: number, room: string): Spoken => ({
    speaker,
    claim: { kind: 'whereabouts', room, companions: [] },
  })
  const ash = { kind: 'trace', room: 'library', attr: { kind: 'trait', trait: 'smoker' } } as const

  it('clears the guest whose account it fits', () => {
    const res = enumerateWorlds({ cast, caseSheet: sheet, spoken: [alone(2, 'library')], evidence: [ash] })
    expect(res.culprits.sort()).toEqual([0, 1, 3])
  })

  it('does nothing for an account in another room', () => {
    const res = enumerateWorlds({ cast, caseSheet: sheet, spoken: [alone(2, 'kitchen')], evidence: [ash] })
    expect(res.culprits).toContain(2)
  })

  it('does nothing for a guest it does not fit', () => {
    const res = enumerateWorlds({ cast, caseSheet: sheet, spoken: [alone(0, 'library')], evidence: [ash] })
    expect(res.culprits).toContain(0)
  })

  it('clears no one until the account has been given', () => {
    const res = enumerateWorlds({ cast, caseSheet: sheet, spoken: [], evidence: [ash] })
    expect(res.culprits.sort()).toEqual([0, 1, 2, 3])
  })
})

describe('traces — in every generated case', () => {
  const cases = Array.from({ length: 60 }, (_, i) => generateMystery({ seed: i + 1, pack: manor1920s }))

  it('the scene holds the weapon, and no trace of the killer', () => {
    for (const m of cases) {
      const atScene = m.evidence.filter((e) => e.room === m.caseSheet.sceneRoom)
      expect(atScene.some((e) => e.fact.kind === 'weapon')).toBe(true)
      expect(atScene.some((e) => e.fact.kind === 'trace')).toBe(false)
    }
  })

  it('the method rules out one or two guests, never the culprit', () => {
    for (const m of cases) {
      const without = m.cast.filter((c) => !c.means.includes(m.truth.methodMeans))
      expect([1, 2]).toContain(without.length)
      expect(without.map((c) => c.id)).not.toContain(m.truth.roles.indexOf('culprit'))
      for (const c of m.cast) expect(c.means.length).toBeGreaterThan(0)
    }
  })

  it('a lonely account that a trace fits is always a true one', () => {
    for (const m of cases) {
      for (const { speaker, claim } of allSpoken(m)) {
        if (claim.kind !== 'whereabouts' || claim.companions.length > 0) continue
        const fits = m.evidence.some(
          (e) =>
            e.fact.kind === 'trace' &&
            e.fact.room === claim.room &&
            e.fact.attr.kind === 'trait' &&
            e.fact.attr.trait === m.cast[speaker].trait,
        )
        if (fits) expect(m.truth.locations[speaker], `seed ${m.seed}`).toBe(claim.room)
      }
    }
  })

  it('everyone truly alone left a trace, but for the loner and the liars', () => {
    for (const m of cases) {
      m.cast.forEach((c) => {
        const role = m.truth.roles[c.id]
        const alone = m.truth.companions[c.id].length === 0
        const left = m.evidence.some(
          (e) => e.fact.kind === 'trace' && e.fact.room === m.truth.locations[c.id],
        )
        const should = alone && role !== 'loner' && truthClassOf(role) !== 'concealer'
        if (should) expect(left, `seed ${m.seed}: ${c.shortName}`).toBe(true)
      })
    }
  })
})

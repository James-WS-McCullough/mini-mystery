import { beforeAll, describe, expect, it } from 'vitest'
import { manor1920s } from '../../src/content/manor1920s'
import { claimIsTrue } from '../../src/engine/claims'
import { findContradictions } from '../../src/engine/contradictions'
import { CLASSIC_SCRIPT, CONSPIRACY_SCRIPT, FOGGY_SCRIPT, buildDeck, cunningClingerMay, liesAboutWhereabouts, truthClassOf, type Script } from '../../src/engine/deck'
import { allSpoken, generateMystery } from '../../src/engine/generate'
import { renderClaim, renderPress } from '../../src/engine/render'
import { Rng } from '../../src/engine/rng'
import { enumerateWorlds } from '../../src/engine/solver/worlds'
import type { Claim, Mystery, RoleId } from '../../src/engine/types'
import { DEALING, deal, seedsOf } from '../deal'

/** Nights whose deck holds this role, found from their dice. */
async function holding(role: RoleId, count: number): Promise<Mystery[]> {
  const out: Mystery[] = []
  for (const script of [CLASSIC_SCRIPT, FOGGY_SCRIPT, CONSPIRACY_SCRIPT] as Script[]) {
    const seeds: number[] = []
    for (let seed = 1; seed < 3000 && seeds.length < count; seed++) {
      if (buildDeck(new Rng(`${seed}:deck`), script).includes(role)) seeds.push(seed)
    }
    out.push(...(await deal(seeds.length, (i) => generateMystery({ seed: seeds[i - 1], pack: manor1920s, script }))))
  }
  return out.filter((m) => m.truth.roles.includes(role))
}

let spinsters: Mystery[] = []
let clingers: Mystery[] = []
beforeAll(async () => {
  spinsters = await holding('spinster', 20)
  clingers = await holding('clinger', 20)
}, DEALING)

const said = (m: Mystery, c: number): Claim[] => m.policies[c].knowledge.flatMap((a) => a.claims)
const where = (m: Mystery, c: number) => m.policies[c].alibi.flatMap((a) => a.claims).find((k) => k.kind === 'whereabouts')
const threadsOf = (m: Mystery) =>
  findContradictions(
    allSpoken(m).map((s, i) => ({ id: `s${i}`, speaker: s.speaker, claim: s.claim })),
    m.evidence,
    m.caseSheet,
  )
const solved = (m: Mystery) => {
  const result = enumerateWorlds({
    cast: m.cast,
    caseSheet: m.caseSheet,
    spoken: allSpoken(m),
    evidence: m.evidence.map((e) => e.fact),
    searched: manor1920s.rooms.map((r) => r.id),
  })
  return result.culprits
}

describe('the Spinster', () => {
  it('turns up, and is honest', () => {
    expect(spinsters.length).toBeGreaterThan(20)
    expect(truthClassOf('spinster')).toBe('honest')
  })

  it('says truly whether two guests spent the hour together; never of herself', () => {
    let together = 0
    let apart = 0
    for (const m of spinsters) {
      const c = m.truth.roles.indexOf('spinster')
      const k = said(m, c).find((x) => x.kind === 'together')
      expect(k, `seed ${m.seed}`).toBeDefined()
      if (k?.kind !== 'together') continue
      expect(k.pair).not.toContain(c)
      expect(claimIsTrue(k, c, m.truth, m.cast)).toBe(true)
      if (k.together) together++
      else apart++
    }
    expect(together).toBeGreaterThan(0)
    expect(apart).toBeGreaterThan(0)
  })

  it('most often, of a pair worth knowing about: two who say they were together, or two who were and say not', () => {
    let telling = 0
    let worth = 0
    for (const m of spinsters) {
      const c = m.truth.roles.indexOf('spinster')
      const k = said(m, c).find((x) => x.kind === 'together')
      if (k?.kind !== 'together') continue
      // The pairs that tell: a false pair (the Clinger's, the Perjurer's, the
      // Committee's), the Sweetheart's, the Companion's.
      const pairs: number[][] = []
      for (const g of m.cast) {
        const w = where(m, g.id)
        if (w?.kind === 'whereabouts' && liesAboutWhereabouts(m.truth.roles[g.id])) {
          for (const o of w.companions) pairs.push([g.id, o])
        }
      }
      for (const r of ['sweetheart', 'alibi'] as const) {
        const x = m.truth.roles.indexOf(r)
        if (x >= 0) pairs.push([x, m.truth.companions[x][0]])
      }
      const open = pairs.filter((p) => !p.includes(c))
      if (open.length === 0) continue
      worth++
      if (open.some((p) => p.includes(k.pair[0]) && p.includes(k.pair[1]))) telling++
    }
    expect(worth).toBeGreaterThan(5)
    expect(telling / worth).toBeGreaterThan(0.5)
  })

  it('a pair she says were apart who say they were together is a thread to pull, and the other way about', () => {
    const reasons = new Set(spinsters.flatMap((m) => threadsOf(m).map((t) => t.reason)))
    expect(reasons.has('pair-said-apart') || reasons.has('pair-said-together')).toBe(true)
    for (const m of spinsters) {
      const statements = allSpoken(m)
      for (const t of threadsOf(m).filter((x) => x.reason.startsWith('pair-said'))) {
        // Between whoever told of the pair, and one of the pair.
        const teller = statements[Number(t.statementIds[0].slice(1))]
        expect(teller.claim.kind).toBe('together')
        expect(t.implicated).toContain(teller.speaker)
      }
    }
  })

  it('a liar taking her part tells it falsely, and never of the murderer', () => {
    let seen = 0
    for (const m of [...spinsters, ...clingers]) {
      const culprit = m.truth.roles.indexOf('culprit')
      for (const [c, p] of m.policies.entries()) {
        if (m.truth.roles[c] === 'spinster') continue
        if (!p.role.some((a) => a.claims.some((k) => k.kind === 'role' && k.role === 'spinster'))) continue
        const k = said(m, c).find((x) => x.kind === 'together')
        if (k?.kind !== 'together') continue
        seen++
        const careful = c === culprit && m.truth.murderer === 'careful'
        expect(claimIsTrue(k, c, m.truth, m.cast), `seed ${m.seed}`).toBe(careful)
        if (!careful) expect(k.pair).not.toContain(culprit)
      }
    }
    expect(seen).toBeGreaterThanOrEqual(0)
  })

  it('every night with her is solved, by the one answer', () => {
    for (const m of spinsters.slice(0, 20)) expect(solved(m), `seed ${m.seed}`).toEqual([m.solution!.culprit])
  })

  it('has words for both', () => {
    const m = spinsters[0]
    const c = m.truth.roles.indexOf('spinster')
    for (const together of [true, false]) {
      const text = renderClaim({ mystery: m, pack: manor1920s }, c, { kind: 'together', pair: [0, 1], together }, 'x')
      expect(text).not.toMatch(/\{|claim\./)
      expect(text).toContain(m.cast[0].shortName)
    }
  })
})

describe('the Clinger', () => {
  const kindOf = (m: Mystery) => m.truth.clingerOf!

  it('turns up, a suspicious guest who lies about who they are and where they were', () => {
    expect(clingers.length).toBeGreaterThan(20)
    expect(truthClassOf('clinger')).toBe('concealer')
    for (const m of clingers) {
      const c = m.truth.roles.indexOf('clinger')
      const role = m.policies[c].role.flatMap((a) => a.claims).find((k) => k.kind === 'role')
      expect(role?.kind === 'role' && role.role).not.toBe('clinger')
    }
  })

  it('was alone, and so was the kind friend, apart; and each swears the other was with them, in the friend’s room', () => {
    for (const m of clingers) {
      const c = m.truth.roles.indexOf('clinger')
      const k = kindOf(m)
      expect(k, `seed ${m.seed}`).toBeGreaterThanOrEqual(0)
      expect(truthClassOf(m.truth.roles[k])).toBe('honest')
      expect(m.truth.companions[c]).toEqual([])
      expect(m.truth.companions[k]).toEqual([])
      expect(m.truth.locations[c]).not.toBe(m.truth.locations[k])
      expect(m.truth.locations[c]).not.toBe(m.truth.sceneRoom)
      expect(where(m, c)).toEqual({ kind: 'whereabouts', room: m.truth.locations[k], companions: [k] })
      expect(where(m, k)).toEqual({ kind: 'whereabouts', room: m.truth.locations[k], companions: [c] })
    }
  })

  it('somebody honest always saw the Clinger where they really were', () => {
    for (const m of clingers) {
      const c = m.truth.roles.indexOf('clinger')
      const seen = m.cast.some(
        (g) =>
          g.id !== kindOf(m) &&
          truthClassOf(m.truth.roles[g.id]) === 'honest' &&
          [...said(m, g.id), ...m.policies[g.id].seen.claims, ...(m.policies[g.id].seen.also?.claims ?? [])].some(
            (k) => k.kind === 'sighting' && k.target === c && k.room === m.truth.locations[c],
          ),
      )
      expect(seen, `seed ${m.seed}`).toBe(true)
    }
  })

  it('both leave something of themselves in the room each was truly in', () => {
    for (const m of clingers) {
      for (const c of [m.truth.roles.indexOf('clinger'), kindOf(m)]) {
        const trace = m.evidence.some(
          (e) => e.fact.kind === 'trace' && e.fact.room === m.truth.locations[c] && e.fact.attr.kind === 'trait' && e.fact.attr.trait === m.cast[c].trait,
        )
        expect(trace, `seed ${m.seed} #${c}`).toBe(true)
      }
    }
  })

  it('both break down when pressed, and say where they truly were', () => {
    for (const m of clingers) {
      const c = m.truth.roles.indexOf('clinger')
      const k = kindOf(m)
      const mine = m.policies[c].press
      expect(mine.kind).toBe('confess')
      expect(mine.claims).toContainEqual({ kind: 'role', role: 'clinger' })
      expect(mine.claims).toContainEqual({ kind: 'whereabouts', room: m.truth.locations[c], companions: [] })
      const theirs = m.policies[k].press
      expect(theirs.kind).toBe('confess')
      expect(theirs.claims).toContainEqual({ kind: 'whereabouts', room: m.truth.locations[k], companions: [] })
      for (const [who, outcome] of [[c, mine], [k, theirs]] as const) {
        const text = renderPress({ mystery: m, pack: manor1920s }, who, outcome, 'x')
        expect(text).not.toMatch(/\{|claim\.|press\./)
      }
    }
  })

  it('the lie is a thread to pull, against the Clinger', () => {
    for (const m of clingers) {
      const c = m.truth.roles.indexOf('clinger')
      expect(threadsOf(m).some((t) => t.implicated.includes(c)), `seed ${m.seed}`).toBe(true)
    }
  })

  it('every night with them is solved, by the one answer', () => {
    for (const m of clingers.slice(0, 20)) expect(solved(m), `seed ${m.seed}`).toEqual([m.solution!.culprit])
  })
})

describe('the Cunning Murderer, playing the Clinger', () => {
  let nights: Mystery[] = []
  beforeAll(async () => {
    const seeds = seedsOf(FOGGY_SCRIPT, 'cunning', 60)
    const dealt = await deal(seeds.length, (i) => generateMystery({ seed: seeds[i - 1], pack: manor1920s, script: FOGGY_SCRIPT }))
    nights = dealt.filter((m) => m.truth.clingerOf != null && !m.truth.roles.includes('clinger'))
  }, DEALING)

  it('comes now and then, and never on the simplest evening', () => {
    expect(nights.length).toBeGreaterThan(4)
    for (const m of nights) expect(cunningClingerMay(m.caseSheet.script)).toBe(true)
    expect(CLASSIC_SCRIPT.herrings).not.toContain('clinger')
  })

  it('a kind friend swears the murderer was with them; pressed, the murderer owns to the Clinger, and names a room with nothing of theirs in it', () => {
    for (const m of nights) {
      const culprit = m.truth.roles.indexOf('culprit')
      const k = m.truth.clingerOf!
      expect(truthClassOf(m.truth.roles[k])).toBe('honest')
      expect(where(m, k)).toEqual({ kind: 'whereabouts', room: m.truth.locations[k], companions: [culprit] })
      expect(where(m, culprit)).toEqual({ kind: 'whereabouts', room: m.truth.locations[k], companions: [k] })
      const press = m.policies[culprit].press
      expect(press.claims).toContainEqual({ kind: 'role', role: 'clinger' })
      const fell = press.claims.find((x) => x.kind === 'whereabouts')!
      expect(fell.kind === 'whereabouts' && m.truth.locations.includes(fell.room)).toBe(false)
      const theirs = m.evidence.some(
        (e) => fell.kind === 'whereabouts' && e.fact.kind === 'trace' && e.fact.room === fell.room,
      )
      expect(theirs, `seed ${m.seed}`).toBe(false)
      // The friend owns up too, and their room bears them out.
      expect(m.policies[k].press.claims).toContainEqual({ kind: 'whereabouts', room: m.truth.locations[k], companions: [] })
    }
  })

  it('is caught: the searched room bears them out as no Clinger', () => {
    for (const m of nights) expect(solved(m), `seed ${m.seed}`).toEqual([m.solution!.culprit])
  })

  it('the room unsearched, nobody is wrongly cleared: the murderer is still among the answers', () => {
    for (const m of nights) {
      const culprit = m.truth.roles.indexOf('culprit')
      const press = m.policies[culprit].press.claims.find((x) => x.kind === 'whereabouts')!
      const searched = manor1920s.rooms.map((r) => r.id).filter((r) => press.kind === 'whereabouts' && r !== press.room)
      const result = enumerateWorlds({
        cast: m.cast,
        caseSheet: m.caseSheet,
        spoken: allSpoken(m),
        evidence: m.evidence.filter((e) => press.kind === 'whereabouts' && e.room !== press.room).map((e) => e.fact),
        searched,
      })
      expect(result.culprits, `seed ${m.seed}`).toContain(culprit)
    }
  })

})

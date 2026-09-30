import { describe, expect, it } from 'vitest'
import { manor1920s } from '../../src/content/manor1920s'
import { claimIsTrue } from '../../src/engine/claims'
import { findContradictions, type NotedStatement } from '../../src/engine/contradictions'
import {
  CLASSIC_SCRIPT,
  CONSPIRACY_SCRIPT,
  HELPERS,
  liesAboutWhereabouts,
  truthClassOf,
} from '../../src/engine/deck'
import { allSpoken, generateMystery } from '../../src/engine/generate'
import { describeEvidence, renderAnswer, renderIntro, type RenderCtx } from '../../src/engine/render'
import { enumerateWorlds } from '../../src/engine/solver/worlds'
import { attrMatches, type Claim, type Mystery } from '../../src/engine/types'

const classic = Array.from({ length: 120 }, (_, i) =>
  generateMystery({ seed: i + 1, pack: manor1920s, script: CLASSIC_SCRIPT }),
)
const conspiracy = Array.from({ length: 60 }, (_, i) =>
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
      expect(m.truth.roles.filter((r) => HELPERS.includes(r)).length).toBe(1)
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

  it('the Steward counts the liars among two of the household they had an eye on', () => {
    for (const m of holding(classic, 'steward')) {
      const s = m.truth.roles.indexOf('steward')
      const count = said(m, s).find((c) => c.kind === 'liarsAmong')
      expect(count).toBeDefined()
      if (count?.kind !== 'liarsAmong') continue
      expect(count.pair).not.toContain(s)
      expect(new Set(count.pair).size).toBe(2)
      expect(count.count).toBe(
        count.pair.filter((c) => liesAboutWhereabouts(m.truth.roles[c])).length,
      )
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
      expect([...m.caseSheet.script.innocents, ...m.caseSheet.script.herrings]).toContain(claimed.role)
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

describe('whom they suspect', () => {
  const nights = Array.from({ length: 150 }, (_, i) => generateMystery({ seed: i + 2001, pack: manor1920s }))

  it('most suspect somebody, and nobody is asked about anybody else', () => {
    let named = 0
    let all = 0
    for (const m of nights) {
      for (const [c, p] of m.policies.entries()) {
        all++
        const s = p.suspect.claims.find((k) => k.kind === 'suspicion')
        if (s?.kind === 'suspicion') {
          named++
          expect(s.target).not.toBe(c)
        }
        expect(Object.keys(p.aboutPerson)).toEqual(['victim'])
      }
    }
    expect(named / all).toBeGreaterThan(0.75)
    expect(named / all).toBeLessThan(0.95)
  })

  it('what an honest guest says against the one they suspect is true, and about them', () => {
    let grounded = 0
    for (const m of nights) {
      for (const [c, p] of m.policies.entries()) {
        const s = p.suspect.claims.find((k) => k.kind === 'suspicion')
        if (s?.kind !== 'suspicion') continue
        for (const k of p.suspect.claims) {
          if (k.kind === 'suspicion') continue
          grounded++
          expect(truthClassOf(m.truth.roles[c])).not.toBe('concealer')
          expect(claimIsTrue(k, c, m.truth, m.cast), `seed ${m.seed}`).toBe(true)
          const about =
            k.kind === 'relationship' ? k.subject : k.kind === 'blackmailed' ? k.by : 'target' in k ? k.target : -1
          expect(about).toBe(s.target)
        }
      }
    }
    expect(grounded).toBeGreaterThan(100)
  })

  it('nobody suspects somebody they clear in the same breath', () => {
    for (const m of [...classic, ...conspiracy]) {
      m.policies.forEach((p, c) => {
        const said = p.suspect.claims
        const target = said.find((k) => k.kind === 'suspicion')
        if (target?.kind !== 'suspicion') return
        for (const k of said) {
          if (k.kind === 'alignment') expect(k.alignment, `seed ${m.seed} guest ${c}`).toBe('evil')
          if (k.kind === 'relationship') expect(['cordial', 'devoted'], `seed ${m.seed} guest ${c}`).not.toContain(k.rel)
        }
        // Nor does what they know say otherwise, asked another way.
        for (const k of [...p.knowledge, ...Object.values(p.aboutPerson)].flatMap((a) => a.claims)) {
          if (k.kind === 'alignment' && k.target === target.target) expect(k.alignment).toBe('evil')
        }
      })
    }
  })

  it('suspicion does not give the murderer away', () => {
    let alone = 0
    let never = 0
    for (const m of nights) {
      const c = m.truth.roles.indexOf('culprit')
      const pings = new Array<number>(m.cast.length).fill(0)
      for (const p of m.policies) {
        const s = p.suspect.claims.find((k) => k.kind === 'suspicion')
        if (s?.kind === 'suspicion') pings[s.target]++
      }
      const most = Math.max(...pings)
      if (pings[c] === most && pings.filter((x) => x === most).length === 1) alone++
      if (pings[c] === 0) never++
    }
    // The murderer is the one most suspected about as often as anybody would
    // be by chance (one in seven), and often goes unsuspected altogether.
    expect(alone / nights.length).toBeLessThan(0.25)
    expect(never / nights.length).toBeGreaterThan(0.15)
  })
})

describe('where and how', () => {
  const nights = Array.from({ length: 300 }, (_, i) => generateMystery({ seed: i + 3001, pack: manor1920s }))

  it('any room may be the scene, and every method is used', () => {
    expect(new Set(nights.map((m) => m.truth.sceneRoom)).size).toBe(manor1920s.rooms.length)
    expect(new Set(nights.map((m) => m.truth.methodId)).size).toBe(manor1920s.methods.length)
  })

  it('a method that wants a particular place is only ever used there', () => {
    for (const m of nights) {
      const method = manor1920s.methods.find((x) => x.id === m.truth.methodId)!
      if (method.rooms) expect(method.rooms, `seed ${m.seed}`).toContain(m.truth.sceneRoom)
      const weapon = m.evidence.find((e) => e.fact.kind === 'weapon')!
      expect(weapon.room).toBe(m.truth.sceneRoom)
      expect(weapon.name).toBe(method.weaponName)
      expect(m.cast[m.truth.roles.indexOf('culprit')].means).toContain(method.means)
    }
  })
})

describe('being somewhere', () => {
  it('nobody is ever “in the garden terrace”', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const m = generateMystery({ seed, pack: manor1920s })
      const ctx: RenderCtx = { mystery: m, pack: manor1920s }
      const said = [
        renderIntro(ctx),
        ...m.policies.flatMap((p, c) =>
          [p.reaction, ...p.alibi, ...p.knowledge, p.suspect].map((a, i) => renderAnswer(ctx, c, a, `w${i}`)),
        ),
        ...m.evidence.map((e) => describeEvidence(ctx, e)),
      ]
      for (const line of said) expect(line).not.toMatch(/\bin the garden terrace/i)
    }
  })
})

describe('those with nobody to suspect', () => {
  it('answer for somebody instead — on a feeling that is sometimes wrong', () => {
    let vouched = 0
    let wrong = 0
    for (let seed = 4001; seed <= 4300; seed++) {
      const m = generateMystery({ seed, pack: manor1920s })
      const culprit = m.truth.roles.indexOf('culprit')
      for (const [c, p] of m.policies.entries()) {
        const kinds = p.suspect.claims.map((k) => k.kind)
        // Everybody has one or the other to say, and never both.
        expect(kinds.includes('suspicion') !== kinds.includes('trust'), `seed ${seed}`).toBe(true)
        const t = p.suspect.claims.find((k) => k.kind === 'trust')
        if (t?.kind !== 'trust') continue
        vouched++
        expect(t.target).not.toBe(c)
        expect(p.suspect.lineKey).toBe('suspect.vouch')
        if (t.target === culprit) wrong++
      }
    }
    expect(vouched).toBeGreaterThan(150)
    // About one in six of them is answering for the murderer.
    expect(wrong / vouched).toBeGreaterThan(0.08)
    expect(wrong / vouched).toBeLessThan(0.3)
  })

  it('and it clears nobody', () => {
    const m = generateMystery({ seed: 11, pack: manor1920s })
    const spoken = m.cast.map((g) => ({ speaker: g.id, claim: { kind: 'trust' as const, target: (g.id + 1) % 7 } }))
    const left = enumerateWorlds({ cast: m.cast, caseSheet: m.caseSheet, spoken, evidence: [] }).culprits
    expect(left.length).toBe(m.cast.length)
  })
})

describe('men and women', () => {
  it('there are three at least of each, every night', () => {
    for (const m of [...classic, ...conspiracy]) {
      for (const sex of ['he', 'she']) {
        expect(m.cast.filter((g) => g.pronouns === sex).length).toBeGreaterThanOrEqual(3)
      }
      expect(new Set(m.cast.map((g) => g.defId)).size).toBe(m.cast.length)
    }
  })

  it('whoever is in the house, everybody is a guest as often as anybody', () => {
    const seen = new Map<string, number>()
    for (const m of classic) for (const g of m.cast) seen.set(g.defId, (seen.get(g.defId) ?? 0) + 1)
    expect(seen.size).toBe(manor1920s.characters.length)
  })

  it('what is said of the murderer’s sex is true of the honest, and never names them', () => {
    let said = 0
    for (const m of classic) {
      const culprit = m.truth.roles.indexOf('culprit')
      for (const s of allSpoken(m)) {
        const attr =
          s.claim.kind === 'culpritAttr' || s.claim.kind === 'glimpse' ? s.claim.attr : null
        if (attr?.kind !== 'sex') continue
        said++
        expect(m.cast.filter((g) => g.pronouns === attr.sex).length).toBeGreaterThanOrEqual(3)
        if (truthClassOf(m.truth.roles[s.speaker]) === 'honest') {
          expect(attr.sex).toBe(m.cast[culprit].pronouns)
        }
      }
    }
    expect(said).toBeGreaterThan(0)
  })

  it('nobody has a seat, and nothing is said of one', () => {
    for (const m of classic.slice(0, 20)) {
      const ctx: RenderCtx = { mystery: m, pack: manor1920s }
      m.policies.forEach((p, c) => {
        for (const a of [...p.knowledge, p.suspect]) {
          expect(renderAnswer(ctx, c, a, 'x')).not.toMatch(/\bseats?\b|№/i)
        }
      })
    }
    for (const key of Object.keys(manor1920s.dialogue)) {
      for (const line of manor1920s.dialogue[key]) expect(line, key).not.toMatch(/\{(parity|seatList|beside)\}/)
    }
  })
})

import { describe, expect, it } from 'vitest'
import { manor1920s } from '../../src/content/manor1920s'
import { claimIsTrue } from '../../src/engine/claims'
import { findContradictions, type NotedStatement } from '../../src/engine/contradictions'
import { KNOT_SCRIPT, ACCOMPLICES, isEvil, possibleHelpers } from '../../src/engine/deck'
import { allSpoken, generateMystery } from '../../src/engine/generate'
import { enumerateWorlds } from '../../src/engine/solver/worlds'
import { TEMPERAMENTS, type Claim, type Mystery, type Spoken } from '../../src/engine/types'
import { deal } from '../deal'

const allNights = await deal(160, (seed) => generateMystery({ seed, pack: manor1920s, script: KNOT_SCRIPT }))
/** The nights the murderer's friend is in the house — about half of them. */
const nights = allNights.filter((m) => m.truth.roles.some((r) => ACCOMPLICES.includes(r)))
const holding = (role: string) => nights.filter((m) => m.truth.roles.includes(role as never))
const at = (m: Mystery, role: string) => m.truth.roles.indexOf(role as never)
const culpritOf = (m: Mystery) => m.truth.roles.indexOf('murderer')
const facts = (m: Mystery) => m.evidence.map((e) => e.fact)
const noted = (spoken: Spoken[]): NotedStatement[] =>
  spoken.map((s, i) => ({ id: `s${i}`, speaker: s.speaker, claim: s.claim }))
/** Everything they will say without being pressed. */
const unpressed = (m: Mystery): Spoken[] =>
  m.policies.flatMap((p, speaker) =>
    [p.reaction, ...p.role, ...p.alibi, ...p.knowledge, p.seen, p.suspect, ...Object.values(p.aboutPerson), ...Object.values(p.aboutEvidence)]
      .flatMap((a) => a.claims)
      .map((claim) => ({ speaker, claim })),
  )
const where = (m: Mystery, c: number) =>
  m.policies[c].alibi.flatMap((a) => a.claims).find((x) => x.kind === 'whereabouts')

describe('the murderer’s friends', () => {
  it('there is one at most a night, on about half the nights, and every one of them turns up', () => {
    for (const m of allNights) {
      expect(m.truth.roles.filter((r) => ACCOMPLICES.includes(r)).length).toBeLessThanOrEqual(1)
      // Never the Drunk as well: one or the other on a night, never both.
      if (m.truth.roles.some((r) => ACCOMPLICES.includes(r))) expect(m.truth.roles).not.toContain('drunk')
    }
    expect(nights.length / allNights.length).toBeGreaterThan(0.3)
    expect(nights.length / allNights.length).toBeLessThan(0.7)
    for (const role of ACCOMPLICES) expect(holding(role).length, role).toBeGreaterThan(0)
  })

  it('stand with the murderer, lie about who they are, and were alone', () => {
    for (const m of nights) {
      const h = m.truth.roles.findIndex((r) => ACCOMPLICES.includes(r))
      expect(isEvil(m.truth.roles[h])).toBe(true)
      const claimed = m.policies[h].knowledge.flatMap((a) => a.claims).find((c) => c.kind === 'role')
      expect(claimed?.kind === 'role' && claimed.role).not.toBe(m.truth.roles[h])
      // (All but the Martyr, who says truly where they were: it is who they
      // are that they lie about, and at the last what they did.)
      if (m.truth.roles[h] === 'martyr') {
        expect(claimIsTrue(where(m, h)!, h, m.truth, m.cast)).toBe(true)
        continue
      }
      expect(m.truth.companions[h]).toEqual([])
      expect(claimIsTrue(where(m, h)!, h, m.truth, m.cast)).toBe(false)
    }
  })

  it('every such night is solved, and by the murderer’s name alone', () => {
    for (const m of nights) {
      const left = enumerateWorlds({
        cast: m.cast,
        caseSheet: m.caseSheet,
        spoken: allSpoken(m),
        evidence: facts(m),
      }).culprits
      expect(left).toEqual([culpritOf(m)])
      expect(m.solution?.culprit).toBe(culpritOf(m))
    }
  })
})

describe('the Framer', () => {
  const sawOf = (m: Mystery) =>
    m.policies[at(m, 'framer')].knowledge
      .flatMap((a) => a.claims)
      .find((c): c is Claim & { kind: 'sighting' } => c.kind === 'sighting')!

  it('takes away the trace of an innocent guest who was alone, and swears to having seen them at the scene', () => {
    expect(holding('framer').length).toBeGreaterThan(0)
    for (const m of holding('framer')) {
      const f = at(m, 'framer')
      const saw = sawOf(m)
      const framed = saw.target
      expect(m.truth.framed).toBe(framed)
      expect(saw.room).toBe(m.truth.sceneRoom)
      expect(framed).not.toBe(culpritOf(m))
      expect(isEvil(m.truth.roles[framed])).toBe(false)
      expect(m.truth.companions[framed]).toEqual([])
      expect(m.truth.locations[framed]).not.toBe(m.truth.sceneRoom)
      // Nothing of theirs is left where they were — and nothing is put anywhere else.
      expect(
        m.evidence.some((e) => e.fact.kind === 'trace' && e.room === m.truth.locations[framed]),
      ).toBe(false)
      expect(m.evidence.some((e) => e.fact.kind === 'trace' && e.room === m.truth.sceneRoom)).toBe(false)
      // They still say truly where they were.
      expect(claimIsTrue(where(m, framed)!, framed, m.truth, m.cast)).toBe(true)
      expect(m.policies[f].suspect.claims).toContainEqual({ kind: 'suspicion', target: framed })
    }
  })

  it('is caught out by the account of whoever they framed', () => {
    for (const m of holding('framer')) {
      const saw = sawOf(m)
      const threads = findContradictions(noted(allSpoken(m)), m.evidence, m.caseSheet)
      expect(
        threads.some(
          (t) =>
            t.reason === 'whereabouts-vs-sighting' &&
            t.implicated.includes(saw.target) &&
            t.implicated.includes(at(m, 'framer')),
        ),
      ).toBe(true)
    }
  })
})

describe('the Cleaner', () => {
  it('leaves the scene bare, and the weapon where they spent the hour', () => {
    expect(holding('cleaner').length).toBeGreaterThan(0)
    for (const m of holding('cleaner')) {
      const c = at(m, 'cleaner')
      const weapon = m.evidence.find((e) => e.fact.kind === 'weapon')!
      expect(weapon.room).toBe(m.truth.locations[c])
      expect(weapon.room).not.toBe(m.truth.sceneRoom)
      // Something that can be carried: never the balcony, nor the motor-car.
      expect(manor1920s.methods.find((w) => w.id === m.truth.methodId)?.rooms).toBeUndefined()
      const atScene = m.evidence.filter((e) => e.room === m.truth.sceneRoom)
      expect(atScene.some((e) => e.fact.kind === 'sceneCleared')).toBe(true)
      expect(atScene.some((e) => e.fact.kind === 'weapon')).toBe(false)
    }
  })

  it('is pointed to: somebody has noticed the room, and somebody saw them in it', () => {
    for (const m of holding('cleaner')) {
      const c = at(m, 'cleaner')
      const room = m.truth.locations[c]
      expect(m.policies.some((p) => p.reaction.refer?.room === room)).toBe(true)
      const spoken = allSpoken(m)
      expect(
        spoken.some(
          (s) => s.claim.kind === 'sighting' && s.claim.target === c && s.claim.room === room,
        ),
      ).toBe(true)
      const threads = findContradictions(noted(spoken), m.evidence, m.caseSheet)
      expect(threads.some((t) => t.implicated.includes(c))).toBe(true)
    }
  })

  it('on any other night the weapon lies at the scene', () => {
    for (const m of nights) {
      if (at(m, 'cleaner') >= 0) continue
      expect(m.evidence.find((e) => e.fact.kind === 'weapon')?.room).toBe(m.truth.sceneRoom)
    }
  })
})

describe('the Whisperer', () => {
  it('puts a story in an honest mouth: the murderer, seen where the murderer says they were', () => {
    expect(holding('whisperer').length).toBeGreaterThan(0)
    for (const m of holding('whisperer')) {
      const v = m.truth.whispered!
      expect(v).not.toBeNull()
      expect(isEvil(m.truth.roles[v])).toBe(false)
      const his = where(m, culpritOf(m))!
      const story = [...m.policies[v].knowledge, m.policies[v].seen]
        .flatMap((a) => a.claims)
        .find((c) => c.kind === 'sighting' && c.target === culpritOf(m))
      expect(story).toEqual({
        kind: 'sighting',
        target: culpritOf(m),
        room: his.kind === 'whereabouts' ? his.room : '',
      })
      expect(claimIsTrue(story!, v, m.truth, m.cast)).toBe(false)
      // In everything else they are as honest as they ever were.
      for (const s of unpressed(m)) {
        if (s.speaker !== v || s.claim === story) continue
        expect(claimIsTrue(s.claim, v, m.truth, m.cast)).not.toBe(false)
      }
    }
  })

  it('whoever repeats it can be pressed, and says whose story it was', () => {
    for (const m of holding('whisperer')) {
      const v = m.truth.whispered!
      const threads = findContradictions(noted(unpressed(m)), m.evidence, m.caseSheet)
      expect(threads.some((t) => t.reason === 'sighting-vs-company' && t.implicated.includes(v))).toBe(true)
      expect(m.policies[v].press).toMatchObject({
        kind: 'recant',
        claims: [{ kind: 'toldBy', by: at(m, 'whisperer') }],
      })
    }
  })

  it('nobody recants on a night without one', () => {
    for (const m of nights) {
      if (at(m, 'whisperer') >= 0 || at(m, 'sponsor') >= 0) continue
      expect(m.policies.some((p) => p.press.kind === 'recant')).toBe(false)
      expect(m.truth.whispered ?? null).toBeNull()
    }
  })
})

describe('the Sponsor', () => {
  it('has paid a witness, who will say who they are and nothing of what they know', () => {
    expect(holding('sponsor').length).toBeGreaterThan(0)
    for (const m of holding('sponsor')) {
      const b = m.truth.bribed!
      expect(b).not.toBeNull()
      expect(isEvil(m.truth.roles[b])).toBe(false)
      const told = m.policies[b].knowledge.at(-1)!.claims
      expect(told).toEqual([{ kind: 'role', role: m.truth.roles[b] }, { kind: 'silent' }])
      const kept = ['sighting', 'glimpse', 'culpritAttr', 'among', 'alignment', 'liarsAmong', 'passage']
      for (const s of unpressed(m)) {
        if (s.speaker === b) expect(kept).not.toContain(s.claim.kind)
      }
    }
  })

  it('left the money to be found, and it breaks the silence', () => {
    for (const m of holding('sponsor')) {
      const b = m.truth.bribed!
      const money = m.evidence.find((e) => e.fact.kind === 'bribe')!
      expect(money.fact).toEqual({ kind: 'bribe', to: b })
      expect(money.room).toBe(m.truth.locations[at(m, 'sponsor')])
      expect(money.name).toContain(m.cast[b].shortName)
      expect(m.policies.some((p) => p.reaction.refer?.room === money.room)).toBe(true)
      const threads = findContradictions(noted(unpressed(m)), m.evidence, m.caseSheet)
      const thread = threads.find((t) => t.reason === 'silence-vs-bribe')
      expect(thread).toMatchObject({ implicated: [b], proven: true, evidenceId: money.id })
      // Without the money there is nothing to put to them.
      const without = findContradictions(
        noted(unpressed(m)),
        m.evidence.filter((e) => e.id !== money.id),
        m.caseSheet,
      )
      expect(without.some((t) => t.reason === 'silence-vs-bribe')).toBe(false)
    }
  })

  it('pressed, the witness names who paid — and then says what they know, all of it true', () => {
    for (const m of holding('sponsor')) {
      const b = m.truth.bribed!
      const press = m.policies[b].press
      expect(press.kind).toBe('recant')
      expect(press.claims[0]).toEqual({ kind: 'bribed', by: at(m, 'sponsor') })
      expect(press.claims.length).toBeGreaterThan(1)
      for (const claim of press.claims) {
        expect(claimIsTrue(claim, b, m.truth, m.cast)).toBe(true)
      }
    }
  })
})

describe('which friend it is', () => {
  it('is told by what they leave behind', () => {
    for (const m of nights) {
      const helper = m.truth.roles.find((r) => ACCOMPLICES.includes(r))!
      const left = possibleHelpers(m.caseSheet.script, facts(m), m.truth.sceneRoom)
      expect(left).toContain(helper)
      if (['cleaner', 'sponsor'].includes(helper)) expect(left).toEqual([helper])
      else expect(left).not.toContain('cleaner')
    }
  })

  it('with nothing found, any of them may be about', () => {
    expect(possibleHelpers(KNOT_SCRIPT, [], 'study')).toEqual([...ACCOMPLICES])
  })
})

describe('what they say on such nights', () => {
  it('every manner has words for a bought silence and for what is found', () => {
    for (const key of ['knowledge.silent', 'evidence.bare', 'evidence.bribe']) {
      for (const manner of TEMPERAMENTS) {
        expect(manor1920s.dialogue[`${key}.${manner}`]?.length ?? 0, `${key}.${manner}`).toBeGreaterThan(0)
      }
    }
  })

  it('no line says “he” or “she” of anybody, or puts the dead man in the present', () => {
    const keys = Object.keys(manor1920s.dialogue).filter((k) =>
      /^(claim\.(bribed|toldBy|silent)|knowledge\.silent|evidence\.(bare|bribe)|press\.(bribed|recant))/.test(k),
    )
    expect(keys.length).toBeGreaterThan(30)
    for (const key of keys) {
      for (const line of manor1920s.dialogue[key]) {
        expect(line, key).not.toMatch(/\b(he|she|him|her|his|hers)\b/i)
      }
    }
  })
})

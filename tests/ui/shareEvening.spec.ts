import { describe, expect, it } from 'vitest'
import { checkScript } from '../../src/engine/checkScript'
import type { Script } from '../../src/engine/deck'
import { ACCOMPLICES, INNOCENT_POOL, ROLES, SUSPICIOUS_POOL } from '../../src/engine/roles'
import type { RoleId } from '../../src/engine/types'
import { NIGHT_KINDS, soundScript } from '../../src/ui/evenings'
import { MODES } from '../../src/ui/modes'
import { SHARE_NIGHTS, SHARE_ROLES, decodeEvening, encodeEvening, sameRecipe } from '../../src/ui/shareEvening'
import { SUSPICION, seat } from '../../src/ui/suspicion'

/** A script as it deals: kinds of night never weighed left out. */
const dealt = (s: Script) => ({
  ...soundScript(s),
  nights: Object.fromEntries(Object.entries(s.nights ?? { plain: 1 }).filter(([, w]) => (w ?? 0) > 0)),
})

/** A small seeded generator, so that the evenings below are the same every run. */
function rng(seed: number) {
  return () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31)
}

describe('sharing an evening', () => {
  it('numbers the parts and kinds of night as the links always have (add to the end, never reorder)', () => {
    // Links already sent depend on these. A new part goes on the end of SHARE_ROLES and here.
    expect(SHARE_ROLES.slice(0, 32)).toEqual([
      'murderer', 'witness', 'observer', 'confidant', 'gossip', 'sleuth', 'steward', 'collector',
      'architect', 'discoverer', 'companion', 'thief', 'begrudged', 'loner', 'redherring', 'blackmailer',
      'amnesiac', 'sweetheart', 'perjurer', 'forger', 'framer', 'cleaner', 'whisperer', 'sponsor',
      'martyr', 'arsonist', 'drunk', 'hoaxer', 'committee', 'porter', 'spinster', 'clinger',
    ])
    expect(SHARE_NIGHTS.slice(0, 9)).toEqual(['plain', 'serial', 'cunning', 'careful', 'regretful', 'artful', 'committee', 'suicide', 'hoax'])
  })

  it('can name every part and every kind of night the game has', () => {
    for (const r of Object.keys(ROLES)) expect(SHARE_ROLES, r).toContain(r)
    for (const k of NIGHT_KINDS) expect(SHARE_NIGHTS, k).toContain(k)
    expect(new Set(SHARE_ROLES).size).toBe(SHARE_ROLES.length)
    expect(SHARE_ROLES.length).toBeLessThanOrEqual(64)
  })

  it('brings each of the four evenings back as it went, and short enough for a QR code', () => {
    for (const m of MODES) {
      const code = encodeEvening(m.name, m.script)
      expect(code.length, m.id).toBeLessThan(120)
      expect(code).toMatch(/^[A-Za-z0-9._~%+-]+$/)
      const back = decodeEvening(code)!
      expect(back.name).toBe(m.name)
      expect(back.unknown).toBe(0)
      expect(dealt(back.script)).toEqual(dealt(m.script))
      expect(sameRecipe(back.script, m.script)).toBe(true)
    }
  })

  it('brings back any evening the builder can make', () => {
    const next = rng(2291)
    const pick = <T>(xs: readonly T[]) => xs[Math.floor(next() * xs.length)]
    const some = (xs: readonly RoleId[]) => xs.filter(() => next() < 0.5)
    let dealable = 0
    for (let i = 0; i < 300; i++) {
      const draft: Script = {
        id: 'custom',
        innocents: some([...INNOCENT_POOL, 'architect', 'porter', 'spinster']),
        suspicious: some([...SUSPICIOUS_POOL, 'drunk']),
        accomplices: next() < 0.5 ? some(ACCOMPLICES) : [],
        suspiciousCount: 1,
        nights: Object.fromEntries(NIGHT_KINDS.map((k) => [k, pick([0, 1, 2, 4])])),
        questionsPerRound: 3 + Math.floor(next() * 8),
        lifelines: next() < 0.5,
        passage: next() < 0.5,
        lockedRoom: pick([0, 0.4, 0.8]),
        accompliceChance: pick([0.5, 1]),
      }
      const s = seat(draft, 3 + Math.floor(next() * 6), pick(SUSPICION).id)
      if (checkScript(s).length === 0) dealable++
      const back = decodeEvening(encodeEvening(`Evening ${i}`, s))!
      expect(dealt(back.script)).toEqual(dealt(s))
      expect(checkScript(back.script)).toEqual(checkScript(s))
    }
    expect(dealable).toBeGreaterThan(0)
  })

  it('keeps any name, stops and all, without anything a chat app might cut off', () => {
    for (const name of ['Mrs. Pike’s Evening.', 'A (very) wet night!', 'Ünïcödé ☂ & 100% fog', '1.2.3.4.5.6.7']) {
      const code = encodeEvening(name, MODES[0].script)
      expect(code).not.toMatch(/[.!)]$/)
      expect(code.split('.')).toHaveLength(7)
      expect(decodeEvening(code)!.name).toBe(name)
    }
    expect(decodeEvening(encodeEvening('   ', MODES[0].script))!.name).toBe('An evening')
  })

  it('tells parts it does not know from a link it cannot read', () => {
    const code = encodeEvening('Later', MODES[1].script)
    const [v, name, inn, sus, acc, nights, numbers] = code.split('.')
    // (A newer game: a part and a kind of night past the end of the lists.)
    const newer = decodeEvening([v, name, `${inn}_`, sus, acc, `${nights.padEnd(SHARE_NIGHTS.length, '0')}3`, numbers].join('.'))!
    expect(newer.unknown).toBe(2)
    expect(dealt(newer.script)).toEqual(dealt(MODES[1].script))

    expect(decodeEvening('')).toBeNull()
    expect(decodeEvening(code.slice(0, 12))).toBeNull()
    expect(decodeEvening(code.replace(/^1/, '2'))).toBeNull()
    expect(decodeEvening([v, '%E2%80', inn, sus, acc, nights, numbers].join('.'))).toBeNull()
    expect(decodeEvening([v, name, inn, sus, acc, nights, 'q7'].join('.'))).toBeNull()
  })

  it('knows two evenings that deal alike, whatever order their parts were ticked in', () => {
    const s = MODES[2].script
    expect(sameRecipe(s, { ...s, innocents: [...s.innocents].reverse() })).toBe(true)
    expect(sameRecipe(s, { ...s, passage: !s.passage })).toBe(false)
    expect(sameRecipe(s, { ...s, nights: { ...s.nights, plain: 9 } })).toBe(false)
  })
})

import { beforeAll, describe, expect, it } from 'vitest'
import { manor1920s } from '../../src/content/manor1920s'
import { concerns, isTied, namesGuest, ownsUpTo, paidWith, tiedPairs, toldBefore } from '../../src/engine/confront'
import { KNOT_SCRIPT, TWIST_SCRIPT, buildDeck, truthClassOf } from '../../src/engine/deck'
import { generateMystery } from '../../src/engine/generate'
import { Rng } from '../../src/engine/rng'
import type { Mystery, Spoken } from '../../src/engine/types'
import { DEALING, deal } from '../deal'

/** Nights whose deck holds the part, found from their dice. */
const seedsWith = (role: string, count: number, script = TWIST_SCRIPT) => {
  const out: number[] = []
  for (let seed = 1; seed < 4000 && out.length < count; seed++) {
    if (buildDeck(new Rng(`${seed}:deck`), script).includes(role as never)) out.push(seed)
  }
  return out
}
/** Knot of Lies nights with the friend of the murderer's given. */
const knotWith = (helper: string) => ({ ...KNOT_SCRIPT, id: 'custom' as const, accomplices: [helper as never], accompliceChance: 1 })

let sweet: Mystery[] = []
let cling: Mystery[] = []
let whisper: Mystery[] = []
let bribe: Mystery[] = []
beforeAll(async () => {
  for (const [role, into] of [['sweetheart', (m: Mystery[]) => (sweet = m)], ['clinger', (m: Mystery[]) => (cling = m)]] as const) {
    const seeds = seedsWith(role, 15)
    into(await deal(seeds.length, (i) => generateMystery({ seed: seeds[i - 1], pack: manor1920s, script: TWIST_SCRIPT })))
  }
  for (const [helper, into] of [['whisperer', (m: Mystery[]) => (whisper = m)], ['sponsor', (m: Mystery[]) => (bribe = m)]] as const) {
    const script = knotWith(helper)
    into(await deal(15, (i) => generateMystery({ seed: i, pack: manor1920s, script })))
  }
  whisper = whisper.filter((m) => m.truth.whispered != null)
  bribe = bribe.filter((m) => m.truth.bribed != null)
  sweet = sweet.filter((m) => m.truth.roles.includes('sweetheart'))
  cling = cling.filter((m) => m.truth.roles.includes('clinger'))
}, DEALING)

/** What a guest owns to under pressing, as it would be noted. */
const confession = (m: Mystery, c: number): Spoken[] => m.guests[c] && m.policies[c].press.kind === 'confess'
  ? m.policies[c].press.claims.map((claim) => ({ speaker: c, claim }))
  : []

describe('telling a guest what was said of them', () => {
  it('ties the Sweetheart to whom they were with, and the Clinger to the kind soul', () => {
    expect(sweet.length).toBeGreaterThan(5)
    expect(cling.length).toBeGreaterThan(5)
    for (const m of sweet) expect(tiedPairs(m)).toContainEqual([m.truth.roles.indexOf('sweetheart'), m.truth.sweetheartOf])
    for (const m of cling) expect(tiedPairs(m)).toContainEqual([m.truth.roles.indexOf('clinger'), m.truth.clingerOf])
  })

  it('the one the Sweetheart was with owns up, told what the Sweetheart owned to', () => {
    let seen = 0
    for (const m of sweet) {
      const s = m.truth.roles.indexOf('sweetheart')
      const partner = m.truth.sweetheartOf!
      const told = toldBefore(m)
      for (const said of confession(m, s).filter((x) => namesGuest(x.claim, partner))) {
        expect(ownsUpTo(m, partner, said, told), `seed ${m.seed}`).toBe(true)
        seen++
      }
    }
    expect(seen).toBeGreaterThan(5)
  })

  it('the Sweetheart owns up, told of the honest sighting that gives their story the lie', () => {
    let seen = 0
    for (const m of sweet) {
      const s = m.truth.roles.indexOf('sweetheart')
      const told = toldBefore(m)
      const sightings = told.filter((x) => x.speaker !== s && x.claim.kind === 'sighting' && x.claim.target === s && truthClassOf(m.truth.roles[x.speaker]) === 'honest')
      for (const said of sightings) {
        if (said.claim.kind === 'sighting' && said.claim.room !== m.truth.locations[s]) continue
        expect(ownsUpTo(m, s, said, told), `seed ${m.seed}`).toBe(true)
        seen++
      }
    }
    expect(seen).toBeGreaterThan(5)
  })

  it('the honest guest repeating the Whisperer’s story owns up, told what gives the sighting the lie', () => {
    let seen = 0
    for (const m of whisper) {
      const w = m.truth.whispered!
      const told = toldBefore(m)
      const theirs = told.filter((x) => x.speaker === w)
      for (const said of told.filter((x) => concerns(x, w, theirs))) {
        if (!ownsUpTo(m, w, said, told)) continue
        expect(m.policies[w].press.claims.some((k) => k.kind === 'toldBy'), `seed ${m.seed}`).toBe(true)
        seen++
      }
    }
    expect(whisper.length).toBeGreaterThan(5)
    expect(seen).toBeGreaterThan(3)
  })

  it('the bought witness owns up shown the money; and nobody else is paid with it', () => {
    expect(bribe.length).toBeGreaterThan(5)
    for (const m of bribe) {
      const money = m.evidence.find((e) => e.fact.kind === 'bribe')!
      for (const g of m.cast) expect(paidWith(m, g.id, money.id)).toBe(g.id === m.truth.bribed)
      expect(m.policies[m.truth.bribed!].press.claims.some((k) => k.kind === 'bribed')).toBe(true)
    }
  })

  it('nobody else owns up to anything, whatever they are told, honest or lying', () => {
    for (const m of [...sweet, ...cling, ...whisper, ...bribe]) {
      const told = toldBefore(m)
      for (const c of m.cast.map((g) => g.id)) {
        if (isTied(m, c)) continue
        for (const said of told) expect(ownsUpTo(m, c, said, told)).toBe(false)
      }
    }
  })

  it('a tied guest owns up only to what gives them the lie: never to what bears them out', () => {
    for (const m of [...sweet, ...cling]) {
      const told = toldBefore(m)
      for (const [a, b] of tiedPairs(m)) {
        for (const c of [a, b]) {
          for (const said of told.filter((x) => namesGuest(x.claim, c) && x.speaker !== c)) {
            if (!ownsUpTo(m, c, said, told)) continue
            // (What gives them the lie is what they own up to: pressed, they confess.)
            expect(m.policies[c].press.kind, `seed ${m.seed}`).toBe('confess')
          }
        }
      }
    }
  })
})

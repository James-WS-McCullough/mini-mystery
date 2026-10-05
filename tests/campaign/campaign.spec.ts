// The campaign after the first case: each case is dealt fresh on its own
// script and setting, and holds to what it asks for (who is dead, which parts
// walk, who is at the table and in which part, and who had cause).

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { CAMPAIGN, HIDDEN_FROM, SETTING_UNLOCKS, campaignCase, endingOf, settingUnlock, sheetLesson } from '../../src/campaign'
import { packOf } from '../../src/content'
import { addressPlayer } from '../../src/engine/address'
import { fillIntro } from '../../src/engine/render'
import { pinDeck, SIMPLE_SCRIPT, KNOT_SCRIPT } from '../../src/engine/deck'
import { generateMystery } from '../../src/engine/generate'
import { Rng } from '../../src/engine/rng'
import { isMotiveGrade, type Mystery } from '../../src/engine/types'
import { useGame, type SaveGame } from '../../src/stores/game'
import { COMMENDATIONS, type CaseRecord } from '../../src/ui/profile'
import type { CaseTier } from '../../src/engine/verdict'
import { DEALING, deal } from '../deal'

const SEEDS = 24

/** Does the night hold to what the case asked for? (A pin with a chance need not hold.) */
function holds(c: (typeof CAMPAIGN)[number], m: Mystery) {
  if (c.victim) expect(m.victim.id).toBe(c.victim)
  for (const p of c.pins ?? []) {
    if (p.chance !== undefined) continue
    if (p.role) expect(m.truth.roles).toContain(p.role)
    if (p.character) {
      const at = m.cast.findIndex((x) => x.defId === p.character)
      expect(at).toBeGreaterThanOrEqual(0)
      if (p.role) expect(m.truth.roles[at]).toBe(p.role)
      if (p.motive) expect(isMotiveGrade(m.truth.relationships[at])).toBe(true)
    }
  }
}

const FRIENDS = ['perjurer', 'sponsor', 'cleaner', 'forger', 'framer', 'whisperer', 'martyr']
const kindOf = (m: Mystery) => (m.truth.hoax ? 'hoax' : m.truth.suicide ? 'suicide' : (m.truth.murderer ?? 'plain'))

describe('the campaign', () => {
  it('runs from Case 0 to Case 12, no case twice, the first alone a fixed number', () => {
    expect(CAMPAIGN.map((c) => c.chapter)).toEqual(Array.from({ length: 13 }, (_, i) => `Case ${i}`))
    expect(HIDDEN_FROM).toBe(6)
    expect(new Set(CAMPAIGN.map((c) => c.id)).size).toBe(CAMPAIGN.length)
    expect(CAMPAIGN.filter((c) => c.seed !== undefined).map((c) => c.id)).toEqual(['first-case'])
  })

  it('opens each of the later settings with a campaign case played in it', () => {
    expect(Object.keys(SETTING_UNLOCKS).sort()).toEqual(['college1927', 'hotel1928', 'theatre1929', 'yard1928'])
    for (const [pack, id] of Object.entries(SETTING_UNLOCKS)) {
      const c = settingUnlock(pack as never)
      expect(c?.id).toBe(id)
      expect(c?.pack).toBe(pack)
    }
    expect(settingUnlock('manor1920s')).toBeNull()
  })

  it('opens Case 1 with a word from the sergeant in the office, in his voice', () => {
    const b = campaignCase('village')!.briefing
    expect(b?.kind).toBe('office')
    if (b?.kind !== 'office') return
    expect(b.speaker).toBe('pike')
    expect(b.lines).toHaveLength(4)
    expect(b.lines.map((l) => (typeof l === 'string' ? l : l.text)).join(' ')).toMatch(/\[key\].*\[heart\].*\[steps\]/)
  })

  it('every briefing fills from the night and the address, with no slot or free dash left', () => {
    for (const c of CAMPAIGN) {
      if (!c.briefing) continue
      const m = generateMystery({ seed: 5, pack: packOf(c.pack), script: c.script, victim: c.victim, pins: c.pins })
      const ctx = { mystery: m, pack: packOf(c.pack) }
      const texts = c.briefing.kind === 'note' ? [c.briefing.text, c.briefing.signed] : c.briefing.lines.map((l) => (typeof l === 'string' ? l : l.text))
      for (const t of texts) {
        for (const address of ['sir', 'maam', 'plain'] as const) {
          const out = addressPlayer(fillIntro(ctx, t), address)
          expect(out, `${c.id}: ${out}`).not.toMatch(/\{\w+\}/)
          expect(out, `${c.id}: ${out}`).not.toMatch(/(^|\s)—/)
        }
      }
    }
    // (From Case 1 on, every case opens with one.)
    expect(CAMPAIGN.slice(1).every((c) => !!c.briefing)).toBe(true)
  })

  it('has the sergeant say a word over every sheet from Case 1 on, filled and without free dashes', () => {
    for (const c of CAMPAIGN.slice(1)) {
      expect(c.sheet?.length, c.id).toBeGreaterThan(0)
      for (const l of c.sheet!) {
        expect(addressPlayer(l, 'sir'), `${c.id}: ${l}`).not.toMatch(/\{\w+\}/)
        expect(l, `${c.id}: ${l}`).not.toMatch(/(^|\s)—/)
      }
    }
    const lesson = sheetLesson(['a word'])
    expect(lesson.steps[0].when({ phase: 'intro' } as never)).toBe(true)
    expect(lesson.steps[0].when({ phase: 'play' } as never)).toBe(false)
  })

  it('ends the finale by whether the sergeant was in on it and whether the finger was pointed right', { timeout: DEALING }, async () => {
    const yard = campaignCase('yard')!
    expect(Object.keys(yard.endings!).sort()).toEqual(['guilty-caught', 'guilty-lost', 'innocent-caught', 'innocent-lost'])
    for (const e of Object.values(yard.endings!)) {
      if (e.kind !== 'office') continue
      for (const l of e.lines) expect(addressPlayer(typeof l === 'string' ? l : l.text, 'maam')).not.toMatch(/\{\w+\}|(^|\s)—/)
    }
    const nights = await deal(40, (seed) => generateMystery({ seed, pack: packOf(yard.pack), script: yard.script, victim: yard.victim, pins: yard.pins }))
    const guiltOf = (m: Mystery) => ['murderer', 'committee'].includes(m.truth.roles[m.cast.findIndex((x) => x.defId === 'pike')])
    expect(nights.some(guiltOf)).toBe(true)
    expect(nights.some((m) => !guiltOf(m))).toBe(true)
    for (const m of nights) {
      const g = guiltOf(m)
      expect(endingOf(yard, m, true)).toBe(yard.endings![g ? 'guilty-caught' : 'innocent-caught'])
      expect(endingOf(yard, m, false)).toBe(yard.endings![g ? 'guilty-lost' : 'innocent-lost'])
    }
    expect(endingOf(campaignCase('village')!, nights[0], true)).toBeNull()
  })

  it('tells the player nothing but the setting and the shape: no lifelines until the train', () => {
    expect(campaignCase('village')!.script.lifelines).toBe(false)
    expect(campaignCase('train')!.script.lifelines).toBe(true)
    expect(campaignCase('yacht')!.script.passage).toBe(true)
    expect(campaignCase('village-drunk')!.script.passage).toBeUndefined()
  })

  for (const c of CAMPAIGN.slice(1)) {
    it(`${c.chapter}, ${c.name}: holds to what it asks for, and leaves the rest to the night`, { timeout: DEALING }, async () => {
      const nights = await deal(SEEDS, (seed) =>
        generateMystery({ seed, pack: packOf(c.pack), script: c.script, victim: c.victim, pins: c.pins }),
      )
      for (const m of nights) {
        expect(m.cast).toHaveLength(7)
        holds(c, m)
      }
      // The kinds of night and the friends in the house are only ever the script's; the one the case
      // is about comes up most nights, and on a case with odds, not every night.
      const kinds = new Map<string, number>()
      for (const m of nights) kinds.set(kindOf(m), (kinds.get(kindOf(m)) ?? 0) + 1)
      const allowed = new Set(Object.keys(c.script.nights ?? { plain: 1 }))
      // (A kind that cannot sit beside the friend dealt, or needs one, falls back to plain.)
      for (const k of kinds.keys()) expect(allowed.has(k) || k === 'plain', `${c.id}: ${k}`).toBe(true)
      const friends = new Set(nights.flatMap((m) => m.truth.roles.filter((r) => FRIENDS.includes(r))))
      for (const f of friends) expect(c.script.accomplices, `${c.id}: ${f}`).toContain(f)
      const most = (k: string) => expect(kinds.get(k) ?? 0, `${c.id}: ${k} on ${kinds.get(k) ?? 0} of ${SEEDS}`).toBeGreaterThan(SEEDS / 3)
      const some = (ok: (m: Mystery) => boolean, what: string) => {
        const n = nights.filter(ok).length
        expect(n, `${c.id}: ${what} on ${n} of ${SEEDS}`).toBeGreaterThan(0)
        expect(n, `${c.id}: ${what} on every night`).toBeLessThan(SEEDS)
      }
      if (c.id === 'village-drunk') some((m) => m.truth.roles.includes('drunk'), 'the Drunk')
      if (c.id === 'yacht') most('serial')
      if (c.id === 'partner') {
        for (const m of nights) {
          const lord = m.cast.findIndex((x) => x.defId === 'lord')
          expect(lord).toBeGreaterThanOrEqual(0)
          expect(isMotiveGrade(m.truth.relationships[lord])).toBe(true)
          expect(m.cast.some((x) => x.defId === 'trent')).toBe(false)
        }
        some((m) => m.truth.roles[m.cast.findIndex((x) => x.defId === 'lord')] === 'sponsor', 'his lordship the Sponsor')
      }
      if (c.id === 'theatre') {
        most('regretful')
        some((m) => m.truth.roles.includes('forger'), 'the Forger')
      }
      if (c.id === 'college') {
        most('artful')
        some((m) => !!m.truth.locked, 'a locked door')
        expect(nights.filter((m) => !!m.truth.locked).length).toBeGreaterThan(SEEDS / 2)
        some((m) => m.truth.roles.includes('martyr'), 'the Martyr')
      }
      if (c.id === 'train-perjurer') some((m) => m.truth.roles.includes('perjurer'), 'the Perjurer')
      if (c.id === 'hotel') most('cunning')
      if (c.id === 'blackwood') {
        most('hoax')
        expect(nights.every((m) => m.victim.id === 'blackwood')).toBe(true)
      }
      if (c.id === 'college-cleaner') some((m) => m.truth.roles.includes('cleaner'), 'the Cleaner')
      if (c.id === 'yard') {
        // (The Careful Murderer and the Committee share the finale's odds, and between them take most nights.)
        expect((kinds.get('careful') ?? 0) + (kinds.get('committee') ?? 0)).toBeGreaterThan(SEEDS / 2)
        some((m) => kindOf(m) === 'committee', 'the Committee')
        expect(nights.every((m) => m.victim.id === 'craddock' && m.cast.some((x) => x.defId === 'pike'))).toBe(true)
      }
    })
  }
})

describe('the campaign’s commendation', () => {
  it('is earned only once every case has been solved', () => {
    const c = COMMENDATIONS.find((x) => x.id === 'campaign')!
    const record = (campaign: string, tier: CaseTier): CaseRecord => ({
      seed: 1, script: 'custom', campaign, pack: 'manor1920s', daily: null, tier, accused: 'x', culprit: 'x', cleared: 0,
      pillars: { means: 'unknown', motive: 'unknown', opportunity: 'unknown' },
      stats: { accusedAtRound: 0, wrongGuesses: 0, threadsDrawn: 0, questionsAsked: 0 } as never, at: 0,
    })
    const allButLast = CAMPAIGN.slice(0, -1).map((x) => record(x.id, 'strong'))
    expect(c.earned(allButLast[0], allButLast)).toBe(false)
    const withLastWrong = [...allButLast, record(CAMPAIGN.at(-1)!.id, 'wrong')]
    expect(c.earned(withLastWrong[0], withLastWrong)).toBe(false)
    const all = [...allButLast, record(CAMPAIGN.at(-1)!.id, 'thin')]
    expect(c.earned(all[0], all)).toBe(true)
    // (And one each for the first case and the last.)
    const welcome = COMMENDATIONS.find((x) => x.id === 'welcome')!
    const finale = COMMENDATIONS.find((x) => x.id === 'finale')!
    expect(welcome.earned(record('first-case', 'strong'), [])).toBe(true)
    expect(welcome.earned(record('first-case', 'wrong'), [])).toBe(false)
    expect(welcome.earned(record('yard', 'strong'), [])).toBe(false)
    expect(finale.earned(record('yard', 'strong'), [])).toBe(true)
    expect(finale.earned(record('village', 'strong'), [])).toBe(false)
  })
})

describe('pinning the deck', () => {
  const rng = () => new Rng('pins')

  it('deals the part asked for in the place of one of its class', () => {
    const deck = pinDeck(rng(), ['murderer', 'thief', 'loner', 'witness', 'gossip', 'porter', 'steward'], SIMPLE_SCRIPT, [{ role: 'drunk' }])!
    expect(deck).toContain('drunk')
    expect(deck.filter((r) => r === 'thief' || r === 'loner')).toHaveLength(1)
    expect(deck.slice(3)).toEqual(['witness', 'gossip', 'porter', 'steward'])
  })

  it('seats the murderer’s friend in a suspicious guest’s place, and sends the Drunk home', () => {
    const deck = pinDeck(rng(), ['murderer', 'drunk', 'loner', 'witness', 'gossip', 'porter', 'steward'], KNOT_SCRIPT, [{ role: 'sponsor' }])!
    expect(deck).toContain('sponsor')
    expect(deck).not.toContain('drunk')
    expect(deck).toHaveLength(7)
  })

  it('leaves a deck that has the part alone, and refuses what cannot be', () => {
    const deck: readonly string[] = ['murderer', 'thief', 'drunk', 'witness', 'gossip', 'porter', 'steward']
    expect(pinDeck(rng(), deck as never, SIMPLE_SCRIPT, [{ role: 'drunk' }])).toEqual(deck)
    expect(pinDeck(rng(), deck as never, KNOT_SCRIPT, [{ role: 'drunk' }, { role: 'sponsor' }])).toBeNull()
  })
})

describe('a campaign case at the table', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('is dealt fresh each time, and resumes on the number it was dealt', () => {
    const village = campaignCase('village')!
    const game = useGame()
    game.startCase(village)
    const seed = game.mystery!.seed
    expect(game.campaignId).toBe('village')
    expect(game.packId).toBe('village1926')
    expect(game.lifelinesOn).toBe(false)
    expect(game.mystery!.cast).toHaveLength(7)
    game.begin()
    const save = JSON.parse(JSON.stringify(game.exportSave())) as SaveGame
    expect(save.seed).toBe(seed)
    expect(save.campaign).toBe('village')

    setActivePinia(createPinia())
    const resumed = useGame()
    expect(resumed.restore(save)).toBe(true)
    expect(resumed.mystery!.seed).toBe(seed)
    expect(resumed.campaignId).toBe('village')
    expect(resumed.phase).toBe('gather')
  })

  it('seats his lordship at the partner’s death, in the case’s own words', () => {
    const partner = campaignCase('partner')!
    const game = useGame()
    game.startCase(partner)
    holds(partner, game.mystery!)
    expect(game.introText).toContain('Mr. Hugo Trent was found')
    expect(game.introText).not.toMatch(/\{\w+\}/)
  })
})

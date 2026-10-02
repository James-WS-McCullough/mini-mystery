import { createPinia, setActivePinia } from 'pinia'
import { beforeAll, describe, expect, it } from 'vitest'
import { DEALING, deal } from '../deal'
import { manor1920s } from '../../src/content/manor1920s'
import { BOTH_SCRIPT, CLASSIC_SCRIPT, FOGGY_SCRIPT, HELPERS, WEB_SCRIPT, roleClassOf } from '../../src/engine/deck'
import { allSpoken, generateMystery } from '../../src/engine/generate'
import { enumerateWorlds } from '../../src/engine/solver/worlds'
import type { Mystery } from '../../src/engine/types'
import { judgeAccusation } from '../../src/engine/verdict'
import { useGame } from '../../src/stores/game'
import { evidenceCard } from '../../src/ui/cards'

let foggy: Mystery[] = []
/** The Tangled Web: the only evening on which he may have done it himself. */
let web: Mystery[] = []
let nights: Mystery[] = []
let ownDoing: Mystery[] = []
let artful: Mystery[] = []
beforeAll(async () => {
  foggy = await deal(80, (seed) => generateMystery({ seed, pack: manor1920s, script: FOGGY_SCRIPT }))
  web = await deal(160, (seed) => generateMystery({ seed, pack: manor1920s, script: WEB_SCRIPT }))
  nights = [...foggy, ...web]
  ownDoing = nights.filter((m) => m.truth.suicide)
  artful = nights.filter((m) => m.truth.murderer === 'artful')
}, DEALING)
const facts = (m: Mystery) => m.evidence.map((e) => e.fact)
const selfInflicted = (m: Mystery) =>
  manor1920s.methods.find((x) => x.id === m.truth.methodId)?.selfInflicted === true
const LOOKS_FOR_THE_MURDERER = ['witness', 'oracle', 'discoverer', 'sleuth']

describe('a night he did it himself', () => {
  it('comes on The Tangled Web only, and is never the only kind', () => {
    expect(ownDoing.length).toBeGreaterThan(4)
    for (const m of web) expect(m.caseSheet.script.suicide).toBe(true)
    for (const m of foggy) {
      expect(m.truth.suicide).toBeFalsy()
      expect(m.caseSheet.script.suicide).toBeFalsy()
    }
    for (const script of [CLASSIC_SCRIPT, BOTH_SCRIPT]) {
      expect(script.murderers?.suicide).toBeUndefined()
      for (let seed = 1; seed <= 10; seed++) {
        const m = generateMystery({ seed, pack: manor1920s, script })
        expect(m.truth.suicide).toBeFalsy()
        expect(m.caseSheet.script.suicide).toBeFalsy()
        if (script === CLASSIC_SCRIPT) expect(m.evidence.some((e) => e.fact.kind === 'suicideNote')).toBe(false)
      }
    }
  })

  it('has no murderer, no friend of one, and one more of the suspicious in the murderer’s place', () => {
    for (const m of ownDoing) {
      const roles = m.truth.roles
      expect(roles).not.toContain('culprit')
      expect(roles.some((r) => HELPERS.includes(r))).toBe(false)
      expect(roles.filter((r) => roleClassOf(r) === 'suspicious').length).toBe(m.caseSheet.script.herringCount + 1)
      // Nobody is in the house to have seen or heard a murderer.
      for (const r of LOOKS_FOR_THE_MURDERER) expect(roles).not.toContain(r)
      expect(m.truth.murderer).toBeUndefined()
    }
  })

  it('was done by a way he could have done it himself, alone, with a note beside him and nothing else of his hand to find', () => {
    for (const m of ownDoing) {
      expect(selfInflicted(m), `seed ${m.seed}`).toBe(true)
      expect(m.truth.locations).not.toContain(m.truth.sceneRoom)
      const note = m.evidence.find((e) => e.fact.kind === 'suicideNote')
      expect(note?.room).toBe(m.truth.sceneRoom)
      expect(m.evidence.some((e) => e.fact.kind === 'handSample')).toBe(false)
    }
  })

  it('is solved by naming nobody, once every one of them is shown not to have done it', () => {
    for (const m of ownDoing) {
      const left = enumerateWorlds({
        cast: m.cast,
        caseSheet: m.caseSheet,
        spoken: allSpoken(m),
        evidence: facts(m),
      }).culprits
      expect(left, `seed ${m.seed}`).toEqual([-1])
      expect(m.solution?.culprit).toBe(-1)
      const right = judgeAccusation(m, { accused: -1, citedSpoken: [], citedEvidence: [], gathered: { spoken: allSpoken(m), evidence: facts(m) } })
      expect(right.correct).toBe(true)
      expect(right.tier).toBe('airtight')
      for (const c of m.cast) {
        expect(judgeAccusation(m, { accused: c.id, citedSpoken: [], citedEvidence: [] }).tier).toBe('wrong')
      }
    }
  })
})

describe('the Artful Murderer', () => {
  it('turns up only where he may truly have done it himself, by a way he could have', () => {
    expect(artful.length).toBeGreaterThan(4)
    for (const m of artful) {
      expect(m.caseSheet.script.suicide, `seed ${m.seed}`).toBe(true)
      expect(selfInflicted(m), `seed ${m.seed}`).toBe(true)
      expect(m.truth.roles).toContain('culprit')
    }
    for (const m of foggy) expect(m.truth.murderer).not.toBe('artful')
  })

  it('leaves a note at the scene; and a letter he truly wrote is among his papers', () => {
    for (const m of artful) {
      expect(m.evidence.find((e) => e.fact.kind === 'suicideNote')?.room).toBe(m.truth.sceneRoom)
      const hand = m.evidence.find((e) => e.fact.kind === 'handSample')
      const doc = m.evidence.find((e) => e.id === 'doc-motive')
      expect(hand?.room).toBe(doc?.room)
    }
  })

  it('cannot pass for a suicide once his letter is set beside the note', () => {
    for (const m of artful) {
      const left = enumerateWorlds({
        cast: m.cast,
        caseSheet: m.caseSheet,
        spoken: allSpoken(m),
        evidence: facts(m),
      }).culprits
      expect(left).toEqual([m.truth.roles.indexOf('culprit')])
    }
  })
})

describe('a murder with no note', () => {
  it('is no suicide once the scene is searched, even done by a way he could have done himself', () => {
    const plain = nights.filter((m) => !m.truth.suicide && m.truth.murderer !== 'artful' && selfInflicted(m))
    expect(plain.length).toBeGreaterThan(0)
    for (const m of plain) {
      expect(m.evidence.some((e) => e.fact.kind === 'suicideNote')).toBe(false)
      const weapon = facts(m).filter((f) => f.kind === 'weapon')
      const left = enumerateWorlds({ cast: m.cast, caseSheet: m.caseSheet, spoken: [], evidence: weapon }).culprits
      if (weapon.some((f) => f.kind === 'weapon' && f.foundIn === undefined)) expect(left).not.toContain(-1)
    }
  })
})

describe('what the household says of the note and the letter', () => {
  it('is the same whoever says it, and whatever they did', () => {
    for (const m of [...ownDoing, ...artful]) {
      for (const p of m.policies) {
        expect(p.aboutEvidence.note?.lineKey).toBe('evidence.note')
        if (m.truth.murderer === 'artful') expect(p.aboutEvidence.hand?.lineKey).toBe('evidence.hand')
      }
    }
    expect(manor1920s.dialogue['evidence.note.any']?.length).toBeGreaterThan(3)
    expect(manor1920s.dialogue['evidence.hand.any']?.length).toBeGreaterThan(3)
  })
})

describe('Sergeant Pike and the two hands', () => {
  it('is called when both are found, and marks the note a lie', () => {
    // (A night his writing desk is not where he died, for there both are found
    // at once; nor behind a locked door.)
    const m = web.find(
      (x) =>
        x.truth.murderer === 'artful' &&
        x.evidence.find((e) => e.id === 'hand')!.room !== x.truth.sceneRoom &&
        x.evidence.find((e) => e.id === 'hand')!.room !== x.truth.locked,
    )!
    setActivePinia(createPinia())
    const game = useGame()
    game.newGame(m.seed, 'web')
    expect(game.mystery!.truth.murderer).toBe('artful')
    game.begin()
    game.startInvestigation()
    game.finishTransition()
    const scene = game.mystery!.truth.sceneRoom
    const desk = game.mystery!.evidence.find((e) => e.id === 'hand')!.room
    game.search(scene)
    expect(game.noteForged).toBe(false)
    expect(game.handScene).toBe(false)
    const note = game.foundItems.find((e) => e.id === 'note')!
    expect(evidenceCard(game, note).lie).toBe(false)
    // Another hour, and the writing desk.
    game.continueToQuestioning()
    game.strikeHour()
    game.finishTransition()
    game.search(desk)
    expect(game.noteForged).toBe(true)
    expect(game.handScene).toBe(true)
    expect(evidenceCard(game, note).lie).toBe(true)
  })
})

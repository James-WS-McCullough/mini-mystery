// Integration test of the game store: a full night played through the same
// actions the UI calls, against a fixed seed.

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { matchContradiction, type Contradiction } from '../../src/engine/contradictions'
import { manor1920s } from '../../src/content/manor1920s'
import { CONSPIRACY_SCRIPT, FOGGY_SCRIPT } from '../../src/engine/deck'
import { generateMystery } from '../../src/engine/generate'
import { matchLink } from '../../src/engine/links'
import { useGame } from '../../src/stores/game'

function itemsOf(c: Contradiction): string[] {
  return c.evidenceId ? [...c.statementIds, c.evidenceId] : [...c.statementIds]
}

describe('game store — one night at the manor', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('plays a full night: gather, search, question, deduce, press, accuse', () => {
    const game = useGame()

    // Title → intro → the gathering.
    game.newGame(7)
    expect(game.phase).toBe('intro')
    expect(game.mystery).not.toBeNull()
    game.begin()
    expect(game.phase).toBe('gather')
    expect(game.openingStatements).toHaveLength(7)
    const afterGather = game.notebook.length

    // Into hour one; actions are stage-guarded.
    game.startInvestigation()
    expect(game.stage).toBe('transition')
    game.ask(0, { kind: 'alibi' }) // wrong stage — must be a no-op
    expect(game.notebook.length).toBe(afterGather)
    game.finishTransition()
    expect(game.stage).toBe('search')

    // Search the scene.
    const scene = game.mystery!.caseSheet.sceneRoom
    game.search(scene)
    expect(game.stage).toBe('searched')
    expect(game.foundItems.length).toBeGreaterThan(0)
    expect(game.searchedRooms).toContain(scene)
    game.continueToQuestioning()
    expect(game.stage).toBe('question')

    // Spend the hour's questions; the budget must hold. (An answer that gives
    // nothing costs nothing: whatever is left goes on what they have seen.)
    for (let c = 0; c < 7; c++) game.ask(c, { kind: 'knowledge' })
    for (let c = 0; c < 7 && game.questionsLeft > 0; c++) game.ask(c, { kind: 'seen' })
    expect(game.questionsLeft).toBe(0)
    const notebookAtBudget = game.notebook.length
    game.ask(0, { kind: 'seen' })
    expect(game.notebook.length).toBe(notebookAtBudget) // out of questions

    // Hour two: skip the search, ask whereabouts all round.
    game.beginDeduce()
    game.strikeHour()
    game.finishTransition()
    expect(game.round).toBe(1)
    game.skipSearch()
    for (let c = 0; c < 6; c++) game.ask(c, { kind: 'alibi' })

    // Hour three: whoever has not yet been heard. By now the notes hold
    // everyone's account and most of what they know, whoever the cast is.
    game.beginDeduce()
    game.strikeHour()
    game.finishTransition()
    game.skipSearch()
    game.ask(6, { kind: 'alibi' })
    game.ask(6, { kind: 'knowledge' })
    for (let c = 0; c < 4; c++) game.ask(c, { kind: 'knowledge' })

    // The notes may be compared, and put away again, at any point in the hour.
    game.beginDeduce()
    expect(game.stage).toBe('deduce')
    game.resumeQuestions()
    expect(game.stage).toBe('question')

    // The deduction menu: a real pair realises a thread…
    game.beginDeduce()
    expect(game.stage).toBe('deduce')
    const target = game.contradictions.find((c) => itemsOf(c).length === 2)
    expect(target).toBeDefined()
    for (const id of itemsOf(target!)) game.toggleDeduceSelect(id)
    game.testPair()
    expect(game.lastDeduceResult?.ok).toBe(true)
    expect(game.realized.length).toBeGreaterThan(0)
    for (const id of target!.implicated) expect(game.pressable.has(id)).toBe(true)

    // …and a non-pair costs a miss.
    const ids = game.notebook.map((n) => n.id)
    let missPair: [string, string] | null = null
    outer: for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const pair = [ids[i], ids[j]]
        if (
          matchContradiction(pair, game.contradictions).length === 0 &&
          matchLink(pair, game.links).length === 0
        ) {
          missPair = [ids[i], ids[j]]
          break outer
        }
      }
    }
    expect(missPair).not.toBeNull()
    for (const id of missPair!) game.toggleDeduceSelect(id)
    game.testPair()
    expect(game.lastDeduceResult?.ok).toBe(false)
    expect(game.missesLeft).toBe(2)

    // The last hour: press someone the realised thread implicates.
    game.strikeHour()
    game.finishTransition()
    game.skipSearch()
    const pressTarget = [...game.pressable][0]
    const questionsBefore = game.questionsLeft
    expect(game.missesLeft).toBe(3) // a fresh hour, a fresh eye
    game.press(pressTarget)
    expect(game.questionsLeft).toBe(questionsBefore - 1)
    // The detective says what is being put to them.
    const put = game.convoOf(pressTarget).filter((e) => e.kind === 'detective').pop()
    expect(put?.text).toContain('cannot both be true')

    // The accusation: cap enforced, threads pre-seeded, verdict lands.
    game.beginAccuse()
    expect(game.phase).toBe('accuse')
    for (const id of game.notebook.map((n) => n.id)) game.toggleCiteNote(id)
    expect(game.citeCount).toBeLessThanOrEqual(game.citeCap)

    const culprit = game.mystery!.truth.roles.indexOf('culprit')
    game.accusedId = culprit
    game.submitAccusation()
    expect(game.phase).toBe('reveal')
    expect(game.verdict).not.toBeNull()
    expect(game.verdict!.correct).toBe(true)
    expect(['airtight', 'strong', 'thin']).toContain(game.verdict!.tier)
  })

  it('forces the accusation at midnight', () => {
    const game = useGame()
    game.newGame(11)
    game.begin()
    game.startInvestigation()
    for (let round = 0; round < 4; round++) {
      game.finishTransition()
      expect(game.phase).toBe('play')
      game.skipSearch()
      game.beginDeduce()
      game.strikeHour()
    }
    expect(game.transitionToMidnight).toBe(true)
    game.finishTransition()
    expect(game.phase).toBe('accuse')
    expect(game.accusationForced).toBe(true)
    game.backToPlay() // midnight admits no return
    expect(game.phase).toBe('accuse')
    // …but the notes may still be laid side by side, and gathered up again.
    game.gatheredOut()
    game.hearOut()
    game.beginDeduce()
    expect(game.phase).toBe('play')
    expect(game.stage).toBe('deduce')
    expect(game.deduceAtMidnight).toBe(true)
    expect(game.clockLabel).toBe('Midnight')
    game.resumeQuestions()
    expect(game.phase).toBe('accuse')
    expect(game.deduceAtMidnight).toBe(false)
    expect(game.accusationForced).toBe(true)
  })

  it('the same seed deals the same night', () => {
    const game = useGame()
    game.newGame(21)
    const first = {
      roles: [...game.mystery!.truth.roles],
      cast: game.mystery!.cast.map((m) => m.defId),
      intro: game.introText,
    }
    game.newGame(21)
    expect(game.mystery!.truth.roles).toEqual(first.roles)
    expect(game.mystery!.cast.map((m) => m.defId)).toEqual(first.cast)
    expect(game.introText).toBe(first.intro)
  })
})

describe('questions asked and answered', () => {
  it('are read back for nothing, and put again only while there is more to hear', () => {
    setActivePinia(createPinia())
    const game = useGame()
    game.newGame(7)
    game.begin()
    game.startInvestigation()
    game.finishTransition()
    game.skipSearch()

    expect(game.questionState(0, { kind: 'alibi' })).toBe('fresh')
    expect(game.lastAnswer(0, { kind: 'alibi' })).toBeNull()
    game.ask(0, { kind: 'alibi' })
    expect(game.questionState(0, { kind: 'alibi' })).toBe('done')
    const before = game.lastAnswer(0, { kind: 'alibi' })
    expect(before?.line.text.length).toBeGreaterThan(0)
    expect(before?.prompt).toContain('Where were you')

    // A quiet guest says nothing for asking twice: the question is held, and
    // not spent. Shown something of theirs, they say the rest in the same breath.
    const quiet = game.mystery!.policies.findIndex((p) => (p.opens?.length ?? 0) > 0)
    if (quiet >= 0) {
      game.ask(quiet, { kind: 'knowledge' })
      expect(game.questionState(quiet, { kind: 'knowledge' })).toBe('held')
      expect(game.holdsBack(quiet)).toBe(true)
      const spent = game.questionsLeft
      game.ask(quiet, { kind: 'knowledge' })
      expect(game.questionsLeft).toBe(spent)
      const key = game.mystery!.policies[quiet].opens![0]
      game.foundItemIds.push(key)
      expect(game.keysFor(quiet)).toEqual([key])
      const lines = game.log.length
      game.ask(quiet, { kind: 'aboutEvidence', item: key })
      expect(game.holdsBack(quiet)).toBe(false)
      expect(game.questionState(quiet, { kind: 'knowledge' })).toBe('done')
      // What they were keeping back is now on the record.
      const said = game.log.slice(lines).filter((e) => e.kind === 'speech')
      expect(said.length).toBe(1)
      const full = game.mystery!.policies[quiet].knowledge.at(-1)!
      for (const claim of full.claims) {
        expect(game.notebook.some((n) => n.speaker === quiet && JSON.stringify(n.claim) === JSON.stringify(claim))).toBe(true)
      }
    }

    // Reading back spends nothing and writes nothing down.
    const left = game.questionsLeft
    const lines = game.log.length
    game.lastAnswer(0, { kind: 'alibi' })
    expect(game.questionsLeft).toBe(left)
    expect(game.log.length).toBe(lines)
  })
})

describe('an account that is borne out', () => {
  it('is not broken by somebody who contradicts it: the contradiction stands against them alone', () => {
    setActivePinia(createPinia())
    const game = useGame()
    // A night where two guests were together and a liar claims their room.
    let found: { pair: [number, number]; liar: number } | null = null
    for (let seed = 1; seed <= 400 && !found; seed++) {
      game.newGame(seed)
      const m = game.mystery!
      const where = m.policies.map((p) => p.alibi.flatMap((a) => a.claims).find((c) => c.kind === 'whereabouts'))
      for (const [a, wa] of where.entries()) {
        if (wa?.kind !== 'whereabouts' || wa.companions.length !== 1) continue
        const b = wa.companions[0]
        const wb = where[b]
        // Each puts the other beside them: a true pair, not one half of a Sweetheart's story.
        if (wb?.kind !== 'whereabouts' || wb.room !== wa.room || !wb.companions.includes(a)) continue
        const liar = where.findIndex(
          (w, i) => i !== a && i !== b && w?.kind === 'whereabouts' && w.room === wa.room && w.companions.length === 0,
        )
        if (liar >= 0) found = { pair: [a, b], liar }
      }
    }
    expect(found).not.toBeNull()
    const { pair, liar } = found!
    game.begin()
    game.startInvestigation()
    game.finishTransition()
    game.skipSearch()
    for (const c of [...pair, liar]) game.ask(c, { kind: 'alibi' })
    const idOf = (c: number) => game.notebook.find((n) => n.speaker === c && n.claim.kind === 'whereabouts')!.id

    game.beginDeduce()
    game.deduceSelection = [idOf(pair[0]), idOf(pair[1])]
    game.testPair()
    expect(game.lastDeduceResult?.kind).toBe('link')
    expect(game.borneOut.has(pair[0]) && game.borneOut.has(pair[1])).toBe(true)

    game.deduceSelection = [idOf(pair[0]), idOf(liar)]
    game.testPair()
    expect(game.lastDeduceResult?.kind).toBe('contradiction')
    expect(game.lastDeduceResult?.implicated).toEqual([liar])
    expect(game.pressable.has(liar)).toBe(true)
    expect(game.pressable.has(pair[0])).toBe(false)
    expect(game.caughtLying.has(liar)).toBe(true)
    expect(game.livePillars(pair[0])?.opportunity).toBe('ruledOut')
    expect(game.livePillars(liar)?.opportunity).toBe('established')
  })
})

describe('pressing', () => {
  it('each new contradiction against somebody is a fresh thing to put to them', () => {
    setActivePinia(createPinia())
    const game = useGame()
    // A night where somebody is caught in two contradictions of two notes each.
    let target = -1
    let pairs: string[][] = []
    for (let seed = 1; seed <= 200 && target < 0; seed++) {
      game.newGame(seed)
      game.begin()
      game.startInvestigation()
      game.finishTransition()
      game.skipSearch()
      for (let c = 0; c < 6; c++) game.ask(c, { kind: 'knowledge' })
      game.beginDeduce()
      game.strikeHour()
      game.finishTransition()
      game.skipSearch()
      for (let c = 0; c < 4; c++) game.ask(c, { kind: 'alibi' })
      const two = game.contradictions.filter((x) => x.statementIds.length === 2 && !x.evidenceId)
      for (let c = 0; c < 7 && target < 0; c++) {
        // Two that share no pair of notes: to draw the one is not to draw the other.
        const mine = two
          .filter((x) => x.implicated.includes(c))
          // (Not one that falls away once they own to what they are.)
          .filter((x) => x.reason !== 'blackmail-vs-role')
          .filter(
            (x, i, all) =>
              all.findIndex((y) => [...y.statementIds].sort().join() === [...x.statementIds].sort().join()) === i,
          )
        if (mine.length >= 2) {
          target = c
          pairs = mine.slice(0, 2).map((x) => x.statementIds)
        }
      }
    }
    expect(target).toBeGreaterThanOrEqual(0)

    game.beginDeduce()
    game.deduceSelection = pairs[0]
    game.testPair()
    game.resumeQuestions()
    expect(game.questionState(target, 'press')).toBe('fresh')
    game.press(target)
    expect(game.questionState(target, 'press')).toBe('done')
    const first = game.lastAnswer(target, 'press')?.prompt

    game.beginDeduce()
    game.deduceSelection = pairs[1]
    game.testPair()
    game.resumeQuestions()
    expect(game.questionState(target, 'press')).toBe('fresh')
    const left = game.questionsLeft
    game.press(target)
    expect(game.questionsLeft).toBe(left - 1)
    expect(game.questionState(target, 'press')).toBe('done')
    // And it is the new contradiction that was put.
    expect(game.lastAnswer(target, 'press')?.prompt).not.toBe(first)
  })
})

describe('the three signs', () => {
  it('are the detective’s own to mark, and nothing marks them for the detective', () => {
    setActivePinia(createPinia())
    const game = useGame()
    game.newGame(7)
    game.begin()
    game.startInvestigation()
    game.finishTransition()
    game.search(game.mystery!.caseSheet.sceneRoom)
    game.continueToQuestioning()
    // The weapon is found, and still nobody is marked.
    for (const m of game.mystery!.cast) {
      expect(game.signsOf(m.id)).toEqual({ means: 'unknown', motive: 'unknown', opportunity: 'unknown' })
    }
    game.setSign(2, 'means', 'established')
    expect(game.signsOf(2).means).toBe('established')
    game.setSign(2, 'means', 'ruledOut')
    expect(game.signsOf(2).means).toBe('ruledOut')
    game.setSign(2, 'means', 'unknown')
    expect(game.signsOf(2).means).toBe('unknown')
    game.setSign(3, 'motive', 'established')
    expect(game.signsOf(3)).toEqual({ means: 'unknown', motive: 'established', opportunity: 'unknown' })

    // They are kept with the night.
    const save = game.exportSave()!
    game.newGame(99)
    expect(game.restore(JSON.parse(JSON.stringify(save)))).toBe(true)
    expect(game.signsOf(3).motive).toBe('established')
    expect(game.signsOf(2).means).toBe('unknown')
  })
})

describe('who they are', () => {
  it('is what they say, until the detective writes otherwise', () => {
    setActivePinia(createPinia())
    const game = useGame()
    game.newGame(7)
    game.begin()
    game.startInvestigation()
    game.finishTransition()
    game.skipSearch()

    // Nobody has said, and nothing is written.
    expect(game.roleOf(1)).toEqual({ role: null, by: null })

    // Written before they have said a word.
    game.setRole(1, 'thief')
    expect(game.roleOf(1)).toEqual({ role: 'thief', by: 'detective' })
    game.setRole(1, null)
    expect(game.roleOf(1)).toEqual({ role: null, by: null })

    // They say: it is taken down as their word.
    const plain = game.mystery!.policies.findIndex((p) => p.knowledge.length === 1)
    game.ask(plain, { kind: 'knowledge' })
    const said = game.claimedRole(plain)
    expect(said).not.toBeNull()
    expect(game.roleOf(plain)).toEqual({ role: said, by: 'them' })

    // The detective thinks otherwise — or thinks nothing yet — and may go back.
    game.setRole(plain, 'culprit')
    expect(game.roleOf(plain)).toEqual({ role: 'culprit', by: 'detective' })
    game.setRole(plain, 'unknown')
    expect(game.roleOf(plain)).toEqual({ role: null, by: 'detective' })
    game.setRole(plain, null)
    expect(game.roleOf(plain)).toEqual({ role: said, by: 'them' })

    // Kept with the night.
    game.setRole(plain, 'redherring')
    game.setRole(3, 'loner')
    const save = game.exportSave()!
    game.newGame(99)
    expect(game.roleOf(3)).toEqual({ role: null, by: null })
    expect(game.restore(JSON.parse(JSON.stringify(save)))).toBe(true)
    expect(game.roleOf(plain)).toEqual({ role: 'redherring', by: 'detective' })
    expect(game.roleOf(3)).toEqual({ role: 'loner', by: 'detective' })
    // And it costs nothing.
    expect(game.questionsLeft).toBe(game.mystery!.config.questionsPerRound - 1)
  })
})

describe('a second killing', () => {
  it('comes with the third hour: the dead answer nothing, and the room is a scene again', () => {
    setActivePinia(createPinia())
    const game = useGame()
    // The first foggy night whose murderer is one who kills again.
    const seed = Array.from({ length: 60 }, (_, i) => i + 1).find(
      (s) => generateMystery({ seed: s, pack: manor1920s, script: FOGGY_SCRIPT }).truth.second,
    )!
    game.newGame(seed, 'foggy')
    const second = game.mystery!.truth.second!
    expect(second).toBeTruthy()
    game.begin()
    game.startInvestigation()
    game.finishTransition()
    // The room is searched before anybody has died in it.
    game.search(second.room)
    expect(game.foundItems.some((e) => e.fact.kind === 'killed' || e.fact.kind === 'secondTrace')).toBe(false)
    game.continueToQuestioning()
    game.ask(second.victim, { kind: 'alibi' })
    const heard = game.statementsBy(second.victim)
    expect(game.dead).toBeNull()

    game.strikeHour()
    game.finishTransition()
    game.skipSearch()
    expect(game.dead).toBeNull()

    // Ten o'clock.
    game.strikeHour()
    expect(game.dead).toBe(second.victim)
    expect(game.killing).toMatchObject({ victim: second.victim, room: second.room, fresh: true })
    // What they said as the door opened: their own words, and nobody named.
    expect(game.killing!.lastWords.length).toBeGreaterThan(2)
    expect(game.killing!.lastWords).not.toMatch(/\b(he|she|him|her|his)\b/i)
    expect(game.foundItems.some((e) => e.fact.kind === 'killed')).toBe(true)
    expect(game.foundItems.some((e) => e.fact.kind === 'secondTrace')).toBe(false)
    expect(game.searchedRooms).not.toContain(second.room)
    game.finishTransition()
    expect(game.killing?.fresh).toBe(false)

    // What they said is kept; nothing more is to be had.
    game.search(second.room)
    // The murderer left nothing of themselves.
    expect(game.lastSearchItems.some((e) => e.fact.kind === 'secondTrace')).toBe(false)
    game.continueToQuestioning()
    const left = game.questionsLeft
    game.ask(second.victim, { kind: 'knowledge' })
    expect(game.questionsLeft).toBe(left)
    expect(game.statementsBy(second.victim)).toBe(heard)
    expect(game.pressable.has(second.victim)).toBe(false)

    // And it is kept with the night.
    const save = game.exportSave()!
    game.newGame(99)
    expect(game.dead).toBeNull()
    expect(game.restore(JSON.parse(JSON.stringify(save)))).toBe(true)
    expect(game.dead).toBe(second.victim)
    expect(game.killing?.fresh).toBe(false)
    expect(game.foundItems.map((e) => e.fact.kind)).toContain('killed')
  })
})

describe('owning to it', () => {
  it('somebody stands before the accusation, and after that there is no going back', () => {
    setActivePinia(createPinia())
    const game = useGame()
    // The first conspiracy where the murderer owns to it, and so does the Martyr.
    const seed = Array.from({ length: 200 }, (_, i) => i + 1).find(
      (s) =>
        generateMystery({ seed: s, pack: manor1920s, script: CONSPIRACY_SCRIPT }).policies.filter((p) => p.confession)
          .length === 2,
    )!
    game.newGame(seed, 'conspiracy')
    const owning = game.mystery!.policies.flatMap((p, c) => (p.confession ? [c] : []))
    expect(owning.length).toBe(2)
    game.begin()
    game.startInvestigation()
    game.finishTransition()
    game.skipSearch()
    expect(game.confessions).toEqual([])

    game.beginAccuse()
    expect(game.phase).toBe('accuse')
    // Everybody has a word to say first, each in their own.
    expect(game.gatheringPending).toBe(true)
    expect(game.gathering.map((g) => g.char)).toEqual(game.mystery!.cast.map((m) => m.id))
    expect(new Set(game.gathering.map((g) => g.text)).size).toBe(game.gathering.length)
    game.gatheredOut()
    expect(game.gatheringPending).toBe(false)
    expect(game.confessions.map((c) => c.char)).toEqual(owning)
    expect(game.confessionsPending).toBe(true)
    expect(game.accusationForced).toBe(true)
    // In their own words, each of them.
    expect(game.confessions[0].text).not.toBe(game.confessions[1].text)
    // It is written down, and the two of them cannot both be believed.
    const noted = game.notebook.filter((n) => n.claim.kind === 'confession')
    expect(noted.map((n) => n.speaker)).toEqual(owning)
    expect(game.contradictions.some((c) => c.reason === 'two-confessions')).toBe(true)

    game.backToPlay()
    expect(game.phase).toBe('accuse')
    game.hearOut()
    expect(game.confessionsPending).toBe(false)

    // Resumed, it has been said already and is not said again.
    const save = game.exportSave()!
    game.newGame(99)
    expect(game.restore(JSON.parse(JSON.stringify(save)))).toBe(true)
    expect(game.phase).toBe('accuse')
    expect(game.confessions.map((c) => c.char)).toEqual(owning)
    expect(game.confessionsPending).toBe(false)
    expect(game.notebook.filter((n) => n.claim.kind === 'confession').length).toBe(2)

    // The name is still the detective's to give.
    game.accusedId = game.mystery!.truth.roles.indexOf('culprit')
    game.submitAccusation()
    expect(game.verdict?.correct).toBe(true)
  })

  it('nobody stands on a night with nothing to own', () => {
    setActivePinia(createPinia())
    const game = useGame()
    game.newGame(7)
    game.begin()
    game.startInvestigation()
    game.finishTransition()
    game.skipSearch()
    game.beginAccuse()
    expect(game.gathering.length).toBe(7)
    expect(game.confessions).toEqual([])
    expect(game.confessionsPending).toBe(false)
    game.backToPlay()
    expect(game.phase).toBe('play')
  })
})


describe('having come clean', () => {
  it('keeps to what they owned to, marks the old story a lie, and settles any pair made of it', () => {
    setActivePinia(createPinia())
    const game = useGame()
    // A night with the Blackmailer in the house.
    let seed = 1
    for (; seed < 200; seed++) {
      game.newGame(seed)
      if (game.mystery!.truth.roles.includes('blackmailer')) break
    }
    const b = game.mystery!.truth.roles.indexOf('blackmailer')
    game.begin()
    game.startInvestigation()
    game.finishTransition()
    game.skipSearch()
    // What they say before: somebody else.
    game.ask(b, { kind: 'knowledge' })
    const before = game.claimedRole(b)
    expect(before).not.toBe('blackmailer')
    // Pressed (straight through the interrogation, for the test), they own to it.
    const outcome = game.interrogation!.press(b)
    expect(outcome.kind).toBe('confess')
    game.notebook.push({
      id: `s${game.notebook.length}`,
      speaker: b,
      claim: { kind: 'role', role: 'blackmailer' },
      text: '',
      round: 0,
      source: 'under pressing',
    })
    expect(game.claimedRole(b)).toBe('blackmailer')
    // Asked again, no bluff: and the tag does not slip back.
    game.ask(b, { kind: 'knowledge' })
    expect(game.claimedRole(b)).toBe('blackmailer')
    const said = game.log.filter((e) => e.speaker === b && e.kind === 'speech').at(-1)!
    expect(said.text.length).toBeGreaterThan(0)
    // The old role is marked a lie, and not tried as a contradiction.
    const oldNote = game.notebook.find((n) => n.speaker === b && n.claim.kind === 'role' && n.claim.role === before)!
    expect(game.retracted.has(oldNote.id)).toBe(true)
    const newNote = game.notebook.find((n) => n.speaker === b && n.source === 'under pressing')!
    const misses = game.missesLeft
    game.deduceSelection = [oldNote.id, newNote.id]
    game.stage = 'deduce'
    game.testPair()
    expect(game.lastDeduceResult?.kind).toBe('known')
    expect(game.lastDeduceResult?.text).toMatch(/owned to it already/)
    expect(game.missesLeft).toBe(misses)
  })
})

describe('game store — time not wasted', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  /** A night with a room that holds nothing of note, other than the scene. */
  function nightWithAnEmptyRoom(game: ReturnType<typeof useGame>): string {
    for (let seed = 1; seed < 300; seed++) {
      game.newGame(seed)
      const m = game.mystery!
      const room = game.ctx!.pack.rooms.find(
        (r) =>
          r.id !== m.caseSheet.sceneRoom &&
          !m.evidence.some((e) => e.room === r.id && e.fact.kind !== 'flavor') &&
          !(m.lifelines ?? []).some((l) => l.room === r.id),
      )
      if (room) return room.id
    }
    throw new Error('no night with an empty room')
  }

  it('a room with nothing of note leaves time to search one more, once an hour — and it is kept with the night', () => {
    const game = useGame()
    const empty = nightWithAnEmptyRoom(game)
    game.begin()
    game.startInvestigation()
    game.finishTransition()
    game.search(empty)
    expect(game.canSearchAgain).toBe(true)
    game.searchAgain()
    expect(game.stage).toBe('search')
    const other = game.ctx!.pack.rooms.find((r) => !game.searchedRooms.includes(r.id))!.id
    game.search(other)
    expect(game.searchedRooms).toHaveLength(2)
    // Only once an hour, however the second room turned out.
    expect(game.canSearchAgain).toBe(false)

    const save = game.exportSave()!
    game.newGame(99)
    expect(game.restore(JSON.parse(JSON.stringify(save)))).toBe(true)
    expect(game.searchedRooms).toEqual([empty, other])
  })

  it('a room with something in it ends the hour’s searching as before', () => {
    const game = useGame()
    game.newGame(7)
    game.begin()
    game.startInvestigation()
    game.finishTransition()
    game.search(game.mystery!.caseSheet.sceneRoom)
    expect(game.canSearchAgain).toBe(false)
  })

  it('a question that gets nothing out of them costs nothing; one that does, costs one', () => {
    const game = useGame()
    game.newGame(7)
    game.begin()
    game.startInvestigation()
    game.finishTransition()
    game.skipSearch()
    let free = 0
    let paid = 0
    for (const m of game.mystery!.cast) {
      for (const kind of ['seen', 'alibi'] as const) {
        const before = game.questionsLeft
        const notes = game.notebook.length
        game.ask(m.id, { kind })
        if (game.notebook.length === notes) {
          expect(game.questionsLeft).toBe(before)
          free++
        } else {
          expect(game.questionsLeft).toBe(before - 1)
          paid++
        }
        if (game.questionsLeft === 0) break
      }
      if (game.questionsLeft === 0) break
    }
    expect(free).toBeGreaterThan(0)
    expect(paid).toBeGreaterThan(0)
  })
})

describe('game store — lifelines', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('hides two different lifelines a night, never at the scene', () => {
    const game = useGame()
    for (let seed = 1; seed <= 30; seed++) {
      game.newGame(seed)
      const lines = game.mystery!.lifelines ?? []
      expect(lines).toHaveLength(2)
      expect(new Set(lines.map((l) => l.kind)).size).toBe(2)
      for (const l of lines) expect(['pike', 'coffee', 'telegram', 'expert', 'note']).toContain(l.kind)
      expect(new Set(lines.map((l) => l.room)).size).toBe(2)
      for (const l of lines) expect(l.room).not.toBe(game.mystery!.caseSheet.sceneRoom)
    }
  })

  /** A night hiding a given lifeline, played to its room. */
  function nightWith(game: ReturnType<typeof useGame>, kind: string) {
    for (let seed = 1; seed < 300; seed++) {
      game.newGame(seed)
      const line = game.mystery!.lifelines?.find((l) => l.kind === kind)
      if (!line) continue
      game.begin()
      game.startInvestigation()
      game.finishTransition()
      game.search(line.room)
      return line
    }
    throw new Error(`no night with ${kind}`)
  }

  it('a lifeline is found by searching its room, and is a find in its own right', () => {
    const game = useGame()
    const line = nightWith(game, 'coffee')
    expect(game.foundLifelines.map((l) => l.id)).toContain(line.id)
    expect(game.canSearchAgain).toBe(false)
  })

  it('coffee: five more questions, once', () => {
    const game = useGame()
    const line = nightWith(game, 'coffee')
    game.continueToQuestioning()
    const before = game.questionsLeft
    game.useLifeline(line.id)
    expect(game.questionsLeft).toBe(before + 5)
    game.useLifeline(line.id)
    expect(game.questionsLeft).toBe(before + 5)
  })

  it('Sergeant Pike searches a room for you, and reports when the hour strikes — kept with the night', () => {
    const game = useGame()
    const line = nightWith(game, 'pike')
    game.continueToQuestioning()
    const room = game.pikeRooms[0]
    game.useLifeline(line.id, { room })
    expect(game.searchedRooms).not.toContain(room)
    game.strikeHour()
    expect(game.searchedRooms).toContain(room)
    expect(game.lifelineReport?.kind).toBe('pike')

    const save = game.exportSave()!
    game.newGame(99)
    expect(game.restore(JSON.parse(JSON.stringify(save)))).toBe(true)
    expect(game.searchedRooms).toContain(room)
    expect(game.usedLifelines[line.id]?.room).toBe(room)
  })

  it('the telegram becomes an exhibit proving how one guest truly stood with the victim', () => {
    const game = useGame()
    const line = nightWith(game, 'telegram')
    game.continueToQuestioning()
    game.useLifeline(line.id, { char: 2 })
    const wire = game.foundItems.find((e) => e.id === 'telegram-2')!
    expect(wire.fact).toEqual({ kind: 'motiveDocument', subject: 2, rel: game.mystery!.truth.relationships[2] })
  })

  it('the expert clears a guest only on a count that truly clears them', () => {
    const game = useGame()
    const line = nightWith(game, 'expert')
    game.continueToQuestioning()
    const culprit = game.mystery!.truth.roles.indexOf('culprit')
    game.useLifeline(line.id, { char: culprit })
    const r = game.lifelineReport
    expect(r?.kind).toBe('expert')
    expect(r && r.kind === 'expert' && r.pillar).toBe(null)
  })
})

describe('game store — an easier night', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('without lifelines, none are hidden — and the choice is kept with the night', () => {
    const game = useGame()
    game.newGame(7, 'classic', null, 'manor1920s', false)
    expect(game.mystery!.lifelines).toEqual([])
    game.begin()
    const save = game.exportSave()!
    game.newGame(99)
    expect(game.mystery!.lifelines).toHaveLength(2)
    expect(game.restore(JSON.parse(JSON.stringify(save)))).toBe(true)
    expect(game.mystery!.lifelines).toEqual([])
  })
})

describe('game store — the coffee', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('its five questions are spent before the hour’s own', () => {
    const game = useGame()
    for (let seed = 1; seed < 300; seed++) {
      game.newGame(seed)
      if (game.mystery!.lifelines?.some((l) => l.kind === 'coffee')) break
    }
    const cup = game.mystery!.lifelines!.find((l) => l.kind === 'coffee')!
    game.begin()
    game.startInvestigation()
    game.finishTransition()
    game.search(cup.room)
    game.continueToQuestioning()
    // Two of the hour's own spent, then the coffee.
    let paid = 0
    for (const m of game.mystery!.cast) {
      if (paid === 2) break
      const before = game.questionsLeft
      game.ask(m.id, { kind: 'alibi' })
      if (game.questionsLeft < before) paid++
    }
    const ownLeft = game.questionsLeft
    game.useLifeline(cup.id)
    expect(game.bonusQuestions).toBe(5)
    expect(game.beansLeft).toBe(5)
    for (const m of game.mystery!.cast) {
      const before = game.questionsLeft
      game.ask(m.id, { kind: 'role' })
      if (game.questionsLeft < before) break
    }
    expect(game.beansLeft).toBe(4)
    expect(game.questionsLeft - game.beansLeft).toBe(ownLeft)
  })
})

describe('game store — the sealed note', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('opened, it names a room still holding something, or a question not yet put that tells something', () => {
    const game = useGame()
    let checked = 0
    for (let seed = 1; seed < 400 && checked < 8; seed++) {
      game.newGame(seed)
      const note = game.mystery!.lifelines?.find((l) => l.kind === 'note')
      if (!note) continue
      game.begin()
      game.startInvestigation()
      game.finishTransition()
      game.search(note.room)
      game.continueToQuestioning()
      game.useLifeline(note.id)
      const r = game.lifelineReport
      expect(r?.kind).toBe('note')
      const hint = r!.kind === 'note' ? r!.hint : null
      if (hint?.kind === 'room') {
        expect(game.searchedRooms).not.toContain(hint.room)
        expect(
          game.mystery!.evidence.some(
            (e) => e.room === hint.room && e.fact.kind !== 'flavor' && !game.foundItems.includes(e),
          ),
        ).toBe(true)
      } else if (hint?.kind === 'ask') {
        expect(game.questionState(hint.char, { kind: hint.q })).toBe('fresh')
      }
      // Kept with the night, and read the same.
      const save = game.exportSave()!
      game.newGame(99)
      expect(game.restore(JSON.parse(JSON.stringify(save)))).toBe(true)
      expect(game.usedLifelines[note.id]?.hint).toEqual(hint)
      checked++
    }
    expect(checked).toBe(8)
  })
})

describe('game store — where the liars say they were', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('nobody but the murderer ever claims to have been at the scene', () => {
    const game = useGame()
    for (const script of ['conspiracy', 'both'] as const) {
      for (let seed = 1; seed <= 12; seed++) {
        game.newGame(seed, script)
        const m = game.mystery!
        m.policies.forEach((p, c) => {
          if (m.truth.roles[c] === 'culprit' || m.truth.locations[c] === m.caseSheet.sceneRoom) return
          for (const a of p.alibi) {
            for (const claim of a.claims) {
              if (claim.kind === 'whereabouts') expect(claim.room, `${script} ${seed} ${m.truth.roles[c]}`).not.toBe(m.caseSheet.sceneRoom)
            }
          }
        })
      }
    }
  })
})

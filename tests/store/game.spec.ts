// Integration test of the game store: a full night played through the same
// actions the UI calls, against a fixed seed.

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { matchContradiction, type Contradiction } from '../../src/engine/contradictions'
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

    // Spend the hour's questions; the budget must hold.
    for (let c = 0; c < 6; c++) game.ask(c, { kind: 'knowledge' })
    expect(game.questionsLeft).toBe(0)
    const notebookAtBudget = game.notebook.length
    game.ask(6, { kind: 'knowledge' })
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

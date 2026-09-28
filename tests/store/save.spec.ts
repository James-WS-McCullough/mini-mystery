// A night in progress is saved as the detective's actions and restored by
// replaying them: the resumed night must be indistinguishable from the one
// that was left.

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGame, type SaveGame } from '../../src/stores/game'

type Game = ReturnType<typeof useGame>

function snapshot(game: Game) {
  return {
    phase: game.phase,
    stage: game.stage,
    round: game.round,
    questionsLeft: game.questionsLeft,
    missesLeft: game.missesLeft,
    searchedRooms: [...game.searchedRooms],
    foundItemIds: [...game.foundItemIds],
    notebook: JSON.parse(JSON.stringify(game.notebook)),
    log: JSON.parse(JSON.stringify(game.log)),
    realized: JSON.parse(JSON.stringify(game.realized)),
    pressable: [...game.pressable].sort(),
    caughtLying: [...game.caughtLying].sort(),
    undrawn: [game.undrawnContradictions, game.undrawnLinks],
    stats: { ...game.nightStats },
    cited: [game.accusedId, game.citedNoteIds, game.citedItemIds, game.citedThreadKeys],
  }
}

/** Save, throw the whole store away, and resume in a fresh one. */
function roundTrip(game: Game): Game {
  const save = JSON.parse(JSON.stringify(game.exportSave())) as SaveGame
  setActivePinia(createPinia())
  const resumed = useGame()
  expect(resumed.restore(save)).toBe(true)
  return resumed
}

/** Through the first hour's search and questions, into the deduction. */
function playFirstHour(game: Game) {
  game.newGame(7)
  game.begin()
  game.startInvestigation()
  game.finishTransition()
  game.search(game.mystery!.caseSheet.sceneRoom)
  game.continueToQuestioning()
  for (let c = 0; c < 3; c++) {
    game.ask(c, { kind: 'alibi' })
    game.ask(c, { kind: 'knowledge' })
  }
  game.beginDeduce()
}

describe('game store — saving and resuming', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('has nothing to save on the title screen', () => {
    expect(useGame().exportSave()).toBeNull()
  })

  it('resumes mid-interview exactly where it left off', () => {
    const game = useGame()
    game.newGame(7)
    game.begin()
    game.startInvestigation()
    game.finishTransition()
    game.skipSearch()
    game.ask(2, { kind: 'alibi' })
    game.ask(2, { kind: 'aboutPerson', person: 'victim' })
    game.ask(4, { kind: 'aboutPerson', person: 1 })

    const before = snapshot(game)
    const resumed = roundTrip(game)
    expect(snapshot(resumed)).toEqual(before)

    // And the two nights stay in step afterwards: ask-depth carried over.
    game.ask(2, { kind: 'alibi' })
    resumed.ask(2, { kind: 'alibi' })
    expect(snapshot(resumed)).toEqual(snapshot(game))
  })

  it('carries drawn threads, misses and the later hours across a save', () => {
    const game = useGame()
    playFirstHour(game)

    // One deliberate miss, then every thread the notes hold.
    const ids = game.notebook.filter((n) => n.claim.kind !== 'suspicion').map((n) => n.id)
    outer: for (const a of ids) {
      for (const b of ids) {
        if (a === b) continue
        game.deduceSelection = [a, b]
        game.testPair()
        if (game.lastDeduceResult?.kind === 'miss') break outer
      }
    }
    for (const c of game.contradictions) {
      const pair = c.evidenceId ? [...c.statementIds, c.evidenceId] : [...c.statementIds]
      if (pair.length !== 2) continue
      game.deduceSelection = pair
      game.testPair()
    }
    for (const l of game.links) {
      const pair = l.evidenceId ? [...l.statementIds, l.evidenceId] : [...l.statementIds]
      if (pair.length !== 2) continue
      game.deduceSelection = pair
      game.testPair()
    }
    expect(game.nightStats.wrongGuesses).toBe(1)

    game.strikeHour()
    game.finishTransition()
    game.skipSearch()
    for (const c of game.pressable) game.press(c)

    const before = snapshot(game)
    expect(before.round).toBe(1)
    expect(snapshot(roundTrip(game))).toEqual(before)
  })

  it('restores the case board of an accusation in progress', () => {
    const game = useGame()
    playFirstHour(game)
    game.strikeHour()
    game.finishTransition()
    game.skipSearch()
    game.beginAccuse()
    game.accusedId = 3
    game.toggleCiteItem(game.foundItems[0].id)
    game.toggleCiteNote(game.notebook[0].id)

    const before = snapshot(game)
    expect(before.phase).toBe('accuse')
    const resumed = roundTrip(game)
    expect(snapshot(resumed)).toEqual(before)

    // Stepping back from the accusation still works after a resume.
    resumed.backToPlay()
    expect(resumed.phase).toBe('play')
    expect(resumed.stage).toBe('question')
  })

  it('clears the save once the verdict is in', () => {
    const game = useGame()
    playFirstHour(game)
    game.beginAccuse()
    game.accusedId = 0
    game.submitAccusation()
    expect(game.phase).toBe('reveal')
    expect(game.exportSave()).toBeNull()
  })

  it('refuses a save it cannot replay, and returns to the title', () => {
    const game = useGame()
    playFirstHour(game)
    const save = game.exportSave()!
    // An action that cannot happen here: searching while the deduction is open.
    save.actions.push({ t: 'search', room: 'study' })

    setActivePinia(createPinia())
    const resumed = useGame()
    expect(resumed.restore(save)).toBe(false)
    expect(resumed.phase).toBe('title')
  })
})

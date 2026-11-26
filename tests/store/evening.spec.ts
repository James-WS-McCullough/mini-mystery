import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGame } from '../../src/stores/game'

/** A night of the Evening Timeline, at the table with questions in hand. */
function eveningNight(seed: number) {
  setActivePinia(createPinia())
  const game = useGame()
  game.newGame(seed, 'twist', null, 'manor1920s', undefined, false, { variant: 'timeline' })
  game.begin()
  game.startInvestigation()
  game.finishTransition()
  game.skipSearch()
  return game
}

describe('the Evening Timeline, in play', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('asks what happened last night, and holds the alibis back until the hour is known', () => {
    for (const seed of [4, 9, 23]) {
      const game = eveningNight(seed)
      const m = game.mystery!
      expect(m.evening).toBeDefined()
      const n = m.cast.length
      let asked = 0
      // Ask round the table, hour after hour, until the clues settle the hour.
      for (let c = 0; c < n; c++) {
        if (game.questionsLeft === 0) {
          game.strikeHour()
          game.finishTransition()
          game.skipSearch()
        }
        game.ask(c, { kind: 'alibi' })
        asked++
        expect(game.telling?.speaker).toBe(c)
        game.telling = null
        const whereNotes = game.notebook.filter((x) => x.claim.kind === 'whereabouts').length
        if (!game.hourKnown) expect(whereNotes).toBe(0)
      }
      expect(game.eveningHeard.length).toBeGreaterThan(n)
      // The watch, where there is one, is at the scene.
      if (!game.hourKnown && m.evening!.watch) {
        expect(m.evidence.find((e) => e.id === m.evening!.watch!.item)?.room).toBe(m.caseSheet.sceneRoom)
      }
      if (game.hourKnown) {
        expect(game.deathHours).toEqual({ lo: m.evening!.murder, hi: m.evening!.murder })
        expect(game.notebook.filter((x) => x.claim.kind === 'whereabouts').length).toBeGreaterThan(0)
      }
      expect(asked).toBe(n)
    }
  })

  it('saves and resumes the same', () => {
    const game = eveningNight(9)
    for (let c = 0; c < 4; c++) game.ask(c, { kind: 'alibi' })
    const save = game.exportSave()!
    expect(save.variant).toBe('timeline')
    const heard = JSON.stringify(game.eveningHeard)
    const notes = JSON.stringify(game.notebook)
    setActivePinia(createPinia())
    const again = useGame()
    expect(again.restore(save)).toBe(true)
    expect(JSON.stringify(again.eveningHeard)).toBe(heard)
    expect(JSON.stringify(again.notebook)).toBe(notes)
    expect(again.mystery!.evening).toBeDefined()
  })
})

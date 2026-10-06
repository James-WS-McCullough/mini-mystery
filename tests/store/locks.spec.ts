// A paper found in a room is kept under lock until the lock is opened, or skipped; a save replays the opening.
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGame } from '../../src/stores/game'

describe('locks on what is found', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('keeps a paper out of hand until its lock is opened, and the opening survives a reload', () => {
    const game = useGame()
    game.newGame(7, 'simple', null, 'manor1920s')
    game.begin()
    game.startInvestigation()
    game.finishTransition()
    const paper = game.mystery!.evidence.find((e) => e.id === 'doc-motive')!
    game.search(paper.room)
    expect(game.lastSearchItems.map((e) => e.id)).toContain(paper.id)
    expect(game.sealedItemIds).toContain(paper.id)
    expect(game.foundItems.map((e) => e.id)).not.toContain(paper.id)
    const lock = game.lockOf(paper.id)
    expect(['word', 'dials', 'lamps']).toContain(lock.kind)
    expect(game.lockOf(paper.id)).toEqual(lock)
    game.unlock(paper.id)
    expect(game.sealedItemIds).not.toContain(paper.id)
    expect(game.foundItems.map((e) => e.id)).toContain(paper.id)
    // Opened once; a second opening is nothing.
    const actions = game.exportSave()!.actions.filter((a) => a.t === 'unlock').length
    game.unlock(paper.id)
    expect(game.exportSave()!.actions.filter((a) => a.t === 'unlock').length).toBe(actions)
    // And the save replays it.
    const save = JSON.parse(JSON.stringify(game.exportSave()))
    setActivePinia(createPinia())
    const again = useGame()
    expect(again.restore(save)).toBe(true)
    expect(again.sealedItemIds).toEqual([])
    expect(again.foundItems.map((e) => e.id)).toContain(paper.id)
  })

  it('does not lock anything on the lesson', () => {
    const game = useGame()
    game.newGame(2291, 'simple', null, 'manor1920s')
    expect(game.sealedItemIds).toEqual([])
  })
})

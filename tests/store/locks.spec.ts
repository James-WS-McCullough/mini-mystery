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
    expect(['word', 'dials', 'lamps', 'cards', 'wires']).toContain(lock.kind)
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

describe('the key to the locked room', () => {
  beforeEach(() => setActivePinia(createPinia()))

  /** A night with a locked room whose key lies in another room, ready for the hour's search. */
  function nightWithKey() {
    for (let seed = 1; seed < 400; seed++) {
      setActivePinia(createPinia())
      const game = useGame()
      game.newGame(seed, 'twist')
      const m = game.mystery!
      const key = m.evidence.find((e) => e.id === 'key')
      if (!m.truth.locked || !key || key.heldBy !== undefined) continue
      // (And one other room with nothing but flavour in it, to spend the hour's spare search on.)
      const empty = game.ctx!.pack.rooms
        .map((r) => r.id)
        .find((r) => r !== key.room && r !== m.truth.locked && m.evidence.filter((e) => e.room === r).every((e) => e.fact.kind === 'flavor') && !(m.lifelines ?? []).some((l) => l.room === r))
      if (!empty) continue
      game.begin()
      game.startInvestigation()
      game.finishTransition()
      return { game, locked: m.truth.locked, keyRoom: key.room, empty }
    }
    throw new Error('no night with a key')
  }

  it('found, lets the door be tried then and there, even with the hour’s spare search spent', () => {
    const { game, locked, keyRoom, empty } = nightWithKey()
    // An empty room first: the spare search, spent on the room with the key.
    game.search(empty)
    expect(game.canSearchAgain).toBe(true)
    game.searchAgain()
    game.search(keyRoom)
    expect(game.keyJustFound).toBe(true)
    expect(game.canSearchAgain).toBe(true)
    game.searchAgain()
    game.search(locked)
    expect(game.searchedRooms).toContain(locked)
    // And no more after that, the door once opened.
    expect(game.keyJustFound).toBe(false)
    // The save replays it.
    const save = game.exportSave()!
    setActivePinia(createPinia())
    const again = useGame()
    expect(again.restore(save)).toBe(true)
    expect(again.searchedRooms).toContain(locked)
  })

  it('found at eleven, the last hour, still opens the door', () => {
    const { game, locked, keyRoom } = nightWithKey()
    for (let hour = 0; hour < game.mystery!.config.rounds - 1; hour++) {
      game.skipSearch()
      game.continueToQuestioning?.()
      game.strikeHour()
      game.finishTransition()
    }
    expect(game.isLastRound).toBe(true)
    game.search(keyRoom)
    expect(game.canSearchAgain).toBe(true)
    game.searchAgain()
    game.search(locked)
    expect(game.searchedRooms).toContain(locked)
  })
})

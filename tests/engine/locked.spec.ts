import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { manor1920s } from '../../src/content/manor1920s'
import { CLASSIC_SCRIPT, CONSPIRACY_SCRIPT, FOGGY_SCRIPT } from '../../src/engine/deck'
import { generateMystery } from '../../src/engine/generate'
import type { Answer, Mystery } from '../../src/engine/types'
import { useGame } from '../../src/stores/game'

const nights = [CLASSIC_SCRIPT, FOGGY_SCRIPT, CONSPIRACY_SCRIPT].flatMap((script) =>
  Array.from({ length: 50 }, (_, i) => generateMystery({ seed: i + 1, pack: manor1920s, script })),
)
const locked = nights.filter((m) => m.truth.locked)
const keyOf = (m: Mystery) => m.evidence.find((e) => e.fact.kind === 'key')!
/** Every answer a guest could give, and what they add in the same breath. */
const answers = (m: Mystery, c: number): Answer[] => {
  const p = m.policies[c]
  return [p.reaction, ...p.role, ...p.alibi, ...p.knowledge, p.seen, p.suspect, ...Object.values(p.aboutEvidence)].flatMap(
    (a) => (a.also ? [a, a.also] : [a]),
  )
}

describe('a locked room', () => {
  it('comes on about two nights in five, on every kind of evening', () => {
    expect(locked.length / nights.length).toBeGreaterThan(0.25)
    expect(locked.length / nights.length).toBeLessThan(0.6)
    // (The harder evenings have a passage; the classic one has not.)
    expect(locked.some((m) => !m.caseSheet.passageRooms)).toBe(true)
    expect(locked.some((m) => m.caseSheet.passageRooms && m.caseSheet.script.helpers.length > 0)).toBe(true)
    expect(locked.some((m) => m.caseSheet.passageRooms && m.caseSheet.script.helpers.length === 0)).toBe(true)
  })

  it('holds papers, somebody’s or his, and nobody spent the hour in it', () => {
    let murderers = 0
    let others = 0
    for (const m of locked) {
      const room = m.truth.locked!
      expect(room).not.toBe(m.truth.sceneRoom)
      expect(m.truth.locations).not.toContain(room)
      const papers = m.evidence.filter(
        (e) => e.room === room && (e.fact.kind === 'motiveDocument' || e.fact.kind === 'handSample'),
      )
      expect(papers.length, `seed ${m.seed}`).toBeGreaterThan(0)
      const culprit = m.truth.roles.indexOf('culprit')
      if (papers.some((e) => e.fact.kind === 'motiveDocument' && e.fact.subject === culprit)) murderers++
      else others++
      // Nor does anybody say they were in it, nor is help hidden there.
      for (const p of m.policies) {
        for (const a of p.alibi) {
          for (const c of a.claims) if (c.kind === 'whereabouts') expect(c.room).not.toBe(room)
        }
      }
      expect((m.lifelines ?? []).some((l) => l.room === room)).toBe(false)
    }
    // Behind the door is as often somebody else's paper as the murderer's.
    expect(murderers).toBeGreaterThan(5)
    expect(others).toBeGreaterThan(5)
  })

  it('has its key in another room, or in the Collector’s keeping', () => {
    let held = 0
    for (const m of locked) {
      const key = keyOf(m)
      expect(key.fact.kind === 'key' && key.fact.room).toBe(m.truth.locked)
      expect(key.room).not.toBe(m.truth.locked)
      if (key.heldBy !== undefined) {
        held++
        expect(m.truth.roles[key.heldBy]).toBe('collector')
        expect(m.policies[key.heldBy].knowledge.some((a) => a.gives?.includes('key'))).toBe(true)
      }
    }
    expect(held).toBeGreaterThan(0)
    for (const m of nights.filter((x) => !x.truth.locked)) {
      expect(m.evidence.some((e) => e.fact.kind === 'key')).toBe(false)
    }
  })

  it('somebody honest has seen the key, and says where, or who has it, when asked what they have seen', () => {
    for (const m of locked) {
      const key = keyOf(m)
      const tellers = m.cast.filter((c) => answers(m, c.id).some((a) => a.lineKey.startsWith('seen.key')))
      expect(tellers.length, `seed ${m.seed}`).toBe(1)
      const hint = answers(m, tellers[0].id).find((a) => a.lineKey.startsWith('seen.key'))!
      if (key.heldBy !== undefined) {
        expect(hint.lineKey).toBe('seen.key.held')
        expect(hint.refer?.person).toBe(key.heldBy)
      } else {
        expect(hint.lineKey).toBe('seen.key')
        expect(hint.refer?.room).toBe(key.room)
      }
      // It is said in answer to what they have seen, and nowhere else.
      const seen = m.policies[tellers[0].id].seen
      expect(seen.lineKey === hint.lineKey || seen.also === hint).toBe(true)
    }
  })

  it('is solved all the same', () => {
    for (const m of locked) expect(m.solution).toBeTruthy()
  })
})

describe('the locked door, in play', () => {
  it('will not open without the key, costs no search, and opens once the key is found', () => {
    const m = locked.find((x) => x.caseSheet.script.helpers.length === 0 && keyOf(x).heldBy === undefined && keyOf(x).room !== x.truth.sceneRoom)!
    setActivePinia(createPinia())
    const game = useGame()
    game.newGame(m.seed, m.caseSheet.script.herrings.includes('drunk') ? 'foggy' : 'classic')
    expect(game.lockedRoom).toBe(m.truth.locked)
    game.begin()
    game.startInvestigation()
    game.finishTransition()
    const door = game.lockedRoom!
    game.search(door)
    expect(game.stage).toBe('search')
    expect(game.searchedRooms).not.toContain(door)
    expect(game.lockedNotice).toBe('This room is locked, and the key has gone missing.')
    expect(game.triedLocked).toBe(true)
    expect(game.pikeRooms).not.toContain(door)
    // A night with a door tried is kept, and comes back with the door known.
    const save = JSON.parse(JSON.stringify(game.exportSave()))
    game.newGame(99)
    expect(game.restore(save)).toBe(true)
    expect(game.triedLocked).toBe(true)
    expect(game.lockedNotice).toBeNull()
    // The key, then the door.
    game.search(keyOf(game.mystery!).room)
    expect(game.unlocked).toBe(true)
    expect(game.lockedNotice).toBeNull()
    game.continueToQuestioning()
    game.strikeHour()
    game.finishTransition()
    game.search(door)
    expect(game.searchedRooms).toContain(door)
    expect(game.foundItems.some((e) => e.room === door && e.fact.kind === 'motiveDocument')).toBe(true)
  })
})

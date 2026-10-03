import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { migrateCase } from '../../src/stores/night/migrate'
import { useGame, type SaveGame } from '../../src/stores/game'
import type { CaseRecord } from '../../src/ui/profile'

/** A night played a little way, saved, and the save written as it was before the rename. */
function oldSave(): { save: SaveGame; notes: number } {
  setActivePinia(createPinia())
  const game = useGame()
  game.newGame(12, 'twist')
  game.begin()
  game.startInvestigation()
  game.finishTransition()
  game.skipSearch()
  game.ask(0, { kind: 'alibi' })
  game.setRole(1, 'murderer')
  game.setRole(2, 'companion')
  const save = JSON.parse(JSON.stringify(game.exportSave())) as SaveGame
  const old = JSON.parse(
    JSON.stringify(save).replace('"script":"twist"', '"script":"foggy"').replace('"to":"murderer"', '"to":"culprit"').replace('"to":"companion"', '"to":"alibi"'),
  ) as SaveGame
  return { save: old, notes: game.notebook.length }
}

describe('saves and records from before the parts and evenings were renamed', () => {
  it('an old save is read with the new names, and plays on as it was', () => {
    const { save, notes } = oldSave()
    expect(save.script as string).toBe('foggy')
    setActivePinia(createPinia())
    const game = useGame()
    expect(game.restore(save)).toBe(true)
    expect(game.script).toBe('twist')
    expect(game.notebook.length).toBe(notes)
    expect(game.roleOf(1).role).toBe('murderer')
    expect(game.roleOf(2).role).toBe('companion')
  })

  it('a night of the Conspiracy, which is no evening now, is not played again', () => {
    const { save } = oldSave()
    setActivePinia(createPinia())
    const game = useGame()
    expect(game.restore({ ...save, script: 'conspiracy' as never })).toBe(false)
    expect(game.phase).toBe('title')
  })

  it('old case records are filed under the new evenings', () => {
    const r = { script: 'classic' } as unknown as CaseRecord
    expect(migrateCase(r).script).toBe('simple')
    expect(migrateCase({ ...r, script: 'both' } as unknown as CaseRecord).script).toBe('knot')
    expect(migrateCase({ ...r, script: 'conspiracy' } as unknown as CaseRecord).script).toBe('knot')
    expect(migrateCase({ ...r, script: 'web' } as unknown as CaseRecord).script).toBe('web')
  })
})

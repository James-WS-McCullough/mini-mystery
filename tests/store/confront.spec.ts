import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { isTied } from '../../src/engine/confront'
import { KNOT_SCRIPT, type Script } from '../../src/engine/deck'
import { useGame } from '../../src/stores/game'

/** A night at the table, questions in hand: the first, from `from`, whose dealing passes the test. */
function nightWhere(test: (game: ReturnType<typeof useGame>) => boolean, evening: 'simple' | 'twist' | Script = 'twist', from = 1) {
  for (let seed = from; seed < from + 200; seed++) {
    setActivePinia(createPinia())
    const game = useGame()
    game.newGame(seed, evening)
    if (!test(game)) continue
    game.begin()
    game.startInvestigation()
    game.finishTransition()
    game.skipSearch()
    return game
  }
  throw new Error('no such night')
}

describe('telling a guest what was said of them', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('the Sweetheart, told of the sighting that gives them the lie, owns up, for a question', () => {
    const game = nightWhere((g) => g.mystery!.truth.roles.includes('sweetheart'))
    const m = game.mystery!
    const s = m.truth.roles.indexOf('sweetheart')
    // Whoever saw them where they truly were.
    const seer = m.guests.find(
      (g) => g.id !== s && g.told.saw.some((k) => k.kind === 'sighting' && k.target === s && k.room === m.truth.locations[s]),
    )!
    expect(seer).toBeDefined()
    game.ask(seer.id, { kind: 'seen' })
    game.ask(s, { kind: 'alibi' })
    const note = game.notebook.find((n) => n.speaker === seer.id && n.claim.kind === 'sighting' && n.claim.target === s)!
    expect(note).toBeDefined()
    const before = game.questionsLeft
    game.confront(s, note.id)
    expect(game.questionsLeft).toBe(before - 1)
    const owned = game.notebook.filter((n) => n.speaker === s && n.source.startsWith('shown what'))
    expect(owned.some((n) => n.claim.kind === 'role' && n.claim.role === 'sweetheart')).toBe(true)
    // What they said before is taken back: the old account fades in the notebook.
    const before1 = game.notebook.find((n) => n.speaker === s && n.claim.kind === 'whereabouts' && !n.owned)
    expect(before1).toBeDefined()
    expect(game.retracted.has(before1!.id)).toBe(true)
    // And told it again, they have nothing more to own to: it costs nothing.
    const left = game.questionsLeft
    game.confront(s, note.id)
    expect(game.questionsLeft).toBe(left)

    // And it is kept with the night.
    const notes = game.notebook.length
    const save = game.exportSave()!
    game.newGame(99)
    expect(game.restore(JSON.parse(JSON.stringify(save)))).toBe(true)
    expect(game.notebook.length).toBe(notes)
  })

  it('anybody else has only a word to say to it, and it costs nothing', () => {
    const game = nightWhere(() => true, 'simple')
    const m = game.mystery!
    let tried = 0
    for (const g of m.cast) {
      if (game.questionsLeft === 0) break
      game.ask(g.id, { kind: 'suspect' })
      const note = game.notebook.find((n) => n.speaker === g.id && (n.claim.kind === 'suspicion' || n.claim.kind === 'trust'))
      if (!note || (note.claim.kind !== 'suspicion' && note.claim.kind !== 'trust')) continue
      const target = note.claim.target
      // (Told with a question in hand: it is not spent unless they own up.)
      if (isTied(m, target) || game.questionsLeft === 0) continue
      const before = game.questionsLeft
      const lines = game.log.length
      game.confront(target, note.id)
      expect(game.questionsLeft).toBe(before)
      expect(game.log.length).toBe(lines + 2)
      expect(game.freeLineId).toBe(game.log[game.log.length - 1].id)
      tried++
    }
    expect(tried).toBeGreaterThan(0)
  })
})

describe('the bought witness', () => {
  it('shown the money they were paid with, owns up for a question, and their silence is taken back', () => {
    const script: Script = { ...KNOT_SCRIPT, id: 'custom', accomplices: ['sponsor'], accompliceChance: 1 }
    const game = nightWhere((g) => g.mystery!.truth.bribed != null, script)
    const m = game.mystery!
    const paid = m.truth.bribed!
    const money = m.evidence.find((e) => e.fact.kind === 'bribe')!
    game.foundItemIds.push(money.id)
    game.ask(paid, { kind: 'knowledge' })
    const silence = game.notebook.find((n) => n.speaker === paid && n.claim.kind === 'silent')
    const before = game.questionsLeft
    game.ask(paid, { kind: 'aboutEvidence', item: money.id })
    expect(game.questionsLeft).toBe(before - 1)
    expect(game.notebook.some((n) => n.speaker === paid && n.owned && n.claim.kind === 'bribed')).toBe(true)
    expect(silence).toBeDefined()
    expect(game.retracted.has(silence!.id)).toBe(true)
  })
})

describe('leads', () => {
  it('writes up where an answer points: the room to try, and who pointed there', () => {
    setActivePinia(createPinia())
    const game = nightWhere((g) => g.mystery!.policies.some((p) => p.reaction.refer?.room !== undefined), 'simple')
    expect(game.leads.length).toBeGreaterThan(0)
    for (const l of game.leads) {
      expect(l.room ?? l.person).toBeDefined()
      expect(l.text.length).toBeGreaterThan(0)
      expect(l.source).toBe('their opening statement')
    }
  })
})

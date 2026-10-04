// The first campaign case is a fixed case number, and Sergeant Pike's lesson
// is written to its shape: the Gossip is the one innocent, the weapon clears
// them and nobody else, they know the murderer's grudge, the first
// contradiction the lesson leads to catches the Thief and not the murderer,
// and the murderer's own account breaks against the Gossip's, which the room
// bears out. Should dealing ever change, this says so, and a new number is
// wanted (scan with the shape below).

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { CAMPAIGN, FIRST_CASE_SCRIPT, FIRST_CASE_SEED, TUTORIALS, campaignCase } from '../../src/campaign'
import { packOf } from '../../src/content'
import { findContradictions, type NotedStatement } from '../../src/engine/contradictions'
import { allSpoken, generateMystery } from '../../src/engine/generate'
import { isMotiveGrade, type Claim } from '../../src/engine/types'
import { OPPORTUNITY_BREAKS } from '../../src/engine/verdict'
import { useGame, type SaveGame } from '../../src/stores/game'

const first = campaignCase('first-case')!

describe('the first case', () => {
  const m = generateMystery({ seed: FIRST_CASE_SEED, pack: packOf(first.pack), script: FIRST_CASE_SCRIPT })
  const roles = m.truth.roles
  const murderer = roles.indexOf('murderer')
  const gossip = roles.indexOf('gossip')
  const thief = roles.indexOf('thief')

  it('seats the murderer, the Thief and the Gossip, and nobody quiet', () => {
    expect(m.cast).toHaveLength(3)
    expect([murderer, gossip, thief].every((c) => c >= 0)).toBe(true)
    expect(m.policies.every((p) => (p.opens?.length ?? 0) === 0)).toBe(true)
    expect(m.config.questionsPerRound).toBe(5)
  })

  it('leaves the weapon at the scene, and it clears the Gossip and nobody else', () => {
    const weapon = m.evidence.find((e) => e.fact.kind === 'weapon')
    expect(weapon?.room).toBe(m.caseSheet.sceneRoom)
    const lacks = m.cast.filter((c) => !c.means.includes(m.truth.methodMeans)).map((c) => c.id)
    expect(lacks).toEqual([gossip])
  })

  it('has the Gossip tell the murderer’s grudge, asked their role once', () => {
    const told = m.policies[gossip].knowledge[0].claims
    expect(told.some((k) => k.kind === 'relationship' && k.subject === murderer && isMotiveGrade(k.rel))).toBe(true)
  })

  it('yields no contradiction from the Gossip alone, then one that catches the Thief and not the murderer', () => {
    const notes: NotedStatement[] = []
    const add = (speaker: number, claims: Claim[]) =>
      claims.forEach((claim) => notes.push({ id: `s${notes.length}`, speaker, claim }))
    const found = m.evidence.filter((e) => e.room === m.caseSheet.sceneRoom && e.heldBy === undefined)
    m.cast.forEach((c) => add(c.id, m.policies[c.id].reaction.claims))
    add(gossip, m.policies[gossip].alibi[0].claims)
    add(gossip, m.policies[gossip].knowledge[0].claims)
    expect(findContradictions(notes, found, m.caseSheet)).toEqual([])
    for (const c of m.cast) if (c.id !== gossip) add(c.id, m.policies[c.id].alibi[0].claims)
    const xs = findContradictions(notes, found, m.caseSheet)
    expect(xs.length).toBeGreaterThan(0)
    for (const x of xs) {
      expect(x.implicated).toContain(thief)
      expect(x.implicated).not.toContain(murderer)
    }
    // And the Thief, pressed, owns to the theft.
    expect(m.policies[thief].press.kind).toBe('confess')
  })

  it('has the two liars claim to have been alone: opportunity, as the lesson teaches it', () => {
    for (const c of [murderer, thief]) {
      const where = m.policies[c].alibi[0].claims.find((k) => k.kind === 'whereabouts')
      expect(where).toBeDefined()
      expect(where!.kind === 'whereabouts' && where!.companions).toEqual([])
    }
    // (And the Gossip, who was truly alone, is kept from the scene by the truth of it.)
    expect(m.truth.companions[gossip]).toEqual([])
    expect(m.truth.locations[gossip]).not.toBe(m.caseSheet.sceneRoom)
  })

  it('breaks the murderer’s account against the Gossip’s, which the room bears out', () => {
    const spoken = allSpoken(m)
    const all = findContradictions(
      spoken.map((s, i) => ({ id: `s${i}`, speaker: s.speaker, claim: s.claim })),
      m.evidence,
      m.caseSheet,
    )
    const breaks = all.filter(
      (c) =>
        OPPORTUNITY_BREAKS.has(c.reason) &&
        c.implicated.includes(murderer) &&
        c.implicated.every((i) => i === murderer || i === gossip),
    )
    expect(breaks.length).toBeGreaterThan(0)
    const trace = m.evidence.find((e) => e.fact.kind === 'trace' && e.room === m.truth.locations[gossip])
    expect(trace).toBeDefined()
  })
})

describe('Sergeant Pike’s lesson', () => {
  beforeEach(() => setActivePinia(createPinia()))

  type Game = ReturnType<typeof useGame>
  /** Hear Pike out: the step due is the one named, and is taken as heard. */
  function hear(game: Game, step: string) {
    expect(game.tutorSpeaking?.id).toBe(step)
    for (const line of game.tutorLines(game.tutorSpeaking!)) expect(line).not.toMatch(/\{(?!sir\})\w+\}/)
    game.tutorHeard(step)
    expect(game.tutorSpeaking?.id).not.toBe(step)
  }

  it('walks the first case from the welcome to the accusation', () => {
    const game = useGame()
    game.startCase(first)
    expect(game.campaignId).toBe('first-case')
    expect(game.mystery!.seed).toBe(FIRST_CASE_SEED)
    expect(game.lifelinesOn).toBe(false)
    const m = game.mystery!
    const roles = m.truth.roles
    const murderer = roles.indexOf('murderer')
    const gossip = roles.indexOf('gossip')
    const thief = roles.indexOf('thief')
    const scene = m.caseSheet.sceneRoom

    // The welcome, over the case file: nothing glows until he has finished; then the task, and its button.
    expect(game.tutorSpeaking?.id).toBe('welcome')
    expect(game.tutorLit).toEqual([])
    hear(game, 'welcome')
    expect(game.tutorTask?.step.id).toBe('welcome')
    expect(game.tutorLit).toContain('summon')
    game.begin()
    expect(game.tutorDone('welcome')).toBe(true)
    // (Nothing over the gathering: the household is speaking.)
    expect(game.tutorSpeaking).toBeNull()
    game.startInvestigation()
    game.finishTransition()

    // The hours: the scene, and nothing but the scene.
    hear(game, 'hours')
    expect(game.tutorLocks.rooms).toEqual([scene])
    expect(game.tutorLocks.skipSearch).toBe(false)
    expect(game.tutorLit).toContain(`room:${scene}`)
    const other = m.evidence.find((e) => e.room !== scene)!.room
    game.search(other)
    expect(game.stage).toBe('search') // barred
    game.skipSearch()
    expect(game.stage).toBe('search') // barred
    game.search(scene)
    expect(game.tutorDone('hours')).toBe(true)
    expect(game.tutorLocks.rooms).toBeNull()

    // The weapon; then the means, which must be right before anybody is asked anything.
    hear(game, 'weapon')
    expect(game.tutorLit).toEqual(['onward'])
    game.continueToQuestioning()
    expect(game.tutorDone('weapon')).toBe(true)
    hear(game, 'means')
    expect(game.tutorLocks.questions).toEqual([])
    expect(game.tutorLocks.guests).toBeNull()
    expect(game.tutorLocks.compare).toBe(false)
    expect(game.tutorTask?.text).toMatch(/Set the means mark/)
    game.ask(gossip, { kind: 'alibi' })
    expect(game.notebook.filter((n) => n.claim.kind === 'whereabouts')).toEqual([]) // barred
    game.beginDeduce()
    expect(game.stage).toBe('question') // barred
    game.setSign(gossip, 'means', 'established') // wrong
    game.setSign(murderer, 'means', 'established')
    game.setSign(thief, 'means', 'established')
    expect(game.tutorTask?.text).toMatch(/Not quite/)
    expect(game.tutorTask?.text).toContain(m.cast[gossip].shortName)
    game.setSign(gossip, 'means', 'ruledOut')
    expect(game.tutorDone('means')).toBe(true)

    // The one the weapon clears: where were you, and what is your role.
    hear(game, 'trust')
    expect(game.tutorLocks.guests).toEqual([gossip])
    expect(game.tutorLocks.questions).toEqual(['alibi', 'knowledge'])
    expect(game.tutorLit).toEqual([`guest:${gossip}`, 'q:alibi', 'q:knowledge'])
    game.ask(thief, { kind: 'alibi' })
    game.ask(gossip, { kind: 'seen' })
    expect(game.questionsLeft).toBe(5) // both barred
    game.ask(gossip, { kind: 'alibi' })
    expect(game.tutorLit).toEqual([`guest:${gossip}`, 'q:knowledge'])
    game.ask(gossip, { kind: 'knowledge' })
    expect(game.tutorDone('trust')).toBe(true)
    expect(game.tutorLocks.guests).toBeNull()
    expect(game.tutorLocks.questions).toBeNull()

    // The other two, until something will not sit right.
    hear(game, 'others')
    for (const c of m.cast) if (c.id !== gossip && game.contradictions.length === 0) game.ask(c.id, { kind: 'alibi' })
    expect(game.contradictions.length).toBeGreaterThan(0)
    expect(game.tutorDone('others')).toBe(true)

    // Compare notes: the pair, then put it to whoever is caught.
    hear(game, 'compare')
    expect(game.tutorLit).toContain('compare')
    game.beginDeduce()
    const x = game.contradictions[0]
    for (const id of x.statementIds) game.toggleDeduceSelect(id)
    game.testPair()
    expect(game.lastDeduceResult?.kind).toBe('contradiction')
    expect(game.tutorDone('compare')).toBe(true)
    hear(game, 'confront')
    expect(game.pressable.has(thief)).toBe(true)
    game.resumeQuestions(thief)
    game.press(thief)
    expect(game.caughtLying.has(thief)).toBe(true)
    expect(game.tutorDone('confront')).toBe(true)

    // A thief, not a murderer; then opportunity: against the two who were alone or lied, and ruled out for the one the weapon clears.
    hear(game, 'opportunity')
    expect(game.tutorLines(TUTORIALS['first-case'].steps.find((s) => s.id === 'opportunity')!)[0]).toContain('thief')
    expect(game.tutorLit).toEqual(['sign:opportunity'])
    expect(game.tutorTask?.text).toMatch(/Set the opportunity mark/)
    game.setSign(gossip, 'opportunity', 'established') // wrong: they are ruled out, and so telling the truth
    expect(game.tutorTask?.text).toMatch(/you ruled them out/)
    game.setSign(gossip, 'opportunity', 'ruledOut')
    game.setSign(thief, 'opportunity', 'ruledOut') // wrong: alone, and a liar
    expect(game.tutorTask?.text).toMatch(/Mark opportunity against them/)
    expect(game.tutorTask?.text).toContain(m.cast[thief].shortName)
    game.setSign(thief, 'opportunity', 'established')
    game.setSign(murderer, 'opportunity', 'established')
    expect(game.tutorDone('opportunity')).toBe(true)
    expect(game.tutorSpeaking).toBeNull()
    expect(game.tutorTask).toBeNull()
    expect(game.tutorLocks.accuse).toBe(false)
    expect(game.tutorLocks.rooms).toBeNull()
    game.beginAccuse()
    expect(game.phase).toBe('play') // barred

    // Three marks against one name, and the Accuse button is theirs.
    game.setSign(murderer, 'motive', 'established')
    hear(game, 'accuse')
    expect(game.tutorLocks.accuse).toBe(true)
    // (The button keeps its glow until it is used.)
    expect(game.tutorLit).toEqual(['accuse'])
    expect(game.tutorTask?.step.id).toBe('accuse')

    // Written down with the night, and the night resumes where it was.
    const save = JSON.parse(JSON.stringify(game.exportSave())) as SaveGame
    expect(save.campaign).toBe('first-case')
    expect(save.actions.filter((a) => a.t === 'tutor').length).toBeGreaterThan(10)
    setActivePinia(createPinia())
    const resumed = useGame()
    expect(resumed.restore(save)).toBe(true)
    expect(resumed.campaignId).toBe('first-case')
    expect(resumed.tutorSpeaking).toBeNull()
    expect(resumed.tutorLocks.accuse).toBe(true)
    expect(resumed.tutorDone('confront')).toBe(true)
    expect(resumed.actions.length).toBe(save.actions.length)
    // The accusation closes the last of it.
    resumed.beginAccuse()
    expect(resumed.phase).toBe('accuse')
    expect(resumed.tutorDone('accuse')).toBe(true)
    expect(resumed.tutorTask).toBeNull()
  })

  it('resumes mid-lesson, with the task still up', () => {
    const game = useGame()
    game.startCase(first)
    game.tutorHeard('welcome')
    game.begin()
    game.startInvestigation()
    game.finishTransition()
    game.tutorHeard('hours')
    const save = JSON.parse(JSON.stringify(game.exportSave())) as SaveGame
    setActivePinia(createPinia())
    const resumed = useGame()
    expect(resumed.restore(save)).toBe(true)
    expect(resumed.tutorSpeaking).toBeNull()
    expect(resumed.tutorTask?.step.id).toBe('hours')
    expect(resumed.tutorLocks.rooms).toEqual([resumed.mystery!.caseSheet.sceneRoom])
  })

  it('bars nothing, and says nothing, outside the campaign', () => {
    const game = useGame()
    game.newGame(7)
    expect(game.campaignId).toBeNull()
    expect(game.tutorSpeaking).toBeNull()
    expect(game.tutorTask).toBeNull()
    expect(game.tutorLocks.rooms).toBeNull()
    expect(game.tutorLocks.accuse).toBe(true)
  })

  it('lists the first case, and no case twice', () => {
    expect(CAMPAIGN[0].id).toBe('first-case')
    expect(new Set(CAMPAIGN.map((c) => c.id)).size).toBe(CAMPAIGN.length)
  })
})

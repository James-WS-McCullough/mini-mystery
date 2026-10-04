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
    // (Two questions only, all night: where they were, and who they are; and the pressing.)
    expect(game.tutorLocks.questions).toEqual(['alibi', 'knowledge', 'press'])
    game.ask(murderer, { kind: 'seen' })
    expect(game.questionsLeft).toBe(3) // barred

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

    // A thief, not a murderer; and from here he keeps a word at the foot: the next thing wanted.
    hear(game, 'thief')
    expect(game.tutorLines(TUTORIALS['first-case'].steps.find((s) => s.id === 'thief')!)[0]).toContain('thief')
    expect(game.tutorTask?.text).toContain(m.cast[thief].shortName)
    expect(game.tutorLit).toEqual(['sign:opportunity'])
    game.setSign(thief, 'opportunity', 'ruledOut')
    expect(game.tutorTask?.text).toContain(m.cast[gossip].shortName)
    game.setSign(gossip, 'opportunity', 'ruledOut')
    expect(game.tutorTask?.text).toMatch(/Strike them off/)
    expect(game.tutorLit).toEqual(['strike'])
    game.toggleRuledOut(thief)
    game.toggleRuledOut(gossip)
    // The one left standing, whose motive is in the notebook already.
    hear(game, 'eliminated')
    expect(game.tutorTask?.text).toMatch(/motive already/)
    expect(game.tutorLit).toEqual(['sign:motive'])
    game.setSign(murderer, 'motive', 'established')
    expect(game.tutorTask?.text).toMatch(/Ask them their role/)
    expect(game.tutorLit).toEqual([`guest:${murderer}`, 'q:knowledge'])
    expect(game.tutorLocks.accuse).toBe(false)
    game.beginAccuse()
    expect(game.phase).toBe('play') // barred

    // The hour's questions are spent: the next hour, the room that bears the Gossip out, and the murderer's own story.
    game.strikeHour()
    game.finishTransition()
    expect(game.tutorTask?.text).toMatch(/^Search/)
    expect(game.tutorLit).toEqual([`room:${m.truth.locations[gossip]}`])
    game.search(m.truth.locations[gossip])
    expect(game.foundItems.some((e) => e.fact.kind === 'trace')).toBe(true)
    game.continueToQuestioning()
    game.ask(murderer, { kind: 'knowledge' })
    expect(game.undrawnContradictions).toBeGreaterThan(0)
    expect(game.tutorTask?.text).toMatch(/Compare notes/)
    game.beginDeduce()
    const y = game.contradictions.find((c) => c.implicated.includes(murderer))!
    for (const id of y.statementIds) game.toggleDeduceSelect(id)
    game.testPair()
    expect(game.lastDeduceResult?.kind).toBe('contradiction')
    expect(game.tutorTask?.text).toMatch(/Put it to/)
    expect(game.tutorTask?.text).toContain(m.cast[murderer].shortName)
    expect(game.tutorTask?.text).not.toContain(m.cast[gossip].shortName)
    game.resumeQuestions(murderer)
    game.press(murderer)
    expect(game.tutorTask?.text).toMatch(/will not hold/)
    game.setSign(murderer, 'opportunity', 'established')
    expect(game.tutorDone('thief')).toBe(true)

    // The case made: the Accuse button is theirs.
    hear(game, 'accuse')
    expect(game.tutorLocks.accuse).toBe(true)
    expect(game.tutorLit).toEqual(['accuse'])

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
    expect(resumed.tutorDone('thief')).toBe(true)
    expect(resumed.actions.length).toBe(save.actions.length)

    // The accusation: the weapon is pinned already, and nothing else; name the one left standing and show the other two counts.
    resumed.beginAccuse()
    expect(resumed.phase).toBe('accuse')
    expect(resumed.tutorDone('accuse')).toBe(true)
    const weapon = resumed.mystery!.evidence.find((e) => e.fact.kind === 'weapon')!
    expect(resumed.citedItemIds).toEqual([weapon.id])
    expect(resumed.citedThreadKeys).toEqual([])
    // (Not a word until the household has had its say.)
    expect(resumed.tutorSpeaking).toBeNull()
    resumed.gatheredOut()
    hear(resumed, 'case')
    expect(resumed.tutorLocks.submit).toBe(false)
    expect(resumed.tutorTask?.text).toMatch(/^Name/)
    expect(resumed.tutorLit).toEqual([`name:${murderer}`])
    resumed.accusedId = thief
    resumed.submitAccusation()
    expect(resumed.phase).toBe('accuse') // barred: not the one left standing
    resumed.accusedId = murderer
    expect(resumed.tutorTask?.text).toMatch(/^For motive, pin/)
    expect(resumed.tutorLit).toEqual(['board'])
    resumed.submitAccusation()
    expect(resumed.phase).toBe('accuse') // barred: the board does not show it yet
    const motiveNote = resumed.notebook.find(
      (n) => n.speaker === gossip && n.claim.kind === 'relationship' && n.claim.subject === murderer,
    )!
    resumed.toggleCiteNote(motiveNote.id)
    const thread = resumed.realized.find((t) => t.type === 'contradiction' && t.implicated.includes(murderer))!
    resumed.toggleCiteThread(thread.key)
    expect(resumed.tutorLocks.submit).toBe(true)
    expect(resumed.tutorTask?.text).toMatch(/Point the finger/)
    expect(resumed.tutorLit).toEqual(['submit'])
    resumed.submitAccusation()
    expect(resumed.phase).toBe('reveal')
    // (The right name, with all three counts shown, and the Gossip cleared by her room: a strong case.
    // The Thief stays open to the board until his confession is drawn against the forced lockbox.)
    expect(resumed.verdict?.correct).toBe(true)
    expect(resumed.verdict?.tier).toBe('strong')
    expect(resumed.verdict?.conviction).toBe(3)
    expect(resumed.tutorDone('case')).toBe(true)
  })

  it('says that three marks against one name is the murderer, and to rule the others out first', () => {
    const game = useGame()
    game.startCase(first)
    const m = game.mystery!
    const murderer = m.truth.roles.indexOf('murderer')
    const gossip = m.truth.roles.indexOf('gossip')
    const thief = m.truth.roles.indexOf('thief')
    // (Straight to the Thief's confession, the lesson heard out up to there.)
    for (const step of ['welcome', 'hours', 'weapon', 'means', 'trust', 'others', 'compare', 'confront']) game.tutorHeard(step)
    game.begin()
    game.startInvestigation()
    game.finishTransition()
    game.search(m.caseSheet.sceneRoom)
    game.continueToQuestioning()
    for (const c of m.cast) game.setSign(c.id, 'means', c.id === gossip ? 'ruledOut' : 'established')
    game.ask(gossip, { kind: 'alibi' })
    game.ask(gossip, { kind: 'knowledge' })
    for (const c of m.cast) if (c.id !== gossip) game.ask(c.id, { kind: 'alibi' })
    game.beginDeduce()
    for (const id of game.contradictions[0].statementIds) game.toggleDeduceSelect(id)
    game.testPair()
    game.resumeQuestions(thief)
    game.press(thief)
    game.tutorHeard('thief')
    game.setSign(thief, 'opportunity', 'ruledOut')
    game.setSign(gossip, 'opportunity', 'ruledOut')
    // All three against the murderer before the other two are struck off.
    game.setSign(murderer, 'motive', 'established')
    game.setSign(murderer, 'opportunity', 'established')
    expect(game.tutorSpeaking?.id).toBe('three')
    game.tutorHeard('three')
    expect(game.tutorSpeaking).toBeNull()
    expect(game.tutorLocks.accuse).toBe(false)
    expect(game.tutorTask?.text).toMatch(/Strike them off/)
    game.toggleRuledOut(thief)
    game.toggleRuledOut(gossip)
    // (Their motive is marked already: nothing to say of it.)
    expect(game.tutorSpeaking?.id).toBe('accuse')
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

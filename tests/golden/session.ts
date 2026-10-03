// The golden record of play: a set script of a detective's night, played
// through the store as the page plays it, and everything the page could show
// fingerprinted after every step. A refactor of the store that is meant to
// change nothing must leave every step as it was.
//   Rewrite after a change that is MEANT to alter play:
//   npx tsx scripts/golden.ts

import { createHash } from 'node:crypto'
import { createPinia, setActivePinia } from 'pinia'
import type { PackId } from '../../src/content'
import { useGame, type ScriptId } from '../../src/stores/game'
import type { QuestionKey } from '../../src/engine/types'
import type { PillarState } from '../../src/engine/verdict'
import { renamed } from './rename'

export interface SessionCase {
  script: ScriptId
  seed: number
  small?: boolean
  pack?: PackId
}

export interface SessionPrint extends SessionCase {
  /** What was done, step by step. */
  steps: string[]
  /** A fingerprint of everything on show after each step. */
  prints: string[]
}

export function sessionCases(): SessionCase[] {
  const out: SessionCase[] = []
  const scripts: ScriptId[] = ['simple', 'twist', 'knot', 'web']
  for (const script of scripts) for (const seed of [3, 11, 26, 40]) out.push({ script, seed })
  out.push({ script: 'simple', seed: 5, small: true })
  for (const pack of ['village1926', 'train1926', 'boat1926'] as PackId[]) out.push({ script: 'knot', seed: 7, pack })
  return out
}

const stable = (value: unknown): string => JSON.stringify(renamed(value))
const hash = (value: unknown) => createHash('sha256').update(stable(value)).digest('hex').slice(0, 12)

export function playSession(c: SessionCase): SessionPrint {
  setActivePinia(createPinia())
  const game = useGame()
  const steps: string[] = []
  const prints: string[] = []
  const QUESTIONS: QuestionKey[] = [{ kind: 'role' }, { kind: 'alibi' }, { kind: 'knowledge' }, { kind: 'seen' }, { kind: 'suspect' }]
  const PILLARS: PillarState[] = ['established', 'ruledOut', 'unknown']

  const view = () => {
    const m = game.mystery
    const chars = m ? m.cast.map((g) => g.id) : []
    return {
      phase: game.phase,
      stage: game.stage,
      round: game.round,
      questionsLeft: game.questionsLeft,
      clock: game.clockLabel,
      heading: game.transitionHeading,
      intro: game.introText,
      title: game.caseTitle,
      notebook: game.notebook.map((n) => [n.id, n.speaker, n.text, n.claim]),
      log: game.log,
      opening: game.openingStatements,
      searched: game.searchedRooms,
      searchText: game.lastSearchText,
      searchItems: game.lastSearchItems.map((e) => e.id),
      found: game.foundItemIds,
      lifelines: [game.foundLifelines.map((l) => l.id), game.usedLifelines, game.lifelineReport, game.bonusQuestions, game.beansLeft],
      locked: [game.lockedRoom, game.unlocked, game.triedLocked, game.lockedNotice, game.noteForged, game.handScene],
      threads: game.realized,
      deduce: [game.lastDeduceResult, game.missesLeft, game.undrawnContradictions, game.undrawnLinks],
      pressable: game.pressable,
      caught: game.caughtLying,
      borne: game.borneOut,
      board: game.liveBoard,
      pillars: chars.map((x) => game.livePillars(x)),
      roles: chars.map((x) => game.roleOf(x)),
      states: chars.map((x) => [...QUESTIONS.map((q) => game.questionState(x, q)), game.questionState(x, 'press')]),
      held: chars.map((x) => [game.holdsBack(x), game.keysFor(x)]),
      ruledOut: game.ruledOut,
      gathering: [game.gathering, game.gatheringPending, game.confessions, game.confessionsPending, game.killing],
      accuse: [game.accusedId, game.together, game.citeCount, game.accuseBoard],
      verdict: game.verdict,
      stats: game.phase === 'reveal' ? game.nightStats : null,
      save: game.exportSave(),
    }
  }
  const step = (what: string, act: () => void) => {
    act()
    steps.push(what)
    prints.push(hash(view()))
  }

  step('newGame', () => game.newGame(c.seed, c.script, null, c.pack ?? 'manor1920s', true, c.small ?? false))
  step('begin', () => game.begin())
  step('startInvestigation', () => game.startInvestigation())
  const m = game.mystery!
  const chars = m.cast.map((g) => g.id)
  const rooms = [m.caseSheet.sceneRoom, ...m.evidence.map((e) => e.room)].filter((r, i, all) => all.indexOf(r) === i)
  let wrongTried = false
  for (let hour = 0; hour < m.config.rounds && game.phase === 'play'; hour++) {
    step('finishTransition', () => game.finishTransition())
    // Try the locked door once, if there is one; then search the first room not yet searched.
    if (game.lockedRoom && !game.unlocked && !game.triedLocked) {
      step(`search ${game.lockedRoom} (locked)`, () => game.search(game.lockedRoom!))
    }
    const room = rooms.find((r) => !game.searchedRooms.includes(r) && !game.isLocked(r))
    if (room) step(`search ${room}`, () => game.search(room))
    else step('skipSearch', () => game.skipSearch())
    if (game.canSearchAgain) step('searchAgain', () => game.searchAgain())
    const again = rooms.find((r) => !game.searchedRooms.includes(r) && !game.isLocked(r))
    if (game.stage === 'search' && again) step(`search ${again}`, () => game.search(again))
    // Any help found, used at once: on the first guest, or the first room it may go to.
    for (const line of game.unusedLifelines) {
      if (!game.canUseLifelines) break
      const on = { char: chars.find((x) => x !== game.dead), room: game.pikeRooms[0] }
      step(`lifeline ${line.id}`, () => game.useLifeline(line.id, on))
    }
    step('continueToQuestioning', () => game.continueToQuestioning())
    // Press whoever can be pressed; then go round the house with the questions.
    for (const x of [...game.pressable].sort()) {
      if (game.questionsLeft > 0) step(`press ${x}`, () => game.press(x))
    }
    for (const q of QUESTIONS) {
      for (const x of chars) {
        if (game.questionsLeft <= 0) break
        if (game.questionState(x, q) === 'done' || x === game.dead) continue
        step(`ask ${x} ${q.kind}`, () => game.ask(x, q))
      }
    }
    // Shown what was found, where they would talk of it.
    for (const x of chars) {
      for (const item of game.keysFor(x).slice(0, 1)) {
        if (game.questionsLeft > 0) step(`show ${x} ${item}`, () => game.ask(x, { kind: 'aboutEvidence', item }))
      }
    }
    // Draw the threads there are to draw (a few), and one that is not there.
    step('beginDeduce', () => game.beginDeduce())
    for (const t of [...game.contradictions.slice(0, 2), ...game.links.slice(0, 2)]) {
      const pair = t.evidenceId ? [...t.statementIds, t.evidenceId] : [...t.statementIds]
      step(`testPair ${pair.join('+')}`, () => {
        game.deduceSelection = pair
        game.testPair()
      })
    }
    const notes = game.notebook
    if (!wrongTried && notes.length > 1) {
      wrongTried = true
      const pair = [notes[0].id, notes[notes.length - 1].id]
      step(`testPair ${pair.join('+')} (a guess)`, () => {
        game.deduceSelection = pair
        game.testPair()
      })
    }
    // Write something under a name.
    const who = chars[hour % chars.length]
    step(`sign ${who}`, () => game.setSign(who, 'motive', PILLARS[hour % PILLARS.length]))
    step(`role ${who}`, () => game.setRole(who, hour % 2 === 0 ? 'unknown' : 'witness'))
    if (hour === 1) step(`mark ${who}`, () => game.toggleRuledOut(who))
    step('strikeHour', () => game.strikeHour())
  }
  if (game.phase === 'play' && game.stage === 'transition') step('finishTransition', () => game.finishTransition())
  if (game.phase === 'play') step('beginAccuse', () => game.beginAccuse())
  if (game.gatheringPending) step('gatheredOut', () => game.gatheredOut())
  if (game.confessionsPending) step('hearOut', () => game.hearOut())
  // Accuse whoever the board leaves, citing the first few notes and finds.
  const answer = m.solution?.culprit ?? chars[0]
  for (const note of game.notebook.slice(0, 3)) step(`cite ${note.id}`, () => game.toggleCiteNote(note.id))
  for (const id of game.foundItemIds.slice(0, 1)) step(`cite ${id}`, () => game.toggleCiteItem(id))
  step(`accuse ${answer}`, () => {
    game.accusedId = answer
    if (answer === -3) game.together = [...(m.truth.committee ?? [])]
    game.submitAccusation()
  })
  return { ...c, steps, prints }
}

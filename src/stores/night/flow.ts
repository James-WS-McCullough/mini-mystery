// One part of the night store (see stores/game.ts).

import type { PackId } from '../../content'
import { narrate } from '../../content/narration'
import { BOTH_SCRIPT, CLASSIC_SCRIPT, CONSPIRACY_SCRIPT, FOGGY_SCRIPT, smallScript, WEB_SCRIPT } from '../../engine/deck'
import { generateMystery } from '../../engine/generate'
import { Interrogation } from '../../engine/interrogate'
import { renderAnswer, renderIntro } from '../../engine/render'
import { DEDUCE_MISSES } from './shared'
import type { AfterLog, ScriptId } from './shared'

/** A night begun, the household gathered, and the hours turning. */
export function nightFlow(night: AfterLog) {
  const {
    phase, stage, mystery, interrogation, round, transitionToMidnight, questionsLeft, searchedRooms,
    lastSearchRoom, searchedAgainIn, freeLineId, lastSearchText, lastSearchItemIds, foundItemIds,
    foundLifelineIds, usedLifelines, lastSearchLifelineIds, pikeOrder, lifelineReport, notebook, log,
    openingStatements, activeChar, notebookOpen, verdict, accusedId, together, citedNoteIds, citedItemIds,
    citedThreadKeys, introText, accusationForced, gathering, gatheringPending, confessions,
    confessionsPending, killing, dead, realized, confessedChars, deduceSelection, missesLeft,
    deduceAtMidnight, lastDeduceResult, lastGift, ruledOut, signs, roleMarks, asked, script, packId, pack,
    daily, lifelinesOn, smallOn, actions, questionsAsked, wrongGuesses, tally, seenClaims, realizedKeys, ctx,
    triedLocked, lockedNotice, handScene, pushLog, record, noteClaims, absorbAnswer,
  } = night
  function newGame(
    seed?: number,
    scriptId: ScriptId = 'classic',
    dailyDate: string | null = null,
    setting: PackId = packId.value,
    /** Help hidden about the place (see Lifeline). */
    withLifelines = true,
    /** A small household: four guests, four questions an hour (a trial). */
    small = false,
  ) {
    const s = seed ?? Math.floor(Math.random() * 900_000_000) + 1
    packId.value = setting
    const m = generateMystery({
      seed: s,
      pack: pack.value,
      script: ((s) => (small ? smallScript(s) : s))(
        scriptId === 'foggy'
          ? FOGGY_SCRIPT
          : scriptId === 'conspiracy'
            ? CONSPIRACY_SCRIPT
            : scriptId === 'both'
              ? BOTH_SCRIPT
              : scriptId === 'web'
                ? WEB_SCRIPT
                : CLASSIC_SCRIPT,
      ),
    })
    smallOn.value = small
    if (!withLifelines) m.lifelines = []
    lifelinesOn.value = withLifelines
    script.value = scriptId
    daily.value = dailyDate
    actions.value = []
    ruledOut.value = []
    asked.value = {}
    signs.value = {}
    roleMarks.value = {}
    questionsAsked.value = 0
    wrongGuesses.value = 0
    mystery.value = m
    interrogation.value = new Interrogation(m)
    phase.value = 'intro'
    stage.value = 'transition'
    round.value = 0
    transitionToMidnight.value = false
    questionsLeft.value = m.config.questionsPerRound
    searchedRooms.value = []
    lastSearchRoom.value = null
    searchedAgainIn.value = null
    freeLineId.value = null
    lastSearchText.value = ''
    lastSearchItemIds.value = []
    foundItemIds.value = []
    foundLifelineIds.value = []
    usedLifelines.value = {}
    lastSearchLifelineIds.value = []
    pikeOrder.value = null
    lifelineReport.value = null
    handScene.value = false
    triedLocked.value = false
    lockedNotice.value = null
    notebook.value = []
    log.value = []
    openingStatements.value = []
    activeChar.value = null
    notebookOpen.value = false
    verdict.value = null
    accusedId.value = null
    together.value = []
    citedNoteIds.value = []
    citedItemIds.value = []
    citedThreadKeys.value = []
    accusationForced.value = false
    gathering.value = []
    gatheringPending.value = false
    deduceAtMidnight.value = false
    tally.midnightMisses = false
    confessions.value = []
    confessionsPending.value = false
    tally.confessionsHeard = false
    killing.value = null
    realized.value = []
    confessedChars.value = []
    deduceSelection.value = []
    missesLeft.value = DEDUCE_MISSES
    lastDeduceResult.value = null
    lastGift.value = null
    seenClaims.clear()
    realizedKeys.clear()
    tally.logSeq = 0
    tally.saltSeq = 0
    introText.value = renderIntro({ mystery: m, pack: pack.value })
  }

  /** Intro → the gathering: every guest gives their opening statement. */
  function begin() {
    if (!mystery.value || !interrogation.value || phase.value !== 'intro') return
    record({ t: 'begin' })
    phase.value = 'gather'
    pushLog('narrator', introText.value)
    for (const m of mystery.value.cast) {
      const answer = interrogation.value.ask(m.id, { kind: 'reaction' })
      const text = absorbAnswer(m.id, answer, 'their opening statement', m.id)
      openingStatements.value.push({ char: m.id, text })
    }
  }

  /** The gathering → the first hour (via the 8 o’clock transition). */
  function startInvestigation() {
    if (phase.value !== 'gather') return
    record({ t: 'startInvestigation' })
    phase.value = 'play'
    stage.value = 'transition'
    transitionToMidnight.value = false
  }

  /** The transition screen finished (click or timer). */
  function finishTransition() {
    if (phase.value !== 'play' || stage.value !== 'transition') return
    record({ t: 'finishTransition' })
    if (killing.value) killing.value = { ...killing.value, fresh: false }
    if (transitionToMidnight.value) {
      accusationForced.value = true
      phase.value = 'accuse'
      hearConfessions()
    } else {
      stage.value = 'search'
    }
  }

  /**
   * The household is gathered, and before the detective can name anybody,
   * somebody stands up. After that there is no going back to the questioning.
   */
  function hearConfessions() {
    if (tally.confessionsHeard || !mystery.value || !ctx.value) return
    tally.confessionsHeard = true
    // The household is called together, and each of them has a word to say
    // before the detective does — all but whoever is dead.
    for (const m of mystery.value.cast) {
      if (m.id === dead.value) continue
      let text = renderAnswer(ctx.value, m.id, { claims: [], lineKey: 'gathered' }, `u${tally.saltSeq++}`)
      for (let tries = 0; tries < 6 && gathering.value.some((g) => alike(g.text, text)); tries++) {
        text = renderAnswer(ctx.value, m.id, { claims: [], lineKey: 'gathered' }, `u${tally.saltSeq++}`)
      }
      pushLog('speech', text, m.id, m.id, undefined, 'gathered')
      gathering.value.push({ char: m.id, text })
    }
    gatheringPending.value = true
    mystery.value.policies.forEach((policy, char) => {
      if (!policy.confession) return
      // Two who say the same thing do not say it in the same words.
      let text = renderAnswer(ctx.value!, char, policy.confession, `u${tally.saltSeq++}`)
      for (let tries = 0; tries < 6 && confessions.value.some((c) => alike(c.text, text)); tries++) {
        text = renderAnswer(ctx.value!, char, policy.confession, `u${tally.saltSeq++}`)
      }
      pushLog('action', narrate('standsUp', { name: mystery.value!.cast[char].shortName }), undefined, char)
      pushLog('speech', text, char, char, 'confessed', 'confession')
      noteClaims(char, policy.confession.claims, text, 'before the accusation')
      confessions.value.push({ char, text })
    })
    if (confessions.value.length > 0) {
      accusationForced.value = true
      confessionsPending.value = true
    }
  }
  /** Do two speeches open with the same sentence? */
  function alike(a: string, b: string): boolean {
    const first = (t: string) => t.split(/(?<=[.!?—])\s/)[0]
    return first(a) === first(b)
  }
  function hearOut() {
    confessionsPending.value = false
  }
  function gatheredOut() {
    gatheringPending.value = false
  }

  /** Is it there to be found yet? */
  return {
    newGame, begin, startInvestigation, finishTransition, hearConfessions, alike, hearOut, gatheredOut,
  }
}

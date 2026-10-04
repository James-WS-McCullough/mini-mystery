// One part of the night store (see stores/game.ts).

import { migrateSave } from './migrate'
import { campaignCase } from '../../campaign'
import { DEFAULT_PACK } from '../../content'
import { computed } from 'vue'
import type { AfterAccuse, NightStats, SaveAction, SaveGame } from './shared'

/** The night saved, and played again from its actions. */
export function nightSave(night: AfterAccuse) {
  const {
    phase, mystery, round, searchedRooms, lifelineReport, activeChar, notebookOpen, accusedId, together,
    citedNoteIds, citedItemIds, citedThreadKeys, accusationForced, gatheringPending, confessionsPending,
    killing, realized, deduceSelection, lastDeduceResult, script, rules, packId, daily, lifelinesOn, smallOn,
    campaignId, actions, questionsAsked, wrongGuesses, triedLocked, handScene, record, newGame, begin,
    startInvestigation, finishTransition, search, searchAgain, skipSearch, continueToQuestioning, ask, press,
    useLifeline, beginDeduce, resumeQuestions, testPair, strikeHour, beginAccuse, backToPlay, toggleRuledOut,
    setSign, setRole, startCase, tutorMark,
  } = night
  const nightStats = computed<NightStats>(() => ({
    questionsAsked: questionsAsked.value,
    roomsSearched: searchedRooms.value.length,
    wrongGuesses: wrongGuesses.value,
    threadsDrawn: realized.value.length,
    accusedAtRound: accusationForced.value ? (mystery.value?.config.rounds ?? 4) : round.value,
  }))

  /** The night so far, as something that can be written down and resumed. */
  function exportSave(): SaveGame | null {
    if (!mystery.value || phase.value === 'title' || phase.value === 'reveal') return null
    return {
      v: 1,
      seed: mystery.value.seed,
      script: script.value,
      ...(rules.value ? { rules: rules.value } : {}),
      pack: packId.value,
      daily: daily.value,
      lifelines: lifelinesOn.value,
      small: smallOn.value,
      ...(campaignId.value ? { campaign: campaignId.value } : {}),
      actions: JSON.parse(JSON.stringify(actions.value)) as SaveAction[],
      accusedId: accusedId.value,
      together: [...together.value],
      citedNoteIds: [...citedNoteIds.value],
      citedItemIds: [...citedItemIds.value],
      citedThreadKeys: [...citedThreadKeys.value],
    }
  }

  function replay(a: SaveAction) {
    switch (a.t) {
      case 'begin':
        return begin()
      case 'startInvestigation':
        return startInvestigation()
      case 'finishTransition':
        return finishTransition()
      case 'search':
        return search(a.room)
      case 'tryLocked':
        // (Kept with the night as it was, so the replay counts true.)
        record(a)
        triedLocked.value = true
        return
      case 'skipSearch':
        return skipSearch()
      case 'searchAgain':
        return searchAgain()
      case 'lifeline':
        return useLifeline(a.id, { char: a.char, room: a.room })
      case 'continueToQuestioning':
        return continueToQuestioning()
      case 'ask':
        return ask(a.char, a.q)
      case 'press':
        return press(a.char)
      case 'beginDeduce':
        return beginDeduce()
      case 'resumeQuestions':
        return resumeQuestions()
      case 'testPair':
        deduceSelection.value = [...a.pair]
        return testPair()
      case 'strikeHour':
        return strikeHour()
      case 'beginAccuse':
        return beginAccuse()
      case 'backToPlay':
        return backToPlay()
      case 'mark':
        return toggleRuledOut(a.char)
      case 'sign':
        return setSign(a.char, a.sign, a.to)
      case 'role':
        return setRole(a.char, a.to)
      case 'tutor':
        // (A task's mark may have been put down already by the replay itself: once is enough.)
        return tutorMark(a.step, !!a.done)
    }
  }

  /** Resume a saved night. Returns false (leaving the title up) if it won't replay. */
  function restore(saved: SaveGame): boolean {
    try {
      if (saved.v !== 1) return false
      const save = migrateSave(saved)
      if (!save) return false
      const campaign = campaignCase(save.campaign)
      if (save.campaign && !campaign) return false
      if (campaign) startCase(campaign, save.seed)
      else {
        const evening = save.script === 'custom' ? save.rules : save.script
        if (!evening) return false
        newGame(save.seed, evening, save.daily, save.pack ?? DEFAULT_PACK, save.lifelines ?? true, save.small ?? false)
      }
      for (const a of save.actions) replay(a)
      if (actions.value.length !== save.actions.length) throw new Error('save did not replay')
      if (phase.value === 'accuse') {
        accusedId.value = save.accusedId
        together.value = [...(save.together ?? [])]
        citedNoteIds.value = [...save.citedNoteIds]
        citedItemIds.value = [...save.citedItemIds]
        citedThreadKeys.value = [...save.citedThreadKeys]
      }
      lastDeduceResult.value = null
      lifelineReport.value = null
      handScene.value = false
      // What was said and done before the save was heard and seen then.
      confessionsPending.value = false
      gatheringPending.value = false
      if (killing.value) killing.value = { ...killing.value, fresh: false }
      return true
    } catch {
      phase.value = 'title'
      return false
    }
  }

  function toTitle() {
    phase.value = 'title'
    activeChar.value = null
    notebookOpen.value = false
  }
  return { nightStats, exportSave, replay, restore, toTitle }
}

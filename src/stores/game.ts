import { defineStore } from 'pinia'
import { nightState } from './night/state'
import { nightDerived } from './night/derived'
import { nightLog } from './night/log'
import { nightFlow } from './night/flow'
import { nightSearch } from './night/search'
import { nightQuestions } from './night/questions'
import { nightLifelines } from './night/lifelines'
import { nightDeduce } from './night/deduce'
import { nightHours } from './night/hours'
import { nightAccuse } from './night/accuse'
import { nightTutorial } from './night/tutorial'
import { nightSave } from './night/save'

export * from './night/shared'

/**
 * The night in play: built part by part, each part taking what the ones
 * before it made (see stores/night/). What the page may use is returned below.
 */
export const useGame = defineStore('game', () => {
  const afterState = nightState()
  const afterDerived = { ...afterState, ...nightDerived(afterState) }
  const afterLog = { ...afterDerived, ...nightLog(afterDerived) }
  const afterTutorial = { ...afterLog, ...nightTutorial(afterLog) }
  const afterFlow = { ...afterTutorial, ...nightFlow(afterTutorial) }
  const afterSearch = { ...afterFlow, ...nightSearch(afterFlow) }
  const afterQuestions = { ...afterSearch, ...nightQuestions(afterSearch) }
  const afterLifelines = { ...afterQuestions, ...nightLifelines(afterQuestions) }
  const afterDeduce = { ...afterLifelines, ...nightDeduce(afterLifelines) }
  const afterHours = { ...afterDeduce, ...nightHours(afterDeduce) }
  const afterAccuse = { ...afterHours, ...nightAccuse(afterHours) }
  const afterSave = { ...afterAccuse, ...nightSave(afterAccuse) }
  const {
    ruledOut, toggleRuledOut, signsOf, setSign, roleMarks, gathering, gatheringPending, gatheredOut,
    confessions, confessionsPending, hearOut, killing, dead, claimedRole, roleOf, setRole, questionState,
    keysFor, holdsBack, lastAnswer, borneOut, script, packId, pack, place, daily, actions, nightStats,
    exportSave, restore, toTitle, phase, stage, mystery, round, transitionToMidnight, questionsLeft,
    searchedRooms, lastSearchRoom, lastSearchText, lastSearchItems, canSearchAgain, foundLifelines,
    lifelinesOn, unusedLifelines, bonusQuestions, beansLeft, usedLifelines, lastSearchLifelineIds, pikeOrder,
    pikeRooms, canUseLifelines, lifelineReport, useLifeline, searchedAgainIn, searchAgain, freeLineId,
    foundItemIds, notebook, log, openingStatements, activeChar, notebookOpen, verdict, accusedId, together,
    noteForged, handScene, lockedRoom, unlocked, isLocked, triedLocked, lockedNotice, citedNoteIds,
    citedItemIds, citedThreadKeys, introText, caseTitle, accusationForced, ctx, foundItems, contradictions,
    links, undrawnContradictions, undrawnLinks, pressable, caughtLying, realized, realizedFlags, retracted,
    interrogation, liveBoard, accuseBoard, livePillars, citedPillars, deduceSelection, missesLeft,
    lastDeduceResult, lastGift, clockLabel, isLastRound, citeCap, citeCount, transitionHeading, convoOf,
    hourOf, statementsBy, labelOf, newGame, begin, startInvestigation, finishTransition, search, skipSearch,
    continueToQuestioning, ask, press, beginDeduce, resumeQuestions, deduceAtMidnight, toggleDeduceSelect,
    testPair, strikeHour, beginAccuse, backToPlay, toggleCiteNote, toggleCiteItem, toggleCiteThread,
    submitAccusation, campaignId, campaign, startCase, tutorial, tutorSeen, tutorDone, tutorSpeaking, tutorTask, tutorLit,
    tutorLocks, tutorFill, tutorLines, tutorHeard,
  } = afterSave
  return {
    campaignId,
    campaign,
    startCase,
    tutorial,
    tutorSeen,
    tutorDone,
    tutorSpeaking,
    tutorTask,
    tutorLit,
    tutorLocks,
    tutorFill,
    tutorLines,
    tutorHeard,
    ruledOut,
    toggleRuledOut,
    signsOf,
    setSign,
    roleMarks,
    gathering,
    gatheringPending,
    gatheredOut,
    confessions,
    confessionsPending,
    hearOut,
    killing,
    dead,
    claimedRole,
    roleOf,
    setRole,
    questionState,
    keysFor,
    holdsBack,
    lastAnswer,
    borneOut,
    script,
    packId,
    pack,
    place,
    daily,
    actions,
    nightStats,
    exportSave,
    restore,
    toTitle,
    phase,
    stage,
    mystery,
    round,
    transitionToMidnight,
    questionsLeft,
    searchedRooms,
    lastSearchRoom,
    lastSearchText,
    lastSearchItems,
    canSearchAgain,
    foundLifelines,
    lifelinesOn,
    unusedLifelines,
    bonusQuestions,
    beansLeft,
    usedLifelines,
    lastSearchLifelineIds,
    pikeOrder,
    pikeRooms,
    canUseLifelines,
    lifelineReport,
    useLifeline,
    searchedAgainIn,
    searchAgain,
    freeLineId,
    foundItemIds,
    notebook,
    log,
    openingStatements,
    activeChar,
    notebookOpen,
    verdict,
    accusedId,
    together,
    noteForged,
    handScene,
    lockedRoom,
    unlocked,
    isLocked,
    triedLocked,
    lockedNotice,
    citedNoteIds,
    citedItemIds,
    citedThreadKeys,
    introText,
    caseTitle,
    accusationForced,
    ctx,
    foundItems,
    contradictions,
    links,
    undrawnContradictions,
    undrawnLinks,
    pressable,
    caughtLying,
    realized,
    realizedFlags,
    retracted,
    /** The asking layer itself — for tests, and nothing in the page. */
    interrogation,
    liveBoard,
    accuseBoard,
    livePillars,
    citedPillars,
    deduceSelection,
    missesLeft,
    lastDeduceResult,
    lastGift,
    clockLabel,
    isLastRound,
    citeCap,
    citeCount,
    transitionHeading,
    convoOf,
    hourOf,
    statementsBy,
    labelOf,
    newGame,
    begin,
    startInvestigation,
    finishTransition,
    search,
    skipSearch,
    continueToQuestioning,
    ask,
    press,
    beginDeduce,
    resumeQuestions,
    deduceAtMidnight,
    toggleDeduceSelect,
    testPair,
    strikeHour,
    beginAccuse,
    backToPlay,
    toggleCiteNote,
    toggleCiteItem,
    toggleCiteThread,
    submitAccusation,
  }
})

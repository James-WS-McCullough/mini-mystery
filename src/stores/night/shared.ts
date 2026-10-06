// What the parts of the night store share: its types, and a few constants.

import type { MarkedKind, Script, ScriptId } from '../../engine/deck'
import type { PackId } from '../../content'
import type { Pillar } from '../../content/lifelines'
import type { ContradictionReason, NotedStatement } from '../../engine/contradictions'
import type { LinkReason } from '../../engine/links'
import type { CharId, Claim, ItemId, LifelineKind, QuestionKey, RoleId, RoomId } from '../../engine/types'
import type { Pillars, PillarState } from '../../engine/verdict'
import type { nightState } from './state'
import type { nightDerived } from './derived'
import type { nightLog } from './log'
import type { nightFlow } from './flow'
import type { nightSearch } from './search'
import type { nightQuestions } from './questions'
import type { nightLifelines } from './lifelines'
import type { nightDeduce } from './deduce'
import type { nightHours } from './hours'
import type { nightAccuse } from './accuse'
import type { nightTutorial } from './tutorial'
import type { nightSave } from './save'


export type Phase = 'title' | 'intro' | 'gather' | 'play' | 'accuse' | 'reveal'
/** Sub-stage of an hour while phase === 'play'. */
export type Stage = 'transition' | 'search' | 'searched' | 'question' | 'deduce'

/** A thread the PLAYER has drawn in the deduction menu. */
export interface RealizedThread {
  key: string
  type: 'contradiction' | 'link'
  reason: ContradictionReason | LinkReason
  statementIds: string[]
  evidenceId?: ItemId
  /** Contradictions: who cannot all be honest. */
  implicated: CharId[]
  /** Links: whose account this speaks for. */
  supports: CharId[]
  proven: boolean
  itemLabels: string[]
  round: number
}

export interface DeduceResult {
  ok: boolean
  /** What the pair turned out to be — drives the table's reaction. */
  kind: 'contradiction' | 'link' | 'known' | 'miss'
  text: string
  /** A fresh contradiction: whom it may be put to. */
  implicated?: CharId[]
  /** What to stamp it, where the usual word would mislead. */
  stamp?: string
}

/** How many wrong pairings the detective may try in an hour. */
export const DEDUCE_MISSES = 3

export interface LogEntry {
  id: number
  kind: 'narrator' | 'speech' | 'action' | 'detective'
  speaker?: CharId
  /** Which character's interview this line belongs to. */
  convo?: CharId
  /** The question this line asks or answers, so that it can be read back. */
  about?: string
  text: string
  /**
   * How the speaker visibly took a pressing. Every held line reads the same
   * ('pressed') whatever the engine decided, so posture betrays nothing the
   * words do not; only an outright confession looks different.
   */
  mood?: 'pressed' | 'confessed'
}

export interface NoteEntry extends NotedStatement {
  text: string
  round: number
  /** What surfaced this fact — "asked their whereabouts", "shown the ledger"… */
  source: string
}

export interface OpeningStatement {
  char: CharId
  text: string
}

export type { ScriptId } from '../../engine/deck'

/**
 * A mystery is fully determined by its seed and script, so a night in
 * progress is saved as the list of things the detective did and restored by
 * doing them again.
 */
export type SaveAction =
  | { t: 'begin' }
  | { t: 'startInvestigation' }
  | { t: 'finishTransition' }
  | { t: 'search'; room: RoomId }
  | { t: 'tryLocked' }
  | { t: 'skipSearch' }
  | { t: 'searchAgain' }
  /** A lock opened (or skipped) on something found: the paper comes into hand. */
  | { t: 'unlock'; item: ItemId }
  | { t: 'lifeline'; id: string; char?: CharId; room?: RoomId }
  | { t: 'continueToQuestioning' }
  | { t: 'ask'; char: CharId; q: QuestionKey }
  | { t: 'press'; char: CharId }
  | { t: 'beginDeduce' }
  | { t: 'resumeQuestions' }
  | { t: 'testPair'; pair: string[] }
  | { t: 'strikeHour' }
  | { t: 'beginAccuse' }
  | { t: 'backToPlay' }
  | { t: 'mark'; char: CharId }
  | { t: 'sign'; char: CharId; sign: keyof Pillars; to: PillarState }
  | { t: 'role'; char: CharId; to: RoleMark | null }
  /** One of Sergeant Pike's lessons: a step heard out, or (`done`) its task finished. */
  | { t: 'tutor'; step: string; done?: true }

/** What the detective has written under a name: a role, a kind of murderer, or a plain "???". */
export type RoleMark = RoleId | 'unknown' | `murderer:${MarkedKind}`

/** A lifeline, once used: on whom or where, and in which hour. */
export interface UsedLifeline {
  kind: LifelineKind
  round: number
  char?: CharId
  room?: RoomId
  /** The expert's verdict: the count that clears them, or none. */
  pillar?: Pillar | null
  /** The exhibit the telegram became. */
  itemId?: ItemId
  /** Coffee: the questions in hand before it was drunk. */
  before?: number
  /** The sealed note: what it turned out to say. */
  hint?: NoteHint
}

/** What an anonymous note says: a room to search, or a question to put to somebody. */
export type NoteHint =
  | { kind: 'room'; room: RoomId }
  | { kind: 'ask'; char: CharId; q: 'role' | 'alibi' | 'seen' }
  | { kind: 'none' }

/** What has just come of a lifeline, to be shown: not kept with the night. */
export type LifelineReport =
  | { kind: 'pike'; room: RoomId; itemIds: ItemId[]; lifelineIds: string[] }
  | { kind: 'telegram'; char: CharId; itemId: ItemId }
  | { kind: 'expert'; char: CharId; pillar: Pillar | null; noteIds: string[]; itemIds: ItemId[] }
  | { kind: 'coffee' }
  | { kind: 'note'; hint: NoteHint }

export interface SaveGame {
  v: 1
  seed: number
  script: ScriptId
  /** A Custom evening's script, as the detective set it (the four are known by name). */
  rules?: Script
  /** Which setting: left out on old saves, which were all at the manor. */
  pack?: PackId
  /** ISO date when this is that day's daily case. */
  daily: string | null
  /** Lifelines hidden tonight: left out on saves from before there were any, which have them. */
  lifelines?: boolean
  /** The small household (a trial). */
  small?: boolean
  /** A campaign case, by id: its script, setting and number are the campaign's, and so is its lesson. */
  campaign?: string
  actions: SaveAction[]
  accusedId: CharId | null
  /** Who was named together, where it was "more than one". */
  together?: CharId[]
  citedNoteIds: string[]
  citedItemIds: ItemId[]
  citedThreadKeys: string[]
}

/** Totals for the case file once the night is over. */
export interface NightStats {
  questionsAsked: number
  roomsSearched: number
  wrongGuesses: number
  threadsDrawn: number
  /** 0-based hour in which the accusation was made. */
  accusedAtRound: number
}

/** Contradictions that turn on where somebody was during the hour. */
export const ABOUT_THE_HOUR = new Set([
  'whereabouts-vs-sighting',
  'companion-mismatch',
  'sighting-vs-sighting',
  'sighting-vs-company',
  'room-said-empty',
  'pair-said-apart',
  'pair-said-together',
])


export function claimKey(speaker: CharId, claim: Claim): string {
  return `${speaker}|${JSON.stringify(claim)}`
}


// ---- what each part of the store adds ----
export type AfterState = ReturnType<typeof nightState>
export type AfterDerived = AfterState & ReturnType<typeof nightDerived>
export type AfterLog = AfterDerived & ReturnType<typeof nightLog>
export type AfterTutorial = AfterLog & ReturnType<typeof nightTutorial>
export type AfterFlow = AfterTutorial & ReturnType<typeof nightFlow>
export type AfterSearch = AfterFlow & ReturnType<typeof nightSearch>
export type AfterQuestions = AfterSearch & ReturnType<typeof nightQuestions>
export type AfterLifelines = AfterQuestions & ReturnType<typeof nightLifelines>
export type AfterDeduce = AfterLifelines & ReturnType<typeof nightDeduce>
export type AfterHours = AfterDeduce & ReturnType<typeof nightHours>
export type AfterAccuse = AfterHours & ReturnType<typeof nightAccuse>
export type AfterSave = AfterAccuse & ReturnType<typeof nightSave>

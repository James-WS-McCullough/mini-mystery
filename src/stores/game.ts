import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { DEFAULT_PACK, packOf, type PackId } from '../content'
import { settings } from '../ui/settings'
import {
  findContradictions,
  matchContradiction,
  type Contradiction,
  type ContradictionReason,
  type NotedStatement,
} from '../engine/contradictions'
import { BOTH_SCRIPT, CLASSIC_SCRIPT, CONSPIRACY_SCRIPT, FOGGY_SCRIPT, possibleHelpers } from '../engine/deck'
import { generateMystery } from '../engine/generate'
import { gaveNothing, Interrogation } from '../engine/interrogate'
import { findLinks, matchLink, type Link, type LinkReason } from '../engine/links'
import {
  describeClaim,
  describeEvidence,
  renderAnswer,
  renderIntro,
  caseTitle as caseTitleOf,
  renderPress,
  inRoom,
  renderSearch,
  roomName,
  type RenderCtx,
} from '../engine/render'
import {
  BINDING,
  evaluateCase,
  judgeAccusation,
  pillarsFor,
  truePillars,
  type CaseBoard,
  type CaseMaterial,
  type Pillars, type PillarState,
  type ThreadInfo,
  type Verdict,
} from '../engine/verdict'
import type {
  Answer,
  CharId,
  Claim,
  EvidenceItem,
  ItemId,
  Lifeline,
  LifelineKind,
  Mystery,
  QuestionKey,
  RoleId,
  RoomId,
  Spoken,
} from '../engine/types'
import { INFO_CLAIMS } from '../engine/types'
import { COFFEE_QUESTIONS, type Pillar } from '../content/lifelines'

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

/** The evening as ticked: plain; the Drunk may walk; the murderer may have a friend; or both may. */
export type ScriptId = 'classic' | 'foggy' | 'conspiracy' | 'both'

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
  | { t: 'skipSearch' }
  | { t: 'searchAgain' }
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

/** What the detective has written under a name: a role, or a plain "???". */
export type RoleMark = RoleId | 'unknown'

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
}

/** What has just come of a lifeline, to be shown: not kept with the night. */
export type LifelineReport =
  | { kind: 'pike'; room: RoomId; itemIds: ItemId[]; lifelineIds: string[] }
  | { kind: 'telegram'; char: CharId; itemId: ItemId }
  | { kind: 'expert'; char: CharId; pillar: Pillar | null; noteIds: string[]; itemIds: ItemId[] }
  | { kind: 'coffee' }

export interface SaveGame {
  v: 1
  seed: number
  script: ScriptId
  /** Which setting: left out on old saves, which were all at the manor. */
  pack?: PackId
  /** ISO date when this is that day's daily case. */
  daily: string | null
  /** Lifelines hidden tonight: left out on saves from before there were any, which have them. */
  lifelines?: boolean
  actions: SaveAction[]
  accusedId: CharId | null
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
const ABOUT_THE_HOUR = new Set([
  'whereabouts-vs-sighting',
  'companion-mismatch',
  'sighting-vs-sighting',
  'sighting-vs-company',
])

const CLOCK = ['8 o’clock', '9 o’clock', '10 o’clock', '11 o’clock']

function claimKey(speaker: CharId, claim: Claim): string {
  return `${speaker}|${JSON.stringify(claim)}`
}

export const useGame = defineStore('game', () => {
  const phase = ref<Phase>('title')
  const stage = ref<Stage>('transition')
  const mystery = shallowRef<Mystery | null>(null)
  const interrogation = shallowRef<Interrogation | null>(null)

  const round = ref(0)
  const transitionToMidnight = ref(false)
  const questionsLeft = ref(0)
  const searchedRooms = ref<RoomId[]>([])
  const lastSearchRoom = ref<RoomId | null>(null)
  /** The hour in which a second room was searched, after a first that held nothing. */
  const searchedAgainIn = ref<number | null>(null)
  /** The last answer that gave nothing, and so cost no question: its line in the log. */
  const freeLineId = ref<number | null>(null)
  const lastSearchText = ref('')
  const lastSearchItemIds = ref<ItemId[]>([])
  const foundItemIds = ref<ItemId[]>([])
  /** Lifelines come upon in the rooms, and those used. */
  const foundLifelineIds = ref<string[]>([])
  const usedLifelines = ref<Record<string, UsedLifeline>>({})
  const lastSearchLifelineIds = ref<string[]>([])
  /** Where Sergeant Pike has gone to search, and in which hour he was sent. */
  const pikeOrder = ref<{ room: RoomId; round: number } | null>(null)
  const lifelineReport = shallowRef<LifelineReport | null>(null)
  const notebook = ref<NoteEntry[]>([])
  const log = ref<LogEntry[]>([])
  const openingStatements = ref<OpeningStatement[]>([])
  const activeChar = ref<CharId | null>(null)
  const notebookOpen = ref(false)
  const verdict = ref<Verdict | null>(null)
  const accusedId = ref<CharId | null>(null)
  const citedNoteIds = ref<string[]>([])
  const citedItemIds = ref<ItemId[]>([])
  const citedThreadKeys = ref<string[]>([])
  const introText = ref('')
  /** What the case is called: drawn from the night, and never telling who. */
  const caseTitle = computed(() => (ctx.value ? caseTitleOf(ctx.value) : ''))
  const accusationForced = ref(false)
  /** What each of them said when the household was called together at the last. */
  const gathering = ref<{ char: CharId; text: string }[]>([])
  /** They have been called together, and have yet to be heard. */
  const gatheringPending = ref(false)
  /** Who stood up and owned to it when the household was gathered, and in what words. */
  const confessions = ref<{ char: CharId; text: string }[]>([])
  /** They are still on their feet: the detective has yet to hear them out. */
  const confessionsPending = ref(false)
  let confessionsHeard = false
  /** The second killing, once it has been done: what the hour brought with it. */
  const killing = ref<{ victim: CharId; room: RoomId; fresh: boolean; lastWords: string } | null>(null)
  /** Whoever the murderer has silenced. There is no asking them anything more. */
  const dead = computed<CharId | null>(() => killing.value?.victim ?? null)
  const realized = ref<RealizedThread[]>([])
  const confessedChars = ref<CharId[]>([])
  const deduceSelection = ref<string[]>([])
  const missesLeft = ref(DEDUCE_MISSES)
  /**
   * The notes laid out at midnight, from the accusation: two clues only now
   * seen to disagree may still be pinned as a contradiction. Nobody is left
   * to put it to.
   */
  const deduceAtMidnight = ref(false)
  let midnightMisses = false
  const lastDeduceResult = ref<DeduceResult | null>(null)
  /** The last thing handed to the detective, and by whom. */
  const lastGift = ref<{ from: CharId; item: ItemId } | null>(null)
  /** Guests the DETECTIVE has struck off. The game never does it for them. */
  const ruledOut = ref<CharId[]>([])
  /**
   * Means, motive and opportunity against each guest, as the DETECTIVE has
   * marked them. The game never marks them: what a clue means for somebody is
   * the detective's own judgement, and may be wrong.
   */
  const signs = ref<Record<number, Pillars>>({})
  /**
   * Who the detective takes each guest to be, where that is not simply who
   * they say they are. Theirs to write, and to get wrong.
   */
  const roleMarks = ref<Record<number, RoleMark>>({})
  /** How many times each question has been put to each guest: `<char>|<question>`. */
  const asked = ref<Record<string, number>>({})
  const script = ref<ScriptId>('classic')
  /** Which setting the night is played in. */
  const packId = ref<PackId>(DEFAULT_PACK)
  const pack = computed(() => packOf(packId.value))
  /** The place, in its own words: 'the house', 'the household', 'the plan of the house'. */
  const place = computed(() => pack.value.place)
  const daily = ref<string | null>(null)
  /** Whether tonight hides lifelines: an easier night. */
  const lifelinesOn = ref(true)
  const actions = ref<SaveAction[]>([])
  const questionsAsked = ref(0)
  const wrongGuesses = ref(0)
  let logSeq = 0
  let saltSeq = 0
  const seenClaims = new Set<string>()
  const realizedKeys = new Set<string>()

  const ctx = computed<RenderCtx | null>(() =>
    mystery.value ? { mystery: mystery.value, pack: pack.value, address: settings.address } : null,
  )
  const foundItems = computed<EvidenceItem[]>(
    () => mystery.value?.evidence.filter((e) => foundItemIds.value.includes(e.id)) ?? [],
  )
  const lastSearchItems = computed<EvidenceItem[]>(
    () => mystery.value?.evidence.filter((e) => lastSearchItemIds.value.includes(e.id)) ?? [],
  )
  /** Everything the engine can see in what's been collected. The player is
   *  only told the COUNTS — spotting threads is the deduction game. */
  /**
   * Notes that are known lies: said, and since owned to be false by the one
   * who said them, under pressing. The role, the account of the hour, the
   * standing with the dead man given before; the story told them by the
   * Whisperer; the silence that was paid for.
   */
  const retracted = computed<Set<string>>(() => {
    const out = new Set<string>()
    const owned = notebook.value.filter((n) => n.source === 'under pressing')
    for (const o of owned) {
      for (const n of notebook.value) {
        if (n.speaker !== o.speaker || n.source === 'under pressing') continue
        const c = n.claim
        const w = o.claim
        const replaced =
          (c.kind === 'role' && w.kind === 'role' && c.role !== w.role) ||
          (c.kind === 'whereabouts' && w.kind === 'whereabouts' && JSON.stringify(c) !== JSON.stringify(w)) ||
          (c.kind === 'relationship' && w.kind === 'relationship' && c.subject === w.subject && c.rel !== w.rel) ||
          (c.kind === 'sighting' && w.kind === 'toldBy') ||
          (c.kind === 'silent' && w.kind === 'bribed') ||
          // What they said they knew by a role they have given up.
          (w.kind === 'role' &&
            INFO_CLAIMS.has(c.kind) &&
            c.kind !== 'role' &&
            notebook.value.some(
              (r) => r.speaker === n.speaker && r.source !== 'under pressing' && r.claim.kind === 'role' && r.claim.role !== w.role,
            ))
        if (replaced) out.add(n.id)
      }
    }
    return out
  })
  const contradictions = computed<Contradiction[]>(() =>
    mystery.value
      ? findContradictions(
          notebook.value.filter((n) => !retracted.value.has(n.id)),
          foundItems.value,
          mystery.value.caseSheet,
        )
      : [],
  )
  const links = computed<Link[]>(() =>
    mystery.value
      ? findLinks(notebook.value, foundItems.value, mystery.value.caseSheet, mystery.value.cast)
      : [],
  )
  const undrawnContradictions = computed(
    () => contradictions.value.filter((c) => !realizedKeys.has(contradictionKey(c))).length,
  )
  const undrawnLinks = computed(
    () => links.value.filter((l) => !realizedKeys.has(linkKey(l))).length,
  )

  /**
   * Those whose account of the hour the detective has seen borne out past
   * doubting: by somebody who answers for them, or by the room itself. (Not on
   * a night when alibis may be sworn falsely, or exhibits forged.)
   */
  /**
   * Which of the murderer's friends may be in the house, by what has been
   * found: some of them cannot work without leaving a mark, and there is only
   * ever the one.
   */
  const helpersAbout = computed<RoleId[]>(() =>
    mystery.value
      ? possibleHelpers(
          mystery.value.caseSheet.script,
          foundItems.value.map((e) => e.fact),
          mystery.value.caseSheet.sceneRoom,
        )
      : [],
  )
  /** On a night with a passage: the room it has been found to lead to. */
  const passageNight = computed(() => (mystery.value?.caseSheet.passageRooms?.length ?? 0) > 0)
  const passageFound = computed<RoomId | null>(() => {
    for (const e of foundItems.value) if (e.fact.kind === 'passage') return e.fact.room
    return null
  })
  /**
   * Is being alone in that room an alibi? Not until the passage is found —
   * and then not for the room it leads to.
   */
  function noWayOut(t: RealizedThread): boolean {
    if (!passageNight.value) return true
    return passageFound.value !== null && whereSaid(t.statementIds) !== passageFound.value
  }
  const borneOut = computed<Set<CharId>>(() => {
    const set = new Set<CharId>()
    const helpers = helpersAbout.value
    for (const t of realized.value) {
      if (t.type !== 'link' || !BINDING.has(t.reason)) continue
      if (t.reason === 'alibi-trace' && !noWayOut(t)) continue
      if (t.reason === 'mutual-alibi' && helpers.includes('perjurer')) continue
      if (t.reason === 'alibi-trace' && helpers.includes('forger') && givenOver(t.evidenceId)) continue
      for (const id of t.supports) set.add(id)
    }
    return set
  })
  /**
   * Whom a contradiction stands against. When one of the accounts in it is
   * borne out, it is the other that is broken.
   */
  function standsAgainst(t: RealizedThread): CharId[] {
    if (t.type !== 'contradiction' || !ABOUT_THE_HOUR.has(t.reason)) return t.implicated
    const left = t.implicated.filter((id) => !borneOut.value.has(id))
    return left.length > 0 ? left : t.implicated
  }

  /** Press unlocks only against people caught in a REALISED contradiction. */
  const pressable = computed<Set<CharId>>(() => {
    const set = new Set<CharId>()
    for (const t of realized.value) {
      if (t.type === 'contradiction') for (const id of standsAgainst(t)) set.add(id)
    }
    if (dead.value !== null) set.delete(dead.value)
    return set
  })
  /** Proven liars: realised proven contradictions, or a confession under pressing. */
  const caughtLying = computed<Set<CharId>>(() => {
    const set = new Set<CharId>()
    for (const t of realized.value) {
      if (t.type !== 'contradiction') continue
      const against = standsAgainst(t)
      // Proven outright — or the only one left standing against a borne-out account.
      if (t.proven || (against.length === 1 && t.implicated.length > 1)) {
        for (const id of against) set.add(id)
      }
    }
    for (const c of confessedChars.value) set.add(c)
    return set
  })
  /** Flags for notebook entries involved in realised threads. */
  const realizedFlags = computed(() => {
    const map = new Map<string, 'contradiction' | 'proven' | 'link'>()
    for (const t of realized.value) {
      for (const id of [...t.statementIds, ...(t.evidenceId ? [t.evidenceId] : [])]) {
        const kind = t.type === 'link' ? 'link' : t.proven ? 'proven' : 'contradiction'
        const prev = map.get(id)
        // Contradictions outrank links in the margin notes.
        if (prev === 'proven') continue
        if (prev === 'contradiction' && kind === 'link') continue
        map.set(id, kind)
      }
    }
    return map
  })

  /** Spoken claims bound into realised threads — the player's working case. */
  const realizedSpoken = computed<Spoken[]>(() => {
    const ids = new Set(realized.value.flatMap((t) => t.statementIds))
    return notebook.value
      .filter((n) => ids.has(n.id))
      .map((n) => ({ speaker: n.speaker, claim: n.claim }))
  })
  /** The live board during play: realised threads + evidence in hand. */
  const liveBoard = computed<CaseBoard | null>(() =>
    mystery.value
      ? evaluateCase(
          mystery.value,
          realizedSpoken.value,
          foundItems.value.map((e) => e.fact),
        )
      : null,
  )

  function threadInfoOf(t: RealizedThread): ThreadInfo {
    const exhibit = mystery.value?.evidence.find((e) => e.id === t.evidenceId)
    return {
      type: t.type,
      reason: t.reason,
      implicated: standsAgainst(t),
      supports: t.supports,
      given: exhibit?.heldBy !== undefined,
    }
  }
  /** Means/motive/opportunity per suspect, read off the live (realised) case. */
  const liveMaterial = computed<CaseMaterial>(() => ({
    spoken: realizedSpoken.value,
    evidence: foundItems.value.map((e) => e.fact),
    threads: realized.value.map(threadInfoOf),
  }))
  function livePillars(char: CharId): Pillars | null {
    return mystery.value ? pillarsFor(mystery.value, char, liveMaterial.value) : null
  }
  /** The same trio read off only what's cited (accusation screen). */
  const citedMaterial = computed<CaseMaterial>(() => ({
    spoken: citedCase.value.spoken,
    evidence: citedCase.value.evidence.map((e) => e.fact),
    threads: realized.value
      .filter((t) => citedThreadKeys.value.includes(t.key))
      .map(threadInfoOf),
  }))
  function citedPillars(char: CharId): Pillars | null {
    return mystery.value ? pillarsFor(mystery.value, char, citedMaterial.value) : null
  }

  const clockLabel = computed(() =>
    deduceAtMidnight.value ? 'Midnight' : CLOCK[Math.min(round.value, CLOCK.length - 1)],
  )
  const isLastRound = computed(
    () => !!mystery.value && round.value >= mystery.value.config.rounds - 1,
  )
  const citeCap = computed(() => mystery.value?.config.citeCap ?? 6)
  const citeCount = computed(
    () =>
      citedNoteIds.value.length + citedItemIds.value.length + citedThreadKeys.value.length,
  )

  /** Expand cited units (threads count as one but carry their contents). */
  const citedCase = computed<{ spoken: Spoken[]; evidence: EvidenceItem[] }>(() => {
    const stmtIds = new Set(citedNoteIds.value)
    const itemIds = new Set(citedItemIds.value)
    for (const t of realized.value) {
      if (!citedThreadKeys.value.includes(t.key)) continue
      for (const id of t.statementIds) stmtIds.add(id)
      if (t.evidenceId) itemIds.add(t.evidenceId)
    }
    return {
      spoken: notebook.value
        .filter((n) => stmtIds.has(n.id))
        .map((n) => ({ speaker: n.speaker, claim: n.claim })),
      evidence: foundItems.value.filter((e) => itemIds.has(e.id)),
    }
  })
  /** The board as the put-forward case currently stands (accusation screen). */
  const accuseBoard = computed<CaseBoard | null>(() =>
    mystery.value
      ? evaluateCase(
          mystery.value,
          citedCase.value.spoken,
          citedCase.value.evidence.map((e) => e.fact),
        )
      : null,
  )

  /** Heading + narration for the hour-transition screen. */
  const transitionHeading = computed(() =>
    transitionToMidnight.value ? 'Midnight' : clockLabel.value,
  )
  function convoOf(char: CharId): LogEntry[] {
    return log.value.filter((e) => e.convo === char)
  }

  function hourOf(r: number): string {
    return CLOCK[Math.min(r, CLOCK.length - 1)]
  }

  function statementsBy(char: CharId): number {
    return notebook.value.filter((n) => n.speaker === char).length
  }

  function contradictionKey(c: Contradiction): string {
    return `x|${c.reason}|${[...c.statementIds].sort().join(',')}|${c.evidenceId ?? ''}`
  }
  function linkKey(l: Link): string {
    return `o|${l.reason}|${[...l.statementIds].sort().join(',')}|${l.evidenceId ?? ''}`
  }

  /** Human-readable label for a notebook item (statement or evidence) by id. */
  function labelOf(id: string): string {
    if (!ctx.value) return id
    const entry = notebook.value.find((n) => n.id === id)
    if (entry) {
      return `${mystery.value!.cast[entry.speaker].shortName} — ${describeClaim(ctx.value, entry.speaker, entry.claim)}`
    }
    const item = foundItems.value.find((e) => e.id === id)
    if (item) return `${item.name} — ${describeEvidence(ctx.value, item)}`
    return id
  }

  function pushLog(
    kind: LogEntry['kind'],
    text: string,
    speaker?: CharId,
    convo?: CharId,
    mood?: LogEntry['mood'],
    about?: string,
  ) {
    log.value.push({ id: logSeq++, kind, text, speaker, convo, mood, about })
  }

  function record(action: SaveAction) {
    actions.value.push(action)
  }

  function noteClaims(speaker: CharId, claims: Claim[], text: string, source: string) {
    for (const claim of claims) {
      const key = claimKey(speaker, claim)
      if (seenClaims.has(key)) continue
      seenClaims.add(key)
      notebook.value.push({
        id: `s${notebook.value.length}`,
        speaker,
        claim,
        text,
        round: round.value,
        source,
      })
    }
  }

  function absorbAnswer(
    speaker: CharId,
    answer: Answer,
    source: string,
    convo?: CharId,
    extraSlots: Record<string, string> = {},
    about?: string,
  ): string {
    if (!ctx.value) return ''
    const text = renderAnswer(ctx.value, speaker, answer, `u${saltSeq++}`, extraSlots)
    pushLog('speech', text, speaker, convo, undefined, about)
    noteClaims(speaker, [...answer.claims, ...(answer.also?.claims ?? [])], text, source)
    return text
  }

  function newGame(
    seed?: number,
    scriptId: ScriptId = 'classic',
    dailyDate: string | null = null,
    setting: PackId = packId.value,
    /** Help hidden about the place (see Lifeline). */
    withLifelines = true,
  ) {
    const s = seed ?? Math.floor(Math.random() * 900_000_000) + 1
    packId.value = setting
    const m = generateMystery({
      seed: s,
      pack: pack.value,
      script:
        scriptId === 'foggy'
          ? FOGGY_SCRIPT
          : scriptId === 'conspiracy'
            ? CONSPIRACY_SCRIPT
            : scriptId === 'both'
              ? BOTH_SCRIPT
              : CLASSIC_SCRIPT,
    })
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
    notebook.value = []
    log.value = []
    openingStatements.value = []
    activeChar.value = null
    notebookOpen.value = false
    verdict.value = null
    accusedId.value = null
    citedNoteIds.value = []
    citedItemIds.value = []
    citedThreadKeys.value = []
    accusationForced.value = false
    gathering.value = []
    gatheringPending.value = false
    deduceAtMidnight.value = false
    midnightMisses = false
    confessions.value = []
    confessionsPending.value = false
    confessionsHeard = false
    killing.value = null
    realized.value = []
    confessedChars.value = []
    deduceSelection.value = []
    missesLeft.value = DEDUCE_MISSES
    lastDeduceResult.value = null
    lastGift.value = null
    seenClaims.clear()
    realizedKeys.clear()
    logSeq = 0
    saltSeq = 0
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
    if (confessionsHeard || !mystery.value || !ctx.value) return
    confessionsHeard = true
    // The household is called together, and each of them has a word to say
    // before the detective does — all but whoever is dead.
    for (const m of mystery.value.cast) {
      if (m.id === dead.value) continue
      let text = renderAnswer(ctx.value, m.id, { claims: [], lineKey: 'gathered' }, `u${saltSeq++}`)
      for (let tries = 0; tries < 6 && gathering.value.some((g) => alike(g.text, text)); tries++) {
        text = renderAnswer(ctx.value, m.id, { claims: [], lineKey: 'gathered' }, `u${saltSeq++}`)
      }
      pushLog('speech', text, m.id, m.id, undefined, 'gathered')
      gathering.value.push({ char: m.id, text })
    }
    gatheringPending.value = true
    mystery.value.policies.forEach((policy, char) => {
      if (!policy.confession) return
      // Two who say the same thing do not say it in the same words.
      let text = renderAnswer(ctx.value!, char, policy.confession, `u${saltSeq++}`)
      for (let tries = 0; tries < 6 && confessions.value.some((c) => alike(c.text, text)); tries++) {
        text = renderAnswer(ctx.value!, char, policy.confession, `u${saltSeq++}`)
      }
      pushLog('action', `${mystery.value!.cast[char].shortName} stands, before you can speak.`, undefined, char)
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
  function thereBy(e: EvidenceItem): boolean {
    return (e.from ?? 0) <= round.value
  }

  function search(room: RoomId) {
    if (!ctx.value || !mystery.value) return
    if (stage.value !== 'search' || searchedRooms.value.includes(room)) return
    record({ t: 'search', room })
    searchedRooms.value.push(room)
    // What somebody has taken up is not there to be found; nor what is found already.
    const items = mystery.value.evidence.filter(
      (e) =>
        e.room === room &&
        e.heldBy === undefined &&
        thereBy(e) &&
        !foundItemIds.value.includes(e.id),
    )
    foundItemIds.value.push(...items.map((i) => i.id))
    const lines = lifelinesIn(room)
    foundLifelineIds.value.push(...lines.map((l) => l.id))
    lastSearchLifelineIds.value = lines.map((l) => l.id)
    lastSearchRoom.value = room
    lastSearchItemIds.value = items.map((i) => i.id)
    lastSearchText.value = renderSearch(ctx.value, room, items, `search${saltSeq++}`)
    pushLog('action', `You search ${roomName(ctx.value, room)}. ${lastSearchText.value}`)
    stage.value = 'searched'
  }

  /**
   * A room with nothing in it worth the notebook takes little of the hour:
   * there is time to try one more, once an hour.
   */
  const canSearchAgain = computed(
    () =>
      stage.value === 'searched' &&
      searchedAgainIn.value !== round.value &&
      lastSearchItems.value.every((e) => e.fact.kind === 'flavor') &&
      lastSearchLifelineIds.value.length === 0 &&
      !!ctx.value &&
      ctx.value.pack.rooms.some((r) => !searchedRooms.value.includes(r.id)),
  )
  function searchAgain() {
    if (!canSearchAgain.value) return
    record({ t: 'searchAgain' })
    searchedAgainIn.value = round.value
    stage.value = 'search'
  }

  // ---------- lifelines ----------

  /** Lifelines lying in a room, not yet come upon. */
  function lifelinesIn(room: RoomId): Lifeline[] {
    return (mystery.value?.lifelines ?? []).filter(
      (l) => l.room === room && !foundLifelineIds.value.includes(l.id),
    )
  }
  const foundLifelines = computed<Lifeline[]>(() =>
    (mystery.value?.lifelines ?? []).filter((l) => foundLifelineIds.value.includes(l.id)),
  )
  /** The questions a flask of coffee is good for, in the hour it is drunk. */
  const bonusQuestions = computed(() =>
    Object.values(usedLifelines.value).some((u) => u.kind === 'coffee' && u.round === round.value)
      ? COFFEE_QUESTIONS
      : 0,
  )
  /** The coffee's questions still in hand: they are spent before the hour's own. */
  const beansLeft = computed(() => {
    const cup = Object.values(usedLifelines.value).find((u) => u.kind === 'coffee' && u.round === round.value)
    if (!cup) return 0
    return Math.max(0, Math.min(COFFEE_QUESTIONS, questionsLeft.value - (cup.before ?? 0)))
  })
  /** Lifelines found and not yet used. */
  const unusedLifelines = computed(() => foundLifelines.value.filter((l) => !usedLifelines.value[l.id]))
  /** Rooms Sergeant Pike may be sent to: none yet searched, by you or by him. */
  const pikeRooms = computed<RoomId[]>(() =>
    (ctx.value?.pack.rooms ?? [])
      .map((r) => r.id)
      .filter((r) => !searchedRooms.value.includes(r) && r !== pikeOrder.value?.room),
  )
  const canUseLifelines = computed(
    () => phase.value === 'play' && stage.value !== 'transition' && !!mystery.value,
  )

  /** What the expert would say of a guest: the count that clears them, and what of yours bears it out. */
  function expertView(char: CharId): { pillar: Pillar | null; noteIds: string[]; itemIds: ItemId[] } {
    const m = mystery.value!
    const truly = truePillars(m, char)
    const notes = notebook.value
    const support: Record<Pillar, { noteIds: string[]; itemIds: ItemId[] }> = {
      means: {
        noteIds: [],
        itemIds: foundItems.value.filter((e) => e.fact.kind === 'weapon').map((e) => e.id),
      },
      motive: {
        noteIds: notes.filter((n) => n.claim.kind === 'relationship' && n.claim.subject === char).map((n) => n.id),
        itemIds: foundItems.value
          .filter((e) => e.fact.kind === 'motiveDocument' && e.fact.subject === char)
          .map((e) => e.id),
      },
      opportunity: {
        noteIds: notes
          .filter(
            (n) =>
              (n.claim.kind === 'whereabouts' && (n.speaker === char || n.claim.companions.includes(char))) ||
              ((n.claim.kind === 'sighting' || n.claim.kind === 'earlier') && n.claim.target === char),
          )
          .map((n) => n.id),
        itemIds: [],
      },
    }
    const order: Pillar[] = ['opportunity', 'means', 'motive']
    const clears = order.filter((p) => truly[p] === 'ruledOut')
    if (clears.length === 0) return { pillar: null, noteIds: [], itemIds: [] }
    const weight = (p: Pillar) => support[p].noteIds.length + support[p].itemIds.length
    const pillar = [...clears].sort((a, b) => weight(b) - weight(a))[0]
    return { pillar, ...support[pillar] }
  }

  function useLifeline(id: string, on: { char?: CharId; room?: RoomId } = {}) {
    const m = mystery.value
    if (!m || !ctx.value || !canUseLifelines.value) return
    const line = foundLifelines.value.find((l) => l.id === id)
    if (!line || usedLifelines.value[id]) return
    const used: UsedLifeline = { kind: line.kind, round: round.value }
    if (line.kind === 'coffee') {
      used.before = questionsLeft.value
      questionsLeft.value += COFFEE_QUESTIONS
      pushLog('action', `Strong coffee: ${COFFEE_QUESTIONS} more questions this hour.`)
      lifelineReport.value = { kind: 'coffee' }
    } else if (line.kind === 'pike') {
      if (on.room === undefined || !pikeRooms.value.includes(on.room)) return
      pikeOrder.value = { room: on.room, round: round.value }
      used.room = on.room
      pushLog('action', `Sergeant Pike goes to search ${roomName(ctx.value, on.room)}. He will report when the hour strikes.`)
    } else if (line.kind === 'telegram') {
      if (on.char === undefined || !m.cast[on.char]) return
      const who = m.cast[on.char]
      const item: EvidenceItem = {
        id: `telegram-${on.char}`,
        room: m.caseSheet.sceneRoom,
        name: `a wire from the Yard concerning ${who.shortName}`,
        fact: { kind: 'motiveDocument', subject: on.char, rel: m.truth.relationships[on.char] },
        came: 'wired from the Yard',
      }
      if (!m.evidence.some((e) => e.id === item.id)) m.evidence.push(item)
      foundItemIds.value.push(item.id)
      used.char = on.char
      used.itemId = item.id
      pushLog('action', `A wire from the Yard about ${who.shortName}.`)
      lifelineReport.value = { kind: 'telegram', char: on.char, itemId: item.id }
    } else {
      if (on.char === undefined || !m.cast[on.char]) return
      const view = expertView(on.char)
      used.char = on.char
      used.pillar = view.pillar
      pushLog('action', `You telephone for an expert opinion on ${m.cast[on.char].shortName}.`)
      lifelineReport.value = { kind: 'expert', char: on.char, ...view }
    }
    record({ t: 'lifeline', id, char: on.char, room: on.room })
    usedLifelines.value = { ...usedLifelines.value, [id]: used }
  }

  /** The hour strikes: Sergeant Pike is back from where he was sent. */
  function pikeReturns() {
    const order = pikeOrder.value
    const m = mystery.value
    if (!order || !m || !ctx.value) return
    pikeOrder.value = null
    const items = m.evidence.filter(
      (e) =>
        e.room === order.room &&
        e.heldBy === undefined &&
        (e.from ?? 0) <= order.round &&
        !e.came &&
        !foundItemIds.value.includes(e.id),
    )
    foundItemIds.value.push(...items.map((i) => i.id))
    const lines = lifelinesIn(order.room)
    foundLifelineIds.value.push(...lines.map((l) => l.id))
    if (!searchedRooms.value.includes(order.room)) searchedRooms.value.push(order.room)
    const what = items.filter((i) => i.fact.kind !== 'flavor')
    pushLog(
      'action',
      `Sergeant Pike searched ${roomName(ctx.value, order.room)}${
        what.length ? `, and found ${what.map((i) => i.name).join('; and ')}.` : ', and found nothing of note.'
      }`,
    )
    lifelineReport.value = { kind: 'pike', room: order.room, itemIds: items.map((i) => i.id), lifelineIds: lines.map((l) => l.id) }
  }

  function skipSearch() {
    if (stage.value !== 'search') return
    record({ t: 'skipSearch' })
    stage.value = 'question'
  }

  function continueToQuestioning() {
    if (stage.value !== 'searched') return
    record({ t: 'continueToQuestioning' })
    stage.value = 'question'
  }

  function questionLabel(q: QuestionKey): string {
    switch (q.kind) {
      case 'reaction':
        return '“What do you make of all this?”'
      case 'role':
        return '“And what were you, in all of this?”'
      case 'alibi':
        return '“Where were you during the murder?”'
      case 'knowledge':
        return '“What is your role?”'
      case 'seen':
        return '“What have you seen?”'
      case 'suspect':
        return '“Whom do you suspect?”'
      case 'aboutPerson': {
        const name =
          q.person === 'victim'
            ? pack.value.victim.shortName
            : (mystery.value?.cast[q.person].shortName ?? '')
        return q.person === 'victim' ? `“How did you stand with ${name}?”` : `“Tell me about ${name}.”`
      }
      case 'aboutEvidence': {
        const item = mystery.value?.evidence.find((e) => e.id === q.item)
        return `You produce ${item?.name ?? 'the evidence'}.`
      }
    }
  }

  /** Compact provenance tag for the notebook. */
  function sourceLabel(q: QuestionKey): string {
    switch (q.kind) {
      case 'reaction':
        return 'their opening statement'
      case 'role':
        return 'asked their role'
      case 'alibi':
        return 'asked their whereabouts'
      case 'knowledge':
        return 'asked their role'
      case 'seen':
        return 'asked what they have seen'
      case 'suspect':
        return 'asked their suspicions'
      case 'aboutPerson': {
        const name =
          q.person === 'victim'
            ? pack.value.victim.shortName
            : (mystery.value?.cast[q.person].shortName ?? '')
        return q.person === 'victim' ? `asked how they stood with ${name}` : `asked about ${name}`
      }
      case 'aboutEvidence': {
        const item = mystery.value?.evidence.find((e) => e.id === q.item)
        return `shown ${item?.name ?? 'the evidence'}`
      }
    }
  }

  function ask(char: CharId, q: QuestionKey) {
    if (phase.value !== 'play' || stage.value !== 'question') return
    if (!interrogation.value || questionsLeft.value <= 0) return
    if (char === dead.value) return
    // A quiet guest will say no more for asking: the question is not spent.
    if (questionState(char, q) === 'held') return
    record({ t: 'ask', char, q })
    questionsLeft.value--
    const about = questionKey(q)
    asked.value = { ...asked.value, [`${char}|${about}`]: (asked.value[`${char}|${about}`] ?? 0) + 1 }
    pushLog('detective', questionLabel(q), undefined, char, undefined, about)
    const answer = interrogation.value.ask(char, q)
    const extraSlots: Record<string, string> = {}
    if (q.kind === 'aboutEvidence') {
      const item = mystery.value?.evidence.find((e) => e.id === q.item)
      if (item) extraSlots.item = item.name
    }
    absorbAnswer(char, answer, sourceLabel(q), char, extraSlots, about)
    // A question that got nothing out of them is not charged for.
    if (gaveNothing(answer)) {
      questionsLeft.value++
      freeLineId.value = log.value[log.value.length - 1]?.id ?? null
    } else {
      questionsAsked.value++
      freeLineId.value = null
    }
    for (const id of [...(answer.gives ?? []), ...(answer.also?.gives ?? [])]) {
      if (foundItemIds.value.includes(id)) continue
      const item = mystery.value?.evidence.find((e) => e.id === id)
      if (!item || !ctx.value) continue
      foundItemIds.value.push(id)
      lastGift.value = { from: char, item: id }
      pushLog(
        'action',
        `${mystery.value!.cast[char].shortName} hands you ${item.name} — taken up, they say, ${inRoom(ctx.value, item.room)}.`,
        undefined,
        char,
      )
    }
  }

  function press(char: CharId) {
    if (phase.value !== 'play' || stage.value !== 'question') return
    if (!interrogation.value || !ctx.value || questionsLeft.value <= 0) return
    if (!pressable.value.has(char) || char === dead.value) return
    record({ t: 'press', char })
    questionsLeft.value--
    questionsAsked.value++
    // What is put, and with what, is settled before it is marked as put.
    const label = pressLabel(char)
    const against = pressedWith(char)
    const thread = threadAgainst(char)
    if (thread) asked.value = { ...asked.value, [`${char}|press|${thread.key}`]: 1 }
    pushLog('detective', label, undefined, char, undefined, 'press')
    const outcome = interrogation.value.press(char)
    const text = renderPress(ctx.value, char, outcome, `press${saltSeq++}`, against)
    pushLog(
      'speech',
      text,
      char,
      char,
      outcome.kind === 'confess' ? 'confessed' : 'pressed',
      'press',
    )
    noteClaims(char, outcome.claims, text, 'under pressing')
    if (outcome.kind === 'confess' && !confessedChars.value.includes(char)) {
      confessedChars.value.push(char)
    }
  }

  /**
   * The contradiction to put to them: the latest that has not been put
   * already — or, when every one has, the latest of all.
   */
  function threadAgainst(char: CharId): RealizedThread | undefined {
    const against = [...realized.value]
      .reverse()
      .filter((t) => t.type === 'contradiction' && standsAgainst(t).includes(char))
    return against.find((t) => !asked.value[`${char}|press|${t.key}`]) ?? against[0]
  }
  /** An exhibit or their own words are proof; somebody else's word is an account. */
  function pressedWith(char: CharId): 'account' | 'proof' {
    const t = threadAgainst(char)
    return t && (t.evidenceId !== undefined || t.reason === 'self-contradiction') ? 'proof' : 'account'
  }

  /** How a question is known by, for reading its answer back. */
  function questionKey(q: QuestionKey): string {
    return q.kind === 'aboutPerson'
      ? `aboutPerson:${q.person}`
      : q.kind === 'aboutEvidence'
        ? `aboutEvidence:${q.item}`
        : q.kind
  }
  /**
   * Where a question stands with somebody: not yet put, put and only half
   * answered (they were vague: it is worth asking again), or answered.
   */
  function questionState(char: CharId, q: QuestionKey | 'press'): 'fresh' | 'more' | 'done' | 'held' {
    if (q === 'press') {
      // Every contradiction drawn against them is a fresh thing to put to them.
      const thread = threadAgainst(char)
      return thread && !asked.value[`${char}|press|${thread.key}`] ? 'fresh' : 'done'
    }
    const times = asked.value[`${char}|${questionKey(q)}`] ?? 0
    if (times === 0) return 'fresh'
    const policy = mystery.value?.policies[char]
    if (!policy) return 'done'
    // A quiet guest: nothing more for asking, until shown something of theirs.
    if ((q.kind === 'knowledge' || q.kind === 'role') && interrogation.value?.isQuiet(char)) {
      if (!interrogation.value.isOpen(char)) return 'held'
      return interrogation.value.hasSpoken(char) ? 'done' : 'more'
    }
    const depth =
      q.kind === 'alibi'
        ? policy.alibi.length
        : q.kind === 'knowledge'
          ? policy.knowledge.length
          : q.kind === 'role'
            ? policy.role.length
            : 1
    return times >= depth ? 'done' : 'more'
  }
  /** What was last asked and answered on a question, to be read back for nothing. */
  function lastAnswer(char: CharId, q: QuestionKey | 'press'): { prompt: string; line: LogEntry } | null {
    const key = q === 'press' ? 'press' : questionKey(q)
    const lines = log.value.filter((e) => e.convo === char && e.about === key)
    const line = [...lines].reverse().find((e) => e.kind === 'speech')
    const prompt = [...lines].reverse().find((e) => e.kind === 'detective')
    return line ? { prompt: prompt?.text ?? '', line } : null
  }

  /** A quiet guest, still holding back: shown one of these, they will speak. */
  function keysFor(char: CharId): ItemId[] {
    const inter = interrogation.value
    if (!inter || !inter.isQuiet(char) || inter.isOpen(char)) return []
    return inter.opens(char).filter((id) => foundItemIds.value.includes(id))
  }
  /** Is there something of theirs still to be found that would loosen them? */
  function holdsBack(char: CharId): boolean {
    const inter = interrogation.value
    return !!inter && inter.isQuiet(char) && !inter.isOpen(char)
  }

  /** What is being put to them: the latest contradiction they are caught in. */
  function pressLabel(char: CharId): string {
    const thread = threadAgainst(char)
    if (!thread || thread.itemLabels.length < 2) {
      return 'You lay the contradiction before them, point by point.'
    }
    const [a, b] = thread.itemLabels
    return `You put it to them that these cannot both be true: “${a}” — and “${b}”.`
  }

  /**
   * Lay the notes out side by side. Any time in the hour, as often as wanted
   * — and from the accusation, at midnight, once the household has had its say.
   */
  function beginDeduce() {
    const fromAccuse =
      phase.value === 'accuse' && !gatheringPending.value && !confessionsPending.value
    if (!fromAccuse && (phase.value !== 'play' || stage.value !== 'question')) return
    record({ t: 'beginDeduce' })
    if (fromAccuse) {
      deduceAtMidnight.value = true
      phase.value = 'play'
      // Three wrong pairings at midnight, as in any hour — and not three more each visit.
      if (!midnightMisses) {
        midnightMisses = true
        missesLeft.value = DEDUCE_MISSES
      }
    }
    activeChar.value = null
    notebookOpen.value = false
    deduceSelection.value = []
    lastDeduceResult.value = null
    stage.value = 'deduce'
  }

  /** Gather the notes up again and go back to the household — or to the accusation. */
  function resumeQuestions(sitWith: CharId | null = null) {
    if (phase.value !== 'play' || stage.value !== 'deduce') return
    record({ t: 'resumeQuestions' })
    deduceSelection.value = []
    lastDeduceResult.value = null
    if (deduceAtMidnight.value) {
      deduceAtMidnight.value = false
      stage.value = 'transition'
      phase.value = 'accuse'
      return
    }
    stage.value = 'question'
    activeChar.value = sitWith
  }

  function toggleDeduceSelect(id: string) {
    const list = deduceSelection.value
    if (list.includes(id)) {
      deduceSelection.value = list.filter((x) => x !== id)
    } else {
      deduceSelection.value = [...list, id].slice(-2) // keep the latest two
    }
  }

  function realise(
    type: 'contradiction' | 'link',
    key: string,
    reason: ContradictionReason | LinkReason,
    statementIds: string[],
    evidenceId: ItemId | undefined,
    implicated: CharId[],
    supports: CharId[],
    proven: boolean,
    labels: string[],
  ) {
    realizedKeys.add(key)
    realized.value.push({
      key,
      type,
      reason,
      statementIds: [...statementIds],
      evidenceId,
      implicated: [...implicated],
      supports: [...supports],
      proven,
      itemLabels: labels,
      round: round.value,
    })
  }

  /** The room an account among these notes puts its speaker in. */
  function whereSaid(ids: readonly string[]): RoomId | null {
    for (const id of ids) {
      const claim = notebook.value.find((n) => n.id === id)?.claim
      if (claim?.kind === 'whereabouts') return claim.room
    }
    return null
  }
  function givenOver(id?: ItemId): boolean {
    return mystery.value?.evidence.find((e) => e.id === id)?.heldBy !== undefined
  }

  /** Test the selected pair: a contradiction, a corroboration, or a miss. */
  function testPair() {
    if (deduceSelection.value.length !== 2 || missesLeft.value <= 0) return
    record({ t: 'testPair', pair: [...deduceSelection.value] })
    const labels = deduceSelection.value.map(labelOf)
    const name = (i: CharId) => mystery.value!.cast[i].shortName

    // A known lie laid beside anything: it is settled already.
    const lie = deduceSelection.value.find((id) => retracted.value.has(id))
    if (lie) {
      const who = notebook.value.find((n) => n.id === lie)!.speaker
      lastDeduceResult.value = {
        ok: true,
        kind: 'known',
        text: `One of these is a lie, and ${name(who)} has owned to it already. There is nothing more to draw from it.`,
      }
      deduceSelection.value = []
      return
    }
    const xs = matchContradiction(deduceSelection.value, contradictions.value)
    const freshX = xs.filter((c) => !realizedKeys.has(contradictionKey(c)))
    const os = matchLink(deduceSelection.value, links.value)
    const freshO = os.filter((l) => !realizedKeys.has(linkKey(l)))

    if (freshX.length > 0) {
      for (const c of freshX) {
        realise('contradiction', contradictionKey(c), c.reason, c.statementIds, c.evidenceId, c.implicated, [], c.proven, labels)
      }
      const everyone = [...new Set(freshX.flatMap((c) => c.implicated))]
      const hour = freshX.every((c) => ABOUT_THE_HOUR.has(c.reason))
      const sound = hour ? everyone.filter((id) => borneOut.value.has(id)) : []
      const caught = sound.length < everyone.length ? everyone.filter((id) => !sound.includes(id)) : everyone
      const doubled = freshX.find((c) => c.reason === 'role-overclaimed')
      const doubledRole = doubled
        ? notebook.value.find((n) => n.id === doubled.statementIds[0])?.claim
        : undefined
      lastDeduceResult.value = {
        ok: true,
        kind: 'contradiction',
        implicated: caught,
        text:
          sound.length > 0 && caught.length < everyone.length
            ? `A contradiction — these cannot both be true. But ${sound.map(name).join(' and ')} ${sound.length === 1 ? 'is' : 'are'} borne out already, so it is ${caught.map(name).join(' and ')} who ${caught.length === 1 ? 'is' : 'are'} not telling you the truth. Put it to them.`
          : doubledRole?.kind === 'role'
            ? `A contradiction — nobody shares a role, and ${caught.map(name).join(' and ')} each claim to be ${pack.value.roleNames[doubledRole.role]}. One of them is somebody else, with a reason to hide it. Put it to either of them and see who gives way.`
            : caught.length > 1
            ? `A contradiction — these cannot both be true. Somebody here is not telling you the truth: ${caught.map(name).join(', or ')}. You cannot yet say which. Put it to either of them and see who gives way.`
            : `A contradiction — this cannot be true. ${caught.map(name).join('')} is caught out: put it to them.`,
      }
    } else if (freshO.length > 0) {
      for (const l of freshO) {
        realise('link', linkKey(l), l.reason, l.statementIds, l.evidenceId, [], l.supports, false, labels)
      }
      const supported = [...new Set(freshO.flatMap((l) => l.supports))]
      const mutual = freshO.some((l) => l.reason === 'mutual-alibi')
      const traced = freshO.some((l) => l.reason === 'alibi-trace')
      lastDeduceResult.value = {
        ok: true,
        kind: 'link',
        // Two notes that agree somebody could have done it clear nobody.
        ...(freshO.every((l) => l.reason === 'by-the-passage' || l.reason === 'seen-at-scene')
          ? { stamp: 'Opportunity' }
          : {}),
        text: mutual
          ? helpersAbout.value.includes('perjurer')
            ? `Each puts the other beside them. On another night that would clear them both — but the Perjurer may be in the house, and would swear as much for the murderer. It holds only if something else bears ${supported.map(name).join(' and ')} out.`
            : `Each puts the other beside them — and liars lie alone. You may believe them both: neither ${supported.map(name).join(' nor ')} was at the scene.`
          : traced && freshO.some((l) => givenOver(l.evidenceId)) && helpersAbout.value.includes('forger')
            ? `It fits ${supported.map(name).join(' and ')} — but this was handed to you, not found, and the Forger may be in the house. It bears them out only if whoever gave it to you is what they say.`
          : freshO.some((l) => l.reason === 'seen-at-scene')
            ? 'Both accounts put them at the scene within the hour. That is no alibi: it is opportunity. It may be the murderer — or somebody who left before the murderer came.'
          : freshO.some((l) => l.reason === 'by-the-passage')
            ? 'They were alone in the room the passage leads to. That is no alibi: it is opportunity. They could have gone to the scene through the wall and come back — which is not to say they did.'
          : traced && passageNight.value && passageFound.value === null
            ? `The room bears them out: ${supported.map(name).join(' and ')} was there. But a passage runs from the scene to some room in this house, and until you have found which, to have been alone in a room is not to have stayed in it.`
          : traced && passageNight.value && freshO.some((l) => whereSaid(l.statementIds) === passageFound.value)
            ? `The room bears them out: ${supported.map(name).join(' and ')} was there, alone — and so is the passage to the scene. It clears nobody.`
          : traced
            ? `The room bears them out. ${supported.map(name).join(' and ')} was there alone, as they said — and so not at the scene.`
            : supported.length > 0
            ? `These hold together — a corroboration. It speaks for ${supported.map(name).join(' and ')}, and it may clear them.`
            : 'These hold together — two clues telling the same story about the killer.',
      }
    } else if (xs.length > 0 || os.length > 0) {
      lastDeduceResult.value = {
        ok: true,
        kind: 'known',
        text: 'You have already drawn that thread.',
      }
    } else {
      missesLeft.value--
      wrongGuesses.value++
      lastDeduceResult.value = {
        ok: false,
        kind: 'miss',
        text:
          missesLeft.value > 0
            ? 'You turn the pair over in your mind, but nothing binds them — nor divides them.'
            : 'The threads blur before your eyes. Perhaps when the next hour has struck.',
      }
    }
    deduceSelection.value = []
  }

  /** The hour strikes: on to the next transition (or midnight). */
  function strikeHour() {
    if (!mystery.value || phase.value !== 'play') return
    if (stage.value !== 'deduce' && stage.value !== 'question') return
    record({ t: 'strikeHour' })
    activeChar.value = null
    notebookOpen.value = false
    pikeReturns()
    if (isLastRound.value) {
      transitionToMidnight.value = true
    } else {
      round.value++
      questionsLeft.value = mystery.value.config.questionsPerRound
      missesLeft.value = DEDUCE_MISSES
      secondKilling()
    }
    stage.value = 'transition'
  }

  /** The hour strikes, and somebody is found who will answer no more questions. */
  function secondKilling() {
    const second = mystery.value?.truth.second
    if (!second || !ctx.value || killing.value || round.value !== second.round) return
    // The last thing they said: a door opening, and somebody in it.
    const lastWords = renderAnswer(
      ctx.value,
      second.victim,
      { claims: [], lineKey: 'lastWords' },
      `u${saltSeq++}`,
    )
    killing.value = { victim: second.victim, room: second.room, fresh: true, lastWords }
    // The body is put in front of the detective; the rest is to be looked for.
    for (const e of mystery.value!.evidence) {
      if (e.plain && e.room === second.room && thereBy(e) && !foundItemIds.value.includes(e.id)) {
        foundItemIds.value.push(e.id)
      }
    }
    // The room is a scene now, and may be searched again.
    searchedRooms.value = searchedRooms.value.filter((r) => r !== second.room)
    pushLog(
      'action',
      `${mystery.value!.cast[second.victim].name} is found dead ${inRoom(ctx.value, second.room)}.`,
    )
  }

  function beginAccuse() {
    if (phase.value !== 'play') return
    record({ t: 'beginAccuse' })
    activeChar.value = null
    notebookOpen.value = false
    // Start the case from everything already realised — the player prunes.
    if (citedThreadKeys.value.length === 0 && citedNoteIds.value.length === 0 && citedItemIds.value.length === 0) {
      citedThreadKeys.value = realized.value.slice(0, citeCap.value).map((t) => t.key)
    }
    phase.value = 'accuse'
    hearConfessions()
  }

  function backToPlay() {
    if (phase.value === 'accuse' && !accusationForced.value) {
      record({ t: 'backToPlay' })
      phase.value = 'play'
      if (stage.value === 'transition') stage.value = 'question'
    }
  }

  /** Strike a guest off the list of suspects, or put them back on it. */
  function toggleRuledOut(char: CharId) {
    if (!mystery.value || phase.value === 'title' || phase.value === 'reveal') return
    if (char < 0 || char >= mystery.value.cast.length) return
    record({ t: 'mark', char })
    ruledOut.value = ruledOut.value.includes(char)
      ? ruledOut.value.filter((c) => c !== char)
      : [...ruledOut.value, char]
  }

  const UNMARKED: Pillars = { means: 'unknown', motive: 'unknown', opportunity: 'unknown' }
  /** The detective's own marks against a guest. */
  function signsOf(char: CharId): Pillars {
    return signs.value[char] ?? UNMARKED
  }
  /** Set one of a guest's marks: against them, ruled out, or undecided. */
  function setSign(char: CharId, sign: keyof Pillars, to: PillarState) {
    if (!mystery.value || phase.value === 'title' || phase.value === 'reveal') return
    if (char < 0 || char >= mystery.value.cast.length) return
    const now = signsOf(char)
    if (now[sign] === to) return
    record({ t: 'sign', char, sign, to })
    signs.value = { ...signs.value, [char]: { ...now, [sign]: to } }
  }

  /** The role they have most lately laid claim to, if any. It is only their word. */
  function claimedRole(char: CharId): RoleId | null {
    let role: RoleId | null = null
    // What they owned to under pressing outranks anything said before or since.
    let owned = false
    for (const n of notebook.value) {
      if (n.speaker !== char || n.claim.kind !== 'role') continue
      const pressed = n.source === 'under pressing'
      if (owned && !pressed) continue
      role = n.claim.role
      owned = owned || pressed
    }
    return role
  }
  /**
   * Who they are taken to be: what the detective has written, or else what
   * they say of themselves, or else nothing yet.
   */
  function roleOf(char: CharId): { role: RoleId | null; by: 'detective' | 'them' | null } {
    const mine = roleMarks.value[char]
    if (mine !== undefined) return { role: mine === 'unknown' ? null : mine, by: 'detective' }
    const theirs = claimedRole(char)
    return { role: theirs, by: theirs ? 'them' : null }
  }
  /** Write a role under a name — or, with nothing, go back to taking their word. */
  function setRole(char: CharId, to: RoleMark | null) {
    if (!mystery.value || phase.value === 'title' || phase.value === 'reveal') return
    if (char < 0 || char >= mystery.value.cast.length) return
    if ((roleMarks.value[char] ?? null) === to) return
    record({ t: 'role', char, to })
    const next = { ...roleMarks.value }
    if (to === null) delete next[char]
    else next[char] = to
    roleMarks.value = next
  }

  function toggleCiteNote(id: string) {
    const list = citedNoteIds.value
    if (list.includes(id)) citedNoteIds.value = list.filter((x) => x !== id)
    else if (citeCount.value < citeCap.value) citedNoteIds.value = [...list, id]
  }

  function toggleCiteItem(id: ItemId) {
    const list = citedItemIds.value
    if (list.includes(id)) citedItemIds.value = list.filter((x) => x !== id)
    else if (citeCount.value < citeCap.value) citedItemIds.value = [...list, id]
  }

  function toggleCiteThread(key: string) {
    const list = citedThreadKeys.value
    if (list.includes(key)) citedThreadKeys.value = list.filter((x) => x !== key)
    else if (citeCount.value < citeCap.value) citedThreadKeys.value = [...list, key]
  }

  function submitAccusation() {
    if (!mystery.value || accusedId.value === null) return
    verdict.value = judgeAccusation(mystery.value, {
      accused: accusedId.value,
      citedSpoken: citedCase.value.spoken,
      citedEvidence: citedCase.value.evidence.map((e) => e.fact),
      citedThreads: citedMaterial.value.threads,
      // Who else is cleared is judged on the whole night's work, pinned or not.
      gathered: {
        spoken: realizedSpoken.value,
        evidence: foundItems.value.map((e) => e.fact),
      },
    })
    phase.value = 'reveal'
  }

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
      pack: packId.value,
      daily: daily.value,
      lifelines: lifelinesOn.value,
      actions: JSON.parse(JSON.stringify(actions.value)) as SaveAction[],
      accusedId: accusedId.value,
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
    }
  }

  /** Resume a saved night. Returns false (leaving the title up) if it won't replay. */
  function restore(save: SaveGame): boolean {
    try {
      if (save.v !== 1) return false
      newGame(save.seed, save.script, save.daily, save.pack ?? DEFAULT_PACK, save.lifelines ?? true)
      for (const a of save.actions) replay(a)
      if (actions.value.length !== save.actions.length) throw new Error('save did not replay')
      if (phase.value === 'accuse') {
        accusedId.value = save.accusedId
        citedNoteIds.value = [...save.citedNoteIds]
        citedItemIds.value = [...save.citedItemIds]
        citedThreadKeys.value = [...save.citedThreadKeys]
      }
      lastDeduceResult.value = null
      lifelineReport.value = null
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

  return {
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

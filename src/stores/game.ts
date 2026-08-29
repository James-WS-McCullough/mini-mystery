import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { manor1920s } from '../content/manor1920s'
import {
  findContradictions,
  matchContradiction,
  type Contradiction,
  type ContradictionReason,
  type NotedStatement,
} from '../engine/contradictions'
import { CLASSIC_SCRIPT, FOGGY_SCRIPT } from '../engine/deck'
import { generateMystery } from '../engine/generate'
import { Interrogation } from '../engine/interrogate'
import { findLinks, matchLink, type Link, type LinkReason } from '../engine/links'
import {
  describeClaim,
  describeEvidence,
  renderAnswer,
  renderIntro,
  renderPress,
  renderSearch,
  roomName,
  type RenderCtx,
} from '../engine/render'
import {
  evaluateCase,
  judgeAccusation,
  pillarsFor,
  type CaseBoard,
  type CaseMaterial,
  type Pillars,
  type ThreadInfo,
  type Verdict,
} from '../engine/verdict'
import type {
  Answer,
  CharId,
  Claim,
  EvidenceItem,
  ItemId,
  Mystery,
  QuestionKey,
  RoomId,
  Spoken,
} from '../engine/types'

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
  text: string
}

/** How many wrong pairings the detective may try per deduction session. */
export const DEDUCE_MISSES = 3

export interface LogEntry {
  id: number
  kind: 'narrator' | 'speech' | 'action' | 'detective'
  speaker?: CharId
  /** Which character's interview this line belongs to. */
  convo?: CharId
  text: string
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
  const lastSearchText = ref('')
  const lastSearchItemIds = ref<ItemId[]>([])
  const foundItemIds = ref<ItemId[]>([])
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
  const accusationForced = ref(false)
  const realized = ref<RealizedThread[]>([])
  const confessedChars = ref<CharId[]>([])
  const deduceSelection = ref<string[]>([])
  const missesLeft = ref(DEDUCE_MISSES)
  const lastDeduceResult = ref<DeduceResult | null>(null)
  let logSeq = 0
  let saltSeq = 0
  const seenClaims = new Set<string>()
  const realizedKeys = new Set<string>()

  const ctx = computed<RenderCtx | null>(() =>
    mystery.value ? { mystery: mystery.value, pack: manor1920s } : null,
  )
  const foundItems = computed<EvidenceItem[]>(
    () => mystery.value?.evidence.filter((e) => foundItemIds.value.includes(e.id)) ?? [],
  )
  const lastSearchItems = computed<EvidenceItem[]>(
    () => mystery.value?.evidence.filter((e) => lastSearchItemIds.value.includes(e.id)) ?? [],
  )
  /** Everything the engine can see in what's been collected. The player is
   *  only told the COUNTS — spotting threads is the deduction game. */
  const contradictions = computed<Contradiction[]>(() =>
    mystery.value
      ? findContradictions(notebook.value, foundItems.value, mystery.value.caseSheet)
      : [],
  )
  const links = computed<Link[]>(() =>
    mystery.value ? findLinks(notebook.value, foundItems.value, mystery.value.caseSheet) : [],
  )
  const undrawnContradictions = computed(
    () => contradictions.value.filter((c) => !realizedKeys.has(contradictionKey(c))).length,
  )
  const undrawnLinks = computed(
    () => links.value.filter((l) => !realizedKeys.has(linkKey(l))).length,
  )

  /** Press unlocks only against people caught in a REALISED contradiction. */
  const pressable = computed<Set<CharId>>(() => {
    const set = new Set<CharId>()
    for (const t of realized.value) {
      if (t.type === 'contradiction') for (const id of t.implicated) set.add(id)
    }
    return set
  })
  /** Proven liars: realised proven contradictions, or a confession under pressing. */
  const caughtLying = computed<Set<CharId>>(() => {
    const set = new Set<CharId>()
    for (const t of realized.value) {
      if (t.type === 'contradiction' && t.proven) for (const id of t.implicated) set.add(id)
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
    return { type: t.type, reason: t.reason, implicated: t.implicated, supports: t.supports }
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

  const clockLabel = computed(() => CLOCK[Math.min(round.value, CLOCK.length - 1)])
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
  const transitionText = computed(() => {
    const lines = manor1920s.interludes
    if (lines.length === 0) return ''
    return transitionToMidnight.value
      ? lines[lines.length - 1]
      : lines[Math.min(round.value, lines.length - 2)]
  })

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

  function pushLog(kind: LogEntry['kind'], text: string, speaker?: CharId, convo?: CharId) {
    log.value.push({ id: logSeq++, kind, text, speaker, convo })
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
  ): string {
    if (!ctx.value) return ''
    const text = renderAnswer(ctx.value, speaker, answer, `u${saltSeq++}`, extraSlots)
    pushLog('speech', text, speaker, convo)
    noteClaims(speaker, answer.claims, text, source)
    return text
  }

  function newGame(seed?: number, script: 'classic' | 'foggy' = 'classic') {
    const s = seed ?? Math.floor(Math.random() * 900_000_000) + 1
    const m = generateMystery({
      seed: s,
      pack: manor1920s,
      script: script === 'foggy' ? FOGGY_SCRIPT : CLASSIC_SCRIPT,
    })
    mystery.value = m
    interrogation.value = new Interrogation(m)
    phase.value = 'intro'
    stage.value = 'transition'
    round.value = 0
    transitionToMidnight.value = false
    questionsLeft.value = m.config.questionsPerRound
    searchedRooms.value = []
    lastSearchRoom.value = null
    lastSearchText.value = ''
    lastSearchItemIds.value = []
    foundItemIds.value = []
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
    realized.value = []
    confessedChars.value = []
    deduceSelection.value = []
    missesLeft.value = DEDUCE_MISSES
    lastDeduceResult.value = null
    seenClaims.clear()
    realizedKeys.clear()
    logSeq = 0
    saltSeq = 0
    introText.value = renderIntro({ mystery: m, pack: manor1920s })
  }

  /** Intro → the gathering: every guest gives their opening statement. */
  function begin() {
    if (!mystery.value || !interrogation.value) return
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
    phase.value = 'play'
    stage.value = 'transition'
    transitionToMidnight.value = false
  }

  /** The transition screen finished (click or timer). */
  function finishTransition() {
    if (phase.value !== 'play' || stage.value !== 'transition') return
    if (transitionToMidnight.value) {
      accusationForced.value = true
      phase.value = 'accuse'
    } else {
      stage.value = 'search'
    }
  }

  function search(room: RoomId) {
    if (!ctx.value || !mystery.value) return
    if (stage.value !== 'search' || searchedRooms.value.includes(room)) return
    searchedRooms.value.push(room)
    const items = mystery.value.evidence.filter((e) => e.room === room)
    foundItemIds.value.push(...items.map((i) => i.id))
    lastSearchRoom.value = room
    lastSearchItemIds.value = items.map((i) => i.id)
    lastSearchText.value = renderSearch(ctx.value, room, items, `search${saltSeq++}`)
    pushLog('action', `You search ${roomName(ctx.value, room)}. ${lastSearchText.value}`)
    stage.value = 'searched'
  }

  function skipSearch() {
    if (stage.value === 'search') stage.value = 'question'
  }

  function continueToQuestioning() {
    if (stage.value === 'searched') stage.value = 'question'
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
        return '“What do you know?”'
      case 'suspect':
        return '“Whom do you suspect?”'
      case 'aboutPerson': {
        const name =
          q.person === 'victim'
            ? manor1920s.victim.shortName
            : (mystery.value?.cast[q.person].shortName ?? '')
        return `“Tell me about ${name}.”`
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
        return 'asked what they know'
      case 'suspect':
        return 'asked their suspicions'
      case 'aboutPerson': {
        const name =
          q.person === 'victim'
            ? manor1920s.victim.shortName
            : (mystery.value?.cast[q.person].shortName ?? '')
        return `asked about ${name}`
      }
      case 'aboutEvidence': {
        const item = mystery.value?.evidence.find((e) => e.id === q.item)
        return `shown ${item?.name ?? 'the evidence'}`
      }
    }
  }

  function ask(char: CharId, q: QuestionKey) {
    if (!interrogation.value || questionsLeft.value <= 0) return
    questionsLeft.value--
    pushLog('detective', questionLabel(q), undefined, char)
    const answer = interrogation.value.ask(char, q)
    const extraSlots: Record<string, string> = {}
    if (q.kind === 'aboutEvidence') {
      const item = mystery.value?.evidence.find((e) => e.id === q.item)
      if (item) extraSlots.item = item.name
    }
    absorbAnswer(char, answer, sourceLabel(q), char, extraSlots)
  }

  function press(char: CharId) {
    if (!interrogation.value || !ctx.value || questionsLeft.value <= 0) return
    if (!pressable.value.has(char)) return
    questionsLeft.value--
    pushLog('detective', 'You lay the contradiction before them, point by point.', undefined, char)
    const outcome = interrogation.value.press(char)
    const text = renderPress(ctx.value, char, outcome, `press${saltSeq++}`)
    pushLog('speech', text, char, char)
    noteClaims(char, outcome.claims, text, 'under pressing')
    if (outcome.kind === 'confess' && !confessedChars.value.includes(char)) {
      confessedChars.value.push(char)
    }
  }

  /** End of the hour's questioning: into the deduction menu. */
  function beginDeduce() {
    if (stage.value !== 'question') return
    activeChar.value = null
    notebookOpen.value = false
    deduceSelection.value = []
    missesLeft.value = DEDUCE_MISSES
    lastDeduceResult.value = null
    stage.value = 'deduce'
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

  /** Test the selected pair: a contradiction, a corroboration, or a miss. */
  function testPair() {
    if (deduceSelection.value.length !== 2 || missesLeft.value <= 0) return
    const labels = deduceSelection.value.map(labelOf)
    const name = (i: CharId) => mystery.value!.cast[i].shortName

    const xs = matchContradiction(deduceSelection.value, contradictions.value)
    const freshX = xs.filter((c) => !realizedKeys.has(contradictionKey(c)))
    const os = matchLink(deduceSelection.value, links.value)
    const freshO = os.filter((l) => !realizedKeys.has(linkKey(l)))

    if (freshX.length > 0) {
      for (const c of freshX) {
        realise('contradiction', contradictionKey(c), c.reason, c.statementIds, c.evidenceId, c.implicated, [], c.proven, labels)
      }
      const names = [...new Set(freshX.flatMap((c) => c.implicated))].map(name).join(' and ')
      lastDeduceResult.value = {
        ok: true,
        text: `A contradiction — these cannot both be true. The thread implicates ${names}; you may press it home in the hours that remain.`,
      }
    } else if (freshO.length > 0) {
      for (const l of freshO) {
        realise('link', linkKey(l), l.reason, l.statementIds, l.evidenceId, [], l.supports, false, labels)
      }
      const supported = [...new Set(freshO.flatMap((l) => l.supports))]
      lastDeduceResult.value = {
        ok: true,
        text:
          supported.length > 0
            ? `These hold together — a corroboration. It speaks for ${supported.map(name).join(' and ')}, and it may clear them.`
            : 'These hold together — two clues telling the same story about the killer.',
      }
    } else if (xs.length > 0 || os.length > 0) {
      lastDeduceResult.value = { ok: true, text: 'You have already drawn that thread.' }
    } else {
      missesLeft.value--
      lastDeduceResult.value = {
        ok: false,
        text:
          missesLeft.value > 0
            ? 'You turn the pair over in your mind, but nothing binds them — nor divides them.'
            : 'The threads blur before your eyes. Perhaps after another hour’s questions.',
      }
    }
    deduceSelection.value = []
  }

  /** The hour strikes: on to the next transition (or midnight). */
  function strikeHour() {
    if (!mystery.value) return
    if (isLastRound.value) {
      transitionToMidnight.value = true
    } else {
      round.value++
      questionsLeft.value = mystery.value.config.questionsPerRound
    }
    stage.value = 'transition'
  }

  function beginAccuse() {
    activeChar.value = null
    notebookOpen.value = false
    // Start the case from everything already realised — the player prunes.
    if (citedThreadKeys.value.length === 0 && citedNoteIds.value.length === 0 && citedItemIds.value.length === 0) {
      citedThreadKeys.value = realized.value.slice(0, citeCap.value).map((t) => t.key)
    }
    phase.value = 'accuse'
  }

  function backToPlay() {
    if (phase.value === 'accuse' && !accusationForced.value) {
      phase.value = 'play'
      if (stage.value === 'transition') stage.value = 'question'
    }
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
    })
    phase.value = 'reveal'
  }

  return {
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
    liveBoard,
    accuseBoard,
    livePillars,
    citedPillars,
    deduceSelection,
    missesLeft,
    lastDeduceResult,
    clockLabel,
    isLastRound,
    citeCap,
    citeCount,
    transitionHeading,
    transitionText,
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

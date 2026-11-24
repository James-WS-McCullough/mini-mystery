// The Evening Timeline (playtest): a night of play, kept apart from the main
// game's store and its saves. The detective arrives the following evening;
// every question is about last night. The night runs as the classic one
// does: the case file, then each hour from eight o'clock a search of one room
// on the plan and questions to the household, until midnight and the
// accusation.

import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { manor1920s } from '../content/manor1920s'
import { BUDGET } from '../engine/timeline/bot'
import { findContradictions, pairOf } from '../engine/timeline/contradictions'
import { generateTimeline } from '../engine/timeline/generate'
import { sayAll } from '../engine/timeline/render'
import { whoCould } from '../engine/timeline/solver'
import { SLOTS, type Difficulty, type TClaim, type TContradiction, type TEvidence, type TimelineCase } from '../engine/timeline/types'

/** A statement heard tonight, numbered in the order it was heard. */
export interface Heard {
  id: number
  speaker: number
  claim: TClaim
  /** Given up under pressing. */
  owned?: boolean
}

/** Where the night stands, as the classic one does. */
export type TimelineStage = 'start' | 'intro' | 'transition' | 'search' | 'searched' | 'question' | 'accuse' | 'reveal'

export const useTimeline = defineStore('timeline', () => {
  const pack = manor1920s
  const tc = shallowRef<TimelineCase | null>(null)
  const stage = ref<TimelineStage>('start')
  const heard = ref<Heard[]>([])
  const found = ref<TEvidence[]>([])
  const searched = ref<string[]>([])
  /** The hour of tonight's investigation: 0 is eight o'clock. */
  const hour = ref(0)
  const questionsLeft = ref<number>(BUDGET.questions)
  const asked = ref<Record<number, { evening?: boolean; lastSeen?: boolean; pressed?: boolean }>>({})
  /** Contradictions the detective has pointed out. */
  const realized = ref<string[]>([])
  /** What each guest last said, for the interview. */
  const lastWords = ref<Record<number, string>>({})
  /** A guest giving their statement, on a screen of its own: who, the statements (by id), and their closing words. */
  const telling = shallowRef<{ speaker: number; ids: number[]; line?: string } | null>(null)
  /** The last search: where, and what came of it. */
  const lastSearch = shallowRef<{ room: string; items: TEvidence[] } | null>(null)
  /** The timeline board, pulled out over the stage. */
  const boardOpen = ref(false)
  const accused = ref<number | null>(null)
  /** Midnight has struck: the accusation can no longer be put off. */
  const midnight = ref(false)

  function start(difficulty: Difficulty, seed = Math.floor(Math.random() * 900_000_000) + 1) {
    const dealt = generateTimeline({ seed, pack, difficulty })
    tc.value = dealt
    stage.value = 'intro'
    heard.value = []
    found.value = dealt.evidence.filter((e) => e.plain)
    searched.value = []
    hour.value = 0
    questionsLeft.value = BUDGET.questions
    asked.value = {}
    telling.value = null
    realized.value = []
    lastWords.value = {}
    lastSearch.value = null
    boardOpen.value = false
    accused.value = null
    midnight.value = false
  }

  // ---- the hours ----
  /** The case file read: the first hour strikes. */
  function begin() {
    if (stage.value === 'intro') stage.value = 'transition'
  }
  function finishTransition() {
    if (stage.value === 'transition') stage.value = 'search'
  }
  const isLastHour = computed(() => hour.value >= BUDGET.hours - 1)
  /** The hour strikes: the next one, or midnight and the accusation. */
  function strikeHour() {
    if (stage.value !== 'question' && stage.value !== 'search' && stage.value !== 'searched') return
    boardOpen.value = false
    if (isLastHour.value) {
      midnight.value = true
      stage.value = 'accuse'
      return
    }
    hour.value++
    questionsLeft.value = BUDGET.questions
    lastSearch.value = null
    stage.value = 'transition'
  }

  // ---- searching ----
  function search(room: string) {
    const t = tc.value
    if (!t || stage.value !== 'search' || searched.value.includes(room)) return
    searched.value = [...searched.value, room]
    const items = t.evidence.filter((e) => e.room === room && !e.plain && !found.value.includes(e))
    found.value = [...found.value, ...items]
    lastSearch.value = { room, items }
    stage.value = 'searched'
  }
  function skipSearch() {
    if (stage.value === 'search') stage.value = 'question'
  }
  function toQuestions() {
    if (stage.value === 'searched') stage.value = 'question'
  }

  // ---- questions ----
  function hear(speaker: number, claims: readonly TClaim[], owned = false): number[] {
    let next = heard.value.length
    const added = claims.map((claim) => ({ id: next++, speaker, claim, ...(owned ? { owned } : {}) }))
    heard.value = [...heard.value, ...added]
    return added.map((h) => h.id)
  }
  function mark(c: number, what: 'evening' | 'lastSeen' | 'pressed') {
    asked.value = { ...asked.value, [c]: { ...asked.value[c], [what]: true } }
  }
  const canAsk = computed(() => stage.value === 'question' && questionsLeft.value > 0)

  function ask(c: number, what: 'evening' | 'lastSeen') {
    const t = tc.value
    if (!t || !canAsk.value || asked.value[c]?.[what]) return
    const claims = t.accounts[c][what]
    telling.value = { speaker: c, ids: hear(c, claims) }
    mark(c, what)
    questionsLeft.value--
    lastWords.value = { ...lastWords.value, [c]: sayAll(t, c, claims) }
  }

  /** Every contradiction among what has been heard (the detective must still point one out). */
  const contradictions = computed<TContradiction[]>(() => findContradictions(heard.value))
  /** Those a pointed-out contradiction stands against, and not yet pressed. */
  const pressable = computed(() => {
    const out = new Set<number>()
    for (const c of contradictions.value) if (realized.value.includes(c.key)) c.implicated.forEach((x) => out.add(x))
    for (const [c, a] of Object.entries(asked.value)) if (a.pressed) out.delete(Number(c))
    return out
  })

  function press(c: number) {
    const t = tc.value
    if (!t || !canAsk.value || !pressable.value.has(c)) return
    const given = t.accounts[c].pressed
    telling.value = { speaker: c, ids: given.length > 0 ? hear(c, given, true) : [], line: t.accounts[c].pressLine }
    mark(c, 'pressed')
    questionsLeft.value--
    lastWords.value = { ...lastWords.value, [c]: [t.accounts[c].pressLine, sayAll(t, c, given)].filter(Boolean).join(' ') }
  }

  /** Point out two statements that cannot both be true: the answer, in words. */
  function pair(a: number, b: number): { ok: boolean; text: string } {
    const hit = pairOf(contradictions.value, a, b)
    if (!hit) return { ok: false, text: 'Those two can both be true. Nothing there.' }
    if (!realized.value.includes(hit.key)) realized.value = [...realized.value, hit.key]
    const t = tc.value!
    const names = hit.implicated.map((x) => t.cast[x].shortName).join(' and ')
    return { ok: true, text: `Those cannot both be the whole truth. ${names} can be pressed on it.` }
  }

  /** How many statements each guest has given. */
  const statementsBy = (c: number) => heard.value.filter((h) => h.speaker === c).length

  /**
   * The death window as the clues stand, taking everybody at their word: from
   * the latest sighting of him alive to the earliest sign he was dead.
   */
  const deathWindow = computed(() => {
    let lo = 1
    let hi = SLOTS - 1
    for (const h of heard.value) {
      if (h.claim.kind === 'lastSeen') lo = Math.max(lo, h.claim.slot)
      if (h.claim.kind === 'found') hi = Math.min(hi, h.claim.slot - 1)
    }
    for (const e of found.value) {
      if (e.earliest !== undefined) lo = Math.max(lo, e.earliest)
      if (e.latest !== undefined) hi = Math.min(hi, e.latest)
    }
    return { lo, hi: Math.max(lo, hi) }
  })

  // ---- the end ----
  /** Accusing before midnight: the night ends with it. */
  function toAccuse() {
    if (tc.value && stage.value !== 'reveal') {
      boardOpen.value = false
      stage.value = 'accuse'
    }
  }
  /** Not yet: back to the household, where midnight has not struck. */
  function notYet() {
    if (stage.value === 'accuse' && !midnight.value) stage.value = 'question'
  }
  function accuse(c: number) {
    if (!tc.value) return
    accused.value = c
    stage.value = 'reveal'
  }
  /** At the reveal: who the evidence gathered tonight still allowed (for the verdict's words). */
  const stillPossible = computed(() => {
    const t = tc.value
    if (!t) return []
    return [...whoCould({ n: t.cast.length, scene: t.scene, secretive: t.secretive, heard: heard.value, evidence: found.value }).keys()]
  })

  function leave() {
    tc.value = null
    stage.value = 'start'
    telling.value = null
    boardOpen.value = false
  }

  return {
    pack, tc, stage, heard, found, searched, hour, questionsLeft, asked, realized, lastWords, telling, lastSearch,
    boardOpen, accused, midnight, isLastHour, canAsk, contradictions, pressable, deathWindow, stillPossible, statementsBy,
    start, begin, finishTransition, strikeHour, search, skipSearch, toQuestions, ask, press, pair, toAccuse, notYet, accuse, leave,
  }
})

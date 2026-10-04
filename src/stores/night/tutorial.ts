// One part of the night store (see stores/game.ts).

import { computed, watch } from 'vue'
import { OPEN, TUTORIALS, campaignCase, type Tutorial, type TutorLocks, type TutorStep, type TutorView } from '../../campaign'
import type { Asked } from '../../campaign/tutorial'
import type { CharId } from '../../engine/types'
import type { Pillars } from '../../engine/verdict'
import type { AfterLog } from './shared'

const UNMARKED: Pillars = { means: 'unknown', motive: 'unknown', opportunity: 'unknown' }

/**
 * Sergeant Pike's lesson, where tonight's campaign case has one: what he has
 * to say, what glows, and what is barred. Comes before the parts that act, so
 * that each of them can ask what it may do (see tutorLocks).
 */
export function nightTutorial(night: AfterLog) {
  const {
    phase, stage, round, mystery, pack, searchedRooms, foundItemIds, activeChar, questionsLeft, asked,
    confessedChars, contradictions, realized, campaignId, tutorMarks, signs, record,
  } = night

  const tutorial = computed<Tutorial | null>(() => {
    const c = campaignCase(campaignId.value)
    return c?.tutorial ? TUTORIALS[c.tutorial] : null
  })
  const stepOf = (id: string): TutorStep | undefined => tutorial.value?.steps.find((s) => s.id === id)
  /** Has the step been heard out? */
  const tutorSeen = (id: string) => tutorMarks.value.includes(id)
  /** Has the step been heard, and whatever it asked been done? */
  const tutorDone = (id: string) =>
    tutorMarks.value.includes(`${id}:done`) || (tutorSeen(id) && !stepOf(id)?.task)

  /** Has a question been put to a guest (or the pressing)? */
  function wasAsked(c: CharId, q: Asked): boolean {
    const head = `${c}|${q}`
    return Object.entries(asked.value).some(([k, n]) => n > 0 && (k === head || k.startsWith(`${head}|`) || k.startsWith(`${head}:`)))
  }

  /** The night, as the lesson reads it. */
  const tutorView = computed<TutorView | null>(() => {
    const m = mystery.value
    if (!m || !tutorial.value) return null
    return {
      phase: phase.value,
      stage: stage.value,
      round: round.value,
      mystery: m,
      pack: pack.value,
      cast: m.cast,
      searched: searchedRooms.value,
      found: foundItemIds.value,
      activeChar: activeChar.value,
      questionsLeft: questionsLeft.value,
      signsOf: (c: CharId) => signs.value[c] ?? UNMARKED,
      asked: wasAsked,
      confessed: confessedChars.value,
      contradictions: contradictions.value.length,
      drawn: realized.value.filter((t) => t.type === 'contradiction').length,
      seen: tutorSeen,
      done: tutorDone,
    }
  })

  /** The step whose time has come, not yet heard: Pike speaks. */
  const tutorSpeaking = computed<TutorStep | null>(() => {
    const t = tutorial.value
    const v = tutorView.value
    if (!t || !v) return null
    return t.steps.find((s) => !tutorSeen(s.id) && s.when(v)) ?? null
  })
  /** The task kept up: the latest step heard whose task is not yet done. */
  const tutorTask = computed<{ step: TutorStep; text: string } | null>(() => {
    const t = tutorial.value
    const v = tutorView.value
    if (!t || !v) return null
    const live = t.steps.filter((s) => s.task && tutorSeen(s.id) && !tutorDone(s.id))
    const step = live[live.length - 1]
    return step ? { step, text: tutorFill(step.task!(v)) } : null
  })
  /** What glows on the page: for the step being spoken, or else the task kept up. */
  const tutorLit = computed<string[]>(() => {
    const v = tutorView.value
    const step = tutorSpeaking.value ?? tutorTask.value?.step
    return v && step?.lit ? step.lit(v) : []
  })
  /** What the detective may do tonight: everything, outside a lesson. */
  const tutorLocks = computed<TutorLocks>(() =>
    tutorial.value && tutorView.value ? tutorial.value.locks(tutorView.value) : OPEN,
  )

  /** The lesson's own slots filled in; {sir} is left for the page, which knows the form of address. */
  function tutorFill(text: string): string {
    const t = tutorial.value
    const v = tutorView.value
    if (!t || !v) return text
    const slots = t.slots(v)
    return text.replace(/\{(\w+)\}/g, (m, k: string) => slots[k] ?? m)
  }
  /** What Pike says at a step, line by line. */
  function tutorLines(step: TutorStep): string[] {
    const v = tutorView.value
    return v ? step.lines(v).map(tutorFill) : []
  }

  /** Put a mark down, once: a step heard, or its task done. */
  function tutorMark(step: string, done = false) {
    const mark = done ? `${step}:done` : step
    if (tutorMarks.value.includes(mark)) return
    record(done ? { t: 'tutor', step, done: true } : { t: 'tutor', step })
    tutorMarks.value = [...tutorMarks.value, mark]
  }
  /** The detective has heard the step out. */
  function tutorHeard(step: string) {
    if (!tutorial.value || !stepOf(step)) return
    tutorMark(step)
  }
  // A task is done the moment what it asked for has been: written down with
  // the night at once, so that the save replays in the same order.
  watch(
    () => {
      const t = tutorial.value
      const v = tutorView.value
      if (!t || !v) return [] as string[]
      return t.steps.filter((s) => s.task && tutorSeen(s.id) && !tutorDone(s.id) && s.until?.(v)).map((s) => s.id)
    },
    (ids) => ids.forEach((id) => tutorMark(id, true)),
    { flush: 'sync' },
  )

  return {
    tutorial, tutorSeen, tutorDone, tutorView, tutorSpeaking, tutorTask, tutorLit, tutorLocks, tutorFill,
    tutorLines, tutorMark, tutorHeard,
  }
}

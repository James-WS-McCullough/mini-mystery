// One part of the night store (see stores/game.ts): the Evening Timeline
// variant, where there is one. On a night dealt with an evening (see
// engine/evening), "Where were you?" is "What happened last night?": a whole
// account, hour by hour, told on a screen of its own. What each guest says of
// the hour it was done is held back from the notes until the detective can
// say which hour that was; then it goes in, as the alibis of any other night,
// and the rest of the night is played as ever.

import { computed, ref, shallowRef } from 'vue'
import { narrate } from '../../content/narration'
import { deathWindow, sayEvening } from '../../engine/evening/render'
import type { EHeard } from '../../engine/evening/types'
import type { Answer, CharId, QuestionKey } from '../../engine/types'
import type { AfterHours } from './shared'

export function nightEvening(night: AfterHours) {
  const {
    phase, stage, mystery, interrogation, questionsLeft, questionsAsked, asked, foundItems, freeLineId, ctx, dead,
    record, pushLog, absorbAnswer, newGame, startCase, ask, search, searchAgain, useLifeline, finishTransition,
    questionState,
  } = night
  const evening = computed(() => mystery.value?.evening ?? null)
  /** Every account of the evening heard so far, in the order heard. */
  const eveningHeard = ref<EHeard[]>([])
  /** A guest telling their evening, on the screen for it: who, and which of the heard (by id). */
  const telling = shallowRef<{ speaker: CharId; ids: number[] } | null>(null)
  /** The timeline, pulled out over the page. */
  const boardOpen = ref(false)
  /** What each has said of the hour it was done, held back until that hour is known. */
  const held = ref<{ char: CharId; answer: Answer; source: string; about: string }[]>([])
  /** The hour as the clues stand. */
  const deathHours = computed(() => (evening.value ? deathWindow(evening.value, eveningHeard.value, foundItems.value) : null))
  /** The clues say which hour it was: what was said of it is in the notes. */
  const hourKnown = ref(false)

  function reset() {
    eveningHeard.value = []
    telling.value = null
    boardOpen.value = false
    held.value = []
    hourKnown.value = false
  }

  /** Once the clues settle the hour, what everybody said of it goes into the notes. */
  function settleHour() {
    const ev = evening.value
    const w = deathHours.value
    if (!ev || !w || hourKnown.value || w.lo !== w.hi) return
    hourKnown.value = true
    pushLog('action', narrate('evening.hourKnown', { from: ev.words[w.lo], to: ev.words[w.lo + 1] }))
    for (const h of held.value) absorbAnswer(h.char, h.answer, h.source, h.char, {}, h.about)
    held.value = []
  }

  function askEvening(char: CharId) {
    const ev = evening.value
    const inter = interrogation.value
    if (!ev || !inter || !ctx.value || phase.value !== 'play' || stage.value !== 'question') return
    if (char === dead.value) return
    if (questionsLeft.value <= 0 && !(asked.value[`${char}|alibi`] ?? 0)) return
    const q: QuestionKey = { kind: 'alibi' }
    if (questionState(char, q) === 'held') return
    const key = `${char}|alibi`
    // Heard already: they tell it again, and it costs nothing.
    const again = (asked.value[key] ?? 0) > 0
    record({ t: 'ask', char, q })
    if (!again) {
      questionsLeft.value--
      questionsAsked.value++
    }
    freeLineId.value = null
    asked.value = { ...asked.value, [key]: (asked.value[key] ?? 0) + 1 }
    pushLog('detective', narrate('ask.evening'), undefined, char, undefined, 'alibi')
    const claims = ev.told[char]
    let next = eveningHeard.value.length
    const added = again ? [] : claims.map((claim) => ({ id: next++, speaker: char, claim }))
    eveningHeard.value = [...eveningHeard.value, ...added]
    const text = claims.map((c) => sayEvening(ctx.value!, char, c)).join(' ')
    pushLog('speech', text, char, char, undefined, 'alibi')
    telling.value = { speaker: char, ids: again ? eveningHeard.value.filter((h) => h.speaker === char).map((h) => h.id) : added.map((h) => h.id) }
    if (!again) {
      // What they say of the hour itself: their alibi, as any night has it — the
      // fullest of what they would say, however often they had to be asked.
      const depth = mystery.value!.policies[char].alibi.length
      let answer = inter.ask(char, q)
      for (let i = 1; i < depth; i++) answer = inter.ask(char, q)
      held.value = [...held.value, { char, answer, source: narrate('source.alibi'), about: 'alibi' }]
    }
    settleHour()
  }

  return {
    evening, eveningHeard, telling, boardOpen, deathHours, hourKnown,
    newGame(...args: Parameters<typeof newGame>) {
      reset()
      return newGame(...args)
    },
    startCase(...args: Parameters<typeof startCase>) {
      reset()
      return startCase(...args)
    },
    ask(char: CharId, q: QuestionKey) {
      if (evening.value && q.kind === 'alibi') return askEvening(char)
      ask(char, q)
      settleHour()
    },
    search(...args: Parameters<typeof search>) {
      search(...args)
      settleHour()
    },
    searchAgain(...args: Parameters<typeof searchAgain>) {
      searchAgain(...args)
      settleHour()
    },
    useLifeline(...args: Parameters<typeof useLifeline>) {
      useLifeline(...args)
      settleHour()
    },
    finishTransition(...args: Parameters<typeof finishTransition>) {
      finishTransition(...args)
      settleHour()
    },
  }
}

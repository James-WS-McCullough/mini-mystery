// One part of the night store (see stores/game.ts).

import { narrate } from '../../content/narration'
import { gaveNothing } from '../../engine/interrogate'
import { inRoom, renderPress } from '../../engine/render'
import type { CharId, ItemId, QuestionKey } from '../../engine/types'
import type { AfterSearch, LogEntry, RealizedThread } from './shared'

/** Asking, and pressing. */
export function nightQuestions(night: AfterSearch) {
  const {
    phase, stage, mystery, interrogation, questionsLeft, freeLineId, foundItemIds, log, dead, realized,
    confessedChars, lastGift, asked, pack, questionsAsked, tally, ctx, standsAgainst, pressable, tutorLocks,
    pushLog, record, noteClaims, absorbAnswer,
  } = night
  /** Whether Sergeant Pike, where he is teaching, would have this put to this guest. */
  function tutorAllows(char: CharId, q: QuestionKey['kind'] | 'press'): boolean {
    const locks = tutorLocks.value
    return (!locks.guests || locks.guests.includes(char)) && (!locks.questions || locks.questions.includes(q))
  }
  function skipSearch() {
    if (stage.value !== 'search' || !tutorLocks.value.skipSearch) return
    record({ t: 'skipSearch' })
    stage.value = 'question'
  }

  function continueToQuestioning() {
    if (stage.value !== 'searched') return
    record({ t: 'continueToQuestioning' })
    stage.value = 'question'
  }

  function questionLabel(q: QuestionKey): string {
    return labelFor('ask', q)
  }

  /** Compact provenance tag for the notebook. */
  function sourceLabel(q: QuestionKey): string {
    return labelFor('source', q)
  }

  /** A question as it is put ('ask'), or as the notebook files it ('source'). */
  function labelFor(as: 'ask' | 'source', q: QuestionKey): string {
    switch (q.kind) {
      case 'aboutPerson': {
        const name =
          q.person === 'victim'
            ? pack.value.victim.shortName
            : (mystery.value?.cast[q.person].shortName ?? '')
        return narrate(q.person === 'victim' ? `${as}.victim` : `${as}.person`, { name })
      }
      case 'aboutEvidence': {
        const item = mystery.value?.evidence.find((e) => e.id === q.item)
        return narrate(`${as}.evidence`, { item: item?.name ?? narrate('theEvidence') })
      }
      default:
        return narrate(`${as}.${q.kind}`)
    }
  }

  function ask(char: CharId, q: QuestionKey) {
    if (phase.value !== 'play' || stage.value !== 'question') return
    if (!interrogation.value || questionsLeft.value <= 0) return
    if (char === dead.value || !tutorAllows(char, q.kind)) return
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
        narrate('handedOver', { name: mystery.value!.cast[char].shortName, item: item.name, inRoom: inRoom(ctx.value, item.room) }),
        undefined,
        char,
      )
    }
  }

  function press(char: CharId) {
    if (phase.value !== 'play' || stage.value !== 'question') return
    if (!interrogation.value || !ctx.value || questionsLeft.value <= 0) return
    if (!pressable.value.has(char) || char === dead.value || !tutorAllows(char, 'press')) return
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
    const text = renderPress(ctx.value, char, outcome, `press${tally.saltSeq++}`, against)
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
      return narrate('press')
    }
    const [a, b] = thread.itemLabels
    return narrate('pressPair', { a, b })
  }
  return {
    tutorAllows, skipSearch, continueToQuestioning, questionLabel, sourceLabel, labelFor, ask, press, threadAgainst,
    pressedWith, questionKey, questionState, lastAnswer, keysFor, holdsBack, pressLabel,
  }
}

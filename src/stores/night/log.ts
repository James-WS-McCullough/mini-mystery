// One part of the night store (see stores/game.ts).

import { describeClaim, describeEvidence, renderAnswer } from '../../engine/render'
import type { Answer, CharId, Claim } from '../../engine/types'
import { claimKey } from './shared'
import type { AfterDerived, LogEntry, SaveAction } from './shared'

/** Writing the night down: the log, the notebook, the save. */
export function nightLog(night: AfterDerived) {
  const { mystery, round, notebook, log, actions, tally, seenClaims, ctx, foundItems } = night
  /** Human-readable label for a notebook item (statement or evidence) by id. */
  function labelOf(id: string): string {
    if (!ctx.value) return id
    const entry = notebook.value.find((n) => n.id === id)
    if (entry) {
      return `${mystery.value!.cast[entry.speaker].shortName}: ${describeClaim(ctx.value, entry.speaker, entry.claim)}`
    }
    const item = foundItems.value.find((e) => e.id === id)
    if (item) return `${item.name}: ${describeEvidence(ctx.value, item)}`
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
    log.value.push({ id: tally.logSeq++, kind, text, speaker, convo, mood, about })
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
    const text = renderAnswer(ctx.value, speaker, answer, `u${tally.saltSeq++}`, extraSlots)
    pushLog('speech', text, speaker, convo, undefined, about)
    noteClaims(speaker, [...answer.claims, ...(answer.also?.claims ?? [])], text, source)
    return text
  }
  return { labelOf, pushLog, record, noteClaims, absorbAnswer }
}

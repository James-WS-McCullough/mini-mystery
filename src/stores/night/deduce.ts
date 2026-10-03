// One part of the night store (see stores/game.ts).

import { narrate } from '../../content/narration'
import type { NarrationKey } from '../../content/narration'
import { matchContradiction } from '../../engine/contradictions'
import type { ContradictionReason } from '../../engine/contradictions'
import { cunningClingerMay } from '../../engine/deck'
import { matchLink } from '../../engine/links'
import type { LinkReason } from '../../engine/links'
import type { CharId, ItemId } from '../../engine/types'
import { DEDUCE_MISSES, ABOUT_THE_HOUR } from './shared'
import type { AfterLifelines } from './shared'

/** Drawing threads between notes. */
export function nightDeduce(night: AfterLifelines) {
  const {
    phase, stage, mystery, round, notebook, activeChar, notebookOpen, gatheringPending, confessionsPending,
    realized, deduceSelection, missesLeft, deduceAtMidnight, lastDeduceResult, pack, wrongGuesses, tally,
    realizedKeys, retracted, contradictions, links, clingerMay, helpersAbout, whereSaid, givenOver,
    passageNight, passageFound, borneOut, contradictionKey, linkKey, labelOf, record,
  } = night
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
      if (!tally.midnightMisses) {
        tally.midnightMisses = true
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

  /** Test the selected pair: a contradiction, a corroboration, or a miss. */
  function testPair() {
    if (deduceSelection.value.length !== 2 || missesLeft.value <= 0) return
    record({ t: 'testPair', pair: [...deduceSelection.value] })
    const labels = deduceSelection.value.map(labelOf)
    const name = (i: CharId) => mystery.value!.cast[i].shortName
    const and = (ids: CharId[]) => ids.map(name).join(' and ')

    // A known lie laid beside anything: it is settled already.
    const lie = deduceSelection.value.find((id) => retracted.value.has(id))
    if (lie) {
      const who = notebook.value.find((n) => n.id === lie)!.speaker
      lastDeduceResult.value = {
        ok: true,
        kind: 'known',
        text: narrate('deduce.knownLie', { name: name(who) }),
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
            ? narrate('deduce.againstUnborne', {
                sound: and(sound),
                soundBe: sound.length === 1 ? 'is' : 'are',
                caught: and(caught),
                caughtBe: caught.length === 1 ? 'is' : 'are',
              })
          : doubledRole?.kind === 'role'
            ? narrate('deduce.roleTwice', { caught: and(caught), role: pack.value.roleNames[doubledRole.role] ?? doubledRole.role })
            : caught.length > 1
            ? narrate('deduce.oneOf', { caught: caught.map(name).join(', or ') })
            : narrate('deduce.caught', { caught: caught.map(name).join('') }),
      }
    } else if (freshO.length > 0) {
      for (const l of freshO) {
        realise('link', linkKey(l), l.reason, l.statementIds, l.evidenceId, [], l.supports, false, labels)
      }
      const supported = [...new Set(freshO.flatMap((l) => l.supports))]
      const mutual = freshO.some((l) => l.reason === 'mutual-alibi')
      const traced = freshO.some((l) => l.reason === 'alibi-trace')
      /** What the case board makes of the corroboration. */
      const linkLine = (): NarrationKey =>
        mutual
          ? helpersAbout.value.includes('perjurer')
            ? 'deduce.pairPerjurer'
            : cunningClingerMay(mystery.value!.caseSheet.script)
              ? 'deduce.pairCunningClinger'
              : clingerMay.value
                ? 'deduce.pairClinger'
                : 'deduce.pair'
          : traced && freshO.some((l) => givenOver(l.evidenceId)) && helpersAbout.value.includes('forger')
            ? 'deduce.handedForger'
            : freshO.some((l) => l.reason === 'seen-at-scene')
              ? 'deduce.seenAtScene'
              : freshO.some((l) => l.reason === 'by-the-passage')
                ? 'deduce.byPassage'
                : traced && passageNight.value && passageFound.value === null
                  ? 'deduce.tracePassageUnknown'
                  : traced && passageNight.value && freshO.some((l) => whereSaid(l.statementIds) === passageFound.value)
                    ? 'deduce.traceAtPassage'
                    : traced
                      ? 'deduce.trace'
                      : supported.length > 0
                        ? 'deduce.corroboration'
                        : 'deduce.clues'
      lastDeduceResult.value = {
        ok: true,
        kind: 'link',
        // Two notes that agree somebody could have done it clear nobody.
        ...(freshO.every((l) => l.reason === 'by-the-passage' || l.reason === 'seen-at-scene')
          ? { stamp: 'Opportunity' }
          : {}),
        text: narrate(linkLine(), { names: and(supported), neither: supported.map(name).join(' nor ') }),
      }
    } else if (xs.length > 0 || os.length > 0) {
      lastDeduceResult.value = {
        ok: true,
        kind: 'known',
        text: narrate('deduce.drawn'),
      }
    } else {
      missesLeft.value--
      wrongGuesses.value++
      lastDeduceResult.value = {
        ok: false,
        kind: 'miss',
        text:
          missesLeft.value > 0 ? narrate('deduce.miss') : narrate('deduce.missLast'),
      }
    }
    deduceSelection.value = []
  }
  return { beginDeduce, resumeQuestions, toggleDeduceSelect, realise, testPair }
}

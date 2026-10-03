// One part of the night store (see stores/game.ts).

import { narrate } from '../../content/narration'
import { inRoom, renderAnswer } from '../../engine/render'
import { DEDUCE_MISSES } from './shared'
import type { AfterDeduce } from './shared'

/** The hour striking, and what it brings. */
export function nightHours(night: AfterDeduce) {
  const {
    phase, stage, mystery, round, transitionToMidnight, questionsLeft, searchedRooms, foundItemIds,
    activeChar, notebookOpen, killing, missesLeft, tally, ctx, isLastRound, pushLog, record, thereBy,
    pikeReturns,
  } = night
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
      `u${tally.saltSeq++}`,
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
      narrate('foundDead', { name: mystery.value!.cast[second.victim].name, inRoom: inRoom(ctx.value, second.room) }),
    )
  }
  return { strikeHour, secondKilling }
}

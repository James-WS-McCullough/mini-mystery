// One part of the night store (see stores/game.ts).

import { narrate } from '../../content/narration'
import { renderSearch, roomName } from '../../engine/render'
import type { EvidenceItem, Lifeline, RoomId } from '../../engine/types'
import { computed } from 'vue'
import type { AfterFlow } from './shared'

/** Searching a room. */
export function nightSearch(night: AfterFlow) {
  const {
    stage, mystery, round, searchedRooms, lastSearchRoom, searchedAgainIn, lastSearchText, lastSearchItemIds,
    foundItemIds, foundLifelineIds, lastSearchLifelineIds, tally, ctx, isLocked, triedLocked, lockedNotice,
    lastSearchItems, pushLog, record,
  } = night
  /** Help lying in a room, not yet found. */
  function lifelinesIn(room: RoomId): Lifeline[] {
    return (mystery.value?.lifelines ?? []).filter(
      (l) => l.room === room && !foundLifelineIds.value.includes(l.id),
    )
  }
  function thereBy(e: EvidenceItem): boolean {
    return (e.from ?? 0) <= round.value
  }

  function search(room: RoomId) {
    if (!ctx.value || !mystery.value) return
    if (stage.value !== 'search' || searchedRooms.value.includes(room)) return
    // The door will not open: no search is spent on it.
    if (isLocked(room)) {
      if (!triedLocked.value) record({ t: 'tryLocked' })
      triedLocked.value = true
      lockedNotice.value = narrate('locked')
      return
    }
    lockedNotice.value = null
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
    lastSearchText.value = renderSearch(ctx.value, room, items, `search${tally.saltSeq++}`)
    pushLog('action', narrate('searched', { room: roomName(ctx.value, room), found: lastSearchText.value }))
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
  return { lifelinesIn, thereBy, search, canSearchAgain, searchAgain }
}

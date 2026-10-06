// One part of the night store (see stores/game.ts).

import { narrate } from '../../content/narration'
import { renderSearch, roomName } from '../../engine/render'
import type { EvidenceItem, ItemId, Lifeline, RoomId } from '../../engine/types'
import { computed } from 'vue'
import type { AfterFlow } from './shared'
import { Rng } from '../../engine/rng'

/** Searching a room. */
export function nightSearch(night: AfterFlow) {
  const {
    stage, mystery, round, searchedRooms, lastSearchRoom, searchedAgainIn, lastSearchText, lastSearchItemIds,
    foundItemIds, foundLifelineIds, lastSearchLifelineIds, tally, ctx, isLocked, triedLocked, lockedNotice,
    lastSearchItems, tutorLocks, pushLog, record, sealedItemIds, tutorial,
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
    // (Sergeant Pike has said where to look tonight.)
    if (tutorLocks.value.rooms && !tutorLocks.value.rooms.includes(room)) return
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
    // A paper is kept under lock: a desk, a safe, a cabinet, each with a puzzle to it, opened (or skipped) before
    // it comes into hand. Not on a night Sergeant Pike is teaching.
    if (!tutorial.value) sealedItemIds.value.push(...items.filter((i) => i.fact.kind === 'motiveDocument').map((i) => i.id))
    const lines = lifelinesIn(room)
    foundLifelineIds.value.push(...lines.map((l) => l.id))
    lastSearchLifelineIds.value = lines.map((l) => l.id)
    lastSearchRoom.value = room
    lastSearchItemIds.value = items.map((i) => i.id)
    // (What is under lock is told as the thing it is locked in, not by name.)
    const told = items.map((i) => (sealedItemIds.value.includes(i.id) ? { ...i, name: lockOf(i.id).what } : i))
    lastSearchText.value = renderSearch(ctx.value, room, told, `search${tally.saltSeq++}`)
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
  /** The lock on something found, settled by the case number: which puzzle, and what it is on. */
  function lockOf(item: ItemId): Lock {
    return new Rng(`${mystery.value?.seed ?? 0}:lock:${item}`).pick(LOCKS)
  }
  /** The lock opened, or given up on: what was behind it comes into hand. */
  function unlock(item: ItemId) {
    if (!sealedItemIds.value.includes(item)) return
    record({ t: 'unlock', item })
    sealedItemIds.value = sealedItemIds.value.filter((id) => id !== item)
  }
  return { lifelinesIn, thereBy, search, canSearchAgain, searchAgain, lockOf, unlock }
}

/** A lock on something found: which puzzle opens it, and what it is on. */
export interface Lock {
  kind: 'word' | 'dials' | 'lamps' | 'cards'
  what: string
  title: string
  hint: string
}
export const LOCKS: readonly Lock[] = [
  { kind: 'word', what: 'a writing desk, its drawer shut with a letter lock', title: 'The letter lock', hint: 'Five letters open it. Six tries.' },
  { kind: 'dials', what: 'a small safe with four coloured dials', title: 'The safe', hint: 'Four colours in their order. Eight tries.' },
  { kind: 'lamps', what: 'a cabinet with a latch of lamps', title: 'The latch', hint: 'Light every lamp. Each one turns its neighbours too.' },
  { kind: 'cards', what: 'a jewel case, its clasp held by a lock of four cards', title: 'The card lock', hint: 'Three cards tell how the four suits lie. Set them in their order. Three tries.' },
]

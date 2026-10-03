// One part of the night store (see stores/game.ts).

import { COFFEE_QUESTIONS } from '../../content/lifelines'
import type { Pillar } from '../../content/lifelines'
import { narrate } from '../../content/narration'
import { claimIsTrue } from '../../engine/claims'
import { gaveNothing } from '../../engine/interrogate'
import { roomName } from '../../engine/render'
import { Rng } from '../../engine/rng'
import type { CharId, EvidenceItem, ItemId, Lifeline, RoomId } from '../../engine/types'
import { truePillars } from '../../engine/verdict'
import { computed } from 'vue'
import type { AfterQuestions, NoteHint, UsedLifeline } from './shared'

/** The help to be found about the place, and used. */
export function nightLifelines(night: AfterQuestions) {
  const {
    phase, stage, mystery, round, questionsLeft, searchedRooms, foundItemIds, foundLifelineIds, usedLifelines,
    pikeOrder, lifelineReport, notebook, dead, ctx, foundItems, isLocked, pushLog, record, lifelinesIn,
    questionState,
  } = night
  // ---------- lifelines ----------

  /** Lifelines lying in a room, not yet come upon. */
  const foundLifelines = computed<Lifeline[]>(() =>
    (mystery.value?.lifelines ?? []).filter((l) => foundLifelineIds.value.includes(l.id)),
  )
  /** The questions a flask of coffee is good for, in the hour it is drunk. */
  const bonusQuestions = computed(() =>
    Object.values(usedLifelines.value).some((u) => u.kind === 'coffee' && u.round === round.value)
      ? COFFEE_QUESTIONS
      : 0,
  )
  /** The coffee's questions still in hand: they are spent before the hour's own. */
  const beansLeft = computed(() => {
    const cup = Object.values(usedLifelines.value).find((u) => u.kind === 'coffee' && u.round === round.value)
    if (!cup) return 0
    return Math.max(0, Math.min(COFFEE_QUESTIONS, questionsLeft.value - (cup.before ?? 0)))
  })
  /** Lifelines found and not yet used. */
  const unusedLifelines = computed(() => foundLifelines.value.filter((l) => !usedLifelines.value[l.id]))
  /** Rooms Sergeant Pike may be sent to: none yet searched, by you or by him. */
  const pikeRooms = computed<RoomId[]>(() =>
    (ctx.value?.pack.rooms ?? [])
      .map((r) => r.id)
      // (Nor a locked door: he has no key either.)
      .filter((r) => !searchedRooms.value.includes(r) && r !== pikeOrder.value?.room && !isLocked(r)),
  )
  const canUseLifelines = computed(
    () => phase.value === 'play' && stage.value !== 'transition' && !!mystery.value,
  )

  /**
   * What the anonymous note says: something worth doing that has not been done.
   * A room still holding something of note; or a question, not yet put, whose
   * answer tells something — a lie most of all.
   */
  function noteHint(): NoteHint {
    const m = mystery.value!
    const KEY = new Set(['weapon', 'trace', 'motiveDocument', 'passage', 'bribe', 'secondTrace'])
    const options: { hint: NoteHint; weight: number }[] = []
    for (const r of ctx.value?.pack.rooms ?? []) {
      if (searchedRooms.value.includes(r.id) || pikeOrder.value?.room === r.id) continue
      const there = m.evidence.filter(
        (e) =>
          e.room === r.id &&
          e.heldBy === undefined &&
          !e.came &&
          (e.from ?? 0) <= round.value &&
          e.fact.kind !== 'flavor' &&
          !foundItemIds.value.includes(e.id),
      )
      if (there.length === 0) continue
      options.push({ hint: { kind: 'room', room: r.id }, weight: there.some((e) => KEY.has(e.fact.kind)) ? 3 : 1 })
    }
    for (const c of m.cast) {
      if (c.id === dead.value) continue
      for (const q of ['role', 'alibi', 'seen'] as const) {
        if (questionState(c.id, { kind: q }) !== 'fresh') continue
        const p = m.policies[c.id]
        const answer = q === 'seen' ? p.seen : p[q][p[q].length - 1]
        if (gaveNothing(answer)) continue
        const lies = answer.claims.some((cl) => claimIsTrue(cl, c.id, m.truth, m.cast) === false)
        options.push({ hint: { kind: 'ask', char: c.id, q }, weight: lies ? 3 : 1 })
      }
    }
    if (options.length === 0) return { kind: 'none' }
    const rng = new Rng(`${m.seed}:note:${round.value}:${foundItemIds.value.length}:${notebook.value.length}`)
    let at = rng.next() * options.reduce((n, o) => n + o.weight, 0)
    for (const o of options) {
      at -= o.weight
      if (at < 0) return o.hint
    }
    return options[options.length - 1].hint
  }

  /** What the expert would say of a guest: the count that clears them, and what of yours bears it out. */
  function expertView(char: CharId): { pillar: Pillar | null; noteIds: string[]; itemIds: ItemId[] } {
    const m = mystery.value!
    const truly = truePillars(m, char)
    const notes = notebook.value
    const support: Record<Pillar, { noteIds: string[]; itemIds: ItemId[] }> = {
      means: {
        noteIds: [],
        itemIds: foundItems.value.filter((e) => e.fact.kind === 'weapon').map((e) => e.id),
      },
      motive: {
        noteIds: notes.filter((n) => n.claim.kind === 'relationship' && n.claim.subject === char).map((n) => n.id),
        itemIds: foundItems.value
          .filter((e) => e.fact.kind === 'motiveDocument' && e.fact.subject === char)
          .map((e) => e.id),
      },
      opportunity: {
        noteIds: notes
          .filter(
            (n) =>
              (n.claim.kind === 'whereabouts' && (n.speaker === char || n.claim.companions.includes(char))) ||
              ((n.claim.kind === 'sighting' || n.claim.kind === 'earlier') && n.claim.target === char),
          )
          .map((n) => n.id),
        itemIds: [],
      },
    }
    const order: Pillar[] = ['opportunity', 'means', 'motive']
    const clears = order.filter((p) => truly[p] === 'ruledOut')
    if (clears.length === 0) return { pillar: null, noteIds: [], itemIds: [] }
    const weight = (p: Pillar) => support[p].noteIds.length + support[p].itemIds.length
    const pillar = [...clears].sort((a, b) => weight(b) - weight(a))[0]
    return { pillar, ...support[pillar] }
  }

  function useLifeline(id: string, on: { char?: CharId; room?: RoomId } = {}) {
    const m = mystery.value
    if (!m || !ctx.value || !canUseLifelines.value) return
    const line = foundLifelines.value.find((l) => l.id === id)
    if (!line || usedLifelines.value[id]) return
    const used: UsedLifeline = { kind: line.kind, round: round.value }
    if (line.kind === 'coffee') {
      used.before = questionsLeft.value
      questionsLeft.value += COFFEE_QUESTIONS
      pushLog('action', narrate('coffee', { count: COFFEE_QUESTIONS }))
      lifelineReport.value = { kind: 'coffee' }
    } else if (line.kind === 'pike') {
      if (on.room === undefined || !pikeRooms.value.includes(on.room)) return
      pikeOrder.value = { room: on.room, round: round.value }
      used.room = on.room
      pushLog('action', narrate('pikeSent', { room: roomName(ctx.value, on.room) }))
    } else if (line.kind === 'note') {
      // What it says is settled as it is opened: the most use, as things stand.
      const hint = noteHint()
      used.hint = hint
      pushLog('action', narrate('noteOpened'))
      lifelineReport.value = { kind: 'note', hint }
    } else if (line.kind === 'telegram') {
      if (on.char === undefined || !m.cast[on.char]) return
      const who = m.cast[on.char]
      const item: EvidenceItem = {
        id: `telegram-${on.char}`,
        room: m.caseSheet.sceneRoom,
        name: `a wire from the Yard concerning ${who.shortName}`,
        fact: { kind: 'motiveDocument', subject: on.char, rel: m.truth.relationships[on.char] },
        came: 'wired from the Yard',
      }
      if (!m.evidence.some((e) => e.id === item.id)) m.evidence.push(item)
      foundItemIds.value.push(item.id)
      used.char = on.char
      used.itemId = item.id
      pushLog('action', narrate('wire', { name: who.shortName }))
      lifelineReport.value = { kind: 'telegram', char: on.char, itemId: item.id }
    } else {
      if (on.char === undefined || !m.cast[on.char]) return
      const view = expertView(on.char)
      used.char = on.char
      used.pillar = view.pillar
      pushLog('action', narrate('expertCalled', { name: m.cast[on.char].shortName }))
      lifelineReport.value = { kind: 'expert', char: on.char, ...view }
    }
    record({ t: 'lifeline', id, char: on.char, room: on.room })
    usedLifelines.value = { ...usedLifelines.value, [id]: used }
  }

  /** The hour strikes: Sergeant Pike is back from where he was sent. */
  function pikeReturns() {
    const order = pikeOrder.value
    const m = mystery.value
    if (!order || !m || !ctx.value) return
    pikeOrder.value = null
    const items = m.evidence.filter(
      (e) =>
        e.room === order.room &&
        e.heldBy === undefined &&
        (e.from ?? 0) <= order.round &&
        !e.came &&
        !foundItemIds.value.includes(e.id),
    )
    foundItemIds.value.push(...items.map((i) => i.id))
    const lines = lifelinesIn(order.room)
    foundLifelineIds.value.push(...lines.map((l) => l.id))
    if (!searchedRooms.value.includes(order.room)) searchedRooms.value.push(order.room)
    const what = items.filter((i) => i.fact.kind !== 'flavor')
    const room = roomName(ctx.value, order.room)
    pushLog(
      'action',
      what.length
        ? narrate('pikeFound', { room, items: what.map((i) => i.name).join('; and ') })
        : narrate('pikeFoundNothing', { room }),
    )
    lifelineReport.value = { kind: 'pike', room: order.room, itemIds: items.map((i) => i.id), lifelineIds: lines.map((l) => l.id) }
  }
  return {
    foundLifelines, bonusQuestions, beansLeft, unusedLifelines, pikeRooms, canUseLifelines, noteHint,
    expertView, useLifeline, pikeReturns,
  }
}

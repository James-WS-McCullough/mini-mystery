<script setup lang="ts">
// The timeline of the evening, pulled out over the page like the notebook:
// every account heard, on a row per guest and a line for the victim. Tap an
// hour to see the plan at that hour, everybody pinned where they are said to
// have been, and whatever will not fit flagged.
import { computed, ref } from 'vue'
import { slotView } from '../../engine/evening/board'
import { doctorsWord, noteEvening, span } from '../../engine/evening/render'
import { EVENING_SLOTS, EVICTIM } from '../../engine/evening/types'
import { useGame } from '../../stores/game'
import type { MapSource } from '../../ui/mapSource'
import Icon from '../Icon.vue'
import ManorMap from '../ManorMap.vue'
import Portrait from '../Portrait.vue'
import { clashes, pinsOf, upstairsOf } from './pins'
import { useEveningWords } from './words'

const game = useGame()
const { name, short } = useEveningWords()
const m = computed(() => game.mystery!)
const ev = computed(() => m.value.evening!)
const SLOTS = EVENING_SLOTS

interface Item {
  id: number
  row: number
  from: number
  to: number
  label: string
  title: string
  lane: number
}
/** Every account heard, on the row of whoever gave it. */
const items = computed<Item[]>(() => {
  const out: Omit<Item, 'lane'>[] = []
  for (const h of game.eveningHeard) {
    const { claim, speaker } = h
    const title = `${name(speaker)}: ${noteEvening(game.ctx!, claim)}`
    if (claim.kind === 'stay') {
      const others = claim.with.filter((c) => c !== EVICTIM).length
      const company = claim.with.includes(EVICTIM) ? ` + ${name(EVICTIM)}` : others > 0 ? ` + ${others}` : ', alone'
      out.push({ id: h.id, row: speaker, from: claim.from, to: claim.to, label: `${short(claim.room)}${company}`, title })
    } else if (claim.kind === 'blank') {
      out.push({ id: h.id, row: speaker, from: claim.from, to: claim.to, label: 'cannot say', title })
    }
  }
  const laid: Item[] = []
  for (const it of [...out].sort((a, b) => a.from - b.from || a.id - b.id)) {
    let lane = 0
    while (laid.some((x) => x.row === it.row && x.lane === lane && !(x.to < it.from || x.from > it.to))) lane++
    laid.push({ ...it, lane })
  }
  return laid
})
const lanesOf = (row: number) => Math.max(1, ...items.value.filter((i) => i.row === row).map((i) => i.lane + 1))
/** The victim's evening as one line: where they are said to have been, and by how many. */
const victimCells = computed(() => {
  const cells: { from: number; to: number; label: string; title: string }[] = []
  for (let s = 0; s < SLOTS; s++) {
    const counts = new Map<string, string[]>()
    const add = (place: string, by: number) => counts.set(place, [...(counts.get(place) ?? []), name(by)])
    for (const { speaker, claim } of game.eveningHeard) {
      if (claim.kind === 'stay' && claim.with.includes(EVICTIM) && s >= claim.from && s <= claim.to) add(short(claim.room), speaker)
      if (claim.kind === 'lastSeen' && claim.slot - (claim.left ? 1 : 0) === s) add(short(claim.room), speaker)
      if (claim.kind === 'lastSeen' && claim.left && claim.slot === s) add('left', speaker)
      if (claim.kind === 'heard' && claim.slot === s) add(`a cry at ${claim.time}`, speaker)
    }
    if (counts.size === 0) continue
    const label = [...counts].map(([p, by]) => `${p} ×${by.length}`).join(' · ')
    const title = [...counts].map(([p, by]) => `${p}: ${by.join(', ')}`).join('\n')
    const prev = cells.at(-1)
    if (prev && prev.to === s - 1 && prev.label === label) prev.to = s
    else cells.push({ from: s, to: s, label, title })
  }
  return cells
})

const w = computed(() => game.deathHours!)
const inWindow = (t: number) => t >= w.value.lo && t <= w.value.hi

// ---- one hour, on the plan ----
const slot = ref<number | null>(null)
const view = computed(() => (slot.value === null ? null : slotView(game.eveningHeard, slot.value, name)))
const source = computed<MapSource | null>(() => {
  const v = view.value
  if (!v) return null
  return {
    seed: m.value.seed,
    pack: game.pack,
    scene: m.value.caseSheet.sceneRoom,
    placements: pinsOf(v, game.pack, name),
    nameOf: name,
    defIdOf: (c) => (c === EVICTIM ? undefined : m.value.cast[c]?.defId),
    searched: (room) => game.searchedRooms.includes(room),
    found: () => [],
    flag: (p) => clashes(v, p),
  }
})
const upstairs = computed(() => (view.value ? upstairsOf(view.value) : []))
</script>

<template>
  <div class="shade" role="dialog" aria-modal="true" aria-label="The timeline of the evening" @click.self="game.boardOpen = false">
    <section class="drawer">
      <header>
        <h3 class="brass">The evening, hour by hour</h3>
        <button class="ghost" aria-label="Close" @click="game.boardOpen = false"><Icon name="close" /></button>
      </header>

      <div class="board-wrap">
        <div class="board">
          <div class="row head">
            <div class="who" />
            <div class="track">
              <button
                v-for="s in SLOTS"
                :key="s"
                class="slot"
                :class="{ on: slot === s - 1, window: inWindow(s - 1) }"
                :style="{ gridColumn: `${s}` }"
                @click="slot = slot === s - 1 ? null : s - 1"
              >
                {{ ev.clock[s - 1] }}
              </button>
            </div>
          </div>
          <div class="row victim">
            <div class="who"><span>{{ name(-1) }}</span></div>
            <div class="track" style="grid-template-rows: 1.7rem">
              <div v-for="s in SLOTS" :key="`vbg${s}`" class="cell" :class="{ window: inWindow(s - 1), on: slot === s - 1 }" :style="{ gridColumn: `${s}`, gridRow: '1' }" />
              <div v-for="c in victimCells" :key="c.from" class="bar vcell" :style="{ gridColumn: `${c.from + 1} / ${c.to + 2}`, gridRow: '1' }" :title="c.title">
                {{ c.label }}
              </div>
            </div>
          </div>
          <div v-for="g in m.cast" :key="g.id" class="row">
            <div class="who">
              <Portrait :who="g.defId" shape="token" size="1.8rem" />
              <span>{{ g.shortName }}</span>
            </div>
            <div class="track" :style="{ gridTemplateRows: `repeat(${lanesOf(g.id)}, 1.7rem)` }">
              <div
                v-for="s in SLOTS"
                :key="`bg${s}`"
                class="cell"
                :class="{ window: inWindow(s - 1), on: slot === s - 1 }"
                :style="{ gridColumn: `${s}`, gridRow: `1 / span ${lanesOf(g.id)}` }"
              />
              <div
                v-for="it in items.filter((i) => i.row === g.id)"
                :key="it.id"
                class="bar"
                :style="{ gridColumn: `${it.from + 1} / ${it.to + 2}`, gridRow: `${it.lane + 1}` }"
                :title="it.title"
              >
                {{ it.label }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <p class="small muted legend">
        {{ doctorsWord(ev) }}
        Shaded: when {{ name(-1) }} can have died, taking everybody at their word ({{ span(ev, w.lo, w.hi) }}).
        <template v-if="game.hourKnown"> The hour is known: what was said of it is in your notes.</template>
        <template v-else> Tap an hour to see the place then.</template>
        <span v-if="game.eveningHeard.length === 0"> Nothing yet: ask the household what happened last night.</span>
      </p>

      <div v-if="slot !== null && source && view" class="at">
        <h4>{{ ev.clock[slot] }} to {{ ev.clock[slot + 1] }}, by what has been said</h4>
        <ManorMap mode="view" :source="source" />
        <p v-if="upstairs.length > 0" class="small">
          In their own rooms: <span v-for="(u, i) in upstairs" :key="u">{{ i > 0 ? ', ' : '' }}{{ name(u) }}</span>
        </p>
        <p v-for="c in view.doubled" :key="`d${c}`" class="small danger-text">{{ name(c) }} is placed in two rooms at once.</p>
        <template v-for="[room, notes] in view.clashes" :key="room">
          <p v-for="(n, i) in notes" :key="i" class="small danger-text">{{ short(room) }}: {{ n }}.</p>
        </template>
      </div>
    </section>
  </div>
</template>

<style scoped>
.shade {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(5, 7, 10, 0.75);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow-y: auto;
  padding: 1rem 16px 5rem;
}
.drawer {
  width: min(100%, 66rem);
  background: var(--panel);
  border: 1px solid var(--brass-dim);
  border-radius: 10px;
  padding: 0.9rem 1rem 1.2rem;
  text-align: left;
  box-shadow: var(--shadow);
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
header h3 {
  margin: 0;
  font-family: var(--font-display);
  letter-spacing: 0.06em;
}
.board-wrap {
  overflow-x: auto;
  margin-top: 0.6rem;
}
.board {
  min-width: 40rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.row {
  display: grid;
  grid-template-columns: 10rem 1fr;
}
.row.victim .who {
  color: var(--danger);
}
.who {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  padding-right: 0.4rem;
}
.track {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 2px 0;
}
.slot {
  font-size: 0.75rem;
  padding: 0.3rem 0;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--muted);
  border-radius: 4px;
  margin: 0 1px;
}
.slot.window {
  color: var(--ink);
  border-color: var(--danger);
}
.slot.on {
  background: var(--brass-deep);
  color: var(--ink);
}
.cell {
  border-left: 1px solid var(--line);
  opacity: 0.6;
}
.cell.window {
  background: color-mix(in srgb, var(--danger) 14%, transparent);
  opacity: 1;
}
.cell.on {
  background: color-mix(in srgb, var(--brass) 12%, transparent);
  opacity: 1;
}
.bar {
  z-index: 1;
  margin: 1px 2px;
  padding: 0 0.4rem;
  font-size: 0.72rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-radius: 5px;
  border: 1px solid var(--line);
  background: #222a33;
  color: var(--ink);
  text-align: left;
  line-height: 1.5rem;
}
.bar.mark {
  background: transparent;
  border-style: dashed;
  color: var(--muted);
}
.bar.vcell {
  background: transparent;
  border-color: var(--danger);
}
.bar.owned {
  border-color: var(--good);
}
.bar.picked {
  border-color: var(--brass);
  box-shadow: 0 0 0 1px var(--brass);
}
.legend {
  margin: 0.4rem 0 0;
}
.pairing {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 0.8rem;
  align-items: center;
  margin-top: 0.6rem;
  padding: 0.6rem 0.8rem;
  border: 1px solid var(--brass-dim);
  border-radius: 8px;
}
.pairing p {
  margin: 0;
  flex-basis: 100%;
}
.at {
  margin-top: 0.8rem;
}
.at h4 {
  margin: 0 0 0.5rem;
}
.danger-text {
  color: var(--danger);
  margin: 0.2rem 0;
}
.good-text {
  color: var(--good);
}
</style>

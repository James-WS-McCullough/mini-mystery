<script setup lang="ts">
// The timeline of last night, pulled out over the stage like the notebook:
// every statement heard, on a row per guest and a line for the victim. Tap a
// half hour to see the house plan at that moment, everybody pinned where they
// are said to have been; tap two statements to test whether both can be true.
import { computed, ref } from 'vue'
import { slotView } from '../../engine/timeline/board'
import { noteOf, span } from '../../engine/timeline/render'
import { SLOT_CLOCK, SLOTS, VICTIM } from '../../engine/timeline/types'
import { useTimeline, type Heard } from '../../stores/timeline'
import type { MapSource } from '../../ui/mapSource'
import Icon from '../Icon.vue'
import ManorMap from '../ManorMap.vue'
import Portrait from '../Portrait.vue'
import { useTimelineWords } from './words'
import { clashes, pinsOf } from './pins'

const tl = useTimeline()
const { him, name, short } = useTimelineWords()
const tc = computed(() => tl.tc!)

// ---- the rows ----
interface Item {
  id: number
  row: number
  from: number
  to: number
  label: string
  title: string
  kind: 'stay' | 'mark'
  owned?: boolean
  lane: number
}
/** Every statement heard, set on the row of whoever it is about. */
const items = computed<Item[]>(() => {
  const t = tc.value
  const out: Omit<Item, 'lane'>[] = []
  for (const h of tl.heard) {
    const { claim, speaker } = h
    const title = `${name(speaker)}: ${noteOf(t, speaker, claim)}`
    switch (claim.kind) {
      case 'stay': {
        const others = claim.with.filter((c) => c !== VICTIM).length
        const company = claim.with.includes(VICTIM) ? ` + ${t.victimShort}` : others > 0 ? ` + ${others}` : ', alone'
        out.push({ id: h.id, row: speaker, from: claim.from, to: claim.to, label: `${short(claim.room, speaker)}${company}`, title, kind: 'stay', owned: h.owned })
        break
      }
      case 'saw':
        out.push({ id: h.id, row: claim.target, from: claim.slot, to: claim.slot, label: `${short(claim.room)} · seen by ${name(speaker)}`, title, kind: 'mark' })
        break
      case 'found':
        out.push({ id: h.id, row: speaker, from: claim.slot, to: claim.slot, label: `found ${him.value}`, title, kind: 'stay' })
        break
      case 'empty':
        out.push({ id: h.id, row: speaker, from: claim.slot, to: claim.slot, label: `${short(claim.room)} empty`, title, kind: 'mark' })
        break
      case 'lastSeen':
        // (On the victim's own line, counted.)
        break
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
    for (const { speaker, claim } of tl.heard) {
      if (claim.kind === 'stay' && claim.with.includes(VICTIM) && s >= claim.from && s <= claim.to) add(short(claim.room), speaker)
      if (claim.kind === 'lastSeen' && claim.slot === s) add(short(claim.room), speaker)
      if (claim.kind === 'found' && claim.slot === s) add('found dead', speaker)
    }
    if (counts.size === 0) continue
    const label = [...counts].map(([p, by]) => (p === 'found dead' ? p : `${p} ×${by.length}`)).join(' · ')
    const title = [...counts].map(([p, by]) => `${p}: ${by.join(', ')}`).join('\n')
    const prev = cells.at(-1)
    if (prev && prev.to === s - 1 && prev.label === label) prev.to = s
    else cells.push({ from: s, to: s, label, title })
  }
  return cells
})

/** Whether anything yet says when they died. */
const windowKnown = computed(
  () => tl.heard.some((h) => h.claim.kind === 'lastSeen' || h.claim.kind === 'found') || tl.found.some((e) => e.earliest !== undefined || e.latest !== undefined),
)
const inWindow = (t: number) => windowKnown.value && t >= tl.deathWindow.lo && t <= tl.deathWindow.hi

// ---- two statements ----
const picked = ref<number[]>([])
const verdict = ref<{ ok: boolean; text: string } | null>(null)
function pick(id: number) {
  verdict.value = null
  picked.value = picked.value.includes(id) ? picked.value.filter((x) => x !== id) : [...picked.value, id].slice(-2)
}
function testPair() {
  if (picked.value.length !== 2) return
  verdict.value = tl.pair(picked.value[0], picked.value[1])
  picked.value = []
}
const pickedNotes = computed(() =>
  picked.value.map((id) => {
    const h = tl.heard.find((x) => x.id === id) as Heard
    return `${name(h.speaker)}: ${noteOf(tc.value, h.speaker, h.claim)}`
  }),
)

// ---- one half hour, on the plan of the house ----
const slot = ref<number | null>(null)
const view = computed(() => (slot.value === null ? null : slotView(tl.heard, slot.value, name)))
const source = computed<MapSource | null>(() => {
  const v = view.value
  if (!v) return null
  return {
    seed: tc.value.seed,
    pack: tl.pack,
    scene: tc.value.scene,
    placements: pinsOf(v, tl.pack, name),
    nameOf: name,
    defIdOf: (c) => (c === VICTIM ? undefined : tc.value.cast[c]?.defId),
    searched: (room) => tl.searched.includes(room),
    found: (room) => tl.found.filter((e) => e.room === room && !e.plain).map((e) => ({ id: e.id, name: e.name, proves: 'a clue to the time' })),
    flag: (p) => clashes(v, p),
  }
})
/** Those upstairs at the half hour, who are on no plan of the ground floor. */
const upstairs = computed(() => {
  const v = view.value
  if (!v) return []
  return tc.value.rooms
    .filter((r) => r.bed !== undefined)
    .flatMap((r) => [...new Set((v.rooms.get(r.id) ?? []).map((p) => p.who))].map((who) => ({ who, room: short(r.id, who) })))
})
</script>

<template>
  <div class="shade" role="dialog" aria-modal="true" aria-label="The timeline of last night" @click.self="tl.boardOpen = false">
    <section class="drawer">
      <header>
        <h3 class="brass">Last night, half hour by half hour</h3>
        <button class="ghost" aria-label="Close" @click="tl.boardOpen = false"><Icon name="close" /></button>
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
                {{ SLOT_CLOCK[s - 1] }}
              </button>
            </div>
          </div>
          <div class="row victim">
            <div class="who"><span>{{ tc.victimShort }}</span></div>
            <div class="track" style="grid-template-rows: 1.7rem">
              <div v-for="s in SLOTS" :key="`vbg${s}`" class="cell" :class="{ window: inWindow(s - 1), on: slot === s - 1 }" :style="{ gridColumn: `${s}`, gridRow: '1' }" />
              <div v-for="c in victimCells" :key="c.from" class="bar vcell" :style="{ gridColumn: `${c.from + 1} / ${c.to + 2}`, gridRow: '1' }" :title="c.title">
                {{ c.label }}
              </div>
            </div>
          </div>
          <div v-for="g in tc.cast" :key="g.id" class="row">
            <div class="who">
              <Portrait :who="g.defId" :pack="tl.pack" :trait="null" shape="token" size="1.8rem" />
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
              <button
                v-for="it in items.filter((i) => i.row === g.id)"
                :key="`${it.id}-${it.row}-${it.kind}`"
                class="bar"
                :class="[it.kind, { picked: picked.includes(it.id), owned: it.owned }]"
                :style="{ gridColumn: `${it.from + 1} / ${it.to + 2}`, gridRow: `${it.lane + 1}` }"
                :title="it.title"
                @click="pick(it.id)"
              >
                {{ it.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
      <p class="small muted legend">
        Tap a time to see the house then. Tap two statements to test whether both can be true.
        <span v-if="windowKnown">Shaded: when {{ tc.victimShort }} can have died, taking everybody at their word ({{ span(tl.deathWindow.lo, tl.deathWindow.hi) }}).</span>
        <span v-if="tl.heard.length === 0">Nothing yet: question the household.</span>
      </p>

      <div v-if="picked.length > 0" class="pairing">
        <p v-for="(n, i) in pickedNotes" :key="i" class="small">{{ n }}</p>
        <button class="primary" :disabled="picked.length !== 2" @click="testPair()">These cannot both be true</button>
        <button class="ghost" @click="picked = []">Clear</button>
      </div>
      <p v-if="verdict" class="small" :class="verdict.ok ? 'good-text' : 'muted'">{{ verdict.text }}</p>

      <div v-if="slot !== null && source && view" class="at">
        <h4>The house at {{ SLOT_CLOCK[slot] }}, by what has been said</h4>
        <ManorMap mode="view" :source="source" />
        <p v-if="upstairs.length > 0" class="small">
          Upstairs: <span v-for="(u, i) in upstairs" :key="u.who">{{ i > 0 ? ', ' : '' }}{{ name(u.who) }} ({{ u.room }})</span>
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
  min-width: 44rem;
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
  grid-template-columns: repeat(8, 1fr);
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

<script setup lang="ts">
// The plan of the house — a different house for every case — with everything
// the detective has learned pinned where it belongs.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { describeEvidence, traitLabel } from '../engine/render'
import type { RoomId } from '../engine/types'
import { useGame } from '../stores/game'
import { sfx } from '../ui/audio'
import {
  generateManor,
  passageWalls,
  transpose,
  type MapDoor,
  type MapRoom,
  type ManorMap,
  type Rect,
} from '../ui/manorMap'
import { placementsFrom, type Placement } from '../ui/placements'
import Icon from './Icon.vue'
import ItemArt from './ItemArt.vue'
import Portrait from './Portrait.vue'

/**
 * `view` and `pick` are the plan to work from; `photo` is a still of it for the
 * case sheet: no names, no pins, nothing moving, and the scene crossed out.
 */
const props = withDefaults(defineProps<{ mode?: 'pick' | 'view' | 'photo' }>(), { mode: 'view' })
const emit = defineEmits<{ (e: 'pick', room: RoomId): void }>()

const game = useGame()
const host = ref<HTMLElement | null>(null)
const narrow = ref(false)
const selected = ref<RoomId | null>(null)

let observer: ResizeObserver | undefined
onMounted(() => {
  if (!host.value || typeof ResizeObserver === 'undefined') return
  observer = new ResizeObserver(([entry]) => {
    // A photograph keeps the plan the way it was drawn, however small it is printed.
    narrow.value = props.mode !== 'photo' && entry.contentRect.width < 560
  })
  observer.observe(host.value)
})
onBeforeUnmount(() => observer?.disconnect())

/** The plan as it was drawn, lying on its side: a ship bow to the left, a train's carriages running across. */
const plan = computed(() => {
  if (!game.mystery || !game.ctx) return null
  return generateManor(
    game.mystery.seed,
    game.ctx.pack.rooms.map((r) => ({ id: r.id, kind: r.kind, end: r.end })),
    undefined,
    game.ctx.pack.mapStyles,
  )
})
/** The plan as shown: stood upright on a narrow screen. */
const map = computed(() => (plan.value && narrow.value ? transpose(plan.value) : plan.value))
/**
 * The hull, the rails and the couplings are worked out on the plan as drawn,
 * which runs across; stood upright, they are turned with it — the same swap
 * of x and y as the rooms.
 */
const upright = computed(() => (narrow.value ? 'matrix(0 1 1 0 0 0)' : undefined))

const scene = computed(() => game.mystery?.caseSheet.sceneRoom)
/** Where the second body was found, once there is one: a scene like the first. */
const second = computed(() => game.killing?.room)
const placements = computed(() =>
  game.ctx ? placementsFrom(game.notebook, game.ctx) : [],
)

function roomLabel(id: RoomId): string {
  const full = game.ctx?.pack.rooms.find((r) => r.id === id)?.name ?? id
  return full.replace(/^the /i, '')
}
function placedIn(id: RoomId): Placement[] {
  return placements.value.filter((p) => p.room === id)
}
/** The hull of the ship, drawn round everything on the sheet: a bow to the left, the stern to the right. */
function hull(m: ManorMap): string {
  const rooms: Rect[] = [...m.rooms, ...m.halls]
  const x0 = Math.min(...rooms.map((r) => r.x)) - 3
  const x1 = Math.max(...rooms.map((r) => r.x + r.w)) + 3
  const y0 = Math.min(...rooms.map((r) => r.y)) - 4
  const y1 = Math.max(...rooms.map((r) => r.y + r.h)) + 4
  const bow = Math.min(20, (x1 - x0) * 0.16)
  const my = (y0 + y1) / 2
  // Straight sides the whole length of the rooms; the bow and the stern stand beyond them.
  return `M${x0} ${y0}H${x1}Q${x1 + 6} ${y0} ${x1 + 6} ${my}Q${x1 + 6} ${y1} ${x1} ${y1}H${x0}Q${x0 - bow * 0.5} ${y1} ${x0 - bow} ${my}Q${x0 - bow * 0.5} ${y0} ${x0} ${y0}z`
}
/** A train's carriages, front first: each its corridor and the compartments along it. */
function carriages(m: ManorMap) {
  return [...m.halls]
    .filter((h) => h.w > h.h)
    .sort((p, q) => p.y - q.y)
    .map((h) => {
      const rows = m.rooms.filter((r) => Math.abs(r.y + r.h - h.y) < 1 || Math.abs(r.y - (h.y + h.h)) < 1)
      const top = Math.min(h.y, ...rows.map((r) => r.y))
      const bottom = Math.max(h.y + h.h, ...rows.map((r) => r.y + r.h))
      return { x0: h.x, x1: h.x + h.w, top, bottom, my: (top + bottom) / 2, hy: h.y + h.h / 2 }
    })
}
/** How far apart the sleepers lie; the track slides by one of these, over and over. */
const SLEEPER = 4
/**
 * The line under each carriage, from one edge of the sheet to the other: two
 * rails, on sleepers that reach only a little way past them.
 */
function tracks(m: ManorMap) {
  return carriages(m).map((c) => {
    const gauge = (c.bottom - c.top) * 0.45
    const rails = `M0 ${c.my - gauge / 2}H${m.width}M0 ${c.my + gauge / 2}H${m.width}`
    let sleepers = ''
    for (let x = -SLEEPER; x < m.width + SLEEPER; x += SLEEPER) {
      sleepers += `M${x} ${c.my - gauge / 2 - 1.6}h1.3v${gauge + 3.2}h-1.3z`
    }
    return { rails, sleepers }
  })
}
/**
 * The couplings of a train drawn like a page: a hook off the back of the first
 * carriage and off the front of the second, where each goes on to the other.
 */
function coupling(m: ManorMap): string {
  const [A, B] = carriages(m)
  if (!A || !B) return ''
  const hook = (x: number, y: number, dir: 1 | -1) =>
    `M${x} ${y - 2}h${3 * dir}v4h${-3 * dir}M${x + 3 * dir} ${y}h${4 * dir}a2 2 0 1 1 0 .01`
  return hook(A.x1, A.my, 1) + hook(B.x0, B.my, -1)
}
/** A door, and which way it opens: into the room or passage on that side of its wall. */
type Swung = MapDoor & { into?: 1 | -1 }
/**
 * The doors at the end of each corridor where the carriages are coupled, so one
 * may pass from the one to the other. Each opens inward, clear of the coupling.
 */
const gangways = computed<Swung[]>(() => {
  if (!plan.value || plan.value.style !== 'train') return []
  const [A, B] = carriages(plan.value)
  if (!A || !B) return []
  const size = plan.value.entrance.size
  const doors: Swung[] = [
    { x: A.x1, y: A.hy, wall: 'v', size, into: -1 },
    { x: B.x0, y: B.hy, wall: 'v', size, into: 1 },
  ]
  // Stood upright, as transpose() turns the rest of the plan.
  return narrow.value
    ? doors.map((d) => ({ ...d, x: d.y, y: d.x, wall: 'h' }))
    : doors
})
/** Half the arm of the X: big, but kept inside its room. */
function crossSize(r: Rect): number {
  return Math.max(5, Math.min(r.w, r.h) * 0.42)
}
function foundIn(id: RoomId) {
  return game.foundItems.filter((e) => e.room === id)
}
function isSearched(id: RoomId): boolean {
  return game.searchedRooms.includes(id)
}
function defIdOf(p: Placement): string | undefined {
  return p.char === undefined ? undefined : game.mystery?.cast[p.char]?.defId
}
function titleOf(p: Placement): string {
  if (!game.ctx) return ''
  if (p.kind === 'person' && p.char !== undefined) return game.mystery!.cast[p.char].shortName
  if (p.kind === 'glimpse' && p.attr) {
    return p.attr.kind === 'trait'
      ? `someone who ${traitLabel(game.ctx, p.attr.trait)}`
      : p.attr.sex === 'he'
        ? 'a man'
        : 'a woman'
  }
  return p.sound === 'crash' ? 'a crash' : 'a quarrel'
}
/** The mark a drawn thread leaves on a pin — never shown before it is drawn. */
function flagOf(p: Placement): 'bolt' | 'link' | null {
  let flag: 'bolt' | 'link' | null = null
  for (const id of p.noteIds) {
    const f = game.realizedFlags.get(id)
    if (f === 'contradiction' || f === 'proven') return 'bolt'
    if (f === 'link') flag = 'link'
  }
  return flag
}

const pct = (n: number, of: number) => `${(n / of) * 100}%`
function boxStyle(r: MapRoom) {
  const m = map.value!
  // The longest word of the name must fit the room: no breaking mid-word.
  const longest = Math.max(...roomLabel(r.id).split(/\s+/).map((w) => w.length))
  return {
    left: pct(r.x, m.width),
    top: pct(r.y, m.height),
    width: pct(r.w, m.width),
    height: pct(r.h, m.height),
    '--fit': `${((r.w / m.width) * 100) / (longest * 0.95 + 2)}cqw`,
  }
}

/** A door: the wall broken, and the leaf standing open. */
function doorGap(d: MapDoor): string {
  const half = d.size / 2
  return d.wall === 'h'
    ? `M${d.x - half} ${d.y}h${d.size}`
    : `M${d.x} ${d.y - half}v${d.size}`
}
function doorLeaf(d: Swung): string {
  const half = d.size / 2
  const leaf = d.size * 0.8
  // A door in a level wall opens upward unless told otherwise; one in an upright wall, to the right.
  const into = d.into ?? (d.wall === 'h' ? -1 : 1)
  const sweep = d.wall === 'h' ? (into < 0 ? 1 : 0) : into > 0 ? 1 : 0
  return d.wall === 'h'
    ? `M${d.x - half} ${d.y}v${into * leaf}a${d.size} ${d.size} 0 0 ${sweep} ${leaf} ${-into * leaf}`
    : `M${d.x} ${d.y - half}h${into * leaf}a${d.size} ${d.size} 0 0 ${sweep} ${-into * leaf} ${leaf}`
}

function choose(id: RoomId) {
  if (props.mode === 'pick') {
    if (isSearched(id)) return
    emit('pick', id)
    return
  }
  sfx('click')
  selected.value = selected.value === id ? null : id
}

const detail = computed(() => {
  const id = selected.value
  if (!id || !game.ctx) return null
  return {
    id,
    name: roomLabel(id),
    scene: id === scene.value || id === second.value,
    searched: isSearched(id),
    items: foundIn(id).map((e) => ({
      id: e.id,
      name: e.name,
      proves: describeEvidence(game.ctx!, e),
      probative: e.fact.kind !== 'flavor',
    })),
    placed: placedIn(id),
  }
})
</script>

<template>
  <div v-if="map" ref="host" class="manor" :class="[mode, { narrow }]">
    <div
      class="sheet"
      :style="{
        aspectRatio: `${map.width} / ${map.height}`,
        width:
          mode === 'photo'
            ? '100%'
            : `min(100%, calc((100dvh - ${mode === 'view' ? 21 : 15}rem) * ${map.width / map.height}))`,
      }"
    >
      <svg class="plan" :viewBox="`0 0 ${map.width} ${map.height}`" aria-hidden="true">
        <defs>
          <pattern id="mm-parquet" width="1.6" height="1.6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="1.6" height="1.6" fill="#1a2028" />
            <path d="M0 0v1.6" stroke="#212932" stroke-width="0.5" />
          </pattern>
          <pattern id="mm-tiles" width="2.4" height="2.4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="2.4" height="2.4" fill="#161b21" />
            <rect width="1.2" height="1.2" fill="#20262e" />
            <rect x="1.2" y="1.2" width="1.2" height="1.2" fill="#20262e" />
          </pattern>
          <pattern id="mm-glass" width="3" height="3" patternUnits="userSpaceOnUse">
            <rect width="3" height="3" fill="#16262a" />
            <path d="M0 0h3M0 0v3" stroke="#2c4a4c" stroke-width="0.3" />
          </pattern>
          <pattern id="mm-flags" width="4" height="2.4" patternUnits="userSpaceOnUse">
            <rect width="4" height="2.4" fill="#1a1d1c" />
            <path d="M0 0h4M0 1.2h4M1 0v1.2M3 1.2v1.2" stroke="#2a2f2c" stroke-width="0.2" />
          </pattern>
          <pattern id="mm-grounds" width="3" height="3" patternUnits="userSpaceOnUse">
            <rect width="3" height="3" fill="#0d1411" />
            <circle cx="0.8" cy="0.8" r="0.18" fill="#1b2a22" />
            <circle cx="2.3" cy="2.1" r="0.18" fill="#1b2a22" />
          </pattern>
          <pattern id="mm-fields" width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="#101610" />
            <path d="M0 3h6" stroke="#1a2418" stroke-width="0.4" />
            <circle cx="1.5" cy="1.2" r="0.2" fill="#1e2c1e" />
            <circle cx="4.5" cy="4.6" r="0.2" fill="#1e2c1e" />
          </pattern>
          <pattern id="mm-water" width="8" height="4" patternUnits="userSpaceOnUse">
            <rect width="8" height="4" fill="#0a1420" />
            <path d="M0 2.2c1.3-1 2.7-1 4 0s2.7 1 4 0" fill="none" stroke="#16283a" stroke-width="0.4" />
          </pattern>
          <pattern id="mm-lane" width="5" height="5" patternUnits="userSpaceOnUse">
            <rect width="5" height="5" fill="#1b1d18" />
            <circle cx="1.2" cy="1.5" r="0.3" fill="#2a2b24" />
            <circle cx="3.6" cy="3.8" r="0.3" fill="#2a2b24" />
          </pattern>
          <pattern id="mm-track" width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="4" height="4" fill="#12120f" />
            <circle cx="1" cy="1" r="0.25" fill="#22211c" />
            <circle cx="3" cy="3" r="0.25" fill="#22211c" />
          </pattern>
        </defs>

        <rect :width="map.width" :height="map.height" :fill="`url(#mm-${map.ground})`" />
        <!-- A ship has a hull round it; a train, its rails; a village, its street. -->
        <path v-if="map.style === 'boat' && plan" :d="hull(plan)" :transform="upright" class="hull" />
        <!-- The line runs on under the train, and past both ends of it, to the edge
             of the sheet; the sleepers slide by as it goes (still, with motion reduced). -->
        <clipPath id="mm-sheet">
          <rect x="3" y="3" :width="map.width - 6" :height="map.height - 6" />
        </clipPath>
        <g v-if="map.style === 'train' && plan" class="track" clip-path="url(#mm-sheet)">
          <g :transform="upright">
            <g v-for="(t, i) in tracks(plan)" :key="`track${i}`">
              <g class="sleepers"><path :d="t.sleepers" /></g>
              <path :d="t.rails" class="rail" />
            </g>
          </g>
        </g>
        <rect
          x="1.5"
          y="1.5"
          :width="map.width - 3"
          :height="map.height - 3"
          class="border"
        />

        <!-- A village's lanes are only trodden ground, and have no walls; a
             train's two carriages are joined by a coupling. -->
        <rect
          v-for="(h, i) in map.halls"
          :key="`h${i}`"
          :x="h.x"
          :y="h.y"
          :width="h.w"
          :height="h.h"
          :fill="map.style === 'village' ? 'url(#mm-lane)' : 'url(#mm-tiles)'"
          :class="{ lane: map.style === 'village' }"
        />
        <path
          v-if="map.style !== 'village'"
          v-for="(w, i) in passageWalls(map.halls)"
          :key="`w${i}`"
          :d="`M${w.x1} ${w.y1}L${w.x2} ${w.y2}`"
          class="wall passage"
        />
        <path v-if="map.style === 'train' && plan" :d="coupling(plan)" :transform="upright" class="coupling" />
        <rect
          v-for="r in map.rooms"
          :key="r.id"
          :x="r.x"
          :y="r.y"
          :width="r.w"
          :height="r.h"
          class="wall"
          :class="r.kind"
          :fill="
            r.kind === 'outdoor'
              ? 'url(#mm-flags)'
              : r.kind === 'glasshouse'
                ? 'url(#mm-glass)'
                : 'url(#mm-parquet)'
          "
        />
        <rect
          v-for="r in map.rooms.filter((r) => mode !== 'photo' && (r.id === scene || r.id === second))"
          :key="`scene-${r.id}`"
          :x="r.x"
          :y="r.y"
          :width="r.w"
          :height="r.h"
          class="scene-wash"
        />

        <g v-for="r in map.rooms" :key="`d-${r.id}`">
          <path :d="doorGap(r.door)" class="gap" />
          <path :d="doorLeaf(r.door)" class="leaf" />
        </g>
        <path :d="doorGap(map.entrance)" class="gap" />
        <path :d="doorLeaf(map.entrance)" class="leaf" />
        <g v-for="(d, i) in gangways" :key="`gangway${i}`">
          <path :d="doorGap(d)" class="gap" />
          <path :d="doorLeaf(d)" class="leaf" />
        </g>

        <!-- On the photograph, the scene crossed out in marker. -->
        <g
          v-for="r in map.rooms.filter((r) => mode === 'photo' && r.id === scene)"
          :key="`x-${r.id}`"
          class="cross"
          :transform="`translate(${r.x + r.w / 2} ${r.y + r.h / 2}) rotate(-6)`"
        >
          <path :d="`M${-crossSize(r)} ${-crossSize(r) * 0.9}L${crossSize(r)} ${crossSize(r)}`" />
          <path :d="`M${crossSize(r) * 0.95} ${-crossSize(r)}L${-crossSize(r)} ${crossSize(r) * 0.92}`" />
        </g>

        <g :transform="`translate(${map.width - 9} ${map.height - 9})`" class="compass">
          <circle r="4.2" />
          <path d="M0 -3.4 1.3 0 0 3.4 -1.3 0z" />
          <path d="M0 -3.4 1.3 0 -1.3 0z" class="north" />
        </g>
      </svg>

      <component
        :is="mode === 'pick' && isSearched(r.id) ? 'div' : 'button'"
        v-for="r in mode === 'photo' ? [] : map.rooms"
        :key="r.id"
        class="room"
        :class="{
          scene: r.id === scene || r.id === second,
          searched: isSearched(r.id),
          selected: selected === r.id,
          outdoor: r.kind === 'outdoor',
        }"
        :style="boxStyle(r)"
        :data-room="r.id"
        :aria-label="`${roomLabel(r.id)}${r.id === scene ? ', the scene of the crime' : r.id === second ? ', where the second body was found' : ''}${isSearched(r.id) ? ', searched' : ''}`"
        @click="choose(r.id)"
      >
        <span class="name">{{ roomLabel(r.id) }}</span>
        <span v-if="r.id === scene || r.id === second || isSearched(r.id) || foundIn(r.id).length > 0" class="marks">
          <span v-if="r.id === second" class="mark scene-mark" title="Where the second body was found">
            <Icon name="dagger" />
          </span>
          <span v-if="r.id === scene" class="mark scene-mark" title="The scene of the crime">
            <Icon name="dagger" />
          </span>
          <span v-if="isSearched(r.id)" class="mark" title="Searched">
            <Icon name="search" />
          </span>
          <span v-if="foundIn(r.id).length > 0" class="mark find" :title="`${foundIn(r.id).length} found here`">
            <Icon name="gem" />{{ foundIn(r.id).length }}
          </span>
        </span>
        <span class="pins">
          <span
            v-for="p in placedIn(r.id)"
            :key="p.key"
            class="pin"
            :class="p.kind"
            :title="`${titleOf(p)}\n${p.accounts.join('\n')}`"
          >
            <Portrait v-if="p.kind === 'person'" :who="defIdOf(p)" shape="token" size="100%" />
            <span v-else-if="p.kind === 'glimpse'" class="anon"><Icon name="eye" /></span>
            <span v-else class="anon"><Icon name="ear" /></span>
            <span v-if="flagOf(p)" class="badge" :class="flagOf(p)!">
              <Icon :name="flagOf(p)!" />
            </span>
          </span>
        </span>
      </component>
    </div>

    <div v-if="mode === 'view'" class="detail" aria-live="polite">
      <template v-if="detail">
        <h4>
          {{ detail.name }}
          <span v-if="detail.scene" class="tag danger">the scene of the crime</span>
          <span class="tag">{{ detail.searched ? 'searched' : 'not yet searched' }}</span>
        </h4>
        <p v-if="detail.items.length === 0 && detail.placed.length === 0" class="muted small">
          Your notes put nothing and no one here.
        </p>
        <ul v-if="detail.items.length > 0">
          <li v-for="e in detail.items" :key="e.id" :class="{ brass: e.probative }">
            <ItemArt :item="e.id" size="1.7rem" /> {{ e.name }} <span class="muted">— {{ e.proves }}</span>
          </li>
        </ul>
        <ul v-if="detail.placed.length > 0">
          <li v-for="p in detail.placed" :key="p.key">
            <strong>{{ titleOf(p) }}</strong>
            <Icon v-if="flagOf(p)" :name="flagOf(p)!" class="brass" />
            <div v-for="(a, i) in p.accounts" :key="i" class="muted small account">{{ a }}</div>
          </li>
        </ul>
      </template>
      <p v-else class="muted small hint">
        Pins show where your notes place people — and on whose word. Choose a room to read them.
      </p>
    </div>
  </div>
</template>

<style scoped>
.manor {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}
.sheet {
  /* Names and pins are sized against the drawn plan, not the space round it. */
  container-type: inline-size;
  position: relative;
  align-self: center;
  min-width: min(100%, 20rem);
  border: 1px solid var(--brass-dim);
  box-shadow:
    inset 0 0 0 3px rgba(11, 14, 18, 0.9),
    var(--shadow);
  background: #0d1411;
}
.plan {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.border {
  fill: none;
  stroke: var(--brass-dim);
  stroke-width: 0.3;
  stroke-dasharray: 1.5 1;
}
.wall {
  stroke: #cdbf95;
  stroke-width: 0.9;
  stroke-linejoin: miter;
}
.wall.passage {
  fill: none;
  stroke-linecap: square;
}
.wall.glasshouse {
  stroke: #9fc6c0;
}
.wall.outdoor {
  stroke: #8a8f86;
  stroke-width: 0.6;
  stroke-dasharray: 2 1.2;
}
.cross path {
  fill: none;
  stroke: #d0352a;
  stroke-width: 3.2;
  stroke-linecap: round;
  opacity: 0.9;
}
/* A photograph does not move, and needs no frame of its own. */
.photo .sleepers {
  animation: none;
}
.photo .sheet {
  border: 0;
  box-shadow: none;
  min-width: 0;
}
.scene-wash {
  fill: rgba(192, 71, 60, 0.2);
  pointer-events: none;
}
.gap {
  stroke: #1a2028;
  stroke-width: 1.4;
}
.leaf {
  fill: none;
  stroke: #cdbf95;
  stroke-width: 0.35;
  opacity: 0.7;
}
.compass circle {
  fill: rgba(11, 14, 18, 0.7);
  stroke: var(--brass-dim);
  stroke-width: 0.3;
}
.compass path {
  fill: var(--brass-dim);
}
.compass .north {
  fill: var(--brass);
}

.room {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 0.2cqw;
  padding: 0.9cqw 0.5cqw 0.5cqw;
  margin: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  color: var(--ink);
  font: inherit;
  overflow: hidden;
  text-align: center;
}
button.room {
  cursor: pointer;
}
button.room:hover:not(:disabled),
button.room:focus-visible {
  transform: none;
  background: rgba(212, 175, 74, 0.13);
  box-shadow: inset 0 0 0 2px var(--brass);
}
.room.selected {
  background: rgba(212, 175, 74, 0.16);
  box-shadow: inset 0 0 0 2px var(--brass);
}
.pick .room.searched {
  opacity: 0.55;
  background: repeating-linear-gradient(
    -45deg,
    rgba(0, 0, 0, 0.35) 0 0.5rem,
    transparent 0.5rem 1rem
  );
}
.name {
  font-family: var(--font-display);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: clamp(0.4rem, min(2.5cqw, var(--fit)), 1.05rem);
  line-height: 1.1;
  text-shadow: 0 1px 3px #000;
}
.narrow .name {
  font-size: clamp(0.4rem, min(3.4cqw, var(--fit)), 0.8rem);
}
.room.scene .name {
  color: #f0b0a8;
}
.marks {
  display: inline-flex;
  gap: 0.35rem;
  align-items: center;
  font-size: clamp(0.6rem, 2cqw, 0.9rem);
  color: var(--muted);
}
.mark {
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;
}
.scene-mark {
  color: #ee7c6f;
  font-size: 1.35em;
}
.mark.find {
  color: var(--brass);
}
.pins {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.6cqw;
  margin-top: auto;
  margin-bottom: auto;
}
.pin {
  position: relative;
  width: clamp(1.4rem, 5.6cqw, 2.7rem);
  aspect-ratio: 1;
  animation: drop 0.45s cubic-bezier(0.2, 1.4, 0.4, 1) both;
}
.anon {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 1.5px dashed var(--muted);
  background: rgba(11, 14, 18, 0.8);
  color: var(--muted);
  font-size: clamp(0.7rem, 2.8cqw, 1.3rem);
}
.badge {
  position: absolute;
  right: -0.25rem;
  top: -0.25rem;
  display: grid;
  place-items: center;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  font-size: 0.65rem;
  background: var(--bg);
  border: 1px solid currentColor;
}
.badge.bolt {
  color: var(--brass);
}
.badge.link {
  color: var(--good);
}
@keyframes drop {
  from {
    opacity: 0;
    transform: translateY(-14px) scale(1.3);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.detail {
  min-height: 4.5rem;
  padding: 0.7rem 0.9rem;
  border: 1px solid var(--line);
  background: rgba(14, 18, 23, 0.85);
}
.detail h4 {
  margin: 0 0 0.4rem;
  font-size: 1.05rem;
  text-transform: uppercase;
  color: var(--brass);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: baseline;
}
.tag {
  font-family: var(--font-body);
  font-size: 0.75rem;
  letter-spacing: 0.04em;
  text-transform: none;
  color: var(--muted);
  font-style: italic;
}
.tag.danger {
  color: #f0b0a8;
}
.detail ul {
  margin: 0.3rem 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.35rem;
  font-size: 0.92rem;
}
.account {
  padding-left: 0.8rem;
}
.hint {
  margin: 0;
  font-style: italic;
}
.hull {
  fill: #1c1a16;
  stroke: #6b5a33;
  stroke-width: 1.2;
}
.sleepers {
  fill: #2c2820;
  /* The train runs toward its engine, at the head of the line: the ground goes the other way. */
  animation: sleepers 0.35s linear infinite;
}
.rail {
  fill: none;
  stroke: #4a4436;
  stroke-width: 0.7;
}
@keyframes sleepers {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(4px);
  }
}
.lane {
  opacity: 0.9;
}
.coupling {
  fill: none;
  stroke: #8a7a4a;
  stroke-width: 1.4;
  stroke-linejoin: round;
}
</style>

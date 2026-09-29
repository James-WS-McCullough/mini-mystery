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
} from '../ui/manorMap'
import { placementsFrom, type Placement } from '../ui/placements'
import Icon from './Icon.vue'
import ItemArt from './ItemArt.vue'
import Portrait from './Portrait.vue'

const props = withDefaults(defineProps<{ mode?: 'pick' | 'view' }>(), { mode: 'view' })
const emit = defineEmits<{ (e: 'pick', room: RoomId): void }>()

const game = useGame()
const host = ref<HTMLElement | null>(null)
const narrow = ref(false)
const selected = ref<RoomId | null>(null)

let observer: ResizeObserver | undefined
onMounted(() => {
  if (!host.value || typeof ResizeObserver === 'undefined') return
  observer = new ResizeObserver(([entry]) => {
    narrow.value = entry.contentRect.width < 560
  })
  observer.observe(host.value)
})
onBeforeUnmount(() => observer?.disconnect())

const map = computed(() => {
  if (!game.mystery || !game.ctx) return null
  const plan = generateManor(
    game.mystery.seed,
    game.ctx.pack.rooms.map((r) => ({ id: r.id, kind: r.kind })),
  )
  return narrow.value ? transpose(plan) : plan
})

const scene = computed(() => game.mystery?.caseSheet.sceneRoom)
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
function doorLeaf(d: MapDoor): string {
  const half = d.size / 2
  return d.wall === 'h'
    ? `M${d.x - half} ${d.y}v${-d.size * 0.8}a${d.size} ${d.size} 0 0 1 ${d.size * 0.8} ${d.size * 0.8}`
    : `M${d.x} ${d.y - half}h${d.size * 0.8}a${d.size} ${d.size} 0 0 1 ${-d.size * 0.8} ${d.size * 0.8}`
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
    scene: id === scene.value,
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
        width: `min(100%, calc((100dvh - ${mode === 'view' ? 21 : 15}rem) * ${map.width / map.height}))`,
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
          <pattern id="mm-lawn" width="3" height="3" patternUnits="userSpaceOnUse">
            <rect width="3" height="3" fill="#0d1411" />
            <circle cx="0.8" cy="0.8" r="0.18" fill="#1b2a22" />
            <circle cx="2.3" cy="2.1" r="0.18" fill="#1b2a22" />
          </pattern>
        </defs>

        <rect :width="map.width" :height="map.height" fill="url(#mm-lawn)" />
        <rect
          x="1.5"
          y="1.5"
          :width="map.width - 3"
          :height="map.height - 3"
          class="border"
        />

        <rect
          v-for="(h, i) in map.halls"
          :key="`h${i}`"
          :x="h.x"
          :y="h.y"
          :width="h.w"
          :height="h.h"
          fill="url(#mm-tiles)"
        />
        <!-- Walls only where a passage meets a room or the grounds: where two
             passages meet, the way is open. -->
        <path
          v-for="(w, i) in passageWalls(map.halls)"
          :key="`w${i}`"
          :d="`M${w.x1} ${w.y1}L${w.x2} ${w.y2}`"
          class="wall passage"
        />
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
          v-for="r in map.rooms.filter((r) => r.id === scene)"
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

        <g :transform="`translate(${map.width - 9} ${map.height - 9})`" class="compass">
          <circle r="4.2" />
          <path d="M0 -3.4 1.3 0 0 3.4 -1.3 0z" />
          <path d="M0 -3.4 1.3 0 -1.3 0z" class="north" />
        </g>
      </svg>

      <component
        :is="mode === 'pick' && isSearched(r.id) ? 'div' : 'button'"
        v-for="r in map.rooms"
        :key="r.id"
        class="room"
        :class="{
          scene: r.id === scene,
          searched: isSearched(r.id),
          selected: selected === r.id,
          outdoor: r.kind === 'outdoor',
        }"
        :style="boxStyle(r)"
        :data-room="r.id"
        :aria-label="`${roomLabel(r.id)}${r.id === scene ? ', the scene of the crime' : ''}${isSearched(r.id) ? ', searched' : ''}`"
        @click="choose(r.id)"
      >
        <span class="name">{{ roomLabel(r.id) }}</span>
        <span v-if="r.id === scene || isSearched(r.id) || foundIn(r.id).length > 0" class="marks">
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
</style>

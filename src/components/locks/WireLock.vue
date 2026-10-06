<script setup lang="ts">
// An electric lock, its wires pulled loose: numbered brass terminals in pairs
// on a board, each pair to be joined by a wire drawn square by square, round
// the components fixed to the board. No two wires may cross or share a square,
// and every free square must carry one. Drawing back along a wire takes it up;
// starting again from a terminal lays it afresh. The lock never holds for good:
// it gives when every pair is joined and no square is left bare.
import { computed, ref, useId } from 'vue'
import { sfx } from '../../ui/audio'
import { besideOf, wireBoard, type Part } from '../../ui/wiring'
import LockPlate from './LockPlate.vue'
import TrySlip from './TrySlip.vue'

const props = defineProps<{ seed: number }>()
const emit = defineEmits<{ (e: 'solved'): void; (e: 'failed'): void }>()

const board = wireBoard(props.seed)
const N = board.size
defineExpose({ board })
/** The flex of each pair: red, blue, green, gold, violet, ivory, each with its number for the colour-blind. */
const FLEX = [
  { fill: '#c0392b', dark: '#6e1d15', ink: '#fff4ef' },
  { fill: '#2f6db5', dark: '#173a63', ink: '#eef4ff' },
  { fill: '#3f8f4a', dark: '#1d4a24', ink: '#effbef' },
  { fill: '#d9a521', dark: '#6e5110', ink: '#241a04' },
  { fill: '#7d4fb0', dark: '#3f2560', ink: '#f6efff' },
  { fill: '#e8e2d0', dark: '#7a7260', ink: '#2a241a' },
]

/** Which pair a terminal belongs to, by its square. */
const terminal = new Map<number, number>()
board.pairs.forEach(([a, z], i) => {
  terminal.set(a, i)
  terminal.set(z, i)
})
/** Each pair's wire as laid so far, square by square from the terminal it was begun at. */
const wires = ref<number[][]>(board.pairs.map(() => []))
const joined = (i: number) => {
  const w = wires.value[i]
  const [a, z] = board.pairs[i]
  return w.length >= 2 && ((w[0] === a && w[w.length - 1] === z) || (w[0] === z && w[w.length - 1] === a))
}
const joinedCount = computed(() => board.pairs.filter((_, i) => joined(i)).length)
/** The squares the components take: no wire goes there. */
const fixed = new Set(board.parts.flatMap((p) => p.cells))
const free = N * N - fixed.size
/** Free squares no wire runs through yet. */
const bare = computed(() => free - new Set(wires.value.flat()).size)
const done = ref(false)
/** Whose wire lies in a square, if anyone's. */
function ownerOf(cell: number): number {
  return wires.value.findIndex((w) => w.includes(cell))
}

// ---------- drawing ----------

const panel = ref<HTMLElement | null>(null)
/** The pair whose wire is being drawn. */
const active = ref<number | null>(null)
function cellAt(e: PointerEvent): number | null {
  const box = panel.value?.getBoundingClientRect()
  if (!box) return null
  const c = Math.floor(((e.clientX - box.left) / box.width) * N)
  const r = Math.floor(((e.clientY - box.top) / box.height) * N)
  return c < 0 || r < 0 || c >= N || r >= N ? null : r * N + c
}
function set(i: number, w: number[]) {
  wires.value = wires.value.map((x, j) => (j === i ? w : x))
}

function press(e: PointerEvent) {
  if (done.value) return
  const cell = cellAt(e)
  if (cell === null) return
  const t = terminal.get(cell)
  if (t !== undefined) {
    // From a terminal: its wire laid afresh.
    set(t, [cell])
    active.value = t
  } else {
    // From the middle or the end of a wire: taken up as far as here, and drawn on.
    const i = ownerOf(cell)
    if (i < 0) return
    set(i, wires.value[i].slice(0, wires.value[i].indexOf(cell) + 1))
    active.value = i
  }
  panel.value?.setPointerCapture(e.pointerId)
  sfx('type')
}
/** One square on from the end of the wire being drawn; or back, where it is the square before. Whether it went. */
function step(i: number, next: number): boolean {
  const w = wires.value[i]
  const end = w[w.length - 1]
  if (!besideOf(end, N).includes(next)) return false
  // Back over itself: taken up.
  if (w.length >= 2 && next === w[w.length - 2]) {
    set(i, w.slice(0, -1))
    sfx('type')
    return true
  }
  if (w.includes(next)) {
    set(i, w.slice(0, w.indexOf(next) + 1))
    return true
  }
  // Joined already: it goes no further.
  if (joined(i)) return false
  const t = terminal.get(next)
  if (t !== undefined && t !== i) return false
  if (t === undefined && (fixed.has(next) || ownerOf(next) >= 0)) return false
  set(i, [...w, next])
  if (joined(i)) sfx('spark')
  else sfx('type')
  return true
}
function move(e: PointerEvent) {
  const i = active.value
  if (i === null) return
  const cell = cellAt(e)
  if (cell === null) return
  // (A quick hand jumps squares: go square by square towards it, the longer way first.)
  for (let guard = 0; guard < N * 2; guard++) {
    const w = wires.value[i]
    const end = w[w.length - 1]
    if (end === cell) return
    const dr = Math.floor(cell / N) - Math.floor(end / N)
    const dc = (cell % N) - (end % N)
    const next = Math.abs(dr) >= Math.abs(dc) ? end + Math.sign(dr) * N : end + Math.sign(dc)
    if (!step(i, next)) return
  }
}
function release() {
  if (active.value === null) return
  active.value = null
  if (!done.value && joinedCount.value === board.pairs.length && bare.value === 0) {
    done.value = true
    emit('solved')
  }
}
function clearAll() {
  if (done.value) return
  sfx('click')
  wires.value = board.pairs.map(() => [])
}

// ---------- drawn ----------

const centre = (cell: number) => `${(cell % N) + 0.5},${Math.floor(cell / N) + 0.5}`
const lines = computed(() =>
  wires.value.map((w, i) => ({ i, points: w.map(centre).join(' '), flex: FLEX[i] })).filter((l) => wires.value[l.i].length >= 2),
)
/** A component drawn in its square (or its two, laid along or across the board). */
function placeOf(p: Part) {
  const [a, b] = [Math.min(...p.cells), Math.max(...p.cells)]
  const x = a % N
  const y = Math.floor(a / N)
  // (Drawn lying along a row; turned a quarter about where it stands down a column.)
  return p.cells.length === 2 && b - a === N ? `translate(${x + 1},${y}) rotate(90)` : `translate(${x},${y})`
}
/** For the gradients' names: each lock on the page its own. */
const uid = useId()
const posts = computed(() =>
  board.pairs.flatMap(([a, z], i) => [a, z].map((cell) => ({ cell, i, flex: FLEX[i], joined: joined(i) }))),
)
</script>

<template>
  <div class="wire-lock">
    <LockPlate metal="bakelite" :open="done">
      <div
        ref="panel"
        class="panel"
        :class="{ drawing: active !== null }"
        :style="{ '--n': N }"
        role="application"
        :aria-label="`An electric lock: ${board.pairs.length} pairs of numbered terminals to join with wires that do not cross, filling every free square. ${joinedCount} joined, ${bare} squares bare.`"
        @pointerdown="press"
        @pointermove="move"
        @pointerup="release"
        @pointercancel="release"
      >
        <span v-for="c in N * N" :key="c" class="hole" :class="{ under: fixed.has(c - 1) }" aria-hidden="true" />
        <svg class="wires" :viewBox="`0 0 ${N} ${N}`" aria-hidden="true">
          <g v-for="l in lines" :key="l.i">
            <polyline :points="l.points" :stroke="l.flex.dark" stroke-width="0.42" />
            <polyline :points="l.points" :stroke="l.flex.fill" stroke-width="0.32" />
            <polyline :points="l.points" stroke="#fff" stroke-width="0.07" opacity="0.28" />
          </g>
        </svg>
        <svg class="parts" :viewBox="`0 0 ${N} ${N}`" aria-hidden="true">
          <defs>
            <radialGradient :id="`${uid}glass`" cx="0.4" cy="0.35" r="0.7">
              <stop offset="0" stop-color="#f4f1e6" stop-opacity="0.55" />
              <stop offset="1" stop-color="#7d8a8c" stop-opacity="0.35" />
            </radialGradient>
            <linearGradient :id="`${uid}copper`" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#e3a066" />
              <stop offset="0.5" stop-color="#b8692f" />
              <stop offset="1" stop-color="#6e3613" />
            </linearGradient>
            <linearGradient :id="`${uid}brass`" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#f0d98a" />
              <stop offset="1" stop-color="#8a7423" />
            </linearGradient>
          </defs>
          <g v-for="(p, k) in board.parts" :key="k" :transform="placeOf(p)">
            <!-- A thermionic valve: a glass bulb on its base, the filament aglow. -->
            <template v-if="p.kind === 'valve'">
              <rect x="0.3" y="0.7" width="0.4" height="0.17" rx="0.03" fill="#2b1d12" stroke="#5a4630" stroke-width="0.02" />
              <rect x="0.43" y="0.3" width="0.14" height="0.36" fill="#55585b" />
              <circle cx="0.5" cy="0.5" r="0.09" fill="#ffb04a" opacity="0.85" />
              <ellipse cx="0.5" cy="0.43" rx="0.25" ry="0.31" :fill="`url(#${uid}glass)`" stroke="#c9cfd0" stroke-opacity="0.5" stroke-width="0.02" />
            </template>
            <!-- A cartridge fuse: a glass tube between brass caps, the fuse wire through it. -->
            <template v-else-if="p.kind === 'fuse'">
              <rect x="0.16" y="0.37" width="0.68" height="0.26" rx="0.1" :fill="`url(#${uid}glass)`" stroke="#c9cfd0" stroke-opacity="0.5" stroke-width="0.02" />
              <line x1="0.26" y1="0.5" x2="0.74" y2="0.5" stroke="#d6d6d6" stroke-width="0.025" />
              <rect x="0.1" y="0.34" width="0.16" height="0.32" rx="0.03" :fill="`url(#${uid}brass)`" />
              <rect x="0.74" y="0.34" width="0.16" height="0.32" rx="0.03" :fill="`url(#${uid}brass)`" />
            </template>
            <!-- A coil: copper wound on a bobbin. -->
            <template v-else-if="p.kind === 'coil'">
              <rect x="0.17" y="0.22" width="0.66" height="0.08" rx="0.02" fill="#3a2a1a" />
              <rect x="0.17" y="0.7" width="0.66" height="0.08" rx="0.02" fill="#3a2a1a" />
              <rect x="0.22" y="0.3" width="0.56" height="0.4" :fill="`url(#${uid}copper)`" />
              <line v-for="n in 6" :key="n" :x1="0.22 + n * 0.08" y1="0.3" :x2="0.18 + n * 0.08" y2="0.7" stroke="#5c2a0c" stroke-opacity="0.55" stroke-width="0.025" />
            </template>
            <!-- A resistor: leads, and a body banded in its colours. -->
            <template v-else-if="p.kind === 'resistor'">
              <line x1="0.12" y1="0.5" x2="1.88" y2="0.5" stroke="#b8b8b8" stroke-width="0.05" />
              <rect x="0.45" y="0.33" width="1.1" height="0.34" rx="0.15" fill="#cdb98e" stroke="#7a6844" stroke-width="0.02" />
              <rect x="0.66" y="0.33" width="0.08" height="0.34" fill="#6b3a1f" />
              <rect x="0.84" y="0.33" width="0.08" height="0.34" fill="#1d1a16" />
              <rect x="1.02" y="0.33" width="0.08" height="0.34" fill="#b3202a" />
              <rect x="1.32" y="0.33" width="0.08" height="0.34" fill="#c9a94e" />
            </template>
            <!-- A knife switch: a slate base, brass clips, the blade thrown open. -->
            <template v-else>
              <rect x="0.1" y="0.24" width="1.8" height="0.52" rx="0.06" fill="#3b3833" stroke="#5f5a52" stroke-width="0.02" />
              <rect x="0.28" y="0.4" width="0.14" height="0.2" rx="0.02" :fill="`url(#${uid}brass)`" />
              <rect x="1.5" y="0.4" width="0.14" height="0.2" rx="0.02" :fill="`url(#${uid}brass)`" />
              <line x1="0.35" y1="0.5" x2="1.42" y2="0.33" stroke="#e6cd7c" stroke-width="0.08" stroke-linecap="round" />
              <circle cx="1.5" cy="0.32" r="0.1" fill="#1d1a16" stroke="#6b6359" stroke-width="0.02" />
            </template>
          </g>
        </svg>
        <span
          v-for="p in posts"
          :key="p.cell"
          class="post"
          :class="{ joined: p.joined }"
          :style="{ '--row': Math.floor(p.cell / N), '--col': p.cell % N, '--flex': p.flex.fill, '--dark': p.flex.dark, '--ink': p.flex.ink }"
          aria-hidden="true"
        >
          {{ p.i + 1 }}
        </span>
      </div>
      <div class="foot">
        <span class="count" aria-live="polite">
          {{ joinedCount }} of {{ board.pairs.length }} joined<template v-if="joinedCount === board.pairs.length && bare > 0">, {{ bare }} {{ bare === 1 ? 'square' : 'squares' }} bare</template>
        </span>
        <button class="ghost small clear" :disabled="done" @click="clearAll()">Clear the wires</button>
      </div>
    </LockPlate>
    <TrySlip>
      <template #key>
        <span>Join each terminal to its twin, round the components.</span>
        <span>No crossing, and no square left bare.</span>
        <span>Draw back over a wire to take it up.</span>
      </template>
    </TrySlip>
  </div>
</template>

<style scoped>
.wire-lock {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 22rem;
  margin: 0 auto;
}
/* The terminal board: black panel, a hole at every square. */
.panel {
  position: relative;
  display: grid;
  grid-template-columns: repeat(var(--n), 1fr);
  grid-template-rows: repeat(var(--n), 1fr);
  width: min(100%, 17rem);
  aspect-ratio: 1;
  margin: 0 auto;
  border-radius: 4px;
  background: radial-gradient(ellipse at 50% 30%, #23201c, #12100d);
  box-shadow:
    inset 0 2px 6px rgba(0, 0, 0, 0.8),
    0 0 0 2px #a8893a;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  cursor: crosshair;
}
.hole {
  place-self: center;
  width: 0.32rem;
  height: 0.32rem;
  border-radius: 50%;
  background: #050403;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.08);
}
.hole.under {
  visibility: hidden;
}
.wires {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}
.parts {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.wires polyline {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}
/* A terminal: a brass post, the flex's colour round it and its number on it. */
.post {
  position: absolute;
  left: calc((var(--col) + 0.5) * 100% / var(--n));
  top: calc((var(--row) + 0.5) * 100% / var(--n));
  width: calc(100% / var(--n) * 0.74);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, var(--flex), var(--dark) 85%);
  box-shadow:
    0 0 0 2px #c9a94e,
    0 2px 4px rgba(0, 0, 0, 0.7);
  color: var(--ink);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 0.95rem;
  pointer-events: none;
  transition: box-shadow 0.25s;
}
.post.joined {
  box-shadow:
    0 0 0 2px #f0d98a,
    0 0 10px 2px rgba(240, 217, 138, 0.55),
    0 2px 4px rgba(0, 0, 0, 0.7);
}
.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: min(100%, 17rem);
  margin: 0.7rem auto 0;
}
.count {
  font-family: var(--font-display);
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #e9dfc4;
}
.clear {
  padding: 0.2rem 0.6rem;
  font-size: 0.8rem;
  color: #e9dfc4;
}
</style>

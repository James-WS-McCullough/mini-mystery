<script setup lang="ts">
// An electric lock, its wires pulled loose: numbered brass terminals in pairs
// on a board, each pair to be joined by a wire drawn square by square. No two
// wires may cross or share a square. Drawing back along a wire takes it up;
// starting again from a terminal lays it afresh. The lock never holds for good:
// it gives when every pair is joined.
import { computed, ref } from 'vue'
import { sfx } from '../../ui/audio'
import { besideOf, wireBoard } from '../../ui/wiring'
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
  if (t === undefined && ownerOf(next) >= 0) return false
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
  if (!done.value && joinedCount.value === board.pairs.length) {
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
        :aria-label="`An electric lock: ${board.pairs.length} pairs of numbered terminals to join with wires that do not cross. ${joinedCount} joined.`"
        @pointerdown="press"
        @pointermove="move"
        @pointerup="release"
        @pointercancel="release"
      >
        <span v-for="c in N * N" :key="c" class="hole" aria-hidden="true" />
        <svg class="wires" :viewBox="`0 0 ${N} ${N}`" aria-hidden="true">
          <g v-for="l in lines" :key="l.i">
            <polyline :points="l.points" :stroke="l.flex.dark" stroke-width="0.42" />
            <polyline :points="l.points" :stroke="l.flex.fill" stroke-width="0.32" />
            <polyline :points="l.points" stroke="#fff" stroke-width="0.07" opacity="0.28" />
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
        <span class="count" aria-live="polite">{{ joinedCount }} of {{ board.pairs.length }} joined</span>
        <button class="ghost small clear" :disabled="done" @click="clearAll()">Clear the wires</button>
      </div>
    </LockPlate>
    <TrySlip>
      <template #key>
        <span>Drag a wire from each terminal to its twin.</span>
        <span>No two may cross. Draw back over a wire to take it up.</span>
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
.wires {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
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

<script setup lang="ts">
// A cabinet latch of lamps, Lights Out's rules on a 4x4 grid. Always solvable.
import { ref } from 'vue'

const props = defineProps<{ seed: number }>()
const emit = defineEmits<{ (e: 'solved'): void; (e: 'failed'): void }>()

function mulberry32(a: number) {
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const N = 4
function flip(b: boolean[], i: number) {
  const r = Math.floor(i / N)
  const c = i % N
  b[i] = !b[i]
  if (r > 0) b[i - N] = !b[i - N]
  if (r < N - 1) b[i + N] = !b[i + N]
  if (c > 0) b[i - 1] = !b[i - 1]
  if (c < N - 1) b[i + 1] = !b[i + 1]
}

// From a solved board, 6 to 9 seeded taps; if fewer than four lamps ended up lit, keep tapping.
function makeBoard(seed: number) {
  const rand = mulberry32(seed)
  const b: boolean[] = Array(N * N).fill(false)
  const taps = 6 + Math.floor(rand() * 4)
  for (let k = 0; k < taps; k++) flip(b, Math.floor(rand() * N * N))
  for (let guard = 0; b.filter(Boolean).length < 4 && guard < 200; guard++) flip(b, Math.floor(rand() * N * N))
  return b
}

const lamps = ref<boolean[]>(makeBoard(props.seed))
const moves = ref(0)
const solved = ref(false)

function tap(i: number) {
  if (solved.value) return
  const b = [...lamps.value]
  flip(b, i)
  lamps.value = b
  moves.value++
  if (!b.some(Boolean)) {
    solved.value = true
    emit('solved')
  }
}
</script>

<template>
  <div class="latch">
    <div class="board">
      <button
        v-for="(on, i) in lamps"
        :key="i"
        class="lamp"
        :class="{ on }"
        :aria-label="`Lamp ${i + 1}, ${on ? 'lit' : 'dark'}`"
        :aria-pressed="on"
        @click="tap(i)"
      />
    </div>
    <p class="moves">Moves {{ moves }}</p>
  </div>
</template>

<style scoped>
.latch {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}
.board {
  display: grid;
  grid-template-columns: repeat(4, 3.6rem);
  gap: 0.5rem;
  padding: 0.7rem;
  border: 1px solid var(--line);
  background: rgba(0, 0, 0, 0.25);
  box-shadow: var(--shadow);
}
.lamp {
  width: 3.6rem;
  height: 3.6rem;
  padding: 0;
  border-radius: 50%;
  border: 1px solid var(--brass-dim);
  background: rgba(0, 0, 0, 0.6);
  cursor: pointer;
  transition:
    background 0.2s,
    box-shadow 0.2s;
}
.lamp.on {
  background: var(--brass);
  border-color: var(--brass);
  box-shadow: 0 0 14px 3px rgba(212, 175, 74, 0.55);
}
.moves {
  margin: 0;
  font-family: var(--font-display);
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
}
</style>

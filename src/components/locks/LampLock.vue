<script setup lang="ts">
// A cabinet latch of lamps, Lights Out's rules on a 4x4 grid, played to light
// them all: the latch gives when every lamp is lit. Always solvable.
import { computed, ref } from 'vue'
import { sfx } from '../../ui/audio'
import LockPlate from './LockPlate.vue'
import TrySlip from './TrySlip.vue'

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

// From a solved board (every lamp lit), 6 to 9 seeded taps; if fewer than four lamps went dark, keep tapping.
function makeBoard(seed: number) {
  const rand = mulberry32(seed)
  const b: boolean[] = Array(N * N).fill(true)
  const taps = 6 + Math.floor(rand() * 4)
  for (let k = 0; k < taps; k++) flip(b, Math.floor(rand() * N * N))
  for (let guard = 0; b.filter((on) => !on).length < 4 && guard < 200; guard++) flip(b, Math.floor(rand() * N * N))
  return b
}

const lamps = ref<boolean[]>(makeBoard(props.seed))
const moves = ref(0)
const lit = computed(() => lamps.value.filter(Boolean).length)
const solved = ref(false)

function tap(i: number) {
  if (solved.value) return
  const b = [...lamps.value]
  flip(b, i)
  lamps.value = b
  moves.value++
  sfx('click')
  if (b.every(Boolean)) {
    solved.value = true
    emit('solved')
  }
}
</script>

<template>
  <div class="latch">
    <LockPlate metal="walnut" :open="solved">
      <div class="board">
        <button
          v-for="(on, i) in lamps"
          :key="i"
          class="lamp"
          :class="{ on }"
          :aria-label="`Lamp ${i + 1}, ${on ? 'lit' : 'dark'}`"
          :aria-pressed="on"
          @click="tap(i)"
        >
          <span class="glass" />
        </button>
      </div>
      <p class="lit">{{ lit }} of {{ N * N }} lit</p>
    </LockPlate>
    <TrySlip>
      <template #key>
        <span><i class="cross" aria-hidden="true"><b /><b class="on" /><b /><b class="on" /><b class="on" /><b class="on" /><b /><b class="on" /><b /></i> a lamp turns itself and those beside it</span>
      </template>
    </TrySlip>
  </div>
</template>

<style scoped>
.latch {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 22rem;
  margin: 0 auto;
}
.board {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.6rem;
  width: min(100%, 17rem);
  margin: 0 auto;
}
/* A lamp: a glass in a brass bezel, dark until it is lit. */
.lamp {
  aspect-ratio: 1;
  padding: 0.28rem;
  border: 0;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #e6cd7c, #8a7423 55%, #4d4116);
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.65);
  cursor: pointer;
}
.glass {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #3a3328, #15110b 70%);
  box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.85);
  transition:
    background 0.2s,
    box-shadow 0.2s;
}
.lamp.on .glass {
  background: radial-gradient(circle at 40% 35%, #fff8dc, #f2cf6b 45%, #c8901f 85%);
  box-shadow:
    0 0 14px 4px rgba(242, 207, 107, 0.55),
    inset 0 -2px 4px rgba(120, 70, 0, 0.5);
}
.lit {
  margin: 0.8rem 0 0;
  text-align: center;
  font-family: var(--font-display);
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--paper-2);
}
/* The key's little cross: the lamp tapped and the four beside it. */
.cross {
  display: inline-grid;
  grid-template-columns: repeat(3, 0.4rem);
  gap: 0.12rem;
}
.cross b {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
}
.cross b.on {
  background: var(--paper-ink);
}
</style>

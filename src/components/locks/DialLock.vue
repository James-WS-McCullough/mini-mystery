<script setup lang="ts">
// A safe with four coloured dials, Mastermind's rules: eight tries.
import { computed, ref } from 'vue'

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

const COLOURS = [
  { name: 'Deep red', glyph: 'R', fill: '#8b1e24', ink: '#f3e3df' },
  { name: 'Bottle green', glyph: 'G', fill: '#1f5a3a', ink: '#e2f0e4' },
  { name: 'Navy', glyph: 'N', fill: '#1d2f5c', ink: '#dfe6f5' },
  { name: 'Old gold', glyph: 'O', fill: '#b8903a', ink: '#1f1808' },
  { name: 'Ivory', glyph: 'I', fill: '#ebe3cc', ink: '#2a241a' },
  { name: 'Violet', glyph: 'V', fill: '#5d3a82', ink: '#efe6f7' },
]
const MAX = 8
const rand = mulberry32(props.seed)
const secret = Array.from({ length: 4 }, () => Math.floor(rand() * 6))
const tries = ref<{ guess: number[]; pips: ('full' | 'half' | 'none')[] }[]>([])
const current = ref<(number | null)[]>([null, null, null, null])
const done = ref<'' | 'won' | 'lost'>('')
defineExpose({ secret })

const ready = computed(() => current.value.every((c) => c !== null))

function score(guess: number[]) {
  let full = 0
  const sc = Array(6).fill(0)
  const gc = Array(6).fill(0)
  guess.forEach((g, i) => {
    if (g === secret[i]) full++
    else {
      sc[secret[i]]++
      gc[g]++
    }
  })
  let half = 0
  for (let k = 0; k < 6; k++) half += Math.min(sc[k], gc[k])
  return [...Array(full).fill('full'), ...Array(half).fill('half')].concat(
    Array(4 - full - half).fill('none'),
  ) as ('full' | 'half' | 'none')[]
}

function pick(c: number) {
  if (done.value) return
  const i = current.value.indexOf(null)
  if (i >= 0) current.value[i] = c
}
function clear(i: number) {
  if (!done.value) current.value[i] = null
}
function tryIt() {
  if (done.value || !ready.value) return
  const guess = current.value as number[]
  const pips = score(guess)
  tries.value.push({ guess, pips })
  current.value = [null, null, null, null]
  if (pips.every((p) => p === 'full')) {
    done.value = 'won'
    emit('solved')
  } else if (tries.value.length >= MAX) {
    done.value = 'lost'
    emit('failed')
  }
}
</script>

<template>
  <div class="safe">
    <div v-for="(t, r) in tries" :key="r" class="line">
      <span v-for="(c, i) in t.guess" :key="i" class="slot" :style="{ background: COLOURS[c].fill, color: COLOURS[c].ink }">
        {{ COLOURS[c].glyph }}
      </span>
      <span class="pips" aria-label="Feedback">
        <i v-for="(p, i) in t.pips" :key="i" class="pip" :class="p" />
      </span>
    </div>
    <div v-if="!done" class="line now">
      <button
        v-for="(c, i) in current"
        :key="i"
        class="slot"
        :class="{ empty: c === null }"
        :style="c === null ? undefined : { background: COLOURS[c].fill, color: COLOURS[c].ink }"
        :aria-label="c === null ? 'Empty dial' : `Clear ${COLOURS[c].name}`"
        @click="clear(i)"
      >
        {{ c === null ? '' : COLOURS[c].glyph }}
      </button>
      <button class="try" :disabled="!ready" @click="tryIt">Try</button>
    </div>
    <p class="count">{{ Math.min(tries.length + (done ? 0 : 1), MAX) }} of {{ MAX }} tries</p>
    <div v-if="!done" class="swatches">
      <button
        v-for="(c, i) in COLOURS"
        :key="i"
        class="swatch"
        :style="{ background: c.fill, color: c.ink }"
        :aria-label="c.name"
        @click="pick(i)"
      >
        {{ c.glyph }}
      </button>
    </div>
    <div v-if="done === 'lost'" class="line reveal">
      <span v-for="(c, i) in secret" :key="i" class="slot small" :style="{ background: COLOURS[c].fill, color: COLOURS[c].ink }">
        {{ COLOURS[c].glyph }}
      </span>
      <span class="label">The combination</span>
    </div>
  </div>
</template>

<style scoped>
.safe {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  width: 100%;
  max-width: 22rem;
  margin: 0 auto;
}
.line { display: flex; align-items: center; gap: 0.45rem; }
.slot {
  width: 2.6rem;
  height: 2.6rem;
  padding: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 2px solid var(--brass-dim);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1rem;
}
.slot.small { width: 2rem; height: 2rem; font-size: 0.8rem; }
button.slot { cursor: pointer; }
.slot.empty { background: rgba(0, 0, 0, 0.3); border: 1px dashed var(--brass-dim); }
.pips {
  display: grid;
  grid-template-columns: repeat(2, 0.7rem);
  gap: 0.25rem;
  margin-left: 0.5rem;
  width: 1.7rem;
}
.pip {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  border: 1px solid transparent;
}
.pip.full { background: var(--brass); border-color: var(--brass); }
.pip.half { border-color: var(--brass); }
.pip.none { border-color: var(--line); opacity: 0.4; }
.try {
  min-width: 4rem;
  min-height: 2.6rem;
  margin-left: 0.3rem;
  border: 1px solid var(--brass);
  background: transparent;
  color: var(--brass);
  font-family: var(--font-display);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
}
.try:disabled {
  opacity: 0.35;
  cursor: default;
  border-color: var(--line);
  color: var(--muted);
}
.count,
.label {
  margin: 0;
  font-family: var(--font-display);
  font-size: 0.7rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
}
.swatches {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 0.3rem;
}
.swatch {
  width: 2.9rem;
  height: 2.9rem;
  padding: 0;
  border-radius: 50%;
  border: 3px solid var(--brass);
  box-shadow: var(--shadow);
  font-family: var(--font-display);
  font-weight: 700;
  cursor: pointer;
}
.reveal .label { color: var(--brass); }
</style>

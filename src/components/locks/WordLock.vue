<script setup lang="ts">
// A five-letter word lock, Wordle's rules: six guesses, any five letters taken.
import { computed, onMounted, onUnmounted, ref } from 'vue'

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

const WORDS = `PEARL CIGAR BRASS CLOCK GLOVE PIANO TRAIN LAMPS BRIBE SCARF DANCE JAZZY CHAIN
  SHOES HEIRS NOBLE PURSE DRESS WHIST BOWLS TEACH SPIES VAULT WATCH CREPE GRAND POKER
  CARDS FLASK STAIR PANEL TWEED FIELD CABIN SALON DAISY HOUND MAPLE BLAZE SHAWL RIDGE
  STOVE LINEN`.split(/\s+/)

const answer = WORDS[Math.floor(mulberry32(props.seed)() * WORDS.length)]
const MAX = 6
const rows = ref<string[]>([])
const current = ref('')
const done = ref<'' | 'won' | 'lost'>('')
defineExpose({ answer })

// 'hit' right place, 'near' wrong place, 'miss' absent. Repeats counted as Wordle does.
function mark(guess: string): ('hit' | 'near' | 'miss')[] {
  const out: ('hit' | 'near' | 'miss')[] = Array(5).fill('miss')
  const left: Record<string, number> = {}
  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) out[i] = 'hit'
    else left[answer[i]] = (left[answer[i]] ?? 0) + 1
  }
  for (let i = 0; i < 5; i++) {
    if (out[i] === 'hit') continue
    if (left[guess[i]] > 0) {
      out[i] = 'near'
      left[guess[i]]--
    }
  }
  return out
}
const marks = computed(() => rows.value.map(mark))

const rank = { miss: 1, near: 2, hit: 3 } as const
const keyState = computed(() => {
  const best: Record<string, 'hit' | 'near' | 'miss'> = {}
  rows.value.forEach((g, r) =>
    [...g].forEach((ch, i) => {
      const m = marks.value[r][i]
      if (!best[ch] || rank[m] > rank[best[ch]]) best[ch] = m
    }),
  )
  return best
})

function press(k: string) {
  if (done.value) return
  if (k === 'ENTER') {
    if (current.value.length < 5) return
    rows.value.push(current.value)
    const guess = current.value
    current.value = ''
    if (guess === answer) {
      done.value = 'won'
      emit('solved')
    } else if (rows.value.length >= MAX) {
      done.value = 'lost'
      emit('failed')
    }
  } else if (k === 'DEL') current.value = current.value.slice(0, -1)
  else if (current.value.length < 5) current.value += k
}
function onKey(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey || e.altKey) return
  if (e.key === 'Enter') press('ENTER')
  else if (e.key === 'Backspace') press('DEL')
  else if (/^[a-zA-Z]$/.test(e.key)) press(e.key.toUpperCase())
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))

const KEYS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']
function tile(r: number, c: number) {
  if (r < rows.value.length) return { ch: rows.value[r][c], s: marks.value[r][c] }
  if (r === rows.value.length) return { ch: current.value[c] ?? '', s: current.value[c] ? 'typed' : '' }
  return { ch: '', s: '' }
}
</script>

<template>
  <div class="word">
    <div class="grid" role="grid" aria-label="Five letter word lock">
      <div v-for="r in MAX" :key="r" class="row">
        <span v-for="c in 5" :key="c" class="tile" :class="tile(r - 1, c - 1).s">
          {{ tile(r - 1, c - 1).ch }}
        </span>
      </div>
    </div>
    <p v-if="done === 'lost'" class="reveal">The word was {{ answer }}</p>
    <div class="keys">
      <div v-for="(row, i) in KEYS" :key="i" class="krow">
        <button v-if="i === 2" class="key wide" aria-label="Enter" @click="press('ENTER')">Enter</button>
        <button
          v-for="k in row"
          :key="k"
          class="key"
          :class="keyState[k]"
          @click="press(k)"
        >
          {{ k }}
        </button>
        <button v-if="i === 2" class="key wide" aria-label="Delete" @click="press('DEL')">Del</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.word {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
  width: 100%;
  max-width: 22rem;
  margin: 0 auto;
}
.grid { display: grid; gap: 0.3rem; }
.row { display: flex; gap: 0.3rem; justify-content: center; }
.tile {
  position: relative;
  width: 2.6rem;
  height: 2.6rem;
  display: grid;
  place-items: center;
  border: 1px solid var(--line);
  background: rgba(0, 0, 0, 0.25);
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 700;
}
.tile.typed { border-color: var(--brass-dim); }
.tile.hit { background: var(--brass); border-color: var(--brass); color: #1a1408; }
.tile.near { border: 2px solid var(--brass-dim); }
.tile.near::after {
  content: '';
  position: absolute;
  bottom: 0.3rem;
  width: 0.28rem;
  height: 0.28rem;
  border-radius: 50%;
  background: var(--ink);
  opacity: 0.8;
}
.tile.miss { background: rgba(255, 255, 255, 0.04); color: var(--muted); }
.reveal {
  margin: 0;
  font-family: var(--font-display);
  font-size: 0.8rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--brass);
}
.keys {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  width: 100%;
}
.krow { display: flex; gap: 0.25rem; justify-content: center; }
.key {
  flex: 1 1 0;
  min-width: 0;
  min-height: 2.9rem;
  padding: 0;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.06);
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
}
.key.wide {
  flex: 1.6 1 0;
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.key.hit { background: var(--brass); border-color: var(--brass); color: #1a1408; }
.key.near { border: 2px solid var(--brass-dim); }
.key.miss { opacity: 0.35; }
</style>

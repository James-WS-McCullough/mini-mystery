<script setup lang="ts">
// A five-letter word lock, Wordle's rules: six guesses, any five letters
// taken. The word is turned up on five brass wheels; each try is noted on the
// slip beside the lock, and a key on the slip says what its marks mean.
import { computed, onMounted, onUnmounted, ref } from 'vue'
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
  else if (current.value.length < 5) {
    current.value += k
    sfx('click')
  }
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
const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
/** Each wheel: the letter turned up in the window, and the letters either side of it on the wheel. */
const wheels = computed(() =>
  Array.from({ length: 5 }, (_, i) => {
    const ch = done.value === 'won' ? answer[i] : (current.value[i] ?? '')
    const at = ch ? ABC.indexOf(ch) : -1
    return {
      ch,
      above: at < 0 ? '' : ABC[(at + 25) % 26],
      below: at < 0 ? '' : ABC[(at + 1) % 26],
      next: !done.value && i === current.value.length,
    }
  }),
)
</script>

<template>
  <div class="word">
    <LockPlate metal="brass" :open="done === 'won'">
      <div class="window" role="group" :aria-label="`Letter wheels: ${current || 'none turned yet'}`">
        <span v-for="(w, i) in wheels" :key="i" class="wheel" :class="{ next: w.next }">
          <span class="by">{{ w.above }}</span>
          <Transition name="turn" mode="out-in">
            <span :key="w.ch" class="ch">{{ w.ch }}</span>
          </Transition>
          <span class="by">{{ w.below }}</span>
        </span>
      </div>
    </LockPlate>

    <TrySlip :tried="rows.length" :of="MAX">
      <template v-if="rows.length">
        <div v-for="(g, r) in rows" :key="r" class="tried">
          <span v-for="(ch, c) in g" :key="c" class="m" :class="marks[r][c]">{{ ch }}</span>
        </div>
      </template>
      <template #key>
        <span><b class="m sm hit">A</b> right letter, right place</span>
        <span><b class="m sm near">A</b> in the word, elsewhere</span>
        <span><b class="m sm miss">A</b> not in the word</span>
      </template>
    </TrySlip>
    <p v-if="done === 'lost'" class="reveal">The word was {{ answer }}</p>

    <div v-if="!done" class="keys">
      <div v-for="(row, i) in KEYS" :key="i" class="krow">
        <button v-if="i === 2" class="key wide" aria-label="Try the word" :disabled="current.length < 5" @click="press('ENTER')">Try</button>
        <button v-for="k in row" :key="k" class="key" :class="keyState[k]" @click="press(k)">{{ k }}</button>
        <button v-if="i === 2" class="key wide" aria-label="Take back a letter" @click="press('DEL')">⌫</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.word {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  max-width: 22rem;
  margin: 0 auto;
}

/* Five brass wheels in a window cut in the plate. */
.window {
  display: flex;
  justify-content: center;
  gap: 0.3rem;
  padding: 0.3rem 0.5rem;
  border-radius: 4px;
  background: #120e05;
  box-shadow: inset 0 3px 8px rgba(0, 0, 0, 0.85);
}
.wheel {
  position: relative;
  width: 2.7rem;
  height: 4.2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  overflow: hidden;
  border-radius: 3px;
  /* (Lit across its middle, falling away into shadow over the top and bottom: a drum.) */
  background: linear-gradient(180deg, #2a210b 0%, #8a7423 22%, #e6cd7c 50%, #8a7423 78%, #2a210b 100%);
  color: #1f1808;
  font-family: var(--font-body);
  font-weight: 600;
}
.wheel::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0.15rem;
  height: 2px;
  margin: 0 0.6rem;
  background: transparent;
}
.wheel.next::after {
  background: #1f1808;
  opacity: 0.55;
}
.ch {
  font-size: 1.55rem;
  line-height: 1;
}
.by {
  height: 0.9rem;
  font-size: 0.7rem;
  line-height: 1;
  opacity: 0.45;
  transform: scaleY(0.6);
}
.turn-enter-active,
.turn-leave-active {
  transition:
    transform 0.12s ease,
    opacity 0.12s ease;
}
.turn-enter-from {
  transform: translateY(0.7rem) scaleY(0.6);
  opacity: 0;
}
.turn-leave-to {
  transform: translateY(-0.7rem) scaleY(0.6);
  opacity: 0;
}

/* The slip: each try, its letters marked as the key says. */
.tried {
  display: flex;
  gap: 0.25rem;
}
.m {
  width: 1.6rem;
  height: 1.6rem;
  display: inline-grid;
  place-items: center;
  border: 1.5px solid transparent;
  font-family: var(--font-type);
  font-weight: normal;
  font-size: 0.95rem;
  color: var(--paper-ink);
}
.m.hit {
  background: var(--paper-ink);
  color: var(--paper);
}
.m.near {
  border-color: var(--paper-ink);
  border-radius: 50%;
}
.m.miss {
  color: var(--paper-muted);
  opacity: 0.6;
  text-decoration: line-through;
}
.m.sm {
  width: 1.25rem;
  height: 1.25rem;
  font-size: 0.75rem;
}
.reveal {
  margin: 0;
  font-family: var(--font-display);
  font-size: 0.8rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--brass);
}

/* The typewriter's keys, marked as the slip is: filled, ringed, or faded. */
.keys {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  width: 100%;
  margin-top: 0.2rem;
}
.krow {
  display: flex;
  gap: 0.25rem;
  justify-content: center;
}
.key {
  flex: 1 1 0;
  min-width: 0;
  min-height: 2.8rem;
  padding: 0;
  border: 2px solid #59616b;
  border-radius: 10px;
  background: radial-gradient(circle at 50% 35%, #2b3138, #121519 75%);
  box-shadow: 0 2px 0 #050608;
  color: var(--paper);
  font-family: var(--font-type);
  font-size: 1rem;
  cursor: pointer;
}
.key:active:not(:disabled) {
  transform: translateY(1px);
  box-shadow: none;
}
.key.wide {
  flex: 1.6 1 0;
  font-size: 0.85rem;
}
.key.hit {
  border-color: var(--brass);
  background: var(--brass);
  color: #1a1408;
}
.key.near {
  border-color: var(--brass);
  color: var(--brass);
}
.key.miss {
  opacity: 0.3;
}
</style>

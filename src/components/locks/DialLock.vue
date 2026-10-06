<script setup lang="ts">
// A safe with four coloured dials, Mastermind's rules: eight tries. Each dial
// is turned a colour on by a tap, and stays where it is left; the handle tries
// them. The slip notes each try, and its key says what the marks mean.
import { ref } from 'vue'
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
/** How far each dial has been turned, in sixths: always onward, so it never spins back the long way. */
const turns = ref([0, 0, 0, 0])
const colourAt = (i: number) => turns.value[i] % 6
const done = ref<'' | 'won' | 'lost'>('')
/** The handle tried and held: it rattles. */
const rattle = ref(0)
defineExpose({ secret })

/** The dial's face: six coloured sixths, the first at the top. */
const FACE = `conic-gradient(from -30deg, ${COLOURS.map((c, i) => `${c.fill} ${i * 60}deg ${(i + 1) * 60}deg`).join(', ')})`

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

function turn(i: number) {
  if (done.value) return
  sfx('dial')
  turns.value = turns.value.map((t, j) => (j === i ? t + 1 : t))
}
function tryIt() {
  if (done.value) return
  const guess = [0, 1, 2, 3].map(colourAt)
  const pips = score(guess)
  tries.value.push({ guess, pips })
  if (pips.every((p) => p === 'full')) {
    done.value = 'won'
    emit('solved')
    return
  }
  rattle.value++
  if (tries.value.length >= MAX) {
    done.value = 'lost'
    emit('failed')
  } else sfx('rattle')
}
</script>

<template>
  <div class="safe">
    <LockPlate metal="iron" :open="done === 'won'">
      <div class="dials">
        <div v-for="i in 4" :key="i" class="dial-at">
          <span class="pointer" aria-hidden="true" />
          <button
            class="dial"
            :disabled="!!done"
            :aria-label="`Dial ${i}: ${COLOURS[colourAt(i - 1)].name}. Turn it on.`"
            @click="turn(i - 1)"
          >
            <span class="face" :style="{ background: FACE, transform: `rotate(${-turns[i - 1] * 60}deg)` }" />
            <span class="cap" :style="{ background: COLOURS[colourAt(i - 1)].fill, color: COLOURS[colourAt(i - 1)].ink }">
              {{ COLOURS[colourAt(i - 1)].glyph }}
            </span>
          </button>
        </div>
      </div>
      <button class="handle" :disabled="!!done" @click="tryIt()">
        <span :key="rattle" class="grip" :class="{ rattle: rattle > 0 }" aria-hidden="true" /> Try the handle
      </button>
    </LockPlate>

    <TrySlip :tried="tries.length" :of="MAX">
      <template v-if="tries.length">
        <div v-for="(t, r) in tries" :key="r" class="tried">
          <span v-for="(c, i) in t.guess" :key="i" class="dot" :style="{ background: COLOURS[c].fill, color: COLOURS[c].ink }">{{ COLOURS[c].glyph }}</span>
          <span class="pips" :aria-label="`${t.pips.filter((p) => p === 'full').length} right, ${t.pips.filter((p) => p === 'half').length} on the wrong dial`">
            <i v-for="(p, i) in t.pips" :key="i" class="pip" :class="p" />
          </span>
        </div>
      </template>
      <template #key>
        <span><i class="pip full" /> a right colour on its right dial</span>
        <span><i class="pip half" /> a right colour on another dial</span>
        <span class="aside">The marks say how many, not which.</span>
      </template>
    </TrySlip>

    <div v-if="done === 'lost'" class="reveal">
      <span v-for="(c, i) in secret" :key="i" class="dot" :style="{ background: COLOURS[c].fill, color: COLOURS[c].ink }">{{ COLOURS[c].glyph }}</span>
      <span class="label">The combination</span>
    </div>
  </div>
</template>

<style scoped>
.safe {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  max-width: 22rem;
  margin: 0 auto;
}
.dials {
  display: flex;
  justify-content: center;
  gap: 0.6rem;
}
.dial-at {
  position: relative;
  padding-top: 0.55rem;
}
/* The mark on the door each dial is read against. */
.pointer {
  position: absolute;
  top: 0;
  left: 50%;
  width: 0;
  height: 0;
  margin-left: -0.32rem;
  border-left: 0.32rem solid transparent;
  border-right: 0.32rem solid transparent;
  border-top: 0.5rem solid #e9dfc4;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.8));
}
.dial {
  position: relative;
  width: 4rem;
  height: 4rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  /* (The knurled rim: fine ridges all round.) */
  background: repeating-conic-gradient(#9aa2ab 0 4deg, #4b5259 4deg 8deg);
  box-shadow:
    0 3px 6px rgba(0, 0, 0, 0.7),
    inset 0 0 0 1px rgba(0, 0, 0, 0.6);
  cursor: pointer;
}
.dial:disabled {
  cursor: default;  /* (Set, and the lock open or lost: still bright, not greyed as a button out of use.) */
  opacity: 1;
}
.face {
  position: absolute;
  inset: 0.32rem;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.5);
  transition: transform 0.3s cubic-bezier(0.3, 0.6, 0.3, 1);
}
.cap {
  position: absolute;
  inset: 1.15rem;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 2px solid #c4cad1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.7);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 0.85rem;
}

.handle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  width: 100%;
  margin-top: 0.9rem;
  padding: 0.55rem 0.8rem;
  border: 1px solid #59616b;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.35);
  color: #e9dfc4;
  font-family: var(--font-display);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
}
.grip {
  width: 2.6rem;
  height: 0.6rem;
  border-radius: 999px;
  background: linear-gradient(180deg, #e6cd7c, #a8893a 45%, #6b5520);
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.6);
}
.grip.rattle {
  animation: rattle 0.4s ease;
}
@keyframes rattle {
  20% { transform: rotate(-9deg); }
  45% { transform: rotate(6deg); }
  70% { transform: rotate(-3deg); }
}

/* The slip: each try's colours, and its marks. */
.tried {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.15rem 0;
}
.dot {
  width: 1.55rem;
  height: 1.55rem;
  display: inline-grid;
  place-items: center;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.35);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 0.7rem;
}
.pips {
  display: grid;
  grid-template-columns: repeat(2, 0.65rem);
  gap: 0.2rem;
  margin-left: 0.5rem;
}
.pip {
  display: inline-block;
  width: 0.65rem;
  height: 0.65rem;
  border-radius: 50%;
  border: 1.5px solid transparent;
}
.pip.full {
  background: var(--paper-ink);
  border-color: var(--paper-ink);
}
.pip.half {
  /* (Yellow, inked round: plain to tell from an empty mark on the cream of the slip.) */
  background: #e0a91c;
  border-color: var(--paper-ink);
}
.pip.none {
  border-color: var(--paper-line);
}
.aside {
  font-style: italic;
}
.reveal {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
.label {
  margin-left: 0.4rem;
  font-family: var(--font-display);
  font-size: 0.7rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--brass);
}
@media (prefers-reduced-motion: reduce) {
  .face {
    transition: none;
  }
  .grip.rattle {
    animation: none;
  }
}
</style>

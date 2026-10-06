<script setup lang="ts">
// A jewel case's clasp held by a lock of the four suits: four enamel tabs,
// each riding a rail of its own, slid into the right order left to right.
// Three playing cards are dealt beside it, each with a clue written across its
// face; together they tell the one order, and each is needed to tell it (see
// ui/cardClues.ts). Three tries.
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { sfx } from '../../ui/audio'
import { PIP, SUITS, dealCards, isRed, type Clue, type Suit } from '../../ui/cardClues'
import LockPlate from './LockPlate.vue'
import TrySlip from './TrySlip.vue'

const props = defineProps<{ seed: number }>()
const emit = defineEmits<{ (e: 'solved'): void; (e: 'failed'): void }>()

const deal = dealCards(props.seed)
const answer = deal.answer
defineExpose({ answer })
const MAX = 3
const NAME: Record<Suit, string> = { spades: 'Spades', hearts: 'Hearts', diamonds: 'Diamonds', clubs: 'Clubs' }

// ---------- the three cards dealt ----------

/** The clue cards are the ace, king and queen; each wears the suit it speaks of first. */
const RANKS = ['A', 'K', 'Q']
function suitOf(c: Clue): Suit {
  const named = c.words.find((w): w is { suit: Suit } => typeof w !== 'string')
  if (named) return named.suit
  return c.words.join('').includes('red') ? 'hearts' : 'spades'
}
const hand = deal.clues.map((c, i) => ({ words: c.words, rank: RANKS[i], suit: suitOf(c) }))
/** A card's words for a screen reader, the suits by name. */
const said = (c: Clue) => c.words.map((w) => (typeof w === 'string' ? w : NAME[w.suit])).join('')

/** How many of the three are turned face up: dealt face down, they turn one by one. */
const dealt = ref(0)
const timers: ReturnType<typeof setTimeout>[] = []
onMounted(() => {
  if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) {
    dealt.value = 3
    return
  }
  for (let i = 0; i < 3; i++) {
    timers.push(
      setTimeout(() => {
        dealt.value = i + 1
        sfx('card')
      }, 300 + i * 260),
    )
  }
})
onUnmounted(() => timers.forEach(clearTimeout))

// ---------- the four tabs on their rails ----------

/**
 * The suits as they stand, left to right. They start in the order of the pack
 * (or the other way about, where that would be the answer itself).
 */
const start = SUITS.every((s, i) => s === answer[i]) ? [...SUITS].reverse() : [...SUITS]
const order = ref<Suit[]>(start)
const tries = ref<Suit[][]>([])
const done = ref<'' | 'won' | 'lost'>('')
/** The clasp tried and held: it rattles. */
const rattle = ref(0)
/** Each suit rides a rail of its own, one a little below the next, so that the tabs can pass. */
const RAIL: Record<Suit, number> = { spades: 0, hearts: 1, diamonds: 2, clubs: 3 }

/** A tab being slid: which, the place it left, and how far it has come (in pixels, a place being `pitch`). */
const drag = ref<{ suit: Suit; from: number; startX: number; dx: number; pitch: number } | null>(null)
const rails = ref<HTMLElement | null>(null)
/** Where the tab being slid would settle, were it let go now. */
const target = computed(() => {
  const d = drag.value
  return d ? Math.max(0, Math.min(3, Math.round(d.from + d.dx / d.pitch))) : -1
})
/** The order as it stands while a tab is slid: the others stood aside to leave its place free. */
const shown = computed<Suit[]>(() => {
  const d = drag.value
  if (!d) return order.value
  const rest = order.value.filter((s) => s !== d.suit)
  rest.splice(target.value, 0, d.suit)
  return rest
})
function place(s: Suit) {
  const d = drag.value
  if (d && d.suit === s) return { left: `${d.from * 25}%`, transform: `translateX(${d.dx}px)`, transition: 'none' }
  return { left: `${shown.value.indexOf(s) * 25}%` }
}

function grab(s: Suit, e: PointerEvent) {
  if (done.value || !rails.value) return
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  drag.value = { suit: s, from: order.value.indexOf(s), startX: e.clientX, dx: 0, pitch: rails.value.clientWidth / 4 }
}
function slide(e: PointerEvent) {
  const d = drag.value
  if (!d) return
  const was = target.value
  d.dx = Math.max(-d.from * d.pitch, Math.min((3 - d.from) * d.pitch, e.clientX - d.startX))
  // (The others tick aside as it passes them.)
  if (target.value !== was) sfx('tumbler')
}
/** Let go: it settles in the place it is nearest, and the others close up behind it. */
function letGo() {
  if (!drag.value) return
  const moved = target.value !== drag.value.from
  order.value = shown.value
  drag.value = null
  sfx(moved ? 'slide' : 'tumbler')
}
/** From the keys: a tab moved one place along. */
function nudge(s: Suit, by: -1 | 1) {
  const at = order.value.indexOf(s)
  const to = at + by
  if (done.value || to < 0 || to > 3) return
  const next = [...order.value]
  ;[next[at], next[to]] = [next[to], next[at]]
  order.value = next
  sfx('slide')
}
function tryIt() {
  if (done.value || drag.value) return
  const now = order.value
  tries.value.push([...now])
  if (now.every((s, i) => s === answer[i])) {
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
const PLACES = ['first', 'second', 'third', 'last']
</script>

<template>
  <div class="card-lock">
    <!-- The three cards dealt: a clue across the face of each. -->
    <div class="hand">
      <div v-for="(c, i) in hand" :key="i" class="hint" :class="[`at${i}`, { down: dealt <= i }]">
        <div class="turner">
          <div class="face front" :class="{ red: isRed(c.suit) }" :aria-hidden="dealt <= i">
            <span class="corner tl"><b>{{ c.rank }}</b>{{ PIP[c.suit] }}</span>
            <span class="corner br"><b>{{ c.rank }}</b>{{ PIP[c.suit] }}</span>
            <span class="water" aria-hidden="true">{{ PIP[c.suit] }}</span>
            <p class="clue" :aria-label="said(deal.clues[i])">
              <template v-for="(w, k) in c.words" :key="k">
                <template v-if="typeof w === 'string'">{{ w }}</template>
                <span v-else class="pip" :class="{ red: isRed(w.suit) }" :title="NAME[w.suit]">{{ PIP[w.suit] }}</span>
              </template>
            </p>
          </div>
          <div class="face back" aria-hidden="true" />
        </div>
      </div>
    </div>

    <LockPlate metal="baize" :open="done === 'won'">
      <div ref="rails" class="rails" role="group" aria-label="The four suits of the clasp, in their order left to right">
        <span v-for="n in 4" :key="n" class="rail" :style="{ '--rail': n - 1 }" aria-hidden="true" />
        <button
          v-for="s in SUITS"
          :key="s"
          class="tab"
          :class="{ red: isRed(s), held: drag?.suit === s }"
          :style="{ '--rail': RAIL[s], ...place(s) }"
          :disabled="!!done"
          :aria-label="`${NAME[s]}, the ${PLACES[order.indexOf(s)]} of the four. Slide it left or right with the arrow keys.`"
          @pointerdown="grab(s, $event)"
          @pointermove="slide"
          @pointerup="letGo()"
          @pointercancel="letGo()"
          @keydown.left.prevent="nudge(s, -1)"
          @keydown.right.prevent="nudge(s, 1)"
        >
          <span class="sign">{{ PIP[s] }}</span>
          <span class="runner" aria-hidden="true" />
        </button>
      </div>
      <div class="places" aria-hidden="true"><span v-for="n in ['I', 'II', 'III', 'IV']" :key="n">{{ n }}</span></div>
      <button class="clasp" :disabled="!!done" @click="tryIt()">
        <span :key="rattle" class="catch" :class="{ rattle: rattle > 0 }" aria-hidden="true" /> Try the clasp
      </button>
    </LockPlate>

    <TrySlip :tried="tries.length" :of="MAX">
      <template v-if="tries.length">
        <div v-for="(t, r) in tries" :key="r" class="tried">
          <span v-for="(s, i) in t" :key="i" class="pip" :class="{ red: isRed(s) }">{{ PIP[s] }}</span>
        </div>
      </template>
    </TrySlip>

    <div v-if="done === 'lost'" class="reveal">
      <span class="label">The order</span>
      <span v-for="(s, i) in answer" :key="i" class="pip" :class="{ red: isRed(s) }">{{ PIP[s] }}</span>
    </div>
  </div>
</template>

<style scoped>
.card-lock {
  --stock: #fbf6e9;
  --edge: #d8cdb0;
  --black: #1d1a16;
  --red: #b3202a;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.7rem;
  width: 100%;
  max-width: 24rem;
  margin: 0 auto;
}
.red {
  color: var(--red);
}

/* ---------- the hand: three cards, a little fanned ---------- */
.hand {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.45rem;
  width: 100%;
  padding: 0.3rem 0.2rem 0.5rem;
}
.hint {
  aspect-ratio: 5 / 7;
  perspective: 700px;
}
.hint.at0 { transform: rotate(-3deg) translateY(0.2rem); }
.hint.at2 { transform: rotate(3deg) translateY(0.2rem); }
.turner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.45s cubic-bezier(0.3, 0.7, 0.3, 1);
}
.hint.down .turner {
  transform: rotateY(180deg) translateY(-0.3rem);
}
.face {
  position: absolute;
  inset: 0;
  border-radius: 7px;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
}
.front {
  display: grid;
  place-items: center;
  padding: 1.35rem 0.45rem;
  background: var(--stock);
  border: 1px solid var(--edge);
  color: var(--black);
  overflow: hidden;
}
/* (The fine rule printed inside the edge of a good card.) */
.front::before {
  content: '';
  position: absolute;
  inset: 0.28rem;
  border: 1px solid rgba(160, 130, 60, 0.4);
  border-radius: 4px;
  pointer-events: none;
}
.corner {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: var(--font-body);
  font-size: 0.72rem;
  line-height: 0.95;
}
.corner b {
  font-weight: 600;
  font-size: 0.85rem;
}
.corner.tl {
  top: 0.4rem;
  left: 0.42rem;
}
.corner.br {
  bottom: 0.4rem;
  right: 0.42rem;
  transform: rotate(180deg);
}
.water {
  position: absolute;
  font-size: 4.2rem;
  line-height: 1;
  opacity: 0.06;
  pointer-events: none;
}
.clue {
  position: relative;
  margin: 0;
  text-align: center;
  font-family: var(--font-body);
  font-size: clamp(0.7rem, 2.7vw, 0.86rem);
  line-height: 1.3;
  color: var(--black);
}
.clue .pip {
  font-size: 1.15em;
  color: var(--black);
}
.clue .pip.red {
  color: var(--red);
}
/* The back: a red lattice inside a white border, as a pack of the period. */
.back {
  transform: rotateY(180deg);
  border: 1px solid var(--edge);
  background:
    repeating-linear-gradient(45deg, rgba(251, 246, 233, 0.22) 0 1px, transparent 1px 7px),
    repeating-linear-gradient(-45deg, rgba(251, 246, 233, 0.22) 0 1px, transparent 1px 7px),
    radial-gradient(circle at 50% 50%, #9a2a33, #6e1820);
  box-shadow:
    inset 0 0 0 0.3rem var(--stock),
    inset 0 0 0 calc(0.3rem + 1px) rgba(110, 24, 32, 0.6),
    0 4px 10px rgba(0, 0, 0, 0.5);
}

/* ---------- the clasp: four rails across the baize, a suit's tab on each ---------- */
.rails {
  --step: 1.05rem;
  --tab-h: 4.3rem;
  position: relative;
  width: min(100%, 17rem);
  height: calc(var(--step) * 3 + var(--tab-h) + 0.3rem);
  margin: 0.3rem auto 0;
}
/* A brass rod: one for each suit, each a step below the last. */
.rail {
  position: absolute;
  left: -0.4rem;
  right: -0.4rem;
  top: calc(var(--rail) * var(--step) + var(--tab-h) - 0.75rem);
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(180deg, #f0d98a, #a8893a 50%, #5c4815);
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.55);
}
.tab {
  position: absolute;
  top: calc(var(--rail) * var(--step));
  /* (Each tab keeps to its rail's depth, held or not: a lower rail runs in front of a higher.) */
  z-index: calc(var(--rail) + 1);
  width: calc(25% - 0.5rem);
  height: var(--tab-h);
  margin-left: 0.25rem;
  padding: 0;
  border: 0;
  background: none;
  box-shadow: none;
  color: var(--black);
  touch-action: none;
  cursor: grab;
  transition:
    left 0.22s cubic-bezier(0.3, 0.7, 0.3, 1),
    transform 0.22s cubic-bezier(0.3, 0.7, 0.3, 1);
}
.tab.held {
  cursor: grabbing;
}
.tab:disabled {
  cursor: default;
  /* (Set, and the lock open or lost: still bright, not greyed as a button out of use.) */
  opacity: 1;
}
/* The sign: white enamel in a brass rim, the suit on it large. */
.sign {
  position: absolute;
  inset: 0 0 0.55rem;
  display: grid;
  place-items: center;
  border: 2px solid #c9a94e;
  border-radius: 0.55rem 0.55rem 0.3rem 0.3rem;
  background: radial-gradient(ellipse at 50% 35%, #ffffff, #f3ecd9 70%, #e2d7b9);
  box-shadow:
    inset 0 -2px 4px rgba(120, 100, 50, 0.3),
    0 4px 8px rgba(0, 0, 0, 0.5);
  font-size: 2.3rem;
  line-height: 1;
  transition:
    transform 0.15s,
    box-shadow 0.15s;
}
.tab.red .sign {
  color: var(--red);
}
.tab.held .sign {
  transform: translateY(-3px);
  box-shadow:
    inset 0 -2px 4px rgba(120, 100, 50, 0.3),
    0 10px 16px rgba(0, 0, 0, 0.55);
}
/* The runner under the sign, round its rail. */
.runner {
  position: absolute;
  left: 50%;
  bottom: 0.32rem;
  width: 1.3rem;
  height: 0.65rem;
  margin-left: -0.65rem;
  border-radius: 3px;
  background: linear-gradient(180deg, #e6cd7c, #8a7423);
  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.5);
}
.places {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  width: min(100%, 17rem);
  margin: 0.1rem auto 0;
  text-align: center;
  font-family: var(--font-body);
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  color: #c9a94e;
  opacity: 0.8;
}

.clasp {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  width: 100%;
  margin-top: 0.3rem;
  padding: 0.55rem 0.8rem;
  border: 1px solid #a8893a;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.3);
  color: #e9dfc4;
  font-family: var(--font-display);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
}
.clasp:disabled {
  opacity: 0.5;
  cursor: default;
}
/* The clasp's catch: a little brass hasp. */
.catch {
  width: 1.1rem;
  height: 1.3rem;
  border: 3px solid #c9a94e;
  border-bottom: 0;
  border-radius: 0.6rem 0.6rem 0 0;
  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.5);
}
.catch.rattle {
  animation: rattle 0.4s ease;
}
@keyframes rattle {
  20% { transform: rotate(-12deg); }
  45% { transform: rotate(8deg); }
  70% { transform: rotate(-4deg); }
}

/* ---------- the slip, and the order when it is lost ---------- */
.tried {
  display: flex;
  gap: 0.5rem;
  font-size: 1.15rem;
  color: var(--black);
}
.tried .red {
  color: var(--red);
}
.reveal {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 1.3rem;
  color: #e9dfc4;
}
.reveal .red {
  color: #e2525b;
}
.label {
  margin-right: 0.3rem;
  font-family: var(--font-display);
  font-size: 0.7rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--brass);
}
@media (prefers-reduced-motion: reduce) {
  .turner,
  .tab,
  .sign {
    transition: none;
  }
  .catch.rattle {
    animation: none;
  }
}
</style>

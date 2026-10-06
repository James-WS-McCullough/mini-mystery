<script setup lang="ts">
// A jewel case's clasp held by a lock of four cards: the four aces, to be set
// in the right order of suits. Three playing cards are dealt beside it, each
// with a clue written across its face; together they tell the one order, and
// each is needed to tell it (see ui/cardClues.ts). Three tries.
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

// ---------- the four aces on the clasp ----------

/** Each place on the clasp: face down until it is first turned, then an ace of one suit or another. */
const slots = ref<(Suit | null)[]>([null, null, null, null])
const allSet = computed(() => slots.value.every((s) => s !== null))
const eachOnce = computed(() => allSet.value && new Set(slots.value).size === 4)
const tries = ref<Suit[][]>([])
const done = ref<'' | 'won' | 'lost'>('')
/** The clasp tried and held: it rattles. */
const rattle = ref(0)

function turn(i: number) {
  if (done.value) return
  sfx('card')
  const now = slots.value[i]
  const next = now === null ? SUITS[0] : SUITS[(SUITS.indexOf(now) + 1) % 4]
  slots.value = slots.value.map((s, j) => (j === i ? next : s))
}
function tryIt() {
  if (done.value || !eachOnce.value) return
  const order = slots.value as Suit[]
  tries.value.push([...order])
  if (order.every((s, i) => s === answer[i])) {
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
      <div class="slots">
        <button
          v-for="(s, i) in slots"
          :key="i"
          class="slot"
          :disabled="!!done"
          :aria-label="`The ${PLACES[i]} card: ${s ? `the ace of ${NAME[s]}` : 'face down'}. Turn it to the next suit.`"
          @click="turn(i)"
        >
          <Transition name="flip" mode="out-in">
            <span v-if="s" :key="s" class="ace" :class="{ red: isRed(s) }">
              <span class="corner tl"><b>A</b>{{ PIP[s] }}</span>
              <span class="big">{{ PIP[s] }}</span>
              <span class="corner br"><b>A</b>{{ PIP[s] }}</span>
            </span>
            <span v-else key="back" class="ace back" />
          </Transition>
        </button>
      </div>
      <p class="once" :class="{ shown: allSet && !eachOnce }">Each suit once.</p>
      <button class="clasp" :disabled="!eachOnce || !!done" @click="tryIt()">
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

/* ---------- the clasp: four aces laid on the baize ---------- */
.slots {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.55rem;
  width: min(100%, 18rem);
  margin: 0.2rem auto 0;
}
.slot {
  aspect-ratio: 5 / 7;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.18);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.25);
  perspective: 500px;
  cursor: pointer;
}
.slot:disabled {
  cursor: default;  /* (Set, and the lock open or lost: still bright, not greyed as a button out of use.) */
  opacity: 1;
}
.ace {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  border-radius: 6px;
  background: var(--stock);
  border: 1px solid var(--edge);
  color: var(--black);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.55);
}
.ace.red {
  color: var(--red);
}
.ace .corner {
  font-size: 0.6rem;
}
.ace .corner b {
  font-size: 0.7rem;
}
.ace .corner.tl {
  top: 0.25rem;
  left: 0.28rem;
}
.ace .corner.br {
  bottom: 0.25rem;
  right: 0.28rem;
}
.big {
  font-size: 2rem;
  line-height: 1;
}
.ace.back {
  background:
    repeating-linear-gradient(45deg, rgba(251, 246, 233, 0.22) 0 1px, transparent 1px 6px),
    repeating-linear-gradient(-45deg, rgba(251, 246, 233, 0.22) 0 1px, transparent 1px 6px),
    radial-gradient(circle at 50% 50%, #9a2a33, #6e1820);
  box-shadow:
    inset 0 0 0 0.22rem var(--stock),
    0 3px 6px rgba(0, 0, 0, 0.55);
}
.flip-enter-active,
.flip-leave-active {
  transition: transform 0.09s ease-in-out;
}
.flip-leave-to {
  transform: rotateY(90deg);
}
.flip-enter-from {
  transform: rotateY(-90deg);
}

.once {
  margin: 0.55rem 0 0;
  min-height: 1.2em;
  text-align: center;
  font-size: 0.85rem;
  font-style: italic;
  color: #e9dfc4;
  visibility: hidden;
}
.once.shown {
  visibility: visible;
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
  .flip-enter-active,
  .flip-leave-active {
    transition: none;
  }
  .catch.rattle {
    animation: none;
  }
}
</style>

<script setup lang="ts">
// A lock on something found: a little puzzle, played out over the page.
// Unobtrusive: Skip is always to hand, and a failure offers another go or
// the skip. Either way what was locked comes into hand.
import { computed, ref, watch } from 'vue'
import { useGame } from '../stores/game'
import { useUi } from '../stores/ui'
import { sfx } from '../ui/audio'
import Icon from './Icon.vue'
import Overlay from './Overlay.vue'
import { LOCKS } from '../stores/night/search'
import WordLock from './locks/WordLock.vue'
import DialLock from './locks/DialLock.vue'
import LampLock from './locks/LampLock.vue'
import CardLock from './locks/CardLock.vue'
import WireLock from './locks/WireLock.vue'

const game = useGame()
const ui = useUi()
const item = computed(() => ui.lockOpen)
/** A lock on something found; or one tried for its own sake, from the menu. */
const lock = computed(() => (item.value ? game.lockOf(item.value) : (LOCKS.find((l) => l.kind === ui.lockTry) ?? null)))
const PUZZLE = { word: WordLock, dials: DialLock, lamps: LampLock, cards: CardLock, wires: WireLock } as const

/** Each try is a fresh puzzle from the next seed. */
const attempt = ref(0)
const state = ref<'playing' | 'failed' | 'solved'>('playing')
/** A lock tried from the menu: a puzzle of its own each time it comes up. */
const fresh = ref(0)
watch([item, () => ui.lockTry], () => {
  attempt.value = 0
  state.value = 'playing'
  fresh.value = Math.floor(Math.random() * 2 ** 31)
})
/** A number from words, the same every time (FNV-1a). */
function hashOf(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return h >>> 0
}
/**
 * The puzzle on a lock found in a case is settled by the case and the thing
 * locked: the same case deals the same puzzle, and Try again the next one.
 */
const seed = computed(() => (item.value ? hashOf(`${game.mystery?.seed ?? 0}:${item.value}`) : fresh.value) + attempt.value * 7919)

let timer: ReturnType<typeof setTimeout> | undefined
function solved() {
  state.value = 'solved'
  sfx('unlock')
  // (Long enough to see the bolt draw back.)
  timer = setTimeout(() => finish(), 1400)
}
function failed() {
  state.value = 'failed'
  sfx('miss')
}
function again() {
  sfx('click')
  attempt.value++
  state.value = 'playing'
}
/** Opened or given up on: the thing comes into hand either way. */
function finish() {
  clearTimeout(timer)
  const id = item.value
  ui.lockOpen = null
  ui.lockTry = null
  if (id) game.unlock(id)
}
function skip() {
  sfx('select')
  finish()
}
</script>

<template>
  <Overlay :open="!!lock" :title="lock?.title ?? ''" width="30rem" @close="skip()">
    <template v-if="lock">
      <p class="what">{{ lock.what[0].toUpperCase() + lock.what.slice(1) }}. {{ lock.hint }}</p>
      <div class="puzzle" :class="{ done: state === 'solved' }">
        <component :is="PUZZLE[lock.kind]" :key="`${item}:${attempt}`" :seed="seed" @solved="solved()" @failed="failed()" />
      </div>
      <p v-if="state === 'solved'" class="opened"><Icon name="check" /> It opens.</p>
      <p v-else-if="state === 'failed'" class="stuck">It holds. Try again, or let it be.</p>
    </template>
    <template #actions>
      <template v-if="state === 'failed'">
        <button class="ghost" @click="skip()">Skip</button>
        <button class="primary" @click="again()">Try again</button>
      </template>
      <button v-else-if="state === 'playing'" class="ghost skip" @click="skip()">Skip</button>
    </template>
  </Overlay>
</template>

<style scoped>
.what {
  margin: 0 0 0.8rem;
  line-height: 1.5;
}
.puzzle.done {
  pointer-events: none;
}
.opened {
  margin: 0.8rem 0 0;
  color: var(--good);
}
.stuck {
  margin: 0.8rem 0 0;
  color: var(--muted);
}
/* Skip keeps to the lower right, out of the way. */
.skip {
  margin-left: auto;
}
</style>

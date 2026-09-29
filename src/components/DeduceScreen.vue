<script setup lang="ts">
// The notes spread across the table, two at a time laid side by side to see
// whether they clash or hold. Open at any point in the hour: a contradiction
// found now can be put to the household at once.
import { computed, ref, watch } from 'vue'
import { useGame } from '../stores/game'
import { useUi } from '../stores/ui'
import { sfx } from '../ui/audio'
import { cardById } from '../ui/cards'
import { useKeys } from '../ui/keys'
import ActionBar from './ActionBar.vue'
import Icon from './Icon.vue'
import NoteCard from './NoteCard.vue'
import NoteDeck from './NoteDeck.vue'

const game = useGame()
const ui = useUi()
const remaining = computed(() => game.undrawnContradictions + game.undrawnLinks)
const canTest = computed(() => game.deduceSelection.length === 2 && game.missesLeft > 0)
const slots = computed(() => [0, 1].map((i) => {
  const id = game.deduceSelection[i]
  return id ? cardById(game, id) : null
}))

/** Bumped on every test so the verdict's animation replays. */
const round = ref(0)
const shaking = ref(false)
const hover = ref<number | null>(null)

const STAMP = {
  contradiction: 'Contradiction',
  link: 'Corroborated',
  known: 'Already drawn',
  miss: 'Nothing in it',
} as const

function test() {
  if (!canTest.value) return
  game.testPair()
  round.value++
  const kind = game.lastDeduceResult?.kind
  if (kind === 'contradiction') sfx('sting')
  else if (kind === 'link') sfx('link')
  else if (kind === 'miss') {
    sfx('miss')
    shaking.value = true
    setTimeout(() => (shaking.value = false), 520)
  } else sfx('click')
  if (kind === 'contradiction' || kind === 'link') setTimeout(() => sfx('stamp'), 260)
}

function drop(e: DragEvent, slot: number) {
  e.preventDefault()
  hover.value = null
  const id = e.dataTransfer?.getData('text/plain')
  if (!id || game.deduceSelection.includes(id)) return
  // Dropping on a filled slot replaces that card, not the other one.
  const next = [...game.deduceSelection]
  next[Math.min(slot, next.length)] = id
  game.deduceSelection = next.slice(0, 2)
  sfx('page')
}
function lift(id: string) {
  sfx('click')
  game.toggleDeduceSelect(id)
}
function strike() {
  sfx('select')
  game.strikeHour()
}
function back() {
  sfx('page')
  game.resumeQuestions()
}
function confront(id: number) {
  sfx('select')
  game.resumeQuestions(id)
}
const name = (id: number) => game.mystery?.cast[id].shortName ?? ''

watch(
  () => game.deduceSelection.length,
  (n) => {
    // Laying a fresh card clears the last verdict from the table.
    if (n > 0 && game.lastDeduceResult) game.lastDeduceResult = null
  },
)

useKeys((key) => {
  if (ui.anyOpen) return false
  if ((key === ' ' || key === 'Enter') && canTest.value) {
    test()
    return true
  }
  return false
})
</script>

<template>
  <div class="deduce">
    <header class="head">
      <h2 class="heading">Your notes, side by side</h2>
      <p class="lede">
        You spread your notes across the table. What cannot both be true — and what holds together?
        <template v-if="game.questionsLeft > 0">
          The household is still waiting: {{ game.questionsLeft }}
          question{{ game.questionsLeft === 1 ? '' : 's' }} left this hour.
        </template>
      </p>
      <p class="counts">
        <template v-if="remaining > 0">
          Your notes still hold
          <strong class="brass"><Icon name="bolt" /> {{ game.undrawnContradictions }}</strong>
          contradiction{{ game.undrawnContradictions === 1 ? '' : 's' }} and
          <strong class="good"><Icon name="link" /> {{ game.undrawnLinks }}</strong>
          corroboration{{ game.undrawnLinks === 1 ? '' : 's' }}
          <span class="muted">· {{ game.realized.length }} drawn</span>
        </template>
        <template v-else>You have drawn every thread your notes will yield — for now.</template>
      </p>
    </header>

    <section class="table" :class="{ shake: shaking }">
      <div class="lives" :title="`${game.missesLeft} wrong pairings left this hour`">
        <span class="small muted">wrong pairings left</span>
        <span v-for="i in 3" :key="i" class="life" :class="{ lost: i > game.missesLeft }" />
      </div>

      <div class="slots">
        <template v-for="(card, i) in slots" :key="i">
          <span v-if="i === 1" class="versus brass" aria-hidden="true">
            <Icon name="double" style="transform: rotate(180deg)" /><Icon name="double" />
          </span>
          <div
            class="slot"
            :class="{ filled: card, over: hover === i }"
            @dragover.prevent="hover = i"
            @dragleave="hover = null"
            @drop="drop($event, i)"
          >
            <template v-if="card">
              <NoteCard :card="card" placed />
              <button class="lift ghost" :aria-label="`Take back: ${card.main}`" @click="lift(card.id)">
                <Icon name="close" />
              </button>
            </template>
            <span v-else class="muted">
              {{ i === 0 ? 'lay a first note here…' : '…and a second beside it' }}
            </span>
          </div>
        </template>
      </div>

      <div class="verdict">
        <button class="primary" :disabled="!canTest" @click="test()">Test the pair</button>
        <p v-if="game.missesLeft === 0" class="small spent">
          The threads blur before your eyes. Perhaps after another hour’s questions.
        </p>
      </div>

      <Transition name="fade">
        <div
          v-if="game.lastDeduceResult"
          :key="round"
          class="result"
          :class="game.lastDeduceResult.kind"
          role="status"
        >
          <span class="stamp">{{ STAMP[game.lastDeduceResult.kind] }}</span>
          <div class="said">
            <p>{{ game.lastDeduceResult.text }}</p>
            <p v-if="game.lastDeduceResult.implicated?.length" class="confront">
              <template v-if="game.questionsLeft > 0">
                <button
                  v-for="id in game.lastDeduceResult.implicated"
                  :key="id"
                  class="press"
                  @click="confront(id)"
                >
                  <Icon name="bolt" /> Put it to {{ name(id) }}
                </button>
              </template>
              <span v-else class="small muted">
                No questions left this hour — it will keep until the next.
              </span>
            </p>
          </div>
        </div>
      </Transition>
    </section>

    <NoteDeck mode="select" class="notes" />

    <ActionBar>
      <template #aside>
        <button @click="back()"><Icon name="back" /> Back to the household</button>
        <span class="small muted">
          {{ game.questionsLeft }} question{{ game.questionsLeft === 1 ? '' : 's' }} left this hour
        </span>
      </template>
      <button class="primary" data-next @click="strike()">
        {{ game.isLastRound ? 'Face midnight' : 'Let the hour strike' }} <Icon name="forward" />
      </button>
    </ActionBar>
  </div>
</template>

<style scoped>
.deduce {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 68rem;
  margin: 0 auto;
  padding: 1.4rem 1rem 3rem;
}
.head {
  text-align: center;
}
.counts {
  margin: 0.5rem 0 0;
}
.counts strong {
  font-weight: normal;
  white-space: nowrap;
}
.good {
  color: var(--good);
}
.table {
  position: sticky;
  top: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 0.9rem 1rem 1rem;
  border: 1px solid var(--brass-dim);
  /* Green baize, worn. */
  background:
    radial-gradient(ellipse at 50% 0%, rgba(60, 110, 80, 0.35), transparent 70%),
    linear-gradient(180deg, #14241d, #0e1814);
  box-shadow:
    inset 0 0 0 4px rgba(11, 14, 18, 0.8),
    inset 0 0 40px rgba(0, 0, 0, 0.6),
    var(--shadow);
}
.lives {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.35rem;
}
.life {
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 50%;
  background: var(--danger);
  box-shadow: 0 0 10px rgba(192, 71, 60, 0.7);
  transition: all 0.4s ease;
}
.life.lost {
  background: transparent;
  box-shadow: inset 0 0 0 1px var(--line);
  transform: scale(0.8);
}
.slots {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 0.8rem;
  align-items: stretch;
}
@media (max-width: 700px) {
  .slots {
    grid-template-columns: 1fr;
  }
  .versus {
    justify-self: center;
    transform: rotate(90deg);
  }
  .table {
    position: static;
  }
}
.versus {
  display: flex;
  align-items: center;
  font-size: 1.3rem;
}
.slot {
  position: relative;
  min-height: 6.6rem;
  display: grid;
  align-items: stretch;
  border: 2px dashed rgba(236, 228, 208, 0.25);
  border-radius: 3px;
  font-style: italic;
  transition:
    border-color 0.2s,
    background 0.2s;
}
.slot > .muted {
  place-self: center;
  padding: 0.5rem;
  text-align: center;
}
.slot.over {
  border-color: var(--brass);
  background: rgba(212, 175, 74, 0.1);
}
.slot.filled {
  border-style: solid;
  border-color: transparent;
}
.slot.filled :deep(.note-card) {
  animation: land 0.3s cubic-bezier(0.2, 1.3, 0.4, 1) both;
}
.lift {
  position: absolute;
  top: 0.2rem;
  right: 0.2rem;
  padding: 0.2rem 0.35rem;
  color: var(--paper-muted);
}
.lift:hover:not(:disabled) {
  color: var(--paper-ink);
  border-color: var(--paper-line);
}
.verdict {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}
.spent {
  margin: 0;
  color: #f0b0a8;
  font-style: italic;
}
.result {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.3rem 0.4rem;
}
.result p {
  margin: 0;
  font-style: italic;
  line-height: 1.5;
}
.said {
  display: grid;
  gap: 0.5rem;
}
.confront {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  font-style: normal;
}
.press {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.8rem;
  border-color: #f0c24f;
  color: #f0c24f;
}
.stamp {
  flex: none;
  padding: 0.3rem 0.8rem 0.2rem;
  border: 3px double currentColor;
  font-family: var(--font-type);
  font-size: 1.05rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  animation: stamp 0.45s cubic-bezier(0.3, 1.4, 0.5, 1) 0.2s both;
}
.result.contradiction .stamp {
  color: #f0c24f;
  text-shadow: 0 0 14px rgba(240, 194, 79, 0.6);
}
.result.link .stamp {
  color: #8fce8a;
}
.result.known .stamp {
  color: var(--muted);
}
.result.miss .stamp {
  color: #e0695d;
}
.result.contradiction {
  animation: flare 0.9s ease-out;
}
@media (max-width: 600px) {
  .result {
    flex-direction: column;
    text-align: center;
  }
}
.foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.6rem;
}
@keyframes land {
  from {
    opacity: 0;
    transform: translateY(-18px) rotate(-3deg) scale(1.06);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@keyframes flare {
  0% {
    box-shadow: 0 0 0 0 rgba(240, 194, 79, 0.9);
    background: rgba(240, 194, 79, 0.35);
  }
  100% {
    box-shadow: 0 0 60px 30px rgba(240, 194, 79, 0);
    background: transparent;
  }
}
</style>

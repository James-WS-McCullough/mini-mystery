<script setup lang="ts">
import { computed } from 'vue'
import { useGame } from '../stores/game'
import Notebook from './Notebook.vue'

const game = useGame()
const remaining = computed(() => game.undrawnContradictions + game.undrawnLinks)
const canTest = computed(() => game.deduceSelection.length === 2 && game.missesLeft > 0)
</script>

<template>
  <div class="deduce">
    <header class="head">
      <h2 class="brass">Before the hour strikes…</h2>
      <p class="lede muted">
        You spread your notes across the table. What cannot both be true — and what holds
        together?
      </p>
      <p class="counts">
        <template v-if="remaining > 0">
          By your reckoning, your notes still hold
          <strong class="brass">⚡ {{ game.undrawnContradictions }}</strong>
          contradiction{{ game.undrawnContradictions === 1 ? '' : 's' }} and
          <strong class="brass">🔗 {{ game.undrawnLinks }}</strong>
          corroboration{{ game.undrawnLinks === 1 ? '' : 's' }}
          <span class="muted">({{ game.realized.length }} drawn)</span> —
          <span :class="game.missesLeft > 0 ? '' : 'spent'">
            {{ game.missesLeft }} wrong guess{{ game.missesLeft === 1 ? '' : 'es' }} left tonight.
          </span>
        </template>
        <template v-else>
          You have drawn every thread your notes will yield — for now.
        </template>
      </p>
    </header>

    <div class="bench panel">
      <div class="slots">
        <div class="slot" :class="{ filled: game.deduceSelection[0] }">
          {{ game.deduceSelection[0] ? game.labelOf(game.deduceSelection[0]) : 'choose a first note below…' }}
        </div>
        <span class="vs brass">⟷</span>
        <div class="slot" :class="{ filled: game.deduceSelection[1] }">
          {{ game.deduceSelection[1] ? game.labelOf(game.deduceSelection[1]) : 'choose a second note…' }}
        </div>
        <button class="primary" :disabled="!canTest" @click="game.testPair()">Test the pair</button>
      </div>
      <p
        v-if="game.lastDeduceResult"
        class="result"
        :class="game.lastDeduceResult.ok ? 'good' : 'bad'"
      >
        {{ game.lastDeduceResult.text }}
      </p>
    </div>

    <div class="notes">
      <Notebook mode="select" />
    </div>

    <footer class="foot">
      <button class="primary big" @click="game.strikeHour()">
        {{ game.isLastRound ? 'Face midnight →' : 'Let the hour strike →' }}
      </button>
    </footer>
  </div>
</template>

<style scoped>
.deduce {
  height: calc(100vh - 3.2rem);
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  max-width: 60rem;
  margin: 0 auto;
  width: 100%;
  padding: 0.8rem 1rem;
}
.head {
  text-align: center;
}
.head h2 {
  margin: 0;
  letter-spacing: 0.1em;
}
.lede {
  font-style: italic;
  margin: 0.2rem 0;
}
.counts {
  margin: 0.2rem 0 0;
}
.spent {
  color: var(--danger);
}
.bench {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.slots {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto;
  gap: 0.5rem;
  align-items: center;
}
@media (max-width: 760px) {
  .slots {
    grid-template-columns: 1fr;
  }
}
.slot {
  border: 1px dashed var(--line);
  border-radius: 3px;
  padding: 0.45rem 0.6rem;
  min-height: 2.4rem;
  font-size: 0.88rem;
  color: var(--muted);
  display: flex;
  align-items: center;
}
.slot.filled {
  border-style: solid;
  border-color: var(--brass);
  color: var(--ink);
}
.vs {
  font-size: 1.2rem;
}
.result {
  margin: 0;
  font-style: italic;
}
.result.good {
  color: var(--good);
}
.result.bad {
  color: var(--danger);
}
.notes {
  flex: 1;
  min-height: 0;
  display: flex;
}
.notes > :deep(.notebook) {
  flex: 1;
}
.foot {
  text-align: center;
}
.big {
  font-size: 1.05rem;
  padding: 0.55rem 1.4rem;
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { useGame } from '../stores/game'
import Notebook from './Notebook.vue'
import PillarRow from './PillarRow.vue'

const game = useGame()
const cast = computed(() => game.mystery?.cast ?? [])
const board = computed(() => game.accuseBoard)

function stateOf(id: number): 'cleared' | 'sole' | 'open' {
  return board.value?.states[id] ?? 'open'
}
function iconOf(id: number): string {
  const st = stateOf(id)
  if (st === 'cleared') return '✓'
  if (st === 'sole') return '⚠'
  return '?'
}
const remainingNames = computed(() =>
  (board.value?.remaining ?? [])
    .filter((c) => c !== game.accusedId)
    .map((c) => cast.value[c]?.shortName ?? '')
    .join(', '),
)
</script>

<template>
  <div class="accuse" v-if="game.mystery">
    <header class="panel head">
      <h2 class="brass">The Accusation</h2>
      <p class="muted small">
        Name the murderer of {{ game.mystery.caseSheet.victimName }}, and build the case:
        cite up to {{ game.citeCap }} elements — a drawn thread counts as one. The board
        answers only to what you put forward. ({{ game.citeCount }}/{{ game.citeCap }} cited)
      </p>
    </header>

    <div class="board panel">
      <button
        v-for="m in cast"
        :key="m.id"
        class="suspect"
        :class="[stateOf(m.id), { accused: game.accusedId === m.id }]"
        @click="game.accusedId = m.id"
      >
        <span class="portrait">{{ m.portrait }}</span>
        <span class="name">{{ m.shortName }}</span>
        <span class="icon" :class="stateOf(m.id)">
          {{ iconOf(m.id) }}<span v-if="game.caughtLying.has(m.id)" title="caught lying">🎭</span>
        </span>
        <PillarRow :pillars="game.citedPillars(m.id)" />
        <span v-if="game.accusedId === m.id" class="tag">accused</span>
      </button>
    </div>
    <p class="small verdictline" v-if="board">
      Your case clears <strong class="brass">{{ board.clearedCount }}</strong> of the seven.
      <template v-if="remainingNames">
        It still allows: <span class="muted">{{ remainingNames }}</span
        ><template v-if="game.accusedId !== null"> — besides your accused</template>.
      </template>
      <template v-else-if="game.accusedId !== null && board.remaining.length === 1">
        <strong class="brass">Only your accused remains. Airtight.</strong>
      </template>
    </p>

    <div class="cite">
      <Notebook mode="cite" />
    </div>

    <footer class="foot">
      <button
        class="danger big"
        :disabled="game.accusedId === null"
        @click="game.submitAccusation()"
      >
        Point the finger
      </button>
      <button v-if="!game.accusationForced" class="quiet" @click="game.backToPlay()">
        …not yet. Back to the questioning.
      </button>
      <span v-else class="small muted">Midnight. There is no going back.</span>
    </footer>
  </div>
</template>

<style scoped>
.accuse {
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem;
  max-width: 64rem;
  margin: 0 auto;
  width: 100%;
}
.head {
  padding: 0.6rem 1rem;
  text-align: center;
}
.head h2 {
  margin: 0;
  letter-spacing: 0.12em;
}
.head p {
  margin: 0.3rem 0 0;
}
.board {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.4rem;
}
@media (max-width: 900px) {
  .board {
    grid-template-columns: repeat(4, 1fr);
  }
}
.suspect {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  padding: 0.55rem 0.25rem;
  position: relative;
}
.suspect .portrait {
  font-size: 1.6rem;
}
.suspect .name {
  font-size: 0.85rem;
}
.suspect.cleared {
  opacity: 0.55;
}
.suspect.accused {
  border-color: var(--danger);
  background: #33201d;
  opacity: 1;
}
.icon {
  font-size: 0.9rem;
}
.icon.cleared {
  color: var(--good);
}
.icon.sole {
  color: var(--danger);
}
.icon.open {
  color: var(--muted);
}
.tag {
  font-size: 0.7rem;
  color: var(--danger);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.verdictline {
  margin: 0;
  text-align: center;
}
.cite {
  flex: 1;
  min-height: 0;
  display: flex;
}
.cite > :deep(.notebook) {
  flex: 1;
}
.foot {
  display: flex;
  gap: 0.8rem;
  align-items: center;
  justify-content: center;
}
.big {
  font-size: 1.05rem;
  padding: 0.55rem 1.3rem;
}
.quiet {
  background: transparent;
  border: 0;
  color: var(--muted);
  text-decoration: underline;
}
</style>

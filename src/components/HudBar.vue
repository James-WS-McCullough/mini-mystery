<script setup lang="ts">
import { useGame } from '../stores/game'

const game = useGame()
</script>

<template>
  <header class="hud">
    <span class="clock brass">🕰 {{ game.clockLabel }}</span>
    <span v-if="game.stage === 'question'" class="pips" title="Questions left this hour">
      <span
        v-for="i in game.mystery?.config.questionsPerRound ?? 0"
        :key="i"
        class="pip"
        :class="{ spent: i > game.questionsLeft }"
      />
    </span>
    <span class="spacer" />
    <button v-if="game.stage !== 'deduce'" @click="game.notebookOpen = !game.notebookOpen">
      📓 Notebook <span v-if="game.realized.length > 0" class="brass">⚡{{ game.realized.length }}</span>
    </button>
    <button v-if="game.stage === 'question'" @click="game.beginDeduce()">
      Close the hour’s questioning
    </button>
    <button class="danger" @click="game.beginAccuse()">Accuse</button>
  </header>
</template>

<style scoped>
.hud {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.55rem 1rem;
  border-bottom: 1px solid var(--line);
  background: var(--panel);
}
.clock {
  font-size: 1.05rem;
}
.spacer {
  flex: 1;
}
.pips {
  display: inline-flex;
  gap: 0.3rem;
  align-items: center;
}
.pip {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background: var(--brass);
  display: inline-block;
}
.pip.spent {
  background: var(--line);
}
</style>

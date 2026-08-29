<script setup lang="ts">
import { ref } from 'vue'
import { useGame } from '../stores/game'

const game = useGame()
const seedInput = ref('')
const deck = ref<'classic' | 'foggy'>('classic')

function start() {
  const n = Number(seedInput.value)
  game.newGame(Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined, deck.value)
}
</script>

<template>
  <main class="title">
    <p class="small brass ornament">· · ─────── ✦ ─────── · ·</p>
    <h1>MINI&thinsp;·&thinsp;MYSTERY</h1>
    <p class="muted">A single-player social deduction<br />at Blackwood Manor, 1926</p>
    <p class="small muted blurb">
      Seven guests. One murderer among them, and everyone playing an angle.
      Search the rooms, question the household, catch the contradictions —
      and name the killer before midnight, with proof enough to convince the house.
    </p>
    <div class="controls">
      <button class="primary" @click="start()">Take the case</button>
      <label class="small">
        <select v-model="deck">
          <option value="classic">A Classic Evening — two of thief, grudge, and loner walk among the guests</option>
          <option value="foggy">The Foggy Night — the pool adds a guest who is sincerely, dangerously wrong</option>
        </select>
      </label>
      <div class="seed">
        <input v-model="seedInput" placeholder="case number (optional)" />
        <span class="small muted">The same case number deals the same mystery.</span>
      </div>
    </div>
    <p class="small brass ornament">· · ─────── ✦ ─────── · ·</p>
  </main>
</template>

<style scoped>
.title {
  max-width: 34rem;
  margin: 9vh auto;
  text-align: center;
  padding: 0 1rem;
}
h1 {
  font-size: 2.6rem;
  letter-spacing: 0.35rem;
  color: var(--brass);
  margin: 0.5rem 0 0.2rem;
}
.blurb {
  margin: 1.4rem 0;
  line-height: 1.5;
}
.controls {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  align-items: center;
  margin: 1.5rem 0;
}
.controls button {
  font-size: 1.1rem;
  padding: 0.6rem 1.6rem;
}
.seed {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: center;
}
input {
  font: inherit;
  background: var(--panel-2);
  color: var(--ink);
  border: 1px solid var(--line);
  border-radius: 3px;
  padding: 0.35rem 0.6rem;
  text-align: center;
}
.ornament {
  letter-spacing: 0.2em;
}
</style>

<script setup lang="ts">
import { useGame } from '../stores/game'
import { sfx } from '../ui/audio'
import ActionBar from './ActionBar.vue'
import CaseFile from './CaseFile.vue'
import Icon from './Icon.vue'

const game = useGame()
function summon() {
  sfx('select')
  game.begin()
}
</script>

<template>
  <main v-if="game.mystery" class="intro">
    <header>
      <p class="file brass">{{ game.daily ? `The daily case · ${game.daily}` : 'Case file' }}</p>
      <h2 class="heading">Case №{{ game.mystery.seed }}</h2>
    </header>
    <p class="narration">{{ game.introText }}</p>

    <CaseFile />

    <ActionBar>
      <button class="primary" data-next @click="summon()">
        Summon {{ game.place.people }} <Icon name="forward" />
      </button>
    </ActionBar>
  </main>
</template>

<style scoped>
.intro {
  max-width: 48rem;
  margin: 0 auto;
  padding: 2.2rem 1rem 3.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}
header {
  text-align: center;
}
.file {
  margin: 0 0 0.2rem;
  font-family: var(--font-display);
  letter-spacing: 0.3em;
  text-transform: uppercase;
  font-size: 0.85rem;
}
.narration {
  line-height: 1.65;
  font-style: italic;
  font-size: 1.08rem;
  max-width: 44rem;
  margin: 0 auto;
  text-align: center;
}
.primary {
  align-self: center;
}
</style>

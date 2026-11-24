<script setup lang="ts">
// The case file, before the first hour: who is dead, where they were found,
// and what the night allows. The detective arrives the following evening.
import { computed } from 'vue'
import { roomName } from '../../engine/timeline/render'
import { useTimeline } from '../../stores/timeline'
import ActionBar from '../ActionBar.vue'
import Icon from '../Icon.vue'
import TimelineCaseSheet from './TimelineCaseSheet.vue'

const tl = useTimeline()
const tc = computed(() => tl.tc!)
</script>

<template>
  <main class="intro">
    <header>
      <p class="file brass">The Evening Timeline · playtest</p>
      <h2 class="heading">Case №{{ tc.seed }}</h2>
    </header>
    <p class="narration">
      You come up the drive the following evening, a little before eight. Last night, after a dinner at Blackwood Manor,
      {{ tc.victimName }} was found dead in {{ roomName(tc, tc.scene) }}. Nobody has left the house since. You have until
      midnight to find out what happened last night, and when, and who was unaccounted for at the moment it was done.
    </p>
    <TimelineCaseSheet />
    <ActionBar>
      <button class="primary" data-next @click="tl.begin()">Begin the investigation <Icon name="forward" /></button>
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
  margin: 0 auto;
  text-align: center;
}
</style>

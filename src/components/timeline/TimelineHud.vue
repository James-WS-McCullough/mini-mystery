<script setup lang="ts">
// The bar across the top through the hours, as the classic night has it: the
// clock, the questions left, and the timeline, the case file and the
// accusation to hand.
import { computed } from 'vue'
import { BUDGET } from '../../engine/timeline/bot'
import { useTimeline } from '../../stores/timeline'
import ClockFace from '../ClockFace.vue'
import Icon from '../Icon.vue'

const tl = useTimeline()
const emit = defineEmits<{ (e: 'caseFile'): void; (e: 'leave'): void }>()
const HOURS = ['Eight', 'Nine', 'Ten', 'Eleven']
const spent = computed(() => (tl.stage === 'question' ? 1 - tl.questionsLeft / BUDGET.questions : 0))
</script>

<template>
  <header class="hud">
    <div class="left">
      <ClockFace :hour="8 + tl.hour" :spent="spent" />
      <span class="time">{{ HOURS[tl.hour] }} o’clock</span>
      <span v-if="tl.stage === 'question'" class="pips" :title="`${tl.questionsLeft} questions left this hour`">
        <span v-for="i in BUDGET.questions" :key="i" class="pip" :class="{ spent: i > tl.questionsLeft }" />
      </span>
    </div>
    <nav>
      <button class="ghost" @click="tl.boardOpen = true"><Icon name="clock" /> Timeline</button>
      <button class="ghost" @click="emit('caseFile')"><Icon name="letter" /> Case file</button>
      <button class="danger" @click="tl.toAccuse()"><Icon name="scales" /> Accuse</button>
      <button class="ghost" title="Leave the playtest" @click="emit('leave')"><Icon name="close" /></button>
    </nav>
  </header>
</template>

<style scoped>
.hud {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 16px;
  background: rgba(11, 14, 18, 0.92);
  border-bottom: 1px solid var(--brass-deep);
}
.left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.time {
  font-family: var(--font-display);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--brass);
}
.pips {
  display: flex;
  gap: 4px;
}
.pip {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: var(--brass);
}
.pip.spent {
  background: var(--line);
}
nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
nav button {
  padding: 0.35rem 0.7rem;
  font-size: 0.85rem;
}
@media (max-width: 560px) {
  .time {
    display: none;
  }
}
</style>

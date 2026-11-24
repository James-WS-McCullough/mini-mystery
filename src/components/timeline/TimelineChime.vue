<script setup lang="ts">
// The hour strikes, as it does in the classic night: the hall clock and the
// hour's name, and a click to go on.
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { BUDGET } from '../../engine/timeline/bot'
import { useTimeline } from '../../stores/timeline'
import ClockFace from '../ClockFace.vue'

const tl = useTimeline()
const HOURS = ['Eight', 'Nine', 'Ten', 'Eleven', 'Midnight']
const heading = computed(() => `${HOURS[tl.hour]} o’clock`)
const line = computed(() =>
  tl.hour === 0
    ? 'The household is gathered in the drawing room, waiting to be asked about last night.'
    : tl.hour === BUDGET.hours - 1
      ? 'The last hour before midnight.'
      : `${BUDGET.hours - tl.hour} hours until midnight.`,
)
let timer: ReturnType<typeof setTimeout> | undefined
onMounted(() => (timer = setTimeout(() => tl.finishTransition(), 2600)))
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="transition" @click="tl.finishTransition()">
    <div class="chime">
      <p class="deco"><span /></p>
      <div class="pendulum"><ClockFace :hour="8 + tl.hour" size="6.5rem" /></div>
      <h1>{{ heading }}</h1>
      <p class="deco"><span /></p>
      <p class="small muted">{{ line }}</p>
    </div>
  </div>
</template>

<style scoped>
.transition {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at center, rgba(20, 25, 32, 0.4) 0%, rgba(4, 5, 7, 0.88) 75%);
  cursor: pointer;
}
.chime {
  text-align: center;
  max-width: 36rem;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.7rem;
}
h1 {
  font-size: clamp(2.4rem, 8vw, 4rem);
  letter-spacing: 0.4rem;
  color: var(--brass);
  margin: 0;
  text-transform: uppercase;
  animation: strike 1.4s ease-out both;
  text-shadow: 0 0 30px rgba(212, 175, 74, 0.4);
}
.pendulum {
  filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.7));
}
@keyframes strike {
  from {
    opacity: 0;
    letter-spacing: 1.2rem;
  }
}
</style>

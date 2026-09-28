<script setup lang="ts">
// The hall clock. The hour hand marks the hour; the minute hand creeps round
// as the hour's questions are spent.
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{ hour: number; spent?: number; size?: string; midnight?: boolean }>(),
  { spent: 0, size: '2.4rem' },
)

const minuteAngle = computed(() => Math.min(1, Math.max(0, props.spent)) * 360)
const hourAngle = computed(() => ((props.hour % 12) + Math.min(1, props.spent)) * 30)
const ticks = Array.from({ length: 12 }, (_, i) => i * 30)
</script>

<template>
  <svg class="clock" :class="{ midnight }" viewBox="0 0 48 48" :style="{ width: size }" aria-hidden="true">
    <circle cx="24" cy="24" r="22" class="case" />
    <circle cx="24" cy="24" r="19" class="face" />
    <path
      v-for="t in ticks"
      :key="t"
      :d="t % 90 === 0 ? 'M24 6.5v4' : 'M24 6.5v2'"
      class="tick"
      :transform="`rotate(${t} 24 24)`"
    />
    <path d="M24 25V13.5" class="hand hour" :style="{ transform: `rotate(${hourAngle}deg)` }" />
    <path d="M24 26V8.5" class="hand minute" :style="{ transform: `rotate(${minuteAngle}deg)` }" />
    <circle cx="24" cy="24" r="1.6" class="pin" />
  </svg>
</template>

<style scoped>
.clock {
  display: block;
  flex: none;
  height: auto;
}
.case {
  fill: #0b0e12;
  stroke: var(--brass);
  stroke-width: 1.5;
}
.face {
  fill: #ece4d0;
}
.tick {
  stroke: #2a241a;
  stroke-width: 1;
  stroke-linecap: round;
}
.hand {
  stroke: #1a1510;
  stroke-linecap: round;
  transform-origin: 24px 24px;
  transition: transform 0.7s cubic-bezier(0.3, 1.5, 0.5, 1);
}
.hand.hour {
  stroke-width: 2.4;
}
.hand.minute {
  stroke-width: 1.4;
}
.pin {
  fill: var(--danger);
}
.midnight .case {
  stroke: var(--danger);
}
</style>

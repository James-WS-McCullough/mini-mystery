<script setup lang="ts">
import type { Pillars, PillarState } from '../engine/verdict'
import Icon, { type IconName } from './Icon.vue'

defineProps<{ pillars: Pillars | null; labelled?: boolean }>()

const LABELS: Record<keyof Pillars, string> = {
  means: 'means',
  motive: 'motive',
  opportunity: 'opportunity',
}
const ICONS: Record<keyof Pillars, IconName> = {
  means: 'key',
  motive: 'heart',
  opportunity: 'steps',
}

function describe(key: keyof Pillars, state: PillarState): string {
  const what = LABELS[key]
  if (state === 'established') {
    return key === 'opportunity'
      ? 'opportunity: their account of the hour is broken'
      : `${what}: established against them`
  }
  if (state === 'ruledOut') {
    return key === 'opportunity' ? 'opportunity: their whereabouts are vouched for' : `${what}: ruled out`
  }
  return `${what}: unknown`
}

const keys: (keyof Pillars)[] = ['means', 'motive', 'opportunity']
</script>

<template>
  <span v-if="pillars" class="pillars" :class="{ labelled }">
    <span
      v-for="k in keys"
      :key="`${k}-${pillars[k]}`"
      class="pillar"
      :class="pillars[k]"
      :title="describe(k, pillars[k])"
      role="img"
      :aria-label="describe(k, pillars[k])"
    >
      <Icon :name="ICONS[k]" />
      <span v-if="labelled" class="word">{{ LABELS[k] }}</span>
      <Icon v-if="pillars[k] === 'ruledOut'" name="check" class="tick" />
    </span>
  </span>
</template>

<style scoped>
.pillars {
  display: inline-flex;
  gap: 0.35rem;
  align-items: center;
}
.pillar {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.95rem;
  color: var(--muted);
  opacity: 0.4;
}
.labelled .pillar {
  padding: 0.15rem 0.5rem;
  border: 1px solid currentColor;
  font-size: 0.85rem;
}
.word {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.72rem;
}
.pillar.established {
  color: #ee7c6f;
  opacity: 1;
  filter: drop-shadow(0 0 5px rgba(192, 71, 60, 0.9));
  animation: light-up 0.7s ease-out;
}
.pillar.ruledOut {
  color: var(--good);
  opacity: 0.9;
  animation: light-up 0.7s ease-out;
}
.tick {
  font-size: 0.6rem;
  margin-left: -0.2rem;
  align-self: flex-start;
}
@keyframes light-up {
  0% {
    transform: scale(2);
    filter: brightness(2.5);
  }
  100% {
    transform: none;
  }
}
</style>

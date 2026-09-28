<script setup lang="ts">
import type { Pillars, PillarState } from '../engine/verdict'

const props = defineProps<{ pillars: Pillars | null }>()

const LABELS: Record<keyof Pillars, string> = {
  means: 'means',
  motive: 'motive',
  opportunity: 'opportunity',
}
const ICONS: Record<keyof Pillars, string> = {
  means: '🗝',
  motive: '🖤',
  opportunity: '👣',
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
void props
</script>

<template>
  <span v-if="pillars" class="pillars">
    <span v-for="k in keys" :key="k" class="pillar" :class="pillars[k]" :title="describe(k, pillars[k])">
      {{ ICONS[k] }}
    </span>
  </span>
</template>

<style scoped>
.pillars {
  display: inline-flex;
  gap: 0.28rem;
  align-items: center;
}
.pillar {
  font-size: 0.85rem;
  filter: grayscale(1);
  opacity: 0.35;
}
.pillar.established {
  filter: none;
  opacity: 1;
  text-shadow: 0 0 6px rgba(176, 72, 63, 0.8);
}
.pillar.ruledOut {
  filter: grayscale(1);
  opacity: 0.9;
  position: relative;
}
.pillar.ruledOut::after {
  content: '✓';
  color: var(--good);
  font-size: 0.65rem;
  position: absolute;
  right: -0.35rem;
  top: -0.2rem;
}
</style>

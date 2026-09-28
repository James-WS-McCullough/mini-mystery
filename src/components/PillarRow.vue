<script setup lang="ts">
import type { Pillars, PillarState } from '../engine/verdict'
import Icon, { type IconName } from './Icon.vue'

defineProps<{ pillars: Pillars | null; labelled?: boolean }>()

const ICONS: Record<keyof Pillars, IconName> = {
  means: 'key',
  motive: 'heart',
  opportunity: 'steps',
}

/** In words, so that nobody has to guess what a colour means. */
const WORDS: Record<keyof Pillars, Record<PillarState, [short: string, long: string]>> = {
  means: {
    established: ['could have', 'Means: they could have done it this way — it stands against them'],
    ruledOut: ['could not', 'Means: they could not have done it this way — it rules them out'],
    unknown: ['means?', 'Means: you do not yet know how it was done'],
  },
  motive: {
    established: ['had a motive', 'Motive: they had reason to — it stands against them'],
    ruledOut: ['no motive', 'Motive: they had no reason to — it speaks for them'],
    unknown: ['motive?', 'Motive: nothing known either way'],
  },
  opportunity: {
    established: ['account broken', 'Opportunity: their account of the hour is broken — it stands against them'],
    ruledOut: ['accounted for', 'Opportunity: their whereabouts are borne out — it rules them out'],
    unknown: ['opportunity?', 'Opportunity: their account is neither broken nor borne out'],
  },
}
const describe = (key: keyof Pillars, state: PillarState) => WORDS[key][state][1]

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
      <span v-if="labelled" class="word">{{ WORDS[k][pillars[k]][0] }}</span>
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
/* Ruled out is struck through, not merely coloured. */
.pillar.ruledOut::after {
  content: '';
  position: absolute;
  left: -0.12rem;
  right: -0.12rem;
  top: 50%;
  border-top: 2px solid currentColor;
  transform: rotate(-24deg);
}
.labelled .pillar.ruledOut::after {
  display: none;
}
.labelled .pillar.ruledOut .word {
  text-decoration: line-through;
}
.labelled {
  flex-wrap: wrap;
  justify-content: center;
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

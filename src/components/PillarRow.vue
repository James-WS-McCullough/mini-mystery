<script setup lang="ts">
import type { Pillars, PillarState } from '../engine/verdict'
import Icon, { type IconName } from './Icon.vue'

defineProps<{
  pillars: Pillars | null
  labelled?: boolean
  /** The detective's own marks, to be changed by clicking. */
  editable?: boolean
  /** Whose marks they are, for saying so aloud. */
  of?: string
}>()
const emit = defineEmits<{ (e: 'cycle', sign: keyof Pillars): void }>()

const ICONS: Record<keyof Pillars, IconName> = {
  means: 'key',
  motive: 'heart',
  opportunity: 'steps',
}

/** In words, so that nobody has to guess what a colour means. */
const WORDS: Record<keyof Pillars, Record<PillarState, [short: string, long: string]>> = {
  means: {
    established: ['could have', 'Means: they could have done it this way'],
    ruledOut: ['could not', 'Means: they could not have done it this way'],
    unknown: ['means?', 'Means: not marked'],
  },
  motive: {
    established: ['had a motive', 'Motive: they had reason to'],
    ruledOut: ['no motive', 'Motive: they had no reason to'],
    unknown: ['motive?', 'Motive: not marked'],
  },
  opportunity: {
    established: ['had the chance', 'Opportunity: they could have been at the scene'],
    ruledOut: ['accounted for', 'Opportunity: their hour is accounted for'],
    unknown: ['opportunity?', 'Opportunity: not marked'],
  },
}
const describe = (key: keyof Pillars, state: PillarState) => WORDS[key][state][1]

const keys: (keyof Pillars)[] = ['means', 'motive', 'opportunity']
</script>

<template>
  <span v-if="pillars" class="pillars" :class="{ labelled, editable }">
    <component
      :is="editable ? 'button' : 'span'"
      v-for="k in keys"
      :key="`${k}-${pillars[k]}`"
      class="pillar"
      :class="pillars[k]"
      :title="editable ? `${describe(k, pillars[k])} — click to change your mark` : describe(k, pillars[k])"
      :role="editable ? undefined : 'img'"
      :aria-label="`${of ? `${of} — ` : ''}${describe(k, pillars[k])}`"
      @click.stop="editable && emit('cycle', k)"
    >
      <Icon :name="ICONS[k]" />
      <span v-if="labelled" class="word">{{ WORDS[k][pillars[k]][0] }}</span>
    </component>
  </span>
</template>

<style scoped>
.pillars {
  display: inline-flex;
  gap: 0.35rem;
  align-items: center;
}
button.pillar {
  background: transparent;
  border: 1px solid transparent;
  box-shadow: none;
  padding: 0.4rem 0.6rem;
  min-width: 2.75rem;
  min-height: 2.5rem;
  border-color: rgba(255, 255, 255, 0.09);
  font-size: 1.25rem;
  justify-content: center;
  cursor: pointer;
}
button.pillar:hover:not(:disabled) {
  opacity: 1;
  border-color: var(--brass-dim);
  transform: none;
  box-shadow: none;
}
.editable .pillar.unknown {
  opacity: 0.6;
}
.editable .pillar.established {
  border-color: rgba(238, 124, 111, 0.5);
}
.editable .pillar.ruledOut {
  border-color: currentColor;
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

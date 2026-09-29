<script setup lang="ts">
import { ref } from 'vue'
import type { Pillars, PillarState } from '../engine/verdict'
import Icon, { type IconName } from './Icon.vue'
import PopMenu from './PopMenu.vue'

defineProps<{
  pillars: Pillars | null
  labelled?: boolean
  /** The detective's own marks, to be set from a small menu. */
  editable?: boolean
  /** Whose marks they are, for saying so aloud. */
  of?: string
}>()
const emit = defineEmits<{ (e: 'set', mark: { sign: keyof Pillars; to: PillarState }): void }>()

const ICONS: Record<keyof Pillars, IconName> = {
  means: 'key',
  motive: 'heart',
  opportunity: 'steps',
}
const NAMES: Record<keyof Pillars, string> = {
  means: 'Means',
  motive: 'Motive',
  opportunity: 'Opportunity',
}

/** In words, so that nobody has to guess what a colour means. */
const WORDS: Record<keyof Pillars, Record<PillarState, [short: string, long: string]>> = {
  means: {
    established: ['has means', 'Means: they could have done it this way'],
    ruledOut: ['no means', 'Means: they could not have done it this way'],
    unknown: ['means?', 'Means: undecided'],
  },
  motive: {
    established: ['has motive', 'Motive: they had reason to'],
    ruledOut: ['no motive', 'Motive: they had no reason to'],
    unknown: ['motive?', 'Motive: undecided'],
  },
  opportunity: {
    established: ['has opportunity', 'Opportunity: they could have been at the scene'],
    ruledOut: ['no opportunity', 'Opportunity: their hour is accounted for'],
    unknown: ['opportunity?', 'Opportunity: undecided'],
  },
}
const describe = (key: keyof Pillars, state: PillarState) => WORDS[key][state][1]

const keys: (keyof Pillars)[] = ['means', 'motive', 'opportunity']
const CHOICES: PillarState[] = ['unknown', 'established', 'ruledOut']
const choiceLabel = (key: keyof Pillars, state: PillarState) =>
  state === 'unknown' ? 'Undecided' : `${state === 'established' ? 'Has' : 'No'} ${NAMES[key]}`

// ---- the menu ----
const open = ref<{ key: keyof Pillars; anchor: HTMLElement } | null>(null)

function toggle(key: keyof Pillars, e: Event) {
  open.value =
    open.value?.key === key ? null : { key, anchor: e.currentTarget as HTMLElement }
}
function choose(key: keyof Pillars, to: PillarState) {
  open.value = null
  emit('set', { sign: key, to })
}
</script>

<template>
  <span v-if="pillars" class="pillars" :class="{ labelled, editable }">
    <component
      :is="editable ? 'button' : 'span'"
      v-for="k in keys"
      :key="`${k}-${pillars[k]}`"
      class="pillar"
      :class="[pillars[k], { open: open?.key === k }]"
      :title="editable ? undefined : describe(k, pillars[k])"
      :role="editable ? undefined : 'img'"
      :aria-label="`${of ? `${of} — ` : ''}${describe(k, pillars[k])}`"
      :aria-haspopup="editable ? 'menu' : undefined"
      :aria-expanded="editable ? open?.key === k : undefined"
      @click.stop="editable && toggle(k, $event)"
    >
      <Icon :name="ICONS[k]" />
      <span v-if="labelled" class="word">{{ WORDS[k][pillars[k]][0] }}</span>
    </component>
    <PopMenu v-if="editable && open" :anchor="open.anchor" :label="NAMES[open.key]" @close="open = null">
      <button
        v-for="state in CHOICES"
        :key="state"
        class="pick"
        :class="[state, { on: pillars[open.key] === state }]"
        role="menuitemradio"
        :aria-checked="pillars[open.key] === state"
        @click.stop="choose(open.key, state)"
      >
        <Icon :name="pillars[open.key] === state ? 'check' : ICONS[open.key]" />
        {{ choiceLabel(open.key, state) }}
      </button>
    </PopMenu>
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
  border: 1px solid rgba(255, 255, 255, 0.09);
  box-shadow: none;
  padding: 0.4rem 0.6rem;
  min-width: 2.75rem;
  min-height: 2.5rem;
  font-size: 1.25rem;
  justify-content: center;
  cursor: pointer;
}
button.pillar:hover:not(:disabled),
button.pillar.open {
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
.labelled.editable button.pillar {
  padding: 0.35rem 0.6rem;
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
  left: 0.3rem;
  right: 0.3rem;
  top: 50%;
  border-top: 2px solid currentColor;
  transform: rotate(-24deg);
}
span.pillar.ruledOut::after {
  left: -0.12rem;
  right: -0.12rem;
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

button.pick {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  width: 100%;
  min-width: 11rem;
  padding: 0.55rem 0.7rem;
  background: transparent;
  border: 1px solid transparent;
  box-shadow: none;
  color: var(--muted);
  font-size: 0.95rem;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
}
button.pick.established {
  color: #ee7c6f;
}
button.pick.ruledOut {
  color: var(--good);
}
button.pick:hover:not(:disabled),
button.pick:focus-visible {
  background: rgba(255, 255, 255, 0.06);
  border-color: transparent;
  transform: none;
  box-shadow: none;
  opacity: 1;
}
button.pick.on {
  border-color: currentColor;
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

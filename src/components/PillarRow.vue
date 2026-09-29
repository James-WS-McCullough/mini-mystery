<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { Pillars, PillarState } from '../engine/verdict'
import Icon, { type IconName } from './Icon.vue'

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
const root = ref<HTMLElement | null>(null)
const open = ref<keyof Pillars | null>(null)

/** Where the menu goes: above, unless there is no room; and never off the side. */
const below = ref(false)
const shift = ref(0)
const MENU = { wide: 184, tall: 150 }

function toggle(key: keyof Pillars, e: Event) {
  if (open.value === key) {
    open.value = null
    return
  }
  const at = (e.currentTarget as HTMLElement).getBoundingClientRect()
  // Clear of the bar across the top of the screen.
  below.value = at.top - MENU.tall < 64
  const middle = at.left + at.width / 2
  const left = middle - MENU.wide / 2
  const right = middle + MENU.wide / 2
  shift.value = left < 8 ? 8 - left : right > window.innerWidth - 8 ? window.innerWidth - 8 - right : 0
  open.value = key
}
function choose(key: keyof Pillars, to: PillarState) {
  open.value = null
  emit('set', { sign: key, to })
}
function outside(e: Event) {
  if (open.value && root.value && !root.value.contains(e.target as Node)) open.value = null
}
function escape(e: KeyboardEvent) {
  if (e.key !== 'Escape' || !open.value) return
  // The menu closes; whatever else Escape does can wait for the next press.
  e.stopPropagation()
  open.value = null
}
onMounted(() => {
  document.addEventListener('pointerdown', outside, true)
  document.addEventListener('keydown', escape, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', outside, true)
  document.removeEventListener('keydown', escape, true)
})
</script>

<template>
  <span v-if="pillars" ref="root" class="pillars" :class="{ labelled, editable }">
    <span v-for="k in keys" :key="k" class="slot">
      <component
        :is="editable ? 'button' : 'span'"
        :key="`${k}-${pillars[k]}`"
        class="pillar"
        :class="[pillars[k], { open: open === k }]"
        :title="editable ? undefined : describe(k, pillars[k])"
        :role="editable ? undefined : 'img'"
        :aria-label="`${of ? `${of} — ` : ''}${describe(k, pillars[k])}`"
        :aria-haspopup="editable ? 'menu' : undefined"
        :aria-expanded="editable ? open === k : undefined"
        @click.stop="editable && toggle(k, $event)"
      >
        <Icon :name="ICONS[k]" />
        <span v-if="labelled" class="word">{{ WORDS[k][pillars[k]][0] }}</span>
      </component>
      <span
        v-if="editable && open === k"
        class="menu"
        :class="{ below }"
        :style="{ marginLeft: `${shift}px` }"
        role="menu"
        :aria-label="NAMES[k]"
      >
        <button
          v-for="state in CHOICES"
          :key="state"
          class="choice"
          :class="[state, { on: pillars[k] === state }]"
          role="menuitemradio"
          :aria-checked="pillars[k] === state"
          @click.stop="choose(k, state)"
        >
          <Icon :name="pillars[k] === state ? 'check' : ICONS[k]" />
          {{ choiceLabel(k, state) }}
        </button>
      </span>
    </span>
  </span>
</template>

<style scoped>
.pillars {
  display: inline-flex;
  gap: 0.35rem;
  align-items: center;
}
.slot {
  position: relative;
  display: inline-flex;
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

.menu {
  position: absolute;
  z-index: 30;
  bottom: calc(100% + 0.35rem);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  width: 11.5rem;
  padding: 0.25rem;
  background: var(--panel, #161d26);
  border: 1px solid var(--brass-dim);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.6);
  animation: rise 0.12s ease-out;
}
.menu.below {
  bottom: auto;
  top: calc(100% + 0.35rem);
}
button.choice {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  width: 100%;
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
button.choice.established {
  color: #ee7c6f;
}
button.choice.ruledOut {
  color: var(--good);
}
button.choice:hover:not(:disabled),
button.choice:focus-visible {
  background: rgba(255, 255, 255, 0.06);
  border-color: transparent;
  transform: none;
  box-shadow: none;
  opacity: 1;
}
button.choice.on {
  border-color: currentColor;
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translate(-50%, 4px);
  }
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

<script setup lang="ts">
// One note, one exhibit or one drawn thread, as a card that can be picked up.
import Icon from './Icon.vue'
import Portrait from './Portrait.vue'

export interface CardData {
  id: string
  kind: 'note' | 'evidence' | 'thread'
  /** Who said it (notes only). */
  speaker?: string
  speakerDefId?: string
  main: string
  /** Second half of a thread: the note it was paired with. */
  pair?: string
  prov?: string
  flag?: 'realized' | 'proven' | 'link' | null
  threadType?: 'contradiction' | 'link'
}

const props = defineProps<{
  card: CardData
  selected?: boolean
  /** Not a control: shown lying on the table. */
  placed?: boolean
  disabled?: boolean
}>()
const emit = defineEmits<{ (e: 'pick', id: string): void }>()

function drag(e: DragEvent) {
  e.dataTransfer?.setData('text/plain', props.card.id)
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}
</script>

<template>
  <component
    :is="placed ? 'div' : 'button'"
    class="note-card paper"
    :class="[card.kind, { selected, placed }]"
    :data-card="card.id"
    :draggable="!placed && !disabled"
    :disabled="placed ? undefined : disabled"
    :aria-pressed="placed ? undefined : selected"
    @click="!placed && emit('pick', card.id)"
    @dragstart="drag"
  >
    <span class="head">
      <template v-if="card.kind === 'note'">
        <Portrait :who="card.speakerDefId" shape="token" size="1.7rem" />
        <strong>{{ card.speaker }}</strong>
      </template>
      <template v-else-if="card.kind === 'evidence'">
        <Icon name="gem" /> <strong>Exhibit</strong>
      </template>
      <template v-else>
        <Icon :name="card.threadType === 'contradiction' ? 'bolt' : 'link'" />
        <strong>{{ card.threadType === 'contradiction' ? 'Contradiction' : 'Corroboration' }}</strong>
      </template>
      <span class="flags">
        <Icon v-if="card.flag === 'proven'" name="double" title="Proven false by evidence" />
        <Icon v-else-if="card.flag === 'realized'" name="bolt" title="Part of a contradiction you drew" />
        <Icon v-else-if="card.flag === 'link'" name="link" title="Part of a corroboration you drew" />
      </span>
    </span>
    <span class="main">{{ card.main }}</span>
    <span v-if="card.pair" class="main pair">{{ card.pair }}</span>
    <span v-if="card.prov" class="prov">{{ card.prov }}</span>
    <span v-if="selected && !placed" class="pinned" aria-hidden="true"><Icon name="pin" /></span>
  </component>
</template>

<style scoped>
.note-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  width: 100%;
  min-height: 6.2rem;
  padding: 0.6rem 0.75rem 0.55rem;
  border: 0;
  text-align: left;
  font-family: var(--font-type);
  font-size: 0.86rem;
  line-height: 1.4;
  color: var(--paper-ink);
  animation: rise 0.3s ease-out both;
}
button.note-card {
  cursor: grab;
}
button.note-card:hover:not(:disabled) {
  transform: translateY(-4px) rotate(-0.6deg);
  box-shadow:
    0 0 0 2px var(--brass-dim),
    0 10px 20px rgba(0, 0, 0, 0.6);
}
button.note-card:active:not(:disabled) {
  cursor: grabbing;
}
.note-card.selected {
  box-shadow:
    0 0 0 2px var(--brass),
    0 0 22px rgba(212, 175, 74, 0.45);
  transform: translateY(-3px);
}
.note-card.evidence {
  background:
    linear-gradient(160deg, #d9d2be, #c5bda6);
}
.note-card.thread {
  background: linear-gradient(160deg, #e6d6b0, #d3bf8e);
}
.head {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid var(--paper-line);
  font-size: 0.8rem;
  letter-spacing: 0.04em;
}
.head strong {
  font-weight: normal;
  text-transform: uppercase;
}
.flags {
  margin-left: auto;
  color: #8a3a2c;
}
/* Lying on the table, a card carries a take-back button in its corner. */
.placed .head {
  padding-right: 1.7rem;
}
.main {
  flex: 1;
}
.pair {
  padding-top: 0.3rem;
  border-top: 1px dashed var(--paper-line);
}
.prov {
  font-size: 0.72rem;
  color: var(--paper-muted);
}
.pinned {
  position: absolute;
  top: -0.55rem;
  right: 0.6rem;
  color: var(--danger);
  font-size: 1.2rem;
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.5));
}
</style>

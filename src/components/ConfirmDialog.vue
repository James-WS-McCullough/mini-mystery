<script setup lang="ts">
// A step that cannot be taken back, asked about before it is taken: what is
// being given up, in a line; what follows from it, under that; and the choice.
import Overlay from './Overlay.vue'

withDefaults(
  defineProps<{
    open: boolean
    /** What is being given up: "You still have 3 questions to ask." */
    line: string
    /** What follows from it: "You won't be able to go back." */
    note?: string
    confirm: string
    /** The confirming button in red, for the accusation. */
    danger?: boolean
  }>(),
  { note: undefined, danger: false },
)
const emit = defineEmits<{ (e: 'cancel'): void; (e: 'confirm'): void }>()
</script>

<template>
  <Overlay :open="open" title="Are you sure?" width="28rem" @close="emit('cancel')">
    <p class="line">{{ line }}</p>
    <p v-if="note" class="note">{{ note }}</p>
    <template #actions>
      <button @click="emit('cancel')">Cancel</button>
      <button :class="danger ? 'danger' : 'primary'" data-confirm @click="emit('confirm')">
        {{ confirm }}
      </button>
    </template>
  </Overlay>
</template>

<style scoped>
.line {
  margin: 0;
  font-size: 1.1rem;
  line-height: 1.5;
}
.note {
  margin: 0.45rem 0 0;
  font-size: 0.9rem;
  color: var(--muted);
}
/* On a phone the two answers share the width, the one to go ahead on top. */
@media (max-width: 560px) {
  button {
    flex: 1 1 100%;
  }
  button[data-confirm] {
    order: -1;
  }
}
</style>

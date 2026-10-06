<script setup lang="ts">
// A slip of paper by the lock, the tries noted on it as they are made, and a
// key at its foot to what the marks mean.
defineProps<{
  /** Tries made, and how many there are. (No count, for a lock that never holds.) */
  tried?: number
  of?: number
}>()
</script>

<template>
  <div class="slip">
    <p v-if="of" class="count">{{ tried }} of {{ of }} tries</p>
    <div v-if="$slots.default" class="rows" :class="{ alone: !$slots.key }"><slot /></div>
    <div v-if="$slots.key" class="key"><slot name="key" /></div>
  </div>
</template>

<style scoped>
.slip {
  width: 100%;
  margin-top: 0.8rem;
  padding: 0.6rem 0.8rem 0.55rem;
  background: var(--paper);
  color: var(--paper-ink);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45);
  transform: rotate(-0.6deg);
}
.count {
  margin: 0 0 0.35rem;
  font-family: var(--font-type);
  font-size: 0.75rem;
  color: var(--paper-muted);
  text-align: right;
}
.rows {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding-bottom: 0.5rem;
  margin-bottom: 0.45rem;
  border-bottom: 1px dashed var(--paper-line);
}
.rows.alone {
  padding-bottom: 0;
  margin-bottom: 0;
  border-bottom: 0;
}
.key {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.25rem 0.9rem;
  font-size: 0.8rem;
  line-height: 1.3;
  color: var(--paper-muted);
}
.key :deep(span) {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}
</style>

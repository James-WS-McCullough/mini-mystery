<script setup lang="ts">
defineProps<{
  main: string
  speaker?: string
  prov?: string
  flag?: 'realized' | 'proven' | 'link' | null
  mode: 'view' | 'cite' | 'select'
  selected?: boolean
}>()
const emit = defineEmits<{ (e: 'toggle'): void }>()
</script>

<template>
  <div
    class="row"
    :class="{ interactive: mode !== 'view', selected }"
    @click="mode !== 'view' && emit('toggle')"
  >
    <!-- .prevent: state drives the checkbox, so a cap-blocked toggle can't desync it -->
    <input
      v-if="mode === 'cite'"
      type="checkbox"
      :checked="selected"
      @click.stop.prevent="emit('toggle')"
    />
    <span class="body">
      <span v-if="speaker" class="who brass">{{ speaker }} — </span>
      <span class="main">{{ main }}</span>
      <span v-if="flag === 'proven'" title="Proven false by evidence"> ‼</span>
      <span v-else-if="flag === 'realized'" class="brass" title="Part of a realised contradiction"> ⚡</span>
      <span v-else-if="flag === 'link'" title="Part of a realised corroboration"> 🔗</span>
      <span v-if="prov" class="prov"> — {{ prov }}</span>
    </span>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  gap: 0.4rem;
  align-items: baseline;
  line-height: 1.45;
  font-size: 0.9rem;
  padding: 0.18rem 0.35rem;
  border-radius: 3px;
  border: 1px solid transparent;
}
.row.interactive {
  cursor: pointer;
}
.row.interactive:hover {
  background: var(--panel-2);
}
.row.selected {
  border-color: var(--brass);
  background: #2a2417;
}
.prov {
  color: var(--muted);
  font-size: 0.8rem;
  font-style: italic;
}
</style>

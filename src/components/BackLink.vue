<script setup lang="ts">
// The way back: at the head of the page in a place of its own, and kept in
// view at the top left once the page is scrolled, on a ground of its own so
// that it reads over whatever passes beneath.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import Icon from './Icon.vue'

const emit = defineEmits<{ (e: 'back'): void }>()

const el = ref<HTMLElement | null>(null)
const floating = ref(false)
let scroller: HTMLElement | null = null
function check() {
  floating.value = (scroller?.scrollTop ?? 0) > 8
}
onMounted(() => {
  scroller = el.value?.closest('.scene') ?? null
  scroller?.addEventListener('scroll', check, { passive: true })
  check()
})
onBeforeUnmount(() => scroller?.removeEventListener('scroll', check))
</script>

<template>
  <button ref="el" class="back-link ghost" :class="{ floating }" @click="emit('back')">
    <Icon name="back" /> Back
  </button>
</template>

<style scoped>
.back-link {
  position: sticky;
  top: 0.6rem;
  z-index: 6;
  align-self: flex-start;
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem 0.35rem 0.55rem;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}
.back-link.floating {
  background: rgba(11, 14, 18, 0.94);
  border-color: var(--brass-dim);
  color: var(--ink);
  box-shadow: var(--shadow);
}
</style>

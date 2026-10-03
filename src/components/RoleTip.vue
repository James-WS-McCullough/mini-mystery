<script setup lang="ts">
// A card that opens over a role's tag: the role's name, its class, and what
// it does. Drawn over the whole page, above whatever the tag sits in.
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { RoleId } from '../engine/types'
import RoleCard from './RoleCard.vue'

const props = defineProps<{
  role: RoleId
  anchor: HTMLElement
  /** Said instead of the role's own name and description: a kind of murderer. */
  name?: string
  text?: string
}>()
const tip = ref<HTMLElement | null>(null)
const place = ref({ left: '0px', top: '0px' })
const ready = ref(false)
const GAP = 8
const EDGE = 8

function settle() {
  const el = tip.value
  if (!el) return
  const at = props.anchor.getBoundingClientRect()
  const wide = el.offsetWidth
  const tall = el.offsetHeight
  // Beside an item in a menu, so as to cover none of the others; above a tag
  // in running text, or below it where there is no room above.
  if (props.anchor.closest('.pop-menu')) {
    const right = at.right + GAP + wide <= window.innerWidth - EDGE
    const top = Math.min(
      Math.max(EDGE, at.top + at.height / 2 - tall / 2),
      Math.max(EDGE, window.innerHeight - EDGE - tall),
    )
    place.value = {
      left: `${Math.round(right ? at.right + GAP : Math.max(EDGE, at.left - GAP - wide))}px`,
      top: `${Math.round(top)}px`,
    }
  } else {
    const up = at.top - GAP - tall >= EDGE
    const left = Math.min(
      Math.max(EDGE, at.left + at.width / 2 - wide / 2),
      Math.max(EDGE, window.innerWidth - EDGE - wide),
    )
    place.value = {
      left: `${Math.round(left)}px`,
      top: `${Math.round(up ? at.top - GAP - tall : at.bottom + GAP)}px`,
    }
  }
  ready.value = true
}
onMounted(() => {
  void nextTick(settle)
  window.addEventListener('scroll', settle, true)
  window.addEventListener('resize', settle)
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', settle, true)
  window.removeEventListener('resize', settle)
})
</script>

<template>
  <Teleport to="body">
    <div ref="tip" class="role-tip" :class="{ ready }" :style="place" role="tooltip">
      <RoleCard :role="role" :name="name" :text="text" />
    </div>
  </Teleport>
</template>

<style scoped>
.role-tip {
  position: fixed;
  z-index: 300;
  width: max-content;
  max-width: min(22rem, calc(100vw - 16px));
  padding: 0.55rem 0.75rem 0.6rem;
  background: var(--panel, #171c23);
  border: 1px solid var(--brass-dim);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.65);
  pointer-events: none;
  visibility: hidden;
  font-family: var(--font-body);
  font-style: normal;
  text-align: left;
  white-space: normal;
}
.role-tip.ready {
  visibility: visible;
  animation: open 0.12s ease-out;
}
@keyframes open {
  from {
    opacity: 0;
    transform: translateY(3px);
  }
}
</style>

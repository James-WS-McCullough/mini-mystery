<script setup lang="ts">
// A small menu that opens beside whatever was pressed. It is drawn over the
// whole page, and not inside the card that opened it: nothing can cover it,
// and nothing can cut it off.
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{
  /** What was pressed: the menu opens above it, or below where there is no room. */
  anchor: HTMLElement
  label: string
}>()
const emit = defineEmits<{ (e: 'close'): void }>()

const menu = ref<HTMLElement | null>(null)
const place = ref<{ left: string; top: string; maxHeight: string }>({
  left: '0px',
  top: '0px',
  maxHeight: '60vh',
})
const ready = ref(false)

/** Clear of the bar across the top, and of the one across the bottom. */
const HEAD = 60
const FOOT = 70
const GAP = 6
const EDGE = 8

function settle() {
  const el = menu.value
  if (!el) return
  const at = props.anchor.getBoundingClientRect()
  const wide = el.offsetWidth
  const tall = el.scrollHeight
  const above = at.top - HEAD - GAP
  const below = window.innerHeight - FOOT - at.bottom - GAP
  const up = tall <= above || above >= below
  const room = Math.max(120, up ? above : below)
  const height = Math.min(tall, room)
  const left = Math.min(
    Math.max(EDGE, at.left + at.width / 2 - wide / 2),
    Math.max(EDGE, window.innerWidth - EDGE - wide),
  )
  place.value = {
    left: `${Math.round(left)}px`,
    top: `${Math.round(up ? at.top - GAP - height : at.bottom + GAP)}px`,
    maxHeight: `${Math.round(room)}px`,
  }
  ready.value = true
}

function outside(e: Event) {
  const t = e.target as Node
  if (menu.value?.contains(t) || props.anchor.contains(t)) return
  emit('close')
}
function keys(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  // The menu closes; whatever else Escape does can wait for the next press.
  e.stopPropagation()
  emit('close')
  props.anchor.focus()
}
/** The page has moved under it: it keeps beside whatever opened it. */
function away(e: Event) {
  if (e.target instanceof Node && menu.value?.contains(e.target)) return
  if (!props.anchor.isConnected) emit('close')
  else settle()
}

onMounted(() => {
  void nextTick(() => {
    settle()
    menu.value?.querySelector<HTMLElement>('[aria-checked="true"], button')?.focus({ preventScroll: true })
  })
  document.addEventListener('pointerdown', outside, true)
  document.addEventListener('keydown', keys, true)
  window.addEventListener('resize', away)
  window.addEventListener('scroll', away, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', outside, true)
  document.removeEventListener('keydown', keys, true)
  window.removeEventListener('resize', away)
  window.removeEventListener('scroll', away, true)
})
</script>

<template>
  <Teleport to="body">
    <div
      ref="menu"
      class="pop-menu"
      :class="{ ready }"
      :style="place"
      role="menu"
      :aria-label="label"
    >
      <slot />
    </div>
  </Teleport>
</template>

<style scoped>
.pop-menu {
  position: fixed;
  z-index: 200;
  display: flex;
  flex-direction: column;
  max-width: calc(100vw - 16px);
  padding: 0.25rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: var(--panel, #171c23);
  border: 1px solid var(--brass-dim);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.7);
  visibility: hidden;
}
.pop-menu.ready {
  visibility: visible;
  animation: open 0.12s ease-out;
}
@keyframes open {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
}
</style>

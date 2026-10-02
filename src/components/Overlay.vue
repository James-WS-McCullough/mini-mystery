<script setup lang="ts">
// A framed panel over the stage, for menus and anything else that pauses play.
import { nextTick, ref, watch } from 'vue'
import Icon from './Icon.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    /** Said after the title, and left off on a phone where there is no room: "the map of the village". */
    subtitle?: string
    width?: string
    side?: boolean
  }>(),
  { width: '34rem' },
)
const emit = defineEmits<{ (e: 'close'): void }>()

const panel = ref<HTMLElement | null>(null)
watch(
  () => props.open,
  async (open) => {
    if (!open) return
    await nextTick()
    panel.value?.focus()
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div v-if="open" class="backdrop" :class="{ side }" @click.self="emit('close')">
        <section
          ref="panel"
          class="sheet frame"
          role="dialog"
          aria-modal="true"
          :aria-label="subtitle ? `${title}: ${subtitle}` : title"
          tabindex="-1"
          :style="{ width: `min(${width}, 100%)` }"
        >
          <header>
            <h2 class="heading">
              {{ title }}<span v-if="subtitle" class="subtitle">: {{ subtitle }}</span>
            </h2>
            <button class="ghost close" aria-label="Close" @click="emit('close')">
              <Icon name="close" />
            </button>
          </header>
          <div class="body"><slot /></div>
          <footer v-if="$slots.actions" class="actions"><slot name="actions" /></footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Clear of a notch, rounded corners and the home bar. */
  padding: max(1rem, env(safe-area-inset-top, 0px)) max(1rem, env(safe-area-inset-right, 0px))
    max(1rem, env(safe-area-inset-bottom, 0px)) max(1rem, env(safe-area-inset-left, 0px));
  background: rgba(4, 5, 7, 0.72);
  backdrop-filter: blur(3px);
}
.backdrop.side {
  justify-content: flex-end;
  align-items: stretch;
  padding: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) 0;
}
.sheet {
  display: flex;
  flex-direction: column;
  max-height: 100%;
  padding: 1rem 1.2rem 1.2rem;
  outline: none;
}
.side .sheet {
  border-width: 0 0 0 1px;
}
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.6rem;
  margin-bottom: 0.8rem;
  border-bottom: 1px solid var(--brass-dim);
}
header h2 {
  font-size: 1.4rem;
  text-align: left;
}
@media (max-width: 560px) {
  .subtitle {
    display: none;
  }
}
.close {
  padding: 0.35rem 0.5rem;
}
.body {
  min-height: 0;
  overflow-y: auto;
  padding-right: 0.2rem;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.6rem;
  padding-top: 0.9rem;
  margin-top: 0.8rem;
  border-top: 1px solid var(--line);
}
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.22s ease;
}
.overlay-enter-active .sheet,
.overlay-leave-active .sheet {
  transition: transform 0.22s ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}
.overlay-enter-from .sheet,
.overlay-leave-to .sheet {
  transform: translateY(14px) scale(0.98);
}
.side.overlay-enter-from .sheet,
.side.overlay-leave-to .sheet {
  transform: translateX(40px);
}
</style>

<script setup lang="ts">
import { useGame } from '../stores/game'
import Notebook from './Notebook.vue'

const game = useGame()
</script>

<template>
  <Teleport to="body">
    <div v-if="game.notebookOpen" class="backdrop" @click.self="game.notebookOpen = false">
      <div class="drawer">
        <button class="close" @click="game.notebookOpen = false">✕</button>
        <Notebook />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 50;
}
.drawer {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(420px, 92vw);
  background: var(--panel);
  border-left: 1px solid var(--brass-dim);
  padding: 0.75rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  animation: slide-in 0.22s ease-out;
}
.drawer > :deep(.notebook) {
  border: 0;
  padding: 0;
  overflow: visible;
}
.close {
  align-self: flex-end;
  margin-bottom: 0.3rem;
}
@keyframes slide-in {
  from {
    transform: translateX(30px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>

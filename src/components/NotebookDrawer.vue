<script setup lang="ts">
import { useGame } from '../stores/game'
import Notebook from './Notebook.vue'
import Overlay from './Overlay.vue'

const game = useGame()
</script>

<template>
  <Overlay
    :open="game.notebookOpen"
    title="Your notebook"
    width="30rem"
    side
    @close="game.notebookOpen = false"
  >
    <Notebook />
  </Overlay>
</template>

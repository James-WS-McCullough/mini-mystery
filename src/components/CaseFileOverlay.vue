<script setup lang="ts">
// The case file, to hand during the night (F): just as it reached the
// detective before the household was called, for whoever wants reminding.
import { useGame } from '../stores/game'
import { useUi } from '../stores/ui'
import CaseFile from './CaseFile.vue'
import Overlay from './Overlay.vue'

const game = useGame()
const ui = useUi()
</script>

<template>
  <Overlay
    :open="ui.caseFileOpen"
    :title="`Case №${game.mystery?.seed ?? ''}`"
    subtitle="the case file"
    width="48rem"
    @close="ui.caseFileOpen = false"
  >
    <div class="file">
      <CaseFile />
    </div>
  </Overlay>
</template>

<style scoped>
.file {
  padding: 0.6rem 0.2rem 0.9rem;
}
</style>

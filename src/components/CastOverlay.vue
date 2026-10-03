<script setup lang="ts">
// Tonight's script, to hand during the night (R): every part that may be in
// the house, how many of each class are at the table, and what each part does.
import { useUi } from '../stores/ui'
import CastList from './CastList.vue'
import Overlay from './Overlay.vue'

const ui = useUi()
</script>

<template>
  <Overlay :open="ui.castOpen" title="Tonight’s cast" width="46rem" @close="ui.castOpen = false">
    <section class="sheet paper">
      <CastList all-open detailed />
    </section>
  </Overlay>
</template>

<style scoped>
.sheet {
  padding: 0.6rem 1.1rem 1.1rem;
  line-height: 1.55rem;
}
</style>

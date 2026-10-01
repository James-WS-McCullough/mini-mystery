<script setup lang="ts">
import { useGame } from '../stores/game'
import { useUi } from '../stores/ui'
import ManorMap from './ManorMap.vue'
import Overlay from './Overlay.vue'

const game = useGame()
const ui = useUi()
</script>

<template>
  <Overlay
    :open="ui.mapOpen && !!game.mystery"
    :title="game.ctx?.pack.title ?? 'The house'"
    :subtitle="game.pack.place.plan"
    width="72rem"
    @close="ui.mapOpen = false"
  >
    <ManorMap mode="view" />
  </Overlay>
</template>

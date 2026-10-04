<script setup lang="ts">
// A lifeline, framed like an exhibit but in green: help, not evidence.
import { lifelineOf } from '../content/lifelines'
import type { LifelineKind } from '../engine/types'
import { useGame } from '../stores/game'
import Icon, { type IconName } from './Icon.vue'

withDefaults(defineProps<{ kind: LifelineKind; size?: string; dim?: boolean }>(), { size: '3rem' })
const game = useGame()
</script>

<template>
  <span
    class="lifeline-art"
    :class="{ dim }"
    :style="{ width: size, height: size }"
    role="img"
    :aria-label="lifelineOf(game.pack, kind).name"
  >
    <Icon :name="lifelineOf(game.pack, kind).icon as IconName" />
  </span>
</template>

<style scoped>
.lifeline-art {
  display: inline-grid;
  place-items: center;
  flex: none;
  border: 2px solid var(--brass);
  border-radius: 3px;
  background: radial-gradient(circle at 50% 38%, #4f8a63, #1d3a28 75%);
  color: #f3e7c3;
  box-shadow:
    inset 0 0 0 1px rgba(0, 0, 0, 0.6),
    0 3px 8px rgba(0, 0, 0, 0.55);
  vertical-align: middle;
}
.lifeline-art :deep(.icon) {
  width: 52%;
  height: 52%;
}
.lifeline-art.dim {
  opacity: 0.45;
  filter: grayscale(0.7);
}
</style>

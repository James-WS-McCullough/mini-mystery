<script setup lang="ts">
// A role's name as a tag: its icon, and the name as it is said.
import { computed } from 'vue'
import type { RoleId } from '../engine/types'
import { useGame } from '../stores/game'
import Icon, { type IconName } from './Icon.vue'

const props = defineProps<{ role: RoleId; onPaper?: boolean }>()
const game = useGame()
const icon = computed(() => (game.ctx?.pack.roleIcons[props.role] ?? 'mask') as IconName)
const what = computed(() => game.ctx?.pack.deckDescriptions[props.role] ?? '')
</script>

<template>
  <span class="role-tag" :class="{ paper: onPaper }" :title="what">
    <Icon :name="icon" /><slot>{{ game.ctx?.pack.roleNames[role] ?? role }}</slot>
  </span>
</template>

<style scoped>
.role-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.3em;
  padding: 0 0.45em;
  border: 1px solid var(--brass-dim);
  border-radius: 999px;
  background: rgba(77, 65, 22, 0.4);
  color: var(--brass);
  font-style: normal;
  line-height: 1.35;
  white-space: nowrap;
  vertical-align: baseline;
}
.role-tag .icon {
  font-size: 0.85em;
}
.role-tag.paper {
  border-color: rgba(90, 70, 20, 0.55);
  background: rgba(150, 120, 40, 0.18);
  color: #4f3d0e;
}
</style>

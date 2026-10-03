<script setup lang="ts">
// A role's name as a tag: its icon, and the name as it is said. Hovered with
// a mouse, a card beside it says what the role does; tapped on a touch
// screen, where nothing can be hovered, the card opens along the foot of the
// screen (RoleSheet) until it is closed.
import { computed, ref } from 'vue'
import type { RoleId } from '../engine/types'
import { useGame } from '../stores/game'
import { useUi } from '../stores/ui'
import Icon, { type IconName } from './Icon.vue'
import RoleTip from './RoleTip.vue'

const props = defineProps<{ role: RoleId; onPaper?: boolean; tipName?: string; tipText?: string }>()
const game = useGame()
const icon = computed(() => (game.ctx?.pack.roleIcons[props.role] ?? 'mask') as IconName)

const ui = useUi()
const el = ref<HTMLElement | null>(null)
const over = ref(false)
function enter(e: PointerEvent) {
  // (Only a mouse hovers: a finger's touch is a tap, below.)
  if (e.pointerType === 'mouse') over.value = true
}
/** Whether this screen has no hovering at all. */
const hoverless = () => typeof matchMedia === 'function' && matchMedia('(hover: none)').matches
function tap(e: MouseEvent) {
  e.stopPropagation()
  const touch = (e as PointerEvent).pointerType ? (e as PointerEvent).pointerType !== 'mouse' : hoverless()
  if (touch) ui.roleSheet = { role: props.role, name: props.tipName, text: props.tipText }
}
</script>

<template>
  <span
    ref="el"
    class="role-tag"
    :class="{ paper: onPaper }"
    @pointerenter="enter"
    @pointerleave="over = false"
    @click="tap"
  >
    <Icon :name="icon" /><slot>{{ game.ctx?.pack.roleNames[role] ?? role }}</slot>
    <RoleTip v-if="over && el" :role="role" :anchor="el" :name="tipName" :text="tipText" />
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

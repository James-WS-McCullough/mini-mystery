<script setup lang="ts">
// What a role is, as a card says it: its icon and name, its class, and what
// it does in this setting's words. In the tip a tag opens on hover, and in the
// sheet a tap opens on a touch screen.
import { computed } from 'vue'
import { ROLE_CLASSES, roleClassOf } from '../engine/deck'
import { placeText } from '../engine/render'
import type { RoleId } from '../engine/types'
import { useGame } from '../stores/game'
import Icon, { type IconName } from './Icon.vue'

const props = defineProps<{
  role: RoleId
  /** Said instead of the role's own name and description: a kind of murderer. */
  name?: string
  text?: string
}>()
const game = useGame()
const pack = computed(() => game.ctx?.pack)
const title = computed(() => props.name ?? pack.value?.roleNames[props.role] ?? props.role)
/** What the role does, in this setting's words ("one of the household", "one of the company"). */
const what = computed(() => {
  const text = props.text ?? pack.value?.deckDescriptions[props.role] ?? ''
  return pack.value ? placeText(pack.value, text) : text
})
const icon = computed(() => (pack.value?.roleIcons[props.role] ?? 'mask') as IconName)
const cls = computed(() => ROLE_CLASSES.find((c) => c.id === roleClassOf(props.role))!)
</script>

<template>
  <div class="role-card">
    <p class="who">
      <Icon :name="icon" /> <strong>{{ title }}</strong>
      <span class="cls" :class="cls.id">{{ cls.name }}</span>
    </p>
    <p class="what">{{ what }}</p>
  </div>
</template>

<style scoped>
.role-card p {
  margin: 0;
}
.who {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--brass);
  font-size: 0.95rem;
}
.who .icon {
  font-size: 0.9em;
}
.cls {
  margin-left: auto;
  padding-left: 0.8rem;
  font-family: var(--font-type);
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}
.cls.murderer {
  color: #d05a4a;
}
.cls.accomplice {
  color: #c98a3e;
}
.cls.suspicious {
  color: #b9a35a;
}
.cls.innocent {
  color: #7fb08a;
}
.what {
  margin-top: 0.3rem !important;
  color: var(--ink, #e6e1d6);
  font-size: 0.88rem;
  line-height: 1.45;
}
</style>

<script setup lang="ts">
// Running text with the names of roles shown as tags, and the three counts
// shown by their signs: `[key]` means, `[heart]` motive, `[steps]`
// opportunity. Given `upto`, only that many characters are visible; the rest
// keep their place, unseen, so a line being typed does not shift about as it
// arrives.
import { computed } from 'vue'
import type { RoleId } from '../engine/types'
import { useGame } from '../stores/game'
import { splitRoles } from '../ui/roleTags'
import Icon, { type IconName } from './Icon.vue'
import RoleTag from './RoleTag.vue'

const props = defineProps<{ text: string; upto?: number; onPaper?: boolean }>()
const game = useGame()

const SIGN = /(\[(?:key|heart|steps)\])/

interface Part {
  text: string
  at: number
  role?: RoleId
  icon?: IconName
}

const parts = computed(() => {
  const pack = game.ctx?.pack
  const segments: Part[] = pack ? splitRoles(props.text, pack) : [{ text: props.text, at: 0 }]
  // The signs, picked out of the plain stretches.
  const withSigns = segments.flatMap((s): Part[] => {
    if (s.role) return [s]
    let at = s.at
    return s.text
      .split(SIGN)
      .filter((t) => t.length > 0)
      .map((t) => {
        const m = /^\[(key|heart|steps)\]$/.exec(t)
        const part: Part = { text: t, at, ...(m ? { icon: m[1] as IconName } : {}) }
        at += t.length
        return part
      })
  })
  const upto = props.upto ?? props.text.length
  return withSigns.map((s) => {
    const seen = Math.max(0, Math.min(s.text.length, upto - s.at))
    return { ...s, shown: s.text.slice(0, seen), rest: s.text.slice(seen) }
  })
})
</script>

<template>
  <template v-for="p in parts" :key="p.at">
    <RoleTag v-if="p.role" :role="p.role" :on-paper="onPaper" :class="{ unseen: !p.shown }"
      >{{ p.shown }}<span v-if="p.rest" class="unseen">{{ p.rest }}</span></RoleTag
    >
    <!-- A sign shows whole, once its place in the line is reached. -->
    <Icon v-else-if="p.icon" :name="p.icon" class="sign" :class="{ unseen: p.rest }" />
    <template v-else
      >{{ p.shown }}<span v-if="p.rest" class="unseen">{{ p.rest }}</span></template
    >
  </template>
</template>

<style scoped>
.unseen {
  visibility: hidden;
}
.sign {
  color: var(--brass);
  vertical-align: -0.12em;
  margin-right: 0.12em;
}
</style>

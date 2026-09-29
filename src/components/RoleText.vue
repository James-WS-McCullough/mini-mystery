<script setup lang="ts">
// Running text with the names of roles shown as tags. Given `upto`, only that
// many characters are visible; the rest keep their place, unseen, so a line
// being typed does not shift about as it arrives.
import { computed } from 'vue'
import { useGame } from '../stores/game'
import { splitRoles } from '../ui/roleTags'
import RoleTag from './RoleTag.vue'

const props = defineProps<{ text: string; upto?: number; onPaper?: boolean }>()
const game = useGame()

const parts = computed(() => {
  const pack = game.ctx?.pack
  const segments = pack ? splitRoles(props.text, pack) : [{ text: props.text, at: 0 }]
  const upto = props.upto ?? props.text.length
  return segments.map((s) => {
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
    <template v-else
      >{{ p.shown }}<span v-if="p.rest" class="unseen">{{ p.rest }}</span></template
    >
  </template>
</template>

<style scoped>
.unseen {
  visibility: hidden;
}
</style>

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
  // Punctuation straight after a tag stays glued to it, so a comma never opens the next line.
  const GLUE = /^[,.;:!?’”)]+/
  const glued = withSigns.map((s, i): Part & { glue: string } => {
    const next = withSigns[i + 1]
    const m = s.role && next && !next.role && !next.icon ? GLUE.exec(next.text) : null
    return { ...s, glue: m ? m[0] : '' }
  })
  const upto = props.upto ?? props.text.length
  return glued.map((s, i) => {
    const prior = i > 0 ? glued[i - 1].glue.length : 0
    const text = s.text.slice(prior)
    const at = s.at + prior
    const seen = Math.max(0, Math.min(text.length, upto - at))
    const glueSeen = Math.max(0, Math.min(s.glue.length, upto - (s.at + s.text.length)))
    return { ...s, at, shown: text.slice(0, seen), rest: text.slice(seen), glueShown: s.glue.slice(0, glueSeen), glueRest: s.glue.slice(glueSeen) }
  })
})
</script>

<template>
  <template v-for="p in parts" :key="p.at">
    <span v-if="p.role" class="glued"
      ><RoleTag :role="p.role" :on-paper="onPaper" :class="{ unseen: !p.shown }"
        >{{ p.shown }}<span v-if="p.rest" class="unseen">{{ p.rest }}</span></RoleTag
      >{{ p.glueShown }}<span v-if="p.glueRest" class="unseen">{{ p.glueRest }}</span></span
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
.glued {
  white-space: nowrap;
}
.sign {
  color: var(--brass);
  vertical-align: -0.12em;
  margin-right: 0.12em;
}
</style>

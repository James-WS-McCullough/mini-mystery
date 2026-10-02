<script setup lang="ts">
// The speaking box: a nameplate, a line typed out, and a mark when it is done.
import { toRef } from 'vue'
import { useGame } from '../stores/game'
import { useTypewriter } from '../ui/typewriter'
import RoleText from './RoleText.vue'

const props = withDefaults(
  defineProps<{
    speaker?: string
    /** CastMember.defId of the speaker: the line is typed in their voice. */
    who?: string
    text: string
    /** Set false for a line already heard: it appears whole. */
    fresh?: boolean
    /** Narration rather than speech: no quotation marks, italic. */
    narration?: boolean
    /** What the detective said or did to prompt the line. */
    prompt?: string
    /** Show the "more" mark once the line is out. */
    more?: boolean
    /** The line must be waited out: a click does not hurry it. */
    noskip?: boolean
    /** Cried out: three times the size, and quicker. */
    loud?: boolean
  }>(),
  { fresh: true },
)
const emit = defineEmits<{ (e: 'done'): void; (e: 'advance'): void; (e: 'typing'): void }>()

const game = useGame()
const { shown, done, finish } = useTypewriter(toRef(props, 'text'), {
  voice: () =>
    props.who ? game.ctx?.pack.characters.find((c) => c.id === props.who)?.voice : undefined,
  animate: () => {
    if (props.fresh) emit('typing')
    return props.fresh
  },
  onDone: () => emit('done'),
  pace: () => (props.loud ? 2.5 : 1),
})

/** A click hurries the line; once it is out, a click moves on. */
function tap() {
  if (!done.value) {
    if (!props.noskip) finish()
  } else emit('advance')
}

defineExpose({ tap, done })
</script>

<template>
  <div class="dialogue frame" :class="{ narration, loud, waiting: done && more }" @click="tap()">
    <span v-if="speaker" class="nameplate">{{ speaker }}</span>
    <p v-if="prompt" class="prompt"><RoleText :text="prompt" /></p>
    <p class="line" aria-hidden="true">
      <template v-if="!narration">“</template><RoleText :text="text" :upto="shown.length" /><template
        v-if="!narration && done"
        >”</template
      >
    </p>
    <p class="sr-only" aria-live="polite">{{ speaker ? `${speaker}: ` : '' }}{{ text }}</p>
    <span v-if="done && more" class="more" aria-hidden="true">▼</span>
  </div>
</template>

<style scoped>
.dialogue {
  position: relative;
  min-height: 8.5rem;
  padding: 1.5rem 1.5rem 1.4rem;
  cursor: pointer;
  user-select: none;
}
.nameplate {
  position: absolute;
  top: -0.95rem;
  left: 1.1rem;
  padding: 0.22rem 0.9rem 0.18rem;
  font-family: var(--font-display);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-size: 0.95rem;
  color: #fff6dc;
  background: linear-gradient(180deg, #8f782a, #5e4e18);
  border: 1px solid var(--brass);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.5);
}
.prompt {
  margin: 0 0 0.5rem;
  color: var(--muted);
  font-style: italic;
  font-size: 0.92rem;
}
.line {
  margin: 0;
  font-size: 1.16rem;
  line-height: 1.6;
}
/* A cry: the line at three times its size. */
.loud .line {
  font-size: 3.2rem;
  line-height: 1.15;
  font-family: var(--font-logo);
  color: #e8463a;
}
.narration .line {
  font-style: italic;
}
.more {
  position: absolute;
  right: 1rem;
  bottom: 0.5rem;
  color: var(--brass);
  font-size: 0.8rem;
  animation: bob 0.9s ease-in-out infinite;
}
@keyframes bob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(4px);
  }
}
@media (max-width: 600px) {
  .dialogue {
    padding: 1.3rem 1rem 1.2rem;
  }
  .line {
    font-size: 1.05rem;
  }
  .loud .line {
    font-size: 2.5rem;
  }
}
</style>

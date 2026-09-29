<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useGame } from '../stores/game'
import { useUi } from '../stores/ui'
import { inRoom } from '../engine/render'
import { chime, sfx } from '../ui/audio'
import { useKeys } from '../ui/keys'
import ClockFace from './ClockFace.vue'
import Portrait from './Portrait.vue'

const game = useGame()
const ui = useUi()
let timer: ReturnType<typeof setTimeout> | undefined

const hour = computed(() => (game.transitionToMidnight ? 12 : 8 + game.round))

/** What the hour brought with it: somebody found dead as it struck. */
const found = computed(() => {
  const k = game.killing
  if (!k?.fresh || !game.mystery || !game.ctx) return null
  return {
    who: game.mystery.cast[k.victim],
    where: inRoom(game.ctx, k.room),
  }
})

onMounted(() => {
  chime()
  if (found.value) setTimeout(() => sfx('reveal'), 900)
  // Long enough to read the hour; a click or a key moves on sooner. A death is
  // not hurried past: it waits to be read.
  if (!found.value) timer = setTimeout(() => game.finishTransition(), 4200)
})
onBeforeUnmount(() => clearTimeout(timer))

useKeys((key) => {
  if (ui.anyOpen) return false
  if (key !== ' ' && key !== 'Enter') return false
  game.finishTransition()
  return true
})
</script>

<template>
  <div class="transition" @click="game.finishTransition()">
    <div class="chime" :class="{ midnight: game.transitionToMidnight }">
      <p class="deco"><span /></p>
      <div class="pendulum">
        <ClockFace :hour="hour" size="6.5rem" :midnight="game.transitionToMidnight" />
      </div>
      <h1>{{ game.transitionHeading }}</h1>
      <p class="deco"><span /></p>
      <div v-if="found" class="found" role="status">
        <Portrait :who="found.who.defId" size="5.5rem" mood="slump" dim />
        <p class="news">
          <strong>{{ found.who.name }}</strong> has been found dead {{ found.where }}.
        </p>
        <p class="small muted">
          Whatever they knew and had not told you is lost. The room may be searched again.
        </p>
        <p class="small go">click to go on</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.transition {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at center, rgba(20, 25, 32, 0.4) 0%, rgba(4, 5, 7, 0.88) 75%);
  cursor: pointer;
}
.chime {
  text-align: center;
  max-width: 36rem;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.7rem;
}
h1 {
  font-size: clamp(2.4rem, 8vw, 4rem);
  letter-spacing: 0.4rem;
  color: var(--brass);
  margin: 0;
  text-transform: uppercase;
  animation: strike 1.4s ease-out both;
  text-shadow: 0 0 30px rgba(212, 175, 74, 0.4);
}
.midnight h1 {
  color: var(--danger);
  text-shadow: 0 0 30px rgba(192, 71, 60, 0.5);
}
.pendulum {
  animation: swing 2.4s ease-in-out infinite;
  transform-origin: 50% -40%;
  filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.7));
}
.deco {
  animation: appear 1s ease-out 0.3s both;
}
@keyframes strike {
  from {
    opacity: 0;
    letter-spacing: 1.1rem;
    filter: blur(3px);
  }
  to {
    opacity: 1;
    letter-spacing: 0.4rem;
    filter: blur(0);
  }
}
@keyframes swing {
  0%,
  100% {
    transform: rotate(-4deg);
  }
  50% {
    transform: rotate(4deg);
  }
}
.found {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.6rem;
  animation: appear 1s ease-out 1.1s both;
}
.found p {
  margin: 0;
}
.news {
  font-size: 1.25rem;
  color: #f0b0a8;
}
.go {
  margin-top: 0.6rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--brass);
}
</style>

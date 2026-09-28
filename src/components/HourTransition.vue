<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useGame } from '../stores/game'
import { useUi } from '../stores/ui'
import { strikeClock } from '../ui/audio'
import { useKeys } from '../ui/keys'
import ClockFace from './ClockFace.vue'

const game = useGame()
const ui = useUi()
let timer: ReturnType<typeof setTimeout> | undefined

const hour = computed(() => (game.transitionToMidnight ? 12 : 8 + game.round))

onMounted(() => {
  strikeClock(hour.value)
  // Long enough to hear the hour out; a click moves on sooner.
  timer = setTimeout(() => game.finishTransition(), 3200 + hour.value * 850)
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
      <p class="narration">{{ game.transitionText }}</p>
      <p class="deco"><span /></p>
      <button class="proceed" data-next>proceed</button>
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
.narration {
  font-style: italic;
  line-height: 1.6;
  font-size: 1.08rem;
  color: var(--ink);
  opacity: 0.8;
  margin: 0;
  animation: appear 1s ease-out 0.7s both;
}
.deco {
  animation: appear 1s ease-out 0.3s both;
}
.proceed {
  margin-top: 0.6rem;
  animation: appear 0.8s ease-out 1.6s both;
  background: transparent;
  border-color: var(--brass-dim);
  color: var(--brass);
  letter-spacing: 0.24em;
  font-family: var(--font-display);
  text-transform: uppercase;
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
</style>

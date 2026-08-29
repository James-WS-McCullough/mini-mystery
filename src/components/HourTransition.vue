<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useGame } from '../stores/game'

const game = useGame()
let timer: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  timer = setTimeout(() => game.finishTransition(), 4200)
})
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="transition" @click="game.finishTransition()">
    <div class="chime" :class="{ midnight: game.transitionToMidnight }">
      <p class="ornament brass">· · ─────── ✦ ─────── · ·</p>
      <div class="pendulum">🕰</div>
      <h1>{{ game.transitionHeading }}</h1>
      <p class="narration">{{ game.transitionText }}</p>
      <p class="ornament brass">· · ─────── ✦ ─────── · ·</p>
      <button class="proceed">proceed</button>
    </div>
  </div>
</template>

<style scoped>
.transition {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at center, #1b1f23 0%, #0c0e10 75%);
  cursor: pointer;
  z-index: 40;
}
.chime {
  text-align: center;
  max-width: 34rem;
  padding: 0 1.5rem;
}
h1 {
  font-size: 3rem;
  letter-spacing: 0.4rem;
  color: var(--brass);
  margin: 0.6rem 0;
  text-transform: uppercase;
  animation: strike 1.4s ease-out both;
}
.midnight h1 {
  color: var(--danger);
}
.pendulum {
  font-size: 2.6rem;
  animation: swing 2.4s ease-in-out infinite;
  transform-origin: top center;
}
.narration {
  font-style: italic;
  line-height: 1.6;
  color: var(--muted);
  animation: appear 1s ease-out 0.7s both;
}
.ornament {
  letter-spacing: 0.2em;
  animation: appear 1s ease-out 0.3s both;
}
.proceed {
  margin-top: 1.2rem;
  animation: appear 0.8s ease-out 1.6s both;
  background: transparent;
  border-color: var(--brass-dim);
  color: var(--brass);
  letter-spacing: 0.2em;
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
@keyframes appear {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes swing {
  0%,
  100% {
    transform: rotate(-6deg);
  }
  50% {
    transform: rotate(6deg);
  }
}
</style>

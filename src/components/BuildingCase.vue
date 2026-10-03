<script setup lang="ts">
// "Building your case": over everything while a case is dealt, which holds
// the page up for anything from a moment to a second or two. Only what the
// compositor draws moves here (a turning glass), so it moves while the
// dealing runs.
import { useUi } from '../stores/ui'
import { settings } from '../ui/settings'
import Icon from './Icon.vue'

const ui = useUi()
</script>

<template>
  <Teleport to="body">
    <Transition name="building">
      <div v-if="ui.building" class="building" role="status" aria-live="polite">
        <p class="deco"><span /></p>
        <div class="glass" :class="{ still: settings.reducedMotion }"><Icon name="search" /></div>
        <h2>Building your case</h2>
        <p class="small muted">The household is taking its places.</p>
        <p class="deco"><span /></p>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.building {
  position: fixed;
  inset: 0;
  z-index: 400;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  padding: 1rem;
  text-align: center;
  background: radial-gradient(ellipse at center, rgba(23, 28, 35, 0.99), rgb(8, 10, 13));
}
h2 {
  margin: 0;
  font-family: var(--font-display);
  font-weight: normal;
  font-size: clamp(1.3rem, 5vw, 1.8rem);
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--brass);
}
p {
  margin: 0;
}
.glass {
  font-size: 2.6rem;
  color: var(--brass);
  /* A slow circle, as over a page: a transform, so it keeps moving while the dealing holds the page. */
  animation: search 1.6s linear infinite;
  will-change: transform;
}
@keyframes search {
  from {
    transform: rotate(0deg) translateX(0.45rem) rotate(0deg);
  }
  to {
    transform: rotate(360deg) translateX(0.45rem) rotate(-360deg);
  }
}
.glass.still {
  animation: none;
}
.building-enter-active {
  transition: opacity 0.15s ease;
}
.building-leave-active {
  transition: opacity 0.45s ease;
}
.building-enter-from,
.building-leave-to {
  opacity: 0;
}
</style>

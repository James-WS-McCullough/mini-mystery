<script setup lang="ts">
// The blow: black over everything, and the word for it, hard and sudden. The
// hour of the second killing and a cutscene's murder both fall this way.
defineProps<{ struck: boolean }>()
</script>

<template>
  <div class="blow" aria-live="assertive">
    <Transition name="whack">
      <p v-if="struck" class="whack">WHACK!</p>
    </Transition>
  </div>
</template>

<style scoped>
.blow {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  background: #000;
}
.whack {
  margin: 0;
  font-family: var(--font-logo);
  font-size: clamp(4rem, 18vw, 10rem);
  letter-spacing: 0.08em;
  color: #e8463a;
  transform: rotate(-6deg);
  text-shadow: 0 0 40px rgba(232, 70, 58, 0.6);
}
.whack-enter-active {
  animation: whack 0.18s cubic-bezier(0.2, 1.6, 0.4, 1) both;
}
.whack-leave-active {
  transition: opacity 0.5s ease;
}
.whack-leave-to {
  opacity: 0;
}
@keyframes whack {
  from {
    transform: rotate(-6deg) scale(2.4);
    opacity: 0;
  }
}
</style>

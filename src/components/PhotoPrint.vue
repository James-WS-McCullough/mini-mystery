<script setup lang="ts">
// A photograph clipped to a file: a white border, a little shadow, set on the
// sheet a degree or two askew, with a paper clip holding it on.
withDefaults(defineProps<{ tilt?: number }>(), { tilt: 2.5 })
</script>

<template>
  <figure class="print" aria-hidden="true" :style="{ transform: `rotate(${tilt}deg)` }">
    <div class="image"><slot /></div>
  </figure>
</template>

<style scoped>
.print {
  position: relative;
  margin: 0;
  padding: 0.35rem;
  background: #f4efe2;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.35);
}
.image {
  filter: sepia(0.35) contrast(1.05);
}
.image :deep(svg) {
  display: block;
  width: 100%;
}
/* The clip that holds it to the sheet. */
.print::before {
  content: '';
  position: absolute;
  z-index: 1;
  top: -0.6rem;
  left: 1.2rem;
  width: 0.55rem;
  height: 1.6rem;
  border: 2px solid #8b8f94;
  border-radius: 0.4rem;
}
</style>

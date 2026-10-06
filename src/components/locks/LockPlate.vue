<script setup lang="ts">
// The body of a lock: a metal plate screwed to the furniture, a bolt across
// its head shot into its keeper. Opened, the bolt draws back. Each puzzle sits
// in the plate; what the plate is made of tells the desk from the safe.
defineProps<{
  /** Brass for the desk, iron for the safe, walnut and brass for the cabinet. */
  metal: 'brass' | 'iron' | 'walnut'
  open: boolean
}>()
</script>

<template>
  <div class="lock" :class="[metal, { open }]">
    <div class="head" aria-hidden="true">
      <span class="keeper" />
      <span class="bolt"><i /></span>
    </div>
    <div class="plate">
      <i v-for="n in 4" :key="n" class="screw" :class="`s${n}`" aria-hidden="true" />
      <slot />
    </div>
  </div>
</template>

<style scoped>
.lock {
  --face: linear-gradient(160deg, #6b5520, #3d3010 55%, #2a210b);
  --rim: #a8893a;
  --bolt: linear-gradient(180deg, #e6cd7c, #a8893a 45%, #6b5520);
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
.lock.iron {
  --face: linear-gradient(160deg, #3b4148, #23282e 55%, #171b20);
  --rim: #59616b;
  --bolt: linear-gradient(180deg, #c4cad1, #7d858e 45%, #4b5259);
}
.lock.walnut {
  --face: linear-gradient(160deg, #4a2f1b, #2e1d10 55%, #1f140b);
  --rim: #a8893a;
}

/* The head of the lock: the bolt shot across into its keeper, drawn back when it opens. */
.head {
  position: relative;
  height: 1.3rem;
  margin: 0 1.2rem -0.15rem;
}
.keeper {
  position: absolute;
  right: 0;
  top: 0;
  width: 2.2rem;
  height: 1.3rem;
  border: 2px solid var(--rim);
  border-bottom: 0;
  border-radius: 4px 4px 0 0;
  background: rgba(0, 0, 0, 0.55);
}
.bolt {
  position: absolute;
  top: 0.3rem;
  left: 30%;
  right: 0.5rem;
  height: 0.7rem;
  border-radius: 3px;
  background: var(--bolt);
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.6);
  transition: right 0.55s cubic-bezier(0.5, 0, 0.2, 1) 0.1s;
}
.bolt i {
  position: absolute;
  left: 18%;
  top: -0.25rem;
  width: 0.55rem;
  height: 1.2rem;
  border-radius: 3px;
  background: var(--bolt);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
}
.open .bolt {
  right: 3.4rem;
}

.plate {
  position: relative;
  padding: 1.1rem 1rem 1rem;
  border: 2px solid var(--rim);
  border-radius: 8px;
  background: var(--face);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    inset 0 -2px 6px rgba(0, 0, 0, 0.5),
    var(--shadow);
  transition: box-shadow 0.5s;
}
.open .plate {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    inset 0 -2px 6px rgba(0, 0, 0, 0.5),
    0 0 22px 2px rgba(212, 175, 74, 0.35);
}
.screw {
  position: absolute;
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #e6cd7c, #6b5520 70%);
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.6);
}
.iron .screw {
  background: radial-gradient(circle at 35% 35%, #c4cad1, #4b5259 70%);
}
.screw::after {
  content: '';
  position: absolute;
  left: 15%;
  right: 15%;
  top: 45%;
  height: 1px;
  background: rgba(0, 0, 0, 0.55);
  transform: rotate(-35deg);
}
.s1 { top: 0.4rem; left: 0.4rem; }
.s2 { top: 0.4rem; right: 0.4rem; }
.s3 { bottom: 0.4rem; left: 0.4rem; }
.s4 { bottom: 0.4rem; right: 0.4rem; }

@media (prefers-reduced-motion: reduce) {
  .bolt {
    transition: none;
  }
}
</style>

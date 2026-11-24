<script setup lang="ts">
// The facts of the case, as the case file has them: the dead, the scene, the
// household, the rules of the night, and the doctor's note where there is one.
import { computed } from 'vue'
import { roomName } from '../../engine/timeline/render'
import { useTimeline } from '../../stores/timeline'
import Portrait from '../Portrait.vue'

const tl = useTimeline()
const tc = computed(() => tl.tc!)
const notes = computed(() => tl.found.filter((e) => e.plain))
</script>

<template>
  <section class="sheet paper">
    <h3>The facts of the case</h3>
    <dl>
      <dt>The dead</dt>
      <dd>{{ tc.victimName }}</dd>
      <dt>Found</dt>
      <dd>In {{ roomName(tc, tc.scene) }}, last night</dd>
      <dt>Last night</dt>
      <dd>Everybody dined together at seven; after that, nobody knows but themselves.</dd>
      <dt>Tonight</dt>
      <dd>One of the six did it. One other is hiding something of their own.</dd>
    </dl>
    <p v-for="n in notes" :key="n.id" class="note">{{ n.name }}</p>
    <div class="household">
      <figure v-for="g in tc.cast" :key="g.id">
        <Portrait :who="g.defId" :pack="tl.pack" :trait="null" size="3.4rem" />
        <figcaption>
          <strong>{{ g.shortName }}</strong>
          <span>{{ g.title }}</span>
        </figcaption>
      </figure>
    </div>
  </section>
</template>

<style scoped>
.sheet {
  padding: 1rem 1.2rem;
  text-align: left;
}
h3 {
  margin: 0 0 0.6rem;
  font-family: var(--font-type);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.95rem;
}
dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.25rem 1rem;
  margin: 0;
  font-family: var(--font-type);
  font-size: 0.9rem;
}
dt {
  color: var(--paper-muted);
}
dd {
  margin: 0;
}
.note {
  font-family: var(--font-hand);
  font-size: 1.3rem;
  margin: 0.6rem 0 0;
}
.household {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
  gap: 0.6rem;
  margin-top: 0.9rem;
}
figure {
  margin: 0;
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
figcaption {
  display: flex;
  flex-direction: column;
  font-size: 0.78rem;
  line-height: 1.25;
}
figcaption span {
  color: var(--paper-muted);
}
</style>

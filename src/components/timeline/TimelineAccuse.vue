<script setup lang="ts">
// Naming the murderer: before midnight if the detective is sure, at midnight
// whether or not.
import { computed, ref } from 'vue'
import { useTimeline } from '../../stores/timeline'
import ActionBar from '../ActionBar.vue'
import Icon from '../Icon.vue'
import Portrait from '../Portrait.vue'

const tl = useTimeline()
const tc = computed(() => tl.tc!)
const chosen = ref<number | null>(null)
</script>

<template>
  <div class="accuse">
    <p class="deco"><span /></p>
    <h2 class="heading">{{ tl.midnight ? 'Midnight. Who killed' : 'Who killed' }} {{ tc.victimShort }}?</h2>
    <p class="muted">
      Name the one who was alone with {{ tc.victimPronouns === 'she' ? 'her' : 'him' }} at the moment it was done. You may open the
      timeline once more before you choose.
    </p>
    <div class="grid">
      <button v-for="m in tc.cast" :key="m.id" class="pick" :class="{ on: chosen === m.id }" @click="chosen = m.id">
        <Portrait :who="m.defId" :pack="tl.pack" :trait="null" size="clamp(4rem, 18vw, 5.4rem)" />
        <strong>{{ m.shortName }}</strong>
      </button>
    </div>
    <ActionBar centre>
      <button @click="tl.boardOpen = true"><Icon name="clock" /> The timeline</button>
      <button v-if="!tl.midnight" class="ghost" @click="tl.notYet()">Not yet</button>
      <button class="danger" :disabled="chosen === null" @click="chosen !== null && tl.accuse(chosen)">
        <Icon name="scales" /> {{ chosen === null ? 'Choose the murderer' : `Name ${tc.cast[chosen].shortName}` }}
      </button>
    </ActionBar>
  </div>
</template>

<style scoped>
.accuse {
  max-width: 52rem;
  margin: 0 auto;
  padding: 2rem 16px 3rem;
  text-align: center;
}
.heading {
  margin: 0.4rem 0;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr));
  gap: 0.7rem;
  margin-top: 1.2rem;
}
.pick {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 0.7rem 0.4rem;
}
.pick.on {
  border-color: var(--danger);
  box-shadow: 0 0 0 1px var(--danger);
}
</style>

<script setup lang="ts">
// One room an hour, chosen on the plan of the house, as in the classic night;
// then what was found there, on cards.
import { computed } from 'vue'
import { roomName } from '../../engine/timeline/render'
import { useTimeline } from '../../stores/timeline'
import type { MapSource } from '../../ui/mapSource'
import ActionBar from '../ActionBar.vue'
import Icon from '../Icon.vue'
import ManorMap from '../ManorMap.vue'
import { useTimelineWords } from './words'

const tl = useTimeline()
const { name } = useTimelineWords()
const tc = computed(() => tl.tc!)
const HOURS = ['Eight', 'Nine', 'Ten', 'Eleven']
const clock = computed(() => `${HOURS[tl.hour]} o’clock`)

const source = computed<MapSource>(() => ({
  seed: tc.value.seed,
  pack: tl.pack,
  scene: tc.value.scene,
  placements: [],
  nameOf: name,
  defIdOf: (c) => tc.value.cast[c]?.defId,
  searched: (room) => tl.searched.includes(room),
  found: (room) => tl.found.filter((e) => e.room === room && !e.plain).map((e) => ({ id: e.id, name: e.name, proves: 'a clue to the time' })),
}))
const searchedName = computed(() => (tl.lastSearch ? roomName(tc.value, tl.lastSearch.room) : ''))
/** What each find tells of the time of death. */
function proves(e: { earliest?: number; latest?: number }): string {
  if (e.earliest !== undefined && e.latest !== undefined && e.earliest === e.latest) return 'the time it was done, to the half hour'
  if (e.latest !== undefined) return 'the latest it can have been done'
  if (e.earliest !== undefined) return 'the earliest it can have been done'
  return ''
}
</script>

<template>
  <div class="search">
    <Transition name="fade" mode="out-in">
      <div v-if="tl.stage === 'search'" key="choose" class="choose">
        <p class="hour-line brass small">{{ clock }}</p>
        <h2 class="heading">Where will you search this hour?</h2>
        <ManorMap mode="pick" :source="source" @pick="tl.search($event)" />
        <ActionBar>
          <template #aside>
            <span class="small muted">Choose a room on the plan to search it.</span>
          </template>
          <button @click="tl.skipSearch()">Forgo the search this hour <Icon name="forward" /></button>
        </ActionBar>
      </div>
      <div v-else key="result" class="found">
        <p class="deco"><span /></p>
        <h2 class="heading">{{ searchedName }}</h2>
        <div v-if="tl.lastSearch && tl.lastSearch.items.length > 0" class="finds">
          <article v-for="(e, i) in tl.lastSearch.items" :key="e.id" class="find paper probative" :style="{ animationDelay: `${0.35 + i * 0.22}s` }">
            <span class="tagline">A clue to the time</span>
            <Icon name="clock" class="art" />
            <strong>{{ e.name }}</strong>
            <span class="proves">{{ proves(e) }}</span>
            <span class="added">added to your evidence</span>
          </article>
        </div>
        <p v-else class="muted nothing">Nothing here that says anything about last night.</p>
        <ActionBar centre>
          <button class="primary" data-next @click="tl.toQuestions()">On to the questioning <Icon name="forward" /></button>
        </ActionBar>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.search {
  max-width: 66rem;
  margin: 0 auto;
  padding: 1.4rem 16px 3rem;
}
.choose,
.found {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
}
.hour-line {
  margin: 0;
  letter-spacing: 0.3em;
  text-transform: uppercase;
}
.heading {
  margin: 0;
}
.finds {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
}
.find {
  width: 15rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  text-align: center;
  font-family: var(--font-type);
  animation: deal 0.5s ease-out both;
}
.tagline {
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--paper-muted);
}
.art {
  width: 3.2rem;
  height: 3.2rem;
  color: var(--paper-ink);
}
.proves {
  font-size: 0.85rem;
  color: var(--paper-muted);
}
.added {
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--paper-muted);
  border-top: 1px dashed var(--paper-line);
  padding-top: 0.4rem;
}
.nothing {
  font-style: italic;
}
@keyframes deal {
  from {
    opacity: 0;
    transform: translateY(12px) rotate(-2deg);
  }
}
</style>

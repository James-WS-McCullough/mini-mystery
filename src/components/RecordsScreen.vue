<script setup lang="ts">
// The detective's service record: rank, commendations, and every case filed.
import { computed } from 'vue'
import type { CaseTier } from '../engine/verdict'
import { useUi } from '../stores/ui'
import { MODES } from '../ui/modes'
import { COMMENDATIONS, RANKS, profile, standing, type CaseRecord } from '../ui/profile'
import Icon from './Icon.vue'
import Overlay from './Overlay.vue'

const ui = useUi()

const TIER: Record<CaseTier, string> = {
  airtight: 'Airtight',
  strong: 'Strong',
  thin: 'A lucky finger',
  wrong: 'The wrong name',
}
const HOURS = ['8 o’clock', '9 o’clock', '10 o’clock', '11 o’clock', 'midnight']

const cases = computed(() => [...profile.cases].reverse())
const progress = computed(() => {
  const s = standing.value
  if (!s.next) return 1
  const floor = RANKS.find((r) => r.name === s.rank)?.at ?? 0
  const span = s.points + s.next.needs - floor
  return span > 0 ? (s.points - floor) / span : 0
})

function when(r: CaseRecord): string {
  return new Date(r.at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}
function hour(r: CaseRecord): string {
  return HOURS[Math.min(r.stats.accusedAtRound, HOURS.length - 1)]
}
/** How hard the case was: its mode, or for an older case, what it had in it. */
function modeName(r: CaseRecord): string {
  const mode = MODES.find((m) => m.id === r.mode)
  if (mode) return mode.name
  return { classic: 'a plain night', foggy: 'the Drunk about', conspiracy: 'an accomplice about', both: 'the Drunk or an accomplice about' }[r.script]
}
</script>

<template>
  <Overlay :open="ui.recordsOpen" title="Service record" width="46rem" @close="ui.recordsOpen = false">
    <section class="rank">
      <Icon name="trophy" size="2.2rem" class="brass" />
      <div class="grow">
        <strong class="brass name">{{ standing.rank }}</strong>
        <div class="small muted">
          {{ standing.solved }} of {{ standing.total }} case{{ standing.total === 1 ? '' : 's' }} solved
          <template v-if="standing.next">
            · {{ standing.next.needs }} more to make {{ standing.next.name }}
          </template>
        </div>
        <div class="bar"><span :style="{ width: `${progress * 100}%` }" /></div>
      </div>
    </section>

    <h3>Commendations</h3>
    <ul class="medals">
      <li v-for="c in COMMENDATIONS" :key="c.id" :class="{ earned: c.id in profile.commendations }">
        <Icon :name="c.id in profile.commendations ? 'star' : 'question'" />
        <div>
          <strong>{{ c.name }}</strong>
          <div class="small muted">{{ c.text }}</div>
        </div>
      </li>
    </ul>

    <h3>Cases filed</h3>
    <p v-if="cases.length === 0" class="muted empty">No case has been filed yet.</p>
    <ul v-else class="cases">
      <li v-for="r in cases" :key="r.at" :class="r.tier">
        <span class="no">
          <Icon v-if="r.daily" name="calendar" title="A daily case" /> №{{ r.seed }}
        </span>
        <span class="tier">{{ TIER[r.tier] }}</span>
        <span class="small muted what">
          accused {{ r.accused }}<template v-if="r.tier === 'wrong'">, but it was {{ r.culprit }}</template>
          · {{ hour(r) }} · {{ modeName(r) }}
        </span>
        <span class="small muted date">{{ when(r) }}</span>
      </li>
    </ul>
  </Overlay>
</template>

<style scoped>
.rank {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.grow {
  flex: 1;
}
.name {
  font-family: var(--font-display);
  font-weight: normal;
  font-size: 1.5rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.bar {
  margin-top: 0.4rem;
  height: 4px;
  background: var(--line);
}
.bar span {
  display: block;
  height: 100%;
  background: var(--brass);
  box-shadow: 0 0 8px rgba(212, 175, 74, 0.7);
}
h3 {
  margin: 1.3rem 0 0.5rem;
  font-size: 1rem;
  text-transform: uppercase;
  color: var(--brass);
}
ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
.medals {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  gap: 0.5rem;
}
.medals li {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--line);
  opacity: 0.5;
}
.medals li.earned {
  opacity: 1;
  border-color: var(--brass-dim);
}
.medals .icon {
  margin-top: 0.2rem;
  font-size: 1.2rem;
}
.medals li.earned .icon {
  color: var(--brass);
}
.medals strong {
  font-weight: normal;
}
.cases li {
  display: grid;
  grid-template-columns: 8.5rem 8rem 1fr auto;
  gap: 0.2rem 0.8rem;
  align-items: baseline;
  padding: 0.45rem 0.2rem;
  border-bottom: 1px solid var(--line);
}
@media (max-width: 640px) {
  .cases li {
    grid-template-columns: 1fr auto;
  }
  .what {
    grid-column: 1 / -1;
  }
}
.no {
  font-family: var(--font-type);
}
.tier {
  color: var(--brass);
}
.cases li.wrong .tier {
  color: #e0695d;
}
.cases li.thin .tier {
  color: var(--muted);
}
.empty {
  font-style: italic;
  margin: 0;
}
</style>

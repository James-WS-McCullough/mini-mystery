<script setup lang="ts">
// The truth of last night: who did it, when, and everybody's true evening,
// the murderer's moment at the scene marked.
import { computed } from 'vue'
import { inPlace, roomName } from '../../engine/timeline/render'
import { SLOT_CLOCK, SLOTS, type Place } from '../../engine/timeline/types'
import { useTimeline } from '../../stores/timeline'
import ActionBar from '../ActionBar.vue'
import Portrait from '../Portrait.vue'
import { useTimelineWords } from './words'

const tl = useTimeline()
const emit = defineEmits<{ (e: 'leave'): void }>()
const { him, name, short } = useTimelineWords()
const tc = computed(() => tl.tc!)
const culprit = computed(() => tc.value.truth.roles.indexOf('murderer'))
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

type Run = { from: number; to: number; room: Place }
const runsOf = (places: readonly (Place | null)[], end: number): Run[] => {
  const runs: Run[] = []
  for (let s = 0; s <= end; s++) {
    const room = places[s]
    if (room === null || room === undefined) continue
    const prev = runs.at(-1)
    if (prev && prev.room === room && prev.to === s - 1) prev.to = s
    else runs.push({ from: s, to: s, room })
  }
  return runs
}
const truthRows = computed(() =>
  tc.value.cast.map((c) => ({ c, runs: runsOf(tc.value.truth.schedule[c.id], tc.value.truth.foundSlot), role: tc.value.truth.roles[c.id] })),
)
const victimRuns = computed(() => runsOf(tc.value.truth.victim, SLOTS - 1))
const ROLE_WORDS = computed(() => ({
  murderer: 'the murderer',
  secretive: 'had a secret of their own',
  witness: `saw ${him.value} go in`,
  discoverer: `found ${him.value}`,
  guest: 'a guest',
}))
</script>

<template>
  <div class="reveal">
    <div class="verdict" :class="tl.accused === culprit ? 'right' : 'wrong'">
      <p class="deco"><span /></p>
      <h2 class="heading">{{ tl.accused === culprit ? 'You have your murderer.' : 'The wrong guest.' }}</h2>
      <p>
        It was <strong>{{ name(culprit) }}</strong>, alone with {{ him }} in {{ roomName(tc, tc.scene) }} at {{ SLOT_CLOCK[tc.truth.murderSlot] }}.
        <template v-if="tl.accused !== culprit && tl.accused !== null"> You named {{ name(tl.accused) }}.</template>
      </p>
      <p v-if="tc.truth.secret" class="small">
        {{ cap(name(tc.truth.secret.by)) }}, who {{ tc.truth.secret.what.replace(/^went/, 'had gone') }}, was the other with something to hide.
      </p>
      <p class="small muted">
        {{ tl.stillPossible.length === 1 ? 'What you gathered was enough to prove it.' : `On what you gathered, ${tl.stillPossible.map(name).join(', ')} could still have done it.` }}
        The bot solved it in {{ tc.solution.questions }} questions and {{ tc.solution.searches }} {{ tc.solution.searches === 1 ? 'search' : 'searches' }}.
      </p>
    </div>
    <div class="board-wrap">
      <div class="board">
        <div class="row head">
          <div class="who" />
          <div class="track">
            <div v-for="s in SLOTS" :key="s" class="slot" :class="{ window: s - 1 === tc.truth.murderSlot }" :style="{ gridColumn: `${s}` }">{{ SLOT_CLOCK[s - 1] }}</div>
          </div>
        </div>
        <div class="row victim">
          <div class="who"><span>{{ tc.victimShort }}</span></div>
          <div class="track">
            <div v-for="run in victimRuns" :key="run.from" class="bar" :class="{ hot: run.to === tc.truth.murderSlot }" :style="{ gridColumn: `${run.from + 1} / ${run.to + 2}` }">
              {{ short(run.room) }}
            </div>
          </div>
        </div>
        <div v-for="r in truthRows" :key="r.c.id" class="row" :class="{ guilty: r.c.id === culprit }">
          <div class="who">
            <Portrait :who="r.c.defId" :pack="tl.pack" :trait="null" shape="token" size="1.8rem" />
            <span>{{ r.c.shortName }} <span class="small muted">· {{ ROLE_WORDS[r.role] }}</span></span>
          </div>
          <div class="track">
            <div
              v-for="run in r.runs"
              :key="run.from"
              class="bar"
              :class="{ hot: run.room === tc.scene && r.c.id === culprit && run.from <= tc.truth.murderSlot && run.to >= tc.truth.murderSlot }"
              :style="{ gridColumn: `${run.from + 1} / ${run.to + 2}` }"
              :title="inPlace(tc, run.room, r.c.id)"
            >
              {{ short(run.room, r.c.id) }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <ActionBar centre>
      <button class="primary" @click="tl.leave()">Another evening</button>
      <button class="ghost" @click="emit('leave')">Back to the title</button>
    </ActionBar>
  </div>
</template>

<style scoped>
.reveal {
  max-width: 66rem;
  margin: 0 auto;
  padding: 1.6rem 16px 3rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.verdict {
  text-align: center;
}
.verdict.wrong .heading {
  color: var(--danger);
}
.board-wrap {
  overflow-x: auto;
}
.board {
  min-width: 44rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: left;
}
.row {
  display: grid;
  grid-template-columns: 12rem 1fr;
}
.row.victim .who,
.row.guilty .who {
  color: var(--danger);
}
.who {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
}
.track {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: 1.7rem;
}
.slot {
  font-size: 0.75rem;
  padding: 0.3rem 0;
  border: 1px solid var(--line);
  color: var(--muted);
  border-radius: 4px;
  margin: 0 1px;
  text-align: center;
}
.slot.window {
  color: var(--ink);
  border-color: var(--danger);
}
.bar {
  margin: 1px 2px;
  padding: 0 0.4rem;
  font-size: 0.72rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-radius: 5px;
  border: 1px solid var(--line);
  background: #222a33;
  line-height: 1.5rem;
}
.bar.hot {
  border-color: var(--danger);
  background: var(--danger-deep);
}
</style>

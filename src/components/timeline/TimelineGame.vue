<script setup lang="ts">
// The Evening Timeline (playtest). The detective arrives the following night,
// and the night runs as the classic one does: the case file, then each hour
// from eight o'clock a search of one room on the plan and questions to the
// household, until midnight and the accusation. Every account is of last
// night, and the timeline of it is to hand all the while.
import { ref } from 'vue'
import type { Difficulty } from '../../engine/timeline/types'
import { useTimeline } from '../../stores/timeline'
import { useUi } from '../../stores/ui'
import Icon from '../Icon.vue'
import StatementScene from './StatementScene.vue'
import TimelineAccuse from './TimelineAccuse.vue'
import TimelineBoard from './TimelineBoard.vue'
import TimelineCaseSheet from './TimelineCaseSheet.vue'
import TimelineChime from './TimelineChime.vue'
import TimelineHud from './TimelineHud.vue'
import TimelineIntro from './TimelineIntro.vue'
import TimelineQuestion from './TimelineQuestion.vue'
import TimelineReveal from './TimelineReveal.vue'
import TimelineSearch from './TimelineSearch.vue'

const tl = useTimeline()
const ui = useUi()

const difficulty = ref<Difficulty>('normal')
const failed = ref(false)
function begin() {
  failed.value = false
  try {
    tl.start(difficulty.value)
  } catch {
    failed.value = true
  }
}
function leave() {
  tl.leave()
  ui.timeline = false
}
const caseFile = ref(false)
</script>

<template>
  <section class="timeline">
    <!-- ---- choosing an evening ---- -->
    <div v-if="tl.stage === 'start' || !tl.tc" class="start">
      <header>
        <p class="kicker small">Playtest · not yet public</p>
        <h2 class="heading">The Evening Timeline</h2>
      </header>
      <p class="narration">
        You arrive the following evening. Last night, after a dinner at Blackwood Manor, somebody was killed. Ask each
        guest what happened last night, pin down when it was done, and find who was unaccounted for then.
      </p>
      <div class="choices">
        <label v-for="d in ['easy', 'normal', 'hard'] as const" :key="d" class="choice" :class="{ on: difficulty === d }">
          <input v-model="difficulty" type="radio" :value="d" />
          <strong>{{ d === 'easy' ? 'Easy' : d === 'normal' ? 'Normal' : 'Hard' }}</strong>
          <span class="small muted">{{
            d === 'easy'
              ? 'The doctor’s note gives the latest time, and a stopped watch is at the scene.'
              : d === 'normal'
                ? 'A smashed watch is at the scene, to be found.'
                : 'No clock to find: only who saw the victim last, and who found the body.'
          }}</span>
        </label>
      </div>
      <div class="go">
        <button class="ghost" @click="leave()"><Icon name="back" /> Back</button>
        <button class="primary" @click="begin()">Take the case <Icon name="forward" /></button>
      </div>
      <p v-if="failed" class="small danger-text">That evening would not deal. Try again.</p>
    </div>

    <template v-else>
      <TimelineHud v-if="tl.stage !== 'intro' && tl.stage !== 'transition' && tl.stage !== 'reveal'" @case-file="caseFile = true" @leave="leave()" />
      <TimelineIntro v-if="tl.stage === 'intro'" />
      <TimelineChime v-else-if="tl.stage === 'transition'" :key="`hour${tl.hour}`" />
      <TimelineSearch v-else-if="tl.stage === 'search' || tl.stage === 'searched'" />
      <TimelineQuestion v-else-if="tl.stage === 'question'" />
      <TimelineAccuse v-else-if="tl.stage === 'accuse'" />
      <TimelineReveal v-else-if="tl.stage === 'reveal'" @leave="leave()" />

      <div v-if="caseFile" class="shade" role="dialog" aria-modal="true" aria-label="The case file" @click.self="caseFile = false">
        <div class="file-panel">
          <TimelineCaseSheet />
          <button class="primary" @click="caseFile = false">Close</button>
        </div>
      </div>
      <TimelineBoard v-if="tl.boardOpen" />
      <Teleport to="body"><StatementScene v-if="tl.telling" /></Teleport>
    </template>
  </section>
</template>

<style scoped>
.timeline {
  min-height: 100%;
}
.start {
  max-width: 44rem;
  margin: 0 auto;
  padding: 2.4rem 16px 4rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-align: center;
}
.kicker {
  margin: 0;
  color: var(--danger);
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.heading {
  margin: 0.2rem 0 0;
}
.narration {
  font-style: italic;
  line-height: 1.6;
  margin: 0;
}
.choices {
  display: grid;
  gap: 0.5rem;
  text-align: left;
}
.choice {
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: 0.6rem;
  align-items: baseline;
  padding: 0.6rem 0.8rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  cursor: pointer;
}
.choice.on {
  border-color: var(--brass);
}
.go {
  display: flex;
  justify-content: space-between;
}
.danger-text {
  color: var(--danger);
}
.shade {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(5, 7, 10, 0.75);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow-y: auto;
  padding: 1.5rem 16px;
}
.file-panel {
  width: min(100%, 44rem);
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  align-items: center;
}
</style>

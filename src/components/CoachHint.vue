<script setup lang="ts">
// Sergeant Pike at the detective's elbow: a word of advice the first time
// each part of the night comes round, and never again unless asked.
import { computed } from 'vue'
import { useGame } from '../stores/game'
import { useUi } from '../stores/ui'
import { sfx } from '../ui/audio'
import { HINTS, type HintId } from '../ui/coach'
import { profile } from '../ui/profile'
import Portrait from './Portrait.vue'

const game = useGame()
const ui = useUi()

const here = computed<HintId | null>(() => {
  switch (game.phase) {
    case 'intro':
      return 'intro'
    case 'gather':
      return 'gather'
    case 'accuse':
      return 'accuse'
    case 'play':
      if (game.stage === 'search') return 'search'
      if (game.stage === 'deduce') return 'deduce'
      if (game.stage === 'question') return game.activeChar === null ? 'suspects' : 'interview'
      return null
    default:
      return null
  }
})

const hint = computed(() => {
  const id = here.value
  if (!id || !profile.guidance || ui.anyOpen || game.notebookOpen) return null
  if (profile.hintsSeen.includes(id)) return null
  return { id, text: HINTS[id] }
})

function dismiss() {
  if (!hint.value) return
  sfx('click')
  profile.hintsSeen.push(hint.value.id)
}
function silence() {
  sfx('click')
  profile.guidance = false
}
</script>

<template>
  <Transition name="coach">
    <aside v-if="hint" :key="hint.id" class="coach" role="note">
      <Portrait shape="token" size="3rem" />
      <div class="words">
        <strong class="brass">Sergeant Pike</strong>
        <p>{{ hint.text }}</p>
        <div class="actions">
          <button class="ghost small" @click="silence()">No more advice</button>
          <button class="small" data-coach-ok @click="dismiss()">Understood</button>
        </div>
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
.coach {
  position: absolute;
  z-index: 20;
  left: 1rem;
  bottom: 1rem;
  width: min(27rem, calc(100% - 2rem));
  display: flex;
  gap: 0.8rem;
  padding: 0.8rem 0.9rem;
  border: 1px solid var(--brass-dim);
  border-left: 3px solid var(--brass);
  background: rgba(11, 14, 18, 0.96);
  box-shadow: var(--shadow);
}
.words {
  flex: 1;
  min-width: 0;
}
strong {
  font-family: var(--font-display);
  font-weight: normal;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 0.85rem;
}
p {
  margin: 0.15rem 0 0.5rem;
  line-height: 1.5;
  font-size: 0.95rem;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.4rem;
}
.actions button {
  padding: 0.25rem 0.7rem;
}
.coach-enter-active,
.coach-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.coach-enter-active {
  transition-delay: 0.6s;
}
.coach-enter-from,
.coach-leave-to {
  opacity: 0;
  transform: translateY(16px);
}
</style>

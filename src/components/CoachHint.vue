<script setup lang="ts">
// Sergeant Pike at the detective's elbow: a word of advice the first time
// each part of the night comes round, and never again unless asked.
import { computed } from 'vue'
import { addressPlayer } from '../engine/address'
import { useGame } from '../stores/game'
import { useUi } from '../stores/ui'
import { sfx } from '../ui/audio'
import { HINTS, type HintId } from '../ui/coach'
import { profile } from '../ui/profile'
import { settings } from '../ui/settings'
import Icon, { type IconName } from './Icon.vue'
import Portrait from './Portrait.vue'

const game = useGame()
const ui = useUi()

const here = computed<HintId | null>(() => {
  switch (game.phase) {
    case 'intro':
      return 'intro'
    case 'accuse':
      return 'accuse'
    case 'play':
      if (game.stage === 'search') return 'search'
      if (game.stage === 'deduce') return 'deduce'
      if (game.stage === 'question') {
        if (game.questionsLeft <= 0) return 'spent'
        return game.activeChar === null ? 'suspects' : null
      }
      return null
    default:
      return null
  }
})

const hint = computed(() => {
  const id = here.value
  // (On a campaign case with a lesson, the sergeant is at the detective's elbow already.)
  if (!id || !profile.guidance || ui.anyOpen || game.notebookOpen || game.tutorial) return null
  if (profile.hintsSeen.includes(id)) return null
  return {
    id,
    text: addressPlayer(HINTS[id], settings.address, {
      house: game.place.name,
      household: game.place.people,
    }),
  }
})

/** The hint in pieces: words, and the icons for the three pillars. */
const pieces = computed(() =>
  (hint.value?.text ?? '')
    .split(/(\[(?:key|heart|steps)\])/)
    .filter((p) => p.length > 0)
    .map((p) => {
      const icon = /^\[(key|heart|steps)\]$/.exec(p)
      return icon ? { icon: icon[1] as IconName } : { text: p }
    }),
)

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
        <p>
          <template v-for="(p, i) in pieces" :key="i">
            <Icon v-if="p.icon" :name="p.icon" class="pillar" /><template v-else>{{ p.text }}</template>
          </template>
        </p>
        <div class="actions">
          <button class="ghost small" @click="silence()">No more advice</button>
          <button class="small" data-coach-ok @click="dismiss()">Understood</button>
        </div>
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
.pillar {
  color: var(--brass);
  vertical-align: -0.1em;
  margin-right: 0.15em;
}
.coach {
  position: absolute;
  z-index: 20;
  left: 1rem;
  /* Clear of the action bar. */
  bottom: 4.6rem;
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

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useGame } from '../stores/game'
import { useUi } from '../stores/ui'
import { sfx } from '../ui/audio'
import ClockFace from './ClockFace.vue'
import Icon from './Icon.vue'

const game = useGame()
const ui = useUi()

const perRound = computed(() => game.mystery?.config.questionsPerRound ?? 0)
const spent = computed(() =>
  perRound.value > 0 && game.stage !== 'search' && game.stage !== 'searched'
    ? (perRound.value - game.questionsLeft) / perRound.value
    : 0,
)

// A scratch of the pen whenever something new goes into the notebook.
const noted = ref(0)
let fade: ReturnType<typeof setTimeout> | undefined
watch(
  () => game.notebook.length,
  (now, before) => {
    if (now <= before) return
    noted.value = now - before
    sfx('scratch')
    clearTimeout(fade)
    fade = setTimeout(() => (noted.value = 0), 2200)
  },
)

function toggleNotebook() {
  sfx('page')
  game.notebookOpen = !game.notebookOpen
}
function openMap() {
  sfx('page')
  game.notebookOpen = false
  ui.mapOpen = true
}
</script>

<template>
  <header class="hud">
    <div class="time" :title="`${game.clockLabel}`">
      <ClockFace :hour="8 + game.round" :spent="spent" />
      <span class="hour brass">{{ game.clockLabel }}</span>
    </div>

    <span
      v-if="game.stage === 'question'"
      class="pips"
      role="img"
      :aria-label="`${game.questionsLeft} of ${perRound} questions left this hour`"
      :title="`${game.questionsLeft} questions left this hour`"
    >
      <span v-for="i in perRound" :key="i" class="pip" :class="{ spent: i > game.questionsLeft }" />
    </span>
    <span
      v-else-if="game.stage === 'deduce'"
      class="pips"
      role="img"
      :aria-label="`${game.missesLeft} wrong pairings left this hour`"
      :title="`${game.missesLeft} wrong pairings left this hour`"
    >
      <span v-for="i in 3" :key="i" class="pip miss" :class="{ spent: i > game.missesLeft }" />
    </span>

    <span class="spacer" />

    <button class="tool" title="The plan of the house (M)" @click="openMap()">
      <Icon name="map" /> <span class="label">Plan</span>
    </button>
    <button
      v-if="game.stage !== 'deduce'"
      class="tool notebook"
      title="Your notebook (N)"
      @click="toggleNotebook()"
    >
      <Icon name="notebook" /> <span class="label">Notebook</span>
      <span v-if="game.realized.length > 0" class="threads brass">
        <Icon name="bolt" />{{ game.realized.length }}
      </span>
      <Transition name="fade">
        <span v-if="noted > 0" class="noted">+{{ noted }} noted</span>
      </Transition>
    </button>
    <button class="tool danger" @click="ui.confirmAccuse = true">
      <Icon name="scales" /> <span class="label">Accuse</span>
    </button>
    <button class="tool ghost" title="Menu (Esc)" aria-label="Menu" @click="ui.menuOpen = true">
      <Icon name="gear" />
    </button>
  </header>
</template>

<style scoped>
.hud {
  position: relative;
  z-index: 5;
  flex: none;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-height: var(--hud-h);
  padding: 0.4rem 0.9rem;
  border-bottom: 1px solid var(--brass-dim);
  background: linear-gradient(180deg, rgba(23, 28, 35, 0.97), rgba(11, 14, 18, 0.97));
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
}
.time {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}
.hour {
  font-family: var(--font-display);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 1.05rem;
  white-space: nowrap;
}
.spacer {
  flex: 1;
}
.pips {
  display: inline-flex;
  gap: 0.32rem;
  align-items: center;
  margin-left: 0.3rem;
}
.pip {
  width: 0.62rem;
  height: 0.62rem;
  transform: rotate(45deg);
  background: var(--brass);
  box-shadow: 0 0 8px rgba(212, 175, 74, 0.6);
  transition:
    background 0.3s,
    box-shadow 0.3s,
    transform 0.3s;
}
.pip.miss {
  background: var(--danger);
  box-shadow: 0 0 8px rgba(192, 71, 60, 0.6);
  border-radius: 50%;
}
.pip.spent {
  background: var(--line);
  box-shadow: none;
  transform: rotate(45deg) scale(0.7);
}
.tool {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  white-space: nowrap;
}
.threads {
  display: inline-flex;
  align-items: center;
  font-size: 0.85rem;
}
.noted {
  position: absolute;
  top: calc(100% + 0.35rem);
  right: 0;
  padding: 0.15rem 0.5rem 0.05rem;
  font-family: var(--font-type);
  font-size: 0.75rem;
  color: var(--paper-ink);
  background: var(--paper);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.5);
  pointer-events: none;
  transform: rotate(-2deg);
}
@media (max-width: 900px) {
  .label.wide {
    display: none;
  }
}
@media (max-width: 640px) {
  .label,
  .hour {
    display: none;
  }
  .hud {
    gap: 0.35rem;
    padding: 0.4rem 0.5rem;
  }
  .tool {
    padding: 0.5rem 0.6rem;
  }
}
</style>

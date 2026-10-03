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
/** The coffee's questions still in hand: they go before the hour's own. */
const beansLeft = computed(() => game.beansLeft)
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
function openCast() {
  sfx('page')
  ui.castOpen = true
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
      :class="{ long: game.bonusQuestions > 0 }"
      role="img"
      :aria-label="`${game.questionsLeft} of ${perRound + game.bonusQuestions} questions left this hour`"
      :title="`${game.questionsLeft} questions left this hour`"
    >
      <!-- The hour's own questions, and after them any the coffee is good for: those spent first. -->
      <span class="row">
        <span v-for="i in perRound" :key="i" class="pip" :class="{ spent: i > game.questionsLeft - beansLeft }" />
      </span>
      <span v-if="game.bonusQuestions" class="row">
        <span v-for="i in game.bonusQuestions" :key="`b${i}`" class="pip bean" :class="{ spent: i > beansLeft }" />
      </span>
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

    <button class="tool" :title="`${game.place.plan[0].toUpperCase() + game.place.plan.slice(1)} (M)`" @click="openMap()">
      <Icon name="map" /> <span class="label">Plan</span>
    </button>
    <button class="tool" title="Tonight’s cast: every part that may be in the house (R)" @click="openCast()">
      <Icon name="list" /> <span class="label">Cast</span>
    </button>
    <button
      v-if="game.stage !== 'deduce'"
      class="tool notebook"
      title="Your notebook (N)"
      @click="toggleNotebook()"
    >
      <Icon name="notebook" /> <span class="label">Notebook</span>
      <!-- Lifelines in hand and not yet used: worth a look. -->
      <span
        v-if="game.unusedLifelines.length > 0"
        class="lifelines"
        :title="`${game.unusedLifelines.length} lifeline${game.unusedLifelines.length === 1 ? '' : 's'} to use`"
      >
        {{ game.unusedLifelines.length }}
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
.pips .row {
  display: inline-flex;
  gap: 0.32rem;
  align-items: center;
}
/* The coffee's questions: diamonds like the rest, each with a coffee bean on it. */
.pip.bean {
  position: relative;
  /* Coffee-coloured, so they read apart from the hour's own gold. */
  background: #b07a45;
  box-shadow: 0 0 8px rgba(176, 122, 69, 0.55);
}
.pip.bean::after {
  content: '';
  position: absolute;
  inset: 22% 30%;
  border-radius: 50%;
  transform: rotate(-20deg);
  background: linear-gradient(90deg, #3a1f0d 44%, #7a4a26 44% 56%, #3a1f0d 56%);
}
.pip.bean.spent {
  background: var(--line);
  box-shadow: none;
}
.pip.bean.spent::after {
  opacity: 0.35;
}
/* On a phone, the coffee's diamonds go in a second row beneath the hour's own. */
@media (max-width: 560px) {
  .pips.long {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.28rem;
  }
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
/* The count of lifelines to use, in their green. */
.lifelines {
  display: inline-grid;
  place-items: center;
  min-width: 1.15rem;
  height: 1.15rem;
  padding: 0 0.25rem;
  border-radius: 1rem;
  background: #2f6a45;
  border: 1px solid #6fbf8a;
  color: #f3e7c3;
  font-size: 0.72rem;
  line-height: 1;
}
</style>

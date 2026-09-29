<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { manor1920s } from './content/manor1920s'
import { useGame } from './stores/game'
import { useUi } from './stores/ui'
import { setShelter, unlock, type Shelter } from './ui/audio'
import { useKeys } from './ui/keys'
import { fileCase, type CaseRecord } from './ui/profile'
import { writeSave } from './ui/save'
import { settings } from './ui/settings'
import AccuseScreen from './components/AccuseScreen.vue'
import Atmosphere from './components/Atmosphere.vue'
import CoachHint from './components/CoachHint.vue'
import ConfirmAccuse from './components/ConfirmAccuse.vue'
import DeduceScreen from './components/DeduceScreen.vue'
import GatherScreen from './components/GatherScreen.vue'
import HourTransition from './components/HourTransition.vue'
import HudBar from './components/HudBar.vue'
import IntroScreen from './components/IntroScreen.vue'
import MapOverlay from './components/MapOverlay.vue'
import NotebookDrawer from './components/NotebookDrawer.vue'
import QuestioningStage from './components/QuestioningStage.vue'
import RecordsScreen from './components/RecordsScreen.vue'
import RevealScreen from './components/RevealScreen.vue'
import SearchScreen from './components/SearchScreen.vue'
import SettingsMenu from './components/SettingsMenu.vue'
import TitleScreen from './components/TitleScreen.vue'

const game = useGame()
const ui = useUi()

/** Which scene is on stage; a change of key plays the scene transition. */
const scene = computed(() => {
  if (game.phase !== 'play') return game.phase
  if (game.stage === 'searched') return 'search'
  return game.stage
})
/** Where the detective stands: the storm is muffled within doors. */
const shelter = computed<Shelter>(() => {
  if (game.phase === 'title') return 'outside'
  if (game.phase !== 'play' || game.stage !== 'searched') return 'inside'
  const kind = manor1920s.rooms.find((r) => r.id === game.lastSearchRoom)?.kind
  return kind === 'outdoor' ? 'outside' : kind === 'glasshouse' ? 'glass' : 'inside'
})
watch(shelter, setShelter, { immediate: true })

const inHour = computed(() => game.phase === 'play' && game.stage !== 'transition')

// Audio may only begin on a gesture; the first touch of anything wakes it.
onMounted(() => {
  window.addEventListener('pointerdown', unlock)
  window.addEventListener('keydown', unlock)
})
onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', unlock)
  window.removeEventListener('keydown', unlock)
})

// The night is written down after everything the detective does.
watch(
  () => [
    game.phase,
    game.actions.length,
    game.accusedId,
    game.citedNoteIds.length,
    game.citedItemIds.length,
    game.citedThreadKeys.length,
  ],
  () => {
    if (game.phase === 'title') return
    writeSave(game.exportSave())
  },
)

// A verdict closes the case: into the service record it goes.
watch(
  () => game.phase,
  (now, before) => {
    if (now !== 'reveal' || before !== 'accuse') return
    const m = game.mystery
    const v = game.verdict
    if (!m || !v || game.accusedId === null) return
    const record: CaseRecord = {
      seed: m.seed,
      script: game.script,
      daily: game.daily,
      tier: v.tier,
      accused: m.cast[game.accusedId].shortName,
      culprit: m.cast[m.truth.roles.indexOf('culprit')].shortName,
      cleared: v.cleared,
      pillars: { ...v.pillars },
      stats: { ...game.nightStats },
      at: Date.now(),
    }
    ui.lastRecord = record
    ui.earned = fileCase(record)
  },
)

useKeys(
  (key) => {
    if (key === 'Escape') {
      if (ui.anyOpen) ui.closeAll()
      else if (game.notebookOpen) game.notebookOpen = false
      else ui.menuOpen = true
      return true
    }
    if (ui.anyOpen || !inHour.value) return false
    if (key === 'n' && game.stage !== 'deduce') {
      game.notebookOpen = !game.notebookOpen
      return true
    }
    if (key === 'c' && (game.stage === 'question' || game.stage === 'deduce')) {
      if (game.stage === 'question') game.beginDeduce()
      else game.resumeQuestions()
      return true
    }
    if (key === 'm') {
      game.notebookOpen = false
      ui.mapOpen = true
      return true
    }
    return false
  },
  { shell: true },
)

/**
 * The storm comes on with the night: a way off at eight o'clock, nearer with
 * every hour, and overhead by midnight.
 */
const stormNear = computed(() => {
  if (game.phase === 'accuse' || game.phase === 'reveal') return 1
  if (game.phase !== 'play') return 0
  const hours = game.mystery?.config.rounds ?? 4
  return Math.min(1, Math.max(0, game.round / hours))
})
</script>

<template>
  <div class="stage" :class="{ 'reduced-motion': settings.reducedMotion }">
    <Atmosphere :storm="game.phase === 'title' ? 'heavy' : 'light'" :near="stormNear" />

    <HudBar v-if="inHour" />

    <Transition name="scene" mode="out-in">
      <div :key="scene" class="scene">
        <TitleScreen v-if="scene === 'title'" />
        <IntroScreen v-else-if="scene === 'intro'" />
        <GatherScreen v-else-if="scene === 'gather'" />
        <HourTransition v-else-if="scene === 'transition'" />
        <SearchScreen v-else-if="scene === 'search'" />
        <DeduceScreen v-else-if="scene === 'deduce'" />
        <QuestioningStage v-else-if="scene === 'question'" />
        <AccuseScreen v-else-if="scene === 'accuse'" />
        <RevealScreen v-else-if="scene === 'reveal'" />
      </div>
    </Transition>

    <!-- Each scene puts its way onward here (see ActionBar). -->
    <footer id="action-bar" class="action-bar" />

    <CoachHint />
    <NotebookDrawer v-if="inHour" />
    <MapOverlay />
    <ConfirmAccuse />
    <RecordsScreen />
    <SettingsMenu />
  </div>
</template>

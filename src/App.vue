<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useGame } from './stores/game'
import { useUi } from './stores/ui'
import { holdMusic, playTune, setAmbience, setShelter, unlock, type Shelter, type Tune } from './ui/audio'
import { useKeys } from './ui/keys'
import { fileCase, type CaseRecord } from './ui/profile'
import { writeSave } from './ui/save'
import { settings } from './ui/settings'
import AccuseScreen from './components/AccuseScreen.vue'
import Atmosphere from './components/Atmosphere.vue'
import ConfirmAccuse from './components/ConfirmAccuse.vue'
import ConfirmHour from './components/ConfirmHour.vue'
import LifelineReport from './components/LifelineReport.vue'
import LifelineScene from './components/LifelineScene.vue'
import HandwritingScene from './components/HandwritingScene.vue'
import DeduceScreen from './components/DeduceScreen.vue'
import GatherScreen from './components/GatherScreen.vue'
import HourTransition from './components/HourTransition.vue'
import HudBar from './components/HudBar.vue'
import IntroScreen from './components/IntroScreen.vue'
import MapOverlay from './components/MapOverlay.vue'
import NotebookDrawer from './components/NotebookDrawer.vue'
import QuestioningStage from './components/QuestioningStage.vue'
import RecordsScreen from './components/RecordsScreen.vue'
import CaseFileOverlay from './components/CaseFileOverlay.vue'
import RoleSheet from './components/RoleSheet.vue'
import RevealScreen from './components/RevealScreen.vue'
import SearchScreen from './components/SearchScreen.vue'
import SettingsMenu from './components/SettingsMenu.vue'
import TitleScreen from './components/TitleScreen.vue'
import TutorialScene from './components/TutorialScene.vue'
import BriefingScene from './components/BriefingScene.vue'
import UpdatePrompt from './components/UpdatePrompt.vue'
import { watchForUpdates } from './ui/update'
import BuildingCase from './components/BuildingCase.vue'

/** The two answers that name nobody, as the service record writes them. */
const NOBODY = { suicide: 'nobody (a suicide)', hoax: 'nobody (a hoax)' } as const
/** Several of the household, as the service record writes them: "A, B and C". */
function names(ids: readonly number[]): string {
  const all = ids.map((c) => game.mystery!.cast[c].shortName)
  return all.length > 1 ? `${all.slice(0, -1).join(', ')} and ${all.at(-1)}` : (all[0] ?? 'nobody')
}

const game = useGame()
const ui = useUi()

/** Which scene is on stage; a change of key plays the scene transition. */
const scene = computed(() => {
  // (While a case is being built, the title stays behind the screen that says so,
  // and the case opens from the start once it is lifted.)
  if (ui.building) return 'title'
  if (game.phase !== 'play') return game.phase
  if (game.stage === 'searched') return 'search'
  return game.stage
})
/** Where the detective stands: the storm is muffled within doors. */
const shelter = computed<Shelter>(() => {
  if (game.phase === 'title') return 'outside'
  if (game.phase !== 'play' || game.stage !== 'searched') return 'inside'
  const kind = game.pack.rooms.find((r) => r.id === game.lastSearchRoom)?.kind
  return kind === 'outdoor' ? 'outside' : kind === 'glasshouse' ? 'glass' : 'inside'
})
watch(shelter, setShelter, { immediate: true })
/** Before a setting is chosen there is no weather: only dust, and quiet. It comes up as one is. */
const outdoors = computed(() => game.phase !== 'title' || ui.titlePage !== 'home')
watch(() => (outdoors.value ? (game.pack.ambience ?? 'rain') : 'none'), setAmbience, { immediate: true })
/**
 * The night's tune, all evening; as midnight strikes it falls away, and the
 * final hour's begins as the household gives its statements, until the reveal
 * has played out to the truth and the night's comes back. An accusation made
 * early brings the final hour's on too (and stepping back from it, the night's).
 */
const tune = computed<Tune | null>(() =>
  game.phase === 'accuse' || (game.phase === 'reveal' && !ui.truthTold)
    ? 'midnight'
    : game.transitionToMidnight && game.phase === 'play'
      ? null
      : 'night',
)
watch(tune, playTune, { immediate: true })
// Asked whether to accuse, the music goes quiet, and plays on unheard: no,
// and it comes back up; yes, and the final hour's takes its place.
watch(
  () => ui.confirmAccuse,
  (asking) => {
    if (asking) holdMusic(true)
    else if (game.phase !== 'accuse') holdMusic(false)
  },
)

const inHour = computed(() => game.phase === 'play' && game.stage !== 'transition')

// Audio may only begin on a gesture; the first touch of anything wakes it.
onMounted(() => {
  watchForUpdates()
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
    game.together.length,
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
      ...(game.script !== 'custom' ? { mode: game.script } : {}),
      ...(game.campaignId ? { campaign: game.campaignId } : {}),
      pack: game.packId,
      daily: game.daily,
      tier: v.tier,
      // (Nobody: a suicide, or a hoax, said or so.)
      accused:
        game.accusedId === -1
          ? NOBODY.suicide
          : game.accusedId === -2
            ? NOBODY.hoax
            : game.accusedId === -3
              ? names(game.together)
              : m.cast[game.accusedId].shortName,
      culprit: m.truth.suicide
        ? NOBODY.suicide
        : m.truth.hoax
          ? NOBODY.hoax
          : m.truth.committee
            ? names(m.truth.committee)
            : m.cast[m.truth.roles.indexOf('murderer')].shortName,
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
      if (ui.roleSheet) ui.roleSheet = null
      else if (game.lifelineReport) game.lifelineReport = null
      else if (ui.anyOpen) ui.closeAll()
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
    if (key === 'f') {
      ui.caseFileOpen = true
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
    <Atmosphere
      :storm="game.phase === 'title' ? 'heavy' : 'light'"
      :near="stormNear"
      :weather="outdoors ? (game.pack.weather ?? 'storm') : 'dust'"
    />

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

    <!-- Sergeant Pike's word on what he asked for, kept above the way onward (see TutorialScene). -->
    <div id="lesson-bar" class="lesson-bar" />
    <!-- Each scene puts its way onward here (see ActionBar). -->
    <footer id="action-bar" class="action-bar" />

    <TutorialScene />
    <BriefingScene />
    <NotebookDrawer v-if="inHour" />
    <MapOverlay />
    <ConfirmAccuse />
    <ConfirmHour />
    <LifelineReport />
    <LifelineScene />
    <HandwritingScene />
    <RecordsScreen />
    <CaseFileOverlay />
    <RoleSheet />
    <SettingsMenu />
    <BuildingCase />
    <UpdatePrompt />
  </div>
</template>

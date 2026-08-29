<script setup lang="ts">
import { useGame } from './stores/game'
import TitleScreen from './components/TitleScreen.vue'
import IntroScreen from './components/IntroScreen.vue'
import GatherScreen from './components/GatherScreen.vue'
import HourTransition from './components/HourTransition.vue'
import SearchScreen from './components/SearchScreen.vue'
import DeduceScreen from './components/DeduceScreen.vue'
import QuestioningStage from './components/QuestioningStage.vue'
import HudBar from './components/HudBar.vue'
import NotebookDrawer from './components/NotebookDrawer.vue'
import AccuseScreen from './components/AccuseScreen.vue'
import RevealScreen from './components/RevealScreen.vue'

const game = useGame()
</script>

<template>
  <TitleScreen v-if="game.phase === 'title'" />
  <IntroScreen v-else-if="game.phase === 'intro'" />
  <GatherScreen v-else-if="game.phase === 'gather'" />

  <template v-else-if="game.phase === 'play'">
    <HourTransition v-if="game.stage === 'transition'" />
    <template v-else>
      <HudBar />
      <SearchScreen v-if="game.stage === 'search' || game.stage === 'searched'" />
      <DeduceScreen v-else-if="game.stage === 'deduce'" />
      <QuestioningStage v-else />
      <NotebookDrawer />
    </template>
  </template>

  <AccuseScreen v-else-if="game.phase === 'accuse'" />
  <RevealScreen v-else-if="game.phase === 'reveal'" />
</template>

<script setup lang="ts">
// The Accuse button is always within reach, so it asks before it acts.
import { computed } from 'vue'
import { useGame } from '../stores/game'
import { useUi } from '../stores/ui'
import { sfx } from '../ui/audio'
import ConfirmDialog from './ConfirmDialog.vue'

const game = useGame()
const ui = useUi()

const hoursLeft = computed(() =>
  game.mystery ? game.mystery.config.rounds - 1 - game.round : 0,
)
/** What is being given up by accusing now: questions in hand first, then hours. */
const line = computed(() => {
  const q = game.questionsLeft
  if (q > 0) return `You still have ${q} question${q === 1 ? '' : 's'} to ask.`
  if (hoursLeft.value > 0) return 'You still have time before midnight.'
  return 'You are about to name the murderer.'
})

function proceed() {
  sfx('gavel')
  ui.confirmAccuse = false
  game.beginAccuse()
}
</script>

<template>
  <ConfirmDialog
    :open="ui.confirmAccuse"
    :line="line"
    note="You can still step back until you point the finger."
    confirm="Make the accusation"
    danger
    @cancel="ui.confirmAccuse = false"
    @confirm="proceed()"
  />
</template>

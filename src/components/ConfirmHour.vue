<script setup lang="ts">
// Letting the hour strike with questions still in hand: the hour does not come back.
import { useGame } from '../stores/game'
import { useUi } from '../stores/ui'
import { sfx } from '../ui/audio'
import ConfirmDialog from './ConfirmDialog.vue'

const game = useGame()
const ui = useUi()

function proceed() {
  sfx('select')
  ui.confirmHour = false
  game.strikeHour()
}
</script>

<template>
  <ConfirmDialog
    :open="ui.confirmHour"
    :line="`You still have ${game.questionsLeft} question${game.questionsLeft === 1 ? '' : 's'} to ask.`"
    note="You won't be able to go back."
    :confirm="game.isLastRound ? 'Face midnight' : 'Let the hour strike'"
    @cancel="ui.confirmHour = false"
    @confirm="proceed()"
  />
</template>

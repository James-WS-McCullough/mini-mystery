<script setup lang="ts">
// The Accuse button is always within reach, so it asks before it acts.
import { computed } from 'vue'
import { useGame } from '../stores/game'
import { useUi } from '../stores/ui'
import { sfx } from '../ui/audio'
import Overlay from './Overlay.vue'

const game = useGame()
const ui = useUi()

const hoursLeft = computed(() =>
  game.mystery ? game.mystery.config.rounds - 1 - game.round : 0,
)

function proceed() {
  sfx('gavel')
  ui.confirmAccuse = false
  game.beginAccuse()
}
</script>

<template>
  <Overlay :open="ui.confirmAccuse" title="Are you certain?" width="30rem" @close="ui.confirmAccuse = false">
    <p>
      You are about to lay your case before {{ game.place.people }}. You have drawn
      <strong class="brass">{{ game.realized.length }}</strong>
      thread{{ game.realized.length === 1 ? '' : 's' }}<template v-if="hoursLeft > 0"
        >, and
        <strong class="brass">{{ hoursLeft }}</strong>
        hour{{ hoursLeft === 1 ? '' : 's' }} remain before midnight</template
      >.
    </p>
    <p class="muted small">
      You may still step back from the accusation until you point the finger.
    </p>
    <template #actions>
      <button @click="ui.confirmAccuse = false">Not yet</button>
      <button class="danger" data-confirm @click="proceed()">Make the accusation</button>
    </template>
  </Overlay>
</template>

<style scoped>
p {
  margin: 0 0 0.7rem;
  line-height: 1.6;
}
</style>

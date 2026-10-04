<script setup lang="ts">
// The note beside him and a letter he truly wrote, side by side: Sergeant
// Pike looks from one to the other and says what the detective could not
// be sure of. Played once, when the second of the two turns up.
import { computed } from 'vue'
import { PIKE, PIKE_FORGERY, PIKE_LETTERS, PIKE_VOICE } from '../content/lifelines'
import { addressPlayer } from '../engine/address'
import { useGame } from '../stores/game'
import { sfx } from '../ui/audio'
import { settings } from '../ui/settings'
import DialogueBox from './DialogueBox.vue'
import ItemArt from './ItemArt.vue'
import Overlay from './Overlay.vue'
import Portrait from './Portrait.vue'

const game = useGame()
const items = computed(() =>
  ['note', 'hand'].flatMap((id) => game.foundItems.filter((e) => e.id === id)),
)
/** What he says, and which letter he puts his finger on: settled by the night. */
const line = computed(() => {
  const seed = game.mystery?.seed ?? 0
  return addressPlayer(PIKE_FORGERY[seed % PIKE_FORGERY.length], settings.address, {
    letter: PIKE_LETTERS[Math.floor(seed / PIKE_FORGERY.length) % PIKE_LETTERS.length],
    victim: game.pack.victim.shortName,
  })
})

function close() {
  sfx('click')
  game.handScene = false
}
</script>

<template>
  <Overlay :open="game.handScene && items.length === 2" title="Sergeant Pike" @close="close()">
    <div class="scene">
      <Portrait :who="PIKE" size="clamp(6rem, 24vw, 8rem)" />
      <div class="pair" aria-label="The note, and the letter in his own hand">
        <figure v-for="e in items" :key="e.id">
          <ItemArt :item="e.id" size="clamp(4rem, 18vw, 5.5rem)" />
          <figcaption class="small">{{ e.name }}</figcaption>
        </figure>
      </div>
      <DialogueBox class="box" speaker="Sergeant Pike" :voice="PIKE_VOICE" :text="line" />
    </div>
    <template #actions>
      <button class="primary" @click="close()">Well spotted, Sergeant</button>
    </template>
  </Overlay>
</template>

<style scoped>
.scene {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
.pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  width: 100%;
}
figure {
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  text-align: center;
}
figcaption {
  color: var(--muted);
  line-height: 1.3;
}
.box {
  width: 100%;
}
</style>

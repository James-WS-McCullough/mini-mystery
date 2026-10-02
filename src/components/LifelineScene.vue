<script setup lang="ts">
// A lifeline played out: Sergeant Pike, whistled up and sent to search a
// room; or a telephone call to an old friend who knows about these things.
// Nothing is spent until the choice is made — a room for Pike, a name for
// the expert — so either may be put off before then.
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { EXPERTS, PIKE_COMES, PIKE_GOES, expertFor } from '../content/lifelines'
import { addressPlayer } from '../engine/address'
import { roomName } from '../engine/render'
import type { CharId, RoomId } from '../engine/types'
import { useGame } from '../stores/game'
import { useUi } from '../stores/ui'
import { sfx } from '../ui/audio'
import { evidenceCard, noteCard } from '../ui/cards'
import { settings } from '../ui/settings'
import DialogueBox from './DialogueBox.vue'
import ManorMap from './ManorMap.vue'
import NoteCard, { type CardData } from './NoteCard.vue'
import Overlay from './Overlay.vue'
import Portrait from './Portrait.vue'

const game = useGame()
const ui = useUi()
const scene = computed(() => ui.lifelineScene)

type Step = 'arrive' | 'map' | 'sent' | 'ringing' | 'hello' | 'ask' | 'verdict' | 'bye' | 'gone'
const step = ref<Step>('arrive')

/** Which of a speaker's ways of saying it, settled by the night and the hour. */
const pickOf = <T,>(list: readonly T[]) => list[((game.mystery?.seed ?? 0) + game.round) % list.length]
const say = (text: string) => addressPlayer(text, settings.address)

// ---- Sergeant Pike ----
const sentTo = ref<RoomId | null>(null)
function sendPike(room: RoomId) {
  if (!scene.value) return
  // (Not a room he cannot get into.)
  if (!game.pikeRooms.includes(room)) {
    sfx('miss')
    return
  }
  sfx('select')
  game.useLifeline(scene.value.id, { room })
  sentTo.value = room
  step.value = 'sent'
}
const pikeLine = computed(() => {
  if (step.value === 'sent' && sentTo.value && game.ctx) {
    return say(pickOf(PIKE_GOES).replace('{room}', roomName(game.ctx, sentTo.value)))
  }
  return say(pickOf(PIKE_COMES))
})

// ---- the telephone ----
const expert = computed(() => (game.mystery ? expertFor(game.mystery.seed) : EXPERTS[0]))
const asked = ref<CharId | null>(null)
const verdict = ref<{ text: string; cards: CardData[]; cleared: boolean } | null>(null)
let ringing: ReturnType<typeof setTimeout> | undefined
function ring() {
  sfx('ring')
  ringing = setTimeout(pickUp, 3000)
}
function pickUp() {
  clearTimeout(ringing)
  if (step.value !== 'ringing') return
  sfx('pickup')
  step.value = 'hello'
}
function choose(char: CharId) {
  if (!scene.value || !game.mystery) return
  sfx('select')
  game.useLifeline(scene.value.id, { char })
  const r = game.lifelineReport
  // The call itself says what the report would: no second telling of it.
  game.lifelineReport = null
  if (r?.kind !== 'expert') return
  const name = game.mystery.cast[char].shortName
  asked.value = char
  verdict.value = {
    // "the Dowager" may begin a sentence.
    text: (r.pillar ? expert.value.cleared[r.pillar] : expert.value.none)
      .replaceAll('{name}', name)
      .replace(/(^|[.!?—]\s+)([a-z])/g, (_, lead: string, ch: string) => lead + ch.toUpperCase()),
    cleared: r.pillar !== null,
    cards: [
      ...game.notebook.filter((n) => r.noteIds.includes(n.id)).map((n) => noteCard(game, n)),
      ...game.foundItems.filter((i) => r.itemIds.includes(i.id)).map((i) => evidenceCard(game, i)),
    ],
  }
  step.value = 'verdict'
}
function hangUp() {
  sfx('hangup')
  step.value = 'gone'
}

/** What is said in the box, step by step. */
const line = computed(() => {
  switch (step.value) {
    case 'arrive':
    case 'sent':
      return pikeLine.value
    case 'hello':
      return expert.value.hello
    case 'ask':
      return expert.value.ask
    case 'verdict':
      return verdict.value?.text ?? ''
    case 'bye':
      return expert.value.goodbye
    default:
      return '. . .'
  }
})
const speaking = computed(() => !['ringing', 'gone', 'map'].includes(step.value))
const speaker = computed(() => (scene.value?.kind === 'pike' ? 'Sergeant Pike' : expert.value.name))

watch(
  scene,
  (s) => {
    clearTimeout(ringing)
    sentTo.value = null
    asked.value = null
    verdict.value = null
    if (!s) return
    if (s.kind === 'pike') {
      step.value = 'arrive'
      sfx('whistle')
    } else {
      step.value = 'ringing'
      ring()
    }
  },
  { immediate: true },
)
onBeforeUnmount(() => clearTimeout(ringing))

function close() {
  clearTimeout(ringing)
  // Put down before anyone answers, or before a name is given: nothing is spent.
  if (scene.value?.kind === 'expert' && ['hello', 'ask'].includes(step.value)) sfx('hangup')
  ui.lifelineScene = null
}
</script>

<template>
  <Overlay
    :open="!!scene"
    :title="scene?.kind === 'pike' ? (step === 'map' ? 'Where shall he search?' : 'Sergeant Pike') : 'The telephone'"
    :width="step === 'map' ? '72rem' : '34rem'"
    @close="close()"
  >
    <!-- The plan, as for any search: choose a room. -->
    <ManorMap v-if="step === 'map'" mode="pick" @pick="sendPike" />

    <div v-else class="scene" :class="scene?.kind">
      <div class="cameo" :class="{ blank: !speaking }">
        <Transition name="reveal" mode="out-in">
          <Portrait
            v-if="scene?.kind === 'pike'"
            key="pike"
            size="clamp(6rem, 24vw, 8rem)"
          />
          <Portrait
            v-else-if="speaking"
            key="expert"
            :who="expert.who"
            size="clamp(6rem, 24vw, 8rem)"
            :mood="'speaking'"
          />
          <Portrait v-else key="nobody" size="clamp(6rem, 24vw, 8rem)" dim />
        </Transition>
      </div>
      <DialogueBox
        :key="`${step}`"
        class="box"
        :speaker="speaking ? speaker : undefined"
        :text="line"
        :narration="!speaking"
        @click="step === 'ringing' ? pickUp() : undefined"
      />

      <!-- Whom the expert is to think about. -->
      <div v-if="step === 'ask'" class="guests">
        <button
          v-for="m in game.mystery?.cast ?? []"
          :key="m.id"
          class="guest"
          @click="choose(m.id)"
        >
          <Portrait :who="m.defId" shape="token" size="2.6rem" :dim="game.dead === m.id" />
          <span>{{ m.shortName }}</span>
        </button>
      </div>

      <!-- What of yours bears it out. -->
      <template v-if="step === 'verdict' && verdict?.cleared">
        <p v-if="verdict.cards.length" class="small muted bears">What you have that bears it out:</p>
        <p v-else class="small muted bears">Nothing you have found yet bears it out, but it is so.</p>
        <div v-if="verdict.cards.length" class="cards">
          <NoteCard v-for="c in verdict.cards" :key="c.id" :card="c" placed />
        </div>
      </template>
    </div>

    <template #actions>
      <!-- Pike -->
      <template v-if="step === 'arrive'">
        <button @click="close()">Not now</button>
        <button class="primary" :disabled="game.pikeRooms.length === 0" @click="sfx('click'), (step = 'map')">
          Send him to search a room
        </button>
      </template>
      <button v-else-if="step === 'map'" @click="step = 'arrive'">Back</button>
      <button v-else-if="step === 'sent'" class="primary" @click="close()">Thank you, Sergeant</button>

      <!-- The telephone -->
      <template v-else-if="step === 'ringing'">
        <button @click="close()">Put the receiver down</button>
      </template>
      <template v-else-if="step === 'hello'">
        <button @click="close()">Hang up</button>
        <button class="primary" @click="sfx('click'), (step = 'ask')">Yes, about one of them</button>
      </template>
      <button v-else-if="step === 'ask'" @click="close()">Hang up</button>
      <button v-else-if="step === 'verdict'" class="primary" @click="sfx('click'), (step = 'bye')">Thank you</button>
      <button v-else-if="step === 'bye'" class="primary" @click="hangUp()">Goodbye</button>
      <button v-else-if="step === 'gone'" class="primary" @click="close()">Put the receiver down</button>
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
.cameo {
  display: flex;
  justify-content: center;
  width: 100%;
  transition: filter 0.6s ease, opacity 0.6s ease;
}
.cameo.blank {
  filter: brightness(0.25) grayscale(1);
}
.box {
  width: 100%;
}
.guests {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr));
  gap: 0.45rem;
  width: 100%;
}
.guest {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 0.5rem 0.3rem;
  font-size: 0.85rem;
  line-height: 1.2;
  text-align: center;
}
.bears {
  margin: 0;
  align-self: flex-start;
}
.cards {
  display: grid;
  gap: 0.5rem;
  width: 100%;
}
.reveal-enter-active,
.reveal-leave-active {
  transition: opacity 0.5s ease, filter 0.5s ease;
}
.reveal-enter-from,
.reveal-leave-to {
  opacity: 0;
  filter: brightness(0);
}
</style>

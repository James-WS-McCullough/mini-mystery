<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useGame } from '../stores/game'
import { useUi } from '../stores/ui'
import { inRoom } from '../engine/render'
import { chime, holdMusic, piano, sfx } from '../ui/audio'
import { useKeys } from '../ui/keys'
import ClockFace from './ClockFace.vue'
import DialogueBox from './DialogueBox.vue'
import Portrait from './Portrait.vue'

const game = useGame()
const ui = useUi()
let timer: ReturnType<typeof setTimeout> | undefined

const hour = computed(() => (game.transitionToMidnight ? 12 : 8 + game.round))

/** What the hour brought with it: somebody found dead as it struck. */
const found = computed(() => {
  const k = game.killing
  if (!k?.fresh || !game.mystery || !game.ctx) return null
  return {
    who: game.mystery.cast[k.victim],
    where: inRoom(game.ctx, k.room),
    words: k.lastWords,
  }
})

/**
 * On the hour of the second killing the screen opens on the victim, alone,
 * as somebody comes in — then the clock strikes, and they are found.
 */
const scene = ref<'card' | 'words' | 'hour'>('hour')
/** The first hour opens on the case's title, not the clock. */
const opening = computed(() => game.round === 0 && !game.transitionToMidnight)
const spoken = ref(false)

function strike() {
  scene.value = 'hour'
  chime()
  if (opening.value) {
    // The clock strikes; the music comes back under it.
    setTimeout(() => holdMusic(false), 2200)
    timer = setTimeout(() => game.finishTransition(), 4200)
  }
  if (found.value) setTimeout(() => sfx('reveal'), 900)
}
/** The line is out; a moment, and then the blow. */
function said() {
  spoken.value = true
  timer = setTimeout(() => fall(), 1600)
}
function fall() {
  if (scene.value !== 'words') return
  clearTimeout(timer)
  sfx('stamp')
  timer = setTimeout(() => strike(), 700)
}
function onward() {
  if (scene.value === 'card') {
    clearTimeout(timer)
    strike()
    return
  }
  if (scene.value === 'words') {
    // A click finishes the line, or hurries the blow.
    if (spoken.value) fall()
    return
  }
  game.finishTransition()
}

onMounted(() => {
  if (found.value) {
    scene.value = 'words'
    return
  }
  if (opening.value) {
    scene.value = 'card'
    // The music steps back for the title and the piano, until the clock has struck.
    holdMusic(true)
    piano()
    // Long enough for the title to be read and the piano to fade; a click moves on sooner.
    timer = setTimeout(() => strike(), 6500)
    return
  }
  strike()
  // Long enough to read the hour; a click or a key moves on sooner.
  timer = setTimeout(() => game.finishTransition(), 4200)
})
onBeforeUnmount(() => {
  clearTimeout(timer)
  holdMusic(false)
})

useKeys((key) => {
  if (ui.anyOpen) return false
  if (key !== ' ' && key !== 'Enter') return false
  onward()
  return true
})
</script>

<template>
  <div class="transition" :class="{ dark: scene === 'words' || scene === 'card' }" @click="onward()">
    <div v-if="scene === 'card'" class="card">
      <p class="deco card-deco"><span /></p>
      <h1 class="case-title">{{ game.caseTitle }}</h1>
      <p class="deco card-deco"><span /></p>
      <p class="case-no">Case №{{ game.mystery?.seed }} · {{ game.pack.title }}</p>
    </div>
    <div v-else-if="found && scene === 'words'" class="alone">
      <p class="small muted where">{{ found.where[0].toUpperCase() + found.where.slice(1) }}, a little before ten. A door opens.</p>
      <Portrait :who="found.who.defId" size="clamp(7rem, 22vw, 10rem)" mood="speaking" />
      <DialogueBox :speaker="found.who.shortName" :who="found.who.defId" :text="found.words" fresh @done="said()" />
    </div>
    <div v-else class="chime" :class="{ midnight: game.transitionToMidnight }">
      <p class="deco"><span /></p>
      <div class="pendulum">
        <ClockFace :hour="hour" size="6.5rem" :midnight="game.transitionToMidnight" />
      </div>
      <h1>{{ game.transitionHeading }}</h1>
      <p class="deco"><span /></p>
      <div v-if="found" class="found" role="status">
        <Portrait :who="found.who.defId" size="5.5rem" mood="slump" dim />
        <p class="news">
          <strong>{{ found.who.name }}</strong> has been found dead {{ found.where }}.
        </p>
        <p class="small muted">
          Whatever they knew and had not told you is lost. The room may be searched again.
        </p>
        <p class="small go">click to go on</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.transition {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at center, rgba(20, 25, 32, 0.4) 0%, rgba(4, 5, 7, 0.88) 75%);
  cursor: pointer;
}
.chime {
  text-align: center;
  max-width: 36rem;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.7rem;
}
h1 {
  font-size: clamp(2.4rem, 8vw, 4rem);
  letter-spacing: 0.4rem;
  color: var(--brass);
  margin: 0;
  text-transform: uppercase;
  animation: strike 1.4s ease-out both;
  text-shadow: 0 0 30px rgba(212, 175, 74, 0.4);
}
.midnight h1 {
  color: var(--danger);
  text-shadow: 0 0 30px rgba(192, 71, 60, 0.5);
}
.pendulum {
  filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.7));
}
.deco {
  animation: appear 1s ease-out 0.3s both;
}
@keyframes strike {
  from {
    opacity: 0;
    letter-spacing: 1.1rem;
    filter: blur(3px);
  }
  to {
    opacity: 1;
    letter-spacing: 0.4rem;
    filter: blur(0);
  }
}
.found {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.6rem;
  animation: appear 1s ease-out 1.1s both;
}
.found p {
  margin: 0;
}
.news {
  font-size: 1.25rem;
  color: #f0b0a8;
}
.go {
  margin-top: 0.6rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--brass);
}
.transition.dark {
  background: rgba(2, 3, 4, 0.94);
}
.alone {
  width: min(40rem, 100%);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  animation: appear 1.2s ease-out both;
}
.alone .where {
  margin: 0;
  font-style: italic;
  letter-spacing: 0.04em;
}
.alone :deep(.dialogue) {
  width: 100%;
}
.transition.dark {
  cursor: pointer;
}
.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.9rem;
  padding: 2rem 1.5rem;
  max-width: 46rem;
  text-align: center;
}
.case-title {
  margin: 0;
  font-family: var(--font-logo);
  font-weight: normal;
  font-size: clamp(2.2rem, 7vw, 4.6rem);
  line-height: 1.1;
  letter-spacing: 0.06em;
  color: var(--brass);
  text-shadow: 0 0 40px rgba(212, 175, 74, 0.45);
  text-wrap: balance;
  animation: unveil 2.6s cubic-bezier(0.2, 0.7, 0.2, 1) both;
}
.card-deco {
  animation: appear 1.6s ease-out 0.8s both;
}
.case-no {
  margin: 0.4rem 0 0;
  font-family: var(--font-display);
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-size: 0.85rem;
  color: var(--muted);
  animation: appear 1.4s ease-out 1.8s both;
}
/* The lines must not rewrap as it comes in: only light and scale move, never the spacing. */
@keyframes unveil {
  0% {
    opacity: 0;
    filter: blur(6px);
    transform: translateY(6px) scale(0.96);
  }
  100% {
    opacity: 1;
    filter: blur(0);
    transform: none;
  }
}
</style>

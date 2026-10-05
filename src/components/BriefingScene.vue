<script setup lang="ts">
// What comes before a campaign case's file: a word in the office from
// Sergeant Pike (or the Chief Inspector), a line at a time over a darkened
// room; or a note in the Chief's hand, read before the file is opened. A
// click moves it on; Skip goes straight to the file.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { BriefingLine } from '../campaign'
import { PIKE, PIKE_VOICE } from '../content/lifelines'
import { yard1928 } from '../content/yard1928'
import { addressPlayer } from '../engine/address'
import { fillIntro } from '../engine/render'
import { useGame } from '../stores/game'
import { useUi } from '../stores/ui'
import { sfx } from '../ui/audio'
import { settings } from '../ui/settings'
import DialogueBox from './DialogueBox.vue'
import Portrait from './Portrait.vue'

const ui = useUi()
const game = useGame()
/** The night's slots ({victim}, {scene}…) and the form of address, filled. */
const say = (text: string) => addressPlayer(game.ctx ? fillIntro(game.ctx, text) : text, settings.address)
const CRADDOCK_VOICE = yard1928.characters.find((c) => c.id === 'craddock')?.voice

const briefing = computed(() => ui.briefing)
const office = computed(() => (briefing.value?.kind === 'office' ? briefing.value : null))
const note = computed(() => (briefing.value?.kind === 'note' ? briefing.value : null))

const at = ref(0)
watch(briefing, () => (at.value = 0))
const lines = computed<BriefingLine[]>(() =>
  office.value ? office.value.lines.map((l) => (typeof l === 'string' ? { text: l } : l)) : [],
)
const current = computed(() => lines.value[at.value])
const line = computed(() => (current.value ? say(current.value.text) : ''))
const last = computed(() => at.value >= lines.value.length - 1)
const box = ref<InstanceType<typeof DialogueBox> | null>(null)

/** Who has the line: the sergeant, the Chief, one of the setting's own people, or a voice with no face. */
const speaker = computed(() => {
  const who = current.value?.who ?? office.value?.speaker ?? 'pike'
  if (who === 'craddock') return { who, name: current.value?.as ?? 'Chief Inspector Craddock', voice: CRADDOCK_VOICE, faceless: false }
  if (who === 'pike') return { who: PIKE, name: current.value?.as ?? 'Sergeant Pike', voice: PIKE_VOICE, faceless: false }
  const own = game.ctx?.pack.characters.find((c) => c.id === who)
  if (own) return { who: own.id, name: current.value?.as ?? own.shortName, voice: own.voice, faceless: false }
  return { who: undefined, name: current.value?.as ?? 'A voice', voice: undefined, faceless: true }
})

/** A click hurries the line; once it is out, the next; after the last, on to the file. */
function next() {
  if (!office.value) return
  if (box.value && !box.value.done) {
    box.value.tap()
    return
  }
  if (!last.value) {
    sfx('click')
    at.value++
    return
  }
  done()
}
/** Straight to the file. */
function done() {
  sfx('select')
  ui.briefing = null
}

// While it is on, the keys are its: Space and Enter move it on, Escape skips it.
function keys(e: KeyboardEvent) {
  if (!briefing.value || e.metaKey || e.ctrlKey || e.altKey) return
  e.stopPropagation()
  e.preventDefault()
  if (e.key === 'Escape') done()
  else if (e.key === ' ' || e.key === 'Enter') (office.value ? next : done)()
}
onMounted(() => document.addEventListener('keydown', keys, true))
onBeforeUnmount(() => document.removeEventListener('keydown', keys, true))
</script>

<template>
  <Teleport to="body">
    <Transition name="pike">
      <div
        v-if="briefing && !ui.building"
        class="briefing"
        role="dialog"
        aria-modal="true"
        :aria-label="office ? speaker.name : 'A note from the Chief Inspector'"
        @click="office ? next() : done()"
      >
        <!-- The room, in the dark, and the one speaking alone in it: as the night's other scenes are played. -->
        <div v-if="office" class="alone" @click.stop>
          <p class="small muted where">{{ office.where }}</p>
          <Portrait
            :key="speaker.who ?? 'voice'"
            :who="speaker.who"
            size="clamp(7rem, 22vw, 10rem)"
            :mood="box?.done ? 'idle' : 'speaking'"
            :class="{ shadow: speaker.faceless }"
            @click="next()"
          />
          <DialogueBox
            ref="box"
            :key="`${at}`"
            :speaker="speaker.name"
            :text="line"
            :more="!last"
            :voice="speaker.voice"
            hush
            @advance="next()"
          />
          <div class="actions">
            <button class="ghost small" @click="done()">Skip</button>
            <span v-if="lines.length > 1" class="small muted">{{ at + 1 }} of {{ lines.length }}</span>
            <button class="primary" @click="next()">{{ last ? (office.done ?? 'To the case file') : 'Next' }}</button>
          </div>
        </div>

        <div v-else-if="note" class="post" @click.stop>
          <!-- (The paper's rough edge: noise, pushed into the sheet's outline.) -->
          <svg class="defs" width="0" height="0" aria-hidden="true">
            <filter id="letter-deckle" x="-4%" y="-4%" width="108%" height="108%">
              <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="11" result="grain" />
              <feDisplacementMap in="SourceGraphic" in2="grain" scale="7" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </svg>
          <aside class="letter">
            <p class="hand">{{ say(note.text) }}</p>
            <p class="sign">{{ note.signed }}</p>
          </aside>
          <div class="actions">
            <button class="primary" @click="done()">Open the case file</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Played against the night's weather, before the file is opened: the dark gathered to the middle, the weather at the edges. */
.briefing {
  position: fixed;
  inset: 0;
  z-index: 31;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: radial-gradient(ellipse 70% 60% at 50% 50%, rgba(2, 3, 4, 0.82), rgba(2, 3, 4, 0.35) 100%);
  cursor: pointer;
}
.alone {
  width: min(40rem, 100%);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  cursor: default;
  animation: appear 1.2s ease-out both;
}
/* A voice with no face: a shadow, no more. */
.shadow {
  filter: brightness(0.3) grayscale(1);
}
.alone .where {
  margin: 0;
  font-style: italic;
  letter-spacing: 0.04em;
  text-align: center;
}
.alone :deep(.dialogue) {
  width: 100%;
}
.actions {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.8rem;
}
.actions .ghost {
  margin-right: auto;
}
/* The Chief's note: a sheet of his paper, in his hand, and the way on beneath it. */
.post {
  width: min(100%, 26rem);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
  cursor: default;
}
.defs {
  position: absolute;
}
.letter {
  position: relative;
  isolation: isolate;
  width: 100%;
  padding: 1.6rem 1.8rem 1.3rem;
  color: #1f2a4a;
  transform: rotate(-1deg);
  cursor: default;
  animation: appear 1.2s ease-out both;
  filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.55));
}
/* The sheet itself, under the writing: laid paper, foxed at the corners, creased once across, its edge torn rather than cut. */
.letter::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    linear-gradient(180deg, transparent 49.7%, rgba(60, 40, 10, 0.07) 50%, transparent 50.3%),
    repeating-linear-gradient(0deg, rgba(70, 50, 20, 0.035) 0 1px, transparent 1px 4px),
    radial-gradient(ellipse at 12% 8%, rgba(130, 95, 40, 0.16), transparent 50%),
    radial-gradient(ellipse at 90% 94%, rgba(130, 95, 40, 0.18), transparent 48%),
    radial-gradient(ellipse at 70% 30%, rgba(255, 252, 240, 0.5), transparent 60%),
    #f4ecd0;
  box-shadow: inset 0 0 38px rgba(110, 80, 30, 0.22);
  filter: url(#letter-deckle);
}
.hand {
  margin: 0;
  font-family: var(--font-hand);
  font-size: 1.35rem;
  line-height: 1.4;
  white-space: pre-line;
}
.sign {
  margin: 0.6rem 0 0;
  text-align: right;
  font-family: var(--font-signature);
  font-size: 0.9rem;
}
.post .actions {
  justify-content: center;
  animation: appear 1.2s ease-out both;
}
@keyframes appear {
  from {
    opacity: 0;
    transform: translateY(0.6rem);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
/* It comes up and goes like the night's other scenes. */
.pike-enter-active,
.pike-leave-active {
  transition: opacity 0.35s ease;
}
.pike-enter-from,
.pike-leave-to {
  opacity: 0;
}
</style>

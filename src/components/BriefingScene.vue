<script setup lang="ts">
// What comes before a campaign case's file: a word in the office from
// Sergeant Pike (or the Chief Inspector), a line at a time over a darkened
// room; or a note in the Chief's hand, read before the file is opened. A
// click moves it on; Skip goes straight to the file.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { PIKE, PIKE_VOICE } from '../content/lifelines'
import { addressPlayer } from '../engine/address'
import { useUi } from '../stores/ui'
import { sfx } from '../ui/audio'
import { settings } from '../ui/settings'
import DialogueBox from './DialogueBox.vue'
import Portrait from './Portrait.vue'

const ui = useUi()
const say = (text: string) => addressPlayer(text, settings.address)

const briefing = computed(() => ui.briefing)
const office = computed(() => (briefing.value?.kind === 'office' ? briefing.value : null))
const note = computed(() => (briefing.value?.kind === 'note' ? briefing.value : null))

const at = ref(0)
watch(briefing, () => (at.value = 0))
const lines = computed(() => (office.value ? office.value.lines.map(say) : []))
const line = computed(() => lines.value[at.value] ?? '')
const last = computed(() => at.value >= lines.value.length - 1)
const box = ref<InstanceType<typeof DialogueBox> | null>(null)

const speaker = computed(() =>
  office.value?.speaker === 'craddock'
    ? { who: 'craddock', name: 'Chief Inspector Craddock', voice: undefined }
    : { who: PIKE, name: 'Sergeant Pike', voice: PIKE_VOICE },
)

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
      <div v-if="briefing" class="briefing" role="dialog" aria-modal="true" :aria-label="office ? speaker.name : 'A note from the Chief Inspector'">
        <!-- The room, in the dark; a click anywhere moves the word on. -->
        <div class="room" @click="office ? next() : done()" />

        <template v-if="office">
          <p class="where brass">{{ office.where }}</p>
          <aside class="pike frame">
            <Portrait :who="speaker.who" size="clamp(4.2rem, 16vw, 6rem)" :mood="box?.done ? 'idle' : 'speaking'" class="cameo" />
            <div class="words">
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
                <button class="primary" @click="next()">{{ last ? 'To the case file' : 'Next' }}</button>
              </div>
            </div>
          </aside>
        </template>

        <aside v-else-if="note" class="letter">
          <p class="hand">{{ say(note.text) }}</p>
          <p class="sign">{{ note.signed }}</p>
          <div class="actions">
            <button class="primary" @click="done()">Open the case file</button>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.briefing {
  position: fixed;
  inset: 0;
  z-index: 31;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding: 0 1rem calc(2.4rem + env(safe-area-inset-bottom, 0px));
  pointer-events: none;
}
/* The office, in the dark: a lamp's worth of light low in the room, and nothing else to press. */
.room {
  position: absolute;
  inset: 0;
  pointer-events: auto;
  background:
    radial-gradient(ellipse 60% 45% at 50% 80%, rgba(212, 175, 74, 0.1), transparent 70%),
    rgba(6, 8, 12, 0.985);
}
.where {
  position: relative;
  margin: 0 0 auto;
  padding-top: calc(2.2rem + env(safe-area-inset-top, 0px));
  font-family: var(--font-display);
  letter-spacing: 0.3em;
  text-transform: uppercase;
  font-size: 0.8rem;
  text-align: center;
}
.pike {
  position: relative;
  pointer-events: auto;
  width: min(100%, 44rem);
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 1rem;
  background: rgba(14, 18, 23, 0.96);
}
.cameo {
  flex: none;
}
.words {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.8rem;
}
.actions .ghost {
  margin-right: auto;
}
/* The Chief's note: a sheet of his paper, in his hand. */
.letter {
  position: relative;
  pointer-events: auto;
  margin: auto;
  width: min(100%, 26rem);
  padding: 1.4rem 1.6rem 1rem;
  background: #f6efd3;
  color: #1f2a4a;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.5);
  transform: rotate(-1deg);
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
.letter .actions {
  margin-top: 1rem;
}
/* It comes up and goes like the sergeant's lessons. */
.pike-enter-active,
.pike-leave-active {
  transition: opacity 0.35s ease;
}
.pike-enter-from,
.pike-leave-to {
  opacity: 0;
}
@media (max-width: 520px) {
  .pike {
    flex-direction: column;
    align-items: center;
  }
}
</style>

<script setup lang="ts">
// Sergeant Pike's lessons, played over the page: what he has to say, a line
// at a time, with the page held still under him and whatever he points at
// aglow; and after he has spoken, a word kept at the foot on what he asked
// for, until it is done.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { PIKE, PIKE_VOICE } from '../content/lifelines'
import { addressPlayer } from '../engine/address'
import { useGame } from '../stores/game'
import { useUi } from '../stores/ui'
import { sfx } from '../ui/audio'
import { settings } from '../ui/settings'
import DialogueBox from './DialogueBox.vue'
import Portrait from './Portrait.vue'
import RoleText from './RoleText.vue'

const game = useGame()
const ui = useUi()

const say = (text: string) => addressPlayer(text, settings.address)

/** The step due; and, once its beat has passed and the page has settled, the one on show. */
const step = computed(() => game.tutorSpeaking)
const shown = ref<string | null>(null)
const at = ref(0)
let beat: ReturnType<typeof setTimeout> | undefined
watch(step, () => {
  shown.value = null
  at.value = 0
})
// He never talks over anybody: the beat before he speaks begins only once no
// line is being typed out and nothing is open over the page, and starts again
// should somebody begin speaking in the meantime.
const clear = computed(() => !!step.value && !ui.anyTyping && !ui.anyOpen)
watch(
  [step, clear],
  ([s, ok]) => {
    clearTimeout(beat)
    if (!s || !ok || shown.value === s.id) return
    beat = setTimeout(() => {
      shown.value = s.id
      sfx('page')
    }, s.delay ?? 600)
  },
  { immediate: true },
)
onBeforeUnmount(() => clearTimeout(beat))

const speaking = computed(() => !!step.value && shown.value === step.value.id && !ui.anyOpen)
const lines = computed(() => (step.value ? game.tutorLines(step.value).map(say) : []))
const line = computed(() => lines.value[at.value] ?? '')
const last = computed(() => at.value >= lines.value.length - 1)
const box = ref<InstanceType<typeof DialogueBox> | null>(null)

/** A click hurries the line; once it is out, the next; after the last, he has been heard. */
function next() {
  if (!step.value) return
  if (box.value && !box.value.done) {
    box.value.tap()
    return
  }
  if (!last.value) {
    sfx('click')
    at.value++
    return
  }
  sfx('select')
  game.tutorHeard(step.value.id)
}

/** What he asked for, kept at the foot while the detective sees to it. */
const task = computed(() =>
  game.tutorTask && !ui.anyOpen && !game.notebookOpen ? say(game.tutorTask.text) : null,
)

// While he speaks the keys are his: Space and Enter move him on, and nothing else gets through.
function keys(e: KeyboardEvent) {
  if (!speaking.value || e.metaKey || e.ctrlKey || e.altKey) return
  e.stopPropagation()
  e.preventDefault()
  if (e.key === ' ' || e.key === 'Enter') next()
}
onMounted(() => document.addEventListener('keydown', keys, true))
onBeforeUnmount(() => document.removeEventListener('keydown', keys, true))
</script>

<template>
  <Teleport to="body">
    <Transition name="pike">
      <div v-if="speaking" class="lesson">
        <!-- The page is held still under him; a click anywhere moves him on. -->
        <div class="hold" @click="next()" />
        <aside class="pike frame" role="dialog" aria-modal="true" aria-label="Sergeant Pike">
          <Portrait :who="PIKE" size="clamp(4.2rem, 16vw, 6rem)" :mood="box?.done ? 'idle' : 'speaking'" class="cameo" />
          <div class="words">
            <DialogueBox
              ref="box"
              :key="`${step?.id}-${at}`"
              speaker="Sergeant Pike"
              :text="line"
              :more="!last"
              :voice="PIKE_VOICE"
              hush
              @advance="next()"
            />
            <div class="actions">
              <span v-if="lines.length > 1" class="small muted">{{ at + 1 }} of {{ lines.length }}</span>
              <button class="primary" data-coach-ok @click="next()">{{ last ? 'Understood' : 'Next' }}</button>
            </div>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
  <Teleport to="#lesson-bar" defer>
    <aside v-if="task && !speaking" class="task" role="note">
      <Portrait :who="PIKE" shape="token" size="2.2rem" />
      <p><strong class="brass">Sergeant Pike:</strong> <RoleText :text="task" /></p>
    </aside>
  </Teleport>
</template>

<style scoped>
.lesson {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  /* Clear of the action bar, whose buttons he may be pointing at. */
  padding: 0 1rem calc(4.8rem + env(safe-area-inset-bottom, 0px));
  pointer-events: none;
}
/* The page dims under him while he speaks, and nothing on it can be pressed. */
.hold {
  position: absolute;
  inset: 0;
  pointer-events: auto;
  cursor: pointer;
  background: rgba(4, 5, 7, 0.62);
  backdrop-filter: blur(1.5px);
}
.pike {
  position: relative;
  pointer-events: auto;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  width: min(42rem, 100%);
  padding: 1rem 1.1rem 0.9rem;
  border-left: 3px solid var(--brass);
}
.cameo {
  margin-top: 0.4rem;
}
.words {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.words :deep(.dialogue) {
  min-height: 6.5rem;
}
.actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.8rem;
}
.actions .primary {
  padding: 0.5rem 1.3rem;
  font-size: 0.92rem;
}
/* In the strip above the way onward (see #lesson-bar in App.vue). */
.task {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  max-width: 68rem;
  margin: 0 auto;
  padding: 0.45rem 0.9rem;
  border-left: 3px solid var(--brass);
  animation: rise 0.3s ease-out both;
}
.task p {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.45;
}
@media (max-width: 600px) {
  .pike {
    gap: 0.7rem;
    padding: 0.8rem 0.8rem 0.7rem;
  }
  .cameo {
    display: none;
  }
}
.pike-enter-active,
.pike-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.pike-enter-from,
.pike-leave-to {
  opacity: 0;
}
.pike-enter-from .pike,
.pike-leave-to .pike {
  transform: translateY(16px);
}
.pike-enter-active .pike,
.pike-leave-active .pike {
  transition: transform 0.3s ease;
}
</style>

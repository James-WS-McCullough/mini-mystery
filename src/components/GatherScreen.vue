<script setup lang="ts">
// The household gathers: each guest steps forward in turn and says their piece.
import { computed, ref } from 'vue'
import { useGame } from '../stores/game'
import { useUi } from '../stores/ui'
import { sfx } from '../ui/audio'
import { useKeys } from '../ui/keys'
import DialogueBox from './DialogueBox.vue'
import Portrait from './Portrait.vue'

const game = useGame()
const ui = useUi()
const cast = computed(() => game.mystery?.cast ?? [])
const statements = computed(() => game.openingStatements)

const index = ref(0)
const speaking = ref(false)
const allHeard = ref(false)
const box = ref<InstanceType<typeof DialogueBox> | null>(null)

const current = computed(() => statements.value[index.value])
const who = computed(() => (current.value ? cast.value[current.value.char] : null))
const isLast = computed(() => index.value >= statements.value.length - 1)

function next() {
  if (isLast.value) {
    allHeard.value = true
    sfx('page')
    return
  }
  sfx('click')
  index.value++
}
function hearAll() {
  sfx('page')
  allHeard.value = true
}
function begin() {
  sfx('select')
  game.startInvestigation()
}

useKeys((key) => {
  if (ui.anyOpen) return false
  if (key !== ' ' && key !== 'Enter') return false
  if (allHeard.value) begin()
  else box.value?.tap()
  return true
})
</script>

<template>
  <main v-if="game.mystery" class="gather">
    <h2 class="heading">The household gathers</h2>
    <p class="lede">
      Storm at the windows, a body upstairs, and seven guests in the hall — each with something to
      say before the questioning begins.
    </p>

    <!-- One at a time, in the order they are seated. -->
    <template v-if="!allHeard && who && current">
      <div class="row" aria-hidden="true">
        <Portrait
          v-for="(s, i) in statements"
          :key="s.char"
          :who="cast[s.char].defId"
          shape="token"
          size="2.6rem"
          :dim="i > index"
          :class="{ now: i === index }"
        />
      </div>

      <div class="floor">
        <Transition name="step" mode="out-in">
          <div :key="who.id" class="speaker">
            <Portrait :who="who.defId" size="clamp(7rem, 22vw, 11rem)" :mood="speaking ? 'speaking' : 'idle'" />
            <span class="small muted title">{{ who.title }}</span>
          </div>
        </Transition>
        <DialogueBox
          ref="box"
          class="box"
          :speaker="who.name"
          :text="current.text"
          more
          @typing="speaking = true"
          @done="speaking = false"
          @advance="next()"
        />
      </div>

      <div class="actions">
        <button class="ghost" @click="hearAll()">Hear them all at once</button>
        <button data-next @click="box?.done ? next() : box?.tap()">
          {{ isLast ? 'That is everyone' : 'Next' }} <kbd>space</kbd>
        </button>
      </div>
    </template>

    <!-- Everything said, set down for the record. -->
    <template v-else>
      <div class="statements">
        <div v-for="s in statements" :key="s.char" class="statement">
          <Portrait :who="cast[s.char].defId" shape="token" size="3rem" />
          <div>
            <strong class="brass">{{ cast[s.char].name }}</strong>
            <span class="small muted"> · {{ cast[s.char].title }}</span>
            <p class="quote">“{{ s.text }}”</p>
          </div>
        </div>
      </div>
      <button class="primary" data-next @click="begin()">Begin the investigation</button>
    </template>
  </main>
</template>

<style scoped>
.gather {
  max-width: 54rem;
  min-height: 100%;
  margin: 0 auto;
  padding: 2.2rem 1rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}
.row {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.row .portrait {
  transition: transform 0.25s ease;
}
.row .now {
  transform: scale(1.18);
}
.floor {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1.5rem;
  align-items: center;
  margin-top: 1rem;
}
@media (max-width: 640px) {
  .floor {
    grid-template-columns: 1fr;
    justify-items: center;
  }
  .box {
    width: 100%;
  }
}
.speaker {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}
.title {
  font-style: italic;
}
.step-enter-active,
.step-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.step-enter-from {
  opacity: 0;
  transform: translateX(-24px);
}
.step-leave-to {
  opacity: 0;
  transform: translateX(24px);
}
.actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
}
.statements {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.statement {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.8rem;
  align-items: start;
  padding: 0.7rem 0.9rem;
  border: 1px solid var(--line);
  background: rgba(20, 25, 32, 0.85);
  animation: rise 0.4s ease-out both;
}
.statement:nth-child(2) { animation-delay: 0.06s }
.statement:nth-child(3) { animation-delay: 0.12s }
.statement:nth-child(4) { animation-delay: 0.18s }
.statement:nth-child(5) { animation-delay: 0.24s }
.statement:nth-child(6) { animation-delay: 0.3s }
.statement:nth-child(7) { animation-delay: 0.36s }
.quote {
  margin: 0.25rem 0 0;
  line-height: 1.55;
}
.primary {
  align-self: center;
}
</style>

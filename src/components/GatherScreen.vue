<script setup lang="ts">
// The household gathers: each guest steps forward in turn, is introduced, and
// says their piece. One at a time — seven at once is a crowd.
import { computed, ref } from 'vue'
import { meansLabel, traitLabelOf } from '../engine/render'
import { useGame } from '../stores/game'
import { useUi } from '../stores/ui'
import { sfx } from '../ui/audio'
import { useKeys } from '../ui/keys'
import ActionBar from './ActionBar.vue'
import DialogueBox from './DialogueBox.vue'
import Icon from './Icon.vue'
import Portrait from './Portrait.vue'

const game = useGame()
const ui = useUi()
const cast = computed(() => game.mystery?.cast ?? [])
const statements = computed(() => game.openingStatements)

const index = ref(0)
/** The furthest guest yet heard: going back to one does not retype them. */
const heard = ref(-1)
const speaking = ref(false)
const box = ref<InstanceType<typeof DialogueBox> | null>(null)

const current = computed(() => statements.value[index.value])
const who = computed(() => (current.value ? cast.value[current.value.char] : null))
const isLast = computed(() => index.value >= statements.value.length - 1)

const blurb = computed(
  () => game.ctx?.pack.characters.find((c) => c.id === who.value?.defId)?.blurb ?? '',
)
const trait = computed(() =>
  who.value ? (game.ctx ? traitLabelOf(game.ctx, who.value) : who.value.trait) : '',
)
const means = computed(() =>
  (who.value?.means ?? []).map((id) => (game.ctx ? meansLabel(game.ctx, id) : id)),
)

function next() {
  heard.value = Math.max(heard.value, index.value)
  if (isLast.value) {
    sfx('select')
    game.startInvestigation()
    return
  }
  sfx('click')
  index.value++
}
function back() {
  if (index.value === 0) return
  heard.value = Math.max(heard.value, index.value)
  sfx('click')
  index.value--
}

useKeys((key) => {
  if (ui.anyOpen) return false
  if (key !== ' ' && key !== 'Enter') return false
  box.value?.tap()
  return true
})
</script>

<template>
  <main v-if="game.mystery && who && current" class="gather">
    <h2 class="heading">{{ game.place.people[0].toUpperCase() + game.place.people.slice(1) }} gathers</h2>
    <p class="lede">{{ game.place.gathering }}</p>

    <p class="count small muted" aria-live="polite">
      <span
        v-for="(s, i) in statements"
        :key="s.char"
        class="dot"
        :class="{ now: i === index, heard: i < index }"
      />
      <span class="sr-only">Guest {{ index + 1 }} of {{ statements.length }}</span>
    </p>

    <Transition name="step" mode="out-in">
      <div :key="who.id" class="floor">
        <section class="guest">
          <Portrait
            :who="who.defId"
            size="clamp(7rem, 22vw, 10rem)"
            :mood="speaking ? 'speaking' : 'idle'"
          />
          <div class="about">
            <h3 class="brass">{{ who.name }}</h3>
            <p class="small muted title">{{ who.title }}</p>
            <p v-if="blurb" class="blurb">{{ blurb }}</p>
            <ul class="known small">
              <li><Icon name="eye" /> {{ trait }}</li>
              <li v-for="line in means" :key="line"><Icon name="key" /> {{ line }}</li>
            </ul>
          </div>
        </section>

        <DialogueBox
          ref="box"
          class="box"
          :speaker="who.shortName"
          :who="who.defId"
          :text="current.text"
          :fresh="index > heard"
          more
          @typing="speaking = true"
          @done="speaking = false"
          @advance="next()"
        />
      </div>
    </Transition>

    <ActionBar>
      <template #aside>
        <button v-if="index > 0" class="ghost" @click="back()"><Icon name="back" /> Back</button>
        <span class="small muted">Guest {{ index + 1 }} of {{ statements.length }}</span>
      </template>
      <button class="primary" data-next @click="box?.done ? next() : box?.tap()">
        {{ isLast ? 'Begin the investigation' : 'Next' }} <kbd>space</kbd>
      </button>
    </ActionBar>
  </main>
</template>

<style scoped>
.gather {
  max-width: 50rem;
  min-height: 100%;
  margin: 0 auto;
  padding: 2.2rem 1rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}
.count {
  margin: 0;
  display: flex;
  justify-content: center;
  gap: 0.45rem;
}
.dot {
  width: 0.55rem;
  height: 0.55rem;
  transform: rotate(45deg);
  border: 1px solid var(--brass-dim);
  transition:
    background 0.25s,
    transform 0.25s;
}
.dot.heard {
  background: var(--brass-dim);
}
.dot.now {
  background: var(--brass);
  border-color: var(--brass);
  transform: rotate(45deg) scale(1.3);
}
.floor {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}
.guest {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1.4rem;
  align-items: center;
  padding: 1.1rem 1.3rem;
  border: 1px solid var(--line);
  background: linear-gradient(180deg, rgba(31, 38, 47, 0.9), rgba(18, 23, 29, 0.9));
  box-shadow: var(--shadow);
}
@media (max-width: 600px) {
  .guest {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }
}
.about h3 {
  margin: 0;
  font-size: 1.5rem;
  letter-spacing: 0.06em;
}
.about p {
  margin: 0;
}
.title {
  font-style: italic;
}
.blurb {
  margin-top: 0.5rem !important;
  line-height: 1.5;
}
.known {
  list-style: none;
  margin: 0.6rem 0 0;
  padding: 0.5rem 0 0;
  border-top: 1px solid var(--line);
  display: grid;
  gap: 0.15rem;
  text-align: left;
  opacity: 0.85;
}
.known .icon {
  color: var(--brass-dim);
  margin-right: 0.2rem;
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
</style>

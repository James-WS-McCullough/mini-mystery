<script setup lang="ts">
// The pause menu: sound, pace, and the way out.
import { computed, ref, watch } from 'vue'
import { useGame } from '../stores/game'
import { useUi } from '../stores/ui'
import { sfx } from '../ui/audio'
import { writeSave } from '../ui/save'
import { ADDRESS_CHOICES, settings, type TextSpeed } from '../ui/settings'
import Icon from './Icon.vue'
import Overlay from './Overlay.vue'

const game = useGame()
const ui = useUi()
const inCase = computed(() => game.phase !== 'title' && game.phase !== 'reveal')
const abandoning = ref(false)

watch(
  () => ui.menuOpen,
  () => (abandoning.value = false),
)

const SPEEDS: { id: TextSpeed; label: string }[] = [
  { id: 'slow', label: 'Unhurried' },
  { id: 'normal', label: 'Steady' },
  { id: 'fast', label: 'Brisk' },
  { id: 'instant', label: 'At once' },
]

/** The three things there are to hear, each its own switch. */
const HEARD: { id: 'music' | 'storm' | 'voices'; label: string; text: string }[] = [
  { id: 'music', label: 'Music', text: 'The background music' },
  { id: 'storm', label: 'Ambience', text: 'The weather outside' },
  { id: 'voices', label: 'Voices', text: 'The household’s voices, under their words' },
]

const KEYS: [string, string][] = [
  ['Space', 'hurry a line · move on'],
  ['1 – 7', 'choose a guest or a question'],
  ['N', 'notebook'],
  ['C', 'compare notes · back to the household'],
  ['M', 'the plan'],
  ['R', 'read back an interview'],
  ['Esc', 'back · this menu'],
]

function test() {
  sfx('select')
}
function leave() {
  // The night is already written down; it will be on the title screen.
  ui.closeAll()
  game.toTitle()
}
function abandon() {
  writeSave(null)
  ui.closeAll()
  game.toTitle()
}
</script>

<template>
  <Overlay :open="ui.menuOpen" :title="inCase ? 'Paused' : 'Settings'" @close="ui.menuOpen = false">
    <div class="rows">
      <label class="row">
        <span><Icon :name="settings.muted ? 'mute' : 'sound'" /> Sound</span>
        <span class="control">
          <input
            v-model.number="settings.volume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            :disabled="settings.muted"
            aria-label="Volume"
            @change="test()"
          />
          <button class="toggle" :class="{ on: settings.muted }" @click="settings.muted = !settings.muted">
            {{ settings.muted ? 'Muted' : 'Mute' }}
          </button>
        </span>
      </label>

      <div class="row">
        <span>Hear</span>
        <span class="control">
          <button
            v-for="h in HEARD"
            :key="h.id"
            class="toggle"
            :class="{ on: settings[h.id] }"
            :aria-pressed="settings[h.id]"
            :title="h.text"
            @click="settings[h.id] = !settings[h.id]"
          >
            <Icon :name="settings[h.id] ? 'check' : 'close'" /> {{ h.label }}
          </button>
        </span>
      </div>

      <div class="row">
        <span>How they speak</span>
        <span class="control speeds">
          <button
            v-for="s in SPEEDS"
            :key="s.id"
            class="toggle"
            :class="{ on: settings.textSpeed === s.id }"
            @click="settings.textSpeed = s.id"
          >
            {{ s.label }}
          </button>
        </span>
      </div>

      <div class="row">
        <span>What they call you</span>
        <span class="control speeds">
          <button
            v-for="a in ADDRESS_CHOICES"
            :key="a.id"
            class="toggle"
            :class="{ on: settings.address === a.id }"
            :title="a.text"
            @click="settings.address = a.id"
          >
            {{ a.label }}
          </button>
        </span>
      </div>

      <div class="row">
        <span>Reduce motion</span>
        <button
          class="toggle"
          :class="{ on: settings.reducedMotion }"
          @click="settings.reducedMotion = !settings.reducedMotion"
        >
          {{ settings.reducedMotion ? 'On' : 'Off' }}
        </button>
      </div>

      <div class="row">
        <span>Custom nights <span class="small muted">(experimental)</span></span>
        <button class="toggle" :class="{ on: settings.customNights }" @click="settings.customNights = !settings.customNights">
          {{ settings.customNights ? 'On' : 'Off' }}
        </button>
      </div>
    </div>

    <dl class="keys">
      <template v-for="[k, what] in KEYS" :key="k">
        <dt><kbd>{{ k }}</kbd></dt>
        <dd>{{ what }}</dd>
      </template>
    </dl>

    <p class="credits">
      Music: “Walking Along” and “Gloom Horizon” Kevin MacLeod (incompetech.com). Licensed under Creative Commons: By
      Attribution 4.0 License,
      <a href="http://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">
        creativecommons.org/licenses/by/4.0</a>.
      Rain, snow, sea, steam engine and bell: Zapsplat (zapsplat.com).
    </p>

    <template #actions>
      <template v-if="inCase">
        <template v-if="abandoning">
          <span class="small sure">Abandon case №{{ game.mystery?.seed }}? It cannot be resumed.</span>
          <button @click="abandoning = false">Keep it</button>
          <button class="danger" @click="abandon()">Abandon</button>
        </template>
        <template v-else>
          <button class="ghost" @click="abandoning = true">Abandon the case</button>
          <button @click="leave()">Save and leave</button>
          <button class="primary resume" @click="ui.menuOpen = false">Resume</button>
        </template>
      </template>
      <button v-else class="primary resume" @click="ui.menuOpen = false">Done</button>
    </template>
  </Overlay>
</template>

<style scoped>
.rows {
  display: grid;
  gap: 0.2rem;
}
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1rem;
  padding: 0.55rem 0;
  border-bottom: 1px solid var(--line);
}
.control {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
}
.toggle {
  padding: 0.3rem 0.75rem;
  font-size: 0.9rem;
  min-width: 3.6rem;
}
.toggle.on {
  border-color: var(--brass);
  color: var(--brass);
  background: rgba(77, 65, 22, 0.35);
}
input[type='range'] {
  accent-color: var(--brass);
  width: 9rem;
}
.keys {
  display: grid;
  grid-template-columns: auto 1fr auto 1fr;
  gap: 0.4rem 0.7rem;
  margin: 1rem 0 0;
  font-size: 0.88rem;
  color: var(--muted);
}
@media (max-width: 560px) {
  .keys {
    grid-template-columns: auto 1fr;
  }
}
.keys dd {
  margin: 0;
}
@media (pointer: coarse) {
  .keys {
    display: none;
  }
}
.credits {
  margin: 0.9rem 0 0;
  font-size: 0.78rem;
  line-height: 1.5;
  color: var(--muted);
}
.credits a {
  color: inherit;
}
.resume {
  padding: 0.5rem 1.3rem;
}
.sure {
  align-self: center;
  color: #f0b0a8;
  margin-right: auto;
}
</style>

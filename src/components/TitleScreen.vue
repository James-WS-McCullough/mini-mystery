<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGame, type ScriptId } from '../stores/game'
import { useUi } from '../stores/ui'
import { sfx } from '../ui/audio'
import { dailyResult, dailySeed, standing, todayIso } from '../ui/profile'
import { loadSave, writeSave } from '../ui/save'
import { ADDRESS_CHOICES, settings } from '../ui/settings'
import Icon from './Icon.vue'

const game = useGame()
const ui = useUi()
const seedInput = ref('')
const deck = ref<ScriptId>('classic')
const opening = ref(false)
const failed = ref(false)

const saved = ref(loadSave())
const today = todayIso()
const dailyDone = computed(() => dailyResult(today))

const SCRIPTS: { id: ScriptId; name: string; text: string }[] = [
  {
    id: 'classic',
    name: 'A Classic Evening',
    text: 'Two of the thief, the grudge and the loner walk among the guests.',
  },
  {
    id: 'foggy',
    name: 'The Foggy Night',
    text: 'The pool adds a guest who is sincerely, dangerously wrong.',
  },
]

/** Generating a case takes a moment; let the button answer first. */
function open(run: () => void) {
  if (opening.value) return
  opening.value = true
  failed.value = false
  sfx('select')
  setTimeout(() => {
    try {
      run()
    } catch {
      failed.value = true
    } finally {
      opening.value = false
    }
  }, 60)
}

function start() {
  const n = Number(seedInput.value)
  open(() => game.newGame(Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined, deck.value))
}
function startDaily() {
  open(() => game.newGame(dailySeed(today), 'classic', today))
}
function resume() {
  const save = saved.value
  if (!save) return
  open(() => {
    if (!game.restore(save)) {
      writeSave(null)
      saved.value = null
      failed.value = true
    }
  })
}
</script>

<template>
  <main class="title">
    <p class="deco"><span /></p>
    <h1>Mini<span class="dot">·</span>Mystery</h1>
    <p class="where">Blackwood Manor, 1926</p>
    <p class="blurb">
      Seven guests. One murderer among them, and everyone playing an angle. Search the rooms,
      question the household, catch the contradictions — and name the killer before midnight.
    </p>

    <div class="menu">
      <button v-if="saved" class="primary" :disabled="opening" @click="resume()">
        Continue case №{{ saved.seed }}
      </button>
      <button :class="saved ? 'second' : 'primary'" :disabled="opening" @click="start()">
        {{ opening ? 'Opening the file…' : 'Take a new case' }}
      </button>
      <button class="second" :disabled="opening" @click="startDaily()">
        <Icon name="calendar" /> The daily case
        <span v-if="dailyDone" class="done"><Icon name="check" /> filed</span>
      </button>
    </div>
    <p v-if="failed" class="small failed">That case file would not open. Try another.</p>

    <fieldset class="scripts">
      <legend class="sr-only">The kind of evening</legend>
      <label v-for="s in SCRIPTS" :key="s.id" class="script" :class="{ on: deck === s.id }">
        <input v-model="deck" type="radio" name="script" :value="s.id" class="sr-only" />
        <strong>{{ s.name }}</strong>
        <span class="small muted">{{ s.text }}</span>
      </label>
    </fieldset>

    <fieldset class="address">
      <legend class="small muted">How shall the household address you?</legend>
      <label v-for="a in ADDRESS_CHOICES" :key="a.id" class="form" :class="{ on: settings.address === a.id }">
        <input v-model="settings.address" type="radio" name="address" :value="a.id" class="sr-only" />
        <strong>{{ a.label }}</strong>
        <span class="small muted">{{ a.text }}</span>
      </label>
    </fieldset>

    <label class="seed">
      <input v-model="seedInput" inputmode="numeric" placeholder="case number (optional)" />
      <span class="small muted">The same case number deals the same mystery.</span>
    </label>

    <div class="foot">
      <button class="ghost" @click="ui.recordsOpen = true">
        <Icon name="trophy" /> {{ standing.rank }}
        <span class="muted">· {{ standing.solved }} solved</span>
      </button>
      <button class="ghost" @click="ui.menuOpen = true"><Icon name="gear" /> Settings</button>
    </div>
    <p class="deco"><span /></p>
  </main>
</template>

<style scoped>
.title {
  max-width: 38rem;
  min-height: 100%;
  margin: 0 auto;
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: safe center;
  gap: 0.9rem;
  text-align: center;
}
h1 {
  font-family: var(--font-logo);
  font-size: clamp(2.4rem, 9vw, 4.4rem);
  letter-spacing: 0.08em;
  line-height: 1;
  margin: 0.4rem 0 0;
  text-transform: uppercase;
  color: var(--brass);
  text-shadow:
    0 0 28px rgba(212, 175, 74, 0.35),
    0 3px 0 #3a300f;
  animation: rise 0.9s ease-out both;
}
.dot {
  margin: 0 0.12em;
  color: var(--danger);
}
.where {
  margin: 0;
  font-family: var(--font-display);
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: var(--muted);
}
.blurb {
  margin: 0.3rem 0 0.4rem;
  line-height: 1.55;
  color: var(--ink);
  opacity: 0.85;
  max-width: 32rem;
}
.menu {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  width: min(100%, 22rem);
}
.menu button {
  width: 100%;
}
.second {
  font-family: var(--font-display);
  text-transform: uppercase;
  letter-spacing: 0.16em;
  padding: 0.6rem 1rem;
  border-color: var(--brass-dim);
}
.done {
  color: var(--good);
  font-size: 0.8rem;
  margin-left: 0.3rem;
  letter-spacing: 0.06em;
}
.failed {
  margin: 0;
  color: #f0b0a8;
}
.scripts {
  border: 0;
  padding: 0;
  margin: 0.4rem 0 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  width: 100%;
}
@media (max-width: 520px) {
  .scripts {
    grid-template-columns: 1fr;
  }
}
.address {
  border: 0;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  width: 100%;
}
.address legend {
  padding: 0;
  margin: 0 auto 0.35rem;
}
@media (max-width: 520px) {
  .form .small {
    display: none;
  }
}
.script,
.form {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.6rem 0.8rem;
  border: 1px solid var(--line);
  background: rgba(14, 18, 23, 0.7);
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;
}
.script strong,
.form strong {
  font-family: var(--font-display);
  font-weight: normal;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.script:hover,
.form:hover {
  border-color: var(--brass-dim);
}
.script.on,
.form.on {
  border-color: var(--brass);
  background: rgba(77, 65, 22, 0.35);
}
.script.on strong,
.form.on strong {
  color: var(--brass);
}
.script:has(input:focus-visible),
.form:has(input:focus-visible) {
  outline: 2px solid var(--brass);
  outline-offset: 2px;
}
.seed {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: center;
}
.seed input {
  text-align: center;
  width: 15rem;
}
.foot {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}
</style>

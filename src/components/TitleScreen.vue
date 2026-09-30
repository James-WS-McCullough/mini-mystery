<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { DEFAULT_PACK, PACKS, PACK_IDS, type PackId } from '../content'
import { useGame, type ScriptId } from '../stores/game'
import { useUi } from '../stores/ui'
import { sfx } from '../ui/audio'
import { dailyResult, dailySeed, standing, todayIso } from '../ui/profile'
import { loadSave, writeSave } from '../ui/save'
import Icon, { type IconName } from './Icon.vue'

const game = useGame()
const ui = useUi()
const seedInput = ref('')
/** Two ticks make the evening: the Drunk may be about; the murderer may have an accomplice. */
const drunk = ref(false)
const helper = ref(false)
const deck = computed<ScriptId>(() =>
  drunk.value && helper.value ? 'both' : helper.value ? 'conspiracy' : drunk.value ? 'foggy' : 'classic',
)
/** Where: the manor, the village, the train, the ship. Chosen, its weather comes up behind the menu. */
const setting = ref<PackId>(game.packId)
watch(setting, (id) => (game.packId = id))
/** The menu, or the setting-up of a new case. */
const page = ref<'home' | 'setup'>('home')
const opening = ref(false)
const failed = ref(false)

const saved = ref(loadSave())
const today = todayIso()
const dailyDone = computed(() => dailyResult(today))

const TICKS = [
  {
    key: 'drunk',
    name: 'The Drunk may be about',
    text: 'One guest may be sincerely, dangerously wrong about what they are and what they know.',
  },
  {
    key: 'helper',
    name: 'The murderer may have an accomplice',
    text: 'A false alibi, forged evidence, a frame, a bought witness — one of seven, on some nights. And the murderer may kill again, or own to it at the last.',
  },
] as const

const SETTING_TEXT: Record<PackId, string> = {
  manor1920s: 'A country house cut off by the flood, and its master dead in one of the rooms.',
  village1926: 'A village shut in by the snow, and the Squire dead in one of its houses.',
  train1926: 'A night train stopped by snow on the line, and a financier dead in his compartment.',
  boat1926: 'A steam yacht hove to in a gale, and her owner dead below.',
}

const SETTING_ICON: Record<PackId, IconName> = {
  manor1920s: 'manor',
  village1926: 'village',
  train1926: 'locomotive',
  boat1926: 'yacht',
}

const SETTINGS = PACK_IDS.map((id) => ({ id, name: PACKS[id].title, text: SETTING_TEXT[id], icon: SETTING_ICON[id] }))

function setUp() {
  sfx('page')
  page.value = 'home' === page.value ? 'setup' : 'home'
}

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
  open(() =>
    game.newGame(Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined, deck.value, null, setting.value),
  )
}
function startDaily() {
  open(() => game.newGame(dailySeed(today), 'classic', today, DEFAULT_PACK))
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
  <main class="title" :class="page">
    <p class="deco"><span /></p>
    <h1>Mini<span class="dot">·</span>Mystery</h1>
    <p class="where">{{ PACKS[setting].title }}</p>

    <template v-if="page === 'home'">
      <p class="blurb">
        Seven guests. One murderer among them, and everyone playing an angle. Search the rooms,
        question the household, catch the contradictions — and name the killer before midnight.
      </p>

      <div class="menu">
        <button v-if="saved" class="primary" :disabled="opening" @click="resume()">
          Continue case №{{ saved.seed }}
        </button>
        <button :class="saved ? 'second' : 'primary'" :disabled="opening" @click="setUp()">
          Take a new case
        </button>
        <button class="second" :disabled="opening" @click="startDaily()">
          <Icon name="calendar" /> The daily case
          <span v-if="dailyDone" class="done"><Icon name="check" /> filed</span>
        </button>
      </div>
      <p v-if="failed" class="small failed">That case file would not open. Try another.</p>

      <div class="foot">
        <button class="ghost" @click="ui.recordsOpen = true">
          <Icon name="trophy" /> {{ standing.rank }}
          <span class="muted">· {{ standing.solved }} solved</span>
        </button>
        <button class="ghost" @click="ui.menuOpen = true"><Icon name="gear" /> Settings</button>
      </div>
    </template>

    <template v-else>
      <fieldset class="settings">
        <legend class="small muted">Where</legend>
        <label v-for="s in SETTINGS" :key="s.id" class="script setting" :class="{ on: setting === s.id }">
          <input v-model="setting" type="radio" name="setting" :value="s.id" class="sr-only" />
          <Icon :name="s.icon" class="mark" />
          <strong>{{ s.name }}</strong>
          <span class="small muted">{{ s.text }}</span>
        </label>
      </fieldset>

      <fieldset class="scripts">
        <legend class="small muted">A plain night — or tick what else the evening may hold. A secret passage runs on any night that is not plain.</legend>
        <label class="script tick" :class="{ on: drunk }">
          <input v-model="drunk" type="checkbox" class="sr-only" />
          <strong><Icon :name="drunk ? 'check' : 'glass'" /> {{ TICKS[0].name }}</strong>
          <span class="small muted">{{ TICKS[0].text }}</span>
        </label>
        <label class="script tick" :class="{ on: helper }">
          <input v-model="helper" type="checkbox" class="sr-only" />
          <strong><Icon :name="helper ? 'check' : 'mask'" /> {{ TICKS[1].name }}</strong>
          <span class="small muted">{{ TICKS[1].text }}</span>
        </label>
      </fieldset>

      <label class="seed">
        <input v-model="seedInput" inputmode="numeric" placeholder="case number (optional)" />
        <span class="small muted">The same case number deals the same mystery.</span>
      </label>

      <div class="menu">
        <button class="primary" :disabled="opening" @click="start()">
          {{ opening ? 'Opening the file…' : 'Begin' }}
        </button>
        <button class="ghost" :disabled="opening" @click="setUp()"><Icon name="back" /> Back</button>
      </div>
      <p v-if="failed" class="small failed">That case file would not open. Try another.</p>
    </template>
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
.settings {
  border: 0;
  padding: 0;
  margin: 0.4rem 0 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  width: 100%;
}
.settings legend {
  grid-column: 1 / -1;
  padding: 0;
  margin: 0 auto 0.35rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}
.setting {
  align-items: center;
  text-align: center;
}
.setting .mark {
  font-size: 2.8rem;
  color: var(--muted);
  margin: 0.1rem 0 0.2rem;
  transition: color 0.15s;
}
.setting.on .mark {
  color: var(--brass);
}
.scripts {
  border: 0;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  width: 100%;
}
.scripts legend {
  grid-column: 1 / -1;
  padding: 0;
  margin: 0 auto 0.35rem;
  text-align: center;
}
@media (max-width: 620px) {
  .settings {
    grid-template-columns: repeat(2, 1fr);
  }
  .scripts {
    grid-template-columns: 1fr;
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

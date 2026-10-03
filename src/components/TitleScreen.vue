<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { PACKS, PACK_IDS, type PackId } from '../content'
import { useGame } from '../stores/game'
import { useUi } from '../stores/ui'
import { sfx } from '../ui/audio'
import { dailyPack, dailyResult, dailySeed, eveningsSolved, ownEveningsOpen, standing, todayIso } from '../ui/profile'
import { MODES, type ModeId } from '../ui/modes'
import { loadSave, writeSave } from '../ui/save'
import { enterAt } from '../ui/scroll'
import { evenings, type SavedEvening } from '../ui/evenings'
import type { Script } from '../engine/deck'
import BackLink from './BackLink.vue'
import EveningBuilder from './EveningBuilder.vue'
import Icon, { type IconName } from './Icon.vue'

const game = useGame()
const ui = useUi()
const seedInput = ref('')
/** How hard: one of the four evenings, or one of the detective's own ("own:<id>"). */
const modeId = ref<ModeId | `own:${string}`>('simple')
const mode = computed(() => MODES.find((m) => m.id === modeId.value) ?? MODES[0])
/** The evening of the detective's own that is chosen, if one is. */
const own = computed(() => evenings.value.find((e) => modeId.value === `own:${e.id}`) ?? null)
/** One of the detective's own evenings, said short: how many sit down, and how many parts. */
function sizeOf(script: Script): string {
  const table = 1 + script.suspiciousCount + (script.innocentCount ?? 4)
  const parts = script.innocents.length + script.suspicious.length + script.accomplices.length
  const kinds = Object.values(script.nights ?? { plain: 1 }).filter((w) => (w ?? 0) > 0).length
  return `${table} at the table, ${parts} parts, ${kinds} kind${kinds === 1 ? '' : 's'} of night`
}

// ---------- writing an evening of one's own ----------

/** The evening being written: one already kept, or a new one begun from whatever is chosen. */
const editing = ref<SavedEvening | null>(null)
const writeFrom = computed<Script>(() => own.value?.script ?? mode.value.script)
function writeEvening(e: SavedEvening | null) {
  sfx('page')
  editing.value = e
  page.value = 'evening'
}
function written(id: string) {
  modeId.value = `own:${id}`
  page.value = 'setup'
}
function forgotten() {
  if (!own.value) modeId.value = 'simple'
  page.value = 'setup'
}
/**
 * A trial, kept off the menu for now: four guests, four questions an hour.
 * The game takes any count (see smallScript); set this to try it.
 */
const small = ref(false)
/** Where: the manor, the village, the train, the ship. Chosen, its weather comes up behind the menu. */
const setting = ref<PackId>(game.packId)
watch(setting, (id) => (game.packId = id))
/** The menu, or the setting-up of a new case. Kept in the ui store: the weather waits on it. */
const { titlePage: page } = storeToRefs(ui)
onMounted(() => (page.value = 'home'))
/** Each page of the menu starts at its top. */
const root = ref<HTMLElement | null>(null)
watch(page, () => void nextTick(() => root.value && enterAt(root.value)))
const opening = ref(false)
const failed = ref(false)

const saved = ref(loadSave())
const today = todayIso()
const dailyDone = computed(() => dailyResult(today))

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

/** Shown for a moment at least, however quickly the case is dealt. */
const BUILDING_MS = 900

/**
 * Dealing a case holds the page up, from a moment to a second or two: put
 * "Building your case" up first, let it be drawn, then deal.
 */
function open(run: () => void) {
  if (opening.value) return
  opening.value = true
  failed.value = false
  sfx('select')
  ui.building = true
  const shown = performance.now()
  requestAnimationFrame(() =>
    setTimeout(() => {
      try {
        run()
      } catch {
        failed.value = true
      } finally {
        opening.value = false
        setTimeout(() => (ui.building = false), Math.max(0, BUILDING_MS - (performance.now() - shown)))
      }
    }),
  )
}
function start() {
  const n = Number(seedInput.value)
  const given = Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined
  open(() => {
    // A case number given is that case or nothing; otherwise, should one case
    // not come together, another.
    for (let tries = 0; ; tries++) {
      try {
        return game.newGame(given, own.value?.script ?? mode.value.id, null, setting.value, undefined, small.value)
      } catch (e) {
        if (given !== undefined || tries >= 5) throw e
      }
    }
  })
}
function startDaily() {
  open(() => game.newGame(dailySeed(today), 'simple', today, dailyPack(today)))
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
  <EveningBuilder
    v-if="page === 'evening'"
    :editing="editing"
    :from="writeFrom"
    @back="page = 'setup'"
    @saved="written"
    @deleted="forgotten"
  />
  <main v-else ref="root" class="title" :class="page">
    <BackLink v-if="page === 'setup'" class="back-row" @back="!opening && setUp()" />
    <p class="deco"><span /></p>
    <h1>Mini<span class="dot">·</span>Mystery</h1>
    <p class="where">{{ page === 'home' ? 'A Golden-Age Whodunnit' : PACKS[setting].title }}</p>

    <template v-if="page === 'home'">
      <p class="blurb">
        Seven guests. One murderer among them, and everyone playing an angle. Search the rooms,
        question the household, catch the contradictions, and name the killer before midnight.
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

      <fieldset class="settings">
        <legend class="small muted">Difficulty</legend>
        <label v-for="m in MODES" :key="m.id" class="script setting" :class="{ on: modeId === m.id }">
          <input v-model="modeId" type="radio" name="mode" :value="m.id" class="sr-only" />
          <Icon :name="m.icon" class="mark" />
          <strong>{{ m.name }}</strong>
          <span class="small muted">{{ m.text }}</span>
        </label>
      </fieldset>

      <fieldset class="settings own">
        <legend class="small muted">Your own evenings</legend>
        <div v-if="!ownEveningsOpen" class="script setting locked">
          <Icon name="lock" class="mark" />
          <strong>Write an evening</strong>
          <span class="small muted">Solve a case on each of the four evenings first.</span>
          <span class="progress">
            <Icon
              v-for="m in MODES"
              :key="m.id"
              :name="m.icon"
              :class="{ done: eveningsSolved.includes(m.id) }"
              :title="`${m.name}: ${eveningsSolved.includes(m.id) ? 'solved' : 'not yet solved'}`"
            />
          </span>
        </div>
        <template v-else>
        <label v-for="e in evenings" :key="e.id" class="script setting" :class="{ on: modeId === `own:${e.id}` }">
          <input v-model="modeId" type="radio" name="mode" :value="`own:${e.id}`" class="sr-only" />
          <Icon name="list" class="mark" />
          <strong>{{ e.name }}</strong>
          <span class="small muted">{{ sizeOf(e.script) }}</span>
          <button class="ghost small edit" @click.prevent="writeEvening(e)"><Icon name="pen" /> Change</button>
        </label>
        <button class="script setting new" @click="writeEvening(null)">
          <Icon name="pen" class="mark" />
          <strong>Write an evening</strong>
          <span class="small muted">Choose the parts, the table and the kinds of night.</span>
        </button>
        </template>
      </fieldset>

      <label class="seed">
        <input v-model="seedInput" inputmode="numeric" placeholder="case number (optional)" />
        <span class="small muted">The same case number deals the same mystery.</span>
      </label>

      <div class="menu">
        <button class="primary" :disabled="opening" @click="start()">
          {{ opening ? 'Opening the file…' : 'Begin' }}
        </button>
      </div>
      <p v-if="failed" class="small failed">That case file would not open. Try another.</p>
    </template>
    <p class="deco"><span /></p>
  </main>
</template>

<style scoped>
/* At the very top of the page, the rest kept centred in the room below it. */
.title.setup > .back-row {
  margin-bottom: auto;
}
.title.setup > .deco:last-child {
  margin-bottom: auto;
}
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
/* (A button dressed as one of the cards, to begin a new evening.) */
button.script.new {
  font: inherit;
  color: inherit;
  box-shadow: none;
  border-style: dashed;
}
/* (Locked until a case is solved on each of the four: which have been, marked.) */
.script.locked {
  grid-column: 1 / -1;
  cursor: default;
  border-style: dashed;
}
.script.locked:hover {
  border-color: var(--line);
}
.progress {
  display: flex;
  justify-content: center;
  gap: 0.6rem;
  margin-top: 0.35rem;
  font-size: 1.3rem;
  color: var(--line);
}
.progress .done {
  color: var(--brass);
}
.edit {
  margin-top: 0.3rem;
  align-self: center;
  padding: 0.15rem 0.6rem;
  font-size: 0.8rem;
}
@media (max-width: 620px) {
  .settings {
    grid-template-columns: repeat(2, 1fr);
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

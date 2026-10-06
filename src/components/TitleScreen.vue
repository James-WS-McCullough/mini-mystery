<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { PACKS, PACK_IDS, type PackId } from '../content'
import { useGame } from '../stores/game'
import { useUi } from '../stores/ui'
import { sfx } from '../ui/audio'
import { campaignSolved, dailyPack, dailyResult, dailySeed, standing, todayIso } from '../ui/profile'
import { CAMPAIGN, HIDDEN_FROM, campaignCase, settingUnlock, type CampaignCase } from '../campaign'
import { MODES, type ModeId } from '../ui/modes'
import { loadSave, writeSave } from '../ui/save'
import { enterAt } from '../ui/scroll'
import { evenings, type SavedEvening } from '../ui/evenings'
import { settings } from '../ui/settings'
import type { Script } from '../engine/deck'
import BackLink from './BackLink.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import EveningBuilder from './EveningBuilder.vue'
import Icon, { type IconName } from './Icon.vue'
import { isStandalone } from '../ui/install'

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
// (Custom nights switched off: an evening of one's own is no longer there to be chosen.)
watch(
  () => settings.customNights,
  (on) => {
    if (!on && own.value) modeId.value = 'simple'
  },
)
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
/** The later settings open with their campaign case; until then they are on the page, but closed. */
const settingLocked = (id: PackId) => {
  const c = settingUnlock(id)
  return !settings.unlockAll && !!c && !campaignSolved(c.id)
}
// (A setting remembered from an earlier night may have been one the campaign opened on a different browser.)
if (settingLocked(setting.value)) setting.value = PACK_IDS[0]
/** The settings on offer; how many more there are is the campaign's secret. */
const openSettings = computed(() => SETTINGS.filter((s) => !settingLocked(s.id)))
const moreSettings = computed(() => SETTINGS.some((s) => settingLocked(s.id)))
/** The menu, or the setting-up of a new case. Kept in the ui store: the weather waits on it. */
const { titlePage: page } = storeToRefs(ui)
onMounted(() => (page.value = 'home'))
/** Each page of the menu starts at its top. */
const root = ref<HTMLElement | null>(null)
watch(page, () => void nextTick(() => root.value && enterAt(root.value)))
const opening = ref(false)
const failed = ref(false)

const saved = ref(loadSave())
/** The campaign case the saved night is, where it is one. */
const savedCase = computed(() => campaignCase(saved.value?.campaign))
/** Not yet on the home screen: the corner offers to put it there. */
const installable = !isStandalone()
const appIcon = `${import.meta.env.BASE_URL}icon.svg`
/** Where the saved night stands: the place and the hour. */
const HOURS = ['8 o’clock', '9 o’clock', '10 o’clock', '11 o’clock', 'midnight']
const savedStands = computed(() => {
  const s = saved.value
  if (!s) return ''
  const place = PACKS[s.pack ?? 'manor1920s'].place.placeShort
  // (The hour: eight, and one more for every hour struck.)
  const round = s.actions.filter((a) => a.t === 'strikeHour').length
  return `${place}, ${HOURS[Math.min(round, HOURS.length - 1)]}`
})
const today = todayIso()
const dailyDone = computed(() => dailyResult(today))

const SETTING_TEXT: Record<PackId, string> = {
  manor1920s: 'A country house cut off by the flood, and its master dead in one of the rooms.',
  village1926: 'A village shut in by the snow, and the Squire dead in one of its houses.',
  train1926: 'A night train stopped by snow on the line, and a financier dead in his compartment.',
  boat1926: 'A steam yacht hove to in a gale, and her owner dead below.',
  hotel1928: 'A seafront hotel out of season, the sea over the promenade, and a death among the residents.',
  college1927: 'An Oxford college in fog on Gaudy night, the gate locked, and a death among the fellows.',
  theatre1929: 'A West End theatre in the fog, the first night off, and a death in the company.',
  yard1928: 'Scotland Yard in rain and fog, the doors locked on its own people, and a death in the division.',
}

const SETTING_ICON: Record<PackId, IconName> = {
  manor1920s: 'manor',
  village1926: 'village',
  train1926: 'locomotive',
  boat1926: 'yacht',
  hotel1928: 'hotel',
  college1927: 'college',
  theatre1929: 'theatre',
  yard1928: 'yard',
}

const SETTINGS = PACK_IDS.map((id) => ({ id, name: PACKS[id].title, text: SETTING_TEXT[id], icon: SETTING_ICON[id] }))

function setUp() {
  sfx('page')
  page.value = 'home' === page.value ? 'setup' : 'home'
}
function home() {
  sfx('page')
  page.value = 'home'
}

// ---------- the campaign ----------

function toCampaign() {
  sfx('page')
  page.value = 'campaign'
}
/**
 * A case is played in its turn: the one before it must be solved first (or everything is open, for review).
 * Case 1 is open from the start: the lesson is recommended, not required.
 */
const caseLocked = (i: number) => !settings.unlockAll && i > 1 && !campaignSolved(CAMPAIGN[i - 1].id)
/** The cases on the page: the first six always, the rest only once opened. */
const shownCases = computed(() => CAMPAIGN.map((c, i) => ({ c, i })).filter(({ i }) => i < HIDDEN_FROM || !caseLocked(i)))
/** The next case still hidden, if any: a card that says so, and no more. */
const hiddenNext = computed(() => CAMPAIGN.map((c, i) => ({ c, i })).find(({ i }) => i >= HIDDEN_FROM && caseLocked(i)) ?? null)
/** The campaign's next case, if any is left unsolved. */
const nextCase = computed(() => CAMPAIGN.find((c) => !campaignSolved(c.id)) ?? null)
/**
 * What the front page puts first: a night to go back to; else the campaign,
 * for a detective new to it; else a new case.
 */
const foremost = computed(() => (saved.value ? 'continue' : nextCase.value ? 'campaign' : 'new'))
/** Case 1 asked for with the lesson unplayed: a word first, and the choice. */
const firstTime = ref<CampaignCase | null>(null)
function startCampaign(c: CampaignCase) {
  if (c.id === CAMPAIGN[1].id && !campaignSolved(CAMPAIGN[0].id) && !settings.unlockAll) {
    sfx('page')
    firstTime.value = c
    return
  }
  begin(() => {
    game.startCase(c)
    ui.briefing = c.briefing ?? null
  })
}
function anyway() {
  const c = firstTime.value
  firstTime.value = null
  if (c) begin(() => {
    game.startCase(c)
    ui.briefing = c.briefing ?? null
  })
}

/** A night still open is asked about before another is dealt over it. */
const overwrite = ref<(() => void) | null>(null)
function begin(run: () => void) {
  if (saved.value && !opening.value) {
    sfx('page')
    overwrite.value = run
    return
  }
  open(run)
}
function overwriteAnyway() {
  const run = overwrite.value
  overwrite.value = null
  if (run) open(run)
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
  begin(() => {
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
  begin(() => game.newGame(dailySeed(today), 'simple', today, dailyPack(today)))
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
    <BackLink v-if="page !== 'home'" class="back-row" @back="!opening && home()" />
    <p class="deco"><span /></p>
    <h1>Mini<span class="dot">·</span>Mystery</h1>
    <p class="where">
      {{ page === 'home' ? 'A Golden-Age Whodunnit' : page === 'campaign' ? 'The campaign' : PACKS[setting].title }}
    </p>

    <template v-if="page === 'home'">
      <p class="blurb">
        Seven guests. One murderer among them, and everyone playing an angle. Search the rooms,
        question the household, catch the contradictions, and name the killer before midnight.
      </p>

      <div class="menu">
        <button v-if="saved" class="primary" :disabled="opening" @click="resume()">
          {{ savedCase ? `Continue the campaign: ${savedCase.chapter}` : `Continue case №${saved.seed}` }}
          <span class="small stands">· {{ savedStands }}</span>
        </button>
        <button :class="foremost === 'campaign' ? 'primary' : 'second'" :disabled="opening" @click="toCampaign()">
          <Icon v-if="foremost !== 'campaign'" name="lantern" /> The campaign
        </button>
        <button :class="foremost === 'new' ? 'primary' : 'second'" :disabled="opening" @click="setUp()">
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

    <template v-else-if="page === 'campaign'">
      <p class="blurb small">
        A run of cases that bring the game in a piece at a time. The next opens when the last is solved; a
        case solved may be played again, and comes out new.
      </p>
      <div class="cases">
        <article
          v-for="{ c, i } in shownCases"
          :key="c.id"
          class="case frame"
          :class="{ solved: campaignSolved(c.id), locked: caseLocked(i) }"
        >
          <!-- (The setting's own mark sets the scene; what the night holds, the sheet tells.) -->
          <Icon :name="caseLocked(i) ? 'lock' : SETTING_ICON[c.pack]" class="mark" />
          <div class="words">
            <p class="chapter small muted">
              {{ c.chapter }}
              <span v-if="campaignSolved(c.id)" class="done"><Icon name="check" /> solved</span>
              <span v-else-if="c.id === nextCase?.id" class="next">next</span>
            </p>
            <h3 class="brass">{{ c.name }}</h3>
          </div>
          <button :class="c.id === nextCase?.id ? 'primary' : 'second'" :disabled="opening || caseLocked(i)" @click="startCampaign(c)">
            {{ opening ? 'Opening…' : campaignSolved(c.id) ? 'Again' : 'Begin' }}
          </button>
        </article>
        <article v-if="hiddenNext" class="case frame tocome">
          <Icon name="lock" class="mark" />
          <div class="words">
            <p class="chapter small muted">{{ hiddenNext.c.chapter }}</p>
            <h3 class="muted">Sealed</h3>
          </div>
        </article>
      </div>
      <p v-if="failed" class="small failed">That case file would not open. Try again.</p>
    </template>

    <template v-else>
      <fieldset class="settings">
        <legend class="small muted">Where</legend>
        <label v-for="s in openSettings" :key="s.id" class="script setting" :class="{ on: setting === s.id }">
          <input v-model="setting" type="radio" name="setting" :value="s.id" class="sr-only" />
          <Icon :name="s.icon" class="mark" />
          <strong>{{ s.name }}</strong>
          <span class="small muted">{{ s.text }}</span>
        </label>
        <!-- (How many more there are is the campaign's secret.) -->
        <div v-if="moreSettings" class="script setting more">
          <Icon name="lock" class="mark" />
          <strong>More to come</strong>
          <span class="small muted">Play the campaign to unlock more settings.</span>
        </div>
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

      <fieldset v-if="settings.customNights" class="settings own">
        <legend class="small muted">Your own evenings</legend>
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
    <!-- The app, offered for the home screen: the icon in the corner, with the arrow on it. -->
    <button
      v-if="page === 'home' && installable"
      class="install"
      aria-label="Keep the game on your home screen"
      title="Keep the game on your home screen"
      @click="sfx('page'), (ui.installOpen = true)"
    >
      <img :src="appIcon" alt="" />
      <span class="badge"><Icon name="download" /></span>
    </button>
    <ConfirmDialog
      :open="!!firstTime"
      line="If this is your first time, we’d recommend Case 0 first: Sergeant Pike shows you how a case is worked."
      note="You can come back to it any time."
      confirm="Go on anyway"
      @cancel="firstTime = null"
      @confirm="anyway()"
    />
    <ConfirmDialog
      :open="!!overwrite"
      :line="`${savedCase ? savedCase.chapter : `Case №${saved?.seed}`} is still open.`"
      note="Start another and that night is lost."
      confirm="Start another"
      danger
      @cancel="overwrite = null"
      @confirm="overwriteAnyway()"
    />
  </main>
</template>

<style scoped>
/* At the very top of the page, the rest kept centred in the room below it. */
.title.setup > .back-row,
.title.campaign > .back-row {
  margin-bottom: auto;
}
.title.setup > .deco:last-child,
.title.campaign > .deco:last-child {
  margin-bottom: auto;
}
/* ---- the campaign's cases ---- */
.cases {
  display: grid;
  gap: 0.5rem;
  width: min(100%, 30rem);
}
/* A row to a case: the setting's mark, the number and the name, and the way in. */
.case {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.6rem 0.9rem 0.6rem 0.8rem;
  text-align: left;
}
.case .mark {
  flex: none;
  font-size: 2rem;
  color: var(--muted);
}
.case.solved .mark {
  color: var(--brass);
}
.case .words {
  flex: 1;
  min-width: 0;
}
.case h3 {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.25;
}
.case p {
  margin: 0;
  line-height: 1.45;
}
.case .primary {
  flex: none;
  padding: 0.45rem 1rem;
  font-size: 0.8rem;
}
.chapter {
  letter-spacing: 0.2em;
  text-transform: uppercase;
}
.done {
  color: var(--good);
  margin-left: 0.4rem;
  letter-spacing: 0.06em;
  text-transform: none;
}
.case.tocome {
  border-style: dashed;
  box-shadow: none;
  opacity: 0.6;
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
.next {
  color: var(--brass);
  font-size: 0.8rem;
  margin-left: 0.3rem;
  letter-spacing: 0.06em;
  text-transform: none;
}
.done {
  color: var(--good);
  font-size: 0.8rem;
  margin-left: 0.3rem;
  letter-spacing: 0.06em;
}
.stands {
  opacity: 0.75;
  letter-spacing: 0.04em;
  text-transform: none;
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
/* The settings the campaign has not yet opened: one card for all of them, saying only that there are more. */
.setting.more {
  opacity: 0.6;
  border-style: dashed;
  cursor: default;
}
.setting.more:hover {
  border-color: var(--line);
}
/* (A button dressed as one of the cards, to begin a new evening.) */
button.script.new {
  font: inherit;
  color: inherit;
  box-shadow: none;
  border-style: dashed;
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
/* The app icon in the bottom corner, with the arrow on it, clear of the home bar. */
.install {
  position: fixed;
  right: calc(1rem + env(safe-area-inset-right, 0px));
  bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
  z-index: 5;
  width: 3.4rem;
  height: 3.4rem;
  padding: 0;
  border: 0;
  border-radius: 22%;
  background: none;
  box-shadow: var(--shadow);
  cursor: pointer;
}
.install img {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 22%;
}
.install .badge {
  position: absolute;
  right: -0.35rem;
  bottom: -0.35rem;
  display: grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: var(--brass);
  color: #15181d;
  border: 2px solid #0b0e12;
  font-size: 0.85rem;
}
.install:hover {
  box-shadow: 0 0 0 2px var(--brass-dim), var(--shadow);
}
</style>

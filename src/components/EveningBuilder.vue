<script setup lang="ts">
// An evening of the detective's own: which parts are on the script, how many
// sit down, what kinds of night there may be, and what else may happen. What
// cannot be dealt is said in words under it, and it cannot be kept until it
// can. Kept in this browser (see ui/evenings.ts).
import { computed, onMounted, ref, watch } from 'vue'
import { TABLE, checkScript } from '../engine/checkScript'
import type { Script } from '../engine/deck'
import { ACCOMPLICES, INNOCENT_POOL, ROLES, SUSPICIOUS_POOL } from '../engine/roles'
import type { NightKind, RoleId } from '../engine/types'
import { useGame } from '../stores/game'
import { useUi } from '../stores/ui'
import { sfx } from '../ui/audio'
import { NIGHT_KINDS, deleteEvening, saveEvening, type SavedEvening } from '../ui/evenings'
import { MODES } from '../ui/modes'
import { enterAt } from '../ui/scroll'
import { SUSPICION, playersOf, seat, suspicionOf, type Suspicion } from '../ui/suspicion'
import BackLink from './BackLink.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import Icon, { type IconName } from './Icon.vue'
import RoleTip from './RoleTip.vue'

const props = defineProps<{
  /** The evening being changed; or none, for a new one begun from `from`. */
  editing: SavedEvening | null
  from: Script
}>()
const emit = defineEmits<{ (e: 'back'): void; (e: 'saved', id: string): void; (e: 'deleted'): void }>()
const game = useGame()
const ui = useUi()
const pack = computed(() => game.pack)

const copy = (s: Script): Script => JSON.parse(JSON.stringify({ ...s, id: 'custom' })) as Script
const draft = ref<Script>(copy(props.editing?.script ?? props.from))
const name = ref(props.editing?.name ?? '')

const root = ref<HTMLElement | null>(null)
onMounted(() => root.value && enterAt(root.value))

// ---------- begun from one of the four ----------

function beginFrom(script: Script) {
  sfx('page')
  draft.value = copy(script)
  level.value = suspicionOf(draft.value)
}

// ---------- the table ----------

// How many sit down, the murderer among them; and how suspicious the rest
// are, in words. How many that comes to is the evening's own business (see
// ui/suspicion.ts), worked out again whenever the table or the parts change.
const questions = computed(() => draft.value.questionsPerRound ?? 7)
const players = computed(() => playersOf(draft.value))
const helperSeat = computed(() => draft.value.accomplices.length > 0)
const level = ref<Suspicion>(suspicionOf(draft.value))
function reseat(at = players.value) {
  draft.value = seat(draft.value, at, level.value)
}
reseat()
function morePlayers(by: 1 | -1) {
  const next = players.value + by
  if (next < TABLE.seated.min || next > TABLE.seated.max) return
  sfx('click')
  reseat(next)
}
function suspicion(to: Suspicion) {
  if (level.value === to) return
  sfx('click')
  level.value = to
  reseat()
}
// (What the rest of the evening needs can change how many it bears.)
watch(
  // (A string, so that seating them again, which changes the draft, is not itself a change.)
  () => JSON.stringify([helperSeat.value, !!draft.value.passage, draft.value.suspicious, draft.value.innocents, draft.value.nights]),
  () => reseat(),
)
function moreQuestions(by: 1 | -1) {
  const next = questions.value + by
  if (next < TABLE.questions.min || next > TABLE.questions.max) return
  sfx('click')
  draft.value = { ...draft.value, questionsPerRound: next }
}

// ---------- the parts ----------

type Field = 'innocents' | 'suspicious' | 'accomplices'
/** Every part there is, by class: the extras (the Architect, the Drunk) with their own. */
const GROUPS: { field: Field; name: string; roles: RoleId[] }[] = [
  { field: 'innocents', name: 'Innocent', roles: [...INNOCENT_POOL, ...(Object.keys(ROLES) as RoleId[]).filter((r) => ROLES[r].class === 'innocent' && ROLES[r].extra)] },
  { field: 'suspicious', name: 'Suspicious', roles: [...SUSPICIOUS_POOL, ...(Object.keys(ROLES) as RoleId[]).filter((r) => ROLES[r].class === 'suspicious' && ROLES[r].extra)] },
  { field: 'accomplices', name: 'Accomplices', roles: [...ACCOMPLICES] },
]
const nameOf = (r: RoleId) => pack.value.roleNames[r] ?? r
const iconOf = (r: RoleId) => (pack.value.roleIcons[r] ?? 'mask') as IconName
const has = (field: Field, r: RoleId) => draft.value[field].includes(r)
function toggle(field: Field, r: RoleId) {
  sfx('click')
  const now = draft.value[field]
  // (Kept in the order the parts are listed, whichever was ticked first.)
  const order = GROUPS.find((g) => g.field === field)!.roles
  const next = now.includes(r) ? now.filter((x) => x !== r) : order.filter((x) => x === r || now.includes(x))
  setParts(field, next)
}
function all(field: Field, on: boolean) {
  sfx('click')
  setParts(field, on ? [...GROUPS.find((g) => g.field === field)!.roles] : [])
}
function setParts(field: Field, next: RoleId[]) {
  draft.value = { ...draft.value, [field]: next }
}
/** What a part does: a card beside it with a mouse, along the foot of the screen on a touch. */
const tip = ref<{ role: RoleId; el: HTMLElement } | null>(null)
function hover(r: RoleId | null, e: PointerEvent) {
  tip.value = r && e.pointerType === 'mouse' ? { role: r, el: e.currentTarget as HTMLElement } : null
}
function explain(r: RoleId) {
  ui.roleSheet = { role: r }
}

// ---------- the kinds of night ----------

/** How likely each kind of night is, in words, and the weight each word stands for. */
const LIKELY = [
  { word: 'Never', weight: 0 },
  { word: 'Rarely', weight: 1 },
  { word: 'Sometimes', weight: 2 },
  { word: 'Often', weight: 4 },
] as const
const likelyOf = (w: number | undefined) => (!w ? 0 : w <= 1 ? 1 : w < 4 ? 2 : 3)
const nights = computed(() => draft.value.nights ?? { plain: 1 })
function weigh(kind: NightKind, weight: number) {
  if ((nights.value[kind] ?? 0) === weight) return
  sfx('click')
  const next = { ...nights.value, [kind]: weight }
  if (weight === 0) delete next[kind]
  draft.value = { ...draft.value, nights: next }
}
/** What each kind of night is, said short. */
const NIGHT_TEXT: Record<NightKind, string> = {
  plain: 'Did it, and lies about who they are.',
  serial: 'Kills again as ten o’clock strikes.',
  cunning: 'Pressed, owns to a lesser crime instead.',
  careful: 'Alone in an empty room, as a part nobody else is playing.',
  regretful: 'Owns to it at the last. Needs accomplices on the script.',
  artful: 'Dresses it up as a suicide. Needs true suicides too.',
  committee: 'Most of the table did it together, with one agreed story.',
  suicide: 'Nobody did it: it was suicide after all.',
  hoax: 'Nobody did it: the death was faked.',
}
const nightName = (kind: NightKind) => {
  if (kind === 'suicide') return 'A true suicide'
  if (kind === 'hoax') return 'A faked death'
  const n = pack.value.murderers?.[kind]?.name ?? kind
  return n.charAt(0).toUpperCase() + n.slice(1)
}

// ---------- what else ----------

const LOCKED = [
  { word: 'Never', chance: 0 },
  { word: 'Sometimes', chance: 0.4 },
  { word: 'Often', chance: 0.8 },
] as const
const lockedAt = computed(() => {
  const c = draft.value.lockedRoom ?? 0
  return c === 0 ? 0 : c <= 0.5 ? 1 : 2
})
const HELPER = [
  { word: 'Sometimes', chance: 0.5 },
  { word: 'Always', chance: 1 },
] as const
const helperAt = computed(() => ((draft.value.accompliceChance ?? 1) >= 1 ? 1 : 0))
function set<K extends keyof Script>(field: K, value: Script[K]) {
  if (draft.value[field] === value) return
  sfx('click')
  draft.value = { ...draft.value, [field]: value }
}

// ---------- keeping it ----------

const problems = computed(() => checkScript(draft.value))
function keep() {
  if (problems.value.length > 0) return
  sfx('stamp')
  emit('saved', saveEvening(name.value, draft.value, props.editing?.id))
}
/** Sent to somebody as it stands, saved or not. */
function share() {
  if (problems.value.length > 0) return
  sfx('page')
  ui.sharing = { name: name.value.trim() || 'An evening', script: copy(draft.value) }
}
const confirmDelete = ref(false)
function remove() {
  if (!props.editing) return
  confirmDelete.value = false
  sfx('scratch')
  deleteEvening(props.editing.id)
  emit('deleted')
}
</script>

<template>
  <main ref="root" class="builder">
    <BackLink @back="emit('back')" />
    <header>
      <p class="small brass kicker">An evening of your own</p>
      <input v-model="name" class="name" maxlength="40" placeholder="Name this evening" aria-label="The evening’s name" />
    </header>

    <section>
      <h3>Begin from</h3>
      <div class="from">
        <button v-for="m in MODES" :key="m.id" class="ghost" @click="beginFrom(m.script)">
          <Icon :name="m.icon" /> {{ m.name }}
        </button>
      </div>
    </section>

    <section>
      <h3>At the table</h3>
      <div class="count players">
        <span class="label">Players<span class="small muted">the murderer among them</span></span>
        <span class="stepper">
          <button class="ghost" :disabled="players <= TABLE.seated.min" aria-label="Fewer players" @click="morePlayers(-1)">−</button>
          <strong>{{ players }}</strong>
          <button class="ghost" :disabled="players >= TABLE.seated.max" aria-label="More players" @click="morePlayers(1)">+</button>
        </span>
      </div>
      <p v-if="helperSeat" class="small muted aside">One of them may be the murderer’s accomplice.</p>
      <div class="night">
        <div class="night-name">
          <strong>How suspicious</strong>
          <span class="small muted">{{ SUSPICION.find((l) => l.id === level)!.hint }}</span>
        </div>
        <div class="segments" role="radiogroup" aria-label="How suspicious the household is">
          <button
            v-for="l in SUSPICION"
            :key="l.id"
            role="radio"
            :aria-checked="level === l.id"
            :class="{ on: level === l.id }"
            @click="suspicion(l.id)"
          >
            {{ l.word }}
          </button>
        </div>
      </div>
      <div class="count">
        <span>Questions an hour</span>
        <span class="stepper">
          <button class="ghost" :disabled="questions <= TABLE.questions.min" aria-label="Fewer questions an hour" @click="moreQuestions(-1)">−</button>
          <strong>{{ questions }}</strong>
          <button class="ghost" :disabled="questions >= TABLE.questions.max" aria-label="More questions an hour" @click="moreQuestions(1)">+</button>
        </span>
      </div>
      <label class="switch">
        <input type="checkbox" :checked="draft.lifelines ?? true" @change="set('lifelines', ($event.target as HTMLInputElement).checked)" />
        <span>Help hidden about the place</span>
      </label>
    </section>

    <section v-for="g in GROUPS" :key="g.field">
      <h3>
        {{ g.name }} <span class="muted small">{{ draft[g.field].length }} of {{ g.roles.length }}</span>
        <span class="bulk">
          <button class="ghost small" @click="all(g.field, true)">All</button>
          <button class="ghost small" @click="all(g.field, false)">None</button>
        </span>
      </h3>
      <div class="parts">
        <span v-for="r in g.roles" :key="r" class="part" :class="{ on: has(g.field, r) }">
          <button
            class="pick"
            role="switch"
            :aria-checked="has(g.field, r)"
            @click="toggle(g.field, r)"
            @pointerenter="hover(r, $event)"
            @pointerleave="tip = null"
          >
            <Icon :name="has(g.field, r) ? 'check' : iconOf(r)" /> {{ nameOf(r) }}
          </button>
          <button class="what ghost" :aria-label="`What ${nameOf(r)} does`" @click="explain(r)"><Icon name="question" /></button>
        </span>
      </div>
    </section>

    <section>
      <h3>Kinds of night</h3>
      <div v-for="k in NIGHT_KINDS" :key="k" class="night">
        <div class="night-name">
          <strong>{{ nightName(k) }}</strong>
          <span class="small muted">{{ NIGHT_TEXT[k] }}</span>
        </div>
        <div class="segments" role="radiogroup" :aria-label="`How often: ${nightName(k)}`">
          <button
            v-for="(l, i) in LIKELY"
            :key="l.word"
            role="radio"
            :aria-checked="likelyOf(nights[k]) === i"
            :class="{ on: likelyOf(nights[k]) === i }"
            @click="weigh(k, l.weight)"
          >
            {{ l.word }}
          </button>
        </div>
      </div>
    </section>

    <section>
      <h3>And besides</h3>
      <label class="switch">
        <input type="checkbox" :checked="!!draft.passage" @change="set('passage', ($event.target as HTMLInputElement).checked)" />
        <span>A secret passage from the scene</span>
      </label>
      <div class="night">
        <div class="night-name"><strong>A locked room</strong><span class="small muted">Papers behind a door, and its key gone missing.</span></div>
        <div class="segments" role="radiogroup" aria-label="How often a room is locked">
          <button v-for="(l, i) in LOCKED" :key="l.word" role="radio" :aria-checked="lockedAt === i" :class="{ on: lockedAt === i }" @click="set('lockedRoom', l.chance)">
            {{ l.word }}
          </button>
        </div>
      </div>
      <div v-if="draft.accomplices.length > 0" class="night">
        <div class="night-name"><strong>An accomplice in the house</strong><span class="small muted">In the place of one of the suspicious.</span></div>
        <div class="segments" role="radiogroup" aria-label="How often an accomplice is in the house">
          <button v-for="(l, i) in HELPER" :key="l.word" role="radio" :aria-checked="helperAt === i" :class="{ on: helperAt === i }" @click="set('accompliceChance', l.chance)">
            {{ l.word }}
          </button>
        </div>
      </div>
    </section>

    <section v-if="problems.length > 0" class="problems" aria-live="polite">
      <h3><Icon name="alert" /> Not yet an evening that can be dealt</h3>
      <ul>
        <li v-for="(p, i) in problems" :key="i">{{ p.text }}</li>
      </ul>
    </section>

    <div class="keep">
      <button class="primary" :disabled="problems.length > 0" @click="keep()">
        <Icon name="pen" /> {{ editing ? 'Save changes' : 'Save this evening' }}
      </button>
      <button class="share" :disabled="problems.length > 0" @click="share()"><Icon name="share" /> Share</button>
      <button v-if="editing" class="ghost forget" @click="confirmDelete = true">Delete this evening</button>
    </div>
    <RoleTip v-if="tip" :role="tip.role" :anchor="tip.el" />
    <ConfirmDialog
      :open="confirmDelete"
      :line="`“${editing?.name}” will be gone for good.`"
      confirm="Delete it"
      danger
      @cancel="confirmDelete = false"
      @confirm="remove()"
    />
  </main>
</template>

<style scoped>
.builder {
  max-width: 40rem;
  margin: 0 auto;
  padding: 1rem 1rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}
header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  text-align: center;
}
.kicker {
  margin: 0;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}
.name {
  width: min(100%, 24rem);
  text-align: center;
  font-family: var(--font-display);
  font-size: 1.35rem;
  letter-spacing: 0.08em;
}
section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.8rem;
  border-top: 1px solid var(--line);
}
h3 {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0;
  font-family: var(--font-display);
  font-weight: normal;
  font-size: 1rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--brass);
}
h3 .muted {
  letter-spacing: 0.04em;
  text-transform: none;
}
.bulk {
  margin-left: auto;
  display: flex;
  gap: 0.25rem;
}
.bulk button {
  padding: 0.15rem 0.55rem;
  letter-spacing: 0.06em;
}
.from {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.4rem;
}
.from button {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.45rem;
  padding: 0.45rem 0.7rem;
  border: 1px solid var(--line);
  text-align: left;
}
.count {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.stepper {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}
.stepper button {
  border: 1px solid var(--line);
  width: 2.3rem;
  height: 2.3rem;
  padding: 0;
  font-size: 1.2rem;
  line-height: 1;
}
.stepper strong {
  min-width: 1.6rem;
  text-align: center;
  font-variant-numeric: tabular-nums;
  font-size: 1.15rem;
}
.label {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.aside {
  margin: -0.3rem 0 0;
}
.switch {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
}
.switch input {
  width: 1.15rem;
  height: 1.15rem;
  accent-color: var(--brass);
}
.parts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.part {
  display: inline-flex;
  align-items: stretch;
  border: 1px solid var(--line);
  border-radius: 999px;
  overflow: hidden;
  transition:
    border-color 0.15s,
    background 0.15s;
}
.part.on {
  border-color: var(--brass-dim);
  background: rgba(77, 65, 22, 0.4);
}
.part button {
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}
.pick {
  display: inline-flex;
  align-items: center;
  gap: 0.35em;
  padding: 0.3rem 0.4rem 0.3rem 0.7rem;
  color: var(--muted);
  white-space: nowrap;
}
.part.on .pick {
  color: var(--brass);
}
.what {
  padding: 0.3rem 0.55rem 0.3rem 0.3rem;
  color: var(--muted);
  opacity: 0.7;
}
.night {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem 1rem;
  flex-wrap: wrap;
}
.night-name {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1 1 14rem;
}
.night-name strong {
  font-weight: normal;
}
.segments {
  display: inline-flex;
  border: 1px solid var(--line);
  border-radius: 6px;
  overflow: hidden;
}
.segments button {
  border: 0;
  border-radius: 0;
  box-shadow: none;
  background: transparent;
  padding: 0.35rem 0.6rem;
  font-size: 0.85rem;
  color: var(--muted);
}
.segments button + button {
  border-left: 1px solid var(--line);
}
.segments button.on {
  background: rgba(77, 65, 22, 0.55);
  color: var(--brass);
}
.problems {
  border: 1px solid rgba(192, 71, 60, 0.6);
  background: rgba(192, 71, 60, 0.08);
  padding: 0.7rem 0.9rem;
}
.problems h3 {
  color: #f0b0a8;
  align-items: center;
}
.problems ul {
  margin: 0;
  padding-left: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  line-height: 1.45;
}
.keep {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
.keep .primary,
.keep .share {
  width: min(100%, 22rem);
}
.forget {
  color: #f0b0a8;
}
@media (max-width: 480px) {
  .night .segments {
    width: 100%;
  }
  .night .segments button {
    flex: 1;
  }
}
</style>

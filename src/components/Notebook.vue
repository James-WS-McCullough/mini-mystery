<script setup lang="ts">
// The detective's notebook, for reading: everything said and found, with where
// each fact came from.
import { computed, ref } from 'vue'
import { describeClaim, describeEvidence, roomName } from '../engine/render'
import type { EvidenceItem, Lifeline, RoleId } from '../engine/types'
import { lifelineOf } from '../content/lifelines'
import LifelineArt from './LifelineArt.vue'
import { noteText } from '../ui/note'
import { useGame, type NoteEntry } from '../stores/game'
import { sfx } from '../ui/audio'
import { useUi } from '../stores/ui'
import Icon from './Icon.vue'
import ItemArt from './ItemArt.vue'
import { ITEM_KINDS, kindLabel, tintOf } from '../ui/itemArt'
import NoteRow from './NoteRow.vue'
import Portrait from './Portrait.vue'

const game = useGame()
const ui = useUi()

type Tab = 'people' | 'topics' | 'evidence' | 'threads' | 'lifelines'
/** The tab is kept for the night (in the ui store), so the notebook opens where it was left. */
const tab = computed<Tab>({ get: () => ui.notebookTab, set: (t) => (ui.notebookTab = t) })
/** Whose pages are open: kept likewise, and the sitter's own when opened from their chair. */
if (game.activeChar !== null) ui.notebookPeople.add(game.activeChar)
const opened = (speaker: number) => ui.notebookPeople.has(speaker)
function toggled(speaker: number, e: Event) {
  if ((e.target as HTMLDetailsElement).open) ui.notebookPeople.add(speaker)
  else ui.notebookPeople.delete(speaker)
}
const TABS: { id: Tab; label: string }[] = [
  { id: 'people', label: 'People' },
  { id: 'topics', label: 'Topics' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'threads', label: 'Threads' },
]
/** Back from the lifelines to the notes they were opened from. */
const lastNotesTab = ref<Tab>('people')
function lifelinesView() {
  sfx('page')
  if (tab.value === 'lifelines') tab.value = lastNotesTab.value
  else {
    lastNotesTab.value = tab.value
    tab.value = 'lifelines'
  }
}

// ---- lifelines ----
/** The lifeline whose choice (a room, a guest) is open. */
const choosing = ref<string | null>(null)
function choose(l: Lifeline) {
  sfx('click')
  // Pike and the telephone are played out as scenes of their own.
  if (l.kind === 'pike' || l.kind === 'expert') {
    choosing.value = null
    game.notebookOpen = false
    ui.lifelineScene = { id: l.id, kind: l.kind }
    return
  }
  choosing.value = choosing.value === l.id ? null : l.id
}
function use(l: Lifeline, on: { char?: number; room?: string } = {}) {
  sfx('select')
  choosing.value = null
  game.useLifeline(l.id, on)
  // What comes of it is shown over the page, so the notebook steps aside.
  if (l.kind !== 'pike') game.notebookOpen = false
}
/** In a line, what came of a lifeline that has been used. */
function outcome(l: Lifeline): string {
  const u = game.usedLifelines[l.id]
  if (!u || !game.ctx || !game.mystery) return ''
  if (u.kind === 'note' && u.hint) return `It read: “${noteText(game, u.hint)}”`
  if (u.kind === 'coffee') return `Used ${game.hourOf(u.round)}: five more questions.`
  if (u.kind === 'pike') {
    const where = roomName(game.ctx, u.room!)
    return game.pikeOrder?.room === u.room
      ? `Sergeant Pike is searching ${where}. He reports when the hour strikes.`
      : `Sergeant Pike searched ${where}.`
  }
  const who = name(u.char!)
  if (u.kind === 'telegram') return lifelineOf(game.pack, 'telegram').noted!.replace('{name}', who)
  return u.pillar
    ? `On the telephone: ${who} can be ruled out, with no ${u.pillar}.`
    : `On the telephone: ${who} could not be ruled out on any count.`
}

const bySpeaker = computed(() => {
  const groups = new Map<number, NoteEntry[]>()
  for (const n of game.notebook) {
    const list = groups.get(n.speaker) ?? []
    list.push(n)
    groups.set(n.speaker, list)
  }
  return [...groups.entries()]
})

const topics = computed(() => {
  const of = (...kinds: NoteEntry['claim']['kind'][]) =>
    game.notebook.filter((n) => kinds.includes(n.claim.kind))
  const roles = new Map<RoleId, NoteEntry[]>()
  for (const n of game.notebook) {
    if (n.claim.kind !== 'role') continue
    roles.set(n.claim.role, [...(roles.get(n.claim.role) ?? []), n])
  }
  return {
    roles,
    sections: [
      { title: 'Whereabouts during the murder', list: of('whereabouts') },
      { title: 'About the culprit', list: of('confession', 'culpritAttr', 'glimpse', 'among', 'alignment', 'passing') },
      { title: 'About the household', list: of('passage', 'roomState', 'together', 'liarsAmong', 'blackmailed', 'bribed', 'toldBy', 'silent') },
      { title: 'Relations with the victim', list: of('relationship') },
      { title: 'Sightings & sounds', list: of('sighting', 'earlier', 'heard') },
      { title: 'Fingers pointed', list: of('suspicion') },
      { title: 'Answered for, on a feeling', list: of('trust') },
    ].filter((s) => s.list.length > 0),
  }
})

function member(id: number) {
  return game.mystery!.cast[id]
}
function name(id: number): string {
  return game.mystery?.cast[id].shortName ?? ''
}
function describe(n: NoteEntry): string {
  return game.ctx ? describeClaim(game.ctx, n.speaker, n.claim) : ''
}
function evidenceProv(e: EvidenceItem): string {
  if (!game.ctx) return ''
  return `${e.came ?? `found in ${roomName(game.ctx, e.room)}`} · ${describeEvidence(game.ctx, e)}`
}
function prov(n: NoteEntry): string {
  return `${n.source}, ${game.hourOf(n.round)}`
}
function flagOf(id: string): 'realized' | 'proven' | 'link' | null {
  const f = game.realizedFlags.get(id)
  if (!f) return null
  return f === 'contradiction' ? 'realized' : f
}
function roleLabel(role: RoleId): string {
  return game.ctx?.pack.roleLabels[role] ?? role
}
function turn(t: Tab) {
  sfx('page')
  tab.value = t
}
</script>

<template>
  <div class="notebook">
    <div class="tabs" role="tablist">
      <button
        v-for="t in TABS"
        :key="t.id"
        class="tab"
        role="tab"
        :aria-selected="tab === t.id"
        :class="{ active: tab === t.id }"
        @click="turn(t.id)"
      >
        {{ t.label }}
        <span v-if="t.id === 'threads' && game.realized.length > 0">{{ game.realized.length }}</span>
      </button>
    </div>

    <div class="page paper">
      <!-- ============ PEOPLE ============ -->
      <template v-if="tab === 'people'">
        <p v-if="bySpeaker.length === 0" class="empty">Nothing yet. Ask, search, listen.</p>
        <details v-for="[speaker, list] in bySpeaker" :key="speaker" class="person" :open="opened(speaker)" @toggle="toggled(speaker, $event)">
          <summary>
            <Portrait :who="member(speaker).defId" shape="token" size="1.55rem" />
            <strong>{{ name(speaker) }}</strong>
            <span class="count">{{ list.length }} note{{ list.length === 1 ? '' : 's' }}</span>
          </summary>
          <NoteRow
            v-for="n in list"
            :key="n.id"
            :main="describe(n)"
            :prov="prov(n)"
            :flag="flagOf(n.id)"
            :lie="game.retracted.has(n.id)"
            :title="n.text"
          />
        </details>
      </template>

      <!-- ============ TOPICS ============ -->
      <template v-else-if="tab === 'topics'">
        <p v-if="game.notebook.length === 0" class="empty">Nothing yet. Ask, search, listen.</p>
        <section v-if="topics.roles.size" class="section">
          <h4>Who says they are who</h4>
          <div v-for="[role, list] in topics.roles" :key="role" class="rolegroup">
            <span class="sub">
              {{ roleLabel(role) }}: {{ list.length }} claim{{ list.length === 1 ? 's' : '' }} this<template
                v-if="list.length > 1"
                >, and nobody shares a role</template
              >
            </span>
            <NoteRow
              v-for="n in list"
              :key="n.id"
              :speaker="name(n.speaker)"
              :main="describe(n)"
              :prov="prov(n)"
              :flag="flagOf(n.id)"
              :lie="game.retracted.has(n.id)"
            />
          </div>
        </section>
        <section v-for="s in topics.sections" :key="s.title" class="section">
          <h4>{{ s.title }}</h4>
          <NoteRow
            v-for="n in s.list"
            :key="n.id"
            :speaker="name(n.speaker)"
            :main="describe(n)"
            :prov="prov(n)"
            :flag="flagOf(n.id)"
            :lie="game.retracted.has(n.id)"
          />
        </section>
      </template>

      <!-- ============ EVIDENCE ============ -->
      <template v-else-if="tab === 'evidence'">
        <p v-if="game.foundItems.length === 0" class="empty">
          You have collected nothing yet. Search the rooms.
        </p>
        <p v-else class="key">
          <span v-for="k in ITEM_KINDS" :key="k" class="swatch">
            <i :style="{ background: game.ctx ? tintOf(k, game.ctx.pack) : undefined }" />
            {{ kindLabel(k) }}
          </span>
        </p>
        <div v-for="e in game.foundItems" :key="e.id" class="exhibit">
          <ItemArt :item="e.id" size="2.4rem" />
          <NoteRow :main="e.name" :prov="evidenceProv(e)" :flag="flagOf(e.id)" />
        </div>
      </template>

      <!-- ============ LIFELINES ============ -->
      <template v-else-if="tab === 'lifelines'">
        <p v-if="game.foundLifelines.length === 0" class="empty">
          None found yet. There is help hidden about {{ game.place.name }} tonight. Search the rooms.
        </p>
        <div v-for="l in game.foundLifelines" :key="l.id" class="lifeline" :class="{ used: game.usedLifelines[l.id] }">
          <LifelineArt :kind="l.kind" size="2.6rem" :dim="!!game.usedLifelines[l.id]" />
          <div class="what">
            <strong>{{ lifelineOf(game.pack, l.kind).name }}</strong>
            <span v-if="game.usedLifelines[l.id]" class="sub">{{ outcome(l) }}</span>
            <span v-else class="sub">{{ lifelineOf(game.pack, l.kind).does }}</span>
          </div>
          <template v-if="!game.usedLifelines[l.id]">
            <button
              v-if="l.kind === 'coffee' || l.kind === 'note'"
              class="use"
              :disabled="!game.canUseLifelines"
              @click="use(l)"
            >
              {{ l.kind === 'note' ? 'Open' : 'Use' }}
            </button>
            <button
              v-else
              class="use"
              :disabled="!game.canUseLifelines || (l.kind === 'pike' && game.pikeRooms.length === 0)"
              :aria-expanded="choosing === l.id"
              @click="choose(l)"
            >
              {{ choosing === l.id ? 'Cancel' : 'Use' }}
            </button>
          </template>
          <!-- The choice: whom the wire concerns. (Pike and the telephone have scenes of their own.) -->
          <div v-if="choosing === l.id" class="choices">
            <span class="sub">About whom?</span>
            <button
              v-for="m in game.mystery!.cast"
              :key="m.id"
              class="choice"
              @click="use(l, { char: m.id })"
            >
              <Portrait :who="m.defId" shape="token" size="1.4rem" /> {{ m.shortName }}
            </button>
          </div>
        </div>
        <p v-if="game.foundLifelines.length > 0 && !game.canUseLifelines" class="sub">
          Lifelines can be used during the hour.
        </p>
      </template>

      <!-- ============ THREADS ============ -->
      <template v-else>
        <p v-if="game.realized.length === 0" class="empty">
          No threads drawn yet. Compare notes at any point in the hour: pair notes that cannot both
          be true, or notes that hold each other up.
        </p>
        <div v-for="t in game.realized" :key="t.key" class="thread" :class="t.type">
          <div class="ends">
            <Icon :name="t.type === 'contradiction' ? 'bolt' : 'link'" />
            <span>{{ t.itemLabels[0] }}</span>
            <span class="against">{{ t.type === 'contradiction' ? 'against' : 'with' }}</span>
            <span>{{ t.itemLabels[1] }}</span>
          </div>
          <div class="sub">
            <template v-if="t.type === 'contradiction'">
              implicates {{ t.implicated.map(name).join(' and ') }}
              <template v-if="t.proven"> · proven against them</template>
            </template>
            <template v-else-if="t.supports.length > 0">
              speaks for {{ t.supports.map(name).join(' and ') }}
            </template>
            <template v-else>two clues telling the same story</template>
            · drawn at {{ game.hourOf(t.round) }}
          </div>
        </div>
      </template>
    </div>

    <!-- Lifelines: not notes, so not a tab — a strip of their own, once one is found. -->
    <button
      v-if="game.foundLifelines.length > 0"
      class="lifelines-strip"
      :class="{ open: tab === 'lifelines' }"
      :aria-pressed="tab === 'lifelines'"
      @click="lifelinesView()"
    >
      <template v-if="tab === 'lifelines'"><Icon name="back" /> Back to your notes</template>
      <template v-else>
        <Icon name="letter" />
        <span v-if="game.unusedLifelines.length" class="unused">{{ game.unusedLifelines.length }}</span>
        {{
          game.unusedLifelines.length
            ? `lifeline${game.unusedLifelines.length === 1 ? '' : 's'} to use`
            : 'Lifelines, all used'
        }}
        <Icon name="forward" class="go" />
      </template>
    </button>
  </div>
</template>

<style scoped>
.notebook {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}
.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem;
  padding-left: 0.4rem;
}
.tab {
  padding: 0.35rem 0.75rem 0.25rem;
  font-family: var(--font-type);
  font-size: 0.8rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--paper-muted);
  background: var(--paper-2);
  border: 0;
  border-radius: 4px 4px 0 0;
  opacity: 0.7;
}
.tab:hover:not(:disabled) {
  transform: none;
  box-shadow: none;
  opacity: 0.9;
}
.tab.active {
  color: var(--paper-ink);
  background: var(--paper);
  opacity: 1;
}
.page {
  flex: 1;
  min-height: 12rem;
  overflow-y: auto;
  padding: 1.55rem 1rem 1.55rem 1.4rem;
  border-left: 3px double #b0553f;
}
/* The strip at the foot of the notebook, in the lifelines' green. */
.lifelines-strip {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.55rem 0.9rem;
  border: 1px solid #4f8a63;
  background: linear-gradient(180deg, #24432f, #182c20);
  color: #e8f0e0;
  font-family: var(--font-type);
  font-size: 0.85rem;
  letter-spacing: 0.04em;
  text-align: left;
}
.lifelines-strip .go {
  margin-left: auto;
}
.lifelines-strip.open {
  background: transparent;
  color: var(--muted);
  border-color: var(--line);
}
/* Lifelines to use: the same green count as on the notebook's button. */
.lifelines-strip .unused {
  display: inline-grid;
  place-items: center;
  min-width: 1.05rem;
  height: 1.05rem;
  padding: 0 0.2rem;
  border-radius: 1rem;
  background: #3f8a5a;
  color: #f3e7c3;
  font-size: 0.68rem;
  line-height: 1;
}
.lifeline {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.3rem 0.7rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--paper-line);
}
.lifeline .what {
  display: flex;
  flex-direction: column;
  line-height: 1.35;
}
.lifeline .what strong {
  font-family: var(--font-type);
  font-weight: normal;
}
.lifeline .what strong::first-letter {
  text-transform: uppercase;
}
.lifeline .sub {
  line-height: 1.35;
}
.lifeline.used .what strong {
  color: var(--paper-muted);
}
.use {
  padding: 0.3rem 0.8rem;
  font-size: 0.85rem;
  background: var(--paper-2);
  color: var(--paper-ink);
  border-color: var(--paper-line);
}
.choices {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  padding: 0.3rem 0 0.2rem;
}
.choices .sub {
  flex-basis: 100%;
}
.choice {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.6rem;
  font-size: 0.85rem;
  background: var(--paper);
  color: var(--paper-ink);
  border-color: var(--paper-line);
}
.empty {
  margin: 0;
  line-height: 1.55rem;
  color: var(--paper-muted);
}
.section {
  margin-bottom: 1.55rem;
}
h4 {
  margin: 0;
  font-family: var(--font-type);
  font-size: 0.85rem;
  line-height: 1.55rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  text-decoration: underline;
  text-underline-offset: 0.2em;
}
.sub {
  display: block;
  font-size: 0.78rem;
  line-height: 1.55rem;
  color: var(--paper-muted);
}
summary {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  cursor: pointer;
  line-height: 1.55rem;
  padding: 0;
  list-style: none;
}
summary::-webkit-details-marker {
  display: none;
}
summary::before {
  content: '▸';
  transition: transform 0.15s;
}
details[open] > summary::before {
  transform: rotate(90deg);
}
summary strong {
  font-weight: normal;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.88rem;
}
.count {
  font-size: 0.78rem;
  color: var(--paper-muted);
}
.person {
  margin-bottom: 0;
}
.person[open] {
  margin-bottom: 1.55rem;
}
.exhibit {
  display: flex;
  gap: 0.55rem;
  align-items: center;
  margin-bottom: 0.4rem;
}
.exhibit > .icon {
  color: #8a5a12;
}
.thread {
  margin-bottom: 1.55rem;
  font-size: 0.88rem;
  line-height: 1.55rem;
}
.thread .ends > .icon {
  margin-right: 0.3rem;
  color: #8a3a2c;
}
.thread.link .ends > .icon {
  color: #3d6b3a;
}
.against {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--paper-muted);
  padding-left: 1.3rem;
}
.key {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem 0.9rem;
  margin: 0 0 0.5rem;
  font-size: 0.74rem;
  color: var(--paper-muted);
}
.swatch {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}
.swatch i {
  width: 0.7rem;
  height: 0.7rem;
  border: 1px solid rgba(0, 0, 0, 0.5);
}
</style>

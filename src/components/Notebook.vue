<script setup lang="ts">
// The detective's notebook, for reading: everything said and found, with where
// each fact came from.
import { computed, ref } from 'vue'
import { describeClaim, describeEvidence, roomName } from '../engine/render'
import type { EvidenceItem, RoleId } from '../engine/types'
import { useGame, type NoteEntry } from '../stores/game'
import { sfx } from '../ui/audio'
import Icon from './Icon.vue'
import ItemArt from './ItemArt.vue'
import { ITEM_KINDS, kindLabel, tintOf } from '../ui/itemArt'
import NoteRow from './NoteRow.vue'
import Portrait from './Portrait.vue'

const game = useGame()

type Tab = 'people' | 'topics' | 'evidence' | 'threads'
const tab = ref<Tab>('people')
const TABS: { id: Tab; label: string }[] = [
  { id: 'people', label: 'People' },
  { id: 'topics', label: 'Topics' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'threads', label: 'Threads' },
]

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
      { title: 'About the culprit', list: of('confession', 'culpritAttr', 'glimpse', 'among', 'alignment') },
      { title: 'About the household', list: of('passage', 'liarsAmong', 'blackmailed', 'bribed', 'toldBy', 'silent') },
      { title: 'Relations with the victim', list: of('relationship') },
      { title: 'Sightings & sounds', list: of('sighting', 'earlier', 'heard') },
      { title: 'Fingers pointed', list: of('suspicion') },
      { title: 'Answered for — on a feeling', list: of('trust') },
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
  return `found in ${roomName(game.ctx, e.room)} · ${describeEvidence(game.ctx, e)}`
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
        <details v-for="[speaker, list] in bySpeaker" :key="speaker" class="person">
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
              {{ roleLabel(role) }} — {{ list.length }} claim{{ list.length === 1 ? 's' : '' }} this<template
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

      <!-- ============ THREADS ============ -->
      <template v-else>
        <p v-if="game.realized.length === 0" class="empty">
          No threads drawn yet. When the hour ends, pair notes that cannot both be true — or notes
          that hold each other up.
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

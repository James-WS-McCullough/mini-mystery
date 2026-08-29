<script setup lang="ts">
import { computed, ref } from 'vue'
import { describeClaim, describeEvidence, roomName } from '../engine/render'
import type { EvidenceItem, RoleId } from '../engine/types'
import { useGame, type NoteEntry } from '../stores/game'
import NoteRow from './NoteRow.vue'

const props = withDefaults(defineProps<{ mode?: 'view' | 'cite' | 'select' }>(), {
  mode: 'view',
})
const game = useGame()

type Tab = 'people' | 'topics' | 'evidence' | 'threads'
const tab = ref<Tab>(props.mode === 'view' ? 'people' : 'topics')
const TABS: { id: Tab; label: string }[] = [
  { id: 'people', label: 'People' },
  { id: 'topics', label: 'Topics' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'threads', label: 'Threads' },
]

/** Opinions can't be cited or paired — they only appear when browsing. */
const entries = computed(() =>
  game.notebook.filter((n) => props.mode === 'view' || n.claim.kind !== 'suspicion'),
)

const bySpeaker = computed(() => {
  const groups = new Map<number, NoteEntry[]>()
  for (const n of entries.value) {
    const list = groups.get(n.speaker) ?? []
    list.push(n)
    groups.set(n.speaker, list)
  }
  return [...groups.entries()]
})

const topics = computed(() => {
  const t = {
    whereabouts: [] as NoteEntry[],
    roles: new Map<RoleId, NoteEntry[]>(),
    clues: [] as NoteEntry[],
    relationships: [] as NoteEntry[],
    sightings: [] as NoteEntry[],
    suspicions: [] as NoteEntry[],
  }
  for (const n of entries.value) {
    switch (n.claim.kind) {
      case 'whereabouts':
        t.whereabouts.push(n)
        break
      case 'role': {
        const list = t.roles.get(n.claim.role) ?? []
        list.push(n)
        t.roles.set(n.claim.role, list)
        break
      }
      case 'culpritAttr':
      case 'glimpse':
      case 'alignment':
        t.clues.push(n)
        break
      case 'relationship':
        t.relationships.push(n)
        break
      case 'sighting':
      case 'heard':
        t.sightings.push(n)
        break
      case 'suspicion':
        t.suspicions.push(n)
        break
    }
  }
  return t
})

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
function deckCopies(role: RoleId): number {
  return game.mystery?.caseSheet.deck.filter((r) => r === role).length ?? 0
}
function roleLabel(role: RoleId): string {
  return game.ctx?.pack.roleLabels[role] ?? role
}

function toggle(id: string, isEvidence: boolean) {
  if (props.mode === 'select') game.toggleDeduceSelect(id)
  else if (props.mode === 'cite') (isEvidence ? game.toggleCiteItem : game.toggleCiteNote)(id)
}
function isSelected(id: string, isEvidence: boolean): boolean {
  if (props.mode === 'select') return game.deduceSelection.includes(id)
  if (props.mode === 'cite')
    return isEvidence ? game.citedItemIds.includes(id) : game.citedNoteIds.includes(id)
  return false
}
</script>

<template>
  <div class="notebook panel">
    <div class="tabs">
      <button
        v-for="t in TABS"
        :key="t.id"
        class="tab"
        :class="{ active: tab === t.id }"
        @click="tab = t.id"
      >
        {{ t.label }}
        <span v-if="t.id === 'threads' && game.realized.length > 0" class="brass">{{ game.realized.length }}</span>
      </button>
    </div>

    <!-- ============ PEOPLE ============ -->
    <div v-if="tab === 'people'" class="body">
      <p v-if="bySpeaker.length === 0" class="muted small">Nothing yet. Ask, search, listen.</p>
      <details v-for="[speaker, list] in bySpeaker" :key="speaker" class="person" :open="mode !== 'view'">
        <summary>
          <span class="brass">{{ name(speaker) }}</span>
          <span class="muted small"> · {{ list.length }} note{{ list.length === 1 ? '' : 's' }}</span>
        </summary>
        <NoteRow
          v-for="n in list"
          :key="n.id"
          :main="describe(n)"
          :prov="prov(n)"
          :flag="flagOf(n.id)"
          :mode="mode"
          :selected="isSelected(n.id, false)"
          :title="n.text"
          @toggle="toggle(n.id, false)"
        />
      </details>
    </div>

    <!-- ============ TOPICS ============ -->
    <div v-else-if="tab === 'topics'" class="body">
      <div v-if="topics.whereabouts.length" class="section">
        <h4 class="brass small">Whereabouts during the murder</h4>
        <NoteRow
          v-for="n in topics.whereabouts"
          :key="n.id"
          :speaker="name(n.speaker)"
          :main="describe(n)"
          :prov="prov(n)"
          :flag="flagOf(n.id)"
          :mode="mode"
          :selected="isSelected(n.id, false)"
          @toggle="toggle(n.id, false)"
        />
      </div>
      <div v-if="topics.roles.size" class="section">
        <h4 class="brass small">Accounts of the evening</h4>
        <div v-for="[role, list] in topics.roles" :key="role" class="rolegroup">
          <span class="small muted">
            {{ roleLabel(role) }} — {{ list.length }} claim{{ list.length === 1 ? 's' : '' }} this
            (the evening holds {{ deckCopies(role) }})
          </span>
          <NoteRow
            v-for="n in list"
            :key="n.id"
            :speaker="name(n.speaker)"
            :main="describe(n)"
            :prov="prov(n)"
            :flag="flagOf(n.id)"
            :mode="mode"
            :selected="isSelected(n.id, false)"
            @toggle="toggle(n.id, false)"
          />
        </div>
      </div>
      <div v-if="topics.clues.length" class="section">
        <h4 class="brass small">About the culprit</h4>
        <NoteRow
          v-for="n in topics.clues"
          :key="n.id"
          :speaker="name(n.speaker)"
          :main="describe(n)"
          :prov="prov(n)"
          :flag="flagOf(n.id)"
          :mode="mode"
          :selected="isSelected(n.id, false)"
          @toggle="toggle(n.id, false)"
        />
      </div>
      <div v-if="topics.relationships.length" class="section">
        <h4 class="brass small">Relations with the victim</h4>
        <NoteRow
          v-for="n in topics.relationships"
          :key="n.id"
          :speaker="name(n.speaker)"
          :main="describe(n)"
          :prov="prov(n)"
          :flag="flagOf(n.id)"
          :mode="mode"
          :selected="isSelected(n.id, false)"
          @toggle="toggle(n.id, false)"
        />
      </div>
      <div v-if="topics.sightings.length" class="section">
        <h4 class="brass small">Sightings &amp; sounds</h4>
        <NoteRow
          v-for="n in topics.sightings"
          :key="n.id"
          :speaker="name(n.speaker)"
          :main="describe(n)"
          :prov="prov(n)"
          :flag="flagOf(n.id)"
          :mode="mode"
          :selected="isSelected(n.id, false)"
          @toggle="toggle(n.id, false)"
        />
      </div>
      <div v-if="mode === 'view' && topics.suspicions.length" class="section">
        <h4 class="brass small">Fingers pointed</h4>
        <NoteRow
          v-for="n in topics.suspicions"
          :key="n.id"
          :speaker="name(n.speaker)"
          :main="describe(n)"
          :prov="prov(n)"
          mode="view"
        />
      </div>
      <p v-if="entries.length === 0" class="muted small">Nothing yet. Ask, search, listen.</p>
    </div>

    <!-- ============ EVIDENCE ============ -->
    <div v-else-if="tab === 'evidence'" class="body">
      <p v-if="game.foundItems.length === 0" class="muted small">
        You have collected nothing yet. Search the rooms.
      </p>
      <NoteRow
        v-for="e in game.foundItems"
        :key="e.id"
        :main="`◆ ${e.name}`"
        :prov="evidenceProv(e)"
        :mode="mode"
        :selected="isSelected(e.id, true)"
        @toggle="toggle(e.id, true)"
      />
    </div>

    <!-- ============ THREADS ============ -->
    <div v-else class="body">
      <p v-if="game.realized.length === 0" class="muted small">
        No threads drawn yet. When the hour ends, pair notes that cannot both be true — or
        notes that hold each other up.
      </p>
      <div
        v-for="t in game.realized"
        :key="t.key"
        class="thread"
        :class="{ interactive: mode === 'cite', selected: game.citedThreadKeys.includes(t.key) }"
        @click="mode === 'cite' && game.toggleCiteThread(t.key)"
      >
        <div class="small">
          <input
            v-if="mode === 'cite'"
            type="checkbox"
            :checked="game.citedThreadKeys.includes(t.key)"
            @click.stop.prevent="game.toggleCiteThread(t.key)"
          />
          <span :class="t.type === 'contradiction' ? 'brass' : ''">{{ t.type === 'contradiction' ? '⚡' : '🔗' }}</span>
          {{ t.itemLabels[0] }}
          <span class="muted"> ⟷ </span> {{ t.itemLabels[1] }}
        </div>
        <div class="small muted">
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
    </div>
  </div>
</template>

<style scoped>
.notebook {
  overflow-y: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.tabs {
  display: flex;
  gap: 0.3rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}
.tab {
  padding: 0.25rem 0.6rem;
  font-size: 0.85rem;
  background: transparent;
}
.tab.active {
  border-color: var(--brass);
  color: var(--brass);
}
.body {
  overflow-y: auto;
  min-height: 0;
}
.section {
  margin-bottom: 0.7rem;
}
h4 {
  margin: 0 0 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.person {
  margin-bottom: 0.35rem;
}
summary {
  cursor: pointer;
  padding: 0.2rem 0;
}
.rolegroup {
  margin-bottom: 0.4rem;
}
.thread {
  border-top: 1px solid var(--line);
  padding: 0.4rem 0.3rem;
  line-height: 1.45;
  border-radius: 3px;
}
.thread.interactive {
  cursor: pointer;
}
.thread.interactive:hover {
  background: var(--panel-2);
}
.thread.selected {
  background: #2a2417;
  outline: 1px solid var(--brass);
}
</style>

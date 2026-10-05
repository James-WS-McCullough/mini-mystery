<script setup lang="ts">
// The detective's notes dealt out as cards: for pairing at the end of the
// hour (`select`) or for pinning to the case (`cite`).
import { computed, ref } from 'vue'
import type { RoleId } from '../engine/types'
import { useGame, type NoteEntry } from '../stores/game'
import { sfx } from '../ui/audio'
import { evidenceCard, noteCard as toNoteCard, threadCard } from '../ui/cards'
import NoteCard, { type CardData } from './NoteCard.vue'

const props = defineProps<{ mode: 'select' | 'cite' }>()
const game = useGame()

type Tab = 'people' | 'topics' | 'evidence' | 'threads'
const tab = ref<Tab>(props.mode === 'cite' && game.realized.length > 0 ? 'threads' : 'people')
const TABS = computed(() => {
  const tabs: { id: Tab; label: string; short?: string; count: number }[] = [
    { id: 'people', label: 'By person', short: 'People', count: entries.value.length },
    { id: 'topics', label: 'By topic', short: 'Topics', count: entries.value.length },
    { id: 'evidence', label: 'Evidence', count: game.foundItems.length },
  ]
  if (props.mode === 'cite') {
    tabs.unshift({ id: 'threads', label: 'Threads', count: game.realized.length })
  }
  return tabs
})

/** Opinions can't be cited or paired. */
const entries = computed(() => game.notebook.filter((n) => n.claim.kind !== 'suspicion' && n.claim.kind !== 'trust'))

const noteCard = (n: NoteEntry): CardData => toNoteCard(game, n)

interface Group {
  key: string
  title: string
  note?: string
  cards: CardData[]
}

const groups = computed<Group[]>(() => {
  if (!game.ctx || !game.mystery) return []
  const ctx = game.ctx

  if (tab.value === 'people') {
    return game.mystery.cast
      .map((m) => ({
        key: `p${m.id}`,
        title: m.shortName,
        cards: entries.value.filter((n) => n.speaker === m.id).map(noteCard),
      }))
      .filter((g) => g.cards.length > 0)
  }

  if (tab.value === 'evidence') {
    return [
      {
        key: 'evidence',
        title: 'What you have found',
        cards: game.foundItems.map((e) => evidenceCard(game, e)),
      },
    ].filter((g) => g.cards.length > 0)
  }

  if (tab.value === 'threads') {
    return [
      {
        key: 'threads',
        title: 'Threads you have drawn',
        note: 'A thread counts as one exhibit and carries both its notes.',
        cards: game.realized.map((t) => threadCard(game, t)),
      },
    ].filter((g) => g.cards.length > 0)
  }

  const of = (...kinds: NoteEntry['claim']['kind'][]) =>
    entries.value.filter((n) => kinds.includes(n.claim.kind)).map(noteCard)
  const roles = new Map<RoleId, NoteEntry[]>()
  for (const n of entries.value) {
    if (n.claim.kind !== 'role') continue
    roles.set(n.claim.role, [...(roles.get(n.claim.role) ?? []), n])
  }
  return [
    { key: 'where', title: 'Whereabouts during the murder', cards: of('whereabouts') },
    ...[...roles.entries()].map(([role, list]) => ({
      key: `role-${role}`,
      title: `Who says they are ${ctx.pack.roleLabels[role] ?? role}`,
      note: list.length > 1 ? `${list.length} claim this, and nobody shares a role` : '',
      cards: list.map(noteCard),
    })),
    { key: 'clues', title: 'About the culprit', cards: of('confession', 'culpritAttr', 'glimpse', 'among', 'alignment', 'passing') },
    { key: 'rel', title: 'Relations with the victim', cards: of('relationship') },
    { key: 'others', title: 'About the household', cards: of('passage', 'roomState', 'together', 'liarsAmong', 'blackmailed', 'bribed', 'toldBy', 'silent') },
    { key: 'seen', title: 'Sightings & sounds', cards: of('sighting', 'earlier', 'heard') },
  ].filter((g) => g.cards.length > 0)
})

function isSelected(card: CardData): boolean {
  if (props.mode === 'select') return game.deduceSelection.includes(card.id)
  if (card.kind === 'thread') return game.citedThreadKeys.includes(card.id)
  if (card.kind === 'evidence') return game.citedItemIds.includes(card.id)
  return game.citedNoteIds.includes(card.id)
}

function pick(card: CardData) {
  const was = isSelected(card)
  if (props.mode === 'select') game.toggleDeduceSelect(card.id)
  else if (card.kind === 'thread') game.toggleCiteThread(card.id)
  else if (card.kind === 'evidence') game.toggleCiteItem(card.id)
  else game.toggleCiteNote(card.id)
  // The cite cap may refuse the card: only sound what actually happened.
  if (isSelected(card) !== was) sfx(was ? 'click' : 'page')
  else sfx('miss')
}

function switchTab(t: Tab) {
  sfx('page')
  tab.value = t
}
</script>

<template>
  <div class="deck">
    <div class="tabs" role="tablist">
      <button
        v-for="t in TABS"
        :key="t.id"
        class="tab"
        role="tab"
        :aria-selected="tab === t.id"
        :class="{ active: tab === t.id }"
        @click="switchTab(t.id)"
      >
        <span class="long">{{ t.label }}</span><span class="short">{{ t.short ?? t.label }}</span> <span class="count">{{ t.count }}</span>
      </button>
    </div>

    <div class="spread">
      <p v-if="props.mode === 'cite' && game.citeCount >= game.citeCap" class="small muted full">
        The board is full. Unpin one to pin another.
      </p>
      <p v-if="groups.length === 0" class="muted empty">Nothing here yet.</p>
      <section v-for="g in groups" :key="g.key" class="group">
        <h4>
          {{ g.title }} <span v-if="g.note" class="aside">{{ g.note }}</span>
        </h4>
        <div class="cards">
          <NoteCard
            v-for="c in g.cards"
            :key="c.id"
            :card="c"
            :selected="isSelected(c)"
            @pick="pick(c)"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.deck {
  display: flex;
  flex-direction: column;
  min-height: 0;
  gap: 0.6rem;
}
.tabs {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--line);
}
.tab {
  font-family: var(--font-display);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-size: 0.9rem;
  padding: 0.45rem 0.9rem;
  background: transparent;
  border: 1px solid transparent;
  border-bottom: 0;
  color: var(--muted);
}
.tab:hover:not(:disabled) {
  transform: none;
  box-shadow: none;
  color: var(--ink);
}
.tab.active {
  color: var(--brass);
  border-color: var(--brass-dim);
  background: rgba(77, 65, 22, 0.25);
}
.count {
  font-family: var(--font-type);
  font-size: 0.75rem;
  opacity: 0.7;
}
.spread {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.group h4 {
  margin: 0 0 0.45rem;
  font-size: 0.95rem;
  text-transform: uppercase;
  color: var(--brass);
}
/* Not `.note`: that is a card's own class, and the style would land on it. */
.aside {
  font-family: var(--font-body);
  font-style: italic;
  text-transform: none;
  letter-spacing: 0;
  font-size: 0.82rem;
  color: var(--muted);
  margin-left: 0.4rem;
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14.5rem, 1fr));
  gap: 0.7rem;
}
.empty {
  font-style: italic;
}
/* On a phone the tabs keep to one row and slide, rather than wrapping unevenly. */
@media (max-width: 700px) {
  .tabs {
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }
  .tabs::-webkit-scrollbar {
    display: none;
  }
  .tab {
    flex: none;
    white-space: nowrap;
  }
  /* And say "People" for "By person", to fit the row. */
  .tab .long {
    display: none;
  }
  .tab .short {
    display: inline;
  }
}
@media (min-width: 701px) {
  .tab .short {
    display: none;
  }
}
</style>

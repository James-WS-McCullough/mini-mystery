<script setup lang="ts">
// What comes of a lifeline: Sergeant Pike back from his search, a wire from
// the Yard, an expert on the telephone, or a flask of coffee.
import { computed } from 'vue'
import { PIKE, expertFor, wire } from '../content/lifelines'
import { addressPlayer } from '../engine/address'
import { describeEvidence, roomName } from '../engine/render'
import { useGame } from '../stores/game'
import { sfx } from '../ui/audio'
import { evidenceCard, noteCard } from '../ui/cards'
import { noteText } from '../ui/note'
import { settings } from '../ui/settings'
import ItemArt from './ItemArt.vue'
import LifelineArt from './LifelineArt.vue'
import { lifelineOf } from '../content/lifelines'
import NoteCard from './NoteCard.vue'
import Overlay from './Overlay.vue'
import Portrait from './Portrait.vue'

const game = useGame()
const report = computed(() => game.lifelineReport)
/** Not over the clock as it strikes: once the hour has come round. */
const open = computed(
  () =>
    !!report.value &&
    // The expert says it on the telephone (LifelineScene): not again here.
    report.value.kind !== 'expert' &&
    !(game.phase === 'play' && game.stage === 'transition') &&
    !!game.ctx,
)
const say = (text: string) => addressPlayer(text, settings.address)

const title = computed(() => {
  switch (report.value?.kind) {
    case 'pike':
      return 'Sergeant Pike reports'
    case 'note':
      return 'A sealed note'
    case 'telegram':
      return lifelineOf(game.pack, 'telegram').heading!
    case 'expert':
      return 'On the telephone'
    default:
      return 'Strong coffee'
  }
})

const pike = computed(() => {
  const r = report.value
  if (r?.kind !== 'pike' || !game.ctx || !game.mystery) return null
  const items = game.mystery.evidence.filter((e) => r.itemIds.includes(e.id))
  return {
    room: roomName(game.ctx, r.room),
    items: items.map((e) => ({ id: e.id, name: e.name, proves: describeEvidence(game.ctx!, e), idle: e.fact.kind === 'flavor' })),
    lifelines: (game.mystery.lifelines ?? []).filter((l) => r.lifelineIds.includes(l.id)),
  }
})
const telegram = computed(() => {
  const r = report.value
  if (r?.kind !== 'telegram' || !game.ctx || !game.mystery) return null
  const item = game.mystery.evidence.find((e) => e.id === r.itemId)
  if (!item) return null
  const text =
    item.fact.kind === 'motiveDocument'
      ? wire(game.mystery.cast[r.char].shortName, game.mystery.victim.lastName, item.fact.rel)
      : ''
  return { card: evidenceCard(game, item), wire: text }
})
const expert = computed(() => {
  const r = report.value
  if (r?.kind !== 'expert' || !game.mystery) return null
  const e = expertFor(game.mystery.seed)
  const name = game.mystery.cast[r.char].shortName
  const fill = (t: string) => t.replaceAll('{name}', name)
  return {
    def: e,
    hello: fill(e.hello),
    verdict: fill(r.pillar ? e.cleared[r.pillar] : e.none),
    cards: [
      ...game.notebook.filter((n) => r.noteIds.includes(n.id)).map((n) => noteCard(game, n)),
      ...game.foundItems.filter((i) => r.itemIds.includes(i.id)).map((i) => evidenceCard(game, i)),
    ],
    pillar: r.pillar,
  }
})

function close() {
  sfx('page')
  game.lifelineReport = null
}
</script>

<template>
  <Overlay :open="open" :title="title" width="34rem" @close="close()">
    <!-- Sergeant Pike, back from his search -->
    <div v-if="pike" class="report">
      <div class="speaker">
        <Portrait :who="PIKE" shape="token" size="3rem" />
        <p>
          {{ say(`I’ve been through ${pike.room}, {sir}.`) }}
          {{ pike.items.some((i) => !i.idle) || pike.lifelines.length ? 'This is what I found.' : pike.items.length ? 'Only this, and nothing in it, I’m afraid.' : 'Nothing of note, I’m afraid.' }}
        </p>
      </div>
      <ul v-if="pike.items.length || pike.lifelines.length" class="finds">
        <li v-for="i in pike.items" :key="i.id" :class="{ idle: i.idle }">
          <ItemArt :item="i.id" size="2.4rem" />
          <span><strong>{{ i.name }}</strong><span class="small muted">: {{ i.proves }}</span></span>
        </li>
        <li v-for="l in pike.lifelines" :key="l.id">
          <LifelineArt :kind="l.kind" size="2.4rem" />
          <span><strong>{{ lifelineOf(game.pack, l.kind).name }}</strong><span class="small muted">: a lifeline, for your notebook</span></span>
        </li>
      </ul>
    </div>

    <!-- The Yard's wire -->
    <div v-else-if="telegram" class="report">
      <p class="wire">
        {{ telegram.wire }}
      </p>
      <p class="small muted">Added to your evidence. It may be pinned, and laid beside your notes.</p>
      <NoteCard :card="telegram.card" placed />
    </div>

    <!-- An expert opinion -->
    <div v-else-if="expert" class="report">
      <div class="speaker">
        <Portrait :who="expert.def.who" shape="token" size="3.4rem" />
        <div>
          <p class="hello">“{{ expert.hello }}”</p>
          <p>“{{ expert.verdict }}”</p>
        </div>
      </div>
      <template v-if="expert.pillar">
        <p v-if="expert.cards.length" class="small muted">What you have that bears it out:</p>
        <p v-else class="small muted">Nothing you have found yet bears it out, but it is so.</p>
        <div v-if="expert.cards.length" class="cards">
          <NoteCard v-for="c in expert.cards" :key="c.id" :card="c" placed />
        </div>
      </template>
    </div>

    <!-- The anonymous note, opened -->
    <div v-else-if="report?.kind === 'note'" class="report">
      <p class="small muted">No name, no hand you know. Only this:</p>
      <p class="anon">{{ noteText(game, report.hint) }}</p>
      <p v-if="report.hint.kind === 'room'" class="small muted">Somebody thinks it worth a search.</p>
      <p v-else-if="report.hint.kind === 'ask'" class="small muted">Somebody thinks it worth the asking.</p>
    </div>

    <!-- Coffee -->
    <div v-else class="report">
      <p>Strong, black, and still hot. Five more questions this hour.</p>
    </div>

    <template #actions>
      <button class="primary" data-confirm @click="close()">Very good</button>
    </template>
  </Overlay>
</template>

<style scoped>
.report {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
.report p {
  margin: 0;
  line-height: 1.5;
}
.speaker {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
}
.hello {
  margin-bottom: 0.4rem !important;
  color: var(--muted);
  font-style: italic;
}
.finds {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.5rem;
}
.finds li.idle {
  opacity: 0.65;
}
.finds li {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.finds strong {
  font-weight: normal;
}
.wire {
  padding: 0.8rem 1rem;
  background: #efe6c8;
  color: #2a241a;
  font-family: var(--font-type);
  font-size: 0.9rem;
  letter-spacing: 0.04em;
  line-height: 1.6 !important;
}
/* Cut-out capitals pasted to a scrap of paper. */
.anon {
  align-self: center;
  padding: 1rem 1.4rem;
  background: #ece2c4;
  color: #1a1612;
  font-family: var(--font-type);
  font-size: 1.35rem;
  letter-spacing: 0.08em;
  text-align: center;
  transform: rotate(-1.2deg);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4);
}
.cards {
  display: grid;
  gap: 0.5rem;
}
</style>

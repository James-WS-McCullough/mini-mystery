<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { describeEvidence } from '../engine/render'
import type { RoomId } from '../engine/types'
import { useGame } from '../stores/game'
import { useUi } from '../stores/ui'
import { sfx } from '../ui/audio'
import { lookOf } from '../ui/itemArt'
import { LIFELINES } from '../content/lifelines'
import LifelineArt from './LifelineArt.vue'
import { useKeys } from '../ui/keys'
import ActionBar from './ActionBar.vue'
import Icon from './Icon.vue'
import ItemArt from './ItemArt.vue'
import ManorMap from './ManorMap.vue'
import { enterAt } from '../ui/scroll'

const game = useGame()
const ui = useUi()
const rooms = computed(() => game.ctx?.pack.rooms ?? [])
const searchedRoomDef = computed(() => rooms.value.find((r) => r.id === game.lastSearchRoom))
const finds = computed(() =>
  game.lastSearchItems.map((item) => ({
    id: item.id,
    name: item.name,
    probative: item.fact.kind !== 'flavor',
    what: game.ctx ? lookOf(item, game.ctx.pack).label : '',
    proves: game.ctx ? describeEvidence(game.ctx, item) : '',
  })),
)

/** Help come upon in the room. */
const lifelines = computed(() =>
  (game.mystery?.lifelines ?? []).filter((l) => game.lastSearchLifelineIds.includes(l.id)),
)

/** The second room of an hour whose first held nothing. */
const again = computed(() => game.searchedAgainIn === game.round)
function searchAgain() {
  sfx('page')
  game.searchAgain()
}

function search(room: RoomId) {
  // A locked door rattles, and stays shut.
  sfx(game.isLocked(room) ? 'miss' : 'select')
  game.search(room)
}
function announce() {
  if (game.stage !== 'searched') return
  if (finds.value.some((f) => f.probative)) setTimeout(() => sfx('find'), 350)
}
onMounted(announce)
watch(() => game.stage, announce)

useKeys((key) => {
  if (ui.anyOpen) return false
  if ((key === ' ' || key === 'Enter') && game.stage === 'searched') {
    game.continueToQuestioning()
    return true
  }
  return false
})
</script>

<template>
  <div class="search">
    <Transition name="fade" mode="out-in" @enter="(el: Element) => enterAt(el)">
      <div v-if="game.stage === 'search'" key="choose" class="choose">
        <h2 class="heading">{{ again ? 'There is time for one more room' : 'Where will you search this hour?' }}</h2>
        <p v-if="game.lockedNotice" class="locked-notice" role="status">
          <Icon name="lock" /> {{ game.lockedNotice }}
        </p>
        <ManorMap mode="pick" @pick="search" />
        <ActionBar>
          <template #aside>
            <span class="small muted">Choose a room on the plan to search it.</span>
          </template>
          <button :disabled="!game.tutorLocks.skipSearch" @click="game.skipSearch()">
            {{ again ? 'On to the questioning' : 'Forgo the search this hour' }} <Icon name="forward" />
          </button>
        </ActionBar>
      </div>

      <div v-else key="result" class="found">
        <p class="deco"><span /></p>
        <h2 class="heading">{{ searchedRoomDef?.name }}</h2>
        <p class="narration">{{ game.lastSearchText }}</p>

        <div v-if="finds.length > 0 || lifelines.length > 0" class="finds">
          <article
            v-for="(f, i) in finds"
            :key="f.id"
            class="find paper"
            :class="{ probative: f.probative }"
            :style="{ animationDelay: `${0.35 + i * 0.22}s` }"
          >
            <span class="tagline">{{ f.what }}</span>
            <ItemArt :item="f.id" size="4.6rem" />
            <strong>{{ f.name }}</strong>
            <span class="proves">{{ f.proves }}</span>
            <span class="added">added to your evidence</span>
          </article>
          <article
            v-for="(l, i) in lifelines"
            :key="l.id"
            class="find paper lifeline"
            :style="{ animationDelay: `${0.35 + (finds.length + i) * 0.22}s` }"
          >
            <span class="tagline">A lifeline</span>
            <LifelineArt :kind="l.kind" size="4.6rem" />
            <strong>{{ LIFELINES[l.kind].name }}</strong>
            <span class="proves">{{ LIFELINES[l.kind].does }}</span>
            <span class="added">kept in your notebook, under Lifelines</span>
          </article>
        </div>
        <p v-else class="muted nothing">Nothing here for the notebook.</p>
        <p v-if="game.canSearchAgain" class="again-note">
          Nothing worth the time here. There is time yet to try another room.
        </p>

        <ActionBar centre>
          <button v-if="game.canSearchAgain" class="primary" data-next @click="searchAgain()">
            <Icon name="search" /> Search another room
          </button>
          <button
            v-spot="'onward'"
            :class="{ primary: !game.canSearchAgain }"
            :data-next="game.canSearchAgain ? undefined : ''"
            @click="game.continueToQuestioning()"
          >
            On to the questioning <Icon name="forward" />
          </button>
        </ActionBar>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.locked-notice {
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--brass);
  font-style: italic;
}
.search {
  max-width: 68rem;
  margin: 0 auto;
  padding: 1.4rem 1rem 3rem;
}
.choose,
.found {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  align-items: center;
}
.found {
  max-width: 46rem;
  margin: 3vh auto 0;
}
.skip {
  text-decoration: underline;
  text-underline-offset: 0.2em;
}
.narration {
  line-height: 1.65;
  font-style: italic;
  font-size: 1.1rem;
  margin: 0;
  text-align: center;
  animation: rise 0.5s ease-out both;
}
.finds {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  margin: 0.6rem 0;
}
.find {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  width: min(100%, 17rem);
  padding: 1.5rem 1rem 1rem;
  text-align: center;
  line-height: 1.4;
  animation: turn-up 0.6s cubic-bezier(0.2, 0.9, 0.3, 1.15) both;
}
.find:nth-child(odd) {
  rotate: -1.5deg;
}
.find:nth-child(even) {
  rotate: 1.2deg;
}
.find .icon {
  color: var(--paper-muted);
}
.find.probative .icon {
  color: #8a5a12;
}
.find.probative {
  box-shadow:
    0 0 0 2px var(--brass),
    0 0 26px rgba(212, 175, 74, 0.35),
    0 6px 16px rgba(0, 0, 0, 0.5);
}
.find.lifeline {
  border-color: #4f8a63;
  box-shadow: 0 0 0 2px rgba(79, 138, 99, 0.6), var(--shadow);
}
.tagline {
  position: absolute;
  top: 0.4rem;
  left: 0.6rem;
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--paper-muted);
}
.proves {
  font-size: 0.85rem;
  color: var(--paper-muted);
}
.added {
  margin-top: 0.3rem;
  padding-top: 0.3rem;
  border-top: 1px dashed var(--paper-line);
  width: 100%;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--paper-muted);
}
.nothing {
  font-style: italic;
  margin: 0;
}
.again-note {
  margin: 0;
  text-align: center;
  color: var(--brass);
}
@keyframes turn-up {
  from {
    opacity: 0;
    transform: translateY(26px) rotateX(70deg) scale(0.9);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>

<script setup lang="ts">
// The accusation: name one of the seven, and pin up to six exhibits to the
// board. The case stands on what is pinned and nothing else.
import { computed, ref } from 'vue'
import { useGame } from '../stores/game'
import { useUi } from '../stores/ui'
import { useKeys } from '../ui/keys'
import { sfx } from '../ui/audio'
import { evidenceCard, noteCard, threadCard } from '../ui/cards'
import ActionBar from './ActionBar.vue'
import DialogueBox from './DialogueBox.vue'
import Icon from './Icon.vue'
import NoteCard, { type CardData } from './NoteCard.vue'
import NoteDeck from './NoteDeck.vue'
import PillarRow from './PillarRow.vue'
import Portrait from './Portrait.vue'
import RoleText from './RoleText.vue'

const game = useGame()
const ui = useUi()
const cast = computed(() => game.mystery?.cast ?? [])
/** What is pinned to the board, in the order it will be argued. */
const pinned = computed<CardData[]>(() => [
  ...game.realized.filter((t) => game.citedThreadKeys.includes(t.key)).map((t) => threadCard(game, t)),
  ...game.foundItems.filter((e) => game.citedItemIds.includes(e.id)).map((e) => evidenceCard(game, e)),
  ...game.notebook.filter((n) => game.citedNoteIds.includes(n.id)).map((n) => noteCard(game, n)),
])
const emptySlots = computed(() => Math.max(0, game.citeCap - pinned.value.length))

function unpin(card: CardData) {
  sfx('click')
  if (card.kind === 'thread') game.toggleCiteThread(card.id)
  else if (card.kind === 'evidence') game.toggleCiteItem(card.id)
  else game.toggleCiteNote(card.id)
}
function accuse(id: number) {
  sfx('select')
  game.accusedId = id
}
function point() {
  sfx('gavel')
  game.submitAccusation()
}
// ---- the household, called together ----
const at = ref(0)
const heardUpTo = ref(-1)
const speaking = ref(false)
const box = ref<InstanceType<typeof DialogueBox> | null>(null)
const turn = computed(() => game.gathering[at.value] ?? game.gathering[0])
const last = computed(() => at.value >= game.gathering.length - 1)
function next() {
  heardUpTo.value = Math.max(heardUpTo.value, at.value)
  if (last.value) {
    sfx('select')
    game.gatheredOut()
    return
  }
  sfx('click')
  at.value++
}
useKeys((key) => {
  if (!game.gatheringPending || ui.anyOpen) return false
  if (key !== ' ' && key !== 'Enter') return false
  box.value?.tap()
  return true
})

/** Did they stand up and say it was them? */
const owned = (id: number) => game.confessions.some((c) => c.char === id)
function heard() {
  sfx('page')
  game.hearOut()
}
function back() {
  sfx('click')
  game.backToPlay()
}
</script>

<template>
  <main v-if="game.mystery && game.gatheringPending" class="called">
    <header>
      <p class="small brass before">{{ game.transitionToMidnight ? 'Midnight' : 'The household is called together' }}</p>
      <h2 class="heading">Before you speak</h2>
    </header>
    <p class="count small muted" aria-live="polite">
      <span
        v-for="(g, i) in game.gathering"
        :key="g.char"
        class="dot"
        :class="{ now: i === at, heard: i < at }"
      />
    </p>
    <Transition name="step" mode="out-in">
      <div :key="turn.char" class="floor">
        <Portrait :who="game.mystery.cast[turn.char].defId" size="clamp(7rem, 22vw, 10rem)" :mood="speaking ? 'speaking' : 'idle'" />
        <DialogueBox
          ref="box"
          class="box"
          :speaker="game.mystery.cast[turn.char].shortName"
          :who="game.mystery.cast[turn.char].defId"
          :text="turn.text"
          :fresh="at > heardUpTo"
          more
          @typing="speaking = true"
          @done="speaking = false"
          @advance="next()"
        />
      </div>
    </Transition>
    <ActionBar>
      <template #aside>
        <span class="small muted">{{ at + 1 }} of {{ game.gathering.length }}</span>
      </template>
      <button class="primary" data-next @click="box?.done ? next() : box?.tap()">
        {{ last ? 'Speak' : 'Next' }} <kbd>space</kbd>
      </button>
    </ActionBar>
  </main>
  <div v-else-if="game.mystery && game.confessionsPending" class="owning">
    <p class="small brass before">Before you can name anybody</p>
    <article v-for="c in game.confessions" :key="c.char" class="stands">
      <Portrait :who="game.mystery.cast[c.char].defId" size="clamp(6rem, 20vw, 9rem)" mood="slump" />
      <div class="says">
        <h3 class="brass">{{ game.mystery.cast[c.char].name }} stands.</h3>
        <p class="words">“<RoleText :text="c.text" />”</p>
      </div>
    </article>
    <p class="lede">
      {{
        game.confessions.length > 1
          ? 'One hand did it, and two have owned to it. One of them would hang for the other.'
          : 'It may be the truth. It may be somebody who would hang in the murderer’s place — and who lacked the means, or the motive, or the chance.'
      }}
      The name is still yours to give.
    </p>
    <ActionBar>
      <button class="primary" data-next @click="heard()">
        To the accusation <Icon name="forward" />
      </button>
    </ActionBar>
  </div>
  <div v-else-if="game.mystery" class="accuse">
    <header class="head">
      <h2 class="heading">The Accusation</h2>
      <p class="lede">
        Name the murderer of {{ game.mystery.caseSheet.victimName }}, and pin up what shows they had
        the means, the motive and the opportunity. Whether anybody else could have done it will be
        judged on the whole night’s work.
      </p>
    </header>

    <section class="lineup" aria-label="The seven">
      <button
        v-for="m in cast"
        :key="m.id"
        class="suspect"
        :class="{ accused: game.accusedId === m.id, dead: game.dead === m.id, owned: owned(m.id) }"
        :aria-pressed="game.accusedId === m.id"
        :disabled="game.dead === m.id"
        @click="accuse(m.id)"
      >
        <Portrait
          :who="m.defId"
          size="4.2rem"
          :dim="game.ruledOut.includes(m.id) && game.accusedId !== m.id"
        />
        <span class="name">{{ m.shortName }}</span>
        <span v-if="game.caughtLying.has(m.id)" class="state">
          <Icon name="mask" title="caught lying" />
        </span>
        <PillarRow :pillars="game.signsOf(m.id)" :of="m.shortName" />
        <span v-if="game.dead === m.id" class="tag late">dead</span>
        <span v-else-if="game.accusedId === m.id" class="tag">accused</span>
        <span v-else-if="owned(m.id)" class="tag said">says they did it</span>
      </button>
    </section>

    <section class="cork" aria-label="The case board">
      <h3>
        The case board
        <span class="cap">{{ game.citeCount }} / {{ game.citeCap }} pinned</span>
      </h3>
      <div class="pins">
        <div v-for="c in pinned" :key="c.id" class="pinned">
          <NoteCard :card="c" placed />
          <button class="unpin" :aria-label="`Unpin: ${c.main}`" @click="unpin(c)">
            <Icon name="close" />
          </button>
        </div>
        <div v-for="i in emptySlots" :key="`empty-${i}`" class="empty">
          <Icon name="pin" />
        </div>
      </div>
    </section>

    <NoteDeck mode="cite" class="cite" />

    <ActionBar>
      <template #aside>
        <button v-if="!game.accusationForced" @click="back()">
          <Icon name="back" /> Not yet — back to the questioning
        </button>
        <span v-else class="small muted">
          {{ game.confessions.length > 0 && !game.transitionToMidnight ? 'It has been said. There is no going back.' : 'Midnight. There is no going back.' }}
        </span>
      </template>
      <button class="danger big" :disabled="game.accusedId === null" @click="point()">
        <Icon name="scales" /> Point the finger
      </button>
    </ActionBar>
  </div>
</template>

<style scoped>
.accuse {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 70rem;
  margin: 0 auto;
  padding: 1.6rem 1rem 1rem;
}
.head {
  text-align: center;
}
.lede {
  margin-top: 0.3rem;
}
.lineup {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.45rem;
}
@media (max-width: 900px) {
  .lineup {
    grid-template-columns: repeat(4, 1fr);
  }
}
@media (max-width: 520px) {
  .lineup {
    grid-template-columns: repeat(2, 1fr);
  }
}
.suspect {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.7rem 0.25rem 0.6rem;
  position: relative;
}
.suspect .name {
  font-family: var(--font-display);
  letter-spacing: 0.05em;
  font-size: 0.95rem;
  margin-top: 0.25rem;
}
.suspect.accused {
  border-color: var(--danger);
  background: linear-gradient(180deg, #4a2320, var(--danger-deep));
  box-shadow: 0 0 26px rgba(192, 71, 60, 0.45);
  transform: translateY(-4px);
}
.state {
  font-size: 0.95rem;
}
.state.cleared {
  color: var(--good);
}
.state.sole {
  color: #ee7c6f;
}
.state.open {
  color: var(--muted);
}
.tag {
  font-size: 0.7rem;
  color: #f0b0a8;
  text-transform: uppercase;
  letter-spacing: 0.16em;
}
.verdictline {
  margin: 0;
  text-align: center;
}
.cork {
  padding: 0.8rem 0.9rem 1rem;
  border: 6px solid #3b2a1a;
  background:
    radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.05) 0 1px, transparent 1.5px) 0 0 / 7px 7px,
    radial-gradient(circle at 70% 60%, rgba(0, 0, 0, 0.2) 0 1px, transparent 1.5px) 0 0 / 9px 9px,
    linear-gradient(160deg, #6f5234, #563d25);
  box-shadow:
    inset 0 0 30px rgba(0, 0, 0, 0.55),
    var(--shadow);
}
.cork h3 {
  margin: 0 0 0.6rem;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 1rem;
  text-transform: uppercase;
  color: #f1e3c0;
  text-shadow: 0 1px 2px #000;
}
.cap {
  font-family: var(--font-type);
  font-size: 0.8rem;
  letter-spacing: 0.04em;
}
.pins {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  gap: 0.8rem;
}
.pinned {
  position: relative;
}
.pinned:nth-child(odd) {
  rotate: -1deg;
}
.pinned:nth-child(even) {
  rotate: 0.8deg;
}
.pinned::before {
  content: '';
  position: absolute;
  z-index: 1;
  top: -0.4rem;
  left: 50%;
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #ff8b7e, #a3261c);
  box-shadow: 0 3px 4px rgba(0, 0, 0, 0.6);
}
.unpin {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  padding: 0.2rem 0.35rem;
  background: transparent;
  border-color: transparent;
  color: var(--paper-muted);
}
.unpin:hover:not(:disabled) {
  color: var(--paper-ink);
  border-color: var(--paper-line);
  box-shadow: none;
}
.empty {
  min-height: 6.2rem;
  display: grid;
  place-items: center;
  border: 2px dashed rgba(241, 227, 192, 0.3);
  color: rgba(241, 227, 192, 0.35);
  font-size: 1.3rem;
}
.foot {
  position: sticky;
  bottom: 0;
  z-index: 4;
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  align-items: center;
  justify-content: center;
  padding: 0.8rem 0 1rem;
  background: linear-gradient(180deg, transparent, var(--bg) 35%);
}
.big {
  font-family: var(--font-display);
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 1.05rem;
  padding: 0.7rem 1.6rem;
  background: linear-gradient(180deg, #7a2d26, #4a1b17);
  color: #ffe2dd;
}
.owning {
  max-width: 46rem;
  margin: 0 auto;
  padding: 2.4rem 1rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  text-align: center;
}
.before {
  margin: 0;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}
.stands {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  padding: 1.2rem;
  border: 1px solid var(--danger);
  background: linear-gradient(180deg, rgba(58, 27, 24, 0.55), rgba(23, 28, 35, 0.8));
  text-align: left;
  animation: stand 0.7s ease-out both;
}
.stands:nth-of-type(2) {
  animation-delay: 0.5s;
}
.stands h3 {
  margin: 0 0 0.3rem;
}
.words {
  margin: 0;
  font-size: 1.15rem;
  line-height: 1.5;
}
@keyframes stand {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
}
@media (max-width: 520px) {
  .stands {
    flex-direction: column;
    text-align: center;
  }
}
.suspect.dead {
  opacity: 0.45;
  border-style: dashed;
}
.tag.late,
.tag.said {
  color: #f0b0a8;
}
.called {
  max-width: 44rem;
  margin: 0 auto;
  padding: 2rem 1rem 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
}
.called header {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.called header h2 {
  margin: 0;
}
.count {
  display: flex;
  gap: 0.4rem;
  margin: 0;
}
.dot {
  width: 0.5rem;
  height: 0.5rem;
  border: 1px solid var(--brass-dim);
  transform: rotate(45deg);
}
.dot.now {
  background: var(--brass);
  border-color: var(--brass);
}
.dot.heard {
  background: var(--brass-dim);
}
.floor {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
.floor .box {
  width: 100%;
  text-align: left;
}
.step-enter-active,
.step-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.step-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.step-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>

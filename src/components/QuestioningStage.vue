<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { inRoom, meansLabel, traitLabelOf } from '../engine/render'
import type { CastMember, Person, QuestionKey, RoleId } from '../engine/types'
import { useGame, type LogEntry } from '../stores/game'
import { useUi } from '../stores/ui'
import { sfx } from '../ui/audio'
import { useKeys } from '../ui/keys'
import ActionBar from './ActionBar.vue'
import DialogueBox from './DialogueBox.vue'
import Icon, { type IconName } from './Icon.vue'
import ItemArt from './ItemArt.vue'
import PillarRow from './PillarRow.vue'
import Portrait from './Portrait.vue'
import RoleTag from './RoleTag.vue'
import RoleText from './RoleText.vue'

type Menu = 'main' | 'show' | 'record'

const game = useGame()
const ui = useUi()
const menu = ref<Menu>('main')
const speaking = ref(false)
const reaction = ref<'idle' | 'flinch' | 'slump'>('idle')
const transcript = ref<HTMLElement | null>(null)
const box = ref<InstanceType<typeof DialogueBox> | null>(null)
/** Lines logged before this id were heard on an earlier visit: no retyping. */
const heardUpTo = ref(-1)

const cast = computed(() => game.mystery?.cast ?? [])
const who = computed(() =>
  game.activeChar !== null && game.mystery ? game.mystery.cast[game.activeChar] : null,
)
const canAsk = computed(() => game.questionsLeft > 0)
const convo = computed(() => (game.activeChar !== null ? game.convoOf(game.activeChar) : []))

/** An answer being read back: asked before, and costing nothing to hear again. */
const replayed = ref<{ line: LogEntry; prompt: string } | null>(null)

/** The line in the box: the latest thing they said, and what prompted it. */
const current = computed(() => {
  if (replayed.value) return replayed.value
  const list = convo.value
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].kind !== 'speech') continue
    const before = list[i - 1]
    return {
      line: list[i],
      prompt: before && before.kind === 'detective' ? before.text : '',
    }
  }
  return null
})

/** What the sitter has just put into the detective's hands. */
const gift = computed(() => {
  const g = game.lastGift
  if (!g || g.from !== game.activeChar || !game.ctx) return null
  const item = game.mystery?.evidence.find((e) => e.id === g.item)
  if (!item) return null
  return { id: item.id, name: item.name, room: inRoom(game.ctx, item.room) }
})

const traitOf = (m: CastMember) => (game.ctx ? traitLabelOf(game.ctx, m) : m.trait)
const meansLabels = (ids: string[]) => ids.map((id) => (game.ctx ? meansLabel(game.ctx, id) : id))

/** Only what the detective has proved. Who is cleared is for them to decide. */
function statusOf(id: number): { icon: IconName; label: string; tone: string }[] {
  const out: { icon: IconName; label: string; tone: string }[] = []
  if (game.caughtLying.has(id)) out.push({ icon: 'mask', label: 'caught lying', tone: 'bad' })
  return out
}
const struckOff = (id: number) => game.ruledOut.includes(id)
/** The detective's own mark against somebody: theirs to make, and to get wrong. */
function sign(id: number, which: 'means' | 'motive' | 'opportunity') {
  sfx('scratch')
  game.cycleSign(id, which)
}
function strike(id: number) {
  sfx(struckOff(id) ? 'click' : 'scratch')
  game.toggleRuledOut(id)
}

function sit(id: number) {
  sfx('select')
  replayed.value = null
  heardUpTo.value = game.log.length > 0 ? game.log[game.log.length - 1].id : -1
  menu.value = 'main'
  reaction.value = 'idle'
  game.activeChar = id
}
function leave() {
  sfx('click')
  replayed.value = null
  game.activeChar = null
}

/** The role they have most lately laid claim to, if any. It is only their word. */
function claimOf(id: number): RoleId | null {
  let role: RoleId | null = null
  for (const n of game.notebook) {
    if (n.speaker === id && n.claim.kind === 'role') role = n.claim.role
  }
  return role
}

/** Where a question stands with whoever is in the chair. */
const stateOf = (q: QuestionKey | 'press') =>
  game.activeChar === null ? 'fresh' : game.questionState(game.activeChar, q)

/**
 * Put a question — or, if they have answered it already, have the answer
 * read back. Reading back spends nothing.
 */
function put(q: QuestionKey | 'press') {
  if (game.activeChar === null) return
  if (stateOf(q) === 'done') {
    const before = game.lastAnswer(game.activeChar, q)
    if (!before) return
    sfx('page')
    // A fresh copy, so that the same answer asked for twice is typed out twice.
    replayed.value = { prompt: before.prompt, line: { ...before.line } }
    heardUpTo.value = -1
    return
  }
  if (!canAsk.value) return
  replayed.value = null
  if (q === 'press') {
    sfx('gavel')
    game.press(game.activeChar)
  } else {
    sfx('click')
    game.ask(game.activeChar, q)
  }
}
function ask(kind: 'alibi' | 'knowledge' | 'suspect') {
  put({ kind })
}
function askAbout(person: Person) {
  put({ kind: 'aboutPerson', person })
  menu.value = 'main'
}
function showEvidence(item: string) {
  put({ kind: 'aboutEvidence', item })
  menu.value = 'main'
}
function press() {
  put('press')
}
/** Ending the hour with questions in hand is asked twice. */
const sure = ref(false)
function endHour() {
  if (game.questionsLeft > 0 && !sure.value) {
    sfx('click')
    sure.value = true
    return
  }
  sure.value = false
  sfx('select')
  game.strikeHour()
}
function compare() {
  sfx('page')
  game.beginDeduce()
}
watch(
  () => [game.activeChar, game.questionsLeft],
  () => (sure.value = false),
)

function open(m: Menu) {
  sfx(m === 'record' ? 'page' : 'click')
  menu.value = menu.value === m ? 'main' : m
}

interface Choice {
  key: string
  label: string
  icon: IconName
  run: () => void
  needsQuestion: boolean
  danger?: boolean
  /** The question it puts, where it puts one: for showing what has been asked. */
  q?: QuestionKey | 'press'
}
/** Asked and answered: it may be heard again for nothing. */
const answered = (c: Choice) => c.q !== undefined && stateOf(c.q) === 'done'
/** Asked, and only half answered. */
const halfAnswered = (c: Choice) => c.q !== undefined && stateOf(c.q) === 'more'
const usable = (c: Choice) => answered(c) || !c.needsQuestion || canAsk.value
const choices = computed<Choice[]>(() => {
  const list: Choice[] = [
    { key: '1', label: 'Where were you?', icon: 'steps', run: () => ask('alibi'), needsQuestion: true, q: { kind: 'alibi' } },
    { key: '2', label: 'Who are you, and what do you know?', icon: 'mask', run: () => ask('knowledge'), needsQuestion: true, q: { kind: 'knowledge' } },
    { key: '3', label: 'Whom do you suspect?', icon: 'question', run: () => ask('suspect'), needsQuestion: true, q: { kind: 'suspect' } },
    {
      key: '4',
      label: `How did you stand with ${game.ctx?.pack.victim.shortName ?? 'him'}?`,
      icon: 'heart',
      run: () => askAbout('victim'),
      needsQuestion: true,
      q: { kind: 'aboutPerson', person: 'victim' },
    },
  ]
  if (game.foundItems.length > 0) {
    list.push({ key: '5', label: 'Show evidence…', icon: 'gem', run: () => open('show'), needsQuestion: true })
  }
  if (who.value && game.pressable.has(who.value.id)) {
    list.push({
      key: String(list.length + 1),
      label: 'Press them',
      icon: 'bolt',
      run: press,
      needsQuestion: true,
      danger: true,
      q: 'press',
    })
  }
  return list
})

// A new line from the sitter: how do they take it?
watch(
  () => convo.value.length,
  () => (replayed.value = null),
)
watch(
  () => current.value?.line.id,
  () => {
    const mood = current.value?.line.mood
    const fresh = (current.value?.line.id ?? -1) > heardUpTo.value
    reaction.value = 'idle'
    if (!fresh || !mood) return
    void nextTick(() => (reaction.value = mood === 'confessed' ? 'slump' : 'flinch'))
  },
)
const mood = computed(() =>
  reaction.value !== 'idle' ? reaction.value : speaking.value ? 'speaking' : 'idle',
)

watch(menu, async (m) => {
  if (m !== 'record') return
  await nextTick()
  transcript.value?.scrollTo({ top: transcript.value.scrollHeight })
})

function name(id?: number): string {
  return id !== undefined ? (cast.value[id]?.shortName ?? '') : ''
}

useKeys((key) => {
  if (game.notebookOpen || ui.anyOpen) return false
  if (who.value === null) {
    const n = Number(key)
    if (n >= 1 && n <= cast.value.length) {
      sit(cast.value[n - 1].id)
      return true
    }
    return false
  }
  if (key === 'Escape' || key === 'Backspace') {
    if (menu.value !== 'main') menu.value = 'main'
    else leave()
    return true
  }
  if (key === ' ' || key === 'Enter') {
    box.value?.tap()
    return true
  }
  if (key === 'r') {
    open('record')
    return true
  }
  if (key === 'x') {
    strike(who.value.id)
    return true
  }
  if (menu.value === 'main') {
    const choice = choices.value.find((c) => c.key === key)
    if (choice && usable(choice)) {
      choice.run()
      return true
    }
  }
  return false
})
</script>

<template>
  <ActionBar>
    <template #aside>
      <button v-if="who !== null" @click="leave()"><Icon name="back" /> The household</button>
      <button class="compare" title="Lay your notes side by side (C)" @click="compare()">
        <Icon name="link" /> Compare notes
      </button>
    </template>
    <!-- The hour is ended from the household, never from somebody's chair. -->
    <template v-if="who !== null" />
    <template v-else-if="sure">
      <span class="small sure">{{ game.questionsLeft }} unasked. End the hour?</span>
      <button @click="sure = false">Not yet</button>
      <button class="primary" @click="endHour()">Let it strike</button>
    </template>
    <button v-else :class="{ primary: game.questionsLeft === 0 }" data-next @click="endHour()">
      {{ game.isLastRound ? 'Face midnight' : 'Let the hour strike' }} <Icon name="forward" />
    </button>
  </ActionBar>
  <Transition name="fade" mode="out-in">
    <!-- The gallery of suspects -->
    <div v-if="who === null" key="gallery" class="suspects">
      <h2 class="heading">Whom will you question?</h2>
      <p class="lede">
        {{
          game.questionsLeft > 0
            ? `${game.questionsLeft} question${game.questionsLeft === 1 ? '' : 's'} before the hour strikes.`
            : 'The hour has run out of questions.'
        }}
        Compare your notes whenever two of them seem not to agree.
      </p>
      <p class="legend small muted">
        <Icon name="key" /> means · <Icon name="heart" /> motive · <Icon name="steps" /> opportunity:
        yours to mark, as you judge. Click one to set it
        <span class="against">against them</span>, again to
        <span class="cleared">rule it out</span>, again to clear it.
      </p>
      <div class="grid">
        <div
          v-for="(m, i) in cast"
          :key="m.id"
          class="suspect"
          :class="{ struck: struckOff(m.id), flagged: game.pressable.has(m.id) }"
          :style="{ animationDelay: `${i * 0.05}s` }"
        >
          <button class="sit" @click="sit(m.id)">
          <kbd class="hotkey">{{ i + 1 }}</kbd>
          <Portrait :who="m.defId" size="5.6rem" :dim="struckOff(m.id)" />
          <strong class="who-name">
            {{ m.shortName }}
            <span
              v-for="s in statusOf(m.id)"
              :key="s.icon"
              :title="s.label"
              class="status"
              :class="s.tone"
            >
              <Icon :name="s.icon" :title="s.label" />
            </span>
          </strong>
          <span class="small muted">{{ m.title }}</span>
          <span class="small muted">№{{ m.seat }} · {{ traitOf(m) }}</span>
          <span class="claim small">
            <template v-if="claimOf(m.id)">says: <RoleTag :role="claimOf(m.id)!" /></template>
            <span v-else class="muted">has not said who they are</span>
          </span>
          <span class="meta">
            <span v-if="game.statementsBy(m.id) > 0" class="small muted">
              {{ game.statementsBy(m.id) }} statement{{ game.statementsBy(m.id) === 1 ? '' : 's' }}
            </span>
            <span v-if="game.pressable.has(m.id)" class="flag" title="A contradiction stands against them">
              <Icon name="bolt" /> contradiction
            </span>
          </span>
          </button>
          <PillarRow
            class="signs"
            :pillars="game.signsOf(m.id)"
            :of="m.shortName"
            editable
            @cycle="sign(m.id, $event)"
          />
          <button
            class="strike ghost small"
            :aria-pressed="struckOff(m.id)"
            :aria-label="`${struckOff(m.id) ? 'Put back on the list' : 'Rule out'}: ${m.shortName}`"
            @click="strike(m.id)"
          >
            <Icon :name="struckOff(m.id) ? 'back' : 'close'" />
            {{ struckOff(m.id) ? 'put back' : 'rule out' }}
          </button>
        </div>
      </div>
    </div>

    <!-- The interview -->
    <div v-else key="interview" class="interview">
      <aside class="sitter">
        <Portrait :who="who.defId" size="clamp(6.5rem, 17vw, 11rem)" :mood="mood" />
        <h3 class="brass">{{ who.name }}</h3>
        <p class="small muted title">{{ who.title }}</p>
        <p v-if="claimOf(who.id)" class="small claim">says: <RoleTag :role="claimOf(who.id)!" /></p>
        <ul class="known small">
          <li><Icon name="pin" /> №{{ who.seat }} at table</li>
          <li><Icon name="eye" /> {{ traitOf(who) }}</li>
          <li v-for="line in meansLabels(who.means)" :key="line"><Icon name="key" /> {{ line }}</li>
        </ul>
        <PillarRow
          :pillars="game.signsOf(who.id)"
          :of="who.shortName"
          labelled
          editable
          @cycle="sign(who.id, $event)"
        />
        <button class="strike small" :aria-pressed="struckOff(who.id)" @click="strike(who.id)">
          <kbd>X</kbd>
          {{ struckOff(who.id) ? 'Ruled out — put back' : 'Rule them out' }}
        </button>
        <p v-for="s in statusOf(who.id)" :key="s.icon" class="small status" :class="s.tone">
          <Icon :name="s.icon" /> {{ s.label }}
        </p>
        <p v-if="game.pressable.has(who.id)" class="small flag">
          <Icon name="bolt" /> a contradiction stands against them
        </p>
      </aside>

      <section class="room">
        <DialogueBox
          v-if="current"
          ref="box"
          :speaker="name(current.line.speaker)"
          :who="who.defId"
          :prompt="current.prompt"
          :text="current.line.text"
          :fresh="current.line.id > heardUpTo"
          @typing="speaking = true"
          @done="speaking = false"
        />
        <div v-else class="frame waiting muted">They wait for your first question.</div>

        <Transition name="fade">
          <p v-if="gift" class="gift paper">
            <ItemArt :item="gift.id" size="3rem" />
            <span>
              <strong>Handed to you:</strong> {{ gift.name }}
              <span class="small">— taken up, they say, {{ gift.room }}. Added to your evidence.</span>
            </span>
          </p>
        </Transition>

        <!-- What to ask -->
        <div v-if="menu === 'main'" class="choices">
          <button
            v-for="c in choices"
            :key="c.key"
            class="choice"
            :class="{ danger: c.danger, asked: answered(c) }"
            :disabled="!usable(c)"
            :title="answered(c) ? 'Asked and answered — hear it again, for nothing' : undefined"
            @click="c.run()"
          >
            <kbd>{{ c.key }}</kbd>
            <Icon :name="answered(c) ? 'check' : c.icon" />
            <span>
              {{ c.label }}
              <small v-if="answered(c)" class="again">asked — hear it again</small>
              <small v-else-if="halfAnswered(c)" class="again more">they were vague — ask again</small>
            </span>
          </button>
          <button class="choice quiet" @click="open('record')">
            <kbd>R</kbd>
            <Icon name="book" />
            <span>Read back the record</span>
          </button>
          <p v-if="!canAsk" class="small muted spent">
            No questions left this hour — compare your notes, or let the hour strike, below.
          </p>
        </div>

        <!-- Show evidence -->
        <div v-else-if="menu === 'show'" class="picker">
          <div class="picker-head">
            <span class="brass">Show them…</span>
            <button class="ghost" @click="menu = 'main'"><Icon name="back" /> back</button>
          </div>
          <div class="tray">
            <button
              v-for="e in game.foundItems"
              :key="e.id"
              class="exhibit paper"
              :class="{ asked: stateOf({ kind: 'aboutEvidence', item: e.id }) === 'done' }"
              :disabled="stateOf({ kind: 'aboutEvidence', item: e.id }) !== 'done' && !canAsk"
              @click="showEvidence(e.id)"
            >
              <ItemArt :item="e.id" size="3.6rem" />
              <span>{{ e.name }}</span>
              <small v-if="stateOf({ kind: 'aboutEvidence', item: e.id }) === 'done'" class="again">
                shown — hear it again
              </small>
            </button>
          </div>
        </div>

        <!-- The record of the interview so far -->
        <div v-else class="picker">
          <div class="picker-head">
            <span class="brass">The record</span>
            <button class="ghost" @click="menu = 'main'"><Icon name="back" /> back</button>
          </div>
          <div ref="transcript" class="transcript">
            <div v-for="e in convo" :key="e.id" class="line" :class="e.kind">
              <template v-if="e.kind === 'speech'">
                <span class="speaker brass">{{ name(e.speaker) }}:</span> “<RoleText :text="e.text" />”
              </template>
              <template v-else><RoleText :text="e.text" /></template>
            </div>
          </div>
        </div>
      </section>
    </div>
  </Transition>
</template>

<style scoped>
.suspects {
  max-width: 66rem;
  margin: 0 auto;
  padding: 1.8rem 1rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.onward,
.legend {
  margin: 0;
  text-align: center;
}
.legend .against {
  color: #ee7c6f;
}
.legend .cleared {
  color: var(--good);
  text-decoration: line-through;
}
.sure {
  color: #f0b0a8;
}
.claim {
  margin: 0;
  min-height: 1.5rem;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: 0.7rem;
}
.suspect {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--line);
  border-radius: 2px;
  background: linear-gradient(180deg, var(--panel-2), var(--panel));
  animation: rise 0.4s ease-out both;
  transition:
    border-color 0.15s ease,
    transform 0.12s ease;
}
.suspect:hover {
  border-color: var(--brass);
  transform: translateY(-4px);
}
.suspect.struck .sit {
  opacity: 0.6;
}
.suspect.struck .who-name {
  text-decoration: line-through;
  text-decoration-color: var(--danger);
  text-decoration-thickness: 2px;
}
.sit {
  position: relative;
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.22rem;
  padding: 1.1rem 0.6rem 0.6rem;
  background: transparent;
  border: 0;
  box-shadow: none;
}
.sit:hover:not(:disabled) {
  box-shadow: none;
  transform: none;
}
.signs {
  justify-content: center;
  padding: 0.1rem 0 0.35rem;
}
.suspects .strike {
  width: 100%;
  border-top: 1px solid var(--line);
  border-radius: 0;
  padding: 0.3rem;
}
.sitter .strike {
  margin-top: 0.4rem;
}
.strike[aria-pressed='true'] {
  color: #f0b0a8;
}
.suspect.flagged {
  border-color: var(--brass-dim);
}
.hotkey {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
}
.who-name {
  margin-top: 0.4rem;
  font-family: var(--font-display);
  font-weight: normal;
  letter-spacing: 0.06em;
  font-size: 1.1rem;
  color: var(--brass);
}
.status.good {
  color: var(--good);
}
.status.bad {
  color: #ee7c6f;
}
.meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 1.2rem;
}
.flag {
  color: var(--brass);
  font-size: 0.82rem;
}

.interview {
  display: grid;
  grid-template-columns: minmax(12rem, 16rem) 1fr;
  gap: 1.5rem;
  max-width: 66rem;
  margin: 0 auto;
  padding: 1.4rem 1rem 2.5rem;
  align-items: start;
}
@media (max-width: 820px) {
  .interview {
    grid-template-columns: 1fr;
    gap: 1.3rem;
  }
  .known {
    display: none;
  }
}
.sitter {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  text-align: center;
}
.sitter h3 {
  margin: 0.5rem 0 0;
}
.sitter p {
  margin: 0;
}
.title {
  font-style: italic;
}
.back {
  align-self: flex-start;
  margin-bottom: 0.3rem;
}
.known {
  list-style: none;
  margin: 0.3rem 0 0.5rem;
  padding: 0.5rem 0 0;
  border-top: 1px solid var(--line);
  width: 100%;
  display: grid;
  gap: 0.15rem;
  text-align: left;
  opacity: 0.85;
}
.known .icon {
  color: var(--brass-dim);
  margin-right: 0.2rem;
}
.room {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
  padding-top: 1rem;
}
.gift {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin: 0;
  padding: 0.6rem 0.9rem;
  font-family: var(--font-type);
  font-size: 0.9rem;
  line-height: 1.45;
  color: var(--paper-ink);
  animation: rise 0.3s ease-out both;
}
.gift strong {
  font-weight: normal;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.gift .small {
  color: var(--paper-muted);
}
.waiting {
  min-height: 8.5rem;
  display: grid;
  place-items: center;
  font-style: italic;
}
.choices {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
  gap: 0.45rem;
}
.choice {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-align: left;
  padding: 0.62rem 0.8rem;
  font-size: 1.02rem;
}
.choice:hover:not(:disabled) {
  transform: translateX(4px);
}
.choice .icon {
  color: var(--brass);
}
.choice.danger .icon {
  color: #ee7c6f;
}
.choice.asked {
  opacity: 0.55;
}
.choice.asked .icon {
  color: var(--muted);
}
.again {
  display: block;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  color: var(--muted);
}
.again.more {
  color: var(--brass);
}
.exhibit.asked {
  opacity: 0.6;
}
.exhibit .again {
  color: var(--paper-muted);
}
.choice.quiet {
  color: var(--muted);
  background: transparent;
}
.spent {
  grid-column: 1 / -1;
  margin: 0.2rem 0 0;
  font-style: italic;
}
.picker {
  border: 1px solid var(--line);
  background: rgba(14, 18, 23, 0.85);
  padding: 0.7rem 0.8rem 0.8rem;
  animation: rise 0.25s ease-out both;
}
.picker-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-family: var(--font-display);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.people {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr));
  gap: 0.45rem;
}
.person {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  padding: 0.6rem 0.4rem;
}
.tray {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}
.exhibit {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  width: 11rem;
  padding: 0.8rem 0.6rem;
  border: 0;
  color: var(--paper-ink);
  font-family: var(--font-type);
  font-size: 0.88rem;
  line-height: 1.35;
  text-align: center;
}
.exhibit:hover:not(:disabled) {
  transform: translateY(-4px) rotate(-1deg);
  box-shadow:
    0 0 0 2px var(--brass),
    0 8px 18px rgba(0, 0, 0, 0.6);
}
.transcript {
  max-height: 42vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding-right: 0.4rem;
}
.line {
  line-height: 1.5;
}
.line.detective {
  color: var(--muted);
  font-style: italic;
}
.speaker {
  margin-right: 0.3rem;
}
/* On a narrow screen the sitter's particulars give way to the conversation. */
@media (max-width: 820px) {
  .known,
  .sitter .status,
  .sitter .flag {
    display: none;
  }
  .room {
    padding-top: 0.4rem;
  }
}
</style>

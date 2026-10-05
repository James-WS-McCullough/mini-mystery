<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { inRoom, meansLabel, traitLabelOf } from '../engine/render'
import type { CastMember, Person, QuestionKey } from '../engine/types'
import { useGame, type LogEntry } from '../stores/game'
import { useUi } from '../stores/ui'
import { sfx } from '../ui/audio'
import { namedBy } from '../ui/itemArt'
import { useKeys } from '../ui/keys'
import ActionBar from './ActionBar.vue'
import BackLink from './BackLink.vue'
import DialogueBox from './DialogueBox.vue'
import Icon, { type IconName } from './Icon.vue'
import ItemArt from './ItemArt.vue'
import type { Pillars, PillarState } from '../engine/verdict'
import PillarRow from './PillarRow.vue'
import Portrait from './Portrait.vue'
import RoleMark from './RoleMark.vue'
import RoleText from './RoleText.vue'
import { enterAt, sceneOf } from '../ui/scroll'

type Menu = 'main' | 'show' | 'record'

const game = useGame()
const ui = useUi()
const menu = ref<Menu>('main')
const speaking = ref(false)
/** On a narrow screen a guest's trait and means are folded away; open, they stay open from guest to guest. */
const showKnown = ref(false)
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
/** Whom Sergeant Pike would have asked, and what, on a night he is teaching. */
const mayAsk = (id: number) => !game.tutorLocks.guests || game.tutorLocks.guests.includes(id)
const mayPut = (q: QuestionKey['kind'] | 'press') => {
  const locks = game.tutorLocks
  const questions = (game.activeChar !== null && locks.questionsOf?.[game.activeChar]) || locks.questions
  return !questions || questions.includes(q)
}
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
function sign(id: number, mark: { sign: keyof Pillars; to: PillarState }) {
  sfx(mark.to === 'unknown' ? 'click' : 'scratch')
  game.setSign(id, mark.sign, mark.to)
}
function strike(id: number) {
  sfx(struckOff(id) ? 'click' : 'scratch')
  game.toggleRuledOut(id)
}

function sit(id: number) {
  // The dead answer no questions; nor, while the sergeant is teaching, anyone he has not come to.
  if (game.dead === id || !mayAsk(id)) return
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
/** How far down the gallery was, to come back to from a guest. A guest's page starts at the top. */
let galleryAt = 0
function leaving(el: Element) {
  if (el.classList.contains('suspects')) galleryAt = sceneOf(el)?.scrollTop ?? 0
}
function entering(el: Element) {
  enterAt(el, el.classList.contains('suspects') ? galleryAt : 0)
}


/** Where a question stands with whoever is in the chair. */
const stateOf = (q: QuestionKey | 'press') =>
  game.activeChar === null ? 'fresh' : game.questionState(game.activeChar, q)

/**
 * Put a question — or, if they have answered it already, have the answer
 * read back. Reading back spends nothing.
 */
/** While an answer is still being given: the role under their name waits for it. */
const hushed = ref(false)
watch(
  () => game.activeChar,
  () => (hushed.value = false),
)
function put(q: QuestionKey | 'press') {
  if (game.activeChar === null) return
  // A line still being spoken is hurried, not talked over: the next tap asks.
  if (box.value && !box.value.done) {
    box.value.tap()
    return
  }
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
  // What they say they are is written up once they have said it, not before.
  hushed.value = true
  if (q === 'press') {
    sfx('gavel')
    game.press(game.activeChar)
  } else {
    sfx('click')
    game.ask(game.activeChar, q)
  }
  // A line that comes out whole at once has said its piece already.
  void nextTick(() => {
    if (box.value?.done) hushed.value = false
  })
}
function ask(kind: 'alibi' | 'knowledge' | 'seen' | 'suspect') {
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
/** Ending the hour with questions in hand is asked about first (ConfirmHour). */
function endHour() {
  if (game.questionsLeft > 0) {
    sfx('click')
    ui.confirmHour = true
    return
  }
  sfx('select')
  game.strikeHour()
}
function compare() {
  sfx('page')
  game.beginDeduce()
}

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
/** Asked, and they will say no more — not for asking. */
const held = (c: Choice) => c.q !== undefined && stateOf(c.q) === 'held'
/** What the choice puts, as the sergeant's lesson names it; and whether he would have it put now. */
const kindOf = (c: Choice): QuestionKey['kind'] | 'press' =>
  c.q === undefined ? 'aboutEvidence' : c.q === 'press' ? 'press' : c.q.kind
const usable = (c: Choice) =>
  mayPut(kindOf(c)) && (answered(c) || !c.needsQuestion || (canAsk.value && !held(c)))
/** The exhibits in hand that would loosen whoever is in the chair. */
const keys = computed(() => (game.activeChar === null ? [] : game.keysFor(game.activeChar)))
const choices = computed<Choice[]>(() => {
  const list: Choice[] = [
    { key: '1', label: 'Where were you?', icon: 'steps', run: () => ask('alibi'), needsQuestion: true, q: { kind: 'alibi' } },
    { key: '2', label: 'What is your role?', icon: 'mask', run: () => ask('knowledge'), needsQuestion: true, q: { kind: 'knowledge' } },
    { key: '3', label: 'What have you seen?', icon: 'eye', run: () => ask('seen'), needsQuestion: true, q: { kind: 'seen' } },
    { key: '4', label: 'Whom do you suspect?', icon: 'question', run: () => ask('suspect'), needsQuestion: true, q: { kind: 'suspect' } },
    {
      key: '5',
      label: `How did you stand with ${game.mystery?.victim.shortName ?? 'them'}?`,
      icon: 'heart',
      run: () => askAbout('victim'),
      needsQuestion: true,
      q: { kind: 'aboutPerson', person: 'victim' },
    },
  ]
  if (game.foundItems.length > 0) {
    list.push({ key: '6', label: 'Show evidence…', icon: 'gem', run: () => open('show'), needsQuestion: true })
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
/** What a Press would put to them: the two notes of theirs that cannot both be true. */
const pressPair = computed(() => {
  const t = who.value ? game.threadAgainst(who.value.id) : undefined
  return t && t.itemLabels.length >= 2 ? `${t.itemLabels[0]}, against ${t.itemLabels[1]}` : ''
})
/** Whether a sign has been set under anybody yet: the legend is shown until then. */
const signsSet = computed(() => Object.keys(game.signs).length > 0)

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
  <!--
    Compare notes and the end of the hour, side by side in the middle, from the
    household and from somebody's chair alike. Comparing is the one to reach for
    while there are questions left; once they are spent, the hour is.
  -->
  <ActionBar centre>
    <button
      v-spot="'compare'"
      class="compare"
      :class="{ urged: game.questionsLeft > 0 }"
      :disabled="!game.tutorLocks.compare"
      title="Lay your notes side by side (C)"
      @click="compare()"
    >
      <Icon name="link" /> Compare notes
    </button>
    <button
      v-spot="'hour'"
      :class="{ primary: game.questionsLeft === 0 }"
      :disabled="!game.tutorLocks.strike"
      data-next
      @click="endHour()"
    >
      {{ game.isLastRound ? 'Face midnight' : 'Let the hour strike' }} <Icon name="forward" />
    </button>
  </ActionBar>
  <Transition name="fade" mode="out-in" @before-leave="leaving" @enter="entering">
    <!-- The gallery of suspects -->
    <div v-if="who === null" key="gallery" class="suspects">
      <p class="hour-line brass small">{{ game.clockLabel }}</p>
      <h2 class="heading">Whom will you question?</h2>
      <p class="lede">
        {{
          game.questionsLeft > 0
            ? `${game.questionsLeft} question${game.questionsLeft === 1 ? '' : 's'} before the hour strikes.`
            : 'The hour has run out of questions.'
        }}
        Compare your notes whenever two of them seem not to agree.
      </p>
      <p v-if="!signsSet" class="legend small muted">
        <Icon name="key" /> means · <Icon name="heart" /> motive · <Icon name="steps" /> opportunity:
        yours to mark, as you judge. Choose one to set it
        <span class="against">against them</span>, to
        <span class="cleared">rule it out</span>, or to leave it undecided.
      </p>
      <div class="grid">
        <div
          v-for="(m, i) in cast"
          :key="m.id"
          class="suspect"
          :class="{ struck: struckOff(m.id), flagged: game.pressable.has(m.id), dead: game.dead === m.id, barred: !mayAsk(m.id) }"
          :style="{ animationDelay: `${i * 0.05}s` }"
        >
          <button v-spot="`guest:${m.id}`" class="sit" :disabled="game.dead === m.id || !mayAsk(m.id)" @click="sit(m.id)">
          <kbd v-if="game.dead !== m.id" class="hotkey">{{ i + 1 }}</kbd>
          <span v-else class="late small">found dead</span>
          <Portrait :who="m.defId" size="clamp(4.2rem, 21vw, 5.6rem)" :dim="struckOff(m.id) || game.dead === m.id" />
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
          <span class="small job">{{ m.title }}</span>
          </button>
          <RoleMark :char="m.id" :name="m.shortName" />
          <div class="tally small">
            <span
              v-if="game.pressable.has(m.id)"
              class="flag"
              role="img"
              aria-label="A contradiction stands against them"
              title="A contradiction stands against them"
            >
              <Icon name="bolt" />
            </span>
            <span
              v-if="game.statementsBy(m.id) > 0"
              class="said"
              role="img"
              :aria-label="`${game.statementsBy(m.id)} statement${game.statementsBy(m.id) === 1 ? '' : 's'} noted`"
              :title="`${game.statementsBy(m.id)} statement${game.statementsBy(m.id) === 1 ? '' : 's'} noted`"
            >
              <Icon name="speech" /> {{ game.statementsBy(m.id) }}
            </span>
          </div>
          <PillarRow
            class="signs"
            :pillars="game.signsOf(m.id)"
            :of="m.shortName"
            editable
            @set="sign(m.id, $event)"
          />
          <button
            v-spot="'strike'"
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
      <BackLink class="back-row" @back="leave()" />
      <aside class="sitter">
        <Portrait :who="who.defId" size="clamp(4.6rem, 17vw, 11rem)" :mood="mood" />
        <div class="ident">
          <h3 class="brass">{{ who.name }}</h3>
          <p class="small muted title">{{ who.title }}</p>
          <RoleMark :char="who.id" :name="who.shortName" :hold="hushed" />
        </div>
        <ul id="sitter-known" v-spot="'known'" class="known small" :class="{ open: showKnown }">
          <li><Icon name="eye" /> {{ traitOf(who) }}</li>
          <li v-for="line in meansLabels(who.means)" :key="line"><Icon name="key" /> {{ line }}</li>
        </ul>
        <PillarRow
          :pillars="game.signsOf(who.id)"
          :of="who.shortName"
          labelled
          editable
          @set="sign(who.id, $event)"
        />
        <div class="tools">
          <button
            v-spot="'known'"
            class="known-toggle ghost small"
            :aria-expanded="showKnown"
            aria-controls="sitter-known"
            @click="sfx('click'); showKnown = !showKnown"
          >
            <Icon name="key" /> Traits and means <Icon :name="showKnown ? 'up' : 'down'" />
          </button>
          <button v-spot="'strike'" class="strike small" :aria-pressed="struckOff(who.id)" @click="strike(who.id)">
            <kbd>X</kbd>
            {{ struckOff(who.id) ? 'Ruled out, put back' : 'Rule them out' }}
          </button>
        </div>
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
          @done="(speaking = false), (hushed = false)"
        />
        <div v-else class="frame waiting muted">They wait for your first question.</div>
        <!-- Once said: an answer that gave nothing did not cost a question. -->
        <p v-if="current && current.line.id === game.freeLineId && !hushed" class="free-note small">
          <Icon name="check" /> Nothing in that. It didn’t cost you any time.
        </p>

        <Transition name="fade">
          <p v-if="gift" class="gift paper">
            <ItemArt :item="gift.id" size="3rem" />
            <span>
              <strong>Handed to you:</strong> {{ gift.name }}<span class="small">, taken up, they say, {{ gift.room }}. Added to your evidence.</span>
            </span>
          </p>
        </Transition>

        <!-- What to ask -->
        <div v-if="menu === 'main'" class="choices">
          <button
            v-for="c in choices"
            :key="c.key"
            v-spot="`q:${kindOf(c)}`"
            class="choice"
            :class="{ danger: c.danger, asked: answered(c) }"
            :disabled="!usable(c)"
            :title="answered(c) ? 'Asked and answered. Hear it again, for nothing' : undefined"
            @click="c.run()"
          >
            <kbd>{{ c.key }}</kbd>
            <Icon :name="answered(c) ? 'check' : c.icon" />
            <span>
              {{ c.label }}
              <small v-if="answered(c)" class="again">asked, hear it again</small>
              <small v-else-if="halfAnswered(c)" class="again more">they will speak now, so ask again</small>
              <small v-else-if="held(c)" class="again held">can you convince them to speak?</small>
              <small v-else-if="c.q === 'press' && pressPair" class="again">{{ pressPair }}</small>
            </span>
          </button>
          <button class="choice quiet" @click="open('record')">
            <kbd>R</kbd>
            <Icon name="book" />
            <span>Read back the record</span>
          </button>
          <p v-if="!canAsk" class="small muted spent">
            No questions left this hour. Compare your notes, or let the hour strike, below.
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
              :class="{ asked: stateOf({ kind: 'aboutEvidence', item: e.id }) === 'done', key: keys.includes(e.id) }"
              :disabled="stateOf({ kind: 'aboutEvidence', item: e.id }) !== 'done' && !canAsk"
              @click="showEvidence(e.id)"
            >
              <ItemArt :item="e.id" size="3.6rem" />
              <span>{{ e.name }}</span>
              <span v-if="namedBy(e) !== undefined" class="named-who">{{ cast[namedBy(e)!].shortName }}</span>
              <small v-if="stateOf({ kind: 'aboutEvidence', item: e.id }) === 'done'" class="again">
                shown, hear it again
              </small>
              <small v-else-if="keys.includes(e.id)" class="again touches">this touches them</small>
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
/* While questions are left, comparing is the thing to reach for: picked out in brass. */
.compare.urged {
  padding: 0.55rem 1.3rem;
  border-color: var(--brass);
  color: var(--brass);
  font-size: 0.95rem;
}
.compare.urged:hover:not(:disabled) {
  background: rgba(212, 175, 74, 0.1);
}
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
/* The hour, over the heading, where the HUD has no room to say it. */
.hour-line {
  display: none;
  margin: 0 0 0.15rem;
  text-align: center;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
@media (max-width: 640px) {
  .hour-line {
    display: block;
  }
}
.legend .against {
  color: #ee7c6f;
}
.legend .cleared {
  color: var(--good);
  text-decoration: line-through;
}
.job {
  color: var(--muted);
  opacity: 0.8;
}
/* Bottom right, above the three marks: how much they have had to say. */
.tally {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.6rem;
  min-height: 1.3rem;
  padding: 0 0.7rem;
  color: var(--muted);
}
.tally .flag {
  margin-right: auto;
}
.said {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-variant-numeric: tabular-nums;
}
.grid {
  /* Wrapped and centred, so a short last row sits in the middle rather than to the left. */
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.7rem;
}
.suspect {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 0 1 15rem;
  min-width: 13rem;
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
.suspect.dead {
  border-style: dashed;
}
.suspect.dead:hover {
  border-color: var(--line);
  transform: none;
}
.suspect.dead .sit {
  cursor: default;
  opacity: 0.75;
}
.late {
  position: absolute;
  top: 0.4rem;
  left: 0.6rem;
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #f0b0a8;
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
  padding: 1.1rem 0.6rem 0.2rem;
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
/* On a phone, two to a row; and no number keys to press. */
@media (max-width: 560px) {
  .grid {
    gap: 0.5rem;
  }
  .suspect {
    flex: 0 1 calc(50% - 0.25rem);
    min-width: 0;
  }
  .sit {
    padding: 0.8rem 0.35rem 0.15rem;
  }
  .who-name {
    font-size: 0.95rem;
    letter-spacing: 0.03em;
  }
  .job {
    font-size: 0.78rem;
    line-height: 1.25;
  }
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
}
/* Across the top of both columns. */
.back-row {
  grid-column: 1 / -1;
  margin-bottom: -0.6rem;
}
.sitter {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  text-align: center;
}
/* Wrappers for the narrow layout below; at full width they stand aside and the column runs as one. */
.ident,
.tools {
  display: contents;
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
.free-note {
  margin: -0.5rem 0 0;
  color: var(--muted);
  font-style: italic;
  animation: rise 0.3s ease-out both;
}
.free-note .icon {
  color: var(--good);
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
.again.held {
  color: var(--muted);
  font-style: italic;
}
/* Whom the exhibit names, under its name: on a phone, where the face beside it is small. */
.named-who {
  display: none;
}
@media (max-width: 560px) {
  .named-who {
    display: block;
    font-size: 0.85rem;
    color: var(--paper-muted);
  }
}
.exhibit.key {
  border-color: var(--brass);
  box-shadow: 0 0 0 1px var(--brass);
}
.exhibit .again.touches {
  color: #6b5416;
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
/* The fold for a sitter's trait and means: only wanted where they are folded away. */
.known-toggle {
  display: none;
}
/*
 * On a narrow screen the sitter's particulars give way to the conversation:
 * the trait and means stay to hand behind the fold, the rest goes.
 */
@media (max-width: 820px) {
  .known-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }
  .known:not(.open),
  .sitter .status,
  .sitter .flag {
    display: none;
  }
  .known.open {
    margin: 0;
  }
  .room {
    padding-top: 0;
  }
  /*
   * The sitter as a strip across the top, not a column: the face beside the
   * name, the three marks under them, and the fold and the ruling-out side by
   * side — so the questions come up close beneath.
   */
  .interview {
    gap: 0.8rem;
    padding-top: 0.9rem;
  }
  .sitter {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-areas:
      'face ident'
      'marks marks'
      'tools tools'
      'known known';
    align-items: center;
    column-gap: 0.9rem;
    row-gap: 0.5rem;
    text-align: left;
  }
  .sitter > .portrait {
    grid-area: face;
  }
  .ident {
    grid-area: ident;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.2rem;
    min-width: 0;
  }
  .ident :deep(.role-mark) {
    align-self: flex-start;
  }
  .ident h3 {
    margin: 0;
    font-size: 1.15rem;
    line-height: 1.2;
  }
  .sitter > .pillars {
    grid-area: marks;
    justify-content: center;
  }
  .tools {
    grid-area: tools;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.4rem;
  }
  .sitter .strike {
    margin-top: 0;
  }
  .known {
    grid-area: known;
  }
  .choices {
    gap: 0.35rem;
  }
  .choice {
    padding: 0.5rem 0.7rem;
    font-size: 0.98rem;
  }
}

/* Not yet, the sergeant says. */
.suspect.barred .sit {
  opacity: 0.45;
}
</style>

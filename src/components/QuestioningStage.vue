<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { meansLabel, traitLabel as engineTraitLabel } from '../engine/render'
import type { Person } from '../engine/types'
import { useGame } from '../stores/game'
import { useUi } from '../stores/ui'
import { sfx } from '../ui/audio'
import { useKeys } from '../ui/keys'
import DialogueBox from './DialogueBox.vue'
import Icon, { type IconName } from './Icon.vue'
import PillarRow from './PillarRow.vue'
import Portrait from './Portrait.vue'

type Menu = 'main' | 'about' | 'show' | 'record'

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
const others = computed(() => cast.value.filter((m) => m.id !== game.activeChar))
const canAsk = computed(() => game.questionsLeft > 0)
const convo = computed(() => (game.activeChar !== null ? game.convoOf(game.activeChar) : []))

/** The line in the box: the latest thing they said, and what prompted it. */
const current = computed(() => {
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

const traitLabel = (id: string) => (game.ctx ? engineTraitLabel(game.ctx, id) : id)
const meansLabels = (ids: string[]) => ids.map((id) => (game.ctx ? meansLabel(game.ctx, id) : id))

function statusOf(id: number): { icon: IconName; label: string; tone: string }[] {
  const out: { icon: IconName; label: string; tone: string }[] = []
  const st = game.liveBoard?.states[id]
  if (st === 'cleared') out.push({ icon: 'check', label: 'cleared by your threads', tone: 'good' })
  if (st === 'sole') out.push({ icon: 'alert', label: 'the last candidate standing', tone: 'bad' })
  if (game.caughtLying.has(id)) out.push({ icon: 'mask', label: 'caught lying', tone: 'bad' })
  return out
}

function sit(id: number) {
  sfx('select')
  heardUpTo.value = game.log.length > 0 ? game.log[game.log.length - 1].id : -1
  menu.value = 'main'
  reaction.value = 'idle'
  game.activeChar = id
}
function leave() {
  sfx('click')
  game.activeChar = null
}

function ask(kind: 'role' | 'alibi' | 'knowledge' | 'suspect') {
  if (game.activeChar === null || !canAsk.value) return
  sfx('click')
  game.ask(game.activeChar, { kind })
}
function askAbout(person: Person) {
  if (game.activeChar === null || !canAsk.value) return
  sfx('click')
  game.ask(game.activeChar, { kind: 'aboutPerson', person })
  menu.value = 'main'
}
function showEvidence(item: string) {
  if (game.activeChar === null || !canAsk.value) return
  sfx('click')
  game.ask(game.activeChar, { kind: 'aboutEvidence', item })
  menu.value = 'main'
}
function press() {
  if (game.activeChar === null || !canAsk.value) return
  sfx('gavel')
  game.press(game.activeChar)
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
}
const choices = computed<Choice[]>(() => {
  const list: Choice[] = [
    { key: '1', label: 'Where were you?', icon: 'steps', run: () => ask('alibi'), needsQuestion: true },
    { key: '2', label: 'What do you know?', icon: 'eye', run: () => ask('knowledge'), needsQuestion: true },
    { key: '3', label: 'What part do you play?', icon: 'mask', run: () => ask('role'), needsQuestion: true },
    { key: '4', label: 'Whom do you suspect?', icon: 'question', run: () => ask('suspect'), needsQuestion: true },
    { key: '5', label: 'Ask about someone…', icon: 'person', run: () => open('about'), needsQuestion: true },
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
    })
  }
  return list
})

// A new line from the sitter: how do they take it?
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
  if (menu.value === 'main') {
    const choice = choices.value.find((c) => c.key === key)
    if (choice && (!choice.needsQuestion || canAsk.value)) {
      choice.run()
      return true
    }
  }
  return false
})
</script>

<template>
  <Transition name="fade" mode="out-in">
    <!-- The gallery of suspects -->
    <div v-if="who === null" key="gallery" class="suspects">
      <h2 class="heading">Whom will you question?</h2>
      <p class="lede">
        {{
          game.questionsLeft > 0
            ? `${game.questionsLeft} question${game.questionsLeft === 1 ? '' : 's'} before the hour strikes.`
            : 'The hour has run out of questions. Let it strike.'
        }}
      </p>
      <div class="grid">
        <button
          v-for="(m, i) in cast"
          :key="m.id"
          class="suspect"
          :class="{ cleared: game.liveBoard?.states[m.id] === 'cleared', flagged: game.pressable.has(m.id) }"
          :style="{ animationDelay: `${i * 0.05}s` }"
          @click="sit(m.id)"
        >
          <kbd class="hotkey">{{ i + 1 }}</kbd>
          <Portrait :who="m.defId" size="5.6rem" />
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
          <span class="small muted">№{{ m.seat }} · {{ traitLabel(m.trait) }}</span>
          <PillarRow :pillars="game.livePillars(m.id)" />
          <span class="meta">
            <span v-if="game.statementsBy(m.id) > 0" class="small muted">
              {{ game.statementsBy(m.id) }} statement{{ game.statementsBy(m.id) === 1 ? '' : 's' }}
            </span>
            <span v-if="game.pressable.has(m.id)" class="flag" title="A contradiction stands against them">
              <Icon name="bolt" /> contradiction
            </span>
          </span>
        </button>
      </div>
    </div>

    <!-- The interview -->
    <div v-else key="interview" class="interview">
      <aside class="sitter">
        <button class="back ghost" @click="leave()"><Icon name="back" /> the household</button>
        <Portrait :who="who.defId" size="clamp(6.5rem, 17vw, 11rem)" :mood="mood" />
        <h3 class="brass">{{ who.name }}</h3>
        <p class="small muted title">{{ who.title }}</p>
        <ul class="known small">
          <li><Icon name="pin" /> №{{ who.seat }} at table</li>
          <li><Icon name="eye" /> {{ traitLabel(who.trait) }}</li>
          <li v-for="line in meansLabels(who.means)" :key="line"><Icon name="key" /> {{ line }}</li>
        </ul>
        <PillarRow :pillars="game.livePillars(who.id)" labelled />
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
          :prompt="current.prompt"
          :text="current.line.text"
          :fresh="current.line.id > heardUpTo"
          @typing="speaking = true"
          @done="speaking = false"
        />
        <div v-else class="frame waiting muted">They wait for your first question.</div>

        <!-- What to ask -->
        <div v-if="menu === 'main'" class="choices">
          <button
            v-for="c in choices"
            :key="c.key"
            class="choice"
            :class="{ danger: c.danger }"
            :disabled="c.needsQuestion && !canAsk"
            @click="c.run()"
          >
            <kbd>{{ c.key }}</kbd>
            <Icon :name="c.icon" />
            <span>{{ c.label }}</span>
          </button>
          <button class="choice quiet" @click="open('record')">
            <kbd>R</kbd>
            <Icon name="book" />
            <span>Read back the record</span>
          </button>
          <p v-if="!canAsk" class="small muted spent">
            No questions left this hour — close the hour’s questioning.
          </p>
        </div>

        <!-- Ask about someone -->
        <div v-else-if="menu === 'about'" class="picker">
          <div class="picker-head">
            <span class="brass">Ask about…</span>
            <button class="ghost" @click="menu = 'main'"><Icon name="back" /> back</button>
          </div>
          <div class="people">
            <button class="person" @click="askAbout('victim')">
              <Portrait shape="token" size="3.2rem" />
              <span>{{ game.ctx?.pack.victim.shortName }}</span>
              <span class="small muted">the victim</span>
            </button>
            <button v-for="m in others" :key="m.id" class="person" @click="askAbout(m.id)">
              <Portrait :who="m.defId" shape="token" size="3.2rem" />
              <span>{{ m.shortName }}</span>
              <span class="small muted">{{ m.title }}</span>
            </button>
          </div>
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
              @click="showEvidence(e.id)"
            >
              <Icon :name="e.fact.kind !== 'flavor' ? 'gem' : 'question'" />
              <span>{{ e.name }}</span>
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
                <span class="speaker brass">{{ name(e.speaker) }}:</span> “{{ e.text }}”
              </template>
              <template v-else>{{ e.text }}</template>
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
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: 0.7rem;
}
.suspect {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.22rem;
  padding: 1.1rem 0.6rem 0.9rem;
  animation: rise 0.4s ease-out both;
}
.suspect:hover:not(:disabled) {
  transform: translateY(-4px);
}
.suspect.cleared .portrait {
  opacity: 0.55;
  filter: grayscale(0.7);
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

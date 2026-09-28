<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { meansLabel, traitLabel as engineTraitLabel } from '../engine/render'
import type { Person } from '../engine/types'
import { useGame } from '../stores/game'
import PillarRow from './PillarRow.vue'

const game = useGame()
const aboutTarget = ref('')
const showItem = ref('')
const transcript = ref<HTMLElement | null>(null)

const cast = computed(() => game.mystery?.cast ?? [])
const who = computed(() =>
  game.activeChar !== null && game.mystery ? game.mystery.cast[game.activeChar] : null,
)
const others = computed(() => cast.value.filter((m) => m.id !== game.activeChar))
const canAsk = computed(() => game.questionsLeft > 0)
const convo = computed(() => (game.activeChar !== null ? game.convoOf(game.activeChar) : []))

const traitLabel = (id: string) => (game.ctx ? engineTraitLabel(game.ctx, id) : id)
const meansLabels = (ids: string[]) =>
  ids.map((id) => (game.ctx ? meansLabel(game.ctx, id) : id)).join('; ')
function statusOf(id: number): { icon: string; label: string }[] {
  const out: { icon: string; label: string }[] = []
  const st = game.liveBoard?.states[id]
  if (st === 'cleared') out.push({ icon: '✓', label: 'cleared by your threads' })
  if (st === 'sole') out.push({ icon: '⚠', label: 'the last candidate standing' })
  if (game.caughtLying.has(id)) out.push({ icon: '🎭', label: 'caught lying' })
  return out
}
function ask(kind: 'role' | 'alibi' | 'knowledge' | 'suspect') {
  if (game.activeChar === null) return
  game.ask(game.activeChar, { kind })
}
function askAbout() {
  if (game.activeChar === null || aboutTarget.value === '') return
  const person: Person = aboutTarget.value === 'victim' ? 'victim' : Number(aboutTarget.value)
  game.ask(game.activeChar, { kind: 'aboutPerson', person })
  aboutTarget.value = ''
}
function showEvidence() {
  if (game.activeChar === null || showItem.value === '') return
  game.ask(game.activeChar, { kind: 'aboutEvidence', item: showItem.value })
  showItem.value = ''
}
function name(id?: number): string {
  return id !== undefined ? (cast.value[id]?.shortName ?? '') : ''
}

watch(
  () => convo.value.length,
  async () => {
    await nextTick()
    transcript.value?.scrollTo({ top: transcript.value.scrollHeight, behavior: 'smooth' })
  },
)
</script>

<template>
  <!-- The gallery of suspects -->
  <div v-if="who === null" class="suspects">
    <h2 class="brass">Whom will you question?</h2>
    <p class="lede muted">
      {{
        game.questionsLeft > 0
          ? `${game.questionsLeft} question${game.questionsLeft === 1 ? '' : 's'} before the hour strikes.`
          : 'The hour has run out of questions. Let it strike.'
      }}
    </p>
    <div class="grid">
      <button v-for="m in cast" :key="m.id" class="suspect" @click="game.activeChar = m.id">
        <span class="portrait">{{ m.portrait }}</span>
        <strong>
          {{ m.shortName }}
          <span v-for="s in statusOf(m.id)" :key="s.icon" :title="s.label">{{ s.icon }}</span>
        </strong>
        <span class="small muted">{{ m.title }}</span>
        <span class="small muted">№{{ m.seat }} · {{ traitLabel(m.trait) }}</span>
        <PillarRow :pillars="game.livePillars(m.id)" />
        <span class="meta">
          <span v-if="game.statementsBy(m.id) > 0" class="small muted">
            {{ game.statementsBy(m.id) }} statement{{ game.statementsBy(m.id) === 1 ? '' : 's' }}
          </span>
          <span v-if="game.pressable.has(m.id)" class="flag" title="A contradiction stands against them">⚡ contradiction</span>
        </span>
      </button>
    </div>
  </div>

  <!-- The interview -->
  <div v-else class="interview">
    <aside class="sitter panel">
      <button class="back" @click="game.activeChar = null">← the household</button>
      <div class="portrait">{{ who.portrait }}</div>
      <h3>{{ who.name }}</h3>
      <p class="small muted">{{ who.title }}</p>
      <p class="small muted">№{{ who.seat }} at table · {{ traitLabel(who.trait) }}</p>
      <p class="small muted">{{ meansLabels(who.means) }}</p>
      <p><PillarRow :pillars="game.livePillars(who.id)" /></p>
      <p v-for="s in statusOf(who.id)" :key="s.icon" class="small muted">{{ s.icon }} {{ s.label }}</p>
      <p v-if="game.pressable.has(who.id)" class="small flag">⚡ a contradiction stands against them</p>
    </aside>

    <section class="room">
      <div class="transcript panel" ref="transcript">
        <p v-if="convo.length === 0" class="muted small">They wait for your first question.</p>
        <div v-for="e in convo" :key="e.id" class="line" :class="e.kind">
          <template v-if="e.kind === 'speech'">
            <span class="who brass">{{ name(e.speaker) }}:</span> “{{ e.text }}”
          </template>
          <template v-else>{{ e.text }}</template>
        </div>
      </div>

      <div class="controls panel">
        <div class="buttons">
          <button :disabled="!canAsk" @click="ask('alibi')">Where were you?</button>
          <button :disabled="!canAsk" @click="ask('knowledge')">What do you know?</button>
          <button :disabled="!canAsk" @click="ask('role')">What part do you play?</button>
          <button :disabled="!canAsk" @click="ask('suspect')">Whom do you suspect?</button>
          <span class="combo">
            <select v-model="aboutTarget" :disabled="!canAsk">
              <option value="" disabled>Ask about someone…</option>
              <option value="victim">{{ game.ctx?.pack.victim.shortName }} (the victim)</option>
              <option v-for="m in others" :key="m.id" :value="String(m.id)">{{ m.shortName }}</option>
            </select>
            <button :disabled="!canAsk || aboutTarget === ''" @click="askAbout()">Ask</button>
          </span>
          <span class="combo" v-if="game.foundItems.length > 0">
            <select v-model="showItem" :disabled="!canAsk">
              <option value="" disabled>Show evidence…</option>
              <option v-for="e in game.foundItems" :key="e.id" :value="e.id">{{ e.name }}</option>
            </select>
            <button :disabled="!canAsk || showItem === ''" @click="showEvidence()">Show</button>
          </span>
          <button
            v-if="game.pressable.has(who.id)"
            class="danger"
            :disabled="!canAsk"
            @click="game.press(who.id)"
          >
            Press them ⚡
          </button>
        </div>
        <p v-if="!canAsk" class="small muted">No questions left this hour — let the hour strike.</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.suspects {
  max-width: 52rem;
  margin: 5vh auto;
  padding: 0 1rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
h2 {
  margin: 0;
  text-align: center;
  letter-spacing: 0.1em;
}
.lede {
  text-align: center;
  font-style: italic;
  margin: 0;
}
.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.6rem;
}
@media (max-width: 860px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
.suspect {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 1rem 0.5rem;
}
.suspect .portrait {
  font-size: 2.2rem;
}
.meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 1.2rem;
}
.flag {
  color: var(--brass);
  font-size: 0.8rem;
}

.interview {
  display: grid;
  grid-template-columns: 230px 1fr;
  gap: 0.6rem;
  max-width: 62rem;
  margin: 1.2rem auto;
  padding: 0 1rem;
  height: calc(100vh - 8rem);
  min-height: 24rem;
}
@media (max-width: 860px) {
  .interview {
    grid-template-columns: 1fr;
    height: auto;
  }
}
.sitter {
  text-align: center;
  align-self: start;
}
.sitter .portrait {
  font-size: 3.2rem;
  margin: 0.4rem 0;
}
.sitter h3 {
  margin: 0;
}
.back {
  width: 100%;
}
.room {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-height: 0;
}
.transcript {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-height: 12rem;
}
.line {
  line-height: 1.5;
}
.line.detective {
  color: var(--muted);
  font-style: italic;
}
.who {
  margin-right: 0.3rem;
}
.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}
.combo {
  display: inline-flex;
  gap: 0.25rem;
  align-items: center;
}
</style>

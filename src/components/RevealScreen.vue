<script setup lang="ts">
import { computed } from 'vue'
import { claimIsTrue } from '../engine/claims'
import { truthClassOf } from '../engine/deck'
import { useGame } from '../stores/game'

const game = useGame()
const mystery = computed(() => game.mystery!)
const culprit = computed(() => mystery.value.truth.roles.indexOf('culprit'))
const verdict = computed(() => game.verdict!)

const TIER_HEAD = {
  airtight: '◆ An Airtight Case ◆',
  strong: '◆ A Strong Case ◆',
  thin: '◇ A Lucky Finger ◇',
  wrong: '✝ The Wrong Name ✝',
} as const

const TIER_TEXT = {
  airtight:
    'Means, motive, and opportunity — all three nailed to the one name left standing. The house has no rebuttal; the case argues itself.',
  strong:
    'The right name, and most of the shadow lifted with it. A case a barrister would take — though the trinity was never quite complete.',
  thin: 'The right name — but your case cleared almost no one. You knew; you could not show it. Half deduction, half dice.',
  wrong:
    'The wrong name. In the silence that follows, somewhere in the house, the real killer exhales.',
} as const

const PILLAR_WORD = { established: 'established', ruledOut: 'ruled out', unknown: 'never shown' } as const

function name(id: number): string {
  return mystery.value.cast[id].shortName
}
function boardIcon(id: number): string {
  const st = verdict.value.board.states[id]
  return st === 'cleared' ? '✓' : st === 'sole' ? '⚠' : '?'
}
const lies = computed(() => {
  const seen = new Set<string>()
  return game.notebook
    .filter(
      (n) => claimIsTrue(n.claim, n.speaker, mystery.value.truth, mystery.value.cast) === false,
    )
    .filter((n) => {
      // Several false claims can share one spoken line — list the line once.
      const key = `${n.speaker}|${n.text}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map((n) => ({
      ...n,
      sincere: truthClassOf(mystery.value.truth.roles[n.speaker]) === 'unreliable',
    }))
})
function roomName(id: string): string {
  return game.ctx?.pack.rooms.find((r) => r.id === id)?.name ?? id
}
</script>

<template>
  <main class="reveal" v-if="game.verdict && game.mystery">
    <h2 :class="verdict.tier === 'wrong' ? 'bad' : 'brass'">{{ TIER_HEAD[verdict.tier] }}</h2>
    <p class="lede">{{ TIER_TEXT[verdict.tier] }}</p>

    <div class="panel">
      <h3>The case, as you built it</h3>
      <div class="board">
        <span
          v-for="m in mystery.cast"
          :key="m.id"
          class="chip"
          :class="[verdict.board.states[m.id], { culprit: m.id === culprit }]"
          :title="m.id === culprit ? 'the murderer' : ''"
        >
          {{ m.portrait }} {{ name(m.id) }} {{ boardIcon(m.id)
          }}<template v-if="m.id === culprit"> †</template>
        </span>
      </div>
      <p class="small muted">
        Your cited case cleared {{ verdict.board.clearedCount }} of the seven outright<template
          v-if="verdict.board.remaining.length > 1"
        >
          — it still allowed
          {{ verdict.board.remaining.filter((s) => s !== game.accusedId).map(name).join(', ') }}</template
        >.
      </p>
      <p class="small" v-if="game.accusedId !== null">
        Against {{ name(game.accusedId) }} you showed —
        🗝 means: <span class="brass">{{ PILLAR_WORD[verdict.pillars.means] }}</span> ·
        🖤 motive: <span class="brass">{{ PILLAR_WORD[verdict.pillars.motive] }}</span> ·
        👣 opportunity: <span class="brass">{{ PILLAR_WORD[verdict.pillars.opportunity] }}</span>
      </p>
    </div>

    <div class="panel">
      <h3>The truth of Case №{{ mystery.seed }}</h3>
      <table>
        <thead>
          <tr class="small muted">
            <th></th>
            <th>truly was</th>
            <th>played it</th>
            <th>that hour</th>
            <th>with the victim</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in mystery.cast" :key="m.id" :class="{ culprit: m.id === culprit }">
            <td>{{ m.portrait }} {{ m.shortName }}</td>
            <td :class="{ brass: m.id === culprit }">
              {{ game.ctx?.pack.roleLabels[mystery.truth.roles[m.id]] ?? mystery.truth.roles[m.id] }}
            </td>
            <td class="muted">{{ m.strategy }} · {{ m.temperament }}</td>
            <td>
              in {{ roomName(mystery.truth.locations[m.id]) }}
              <template v-if="mystery.truth.companions[m.id].length">
                with {{ mystery.truth.companions[m.id].map(name).join(', ') }}
              </template>
            </td>
            <td class="muted">{{ mystery.truth.relationships[m.id] }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="panel" v-if="lies.length > 0">
      <h3>The falsehoods you were told</h3>
      <ul>
        <li v-for="n in lies" :key="n.id" class="small">
          <span class="brass">{{ name(n.speaker) }}</span> — “{{ n.text }}”
          <span v-if="n.sincere" class="muted">(sincerely mistaken — never a lie)</span>
        </li>
      </ul>
    </div>

    <div class="panel" v-if="mystery.solution">
      <h3>How it could have been solved</h3>
      <ol class="small">
        <li v-for="(s, i) in mystery.solution.steps" :key="i">{{ s.detail }}</li>
      </ol>
    </div>

    <button class="primary again" @click="game.phase = 'title'">Another case awaits</button>
  </main>
</template>

<style scoped>
.reveal {
  max-width: 52rem;
  margin: 3vh auto;
  padding: 0 1rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}
h2 {
  text-align: center;
  letter-spacing: 0.15em;
  margin: 0;
}
h2.bad {
  color: var(--danger);
}
.lede {
  text-align: center;
  font-style: italic;
  margin: 0;
}
.board {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.8rem;
  margin-bottom: 0.4rem;
}
.chip {
  padding: 0.15rem 0.4rem;
  border: 1px solid var(--line);
  border-radius: 3px;
}
.chip.cleared {
  color: var(--good);
  opacity: 0.8;
}
.chip.sole {
  border-color: var(--danger);
  color: var(--danger);
}
.chip.culprit {
  background: #2b1d18;
}
table {
  border-collapse: collapse;
  width: 100%;
}
td,
th {
  padding: 0.3rem 0.5rem;
  text-align: left;
  border-top: 1px solid var(--line);
}
tr.culprit td {
  background: #2b1d18;
}
ol,
ul {
  margin: 0.2rem 0;
  padding-left: 1.2rem;
}
li {
  margin: 0.25rem 0;
  line-height: 1.45;
}
.again {
  align-self: center;
  font-size: 1.05rem;
}
</style>

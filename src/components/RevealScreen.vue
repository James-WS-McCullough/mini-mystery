<script setup lang="ts">
// The end of the night, played out in order: the finger pointed, the
// murderer unmasked, the case judged — and only then the whole truth.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { claimIsTrue } from '../engine/claims'
import { truthClassOf } from '../engine/deck'
import { useGame } from '../stores/game'
import { useUi } from '../stores/ui'
import { sfx } from '../ui/audio'
import { useKeys } from '../ui/keys'
import { shareText } from '../ui/profile'
import { settings } from '../ui/settings'
import Icon from './Icon.vue'
import PillarRow from './PillarRow.vue'
import Portrait from './Portrait.vue'

const game = useGame()
const ui = useUi()
const mystery = computed(() => game.mystery!)
const culprit = computed(() => mystery.value.truth.roles.indexOf('culprit'))
const verdict = computed(() => game.verdict!)
const accused = computed(() =>
  game.accusedId === null ? null : mystery.value.cast[game.accusedId],
)
const killer = computed(() => mystery.value.cast[culprit.value])

const TIER_HEAD = {
  airtight: 'An Airtight Case',
  strong: 'A Strong Case',
  thin: 'A Lucky Finger',
  wrong: 'The Wrong Name',
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

// ---------- the sequence ----------

type Beat = 'point' | 'unmask' | 'judge' | 'truth'
const ORDER: Beat[] = ['point', 'unmask', 'judge', 'truth']
const HOLD: Record<Beat, number> = { point: 2600, unmask: 3000, judge: 3600, truth: 0 }
const beat = ref<Beat>('point')
let timer: ReturnType<typeof setTimeout> | undefined

function enter(b: Beat) {
  clearTimeout(timer)
  beat.value = b
  if (b === 'point') sfx('gavel')
  if (b === 'unmask') sfx('reveal')
  if (b === 'judge') {
    sfx('stamp')
    setTimeout(() => sfx(verdict.value.tier === 'wrong' ? 'miss' : 'link'), 350)
  }
  if (b === 'truth') sfx('page')
  if (HOLD[b] > 0) timer = setTimeout(advance, HOLD[b])
}
function advance() {
  const next = ORDER[ORDER.indexOf(beat.value) + 1]
  if (next) enter(next)
}
function skip() {
  enter('truth')
}

onMounted(() => enter(settings.reducedMotion ? 'truth' : 'point'))
onBeforeUnmount(() => clearTimeout(timer))

useKeys((key) => {
  if (ui.anyOpen || beat.value === 'truth') return false
  if (key === ' ' || key === 'Enter') {
    advance()
    return true
  }
  if (key === 'Escape') {
    skip()
    return true
  }
  return false
})

// ---------- the truth ----------

function name(id: number): string {
  return mystery.value.cast[id].shortName
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

const copied = ref(false)
async function share() {
  if (!ui.lastRecord) return
  try {
    await navigator.clipboard.writeText(shareText(ui.lastRecord))
    copied.value = true
    sfx('select')
    setTimeout(() => (copied.value = false), 2200)
  } catch {
    copied.value = false
  }
}
function again() {
  sfx('select')
  game.toTitle()
}
</script>

<template>
  <main v-if="game.verdict && game.mystery" class="reveal" :class="[verdict.tier, beat]">
    <!-- ============ the staged beats ============ -->
    <div v-if="beat !== 'truth'" class="theatre" @click="advance()">
      <Transition name="beat" mode="out-in">
        <div v-if="beat === 'point' && accused" key="point" class="moment">
          <p class="caption">You point the finger at</p>
          <Portrait :who="accused.defId" size="clamp(9rem, 30vw, 14rem)" />
          <h2>{{ accused.name }}</h2>
        </div>

        <div v-else-if="beat === 'unmask'" key="unmask" class="moment">
          <p class="caption">The murderer of {{ mystery.caseSheet.victimName }} was</p>
          <div class="unmasked">
            <Portrait :who="killer.defId" size="clamp(9rem, 30vw, 14rem)" />
          </div>
          <h2 class="killer">{{ killer.name }}</h2>
        </div>

        <div v-else key="judge" class="moment">
          <p class="caption">{{ verdict.correct ? 'The house is satisfied.' : 'The house is silent.' }}</p>
          <div class="seal">{{ TIER_HEAD[verdict.tier] }}</div>
          <p class="sentence">{{ TIER_TEXT[verdict.tier] }}</p>
        </div>
      </Transition>
      <button class="ghost skip" data-skip @click.stop="skip()">
        skip to the truth <Icon name="double" />
      </button>
    </div>

    <!-- ============ the whole truth ============ -->
    <div v-else class="truth">
      <header>
        <p class="deco"><span /></p>
        <h2 class="heading tier">{{ TIER_HEAD[verdict.tier] }}</h2>
        <p class="lede">{{ TIER_TEXT[verdict.tier] }}</p>
      </header>

      <section v-if="ui.earned.length > 0" class="earned">
        <div v-for="c in ui.earned" :key="c.id" class="medal">
          <Icon name="star" size="1.4rem" />
          <div>
            <strong>Commendation — {{ c.name }}</strong>
            <div class="small muted">{{ c.text }}</div>
          </div>
        </div>
      </section>

      <section class="panel">
        <h3>The case, as you built it</h3>
        <div class="board">
          <span
            v-for="m in mystery.cast"
            :key="m.id"
            class="chip"
            :class="[verdict.board.states[m.id], { culprit: m.id === culprit }]"
            :title="m.id === culprit ? 'the murderer' : ''"
          >
            <Portrait :who="m.defId" shape="token" size="1.9rem" />
            {{ name(m.id) }}
            <Icon
              :name="
                verdict.board.states[m.id] === 'cleared'
                  ? 'check'
                  : verdict.board.states[m.id] === 'sole'
                    ? 'alert'
                    : 'question'
              "
            />
            <Icon v-if="m.id === culprit" name="dagger" title="the murderer" />
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
        <p v-if="game.accusedId !== null" class="against">
          Against {{ name(game.accusedId) }} you showed
          <PillarRow :pillars="verdict.pillars" labelled />
        </p>
      </section>

      <section class="panel">
        <h3>The truth of Case №{{ mystery.seed }}</h3>
        <div class="scroll">
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
                <td class="who">
                  <Portrait :who="m.defId" shape="token" size="1.9rem" /> {{ m.shortName }}
                </td>
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
      </section>

      <section v-if="lies.length > 0" class="panel">
        <h3>The falsehoods you were told</h3>
        <ul>
          <li v-for="n in lies" :key="n.id">
            <span class="brass">{{ name(n.speaker) }}</span> — “{{ n.text }}”
            <span v-if="n.sincere" class="muted">(sincerely mistaken — never a lie)</span>
          </li>
        </ul>
      </section>

      <section v-if="mystery.solution" class="panel">
        <h3>How it could have been solved</h3>
        <ol>
          <li v-for="(s, i) in mystery.solution.steps" :key="i">{{ s.detail }}</li>
        </ol>
      </section>

      <footer class="foot">
        <button v-if="ui.lastRecord" @click="share()">
          <Icon :name="copied ? 'check' : 'speech'" />
          {{ copied ? 'Copied — no spoilers in it' : 'Copy a spoiler-free result' }}
        </button>
        <button @click="ui.recordsOpen = true"><Icon name="trophy" /> Service record</button>
        <button class="primary again" data-next @click="again()">Another case awaits</button>
      </footer>
    </div>
  </main>
</template>

<style scoped>
.reveal {
  min-height: 100%;
}
.theatre {
  position: relative;
  min-height: 100%;
  display: grid;
  place-items: center;
  padding: 2rem 1rem 4rem;
  cursor: pointer;
  background: radial-gradient(ellipse at center, rgba(20, 25, 32, 0.3) 0%, rgba(4, 5, 7, 0.92) 75%);
}
.moment {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  max-width: 40rem;
}
.caption {
  margin: 0;
  font-family: var(--font-display);
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: var(--muted);
  animation: appear 0.8s ease-out both;
}
.moment h2 {
  margin: 0;
  font-size: clamp(1.8rem, 6vw, 3rem);
  color: var(--brass);
  animation: rise 0.7s ease-out 0.5s both;
}
.moment h2.killer {
  color: #ee7c6f;
  text-shadow: 0 0 30px rgba(192, 71, 60, 0.6);
  animation-delay: 1.2s;
}
.moment :deep(.portrait) {
  animation: loom 0.9s ease-out both;
}
.unmasked :deep(.portrait) {
  animation: unmask 1.3s ease-out both;
}
.seal {
  padding: 0.7rem 1.6rem 0.5rem;
  border: 5px double currentColor;
  font-family: var(--font-type);
  font-size: clamp(1.4rem, 5vw, 2.4rem);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--brass);
  animation: stamp 0.5s cubic-bezier(0.3, 1.4, 0.5, 1) 0.4s both;
}
.wrong .seal {
  color: #e0695d;
}
.thin .seal {
  color: var(--muted);
}
.airtight .seal {
  text-shadow: 0 0 24px rgba(212, 175, 74, 0.7);
}
.sentence {
  margin: 0.6rem 0 0;
  font-style: italic;
  font-size: 1.1rem;
  line-height: 1.6;
  animation: appear 1s ease-out 1.1s both;
}
.skip {
  position: absolute;
  bottom: 1.2rem;
  right: 1.2rem;
}
.beat-enter-active,
.beat-leave-active {
  transition: opacity 0.45s ease;
}
.beat-enter-from,
.beat-leave-to {
  opacity: 0;
}

.truth {
  max-width: 58rem;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
header {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.wrong .tier {
  color: #e0695d;
}
.truth .lede {
  color: var(--ink);
  opacity: 0.85;
}
.earned {
  display: grid;
  gap: 0.5rem;
}
.medal {
  display: flex;
  gap: 0.7rem;
  align-items: center;
  padding: 0.6rem 0.9rem;
  border: 1px solid var(--brass);
  background: rgba(77, 65, 22, 0.35);
  color: var(--brass);
  animation: rise 0.5s ease-out both;
}
.medal strong {
  font-weight: normal;
  font-family: var(--font-display);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.panel {
  animation: rise 0.5s ease-out both;
}
.panel:nth-of-type(2) { animation-delay: 0.1s }
.panel:nth-of-type(3) { animation-delay: 0.2s }
.panel:nth-of-type(4) { animation-delay: 0.3s }
.panel h3 {
  margin: 0 0 0.6rem;
  color: var(--brass);
  text-transform: uppercase;
  font-size: 1.05rem;
}
.panel p {
  margin: 0.5rem 0 0;
}
.board {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.6rem 0.25rem 0.3rem;
  border: 1px solid var(--line);
  border-radius: 2rem;
}
.chip.cleared {
  color: var(--good);
}
.chip.sole {
  border-color: var(--danger);
  color: #ee7c6f;
}
.chip.culprit {
  background: var(--danger-deep);
}
.against {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}
.scroll {
  overflow-x: auto;
}
table {
  border-collapse: collapse;
  width: 100%;
  font-size: 0.93rem;
}
td,
th {
  padding: 0.4rem 0.5rem;
  text-align: left;
  border-top: 1px solid var(--line);
  font-weight: normal;
}
.who {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  white-space: nowrap;
}
tr.culprit td {
  background: var(--danger-deep);
}
ol,
ul {
  margin: 0;
  padding-left: 1.3rem;
  font-size: 0.93rem;
}
li {
  margin: 0.3rem 0;
  line-height: 1.5;
}
.foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.6rem;
  margin-top: 0.6rem;
}
@keyframes loom {
  from {
    opacity: 0;
    transform: scale(0.8);
    filter: blur(6px);
  }
  to {
    opacity: 1;
    transform: none;
    filter: none;
  }
}
@keyframes unmask {
  0% {
    opacity: 0;
    transform: rotateY(90deg) scale(0.9);
    filter: brightness(0);
  }
  55% {
    opacity: 1;
    transform: rotateY(0) scale(1.06);
    filter: brightness(0.3);
  }
  100% {
    transform: none;
    filter: none;
  }
}
</style>

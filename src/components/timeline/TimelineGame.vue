<script setup lang="ts">
// The Evening Timeline (playtest). The detective arrives the following night:
// every account is of last night, set out on a board of half-hour slots that
// is always in view. Tap a half hour to see where everybody says they were;
// pick two statements that cannot both be true to press on them.
import { computed, ref } from 'vue'
import { BUDGET } from '../../engine/timeline/bot'
import { inPlace, noteOf, roomName, span } from '../../engine/timeline/render'
import { SLOT_CLOCK, SLOTS, VICTIM, type Difficulty, type Place } from '../../engine/timeline/types'
import { useTimeline, type Heard } from '../../stores/timeline'
import { useUi } from '../../stores/ui'
import Portrait from '../Portrait.vue'
import StatementScene from './StatementScene.vue'
import { slotView } from '../../engine/timeline/board'

const tl = useTimeline()
const ui = useUi()

const difficulty = ref<Difficulty>('normal')
const failed = ref(false)
function begin() {
  failed.value = false
  try {
    tl.start(difficulty.value)
  } catch {
    failed.value = true
  }
}
function leave() {
  tl.leave()
  ui.timeline = false
}

const tc = computed(() => tl.tc)
const him = computed(() => (tc.value?.victimPronouns === 'she' ? 'her' : tc.value?.victimPronouns === 'they' ? 'them' : 'him'))
const name = (c: number) => (c === VICTIM ? (tc.value?.victimShort ?? '') : (tc.value?.cast[c].shortName ?? ''))
/** "library", "Major's room": short enough for a bar. */
function short(room: Place, speaker?: number): string {
  const t = tc.value!
  const r = t.rooms.find((x) => x.id === room)
  if (r?.bed !== undefined) return r.bed === speaker ? 'own room' : `${t.cast[r.bed].shortName}’s room`
  return roomName(t, room).replace(/^the /i, '')
}

// ---- the board ----
interface Item {
  id: number
  row: number
  from: number
  to: number
  label: string
  title: string
  kind: 'stay' | 'mark'
  owned?: boolean
  lane: number
}
/** Every statement heard, set on the row of whoever it is about. */
const items = computed<Item[]>(() => {
  const t = tc.value
  if (!t) return []
  const out: Omit<Item, 'lane'>[] = []
  for (const h of tl.heard) {
    const { claim, speaker } = h
    const title = `${name(speaker)}: ${noteOf(t, speaker, claim)}`
    switch (claim.kind) {
      case 'stay': {
        const others = claim.with.filter((c) => c !== VICTIM).length
        const company = claim.with.includes(VICTIM) ? ` + ${t.victimShort}` : others > 0 ? ` + ${others}` : ', alone'
        out.push({ id: h.id, row: speaker, from: claim.from, to: claim.to, label: `${short(claim.room, speaker)}${company}`, title, kind: 'stay', owned: h.owned })
        break
      }
      case 'saw':
        out.push({ id: h.id, row: claim.target, from: claim.slot, to: claim.slot, label: `${short(claim.room)} · seen by ${name(speaker)}`, title, kind: 'mark' })
        break
      case 'lastSeen':
        // (On the victim's own row, counted: see victimCells.)
        break
      case 'found':
        out.push({ id: h.id, row: speaker, from: claim.slot, to: claim.slot, label: `found ${him.value}`, title, kind: 'stay' })
        break
      case 'empty':
        out.push({ id: h.id, row: speaker, from: claim.slot, to: claim.slot, label: `${short(claim.room)} empty`, title, kind: 'mark' })
        break
    }
  }
  // Lanes: what overlaps on one row stacks below.
  const laid: Item[] = []
  for (const it of [...out].sort((a, b) => a.from - b.from || a.id - b.id)) {
    let lane = 0
    while (laid.some((x) => x.row === it.row && x.lane === lane && !(x.to < it.from || x.from > it.to))) lane++
    laid.push({ ...it, lane })
  }
  return laid
})
const rows = computed(() => (tc.value ? tc.value.cast.map((c) => c.id) : []))
/**
 * The victim's evening as one row: at each half hour, where they are said to
 * have been and by how many ("dining room ×7"), and when they were found.
 */
const victimCells = computed(() => {
  const cells: { from: number; to: number; label: string; title: string }[] = []
  if (!tc.value) return cells
  for (let s = 0; s < SLOTS; s++) {
    const counts = new Map<string, string[]>()
    const add = (place: string, by: number) => counts.set(place, [...(counts.get(place) ?? []), name(by)])
    for (const { speaker, claim } of tl.heard) {
      if (claim.kind === 'stay' && claim.with.includes(VICTIM) && s >= claim.from && s <= claim.to) add(short(claim.room), speaker)
      if (claim.kind === 'lastSeen' && claim.slot === s) add(short(claim.room), speaker)
      if (claim.kind === 'found' && claim.slot === s) add('found dead', speaker)
    }
    if (counts.size === 0) continue
    const label = [...counts].map(([p, by]) => (p === 'found dead' ? p : `${p} ×${by.length}`)).join(' · ')
    const title = [...counts].map(([p, by]) => `${p}: ${by.join(', ')}`).join('\n')
    const prev = cells.at(-1)
    if (prev && prev.to === s - 1 && prev.label === label) prev.to = s
    else cells.push({ from: s, to: s, label, title })
  }
  return cells
})
const lanesOf = (row: number) => Math.max(1, ...items.value.filter((i) => i.row === row).map((i) => i.lane + 1))

/** Whether anything yet says when he died. */
const windowKnown = computed(
  () => tl.heard.some((h) => h.claim.kind === 'lastSeen' || h.claim.kind === 'found') || tl.found.some((e) => e.earliest !== undefined || e.latest !== undefined),
)
const inWindow = (t: number) => windowKnown.value && t >= tl.deathWindow.lo && t <= tl.deathWindow.hi

// ---- picking two statements ----
const picked = ref<number[]>([])
const verdict = ref<{ ok: boolean; text: string } | null>(null)
function pick(id: number) {
  verdict.value = null
  picked.value = picked.value.includes(id) ? picked.value.filter((x) => x !== id) : [...picked.value, id].slice(-2)
}
function testPair() {
  if (picked.value.length !== 2) return
  verdict.value = tl.pair(picked.value[0], picked.value[1])
  picked.value = []
}
const pickedNotes = computed(() =>
  picked.value.map((id) => {
    const h = tl.heard.find((x) => x.id === id) as Heard
    return `${name(h.speaker)}: ${noteOf(tc.value!, h.speaker, h.claim)}`
  }),
)

// ---- one half hour, on the plan ----
const slot = ref<number | null>(null)
/** Where everybody is, at the chosen half hour, by what has been said. */
const plan = computed(() => {
  const t = tc.value
  const s = slot.value
  if (!t || s === null) return []
  const v = slotView(tl.heard, s, name)
  return t.rooms
    .filter((r) => r.bed === undefined || v.rooms.has(r.id))
    .map((r) => ({
      id: r.id,
      name: r.bed !== undefined ? `${t.cast[r.bed].shortName}’s room` : roomName(t, r.id),
      scene: r.id === t.scene,
      clashes: v.clashes.get(r.id) ?? [],
      people: (v.rooms.get(r.id) ?? []).map((p) => ({ who: p.who, by: p.own ? 'own word' : `by ${name(p.by)}`, odd: v.doubled.has(p.who) })),
    }))
})

// ---- accusing ----
const accusing = ref(false)
const truthRows = computed(() => {
  const t = tc.value
  if (!t) return []
  const end = t.truth.foundSlot
  return t.cast.map((c) => {
    const runs: { from: number; to: number; room: Place }[] = []
    for (let s = 0; s <= end; s++) {
      const room = t.truth.schedule[c.id][s]
      const prev = runs.at(-1)
      if (prev && prev.room === room) prev.to = s
      else runs.push({ from: s, to: s, room })
    }
    return { c, runs, role: t.truth.roles[c.id] }
  })
})
const culprit = computed(() => tc.value?.truth.roles.indexOf('murderer') ?? -1)
/** The victim's own evening, to the moment. */
const victimRuns = computed(() => {
  const t = tc.value
  if (!t) return []
  const runs: { from: number; to: number; room: Place }[] = []
  t.truth.victim.forEach((room, s) => {
    if (room === null) return
    const prev = runs.at(-1)
    if (prev && prev.room === room) prev.to = s
    else runs.push({ from: s, to: s, room })
  })
  return runs
})
const ROLE_WORDS = computed(() => ({
  murderer: 'the murderer',
  secretive: 'had a secret of their own',
  witness: `saw ${him.value} go in`,
  discoverer: `found ${him.value}`,
  guest: 'a guest',
}))
</script>

<template>
  <section class="timeline">
    <header class="top">
      <div>
        <p class="kicker small">Playtest · not yet public</p>
        <h2 class="brass">The Evening Timeline</h2>
      </div>
      <button class="ghost" @click="leave()">Leave</button>
    </header>

    <!-- ---- the start ---- -->
    <div v-if="!tc" class="start frame">
      <p>
        You arrive the following evening. Last night, at a dinner at Blackwood Manor, somebody was killed. Ask each
        guest what happened last night, pin down when it was done, and find who was unaccounted for then.
      </p>
      <div class="choices">
        <label v-for="d in ['easy', 'normal', 'hard'] as const" :key="d" class="choice" :class="{ on: difficulty === d }">
          <input v-model="difficulty" type="radio" :value="d" />
          <strong>{{ d === 'easy' ? 'Easy' : d === 'normal' ? 'Normal' : 'Hard' }}</strong>
          <span class="small muted">{{
            d === 'easy'
              ? 'The doctor’s note gives the latest time, and a stopped watch is at the scene.'
              : d === 'normal'
                ? 'A smashed watch is at the scene, to be found.'
                : 'No clock to find: only who saw the victim last, and who found the body.'
          }}</span>
        </label>
      </div>
      <button class="primary" @click="begin()">Begin</button>
      <p v-if="failed" class="small danger-text">That evening would not deal. Try again.</p>
    </div>

    <template v-else-if="tl.phase === 'play'">
      <!-- ---- the case sheet and the clock ---- -->
      <div class="sheet paper">
        <p>
          <strong>{{ tc.victimName }}</strong> was found dead in {{ roomName(tc, tc.scene) }} last night. Everybody
          had dined together at seven. One of the six did it; one other is hiding something of their own.
        </p>
        <p v-for="e in tl.found.filter((x) => x.plain)" :key="e.id" class="note">{{ e.name }}</p>
      </div>
      <div class="clock">
        <span>Hour {{ Math.min(tl.hour + 1, BUDGET.hours) }} of {{ BUDGET.hours }}</span>
        <span>{{ tl.questionsLeft }} questions left this hour</span>
        <span>{{ tl.searchedThisHour ? 'Searched this hour' : 'One search this hour' }}</span>
        <button class="second" :disabled="tl.outOfTime" @click="tl.nextHour()">Let the hour pass</button>
        <button class="danger" @click="accusing = true">Accuse</button>
      </div>
      <p v-if="tl.outOfTime" class="small warn">Your time is up: name the murderer.</p>

      <!-- ---- what was last said ---- -->
      <div v-if="tl.lastWords" class="speech frame">
        <Portrait v-if="tl.lastWords.speaker !== null" :who="tc.cast[tl.lastWords.speaker].defId" :pack="tl.pack" :trait="null" size="3.4rem" />
        <div>
          <strong v-if="tl.lastWords.speaker !== null">{{ tc.cast[tl.lastWords.speaker].shortName }}</strong>
          <p>{{ tl.lastWords.text }}</p>
        </div>
      </div>

      <!-- ---- the board ---- -->
      <div class="board-wrap">
        <div class="board">
          <div class="row head">
            <div class="who" />
            <div class="track">
              <button
                v-for="s in SLOTS"
                :key="s"
                class="slot"
                :class="{ on: slot === s - 1, window: inWindow(s - 1) }"
                :style="{ gridColumn: `${s}` }"
                @click="slot = slot === s - 1 ? null : s - 1"
              >
                {{ SLOT_CLOCK[s - 1] }}
              </button>
            </div>
          </div>
          <div class="row victim">
            <div class="who"><span>{{ tc.victimShort }}</span></div>
            <div class="track" style="grid-template-rows: 1.7rem">
              <div
                v-for="s in SLOTS"
                :key="`vbg${s}`"
                class="cell"
                :class="{ window: inWindow(s - 1), on: slot === s - 1 }"
                :style="{ gridColumn: `${s}`, gridRow: '1' }"
              />
              <div
                v-for="c in victimCells"
                :key="c.from"
                class="bar vcell"
                :style="{ gridColumn: `${c.from + 1} / ${c.to + 2}`, gridRow: '1' }"
                :title="c.title"
              >
                {{ c.label }}
              </div>
            </div>
          </div>
          <div v-for="r in rows" :key="r" class="row">
            <div class="who">
              <Portrait :who="tc.cast[r].defId" :pack="tl.pack" :trait="null" shape="token" size="1.8rem" />
              <span>{{ tc.cast[r].shortName }}</span>
            </div>
            <div class="track" :style="{ gridTemplateRows: `repeat(${lanesOf(r)}, 1.7rem)` }">
              <div
                v-for="s in SLOTS"
                :key="`bg${s}`"
                class="cell"
                :class="{ window: inWindow(s - 1), on: slot === s - 1 }"
                :style="{ gridColumn: `${s}`, gridRow: `1 / span ${lanesOf(r)}` }"
              />
              <button
                v-for="it in items.filter((i) => i.row === r)"
                :key="`${it.id}-${it.row}-${it.kind}`"
                class="bar"
                :class="[it.kind, { picked: picked.includes(it.id), owned: it.owned }]"
                :style="{ gridColumn: `${it.from + 1} / ${it.to + 2}`, gridRow: `${it.lane + 1}` }"
                :title="it.title"
                @click="pick(it.id)"
              >
                {{ it.label }}
              </button>
            </div>
          </div>
        </div>
        <p class="small muted legend">
          Tap a time to see where everybody says they were then. Tap two statements to test whether both can be true.
          <span v-if="windowKnown">Shaded: when {{ tc.victimShort }} can have died, taking everybody at their word ({{ span(tl.deathWindow.lo, tl.deathWindow.hi) }}).</span>
        </p>
      </div>

      <div v-if="picked.length > 0" class="pairing frame">
        <p v-for="(n, i) in pickedNotes" :key="i" class="small">{{ n }}</p>
        <button class="primary" :disabled="picked.length !== 2" @click="testPair()">These cannot both be true</button>
        <button class="ghost" @click="picked = []">Clear</button>
      </div>
      <p v-if="verdict" class="small" :class="verdict.ok ? 'good-text' : 'muted'">{{ verdict.text }}</p>

      <!-- ---- one half hour on the plan ---- -->
      <div v-if="slot !== null" class="plan frame">
        <h4>At {{ SLOT_CLOCK[slot] }}, by what has been said</h4>
        <div class="rooms">
          <div v-for="room in plan" :key="room.id" class="room" :class="{ scene: room.scene }">
            <strong>{{ room.name }}</strong>
            <span v-if="room.scene" class="small danger-text"> · where the body was found</span>
            <ul>
              <li v-for="p in room.people" :key="`${p.who}-${p.by}`" :class="{ odd: p.odd }">
                {{ name(p.who) }} <span class="small muted">({{ p.by }})</span>
              </li>
            </ul>
            <p v-for="(n, i) in room.clashes" :key="i" class="small danger-text clash">{{ n }}</p>
          </div>
        </div>
        <p class="small muted">Marked in red: somebody placed in two rooms at once.</p>
      </div>

      <!-- ---- the household ---- -->
      <div class="guests">
        <div v-for="g in tc.cast" :key="g.id" class="guest frame">
          <Portrait :who="g.defId" :pack="tl.pack" :trait="null" size="3.6rem" />
          <div class="body">
            <strong>{{ g.shortName }}</strong>
            <span class="small muted">{{ g.title }}</span>
            <div class="asks">
              <button class="second" :disabled="!tl.canAsk || tl.asked[g.id]?.evening" @click="tl.ask(g.id, 'evening')">
                What happened last night?
              </button>
              <button class="second" :disabled="!tl.canAsk || tl.asked[g.id]?.lastSeen" @click="tl.ask(g.id, 'lastSeen')">
                When did you last see {{ him }}?
              </button>
              <button class="danger" :disabled="!tl.canAsk || !tl.pressable.has(g.id)" @click="tl.press(g.id)">Press</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ---- searching ---- -->
      <div class="search frame">
        <h4>Search a room <span class="small muted">(one an hour)</span></h4>
        <div class="roomlist">
          <button
            v-for="r in tc.rooms.filter((x) => x.bed === undefined)"
            :key="r.id"
            class="second"
            :disabled="tl.searchedThisHour || tl.outOfTime || tl.searched.includes(r.id)"
            @click="tl.search(r.id)"
          >
            {{ short(r.id) }}
          </button>
        </div>
        <ul v-if="tl.found.length > 0" class="found">
          <li v-for="e in tl.found" :key="e.id">{{ e.name }}</li>
        </ul>
      </div>

      <!-- ---- naming the murderer ---- -->
      <div v-if="accusing" class="accuse frame">
        <h4>Who did it?</h4>
        <div class="roomlist">
          <button v-for="g in tc.cast" :key="g.id" class="danger" @click="tl.accuse(g.id)">{{ g.shortName }}</button>
        </div>
        <button class="ghost" @click="accusing = false">Not yet</button>
      </div>
    </template>

    <!-- ---- the reveal ---- -->
    <template v-else>
      <div class="verdict frame" :class="tl.accused === culprit ? 'right' : 'wrong'">
        <h3>{{ tl.accused === culprit ? 'You have your murderer.' : 'The wrong guest.' }}</h3>
        <p>
          It was <strong>{{ name(culprit) }}</strong>, alone with {{ him }} in {{ roomName(tc, tc.scene) }} at
          {{ SLOT_CLOCK[tc.truth.murderSlot] }}.
          <template v-if="tl.accused !== culprit && tl.accused !== null"> You named {{ name(tl.accused) }}.</template>
        </p>
        <p v-if="tc.truth.secret" class="small">
          {{ name(tc.truth.secret.by) }}, who {{ tc.truth.secret.what.replace(/^went/, 'had gone') }}, was the other with something to hide.
        </p>
        <p class="small muted">
          {{ tl.stillPossible.length === 1 ? 'What you gathered was enough to prove it.' : `On what you gathered, ${tl.stillPossible.map(name).join(', ')} could still have done it.` }}
          The bot solved it in {{ tc.solution.questions }} questions and {{ tc.solution.searches }} {{ tc.solution.searches === 1 ? 'search' : 'searches' }}.
        </p>
      </div>
      <div class="board-wrap">
        <div class="board">
          <div class="row head">
            <div class="who" />
            <div class="track">
              <div v-for="s in SLOTS" :key="s" class="slot" :class="{ window: s - 1 === tc.truth.murderSlot }" :style="{ gridColumn: `${s}` }">
                {{ SLOT_CLOCK[s - 1] }}
              </div>
            </div>
          </div>
          <div class="row victim">
            <div class="who"><span>{{ tc.victimShort }}</span></div>
            <div class="track" style="grid-template-rows: 1.7rem">
              <div
                v-for="run in victimRuns"
                :key="run.from"
                class="bar stay"
                :class="{ hot: run.to === tc.truth.murderSlot }"
                :style="{ gridColumn: `${run.from + 1} / ${run.to + 2}` }"
              >
                {{ short(run.room) }}
              </div>
            </div>
          </div>
          <div v-for="r in truthRows" :key="r.c.id" class="row" :class="{ guilty: r.c.id === culprit }">
            <div class="who">
              <Portrait :who="r.c.defId" :pack="tl.pack" :trait="null" shape="token" size="1.8rem" />
              <span>{{ r.c.shortName }} <span class="small muted">· {{ ROLE_WORDS[r.role] }}</span></span>
            </div>
            <div class="track" style="grid-template-rows: 1.7rem">
              <div
                v-for="run in r.runs"
                :key="run.from"
                class="bar stay"
                :class="{ hot: run.room === tc.scene && r.c.id === culprit && run.from <= tc.truth.murderSlot && run.to >= tc.truth.murderSlot }"
                :style="{ gridColumn: `${run.from + 1} / ${run.to + 2}` }"
                :title="inPlace(tc, run.room, r.c.id)"
              >
                {{ short(run.room, r.c.id) }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="again">
        <button class="primary" @click="tl.leave()">Another evening</button>
        <button class="ghost" @click="leave()">Back to the title</button>
      </div>
    </template>
    <StatementScene v-if="tl.telling" />
  </section>
</template>

<style scoped>
.timeline {
  width: min(100%, 64rem);
  margin: 0 auto;
  padding: 1rem 16px 4rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  text-align: left;
}
.top {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.top h2 {
  margin: 0;
  font-family: var(--font-display);
  letter-spacing: 0.08em;
}
.kicker {
  margin: 0;
  color: var(--danger);
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.frame {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  padding: 0.8rem 1rem;
}
.start p {
  margin-top: 0;
}
.choices {
  display: grid;
  gap: 0.5rem;
  margin: 0.8rem 0;
}
.choice {
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: 0.6rem;
  align-items: baseline;
  padding: 0.5rem 0.7rem;
  border: 1px solid var(--line);
  border-radius: 6px;
  cursor: pointer;
}
.choice.on {
  border-color: var(--brass);
}
.sheet {
  background: var(--paper);
  color: var(--paper-ink);
  border-radius: 6px;
  padding: 0.8rem 1rem;
}
.sheet p {
  margin: 0.2rem 0;
}
.sheet .note {
  font-family: var(--font-hand);
  font-size: 1.2rem;
}
.clock {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  align-items: center;
  color: var(--muted);
}
.clock button {
  margin-left: auto;
}
.clock button + button {
  margin-left: 0;
}
.warn,
.danger-text {
  color: var(--danger);
}
.good-text {
  color: var(--good);
}
.speech {
  display: flex;
  gap: 0.8rem;
  align-items: flex-start;
}
.speech p {
  margin: 0.2rem 0 0;
}
.board-wrap {
  overflow-x: auto;
}
.board {
  min-width: 44rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.row {
  display: grid;
  grid-template-columns: 10rem 1fr;
  align-items: stretch;
}
.row.victim .who {
  color: var(--danger);
}
.row.guilty .who {
  color: var(--danger);
  font-weight: 600;
}
.who {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  padding-right: 0.4rem;
}
.track {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 2px 0;
  position: relative;
}
.slot {
  font-size: 0.75rem;
  padding: 0.3rem 0;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--muted);
  border-radius: 4px;
  margin: 0 1px;
  text-align: center;
}
.slot.window {
  color: var(--ink);
  border-color: var(--danger);
}
.slot.on {
  background: var(--brass-deep);
  color: var(--ink);
}
.cell {
  border-left: 1px solid var(--line);
  opacity: 0.6;
}
.cell.window {
  background: color-mix(in srgb, var(--danger) 14%, transparent);
  opacity: 1;
}
.cell.on {
  background: color-mix(in srgb, var(--brass) 12%, transparent);
  opacity: 1;
}
.bar {
  z-index: 1;
  margin: 1px 2px;
  padding: 0 0.4rem;
  font-size: 0.72rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-radius: 5px;
  border: 1px solid var(--line);
  background: #222a33;
  color: var(--ink);
  text-align: left;
  min-height: 0;
  line-height: 1.5rem;
}
.bar.mark {
  background: transparent;
  border-style: dashed;
  color: var(--muted);
}
.bar.owned {
  border-color: var(--good);
}
.bar.picked {
  border-color: var(--brass);
  box-shadow: 0 0 0 1px var(--brass);
}
.bar.vcell {
  background: transparent;
  border-color: var(--danger);
  color: var(--ink);
  cursor: default;
}
.room .clash {
  margin: 0.2rem 0 0;
}
.bar.hot {
  border-color: var(--danger);
  background: var(--danger-deep);
}
.legend {
  margin: 0.4rem 0 0;
}
.pairing {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 0.8rem;
  align-items: center;
}
.pairing p {
  margin: 0;
  flex-basis: 100%;
}
.plan h4,
.search h4,
.accuse h4 {
  margin: 0 0 0.5rem;
}
.rooms {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  gap: 0.5rem;
}
.room {
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 0.4rem 0.6rem;
  font-size: 0.85rem;
}
.room.scene {
  border-color: var(--danger);
}
.room ul {
  margin: 0.2rem 0 0;
  padding-left: 1rem;
}
.room li.odd {
  color: var(--danger);
}
.guests {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(19rem, 1fr));
  gap: 0.6rem;
}
.guest {
  display: flex;
  gap: 0.7rem;
}
.guest .body {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.asks {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.35rem;
}
.asks button,
.roomlist button {
  font-size: 0.8rem;
  padding: 0.35rem 0.6rem;
}
.roomlist {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}
.found {
  margin: 0.6rem 0 0;
}
.verdict.right {
  border-color: var(--good);
}
.verdict.wrong {
  border-color: var(--danger);
}
.verdict h3 {
  margin: 0;
}
.again {
  display: flex;
  gap: 0.6rem;
}
</style>

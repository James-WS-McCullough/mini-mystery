<script setup lang="ts">
// A guest giving their statement, on a screen of its own: what they say typed
// out in their voice, a sentence at a time, and the plan of the house at the
// half hour they are speaking of, with them in their room beside everybody
// already heard from. Nothing moves on until the detective does: a click
// finishes a line, and the next click goes on (a half hour at a time, through
// a stretch of the evening, so the others can be watched coming and going).
import { computed, ref } from 'vue'
import { slotView } from '../../engine/timeline/board'
import { sayClaim, span } from '../../engine/timeline/render'
import { SLOT_CLOCK, VICTIM, type TSpoken } from '../../engine/timeline/types'
import { useTimeline } from '../../stores/timeline'
import type { MapSource } from '../../ui/mapSource'
import ClockFace from '../ClockFace.vue'
import DialogueBox from '../DialogueBox.vue'
import Icon from '../Icon.vue'
import ManorMap from '../ManorMap.vue'
import Portrait from '../Portrait.vue'
import { clashes, pinsOf, upstairsOf } from './pins'
import { useTimelineWords } from './words'

const tl = useTimeline()
const { name, short, voiceOf } = useTimelineWords()
const tc = computed(() => tl.tc!)
const telling = computed(() => tl.telling!)
const speaker = computed(() => telling.value.speaker)

/** What they say now, in order. */
const said = computed(() => tl.heard.filter((h) => telling.value.ids.includes(h.id)))

/**
 * The beats of the telling: a sentence, and the half hour it is about. A
 * stretch of the evening is a beat for each of its half hours, the sentence
 * typed once. Words said before any of it (pressed, the words they give up
 * with) are a beat of their own.
 */
interface Beat {
  /** The sentence's place among what is said (-1: the words before). */
  i: number
  text: string
  slot: number | null
  /** The first beat of its sentence: typed out. */
  first: boolean
  /** The whole stretch the sentence covers. */
  from: number
  to: number
}
const beats = computed<Beat[]>(() => {
  const out: Beat[] = []
  if (telling.value.line) {
    const first = said.value[0]?.claim
    const slot = first ? (first.kind === 'stay' ? first.from : first.slot) : null
    out.push({ i: -1, text: telling.value.line, slot, first: true, from: slot ?? 0, to: slot ?? 0 })
  }
  said.value.forEach((h, i) => {
    const c = h.claim
    const text = sayClaim(tc.value, speaker.value, c)
    if (c.kind === 'stay') {
      for (let s = c.from; s <= c.to; s++) out.push({ i, text, slot: s, first: s === c.from, from: c.from, to: c.to })
    } else out.push({ i, text, slot: c.slot, first: true, from: c.slot, to: c.slot })
  })
  return out
})
const step = ref(0)
const beat = computed(() => beats.value[step.value])
const last = computed(() => step.value >= beats.value.length - 1)
/** The sentence (by its place), so the box types it once however many half hours it covers. */
const lineKey = computed(() => `${beat.value?.i ?? 'none'}`)

/** Everything heard before this statement, and as much of it as has been said so far. */
const heardNow = computed<TSpoken[]>(() => {
  const before = tl.heard.filter((h) => !telling.value.ids.includes(h.id))
  const upTo = beat.value && beat.value.i >= 0 ? said.value.slice(0, beat.value.i + 1) : []
  return [...before, ...upTo]
})
const view = computed(() => (beat.value?.slot === null || beat.value?.slot === undefined ? null : slotView(heardNow.value, beat.value.slot, name)))
/** The room the sentence puts them in, at the half hour. */
const where = computed(() => {
  const h = beat.value && beat.value.i >= 0 ? said.value[beat.value.i] : undefined
  if (!h) return undefined
  return h.claim.kind === 'stay' || h.claim.kind === 'found' ? h.claim.room : h.claim.kind === 'saw' || h.claim.kind === 'lastSeen' || h.claim.kind === 'empty' ? h.claim.room : undefined
})
const source = computed<MapSource | null>(() => {
  const v = view.value
  if (!v) return null
  return {
    seed: tc.value.seed,
    pack: tl.pack,
    scene: tc.value.scene,
    placements: pinsOf(v, tl.pack, name),
    nameOf: name,
    defIdOf: (c) => (c === VICTIM ? undefined : tc.value.cast[c]?.defId),
    searched: (room) => tl.searched.includes(room),
    found: (room) => tl.found.filter((e) => e.room === room && !e.plain).map((e) => ({ id: e.id, name: e.name, proves: 'a clue to the time' })),
    flag: (p) => clashes(v, p),
    ...(where.value && tl.pack.rooms.some((r) => r.id === where.value) ? { focus: where.value } : {}),
  }
})
const upstairs = computed(() => (view.value ? upstairsOf(view.value, tl.pack) : []))

function next() {
  if (last.value) done()
  else step.value++
}
function back() {
  if (step.value > 0) step.value--
}
function done() {
  tl.telling = null
}
</script>

<template>
  <div class="scene-shade" role="dialog" aria-modal="true" :aria-label="`${name(speaker)} gives a statement`">
    <div class="statement">
      <header>
        <p class="kicker small brass">{{ name(speaker) }}, of last night</p>
        <div v-if="beat && beat.slot !== null" class="time">
          <ClockFace :hour="7 + Math.floor(beat.slot / 2)" :spent="(beat.slot % 2) * 0.5" size="3.6rem" />
          <div>
            <span class="digits">{{ SLOT_CLOCK[beat.slot] }}</span>
            <span v-if="beat.to > beat.from" class="small muted"> · of {{ span(beat.from, beat.to) }}</span>
          </div>
        </div>
      </header>

      <div v-if="source" class="plan">
        <ManorMap :key="`map-${tc.seed}`" mode="view" :source="source" />
        <p v-if="upstairs.length > 0" class="small muted">
          Upstairs:
          <span v-for="(u, i) in upstairs" :key="u.who">{{ i > 0 ? ', ' : '' }}{{ name(u.who) }} ({{ short(u.room, u.who) }})</span>
        </p>
        <template v-if="view">
          <p v-for="c in view.doubled" :key="`d${c}`" class="small clash">{{ name(c) }} is placed in two rooms at once.</p>
          <template v-for="[room, notes] in view.clashes" :key="room">
            <p v-for="(n, i) in notes" :key="i" class="small clash">{{ short(room) }}: {{ n }}.</p>
          </template>
        </template>
      </div>

      <div class="dock">
      <div class="speech">
        <Portrait :who="tc.cast[speaker].defId" :pack="tl.pack" :trait="null" size="clamp(3.6rem, 12vw, 5.4rem)" mood="speaking" />
        <DialogueBox
          v-if="beat"
          :key="lineKey"
          :speaker="name(speaker)"
          :voice="voiceOf(speaker)"
          :text="beat.text"
          :fresh="beat.first"
          more
          @advance="next()"
        />
        <DialogueBox v-else :speaker="name(speaker)" :voice="voiceOf(speaker)" text="I have nothing to add." more @advance="done()" />
      </div>

      <footer>
        <span class="small muted">{{ beats.length > 0 ? `${step + 1} of ${beats.length} · click the speech to go on` : '' }}</span>
        <button class="ghost" :disabled="step === 0" @click="back()"><Icon name="back" /> Back</button>
        <button class="ghost" @click="done()">Skip to the end</button>
      </footer>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scene-shade {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: radial-gradient(ellipse at center, rgba(20, 25, 32, 0.96) 0%, rgba(4, 5, 7, 0.99) 75%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
  padding: 1rem 16px 0;
}
.statement {
  width: min(100%, 60rem);
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  text-align: left;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}
.kicker {
  margin: 0;
  font-family: var(--font-display);
  letter-spacing: 0.25em;
  text-transform: uppercase;
}
.time {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.digits {
  font-family: var(--font-display);
  font-size: 1.6rem;
  letter-spacing: 0.06em;
  color: var(--brass);
}
.plan p {
  margin: 0.3rem 0 0;
}
.clash {
  color: var(--danger);
}
.dock {
  position: sticky;
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.6rem 0 0.4rem;
  background: linear-gradient(to bottom, rgba(4, 5, 7, 0) 0%, rgba(4, 5, 7, 0.97) 1.2rem);
}
.speech {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  align-items: center;
}
footer {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: flex-end;
}
footer .muted {
  margin-right: auto;
}
</style>

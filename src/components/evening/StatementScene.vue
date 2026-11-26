<script setup lang="ts">
// A guest telling their evening, on a screen of its own: what they say typed
// out in their voice, a sentence at a time, and the plan of the place at the
// hour they are speaking of, with them in their room beside everybody already
// heard from. Nothing moves on until the detective does: a click finishes a
// line, and the next click goes on (an hour at a time, through a stretch of
// the evening, so the others can be watched coming and going).
import { computed, ref } from 'vue'
import { slotView } from '../../engine/evening/board'
import { sayEvening, span } from '../../engine/evening/render'
import { EVICTIM, type EHeard } from '../../engine/evening/types'
import { useGame } from '../../stores/game'
import type { MapSource } from '../../ui/mapSource'
import ClockFace from '../ClockFace.vue'
import DialogueBox from '../DialogueBox.vue'
import Icon from '../Icon.vue'
import ManorMap from '../ManorMap.vue'
import Portrait from '../Portrait.vue'
import { clashes, pinsOf, upstairsOf } from './pins'
import { useEveningWords } from './words'

const game = useGame()
const { name, short, voiceOf } = useEveningWords()
const m = computed(() => game.mystery!)
const ev = computed(() => m.value.evening!)
const telling = computed(() => game.telling!)
const speaker = computed(() => telling.value.speaker)

/** What they say now, in order. */
const said = computed(() => game.eveningHeard.filter((h) => telling.value.ids.includes(h.id)))

/** The beats of the telling: a sentence, and the hour it is about (a stretch is a beat for each of its hours, typed once). */
interface Beat {
  i: number
  text: string
  slot: number
  first: boolean
  from: number
  to: number
}
const beats = computed<Beat[]>(() => {
  const out: Beat[] = []
  said.value.forEach((h, i) => {
    const c = h.claim
    const text = sayEvening(game.ctx!, speaker.value, c)
    if (c.kind === 'heard') out.push({ i, text, slot: c.slot, first: true, from: c.slot, to: c.slot })
    else if (c.kind === 'lastSeen') {
      const s = c.left ? c.slot - 1 : c.slot
      out.push({ i, text, slot: s, first: true, from: s, to: s })
    } else for (let s = c.from; s <= c.to; s++) out.push({ i, text, slot: s, first: s === c.from, from: c.from, to: c.to })
  })
  return out
})
const step = ref(0)
const beat = computed(() => beats.value[step.value])
const last = computed(() => step.value >= beats.value.length - 1)

/** Everything heard before this telling, and as much of it as has been said so far. */
const heardNow = computed<EHeard[]>(() => {
  const before = game.eveningHeard.filter((h) => !telling.value.ids.includes(h.id) && h.speaker !== speaker.value)
  const upTo = beat.value ? said.value.slice(0, beat.value.i + 1) : []
  return [...before, ...upTo]
})
const view = computed(() => (beat.value ? slotView(heardNow.value, beat.value.slot, name) : null))
/** The room the sentence puts them in. */
const where = computed(() => {
  const h = beat.value ? said.value[beat.value.i] : undefined
  return h && (h.claim.kind === 'stay' || h.claim.kind === 'lastSeen') ? h.claim.room : undefined
})
const source = computed<MapSource | null>(() => {
  const v = view.value
  if (!v) return null
  return {
    seed: m.value.seed,
    pack: game.pack,
    scene: m.value.caseSheet.sceneRoom,
    placements: pinsOf(v, game.pack, name),
    nameOf: name,
    defIdOf: (c) => (c === EVICTIM ? undefined : m.value.cast[c]?.defId),
    searched: (room) => game.searchedRooms.includes(room),
    found: () => [],
    flag: (p) => clashes(v, p),
    ...(where.value && game.pack.rooms.some((r) => r.id === where.value) ? { focus: where.value } : {}),
  }
})
const upstairs = computed(() => (view.value ? upstairsOf(view.value) : []))
const hourOf = (slot: number) => Number(ev.value.clock[slot].split(':')[0])
const minutesOf = (slot: number) => Number(ev.value.clock[slot].split(':')[1])

function next() {
  if (last.value) done()
  else step.value++
}
function back() {
  if (step.value > 0) step.value--
}
function done() {
  game.telling = null
}
</script>

<template>
  <div class="scene-shade" role="dialog" aria-modal="true" :aria-label="`${name(speaker)} tells of last night`">
    <div class="statement">
      <header>
        <p class="kicker small brass">{{ name(speaker) }}, of last night</p>
        <div v-if="beat" class="time">
          <ClockFace :hour="hourOf(beat.slot)" :spent="minutesOf(beat.slot) / 60" size="3.6rem" />
          <div>
            <span class="digits">{{ ev.clock[beat.slot] }}</span>
            <span v-if="beat.to > beat.from" class="small muted"> · of {{ span(ev, beat.from, beat.to) }}</span>
          </div>
        </div>
      </header>

      <div v-if="source" class="plan">
        <ManorMap :key="`map-${m.seed}`" mode="view" :source="source" />
        <p v-if="upstairs.length > 0" class="small muted">
          In their own rooms:
          <span v-for="(u, i) in upstairs" :key="u">{{ i > 0 ? ', ' : '' }}{{ name(u) }}</span>
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
          <Portrait :who="m.cast[speaker].defId" size="clamp(3.6rem, 12vw, 5.4rem)" mood="speaking" />
          <DialogueBox
            v-if="beat"
            :key="`line${beat.i}`"
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

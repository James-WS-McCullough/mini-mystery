<script setup lang="ts">
// A guest giving their statement, on a screen of its own: the clock moves on
// through their evening as they tell it, and the plan of the house shows them
// going from room to room, beside everybody already heard from, at the same
// half hour. Whatever will not fit lights up as it is said.
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { slotView } from '../../engine/timeline/board'
import { roomName, sayClaim } from '../../engine/timeline/render'
import { SLOT_CLOCK, VICTIM, type TSpoken } from '../../engine/timeline/types'
import { useTimeline } from '../../stores/timeline'
import { settings } from '../../ui/settings'
import ClockFace from '../ClockFace.vue'
import Portrait from '../Portrait.vue'

const tl = useTimeline()
const tc = computed(() => tl.tc!)
const telling = computed(() => tl.telling!)
const speaker = computed(() => telling.value.speaker)
const name = (c: number) => (c === VICTIM ? tc.value.victimShort : tc.value.cast[c].shortName)

/** What they say now, in order. */
const said = computed(() => tl.heard.filter((h) => telling.value.ids.includes(h.id)))
/** One beat a half hour: a stretch of an evening is walked through slot by slot. */
const beats = computed(() => {
  const out: { i: number; slot: number }[] = []
  said.value.forEach((h, i) => {
    const c = h.claim
    if (c.kind === 'stay') for (let s = c.from; s <= c.to; s++) out.push({ i, slot: s })
    else out.push({ i, slot: c.slot })
  })
  return out
})
const step = ref(0)
const beat = computed(() => beats.value[step.value] ?? null)
const sentence = computed(() => (beat.value ? sayClaim(tc.value, speaker.value, said.value[beat.value.i].claim) : ''))
const last = computed(() => step.value >= beats.value.length - 1)

/** Everything heard before this statement, and as much of it as has been said so far. */
const heardNow = computed<TSpoken[]>(() => {
  const before = tl.heard.filter((h) => !telling.value.ids.includes(h.id))
  const upTo = beat.value ? said.value.slice(0, beat.value.i + 1) : []
  return [...before, ...upTo]
})
const view = computed(() => (beat.value ? slotView(heardNow.value, beat.value.slot, name) : null))

/** The house as boxes, the bedrooms gathered upstairs. */
const house = computed(() => tc.value.rooms.filter((r) => r.bed === undefined))
const upstairs = computed(() => {
  const v = view.value
  if (!v) return []
  return tc.value.rooms
    .filter((r) => r.bed !== undefined)
    .flatMap((r) => (v.rooms.get(r.id) ?? []).map((p) => ({ ...p, room: r.id, owner: r.bed! })))
})

// ---- the telling, at its own pace ----
const playing = ref(!settings.reducedMotion)
let timer: ReturnType<typeof setInterval> | undefined
function tick() {
  if (last.value) playing.value = false
  else step.value++
}
watch(
  playing,
  (on) => {
    clearInterval(timer)
    if (on) timer = setInterval(tick, 1600)
  },
  { immediate: true },
)
onBeforeUnmount(() => clearInterval(timer))
function next() {
  playing.value = false
  if (!last.value) step.value++
}
function back() {
  playing.value = false
  if (step.value > 0) step.value--
}
function done() {
  clearInterval(timer)
  tl.telling = null
}
</script>

<template>
  <div class="scene-shade" role="dialog" aria-modal="true" :aria-label="`${name(speaker)} gives a statement`">
    <div class="statement">
      <header>
        <Portrait :who="tc.cast[speaker].defId" :pack="tl.pack" :trait="null" size="5rem" mood="speaking" />
        <div class="words">
          <strong class="brass">{{ name(speaker) }}</strong>
          <p v-if="telling.line" class="line">{{ telling.line }}</p>
          <p v-if="sentence" class="said">“{{ sentence }}”</p>
          <p v-else-if="!telling.line" class="said muted">They have nothing to add.</p>
        </div>
        <div v-if="beat" class="time">
          <ClockFace :hour="7 + Math.floor(beat.slot / 2)" :spent="(beat.slot % 2) * 0.5" size="4.6rem" />
          <span class="digits">{{ SLOT_CLOCK[beat.slot] }}</span>
        </div>
      </header>

      <div v-if="view && beat" class="plan">
        <div
          v-for="r in house"
          :key="r.id"
          class="room"
          :class="{ scene: r.id === tc.scene, clash: view.clashes.has(r.id), here: said[beat.i].claim.kind === 'stay' && (said[beat.i].claim as { room: string }).room === r.id }"
        >
          <span class="rname">{{ roomName(tc, r.id).replace(/^the /i, '') }}</span>
          <div class="tokens">
            <span
              v-for="p in (view.rooms.get(r.id) ?? []).filter((x, i, all) => all.findIndex((y) => y.who === x.who) === i)"
              :key="p.who"
              class="token"
              :class="{ speaker: p.who === speaker, doubled: view.doubled.has(p.who), victim: p.who === VICTIM }"
              :title="`${name(p.who)}, on ${p.own ? 'their own word' : `${name(p.by)}’s word`}`"
            >
              <Portrait v-if="p.who !== VICTIM" :who="tc.cast[p.who].defId" :pack="tl.pack" :trait="null" shape="token" size="2.2rem" />
              <span v-else class="dot">✝</span>
              <span class="tname">{{ name(p.who) }}</span>
            </span>
          </div>
          <p v-for="(n, i) in view.clashes.get(r.id) ?? []" :key="i" class="note">{{ n }}</p>
        </div>
        <div v-if="upstairs.length > 0" class="room upstairs">
          <span class="rname">upstairs</span>
          <div class="tokens">
            <span v-for="p in upstairs" :key="`${p.who}-${p.room}`" class="token" :class="{ speaker: p.who === speaker, doubled: view.doubled.has(p.who) }">
              <Portrait :who="tc.cast[p.who].defId" :pack="tl.pack" :trait="null" shape="token" size="2.2rem" />
              <span class="tname">{{ name(p.who) }} <span class="muted">· {{ p.owner === p.who ? 'own room' : `${name(p.owner)}’s room` }}</span></span>
            </span>
          </div>
        </div>
      </div>
      <p v-if="view && (view.doubled.size > 0 || view.clashes.size > 0)" class="warn small">
        Red: something here will not fit with what you have already heard.
      </p>

      <footer>
        <span class="small muted">{{ beats.length > 0 ? `${step + 1} of ${beats.length}` : '' }}</span>
        <button class="ghost" :disabled="step === 0" @click="back()">‹ Back</button>
        <button v-if="beats.length > 1 && !last" class="ghost" @click="playing = !playing">{{ playing ? 'Pause' : 'Play' }}</button>
        <button v-if="!last" class="second" @click="next()">Next ›</button>
        <button class="primary" @click="done()">{{ last ? 'Back to the board' : 'Skip to the board' }}</button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.scene-shade {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(5, 7, 10, 0.97);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
  padding: 1.2rem 16px;
}
.statement {
  width: min(100%, 60rem);
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  text-align: left;
}
header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1rem;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  padding: 0.8rem 1rem;
}
.words p {
  margin: 0.25rem 0 0;
}
.said {
  font-size: 1.15rem;
}
.line {
  color: var(--muted);
}
.time {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
}
.digits {
  font-family: var(--font-display);
  font-size: 1.4rem;
  letter-spacing: 0.06em;
}
.plan {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
  gap: 0.5rem;
}
.room {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 0.5rem 0.6rem;
  min-height: 5.2rem;
  background: rgba(23, 28, 35, 0.8);
  transition: border-color 0.3s ease, background 0.3s ease;
}
.room.here {
  border-color: var(--brass);
}
.room.scene .rname {
  color: var(--danger);
}
.room.clash {
  border-color: var(--danger);
  background: var(--danger-deep);
}
.rname {
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}
.tokens {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.6rem;
  margin-top: 0.35rem;
}
.token {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.78rem;
  border-radius: 999px;
  padding-right: 0.4rem;
  animation: arrive 0.35s ease;
}
.token.speaker {
  box-shadow: 0 0 0 2px var(--brass);
}
.token.doubled {
  box-shadow: 0 0 0 2px var(--danger);
}
.token.victim .dot {
  display: inline-grid;
  place-items: center;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 50%;
  border: 1px solid var(--danger);
  color: var(--danger);
}
.note {
  margin: 0.35rem 0 0;
  font-size: 0.75rem;
  color: var(--danger);
}
.warn {
  margin: 0;
  color: var(--danger);
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
@keyframes arrive {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
}
.reduced-motion .token {
  animation: none;
}
</style>

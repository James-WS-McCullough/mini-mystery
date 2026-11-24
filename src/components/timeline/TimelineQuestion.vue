<script setup lang="ts">
// The household, as in the classic night: a gallery of the guests to choose
// from, then one of them in the chair, and the questions to ask. Each answer
// is told on a screen of its own (StatementScene); what they said stays in
// the speech box after.
import { computed, ref } from 'vue'
import { useTimeline } from '../../stores/timeline'
import ActionBar from '../ActionBar.vue'
import BackLink from '../BackLink.vue'
import DialogueBox from '../DialogueBox.vue'
import Icon from '../Icon.vue'
import Portrait from '../Portrait.vue'
import { useTimelineWords } from './words'

const tl = useTimeline()
const { him, voiceOf } = useTimelineWords()
const tc = computed(() => tl.tc!)
const HOURS = ['Eight', 'Nine', 'Ten', 'Eleven']

const seat = ref<number | null>(null)
const who = computed(() => (seat.value === null ? null : tc.value.cast[seat.value]))
const said = computed(() => (seat.value === null ? '' : (tl.lastWords[seat.value] ?? '')))
const asked = (c: number) => tl.asked[c] ?? {}
</script>

<template>
  <ActionBar centre>
    <button @click="tl.boardOpen = true"><Icon name="clock" /> The timeline</button>
    <button :class="{ primary: tl.questionsLeft === 0 }" data-next @click="tl.strikeHour()">
      {{ tl.isLastHour ? 'Face midnight' : 'Let the hour strike' }} <Icon name="forward" />
    </button>
  </ActionBar>
  <Transition name="fade" mode="out-in">
    <div v-if="who === null" key="gallery" class="suspects">
      <p class="hour-line brass small">{{ HOURS[tl.hour] }} o’clock</p>
      <h2 class="heading">Whom will you question?</h2>
      <p class="lede">
        {{
          tl.questionsLeft > 0
            ? `${tl.questionsLeft} question${tl.questionsLeft === 1 ? '' : 's'} before the hour strikes.`
            : 'The hour has run out of questions.'
        }}
        Open the timeline to see the evening as it has been told, and to set two accounts side by side.
      </p>
      <div class="grid">
        <div v-for="(m, i) in tc.cast" :key="m.id" class="suspect" :class="{ flagged: tl.pressable.has(m.id) }" :style="{ animationDelay: `${i * 0.05}s` }">
          <button class="sit" @click="seat = m.id">
            <Portrait :who="m.defId" :pack="tl.pack" :trait="null" size="clamp(4.2rem, 21vw, 5.6rem)" />
            <strong class="who-name">{{ m.shortName }}</strong>
            <span class="small job">{{ m.title }}</span>
          </button>
          <div class="tally small">
            <span v-if="tl.pressable.has(m.id)" class="flag" title="A contradiction stands against them"><Icon name="bolt" /></span>
            <span v-if="tl.statementsBy(m.id) > 0" class="said" :title="`${tl.statementsBy(m.id)} statements noted`">
              <Icon name="speech" /> {{ tl.statementsBy(m.id) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-else key="interview" class="interview">
      <BackLink class="back-row" @back="seat = null" />
      <aside class="sitter">
        <Portrait :who="who.defId" :pack="tl.pack" :trait="null" size="clamp(4.6rem, 17vw, 11rem)" />
        <div class="ident">
          <h3 class="brass">{{ who.name }}</h3>
          <p class="small muted">{{ who.title }}</p>
        </div>
      </aside>
      <div class="talk">
        <DialogueBox
          v-if="said"
          :key="`said-${who.id}-${tl.statementsBy(who.id)}`"
          :speaker="who.shortName"
          :voice="voiceOf(who.id)"
          :text="said"
          :fresh="false"
        />
        <p v-else class="small muted">They wait for your question.</p>
        <div class="choices">
          <button class="choice" :disabled="!tl.canAsk || asked(who.id).evening" @click="tl.ask(who.id, 'evening')">
            <Icon name="speech" /> What happened last night?
            <span v-if="asked(who.id).evening" class="small muted">· asked</span>
          </button>
          <button class="choice" :disabled="!tl.canAsk || asked(who.id).lastSeen" @click="tl.ask(who.id, 'lastSeen')">
            <Icon name="eye" /> When did you last see {{ him }}?
            <span v-if="asked(who.id).lastSeen" class="small muted">· asked</span>
          </button>
          <button class="choice press" :disabled="!tl.canAsk || !tl.pressable.has(who.id)" @click="tl.press(who.id)">
            <Icon name="bolt" /> Press them on the contradiction
            <span v-if="!tl.pressable.has(who.id) && !asked(who.id).pressed" class="small muted">· set two accounts against each other on the timeline first</span>
            <span v-if="asked(who.id).pressed" class="small muted">· pressed</span>
          </button>
        </div>
        <p class="small muted">
          {{ tl.questionsLeft > 0 ? `${tl.questionsLeft} question${tl.questionsLeft === 1 ? '' : 's'} left this hour.` : 'No questions left this hour.' }}
        </p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.suspects {
  max-width: 64rem;
  margin: 0 auto;
  padding: 1.4rem 16px 3rem;
  text-align: center;
}
.hour-line {
  margin: 0;
  letter-spacing: 0.3em;
  text-transform: uppercase;
}
.heading {
  margin: 0.2rem 0 0.4rem;
}
.lede {
  max-width: 40rem;
  margin: 0 auto 1rem;
  color: var(--muted);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
  gap: 0.8rem;
}
.suspect {
  position: relative;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--panel);
  padding: 0.6rem 0.4rem 0.5rem;
  animation: rise 0.35s ease-out both;
}
.suspect.flagged {
  border-color: var(--danger);
}
.sit {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  width: 100%;
  background: none;
  border: none;
  padding: 0.2rem;
}
.who-name {
  font-size: 1rem;
}
.job {
  color: var(--muted);
  line-height: 1.2;
}
.tally {
  display: flex;
  justify-content: center;
  gap: 0.6rem;
  min-height: 1.2rem;
  color: var(--muted);
}
.flag {
  color: var(--danger);
}
.interview {
  max-width: 60rem;
  margin: 0 auto;
  padding: 1rem 16px 3rem;
  display: grid;
  grid-template-columns: minmax(10rem, 14rem) 1fr;
  gap: 1.2rem;
  text-align: left;
}
.back-row {
  grid-column: 1 / -1;
}
.sitter {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
}
.ident h3 {
  margin: 0;
}
.ident p {
  margin: 0.2rem 0 0;
}
.talk {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
.choices {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.choice {
  text-align: left;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}
.choice.press:not(:disabled) {
  border-color: var(--danger);
}
@media (max-width: 640px) {
  .interview {
    grid-template-columns: 1fr;
  }
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}
</style>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { guestsOf, scriptParts, type RoleClass } from '../engine/deck'
import { inRoom, occasionOf } from '../engine/render'
import type { RoleId } from '../engine/types'
import { useGame } from '../stores/game'
import { sfx } from '../ui/audio'
import ActionBar from './ActionBar.vue'
import Icon from './Icon.vue'
import RoleTag from './RoleTag.vue'

const game = useGame()
const sheet = computed(() => game.mystery!.caseSheet)
const script = computed(() => sheet.value.script)
const has = (role: RoleId) =>
  [...script.value.innocents, ...script.value.herrings, ...script.value.helpers].includes(role)
/** The script in its four classes, with how many guests of each are in the house. */
const parts = computed(() => scriptParts(script.value))
/** The classes opened out to show their roles. */
const opened = ref<Set<RoleClass>>(new Set())
function toggle(id: RoleClass) {
  sfx('click')
  const next = new Set(opened.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  opened.value = next
}
const hasLoner = computed(() => has('loner'))
/** Anything beyond a plain night: the rules that change with the evening go last, where they are easy to spot. */
const tonight = computed(
  () =>
    has('drunk') ||
    script.value.helpers.length > 0 ||
    (script.value.murderers?.length ?? 1) > 1 ||
    !!sheet.value.passageRooms,
)
const occasion = computed(() => (game.ctx ? occasionOf(game.ctx) : undefined))
/** The kinds of murderer there may be tonight. One did it; which kind is not told. */
const kinds = computed(() =>
  (script.value.murderers ?? []).flatMap((k) => {
    const kind = game.ctx?.pack.murderers?.[k]
    return kind ? [kind] : []
  }),
)
const mayBe = (k: 'serial' | 'regretful') => script.value.murderers?.includes(k) ?? false
const where = (id: string) => (game.ctx ? inRoom(game.ctx, id) : id)

function summon() {
  sfx('select')
  game.begin()
}
</script>

<template>
  <main v-if="game.mystery" class="intro">
    <header>
      <p class="file brass">{{ game.daily ? `The daily case · ${game.daily}` : 'Case file' }}</p>
      <h2 class="heading">Case №{{ game.mystery.seed }}</h2>
    </header>
    <p class="narration">{{ game.introText }}</p>

    <section class="sheet paper">
      <h3>The facts of the case</h3>
      <p>
        <template v-if="occasion">{{ `${occasion.sheet} ` }}</template>
        <strong>{{ sheet.victimName }}</strong> — found {{ where(sheet.sceneRoom) }}. The
        deed was done {{ sheet.windowLabel }}.
      </p>
      <p class="shape-lede">
        Every guest has one role tonight, and no two share one. More roles are listed here
        than there are guests, so some are not in {{ game.place.name }} at all. Ask a guest who
        they are and they will name a role — a guest with something to hide names one that is
        not theirs.
      </p>
      <p class="small muted classes-lede">Tonight’s script. Open a class to see its roles; hover a role for what it does.</p>
      <div class="classes">
        <div v-for="part in parts" :key="part.id" class="class" :class="[part.id, { open: opened.has(part.id) }]">
          <button class="class-head" :aria-expanded="opened.has(part.id)" @click="toggle(part.id)">
            <span class="count">{{ guestsOf(script, part.id) }}</span>
            <span class="name">{{ part.name }}</span>
            <span class="blurb">— {{ part.blurb }}</span>
            <Icon :name="opened.has(part.id) ? 'up' : 'down'" class="fold" />
          </button>
          <div v-if="opened.has(part.id)" class="grid">
            <template v-if="part.id === 'murderer' && kinds.length > 1">
              <RoleTag v-for="k in kinds" :key="k.name" role="culprit" on-paper :tip-name="k.name" :tip-text="k.does">{{ k.name }}</RoleTag>
            </template>
            <template v-else>
              <RoleTag v-for="role in part.roles" :key="role" :role="role" on-paper />
            </template>
          </div>
        </div>
      </div>
      <p class="shape-lede">The rules of the night:</p>
      <ul class="shape">
        <li>No two suspects share the same role. If two claim to have the same one, one of them is lying.</li>
        <li>The crime scene will have evidence of how the murder was committed.</li>
        <li>
          A suspect who spent the hour alone will likely leave a trace in that room. Search it,
          and you can corroborate their alibi<template v-if="hasLoner"> (the Loner leaves none)</template>.
        </li>
        <li>
          Two suspects who were in the same room are covering for each other. If both are
          truthful, their alibi is corroborated.
        </li>
        <li>
          A suspect who confesses to a lesser crime may still be the murderer. Check their story
          against the evidence.
        </li>
      </ul>
      <template v-if="tonight">
        <p class="shape-lede">Tonight in particular:</p>
        <ul class="shape">
          <li v-if="has('drunk')">
            The Drunk may be about: a suspect who is honest, and wrong — about who they are and
            what they know.
          </li>
          <li v-if="script.helpers.length > 0">
            The murderer {{ script.helperMaybe ? 'may have' : 'has' }} one accomplice, and never
            more<template v-if="script.helperMaybe">. If there is an accomplice, there is no Drunk</template>.
          </li>
          <li v-if="has('perjurer')">
            The Perjurer will swear the murderer was with them. Corroborate a pair with a trace or
            a witness before you trust it.
          </li>
          <li v-if="has('forger')">Evidence you find yourself is genuine. Evidence a suspect hands you may be forged.</li>
          <li v-if="has('framer')">A trace at the crime scene was planted by the Framer. It never belongs to the murderer.</li>
          <li v-if="has('cleaner')">If the weapon is missing from the crime scene, the Cleaner hid it in the room they were really in.</li>
          <li v-if="has('whisperer')">
            One honest suspect may be repeating a story the Whisperer told them. Press them, and
            they will say who told it.
          </li>
          <li v-if="has('sponsor')">
            A suspect who refuses to talk has been paid by the Sponsor. Find the money and show it
            to them: they will name who paid, and talk.
          </li>
          <li v-if="kinds.length > 1">There is one murderer. Which kind, you will not be told.</li>
          <li v-if="mayBe('serial')">
            A Serial Murderer kills again at ten o’clock — the suspect who knows the most about
            them. Search that room: the murderer will have left a trace.
          </li>
          <li v-if="mayBe('regretful') || has('martyr')">
            A suspect may confess at the gathering. If they had means, motive and opportunity,
            they are the murderer. If they lacked one, they are the Martyr, covering for somebody
            else.
          </li>
          <li v-if="sheet.passageRooms">
            A secret passage runs from {{ where(sheet.sceneRoom).replace(/^(in|on) /, '') }} to
            one other room. Search rooms to find it, or ask the Architect. Until you know where it
            runs, being alone in a room is not an alibi.
          </li>
        </ul>
      </template>
      <span class="stamp-mark">Confidential</span>
    </section>

    <ActionBar>
      <button class="primary" data-next @click="summon()">
        Summon {{ game.place.people }} <Icon name="forward" />
      </button>
    </ActionBar>
  </main>
</template>

<style scoped>
.intro {
  max-width: 48rem;
  margin: 0 auto;
  padding: 2.2rem 1rem 3.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}
header {
  text-align: center;
}
.file {
  margin: 0 0 0.2rem;
  font-family: var(--font-display);
  letter-spacing: 0.3em;
  text-transform: uppercase;
  font-size: 0.85rem;
}
.narration {
  line-height: 1.65;
  font-style: italic;
  font-size: 1.08rem;
  max-width: 44rem;
  margin: 0 auto;
  text-align: center;
}
.sheet {
  position: relative;
  max-width: 44rem;
  width: 100%;
  margin: 0 auto;
  padding: 1.1rem 1.4rem 1.2rem;
  transform: rotate(-0.5deg);
  line-height: 1.55rem;
  animation: rise 0.6s ease-out both;
}
.sheet h3 {
  margin: 0 0 0.35rem;
  font-family: var(--font-type);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-size: 1rem;
  border-bottom: 2px solid var(--paper-ink);
  padding-bottom: 0.2rem;
}
.sheet p {
  margin: 0;
}
.shape-lede {
  margin-top: 1.55rem !important;
  color: var(--paper-muted);
}
.part {
  margin: 0.9rem 0 0;
  font-family: var(--font-type);
  font-weight: bold;
  font-size: 0.85rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--paper-ink);
}
.part .blurb {
  font-weight: normal;
  text-transform: none;
  letter-spacing: 0;
  color: var(--paper-muted);
}
.classes-lede {
  margin: 1.2rem 0 0.4rem !important;
  color: var(--paper-muted);
}
.classes {
  display: grid;
  gap: 0.3rem;
}
.class-head {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  width: 100%;
  padding: 0.35rem 0.5rem;
  border: 1px solid rgba(90, 70, 20, 0.35);
  background: rgba(150, 120, 40, 0.08);
  color: var(--paper-ink);
  font-family: var(--font-type);
  font-size: 0.85rem;
  text-align: left;
  cursor: pointer;
}
.class-head:hover,
.class.open .class-head {
  background: rgba(150, 120, 40, 0.18);
}
.class-head .count {
  min-width: 1.6rem;
  font-weight: bold;
  white-space: nowrap;
  font-size: 1.05rem;
}
.class-head .name {
  font-weight: bold;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.class-head .blurb {
  color: var(--paper-muted);
}
.class-head .fold {
  margin-left: auto;
  color: var(--paper-muted);
}
.class .grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding: 0.5rem 0.5rem 0.6rem;
}
.class .grid .role-tag {
  cursor: help;
}
@media (max-width: 520px) {
  .class-head .blurb {
    display: none;
  }
}
.shape {
  margin: 0;
  padding-left: 1.3rem;
}
.stamp-mark {
  position: absolute;
  right: 1.1rem;
  top: 0.8rem;
  padding: 0.1rem 0.5rem 0;
  border: 2px solid rgba(160, 50, 40, 0.75);
  color: rgba(160, 50, 40, 0.8);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.75rem;
  transform: rotate(6deg);
}
@media (max-width: 520px) {
  .stamp-mark {
    display: none;
  }
}
.primary {
  align-self: center;
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
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
const does = (role: RoleId) => game.ctx?.pack.deckDescriptions[role] ?? ''
/** The script in its parts. How many of each are in the house is not told. */
const parts = computed(() => {
  const s = script.value
  return [
    { key: 'culprit', title: 'The one who did it', roles: ['culprit'] as RoleId[] },
    ...(s.helpers.length > 0
      ? [{ key: 'helpers', title: 'Whoever stands with them', roles: s.helpers }]
      : []),
    { key: 'herrings', title: 'Those who look worse than they are', roles: s.herrings },
    { key: 'innocents', title: 'Those with nothing to hide', roles: s.innocents },
  ]
})
const hasLoner = computed(() => has('loner'))
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
        <template v-if="occasion">{{ occasion.sheet }} </template>
        <strong>{{ sheet.victimName }}</strong> — found {{ where(sheet.sceneRoom) }}. The
        deed was done {{ sheet.windowLabel }}.
      </p>
      <p class="shape-lede">
        The seven each have a role tonight, and no two the same. These are the roles there
        <em>may</em> be — more than there are guests, so some are not in the house at all. Ask, and
        each will tell you who they are; those with something to hide will name a role from this
        list that is not theirs.
      </p>
      <template v-for="part in parts" :key="part.key">
        <h4 class="part">{{ part.title }}</h4>
        <ul v-if="part.key === 'culprit' && kinds.length > 1" class="roles">
          <li v-for="k in kinds" :key="k.name">
            <RoleTag role="culprit" on-paper>{{ k.name }}</RoleTag>
            <span class="does">{{ k.does }}</span>
          </li>
        </ul>
        <ul v-else class="roles">
          <li v-for="role in part.roles" :key="role">
            <RoleTag :role="role" on-paper />
            <span class="does">{{ does(role) }}</span>
          </li>
        </ul>
      </template>
      <p class="shape-lede">And what you may rely on:</p>
      <ul class="shape">
        <li>
          nobody shares a role — when two guests claim the same one, one of them is not what they
          say. But a role nobody else claims may still be a lie
        </li>
        <li>
          the scene will tell you how it was done — and nothing of who: the murderer leaves
          nothing of themselves there
        </li>
        <li v-if="script.helpers.length > 0">
          the murderer has one friend in the house, and one only. Find which, and you may stop
          fearing the others
        </li>
        <li v-if="kinds.length > 1">
          one of them did it, and one only; what kind of murderer they are, you are not told
        </li>
        <li v-if="mayBe('serial')">
          if the murderer is one who kills again, somebody will be found dead as ten o’clock
          strikes: whoever knows most against them. What you have not asked them by then, you
          never will — but the room will hold something of the murderer
        </li>
        <li v-if="mayBe('regretful') || has('martyr')">
          when the household is gathered for the accusation, somebody may stand and say they did
          it. It is the murderer, if they had the means, the motive and the opportunity; if they
          lacked any one of the three, it is the Martyr, and the murderer is somebody else
        </li>
        <li v-if="has('accomplice')">
          if it is the Accomplice, the murderer does not lie alone — they will swear they were
          together, so two guests vouching for each other prove nothing unless something else
          bears them out
        </li>
        <li v-else>
          whoever lies tonight lies alone — when two guests each put the other beside them, both
          are telling the truth
        </li>
        <li v-if="has('forger')">
          what you find with your own hands is true; what is handed to you is as true as whoever
          hands it
        </li>
        <li v-if="has('framer')">
          if you find something of somebody’s at the scene, the Framer put it there — and the
          Framer does not frame the murderer
        </li>
        <li v-if="has('cleaner')">
          if the scene has nothing to say how it was done, the Cleaner has carried the weapon off:
          it lies in the room where the Cleaner truly spent the hour
        </li>
        <li v-if="has('whisperer')">
          if it is the Whisperer, one honest guest who says they saw somebody is repeating a story
          they were told. Put a contradiction to them and they will say whose story it was
        </li>
        <li v-if="has('sponsor')">
          if a witness will not say what they know, the Sponsor has paid them. Find the money, set
          it beside their silence, and put it to them: they will name who paid, and talk
        </li>
        <li v-if="sheet.passageRooms">
          a secret passage runs from {{ where(sheet.sceneRoom).replace(/^(in|on) /, '') }} to one
          other room. Whoever spent the hour alone in that room could have gone by it and come
          back: a trace says they were there, and not that they stayed. Until you know where the
          passage runs, no lonely account clears anybody — though two who were together still
          answer for each other
        </li>
        <li v-if="sheet.passageRooms">
          the passage is to be found by searching the room it leads to — or by asking the
          Architect, if there is one, and if they are what they say
        </li>
        <li>
          whoever truly spent the hour alone left some trace of themselves in the room — find it,
          and their account is borne out<template v-if="hasLoner">
            (all but the Loner, if there is one, who left none)</template
          >
        </li>
        <li>
          where people spent the hour has nothing to do with what they are: any two guests may
          have been together, and anybody may have been alone
        </li>
      </ul>
      <span class="stamp-mark">Confidential</span>
    </section>

    <ActionBar>
      <button class="primary" data-next @click="summon()">
        Summon the household <Icon name="forward" />
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
  font-weight: normal;
  font-size: 0.85rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--paper-muted);
}
.roles {
  list-style: none;
  margin: 0.4rem 0 0;
  padding: 0;
  display: grid;
  gap: 0.35rem;
}
.roles li {
  display: grid;
  grid-template-columns: 12rem 1fr;
  gap: 0.2rem 0.7rem;
  align-items: baseline;
}
.roles li > :first-child {
  justify-self: start;
}
.roles .does {
  line-height: 1.4;
}
@media (max-width: 520px) {
  .roles li {
    grid-template-columns: 1fr;
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

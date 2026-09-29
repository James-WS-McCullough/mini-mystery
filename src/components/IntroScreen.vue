<script setup lang="ts">
import { computed } from 'vue'
import { roomName as engineRoomName } from '../engine/render'
import type { RoleId } from '../engine/types'
import { useGame } from '../stores/game'
import { sfx } from '../ui/audio'
import RoleTag from './RoleTag.vue'

const game = useGame()
const sheet = computed(() => game.mystery!.caseSheet)
/** The evening's roles, each once, with how many of the seven hold it. */
const eveningRoles = computed(() => {
  const pack = game.ctx?.pack
  if (!pack) return []
  const counts = new Map<RoleId, number>()
  for (const role of sheet.value.deck) counts.set(role, (counts.get(role) ?? 0) + 1)
  return [...counts].map(([role, count]) => ({
    role,
    count,
    does: pack.deckDescriptions[role] ?? '',
  }))
})

const has = (role: RoleId) => sheet.value.deck.includes(role)
/** Roles held by two tonight, by name. */
const doubled = computed(() =>
  eveningRoles.value
    .filter((r) => r.count > 1)
    .map((r) => `the two ${(game.ctx?.pack.roleNames[r.role] ?? r.role).replace(/^the /, '')}s`),
)
const hasLoner = computed(() => sheet.value.deck.includes('loner'))
const roomName = (id: string) => (game.ctx ? engineRoomName(game.ctx, id) : id)

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
        <strong>{{ sheet.victimName }}</strong> — found in {{ roomName(sheet.sceneRoom) }}. The
        deed was done {{ sheet.windowLabel }}.
      </p>
      <p class="shape-lede">
        The seven each have a role tonight. These are the roles; who holds which is for you to
        find out. Ask, and each will tell you who they are — though not every one of them truly.
      </p>
      <ul class="roles">
        <li v-for="r in eveningRoles" :key="r.role">
          <RoleTag :role="r.role" on-paper />
              <span class="does">{{ r.does }}</span>
        </li>
      </ul>
      <p class="shape-lede">And what you may rely on:</p>
      <ul class="shape">
        <li>
          no role is held twice<template v-if="doubled.length">, but for {{ doubled.join(' and ') }}</template>
          — when two guests claim the same role, one of them is not what they say
        </li>
        <li>the scene will tell you how it was done — and nothing of who</li>
        <li v-if="has('accomplice')">
          the murderer does not lie alone tonight — the Accomplice will swear they were together,
          so two guests vouching for each other prove nothing unless something else bears them out
        </li>
        <li v-else>
          whoever lies tonight lies alone — when two guests each put the other beside them, both
          are telling the truth
        </li>
        <li>
          whoever truly spent the hour alone left some trace of themselves in the room — find it,
          and their account is borne out<template v-if="hasLoner">
            (all but the one who kept to themselves, whom nothing vouches for)</template
          >
        </li>
      </ul>
      <span class="stamp-mark">Confidential</span>
    </section>

    <button class="primary" data-next @click="summon()">Summon the household</button>
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
.roles {
  list-style: none;
  margin: 0.4rem 0 0;
  padding: 0;
  display: grid;
  gap: 0.35rem;
}
.roles li {
  display: grid;
  grid-template-columns: 9.5rem 1fr;
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

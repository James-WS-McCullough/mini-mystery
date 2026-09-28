<script setup lang="ts">
import { computed } from 'vue'
import {
  meansLabel,
  roomName as engineRoomName,
  traitLabelOf,
} from '../engine/render'
import type { CastMember } from '../engine/types'
import { useGame } from '../stores/game'
import { sfx } from '../ui/audio'
import Icon from './Icon.vue'
import Portrait from './Portrait.vue'

const game = useGame()
const cast = computed(() => game.mystery?.cast ?? [])
const sheet = computed(() => game.mystery!.caseSheet)
const eveningShape = computed(() => {
  const pack = game.ctx?.pack
  if (!pack) return []
  const seen = new Set<string>()
  const lines: string[] = []
  for (const role of sheet.value.deck) {
    if (seen.has(role)) continue
    seen.add(role)
    const line = pack.deckDescriptions[role]
    if (line) lines.push(line)
  }
  return lines
})

const traitOf = (m: CastMember) => (game.ctx ? traitLabelOf(game.ctx, m) : m.trait)
const meansLabels = (ids: string[]) => ids.map((id) => (game.ctx ? meansLabel(game.ctx, id) : id))
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
      <p class="shape-lede">What you know this evening must contain:</p>
      <ul class="shape">
        <li v-for="(line, i) in eveningShape" :key="i">{{ line }}</li>
      </ul>
      <p class="shape-lede">And what you may rely on:</p>
      <ul class="shape">
        <li>
          whoever lies tonight lies alone — when two guests each put the other beside them, both
          are telling the truth
        </li>
      </ul>
      <span class="stamp-mark">Confidential</span>
    </section>

    <section>
      <h3 class="heading household">The household</h3>
      <div class="dossiers">
        <article
          v-for="(m, i) in cast"
          :key="m.id"
          class="dossier"
          :style="{ animationDelay: `${0.15 + i * 0.09}s` }"
        >
          <span class="seat">№{{ m.seat }}</span>
          <Portrait :who="m.defId" size="5.4rem" />
          <strong>{{ m.name }}</strong>
          <span class="small muted role">{{ m.title }}</span>
          <ul class="known small">
            <li><Icon name="eye" /> {{ traitOf(m) }}</li>
            <li v-for="line in meansLabels(m.means)" :key="line"><Icon name="key" /> {{ line }}</li>
          </ul>
        </article>
      </div>
    </section>

    <button class="primary" data-next @click="summon()">Summon the household</button>
  </main>
</template>

<style scoped>
.intro {
  max-width: 62rem;
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
.household {
  font-size: 1.3rem;
  margin-bottom: 0.8rem;
}
.dossiers {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: 0.7rem;
}
.dossier {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 1rem 0.8rem 0.9rem;
  text-align: center;
  border: 1px solid var(--line);
  background: linear-gradient(180deg, rgba(31, 38, 47, 0.9), rgba(18, 23, 29, 0.9));
  box-shadow: var(--shadow);
  animation: deal 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.1) both;
}
.dossier strong {
  margin-top: 0.4rem;
  font-family: var(--font-display);
  font-weight: normal;
  letter-spacing: 0.06em;
  font-size: 1.08rem;
  color: var(--brass);
}
.role {
  font-style: italic;
}
.seat {
  position: absolute;
  top: 0.45rem;
  left: 0.6rem;
  font-family: var(--font-type);
  font-size: 0.8rem;
  color: var(--muted);
}
.known {
  list-style: none;
  margin: 0.45rem 0 0;
  padding: 0.45rem 0 0;
  border-top: 1px solid var(--line);
  width: 100%;
  display: grid;
  gap: 0.15rem;
  text-align: left;
  color: var(--ink);
  opacity: 0.85;
}
.known .icon {
  color: var(--brass-dim);
  margin-right: 0.2rem;
}
.primary {
  align-self: center;
}
@keyframes deal {
  from {
    opacity: 0;
    transform: translateY(30px) rotate(4deg) scale(0.92);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>

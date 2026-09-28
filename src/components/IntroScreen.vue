<script setup lang="ts">
import { computed } from 'vue'
import { roomName as engineRoomName } from '../engine/render'
import { useGame } from '../stores/game'
import { sfx } from '../ui/audio'

const game = useGame()
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
      <p class="shape-lede">What you know this evening must contain:</p>
      <ul class="shape">
        <li v-for="(line, i) in eveningShape" :key="i">{{ line }}</li>
      </ul>
      <p class="shape-lede">And what you may rely on:</p>
      <ul class="shape">
        <li>the scene will tell you how it was done — and nothing of who</li>
        <li>
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

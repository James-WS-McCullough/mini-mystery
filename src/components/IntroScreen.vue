<script setup lang="ts">
import { computed } from 'vue'
import { useGame } from '../stores/game'

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

function traitLabel(id: string): string {
  return game.ctx?.pack.traits.find((t) => t.id === id)?.label ?? id
}
function meansLabels(ids: string[]): string {
  return ids
    .map((id) => game.ctx?.pack.means.find((m) => m.id === id)?.label ?? id)
    .join('; ')
}
function roomName(id: string): string {
  return game.ctx?.pack.rooms.find((r) => r.id === id)?.name ?? id
}
</script>

<template>
  <main class="intro" v-if="game.mystery">
    <h2 class="brass">Case №{{ game.mystery.seed }}</h2>
    <p class="narration">{{ game.introText }}</p>

    <div class="panel">
      <h3>The facts of the case</h3>
      <p>
        <strong>{{ sheet.victimName }}</strong> — found in {{ roomName(sheet.sceneRoom) }}.
        The deed was done {{ sheet.windowLabel }}.
      </p>
      <p class="small muted shape-lede">What you know this evening must contain:</p>
      <ul class="small shape">
        <li v-for="(line, i) in eveningShape" :key="i">{{ line }}</li>
      </ul>
    </div>

    <div class="panel">
      <h3>The household</h3>
      <table>
        <tbody>
          <tr v-for="m in cast" :key="m.id">
            <td class="seat muted">№{{ m.seat }}</td>
            <td class="portrait">{{ m.portrait }}</td>
            <td>
              <strong>{{ m.name }}</strong
              >, {{ m.title }}
              <div class="small muted">{{ traitLabel(m.trait) }} · {{ meansLabels(m.means) }}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <button class="primary" @click="game.begin()">Summon the household</button>
  </main>
</template>

<style scoped>
.intro {
  max-width: 44rem;
  margin: 4vh auto;
  padding: 0 1rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.narration {
  line-height: 1.6;
  font-style: italic;
}
table {
  border-collapse: collapse;
  width: 100%;
}
td {
  padding: 0.3rem 0.5rem;
  vertical-align: top;
}
.portrait {
  font-size: 1.4rem;
}
.shape-lede {
  margin-bottom: 0.2rem;
}
.shape {
  margin: 0;
  padding-left: 1.2rem;
  color: var(--brass);
}
.shape li {
  margin: 0.15rem 0;
}
button {
  align-self: center;
  font-size: 1.05rem;
}
</style>

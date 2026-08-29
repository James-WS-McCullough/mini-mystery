<script setup lang="ts">
import { computed } from 'vue'
import { useGame } from '../stores/game'

const game = useGame()
const rooms = computed(() => game.ctx?.pack.rooms ?? [])
const scene = computed(() => game.mystery?.caseSheet.sceneRoom)
const searchedRoomDef = computed(() =>
  rooms.value.find((r) => r.id === game.lastSearchRoom),
)
</script>

<template>
  <div class="search">
    <template v-if="game.stage === 'search'">
      <h2 class="brass">Where will you search this hour?</h2>
      <p class="lede muted">One room, before the household grows restless. Choose with care — or on a lead.</p>
      <div class="grid">
        <button
          v-for="r in rooms"
          :key="r.id"
          class="room"
          :class="{ searched: game.searchedRooms.includes(r.id), scene: r.id === scene }"
          :disabled="game.searchedRooms.includes(r.id)"
          @click="game.search(r.id)"
        >
          <span class="name">{{ r.name }}</span>
          <span v-if="r.id === scene" class="tag">† the scene of the crime</span>
          <span v-else-if="game.searchedRooms.includes(r.id)" class="tag muted">already searched</span>
        </button>
      </div>
      <button class="skip" @click="game.skipSearch()">Forgo the search this hour →</button>
    </template>

    <template v-else>
      <h2 class="brass">{{ searchedRoomDef?.name }}</h2>
      <div class="result panel">
        <p class="narration">{{ game.lastSearchText }}</p>
        <div v-if="game.lastSearchItems.length > 0" class="finds">
          <span
            v-for="item in game.lastSearchItems"
            :key="item.id"
            class="find"
            :class="{ probative: item.fact.kind !== 'flavor' }"
          >
            {{ item.fact.kind !== 'flavor' ? '◆' : '◇' }} {{ item.name }}
          </span>
        </div>
      </div>
      <button class="primary" @click="game.continueToQuestioning()">On to the questioning</button>
    </template>
  </div>
</template>

<style scoped>
.search {
  max-width: 44rem;
  margin: 6vh auto;
  padding: 0 1rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}
h2 {
  margin: 0;
  letter-spacing: 0.1em;
  text-align: center;
}
.lede {
  font-style: italic;
  margin: 0;
  text-align: center;
}
.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.6rem;
  width: 100%;
}
@media (max-width: 760px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
.room {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: center;
  padding: 1.1rem 0.5rem;
  min-height: 5.2rem;
  justify-content: center;
}
.room .name {
  font-size: 1rem;
}
.room.scene {
  border-color: var(--danger);
}
.room.searched {
  opacity: 0.45;
}
.tag {
  font-size: 0.75rem;
  color: var(--danger);
}
.skip {
  background: transparent;
  border: 0;
  color: var(--muted);
  text-decoration: underline;
}
.result {
  width: 100%;
  animation: appear 0.5s ease-out both;
}
.narration {
  line-height: 1.6;
  font-style: italic;
  margin: 0;
}
.finds {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-top: 0.7rem;
}
.find.probative {
  color: var(--brass);
}
@keyframes appear {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>

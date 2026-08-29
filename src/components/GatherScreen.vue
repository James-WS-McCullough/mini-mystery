<script setup lang="ts">
import { computed } from 'vue'
import { useGame } from '../stores/game'

const game = useGame()
const cast = computed(() => game.mystery?.cast ?? [])

function member(id: number) {
  return cast.value[id]
}
</script>

<template>
  <main class="gather" v-if="game.mystery">
    <h2 class="brass">The household gathers</h2>
    <p class="lede muted">
      Storm at the windows, a body upstairs, and seven guests in the hall —
      each with something to say before the questioning begins.
    </p>

    <div class="statements">
      <div v-for="s in game.openingStatements" :key="s.char" class="statement panel">
        <div class="who">
          <span class="portrait">{{ member(s.char).portrait }}</span>
          <div>
            <strong>{{ member(s.char).name }}</strong>
            <div class="small muted">{{ member(s.char).title }}</div>
          </div>
        </div>
        <p class="quote">“{{ s.text }}”</p>
      </div>
    </div>

    <button class="primary" @click="game.startInvestigation()">Begin the investigation</button>
  </main>
</template>

<style scoped>
.gather {
  max-width: 46rem;
  margin: 4vh auto;
  padding: 0 1rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
h2 {
  text-align: center;
  margin: 0;
  letter-spacing: 0.12em;
}
.lede {
  text-align: center;
  font-style: italic;
  margin: 0;
}
.statements {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.statement {
  animation: rise 0.4s ease-out both;
}
.statement:nth-child(1) { animation-delay: 0.05s }
.statement:nth-child(2) { animation-delay: 0.15s }
.statement:nth-child(3) { animation-delay: 0.25s }
.statement:nth-child(4) { animation-delay: 0.35s }
.statement:nth-child(5) { animation-delay: 0.45s }
.statement:nth-child(6) { animation-delay: 0.55s }
.statement:nth-child(7) { animation-delay: 0.65s }
.who {
  display: flex;
  gap: 0.6rem;
  align-items: center;
}
.portrait {
  font-size: 1.6rem;
}
.quote {
  margin: 0.5rem 0 0;
  line-height: 1.55;
}
button {
  align-self: center;
  font-size: 1.05rem;
  padding: 0.55rem 1.4rem;
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

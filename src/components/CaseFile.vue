<script setup lang="ts">
// The case file, as it reached the detective: the facts of the case and the
// photographs, tonight's cast and the rules of the night, and the Chief
// Inspector's word pinned to the foot. Read before the household is called;
// and to hand all evening after, should the detective want reminding (F).
import { computed } from 'vue'
import { occasionOf } from '../engine/render'
import { useGame } from '../stores/game'
import CastList from './CastList.vue'
import ManorMap from './ManorMap.vue'
import PhotoPrint from './PhotoPrint.vue'
import ScenePhoto from './ScenePhoto.vue'

const game = useGame()
const sheet = computed(() => game.mystery!.caseSheet)
const occasion = computed(() => (game.ctx ? occasionOf(game.ctx) : undefined))
/** The scene, by name: "the study". */
const sceneName = computed(() =>
  game.ctx?.pack.rooms.find((r) => r.id === sheet.value.sceneRoom)?.name ?? sheet.value.sceneRoom,
)
/** Where the body was found, as a form has it: "The study, Blackwood Manor". */
const found = computed(() => {
  const room = sceneName.value
  return `${room[0].toUpperCase()}${room.slice(1)}, ${game.place.placeName}`
})
</script>

<template>
  <section v-if="game.mystery" class="sheet paper">
    <h3>The facts of the case</h3>
    <div class="report">
      <!-- The photographs: the scene, and the plan of the place with the scene crossed out. -->
      <div class="shots">
        <ScenePhoto :seed="game.mystery.seed" />
        <PhotoPrint :tilt="-2">
          <ManorMap mode="photo" />
        </PhotoPrint>
      </div>
      <dl class="form">
        <dt>Victim</dt>
        <dd>{{ sheet.victimName }}</dd>
        <dt>Body found</dt>
        <dd>{{ found }}</dd>
        <dt>Time of death</dt>
        <dd>{{ game.ctx?.pack.windowClock }}</dd>
        <dt>Suspects</dt>
        <dd>{{ game.ctx?.pack.suspectsLine.replace('{n}', String(game.mystery.cast.length)) }}</dd>
      </dl>
      <p class="summary">{{ occasion?.report ?? occasion?.sheet }}</p>
    </div>
    <CastList />
    <!-- The word from above, pinned to the foot of the sheet. -->
    <aside class="note">
      <p>{{ game.ctx?.pack.chiefNote }}</p>
      <p class="sign">Chief Inspector Craddock</p>
    </aside>
    <span class="stamp-mark">Confidential</span>
  </section>
</template>

<style scoped>
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
/* ---- the report: a form filled in on the left, the photograph clipped on the right ---- */
.report {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  /* The account sits close under the form, whatever height the photographs take. */
  grid-template-rows: auto 1fr;
  gap: 1rem 1.4rem;
  align-items: start;
  margin-top: 0.6rem;
}
.form {
  grid-column: 1;
  grid-row: 1;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.15rem 0.9rem;
  margin: 0;
}
.form dt {
  font-family: var(--font-type);
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--paper-muted);
  white-space: nowrap;
}
.form dd {
  margin: 0;
  font-family: var(--font-type);
  border-bottom: 1px dotted var(--paper-line);
}
/* The photographs, down the right of the form and the account. */
.shots {
  grid-column: 2;
  grid-row: 1 / span 2;
  width: 11rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  margin: 0.3rem 0.2rem 0 0;
}
.summary {
  grid-column: 1;
  grid-row: 2;
  align-self: start;
  margin-top: 0.9rem !important;
}
/* The word from above: a slip in a superior's hand, at the foot of the sheet. */
.note {
  margin: 1.8rem 0 0.4rem auto;
  width: fit-content;
  max-width: 22rem;
  padding: 0.8rem 1.1rem 0.6rem;
  background: #f6efd3;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transform: rotate(-1.5deg);
  font-family: var(--font-hand);
  font-size: 1.3rem;
  line-height: 1.35;
  color: #1f2a4a;
}
/* The clip that holds it on, like the photographs'. */
.note {
  position: relative;
}
.note::before {
  content: '';
  position: absolute;
  top: -0.7rem;
  right: 1.6rem;
  width: 0.55rem;
  height: 1.6rem;
  border: 2px solid #8b8f94;
  border-radius: 0.4rem;
  transform: rotate(4deg);
}
.note .sign {
  margin-top: 0.4rem !important;
  text-align: right;
  font-family: var(--font-signature);
  font-size: 0.85rem;
}
/* On a phone the photograph sits smaller beside the form, and each field's name goes above it. */
@media (max-width: 520px) {
  /* The photograph floats at the right, and the fields run beside it and then across beneath it. */
  .report {
    display: flow-root;
  }
  .shots {
    float: right;
    width: 7rem;
    gap: 0.9rem;
    margin: 0.4rem 0 0.4rem 0.8rem;
  }
  .form {
    display: block;
  }
  .form dt,
  .form dd {
    display: flow-root;
  }
  .form dd {
    margin-bottom: 0.45rem;
    line-height: 1.35;
  }
  .note {
    margin-right: 0;
    font-size: 1.2rem;
  }
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
</style>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { guestsOf, scriptParts, type RoleClass } from '../engine/deck'
import { occasionOf } from '../engine/render'
import type { RoleId } from '../engine/types'
import { useGame } from '../stores/game'
import { sfx } from '../ui/audio'
import ActionBar from './ActionBar.vue'
import Icon from './Icon.vue'
import RoleTag from './RoleTag.vue'
import ManorMap from './ManorMap.vue'
import PhotoPrint from './PhotoPrint.vue'
import ScenePhoto from './ScenePhoto.vue'

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
/**
 * Anything beyond a plain night, kept short: what each role and each kind of
 * murderer does is in its own description, so only the Drunk, the accomplice
 * and the passage are spelled out here.
 */
const tonight = computed(
  () => has('drunk') || script.value.helpers.length > 0 || !!sheet.value.passageRooms,
)
const occasion = computed(() => (game.ctx ? occasionOf(game.ctx) : undefined))
/** The kinds of murderer there may be tonight. One did it; which kind is not told. */
const kinds = computed(() =>
  (script.value.murderers ?? []).flatMap((k) => {
    const kind = game.ctx?.pack.murderers?.[k]
    if (!kind) return []
    // (Where he may truly have done it himself, the Artful Murderer says so.)
    return [script.value.suicide && kind.orTruly ? { ...kind, does: `${kind.does} ${kind.orTruly}` } : kind]
  }),
)
/** The scene, by name: "the study". */
const sceneName = computed(() =>
  game.ctx?.pack.rooms.find((r) => r.id === sheet.value.sceneRoom)?.name ?? sheet.value.sceneRoom,
)
/** Where the body was found, as a form has it: "The study, Blackwood Manor". */
const found = computed(() => {
  const room = sceneName.value
  return `${room[0].toUpperCase()}${room.slice(1)}, ${game.place.placeName}`
})

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
      <p class="shape-lede">
        Every guest has one role tonight, and no two share one. More roles are listed here
        than there are guests, so some are not in {{ game.place.name }} at all. Ask a guest who
        they are and they will name a role. A guest with something to hide names one that is
        not theirs.
      </p>
      <p class="small muted classes-lede">Tonight’s script. Open a class to see its roles; hover a role for what it does.</p>
      <div class="classes">
        <div v-for="part in parts" :key="part.id" class="class" :class="[part.id, { open: opened.has(part.id) }]">
          <button class="class-head" :aria-expanded="opened.has(part.id)" @click="toggle(part.id)">
            <span class="count">{{ guestsOf(script, part.id) }}</span>
            <span class="name">{{ part.name }}</span>
            <span class="blurb">{{ part.blurb }}</span>
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
      </ul>
      <template v-if="tonight">
        <p class="shape-lede">Tonight in particular:</p>
        <ul class="shape">
          <li v-if="has('drunk')">
            One suspect may have had too much to drink. They will give a false role and false
            information.
          </li>
          <li v-if="script.helpers.length > 0">
            The murderer {{ script.helperMaybe ? 'may have' : 'has' }} an accomplice. They may
            forge or hide evidence, or lie to give the murderer an alibi. Stay on your toes,
            detective!
          </li>
          <li v-if="sheet.passageRooms">
            There may be a secret passage to the scene of the crime. Even if someone left traces in
            the connected room, they could still have committed the murder.
          </li>
        </ul>
      </template>
      <!-- The word from above, pinned to the foot of the sheet. -->
      <aside class="note">
        <p>{{ game.ctx?.pack.chiefNote }}</p>
        <p class="sign">Chief Inspector Craddock</p>
      </aside>
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

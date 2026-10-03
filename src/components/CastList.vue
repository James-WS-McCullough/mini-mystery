<script setup lang="ts">
// Tonight's script: every part that may be in the house, in its four classes
// with how many of each are at the table, and the rules of the night. On the
// case file before the household is called, and to hand all evening after.
import { computed, ref } from 'vue'
import { guestsOf, scriptParts, type RoleClass } from '../engine/deck'
import type { RoleId } from '../engine/types'
import { useGame } from '../stores/game'
import { sfx } from '../ui/audio'
import Icon from './Icon.vue'
import RoleTag from './RoleTag.vue'
import RoleText from './RoleText.vue'
import { placeText } from '../engine/render'

const props = defineProps<{
  /** Every class opened out from the start (as it is kept to hand during the night). */
  allOpen?: boolean
  /** What each part does written out beside it, and not only on a tip (as it is kept to hand). */
  detailed?: boolean
}>()

const game = useGame()
const sheet = computed(() => game.mystery!.caseSheet)
const script = computed(() => sheet.value.script)
const has = (role: RoleId) =>
  [...script.value.innocents, ...script.value.suspicious, ...script.value.accomplices].includes(role)
/** The script in its four classes, with how many guests of each are in the house. */
const parts = computed(() => scriptParts(script.value))
/** The classes opened out to show their roles. */
const opened = ref<Set<RoleClass>>(new Set(props.allOpen ? parts.value.map((p) => p.id) : []))
function toggle(id: RoleClass) {
  sfx('click')
  const next = new Set(opened.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  opened.value = next
}
const hasLoner = computed(() => has('loner'))
/** What a part does, in this setting's words. */
const does = (role: RoleId) => {
  const pack = game.ctx?.pack
  return pack ? placeText(pack, pack.deckDescriptions[role] ?? '') : ''
}
/**
 * Anything beyond a plain night, kept short: what each role and each kind of
 * murderer does is in its own description, so only the Drunk, the accomplice
 * and the passage are spelled out here.
 */
const tonight = computed(
  () => has('drunk') || script.value.accomplices.length > 0 || !!sheet.value.passageRooms,
)
/** The kinds of murderer there may be tonight. One did it; which kind is not told. */
const kinds = computed(() =>
  (script.value.murderers ?? []).flatMap((k) => {
    const kind = game.ctx?.pack.murderers?.[k]
    if (!kind) return []
    // (Where he may truly have done it himself, the Artful Murderer says so.)
    return [script.value.suicide && kind.orTruly ? { ...kind, does: `${kind.does} ${kind.orTruly}` } : kind]
  }),
)
</script>

<template>
  <div class="cast">
    <p class="shape-lede">
      Every guest has one role tonight, and no two share one. More roles are listed here
      than there are guests, so some are not in {{ game.place.name }} at all. Ask a guest who
      they are and they will name a role. A guest with something to hide names one that is
      not theirs.
    </p>
    <p class="small muted classes-lede">
      {{ detailed ? 'Tonight’s script, and what each part does.' : 'Tonight’s script. Open a class to see its roles; hover a role for what it does.' }}
    </p>
    <div class="classes">
      <div v-for="part in parts" :key="part.id" class="class" :class="[part.id, { open: opened.has(part.id) }]">
        <button class="class-head" :aria-expanded="opened.has(part.id)" @click="toggle(part.id)">
          <span class="count">{{ guestsOf(script, part.id) }}</span>
          <span class="name">{{ part.name }}</span>
          <span class="blurb">{{ part.blurb }}</span>
          <Icon :name="opened.has(part.id) ? 'up' : 'down'" class="fold" />
        </button>
        <dl v-if="opened.has(part.id) && detailed" class="parts">
          <template v-if="part.id === 'murderer' && kinds.length > 1">
            <div v-for="k in kinds" :key="k.name" class="row">
              <dt><RoleTag role="murderer" on-paper :tip-name="k.name" :tip-text="k.does">{{ k.name }}</RoleTag></dt>
              <dd>{{ k.does }}</dd>
            </div>
          </template>
          <template v-else>
            <div v-for="role in part.roles" :key="role" class="row">
              <dt><RoleTag :role="role" on-paper /></dt>
              <dd><RoleText :text="does(role)" on-paper /></dd>
            </div>
          </template>
        </dl>
        <div v-else-if="opened.has(part.id)" class="grid">
          <template v-if="part.id === 'murderer' && kinds.length > 1">
            <RoleTag v-for="k in kinds" :key="k.name" role="murderer" on-paper :tip-name="k.name" :tip-text="k.does">{{ k.name }}</RoleTag>
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
        <li v-if="script.accomplices.length > 0">
          The murderer {{ script.accompliceMaybe ? 'may have' : 'has' }} an accomplice. They may
          forge or hide evidence, or lie to give the murderer an alibi. Stay on your toes,
          detective!
        </li>
        <li v-if="sheet.passageRooms">
          There may be a secret passage to the scene of the crime. Even if someone left traces in
          the connected room, they could still have committed the murder.
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
p {
  margin: 0;
}
.shape-lede {
  margin-top: 1.55rem !important;
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
/* Written out: each part, and what it does. */
.parts {
  margin: 0;
  padding: 0.4rem 0.5rem 0.6rem;
  display: grid;
  gap: 0.55rem;
}
.parts .row {
  display: grid;
  grid-template-columns: 11rem 1fr;
  gap: 0.6rem;
  align-items: baseline;
}
.parts dt {
  margin: 0;
}
.parts dd {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.3rem;
}
@media (max-width: 520px) {
  .parts .row {
    grid-template-columns: 1fr;
    gap: 0.15rem;
  }
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
</style>

<script setup lang="ts">
// An evening somebody sent, the page opened with its link (see
// ui/shareEvening.ts): what it is, and whether to keep it. Kept, it is one of
// the detective's own evenings, chosen on the new-case page, and Custom
// nights are switched on to show it.
import { computed, ref } from 'vue'
import { checkScript } from '../engine/checkScript'
import type { NightKind, RoleId } from '../engine/types'
import { useGame } from '../stores/game'
import { useUi } from '../stores/ui'
import { sfx } from '../ui/audio'
import { evenings, saveEvening, sizeOf } from '../ui/evenings'
import { settings } from '../ui/settings'
import { sameRecipe } from '../ui/shareEvening'
import Icon, { type IconName } from './Icon.vue'
import Overlay from './Overlay.vue'
import RoleTip from './RoleTip.vue'

defineProps<{ open: boolean }>()
const game = useGame()
const ui = useUi()
const pack = computed(() => game.pack)

const sent = computed(() => (ui.invitation && !('unreadable' in ui.invitation) ? ui.invitation : null))
/** The same evening, kept already (perhaps under another name). */
const already = computed(() => (sent.value ? evenings.value.find((e) => sameRecipe(e.script, sent.value!.script)) ?? null : null))
/** Sent from a copy of the game that deals what this one cannot. */
const undealable = computed(() => !!sent.value && checkScript(sent.value.script).length > 0)

const GROUPS = [
  { field: 'innocents', name: 'Innocent' },
  { field: 'suspicious', name: 'Suspicious' },
  { field: 'accomplices', name: 'Accomplices' },
] as const
const groups = computed(() => GROUPS.map((g) => ({ ...g, roles: sent.value?.script[g.field] ?? [] })).filter((g) => g.roles.length > 0))
const nameOf = (r: RoleId) => pack.value.roleNames[r] ?? r
const iconOf = (r: RoleId) => (pack.value.roleIcons[r] ?? 'mask') as IconName
const nightName = (kind: NightKind) => {
  if (kind === 'suicide') return 'a true suicide'
  if (kind === 'hoax') return 'a faked death'
  return pack.value.murderers?.[kind]?.name ?? kind
}
const nights = computed(() => {
  const ns = Object.entries(sent.value?.script.nights ?? { plain: 1 }).filter(([, w]) => (w ?? 0) > 0)
  const said = ns.map(([k]) => nightName(k as NightKind)).join(', ')
  return said.charAt(0).toUpperCase() + said.slice(1)
})

/** What a part does: a card beside it with a mouse, along the foot of the screen on a touch. */
const tip = ref<{ role: RoleId; el: HTMLElement } | null>(null)
function hover(r: RoleId | null, e: PointerEvent) {
  tip.value = r && e.pointerType === 'mouse' ? { role: r, el: e.currentTarget as HTMLElement } : null
}

function close() {
  tip.value = null
  ui.invitation = null
}
/** Chosen on the new-case page, Custom nights switched on to show it. */
function choose(id: string) {
  settings.customNights = true
  close()
  ui.pickedEvening = id
}
function keep() {
  const e = sent.value
  if (!e) return
  sfx('select')
  // (A name already in use for another evening gets a number.)
  const taken = (n: string) => evenings.value.some((k) => k.name.toLowerCase() === n.toLowerCase())
  let name = e.name
  for (let n = 2; taken(name); n++) name = `${e.name.slice(0, 35)} (${n})`
  choose(saveEvening(name, e.script))
}
function chooseKept() {
  if (!already.value) return
  sfx('select')
  choose(already.value.id)
}
</script>

<template>
  <Overlay :open="open && !!ui.invitation" title="An evening for you" width="30rem" @close="close()">
    <template v-if="sent">
      <div class="what">
        <p class="small muted kicker">Somebody has sent you an evening of their own</p>
        <strong class="name">{{ sent.name }}</strong>
        <span class="small muted">{{ sizeOf(sent.script) }}</span>
      </div>
      <p v-if="undealable" class="note warn">This evening cannot be dealt in this copy of the game. It may need a newer one: try opening the link again later.</p>
      <p v-else-if="already" class="note">You have this evening already, as “{{ already.name }}”.</p>
      <template v-else>
        <p v-if="sent.unknown > 0" class="note">It was written in a newer copy of the game, and a little of it is not known here. The rest is kept.</p>
        <p v-if="!settings.customNights" class="note small muted">Keeping it switches on Custom nights, in the settings.</p>
      </template>

      <section v-for="g in groups" :key="g.field">
        <h3>{{ g.name }}</h3>
        <div class="parts">
          <button
            v-for="r in g.roles"
            :key="r"
            class="part"
            :aria-label="`What ${nameOf(r)} does`"
            @click="ui.roleSheet = { role: r }"
            @pointerenter="hover(r, $event)"
            @pointerleave="tip = null"
          >
            <Icon :name="iconOf(r)" /> {{ nameOf(r) }}
          </button>
        </div>
      </section>
      <section>
        <h3>Kinds of night</h3>
        <p class="nights">{{ nights }}</p>
      </section>

      <RoleTip v-if="tip" :role="tip.role" :anchor="tip.el" />
    </template>
    <p v-else class="lede">This link could not be read. It may have been cut short as it was copied: ask for it again.</p>

    <template #actions>
      <template v-if="sent && !undealable && already">
        <button @click="close()">Close</button>
        <button class="primary" @click="chooseKept()">Choose it</button>
      </template>
      <template v-else-if="sent && !undealable">
        <button @click="close()">No, thank you</button>
        <button class="primary" @click="keep()"><Icon name="check" /> Keep it</button>
      </template>
      <button v-else class="primary" @click="close()">Close</button>
    </template>
  </Overlay>
</template>

<style scoped>
.what {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  text-align: center;
}
.kicker {
  margin: 0;
}
.name {
  font-family: var(--font-display);
  font-weight: normal;
  font-size: 1.45rem;
  letter-spacing: 0.06em;
  color: var(--brass);
}
section {
  margin-top: 0.9rem;
  padding-top: 0.7rem;
  border-top: 1px solid var(--line);
}
h3 {
  margin: 0 0 0.45rem;
  font-family: var(--font-display);
  font-weight: normal;
  font-size: 0.9rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--brass);
}
.parts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}
.part {
  display: inline-flex;
  align-items: center;
  gap: 0.35em;
  padding: 0.2rem 0.65rem;
  border: 1px solid var(--brass-dim);
  border-radius: 999px;
  background: rgba(77, 65, 22, 0.4);
  box-shadow: none;
  color: var(--brass);
  font-size: 0.9rem;
  white-space: nowrap;
}
.nights {
  margin: 0;
  line-height: 1.45;
}
.note {
  margin: 0.8rem 0 0;
  text-align: center;
  line-height: 1.45;
}
.note.warn {
  color: #f0b0a8;
}
.lede {
  margin: 0;
  line-height: 1.5;
}
</style>

<script setup lang="ts">
// Who a guest is taken to be, under their name: "???" until they say, then
// what they say — and at any time whatever the detective writes there instead.
import { computed, ref, watch } from 'vue'
import { scriptParts } from '../engine/deck'
import type { RoleId } from '../engine/types'
import { useGame, type RoleMark } from '../stores/game'
import { sfx } from '../ui/audio'
import Icon, { type IconName } from './Icon.vue'
import PopMenu from './PopMenu.vue'
import RoleTip from './RoleTip.vue'

const props = defineProps<{
  char: number
  name: string
  /** Keep showing what was there before: an answer naming a role is still being given. */
  hold?: boolean
}>()
const game = useGame()

const pack = computed(() => game.ctx?.pack)
const live = computed(() => ({ held: game.roleOf(props.char), theirs: game.claimedRole(props.char) }))
/** What the mark shows: the live state, or — while held — the state from before. */
const shown = ref(live.value)
watch(
  [live, () => props.hold, () => props.char],
  ([now, hold], [, , was]) => {
    if (!hold || props.char !== was) shown.value = now
  },
)
const held = computed(() => shown.value.held)
const theirs = computed(() => shown.value.theirs)
const nameOf = (role: RoleId) => pack.value?.roleNames[role] ?? role
const iconOf = (role: RoleId) => (pack.value?.roleIcons[role] ?? 'mask') as IconName

/** The roles there may be in the house tonight, by class, in the order of the case file. */
const parts = computed(() => {
  const s = game.mystery?.caseSheet.script
  return s ? scriptParts(s) : []
})

const anchor = ref<HTMLElement | null>(null)
const open = ref(false)
/** The role whose card is showing, and the thing it is showing over. */
const tip = ref<{ role: RoleId; el: HTMLElement } | null>(null)
function hover(role: RoleId | null, e: PointerEvent) {
  tip.value = role ? { role, el: e.currentTarget as HTMLElement } : null
}
// The menu closing takes whatever card was over one of its items with it.
watch(open, (o) => {
  if (!o) tip.value = null
})
function toggle() {
  sfx('click')
  open.value = !open.value
}
function write(to: RoleMark | null) {
  sfx(to === null || to === 'unknown' ? 'click' : 'scratch')
  open.value = false
  game.setRole(props.char, to)
  // The detective's own hand shows at once, whatever is being said.
  shown.value = live.value
}
const said = computed(() =>
  held.value.role === null
    ? `${props.name}: not known who they are`
    : held.value.by === 'them'
      ? `${props.name} says they are ${nameOf(held.value.role)}`
      : `${props.name}: you have them down as ${nameOf(held.value.role)}`,
)
</script>

<template>
  <button
    ref="anchor"
    class="role-mark"
    :class="[held.by ?? 'nobody', { blank: held.role === null, open }]"
    :aria-label="`${said}, change`"
    aria-haspopup="menu"
    :aria-expanded="open"
    @click.stop="toggle()"
    @pointerenter="hover(held.role, $event)"
    @pointerleave="tip = null"
  >
    <template v-if="held.role">
      <Icon :name="held.by === 'them' ? 'thought' : 'pen'" class="whose" />
      <Icon :name="iconOf(held.role)" />
      {{ nameOf(held.role) }}
    </template>
    <template v-else>???</template>
  </button>
  <PopMenu v-if="open && anchor" :anchor="anchor" :label="`Who is ${name}?`" @close="open = false">
    <div class="sheet">
      <button
        class="pick"
        role="menuitemradio"
        :aria-checked="held.role === null"
        @click.stop="write(theirs ? 'unknown' : null)"
      >
        <span class="q">???</span> Undecided
      </button>
      <button
        v-if="theirs"
        class="pick"
        role="menuitemradio"
        :aria-checked="held.by === 'them'"
        @click.stop="write(null)"
      >
        <Icon name="thought" /> As they say: {{ nameOf(theirs) }}
      </button>
      <template v-for="part in parts" :key="part.id">
        <p class="part">{{ part.name }}</p>
        <div class="roles">
          <button
            v-for="role in part.roles"
            :key="role"
            class="pick"
            role="menuitemradio"
            :aria-checked="held.by === 'detective' && held.role === role"
            @click.stop="write(role)"
            @pointerenter="hover(role, $event)"
            @pointerleave="tip = null"
          >
            <Icon :name="iconOf(role)" /> {{ nameOf(role) }}
          </button>
        </div>
      </template>
    </div>
  </PopMenu>
  <RoleTip v-if="tip" :role="tip.role" :anchor="tip.el" />
</template>

<style scoped>
button.role-mark {
  display: inline-flex;
  align-self: center;
  align-items: center;
  margin: 0.15rem 0 0.1rem;
  gap: 0.3em;
  min-height: 1.9rem;
  padding: 0.1rem 0.7em;
  border: 1px solid var(--brass-dim);
  border-radius: 999px;
  background: rgba(77, 65, 22, 0.4);
  box-shadow: none;
  color: var(--brass);
  font-size: 0.92rem;
  line-height: 1.3;
  white-space: nowrap;
  cursor: pointer;
}
button.role-mark.blank {
  border-style: dashed;
  border-color: var(--line);
  background: transparent;
  color: var(--muted);
  letter-spacing: 0.18em;
}
/* What the detective has written is set down in ink, not in brass. */
button.role-mark.detective:not(.blank) {
  border-color: rgba(200, 215, 235, 0.45);
  background: rgba(120, 140, 170, 0.16);
  color: #d5deea;
}
button.role-mark:hover:not(:disabled),
button.role-mark.open {
  border-color: var(--brass);
  transform: none;
  box-shadow: none;
  opacity: 1;
}
.whose {
  opacity: 0.65;
  font-size: 0.9em;
}
.sheet {
  display: flex;
  flex-direction: column;
  width: min(24rem, calc(100vw - 2rem));
}
.part {
  margin: 0.5rem 0.7rem 0.15rem;
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
}
.roles {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
}
button.pick {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.45rem 0.7rem;
  background: transparent;
  border: 1px solid transparent;
  box-shadow: none;
  color: var(--ink, #e8e2d2);
  font-size: 0.92rem;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
}
button.pick:hover:not(:disabled),
button.pick:focus-visible {
  background: rgba(255, 255, 255, 0.06);
  border-color: transparent;
  transform: none;
  box-shadow: none;
  opacity: 1;
}
button.pick[aria-checked='true'] {
  border-color: var(--brass);
  color: var(--brass);
}
.q {
  letter-spacing: 0.12em;
  color: var(--muted);
}
@media (max-width: 420px) {
  .roles {
    grid-template-columns: 1fr;
  }
}
</style>

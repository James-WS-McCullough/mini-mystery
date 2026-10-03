<script setup lang="ts">
// On a touch screen, where there is no hovering over a role's tag: a tap on
// it opens this along the foot of the screen, to say what the role is, until
// it is closed.
import { useUi } from '../stores/ui'
import Icon from './Icon.vue'
import RoleCard from './RoleCard.vue'

const ui = useUi()
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="ui.roleSheet" class="shade" @click.self="ui.roleSheet = null">
        <section class="role-sheet frame" role="dialog" aria-modal="true" :aria-label="ui.roleSheet.name ?? 'What this role does'">
          <RoleCard :role="ui.roleSheet.role" :name="ui.roleSheet.name" :text="ui.roleSheet.text" />
          <button class="close ghost" aria-label="Close" @click="ui.roleSheet = null"><Icon name="close" /></button>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.shade {
  position: fixed;
  inset: 0;
  z-index: 320;
  display: flex;
  align-items: flex-end;
  background: rgba(0, 0, 0, 0.35);
}
.role-sheet {
  position: relative;
  width: 100%;
  padding: 0.9rem 3rem calc(1rem + env(safe-area-inset-bottom, 0px)) 1rem;
  background: var(--panel, #171c23);
  border-top: 1px solid var(--brass-dim);
  box-shadow: 0 -10px 28px rgba(0, 0, 0, 0.6);
  font-family: var(--font-body);
}
.close {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.35rem;
}
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.15s ease;
}
.sheet-enter-active .role-sheet,
.sheet-leave-active .role-sheet {
  transition: transform 0.18s ease-out;
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
.sheet-enter-from .role-sheet,
.sheet-leave-to .role-sheet {
  transform: translateY(100%);
}
</style>

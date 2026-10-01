<script setup lang="ts">
import { ref } from 'vue'
import { reloadForUpdate, updateReady } from '../ui/update'

/** Put off until the next time the game is opened. */
const later = ref(false)
</script>

<template>
  <Transition name="fade">
    <aside v-if="updateReady && !later" class="update" role="status">
      <p>
        <strong>A new edition is out.</strong>
        Reload to have it — your case is kept.
      </p>
      <div class="actions">
        <button class="ghost small" @click="later = true">Later</button>
        <button class="primary small" @click="reloadForUpdate()">Reload</button>
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
.update {
  position: fixed;
  z-index: 30;
  top: calc(0.75rem + env(safe-area-inset-top, 0px));
  left: 50%;
  transform: translateX(-50%);
  width: min(26rem, calc(100% - 2rem));
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.6rem 0.8rem;
  padding: 0.7rem 0.9rem;
  border: 1px solid var(--brass-dim);
  border-left: 3px solid var(--brass);
  background: rgba(11, 14, 18, 0.96);
  box-shadow: var(--shadow);
}
p {
  flex: 1 1 15rem;
  margin: 0;
  line-height: 1.45;
  font-size: 0.92rem;
}
strong {
  display: block;
  font-family: var(--font-display);
  font-weight: normal;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 0.85rem;
  color: var(--brass);
}
.actions {
  display: flex;
  gap: 0.4rem;
  flex-shrink: 0;
}
</style>

// Which overlays are up, and what the last case earned. Kept apart from the
// game store so that nothing about menus can find its way into a saved night.

import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import type { CaseRecord, Commendation } from '../ui/profile'

export const useUi = defineStore('ui', () => {
  const mapOpen = ref(false)
  const menuOpen = ref(false)
  const recordsOpen = ref(false)
  const confirmAccuse = ref(false)

  /** The case just closed, as filed, and any commendations it brought. */
  const lastRecord = shallowRef<CaseRecord | null>(null)
  const earned = shallowRef<Commendation[]>([])

  const anyOpen = computed(
    () => mapOpen.value || menuOpen.value || recordsOpen.value || confirmAccuse.value,
  )

  function closeAll() {
    mapOpen.value = false
    menuOpen.value = false
    recordsOpen.value = false
    confirmAccuse.value = false
  }

  return { mapOpen, menuOpen, recordsOpen, confirmAccuse, lastRecord, earned, anyOpen, closeAll }
})

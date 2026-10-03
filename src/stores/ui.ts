// Which overlays are up, and what the last case earned. Kept apart from the
// game store so that nothing about menus can find its way into a saved night.

import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import type { RoleId } from '../engine/types'
import type { CaseRecord, Commendation } from '../ui/profile'

export const useUi = defineStore('ui', () => {
  const mapOpen = ref(false)
  const menuOpen = ref(false)
  const recordsOpen = ref(false)
  /** The case file, to hand during the night. */
  const caseFileOpen = ref(false)
  /** A role's card along the foot of a touch screen, opened by a tap on its tag. */
  const roleSheet = shallowRef<{ role: RoleId; name?: string; text?: string } | null>(null)
  const confirmAccuse = ref(false)
  /** Letting the hour strike with questions still in hand. */
  const confirmHour = ref(false)
  /** A lifeline being played out as a little scene: Pike called, an expert telephoned. */
  const lifelineScene = ref<{ id: string; kind: 'pike' | 'expert' } | null>(null)
  /** The title's front page, or the setting-up of a new case (where a setting is chosen). */
  const titlePage = ref<'home' | 'setup'>('home')

  /** The case just closed, as filed, and any commendations it brought. */
  const lastRecord = shallowRef<CaseRecord | null>(null)
  const earned = shallowRef<Commendation[]>([])

  const anyOpen = computed(
    () =>
      mapOpen.value ||
      menuOpen.value ||
      recordsOpen.value ||
      caseFileOpen.value ||
      confirmAccuse.value ||
      confirmHour.value ||
      !!lifelineScene.value,
  )

  function closeAll() {
    mapOpen.value = false
    menuOpen.value = false
    recordsOpen.value = false
    caseFileOpen.value = false
    roleSheet.value = null
    confirmAccuse.value = false
    confirmHour.value = false
    lifelineScene.value = null
  }

  return { mapOpen, menuOpen, recordsOpen, caseFileOpen, roleSheet, confirmAccuse, confirmHour, lifelineScene, titlePage, lastRecord, earned, anyOpen, closeAll }
})

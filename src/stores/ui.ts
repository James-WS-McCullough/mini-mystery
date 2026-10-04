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
  /** The title's front page, the campaign's cases, the setting-up of a new case (where a setting is chosen), or an evening of the detective's own being written. */
  const titlePage = ref<'home' | 'campaign' | 'setup' | 'evening'>('home')
  /** A case is being dealt: "Building your case" is over everything until it is (see BuildingCase). */
  const building = ref(false)
  /** The reveal has played out to the truth of the night (the final hour's tune plays until it has). */
  const truthTold = ref(false)

  /** The case just closed, as filed, and any commendations it brought. */
  const lastRecord = shallowRef<CaseRecord | null>(null)
  const earned = shallowRef<Commendation[]>([])

  /**
   * Who is being typed out just now (each DialogueBox, by a key of its own):
   * nobody interrupts a line still being spoken. Sergeant Pike waits for it.
   */
  const typing = ref(new Set<symbol>())
  const anyTyping = computed(() => typing.value.size > 0)
  function typingBegan(key: symbol) {
    if (typing.value.has(key)) return
    typing.value = new Set([...typing.value, key])
  }
  function typingEnded(key: symbol) {
    if (!typing.value.has(key)) return
    const next = new Set(typing.value)
    next.delete(key)
    typing.value = next
  }

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

  return {
    mapOpen, menuOpen, recordsOpen, caseFileOpen, roleSheet, confirmAccuse, confirmHour, lifelineScene, titlePage,
    building, truthTold, lastRecord, earned, anyOpen, closeAll, anyTyping, typingBegan, typingEnded,
  }
})

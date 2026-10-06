// Which overlays are up, and what the last case earned. Kept apart from the
// game store so that nothing about menus can find its way into a saved night.

import type { Briefing } from '../campaign'
import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import type { Script } from '../engine/deck'
import type { RoleId } from '../engine/types'
import type { Invitation } from '../ui/shareEvening'
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
  /** A campaign case's word in the office, or note from the Chief, before its file is opened (see src/campaign). */
  const briefing = ref<Briefing | null>(null)
  /** The title's front page, the campaign's cases, the setting-up of a new case (where a setting is chosen), or an evening of the detective's own being written. */
  const titlePage = ref<'home' | 'campaign' | 'setup' | 'evening'>('home')
  /** A case is being dealt: "Building your case" is over everything until it is (see BuildingCase). */
  const building = ref(false)
  /** The reveal has played out to the truth of the night (the final hour's tune plays until it has). */
  const truthTold = ref(false)
  /** How to keep the game on the home screen (see InstallSheet). */
  const installOpen = ref(false)
  /** An evening of the detective's own being sent to somebody: the link and its QR code (see ShareEvening). */
  const sharing = shallowRef<{ name: string; script: Script } | null>(null)
  /** An evening somebody sent, the page opened with its link: offered on the title page (see EveningInvitation). */
  const invitation = shallowRef<Invitation | null>(null)
  /** An evening just kept from a link, to be chosen on the new-case page. */
  const pickedEvening = ref<string | null>(null)
  /** A lock being opened on something found: the item it is on (see LockScene). */
  const lockOpen = ref<string | null>(null)
  /** A lock tried for its own sake, from the menu while everything is unlocked for review. */
  const lockTry = ref<'word' | 'dials' | 'lamps' | 'cards' | null>(null)

  /** Where the notebook was left: its tab, and whose pages were open. Kept for the night, so it opens where it was. */
  const notebookTab = ref<'people' | 'topics' | 'evidence' | 'threads' | 'lifelines'>('people')
  const notebookPeople = ref(new Set<number>())
  function forgetNotebook() {
    notebookTab.value = 'people'
    notebookPeople.value = new Set()
  }

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
      !!lifelineScene.value ||
      !!briefing.value ||
      installOpen.value ||
      !!sharing.value ||
      lockOpen.value !== null ||
      lockTry.value !== null,
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
    briefing.value = null
    installOpen.value = false
    sharing.value = null
    lockOpen.value = null
    lockTry.value = null
  }

  return {
    mapOpen, menuOpen, recordsOpen, caseFileOpen, roleSheet, confirmAccuse, confirmHour, lifelineScene, briefing, titlePage,
    building, truthTold, lastRecord, earned, anyOpen, closeAll, anyTyping, typingBegan, typingEnded,
    notebookTab, notebookPeople, forgetNotebook, installOpen, lockOpen, lockTry,
    sharing, invitation, pickedEvening,
  }
})

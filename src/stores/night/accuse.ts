// One part of the night store (see stores/game.ts).

import type { CharId, ItemId, RoleId } from '../../engine/types'
import { judgeAccusation } from '../../engine/verdict'
import type { Pillars, PillarState } from '../../engine/verdict'
import type { MarkedKind } from '../../engine/deck'
import type { AfterHours, RoleMark } from './shared'

/** Marks under names, and the accusation. */
export function nightAccuse(night: AfterHours) {
  const {
    phase, stage, mystery, searchedRooms, notebook, activeChar, notebookOpen, verdict, accusedId, together,
    citedNoteIds, citedItemIds, citedThreadKeys, accusationForced, realized, ruledOut, signs, roleMarks,
    foundItems, realizedSpoken, citedMaterial, citeCap, citeCount, citedCase, record, hearConfessions,
  } = night
  function beginAccuse() {
    if (phase.value !== 'play') return
    record({ t: 'beginAccuse' })
    activeChar.value = null
    notebookOpen.value = false
    // Start the case from everything already realised — the player prunes.
    if (citedThreadKeys.value.length === 0 && citedNoteIds.value.length === 0 && citedItemIds.value.length === 0) {
      citedThreadKeys.value = realized.value.slice(0, citeCap.value).map((t) => t.key)
    }
    phase.value = 'accuse'
    hearConfessions()
  }

  function backToPlay() {
    if (phase.value === 'accuse' && !accusationForced.value) {
      record({ t: 'backToPlay' })
      phase.value = 'play'
      if (stage.value === 'transition') stage.value = 'question'
    }
  }

  /** Strike a guest off the list of suspects, or put them back on it. */
  function toggleRuledOut(char: CharId) {
    if (!mystery.value || phase.value === 'title' || phase.value === 'reveal') return
    if (char < 0 || char >= mystery.value.cast.length) return
    record({ t: 'mark', char })
    ruledOut.value = ruledOut.value.includes(char)
      ? ruledOut.value.filter((c) => c !== char)
      : [...ruledOut.value, char]
  }

  const UNMARKED: Pillars = { means: 'unknown', motive: 'unknown', opportunity: 'unknown' }
  /** The detective's own marks against a guest. */
  function signsOf(char: CharId): Pillars {
    return signs.value[char] ?? UNMARKED
  }
  /** Set one of a guest's marks: against them, ruled out, or undecided. */
  function setSign(char: CharId, sign: keyof Pillars, to: PillarState) {
    if (!mystery.value || phase.value === 'title' || phase.value === 'reveal') return
    if (char < 0 || char >= mystery.value.cast.length) return
    const now = signsOf(char)
    if (now[sign] === to) return
    record({ t: 'sign', char, sign, to })
    signs.value = { ...signs.value, [char]: { ...now, [sign]: to } }
  }

  /** The role they have most lately laid claim to, if any. It is only their word. */
  function claimedRole(char: CharId): RoleId | null {
    let role: RoleId | null = null
    // What they owned to under pressing outranks anything said before or since.
    let owned = false
    for (const n of notebook.value) {
      if (n.speaker !== char || n.claim.kind !== 'role') continue
      const pressed = n.source === 'under pressing'
      if (owned && !pressed) continue
      role = n.claim.role
      owned = owned || pressed
    }
    return role
  }
  /**
   * Who they are taken to be: what the detective has written, or else what
   * they say of themselves, or else nothing yet.
   */
  function roleOf(char: CharId): { role: RoleId | null; by: 'detective' | 'them' | null; kind?: MarkedKind } {
    const mine = roleMarks.value[char]
    if (mine !== undefined) {
      if (mine === 'unknown') return { role: null, by: 'detective' }
      // (A kind of murderer is written "murderer:serial".)
      const [role, kind] = mine.split(':') as [RoleId, MarkedKind | undefined]
      return kind ? { role, by: 'detective', kind } : { role, by: 'detective' }
    }
    const theirs = claimedRole(char)
    return { role: theirs, by: theirs ? 'them' : null }
  }
  /** Write a role under a name — or, with nothing, go back to taking their word. */
  function setRole(char: CharId, to: RoleMark | null) {
    if (!mystery.value || phase.value === 'title' || phase.value === 'reveal') return
    if (char < 0 || char >= mystery.value.cast.length) return
    if ((roleMarks.value[char] ?? null) === to) return
    record({ t: 'role', char, to })
    const next = { ...roleMarks.value }
    if (to === null) delete next[char]
    else next[char] = to
    roleMarks.value = next
  }

  function toggleCiteNote(id: string) {
    const list = citedNoteIds.value
    if (list.includes(id)) citedNoteIds.value = list.filter((x) => x !== id)
    else if (citeCount.value < citeCap.value) citedNoteIds.value = [...list, id]
  }

  function toggleCiteItem(id: ItemId) {
    const list = citedItemIds.value
    if (list.includes(id)) citedItemIds.value = list.filter((x) => x !== id)
    else if (citeCount.value < citeCap.value) citedItemIds.value = [...list, id]
  }

  function toggleCiteThread(key: string) {
    const list = citedThreadKeys.value
    if (list.includes(key)) citedThreadKeys.value = list.filter((x) => x !== key)
    else if (citeCount.value < citeCap.value) citedThreadKeys.value = [...list, key]
  }

  function submitAccusation() {
    if (!mystery.value || accusedId.value === null) return
    verdict.value = judgeAccusation(mystery.value, {
      accused: accusedId.value,
      ...(accusedId.value === -3 ? { together: [...together.value] } : {}),
      citedSpoken: citedCase.value.spoken,
      citedEvidence: citedCase.value.evidence.map((e) => e.fact),
      citedThreads: citedMaterial.value.threads,
      // Who else is cleared is judged on the whole night's work, pinned or not.
      gathered: {
        spoken: realizedSpoken.value,
        evidence: foundItems.value.map((e) => e.fact),
        searched: [...searchedRooms.value],
      },
    })
    phase.value = 'reveal'
  }
  return {
    beginAccuse, backToPlay, toggleRuledOut, UNMARKED, signsOf, setSign, claimedRole, roleOf, setRole,
    toggleCiteNote, toggleCiteItem, toggleCiteThread, submitAccusation,
  }
}

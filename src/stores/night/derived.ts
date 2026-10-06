// One part of the night store (see stores/game.ts).

import { CLOCK, narrate } from '../../content/narration'
import { findContradictions } from '../../engine/contradictions'
import type { Contradiction } from '../../engine/contradictions'
import { possibleHelpers } from '../../engine/deck'
import { findLinks } from '../../engine/links'
import type { Link } from '../../engine/links'
import { caseTitle as caseTitleOf } from '../../engine/render'
import type { RenderCtx } from '../../engine/render'
import { INFO_CLAIMS } from '../../engine/types'
import type { CharId, EvidenceItem, ItemId, RoleId, RoomId, Spoken } from '../../engine/types'
import { BINDING, evaluateCase, pillarsFor } from '../../engine/verdict'
import type { CaseBoard, CaseMaterial, Pillars, ThreadInfo } from '../../engine/verdict'
import { settings } from '../../ui/settings'
import { computed, ref, watch } from 'vue'
import { ABOUT_THE_HOUR } from './shared'
import type { AfterState, LogEntry, RealizedThread } from './shared'

/** What follows from the night as it stands: the threads, who is borne out or caught, the board. */
export function nightDerived(night: AfterState) {
  const {
    stage, mystery, round, transitionToMidnight, searchedRooms, lastSearchItemIds, foundItemIds, sealedItemIds, notebook,
    log, citedNoteIds, citedItemIds, citedThreadKeys, dead, realized, confessedChars, deduceAtMidnight, pack,
    realizedKeys,
  } = night
  const ctx = computed<RenderCtx | null>(() =>
    mystery.value ? { mystery: mystery.value, pack: pack.value, address: settings.address } : null,
  )
  /** What the case is called: drawn from the night, and never telling who. */
  const caseTitle = computed(() => (ctx.value ? caseTitleOf(ctx.value) : ''))
  // (Not what is still behind a lock: found, but not yet in hand.)
  const foundItems = computed<EvidenceItem[]>(
    () => mystery.value?.evidence.filter((e) => foundItemIds.value.includes(e.id) && !sealedItemIds.value.includes(e.id)) ?? [],
  )
  /**
   * The note beside him, set beside a letter he truly wrote: the hands are
   * not the same, and Sergeant Pike says so. (Where he wrote the note himself
   * there is no such letter to be found.)
   */
  const noteForged = computed(
    () => foundItemIds.value.includes('note') && foundItemIds.value.includes('hand'),
  )
  /** The room locked tonight, its key gone missing (null on most nights). */
  const lockedRoom = computed<RoomId | null>(() => mystery.value?.truth.locked ?? null)
  /** The key is found, or handed over: the room may be searched. */
  const unlocked = computed(() => foundItemIds.value.includes('key'))
  function isLocked(room: RoomId): boolean {
    return room === lockedRoom.value && !unlocked.value
  }
  /** The detective has tried the locked door, and knows it for one. */
  const triedLocked = ref(false)
  /** Said when the door will not open; gone once something else is done. */
  const lockedNotice = ref<string | null>(null)
  watch(stage, () => (lockedNotice.value = null))
  /** Sergeant Pike, with the two side by side: shown once, when the second turns up. */
  const handScene = ref(false)
  watch(noteForged, (now, before) => {
    if (now && !before) handScene.value = true
  }, { flush: 'sync' })
  const lastSearchItems = computed<EvidenceItem[]>(
    () => mystery.value?.evidence.filter((e) => lastSearchItemIds.value.includes(e.id)) ?? [],
  )
  /** Everything the engine can see in what's been collected. The player is
   *  only told the COUNTS — spotting threads is the deduction game. */
  /**
   * Notes that are known lies: said, and since owned to be false by the one
   * who said them, under pressing. The role, the account of the hour, the
   * standing with the dead man given before; the story told them by the
   * Whisperer; the silence that was paid for.
   */
  const retracted = computed<Set<string>>(() => {
    const out = new Set<string>()
    const owned = notebook.value.filter((n) => n.source === 'under pressing')
    for (const o of owned) {
      for (const n of notebook.value) {
        if (n.speaker !== o.speaker || n.source === 'under pressing') continue
        const c = n.claim
        const w = o.claim
        const replaced =
          (c.kind === 'role' && w.kind === 'role' && c.role !== w.role) ||
          (c.kind === 'whereabouts' && w.kind === 'whereabouts' && JSON.stringify(c) !== JSON.stringify(w)) ||
          (c.kind === 'relationship' && w.kind === 'relationship' && c.subject === w.subject && c.rel !== w.rel) ||
          (c.kind === 'sighting' && w.kind === 'toldBy') ||
          (c.kind === 'silent' && w.kind === 'bribed') ||
          // What they said they knew by a role they have given up.
          (w.kind === 'role' &&
            INFO_CLAIMS.has(c.kind) &&
            c.kind !== 'role' &&
            notebook.value.some(
              (r) => r.speaker === n.speaker && r.source !== 'under pressing' && r.claim.kind === 'role' && r.claim.role !== w.role,
            ))
        if (replaced) out.add(n.id)
      }
    }
    return out
  })
  const contradictions = computed<Contradiction[]>(() =>
    mystery.value
      ? findContradictions(
          notebook.value.filter((n) => !retracted.value.has(n.id)),
          foundItems.value,
          mystery.value.caseSheet,
        )
      : [],
  )
  const links = computed<Link[]>(() =>
    mystery.value
      ? findLinks(notebook.value, foundItems.value, mystery.value.caseSheet, mystery.value.cast)
      : [],
  )
  const undrawnContradictions = computed(
    () => contradictions.value.filter((c) => !realizedKeys.has(contradictionKey(c))).length,
  )
  const undrawnLinks = computed(
    () => links.value.filter((l) => !realizedKeys.has(linkKey(l))).length,
  )

  /**
   * Those whose account of the hour the detective has seen borne out past
   * doubting: by somebody who answers for them, or by the room itself. (Not on
   * a night when alibis may be sworn falsely, or exhibits forged.)
   */
  /**
   * Which of the murderer's friends may be in the house, by what has been
   * found: some of them cannot work without leaving a mark, and there is only
   * ever the one.
   */
  /** Whether the Clinger may be in the house tonight. */
  const clingerMay = computed(() => mystery.value?.caseSheet.script.suspicious.includes('clinger') ?? false)
  const helpersAbout = computed<RoleId[]>(() =>
    mystery.value
      ? possibleHelpers(
          mystery.value.caseSheet.script,
          foundItems.value.map((e) => e.fact),
          mystery.value.caseSheet.sceneRoom,
        )
      : [],
  )
  /** The room an account among these notes puts its speaker in. */
  function whereSaid(ids: readonly string[]): RoomId | null {
    for (const id of ids) {
      const claim = notebook.value.find((n) => n.id === id)?.claim
      if (claim?.kind === 'whereabouts') return claim.room
    }
    return null
  }
  function givenOver(id?: ItemId): boolean {
    return mystery.value?.evidence.find((e) => e.id === id)?.heldBy !== undefined
  }
  /** On a night with a passage: the room it has been found to lead to. */
  const passageNight = computed(() => (mystery.value?.caseSheet.passageRooms?.length ?? 0) > 0)
  const passageFound = computed<RoomId | null>(() => {
    for (const e of foundItems.value) if (e.fact.kind === 'passage') return e.fact.room
    return null
  })
  /**
   * Is being alone in that room an alibi? Not until the passage is found —
   * and then not for the room it leads to.
   */
  function noWayOut(t: RealizedThread): boolean {
    if (!passageNight.value) return true
    return passageFound.value !== null && whereSaid(t.statementIds) !== passageFound.value
  }
  const borneOut = computed<Set<CharId>>(() => {
    const set = new Set<CharId>()
    const accomplices = helpersAbout.value
    for (const t of realized.value) {
      if (t.type !== 'link' || !BINDING.has(t.reason)) continue
      if (t.reason === 'alibi-trace' && !noWayOut(t)) continue
      if (t.reason === 'mutual-alibi' && accomplices.includes('perjurer')) continue
      // (Nor where the Clinger may have begged a kind friend to say so: it
      // puts neither at the scene, but nor does it say where they were.)
      if (t.reason === 'mutual-alibi' && clingerMay.value) continue
      if (t.reason === 'alibi-trace' && accomplices.includes('forger') && givenOver(t.evidenceId)) continue
      for (const id of t.supports) set.add(id)
    }
    return set
  })
  /** Whether the Red Herring may be in the house tonight (it is on the case sheet). */
  const herringMay = computed(() => mystery.value?.caseSheet.script.suspicious.includes('redherring') ?? false)
  /**
   * Whether an account of the hour borne out settles a contradiction against
   * the other side of it. Not one between where somebody spent the hour and a
   * sighting of them AT THE SCENE, where the Red Herring may be in the house:
   * the herring truly looked in at the scene and truly spent the hour
   * elsewhere, so the one who saw them may be telling the truth too, and the
   * herring must still be pressed to say so. (Seen anywhere else, it settles.)
   */
  function settledByAlibi(t: { reason: string; statementIds: readonly string[] }): boolean {
    if (!ABOUT_THE_HOUR.has(t.reason)) return false
    if (t.reason !== 'whereabouts-vs-sighting' || !herringMay.value) return true
    const scene = mystery.value?.caseSheet.sceneRoom
    return !t.statementIds.some((id) => {
      const c = notebook.value.find((n) => n.id === id)?.claim
      return c?.kind === 'sighting' && c.room === scene
    })
  }
  /**
   * Whom a contradiction stands against. When one of the accounts in it is
   * borne out, it is the other that is broken (where that settles it).
   */
  function standsAgainst(t: RealizedThread): CharId[] {
    if (t.type !== 'contradiction' || !settledByAlibi(t)) return t.implicated
    const left = t.implicated.filter((id) => !borneOut.value.has(id))
    return left.length > 0 ? left : t.implicated
  }

  /** Press unlocks only against people caught in a REALISED contradiction. */
  const pressable = computed<Set<CharId>>(() => {
    const set = new Set<CharId>()
    for (const t of realized.value) {
      if (t.type === 'contradiction') for (const id of standsAgainst(t)) set.add(id)
    }
    if (dead.value !== null) set.delete(dead.value)
    return set
  })
  /** Proven liars: realised proven contradictions, or a confession under pressing. */
  const caughtLying = computed<Set<CharId>>(() => {
    const set = new Set<CharId>()
    for (const t of realized.value) {
      if (t.type !== 'contradiction') continue
      const against = standsAgainst(t)
      // Proven outright — or the only one left standing against a borne-out account.
      if (t.proven || (against.length === 1 && t.implicated.length > 1)) {
        for (const id of against) set.add(id)
      }
    }
    for (const c of confessedChars.value) set.add(c)
    return set
  })
  /** Flags for notebook entries involved in realised threads. */
  const realizedFlags = computed(() => {
    const map = new Map<string, 'contradiction' | 'proven' | 'link'>()
    for (const t of realized.value) {
      for (const id of [...t.statementIds, ...(t.evidenceId ? [t.evidenceId] : [])]) {
        const kind = t.type === 'link' ? 'link' : t.proven ? 'proven' : 'contradiction'
        const prev = map.get(id)
        // Contradictions outrank links in the margin notes.
        if (prev === 'proven') continue
        if (prev === 'contradiction' && kind === 'link') continue
        map.set(id, kind)
      }
    }
    return map
  })

  /** Spoken claims bound into realised threads — the player's working case. */
  const realizedSpoken = computed<Spoken[]>(() => {
    const ids = new Set(realized.value.flatMap((t) => t.statementIds))
    return notebook.value
      .filter((n) => ids.has(n.id))
      .map((n) => ({ speaker: n.speaker, claim: n.claim }))
  })
  /** The live board during play: realised threads + evidence in hand. */
  const liveBoard = computed<CaseBoard | null>(() =>
    mystery.value
      ? evaluateCase(
          mystery.value,
          realizedSpoken.value,
          foundItems.value.map((e) => e.fact),
          searchedRooms.value,
        )
      : null,
  )

  function threadInfoOf(t: RealizedThread): ThreadInfo {
    const exhibit = mystery.value?.evidence.find((e) => e.id === t.evidenceId)
    return {
      type: t.type,
      reason: t.reason,
      implicated: standsAgainst(t),
      supports: t.supports,
      given: exhibit?.heldBy !== undefined,
    }
  }
  /** Means/motive/opportunity per suspect, read off the live (realised) case. */
  const liveMaterial = computed<CaseMaterial>(() => ({
    spoken: realizedSpoken.value,
    evidence: foundItems.value.map((e) => e.fact),
    threads: realized.value.map(threadInfoOf),
  }))
  function livePillars(char: CharId): Pillars | null {
    return mystery.value ? pillarsFor(mystery.value, char, liveMaterial.value) : null
  }
  /** The same trio read off only what's cited (accusation screen). */
  const citedMaterial = computed<CaseMaterial>(() => ({
    spoken: citedCase.value.spoken,
    evidence: citedCase.value.evidence.map((e) => e.fact),
    threads: realized.value
      .filter((t) => citedThreadKeys.value.includes(t.key))
      .map(threadInfoOf),
  }))
  function citedPillars(char: CharId): Pillars | null {
    return mystery.value ? pillarsFor(mystery.value, char, citedMaterial.value) : null
  }

  const clockLabel = computed(() =>
    deduceAtMidnight.value ? narrate('midnight') : CLOCK[Math.min(round.value, CLOCK.length - 1)],
  )
  const isLastRound = computed(
    () => !!mystery.value && round.value >= mystery.value.config.rounds - 1,
  )
  const citeCap = computed(() => mystery.value?.config.citeCap ?? 6)
  const citeCount = computed(
    () =>
      citedNoteIds.value.length + citedItemIds.value.length + citedThreadKeys.value.length,
  )

  /** Expand cited units (threads count as one but carry their contents). */
  const citedCase = computed<{ spoken: Spoken[]; evidence: EvidenceItem[] }>(() => {
    const stmtIds = new Set(citedNoteIds.value)
    const itemIds = new Set(citedItemIds.value)
    for (const t of realized.value) {
      if (!citedThreadKeys.value.includes(t.key)) continue
      for (const id of t.statementIds) stmtIds.add(id)
      if (t.evidenceId) itemIds.add(t.evidenceId)
    }
    return {
      spoken: notebook.value
        .filter((n) => stmtIds.has(n.id))
        .map((n) => ({ speaker: n.speaker, claim: n.claim })),
      evidence: foundItems.value.filter((e) => itemIds.has(e.id)),
    }
  })
  /** The board as the put-forward case currently stands (accusation screen). */
  const accuseBoard = computed<CaseBoard | null>(() =>
    mystery.value
      ? evaluateCase(
          mystery.value,
          citedCase.value.spoken,
          citedCase.value.evidence.map((e) => e.fact),
        )
      : null,
  )

  /** Heading + narration for the hour-transition screen. */
  const transitionHeading = computed(() =>
    transitionToMidnight.value ? narrate('midnight') : clockLabel.value,
  )
  function convoOf(char: CharId): LogEntry[] {
    return log.value.filter((e) => e.convo === char)
  }

  function hourOf(r: number): string {
    return CLOCK[Math.min(r, CLOCK.length - 1)]
  }

  function statementsBy(char: CharId): number {
    return notebook.value.filter((n) => n.speaker === char).length
  }

  function contradictionKey(c: Contradiction): string {
    return `x|${c.reason}|${[...c.statementIds].sort().join(',')}|${c.evidenceId ?? ''}`
  }
  function linkKey(l: Link): string {
    return `o|${l.reason}|${[...l.statementIds].sort().join(',')}|${l.evidenceId ?? ''}`
  }
  return {
    ctx, caseTitle, foundItems, noteForged, lockedRoom, unlocked, isLocked, triedLocked, lockedNotice,
    handScene, lastSearchItems, retracted, contradictions, links, undrawnContradictions, undrawnLinks,
    clingerMay, helpersAbout, whereSaid, givenOver, passageNight, passageFound, noWayOut, borneOut,
    standsAgainst, settledByAlibi, herringMay, pressable, caughtLying, realizedFlags, realizedSpoken, liveBoard, threadInfoOf,
    liveMaterial, livePillars, citedMaterial, citedPillars, clockLabel, isLastRound, citeCap, citeCount,
    citedCase, accuseBoard, transitionHeading, convoOf, hourOf, statementsBy, contradictionKey, linkKey,
  }
}

// Brute-force world enumeration.
//
// A world is an assignment of the public role deck to the cast, together with
// an EXISTENTIALLY quantified location map: the world is consistent if some
// physically possible arrangement of people satisfies every constraint. With
// single-slot whereabouts, all constraints reduce to room pins + exactness
// checks, so no search is needed — just conflict detection.
//
// Constraint semantics by the speaker's truth class IN THE HYPOTHESIZED world:
//   honest      — every structural claim must hold
//   unreliable  — whereabouts / sighting / relationship / heard must hold;
//                 role, culpritAttr, among, alignment, glimpse claims are
//                 discounted
//   concealer   — claims constrain nothing (they may be lies)
// Evidence facts always hold: the physical world does not lie.
//
// One exception to "a concealer's claims constrain nothing": LIARS LIE ALONE.
// Nobody with something to hide invents company, and no two of them cover for
// each other. So when two guests each put the other beside them in the same
// room, both accounts are true whoever they are — a mutual alibi holds.
//
// And a TRACE bears out a lonely alibi: whoever spent the window alone left
// some trace of themselves in the room, and no liar claims a room holding a
// trace that would fit them. So "I was alone in R", from a guest the trace
// found in R fits, is true whoever they are.

import { truthClassOf } from '../deck'
import type {
  CaseSheet,
  CastMember,
  CharId,
  EvidenceFact,
  Relationship,
  RoleId,
  Spoken,
} from '../types'
import { attrMatches } from '../types'

export interface WorldInput {
  cast: CastMember[]
  caseSheet: CaseSheet
  spoken: Spoken[]
  evidence: EvidenceFact[]
}

export interface WorldResult {
  /** All enumerated assignments (duplicate role cards deduped). */
  total: number
  /** Consistent role assignments, indexed per CharId. */
  worlds: RoleId[][]
  /** Distinct culprits across consistent worlds. */
  culprits: CharId[]
}

/** All distinct assignments of a role multiset to n characters. */
export function enumerateAssignments(deck: readonly RoleId[]): RoleId[][] {
  const roles = [...deck].sort()
  const n = roles.length
  const used = new Array<boolean>(n).fill(false)
  const current: RoleId[] = []
  const out: RoleId[][] = []
  const recurse = () => {
    if (current.length === n) {
      out.push([...current])
      return
    }
    for (let i = 0; i < n; i++) {
      if (used[i]) continue
      // Skip duplicate role cards at the same depth (e.g. the two alibi cards).
      if (i > 0 && roles[i] === roles[i - 1] && !used[i - 1]) continue
      used[i] = true
      current.push(roles[i])
      recurse()
      current.pop()
      used[i] = false
    }
  }
  recurse()
  return out
}

interface ExactClaim {
  speaker: CharId
  room: string
  companions: CharId[]
}

/**
 * Indices of whereabouts statements that hold whoever made them: one half of
 * a mutual alibi, or a lonely account borne out by a trace in the room.
 */
export function boundAccounts(input: Pick<WorldInput, 'cast' | 'spoken' | 'evidence'>): Set<number> {
  const bound = mutualAlibis(input.spoken)
  input.spoken.forEach(({ speaker, claim }, i) => {
    if (claim.kind !== 'whereabouts' || claim.companions.length > 0) return
    const borneOut = input.evidence.some(
      (f) =>
        f.kind === 'trace' && f.room === claim.room && attrMatches(f.attr, input.cast[speaker]),
    )
    if (borneOut) bound.add(i)
  })
  return bound
}

/** Indices of whereabouts statements that are one half of a mutual alibi. */
export function mutualAlibis(spoken: readonly Spoken[]): Set<number> {
  const bound = new Set<number>()
  spoken.forEach((a, i) => {
    if (a.claim.kind !== 'whereabouts') return
    const mine = a.claim
    const answered = spoken.some(
      (b) =>
        b.claim.kind === 'whereabouts' &&
        b.speaker !== a.speaker &&
        b.claim.room === mine.room &&
        mine.companions.includes(b.speaker) &&
        b.claim.companions.includes(a.speaker),
    )
    if (answered) bound.add(i)
  })
  return bound
}

/** Is this role assignment consistent with the given statements + evidence? */
export function isConsistent(
  roles: RoleId[],
  input: WorldInput,
  /** Precomputed `boundAccounts(input)`, when checking many worlds. */
  alibis: ReadonlySet<number> = boundAccounts(input),
): boolean {
  const { cast, caseSheet, spoken, evidence } = input
  const n = roles.length
  const culprit = roles.indexOf('culprit')
  const thief = roles.indexOf('thief')

  const pins = new Array<string | null>(n).fill(null)
  const pin = (c: CharId, room: string): boolean => {
    if (pins[c] === null) {
      pins[c] = room
      return true
    }
    return pins[c] === room
  }

  const relPins = new Map<CharId, Relationship>()
  const pinRel = (subject: CharId, rel: Relationship): boolean => {
    const existing = relPins.get(subject)
    if (existing === undefined) {
      relPins.set(subject, rel)
      return true
    }
    return existing === rel
  }

  // The culprit was at the scene during the window.
  if (!pin(culprit, caseSheet.sceneRoom)) return false

  // Evidence constraints.
  for (const fact of evidence) {
    switch (fact.kind) {
      case 'trace':
        // Binds the lonely account it bears out (see boundAccounts).
        break
      case 'weapon':
        // The murder was done this way; the culprit had the access it needed.
        if (!cast[culprit].means.includes(fact.means)) return false
        break
      case 'forcedLockbox':
        if (thief === -1) return false
        if (!pin(thief, fact.room)) return false
        break
      case 'motiveDocument':
        if (!pinRel(fact.subject, fact.rel)) return false
        break
      case 'flavor':
        break
    }
  }

  // Statement constraints, gated by the speaker's truth class in this world.
  const exactClaims: ExactClaim[] = []
  for (const [index, { speaker, claim }] of spoken.entries()) {
    const cls = truthClassOf(roles[speaker])
    if (cls === 'concealer' && !alibis.has(index)) continue
    const infoDiscounted = cls === 'unreliable'
    switch (claim.kind) {
      case 'role':
        if (!infoDiscounted && roles[speaker] !== claim.role) return false
        break
      case 'whereabouts': {
        if (!pin(speaker, claim.room)) return false
        for (const comp of claim.companions) {
          if (!pin(comp, claim.room)) return false
        }
        exactClaims.push({ speaker, room: claim.room, companions: claim.companions })
        break
      }
      case 'sighting':
        if (!pin(claim.target, claim.room)) return false
        break
      case 'glimpse':
        // Only a glimpse at the scene carries structure: the scene's sole
        // occupant during the window was the culprit.
        if (!infoDiscounted && claim.room === caseSheet.sceneRoom) {
          if (!attrMatches(claim.attr, cast[culprit])) return false
        }
        break
      case 'culpritAttr':
        if (!infoDiscounted && !attrMatches(claim.attr, cast[culprit])) return false
        break
      case 'among':
        if (!infoDiscounted && !claim.suspects.includes(culprit)) return false
        break
      case 'earlier':
        // Before the window: it places nobody during it, and proves nothing.
        break
      case 'alignment': {
        if (!infoDiscounted) {
          const isEvil = roles[claim.target] === 'culprit'
          if ((claim.alignment === 'evil') !== isEvil) return false
        }
        break
      }
      case 'relationship':
        if (!pinRel(claim.subject, claim.rel)) return false
        break
      case 'heard':
        if (claim.sound === 'crash') {
          // A crash means the theft: the thief was in that room.
          if (thief === -1) return false
          if (!pin(thief, claim.room)) return false
        }
        // A quarrel (earlier that day, at the scene) constrains nothing here.
        break
      case 'suspicion':
        break // opinion, never structural
    }
  }

  // Exactness: an honest "I was in R with S" is complete — anyone else pinned
  // to R must appear in S. (Catches "alone" claims vs pinned co-occupants,
  // including the hypothesized culprit pinned to the scene.)
  for (const ec of exactClaims) {
    for (let c = 0; c < n; c++) {
      if (c === ec.speaker) continue
      if (pins[c] === ec.room && !ec.companions.includes(c)) return false
    }
  }

  return true
}

export function enumerateWorlds(input: WorldInput): WorldResult {
  const assignments = enumerateAssignments(input.caseSheet.deck)
  const alibis = boundAccounts(input)
  const worlds = assignments.filter((roles) => isConsistent(roles, input, alibis))
  const culprits = [...new Set(worlds.map((roles) => roles.indexOf('culprit')))]
  return { total: assignments.length, worlds, culprits }
}

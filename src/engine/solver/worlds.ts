// Brute-force world enumeration.
//
// The detective is given a SCRIPT — the roles that may be in the house — and
// not the deck. A world is a guess at who is what: one culprit, as many
// herrings as the script says (one of them the murderer's helper, where the
// script has helpers), and innocents for the rest. Nobody shares a role. An
// innocent who has named their role has that role; one who has not is simply
// an honest guest, whatever they turn out to be.
//
// Beside the roles a world has an EXISTENTIALLY quantified location map: it is
// consistent if some physically possible arrangement of people satisfies every
// constraint. With single-slot whereabouts, all constraints reduce to room
// pins + exactness checks, so no search is needed — just conflict detection.
//
// Constraint semantics by the speaker's truth class IN THE HYPOTHESIZED world:
//   honest      — every structural claim must hold
//   unreliable  — whereabouts / sighting / relationship / heard must hold;
//                 what they say of who they are and what they know is
//                 discounted
//   secretive   — everything must hold but where they say they were
//   masked      — where they were and what they saw must hold; who they are
//                 and what they know is discounted
//   concealer   — claims constrain nothing (they may be lies)
// Evidence found by the detective always holds: the physical world does not
// lie. Evidence HANDED to the detective holds if whoever handed it is honest.
//
// One exception to "a liar's account constrains nothing": LIARS LIE ALONE.
// Nobody with something to hide invents company, and no two of them cover for
// each other. So when two guests each put the other beside them in the same
// room, both accounts are true whoever they are — a mutual alibi holds.
// The exception to the exception is the ACCOMPLICE, who will swear the
// murderer was beside them. In a world where either of the two is the
// Accomplice, their mutual alibi binds nothing.
//
// And a TRACE bears out a lonely alibi: whoever spent the window alone left
// some trace of themselves in the room, and no liar claims a room holding a
// trace that would fit them. So "I was alone in R", from a guest the trace
// found in R fits, is true whoever they are — if the trace is a true one.

import { isEvil, liesAboutWhereabouts, truthClassOf } from '../deck'
import type {
  CaseSheet,
  CastMember,
  CharId,
  Claim,
  EvidenceFact,
  PublicScript,
  Relationship,
  RoleId,
  Spoken,
  TruthClass,
} from '../types'
import { INFO_CLAIMS, attrMatches, neighbours } from '../types'

export interface WorldInput {
  cast: CastMember[]
  caseSheet: CaseSheet
  spoken: Spoken[]
  evidence: EvidenceFact[]
}

/** Who is what, as far as a world says: null is an honest guest, role unknown. */
export type Hypothesis = (RoleId | null)[]

export interface WorldResult {
  /** Worlds looked at. */
  total: number
  /** Consistent worlds — all of them only when asked for (`all`). */
  worlds: Hypothesis[]
  /** Distinct culprits across consistent worlds. */
  culprits: CharId[]
}

/** The script for a table dealt exactly these roles, and known to be. */
export function scriptOf(deck: readonly RoleId[]): PublicScript {
  const herrings = [...new Set(deck.filter((r) => r !== 'culprit' && truthClassOf(r) !== 'honest'))]
  const innocents = [...new Set(deck.filter((r) => r !== 'culprit' && !herrings.includes(r)))]
  return { innocents, herrings, helpers: [], herringCount: herrings.length }
}

/** Every way of seating one culprit and the script's herrings among n guests. */
export function enumerateHypotheses(
  n: number,
  script: PublicScript,
  spoken: readonly Spoken[],
): Hypothesis[] {
  // What each guest has said they are.
  const claimed: RoleId[][] = Array.from({ length: n }, () => [])
  for (const { speaker, claim } of spoken) {
    if (claim.kind === 'role' && !claimed[speaker].includes(claim.role)) {
      claimed[speaker].push(claim.role)
    }
  }
  const pool = [...script.herrings, ...script.helpers]
  const needHelper = script.helpers.length > 0
  const k = Math.min(script.herringCount, Math.max(0, n - 1))

  const out: Hypothesis[] = []
  for (let culprit = 0; culprit < n; culprit++) {
    const roles: Hypothesis = new Array<RoleId | null>(n).fill(null)
    roles[culprit] = 'culprit'
    const used = new Set<RoleId>()

    const seatInnocents = () => {
      const taken = new Set<RoleId>()
      const world = [...roles]
      for (let c = 0; c < n; c++) {
        if (world[c] !== null) continue
        const said = claimed[c]
        if (said.length === 0) continue
        // An innocent is what they say they are, and says it once.
        if (said.length > 1 || !script.innocents.includes(said[0]) || taken.has(said[0])) return
        taken.add(said[0])
        world[c] = said[0]
      }
      const unnamed = world.filter((r) => r === null).length
      if (script.innocents.length - taken.size < unnamed) return
      out.push(world)
    }

    const seatHerrings = (from: number, left: number, helpers: number) => {
      if (left === 0) {
        if (needHelper && helpers !== 1) return
        seatInnocents()
        return
      }
      for (let c = from; c < n; c++) {
        if (roles[c] !== null) continue
        for (const role of pool) {
          if (used.has(role)) continue
          const helper = script.helpers.includes(role) ? 1 : 0
          if (helpers + helper > 1) continue
          used.add(role)
          roles[c] = role
          seatHerrings(c + 1, left - 1, helpers + helper)
          roles[c] = null
          used.delete(role)
        }
      }
    }
    seatHerrings(0, k, 0)
  }
  return out
}

interface ExactClaim {
  speaker: CharId
  room: string
  companions: CharId[]
}

/** The same, with who answers each: statement index → those who bear it out. */
export function mutualPartners(spoken: readonly Spoken[]): Map<number, CharId[]> {
  const bound = new Map<number, CharId[]>()
  spoken.forEach((a, i) => {
    if (a.claim.kind !== 'whereabouts') return
    const mine = a.claim
    const answering = spoken
      .filter(
        (b) =>
          b.claim.kind === 'whereabouts' &&
          b.speaker !== a.speaker &&
          b.claim.room === mine.room &&
          mine.companions.includes(b.speaker) &&
          b.claim.companions.includes(a.speaker),
      )
      .map((b) => b.speaker)
    if (answering.length > 0) bound.set(i, [...new Set(answering)])
  })
  return bound
}

/** Indices of whereabouts statements that are one half of a mutual alibi. */
export function mutualAlibis(spoken: readonly Spoken[]): Set<number> {
  return new Set(mutualPartners(spoken).keys())
}

/** What can be worked out once for an input, whatever the world. */
export interface Groundwork {
  partners: Map<number, CharId[]>
  /** Statement index → who would have to be honest for a trace to bear it out
   *  (an empty list: a trace the detective found with their own hands). */
  borneOut: Map<number, CharId[][]>
}

export function groundwork(input: Pick<WorldInput, 'cast' | 'spoken' | 'evidence'>): Groundwork {
  const borneOut = new Map<number, CharId[][]>()
  input.spoken.forEach(({ speaker, claim }, i) => {
    if (claim.kind !== 'whereabouts' || claim.companions.length > 0) return
    const by = input.evidence.flatMap((f) =>
      f.kind === 'trace' && f.room === claim.room && attrMatches(f.attr, input.cast[speaker])
        ? [f.givenBy === undefined ? [] : [f.givenBy]]
        : [],
    )
    if (by.length > 0) borneOut.set(i, by)
  })
  return { partners: mutualPartners(input.spoken), borneOut }
}

/**
 * Indices of whereabouts statements that hold whoever made them, so long as
 * nobody in the house is forging or swearing falsely: one half of a mutual
 * alibi, or a lonely account borne out by a trace in the room.
 */
export function boundAccounts(input: Pick<WorldInput, 'cast' | 'spoken' | 'evidence'>): Set<number> {
  const g = groundwork(input)
  return new Set([...g.partners.keys(), ...g.borneOut.keys()])
}

/** Does a claim of this kind, from a speaker of this class, have to be true? */
function holds(cls: TruthClass, kind: Claim['kind'], bound: boolean): boolean {
  switch (cls) {
    case 'honest':
      return true
    case 'unreliable':
      return !INFO_CLAIMS.has(kind)
    case 'concealer':
      return kind === 'whereabouts' && bound
    case 'secretive':
      return kind !== 'whereabouts' || bound
    case 'masked':
      return !INFO_CLAIMS.has(kind) && kind !== 'relationship'
  }
}

/** Is this guess at the roles consistent with the given statements + evidence? */
export function isConsistent(
  roles: Hypothesis,
  input: WorldInput,
  /** Precomputed `groundwork(input)`, when checking many worlds. */
  ground: Groundwork = groundwork(input),
): boolean {
  const { cast, caseSheet, spoken, evidence } = input
  const n = roles.length
  const culprit = roles.indexOf('culprit')
  const thief = roles.indexOf('thief')
  const accomplice = roles.indexOf('accomplice')
  const honest = (c: CharId) => truthClassOf(roles[c]) === 'honest'

  /** Bound whoever said it — in this world. */
  const isBound = (index: number, speaker: CharId): boolean => {
    // A trace bears it out, if the trace can be trusted.
    if (ground.borneOut.get(index)?.some((givers) => givers.every(honest))) return true
    // Somebody answers for them — unless the Accomplice is one of the two.
    const with_ = ground.partners.get(index)
    if (!with_) return false
    return accomplice < 0 || (speaker !== accomplice && !with_.includes(accomplice))
  }

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
        // Binds the lonely account it bears out (see isBound).
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
    if (!holds(cls, claim.kind, claim.kind === 'whereabouts' && isBound(index, speaker))) continue
    switch (claim.kind) {
      case 'role':
        if (roles[speaker] !== claim.role) return false
        break
      case 'liarsBeside':
        if (
          neighbours(speaker, n).filter((c) => liesAboutWhereabouts(roles[c])).length !== claim.count
        ) {
          return false
        }
        break
      case 'blackmailed':
        if (roles[claim.by] !== 'blackmailer') return false
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
        if (claim.room === caseSheet.sceneRoom) {
          if (!attrMatches(claim.attr, cast[culprit])) return false
        }
        break
      case 'culpritAttr':
        if (!attrMatches(claim.attr, cast[culprit])) return false
        break
      case 'among':
        if (!claim.suspects.includes(culprit)) return false
        break
      case 'earlier':
        // Before the window: it places nobody during it, and proves nothing.
        break
      case 'alignment': {
        if ((claim.alignment === 'evil') !== isEvil(roles[claim.target])) return false
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

export interface EnumerateOptions {
  /** Keep every consistent world, rather than stopping at one per culprit. */
  all?: boolean
}

export function enumerateWorlds(input: WorldInput, options: EnumerateOptions = {}): WorldResult {
  const hypotheses = enumerateHypotheses(input.cast.length, input.caseSheet.script, input.spoken)
  const ground = groundwork(input)
  const worlds: Hypothesis[] = []
  const culprits = new Set<CharId>()
  for (const roles of hypotheses) {
    const culprit = roles.indexOf('culprit')
    if (!options.all && culprits.has(culprit)) continue
    if (!isConsistent(roles, input, ground)) continue
    worlds.push(roles)
    culprits.add(culprit)
  }
  return { total: hypotheses.length, worlds, culprits: [...culprits] }
}

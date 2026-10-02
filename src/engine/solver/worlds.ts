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
// Perjurer, their mutual alibi binds nothing.
//
// Some of the murderer's other friends leave a mark, and the mark says which
// of them is in the house: a scene with the weapon gone (the CLEANER, who
// spent the hour where it was hidden), money with a name on it (the SPONSOR,
// and whoever was paid is an honest witness). The FRAMER leaves only a gap:
// somebody honest, alone, whose room holds no trace of them — which asks
// nothing of the solver, since an absent trace binds nothing. The WHISPERER
// leaves none — but has put a story in one honest mouth: in a world with the
// Whisperer in it, one honest guest's sightings are somebody else's words,
// and bind nothing.
//
// On a night with a SECRET PASSAGE the murderer need not have spent the hour
// at the scene: they may have spent it, alone, in the room the passage leads
// to, and gone by it and come back. So an account that puts somebody alone in
// a room — true as it may be — clears them only if the passage is known to
// run somewhere else. There is one passage; what is found of it is true, and
// what an honest Architect says of it.
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
import { INFO_CLAIMS, attrMatches } from '../types'

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
  /** Distinct culprits across consistent worlds: -1 for nobody, where he may have done it himself. */
  culprits: CharId[]
}

/** The script for a table dealt exactly these roles, and known to be. */
export function scriptOf(deck: readonly RoleId[]): PublicScript {
  const herrings = [...new Set(deck.filter((r) => r !== 'culprit' && truthClassOf(r) !== 'honest'))]
  const innocents = [...new Set(deck.filter((r) => r !== 'culprit' && !herrings.includes(r)))]
  return { innocents, herrings, helpers: [], herringCount: herrings.length }
}

/**
 * Every way of seating one culprit and the script's herrings among n guests —
 * and, where he may have done it himself, of seating no culprit, one more of
 * the suspicious, and no friend of a murderer's.
 */
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
  // A script with helpers has one in the house — unless it says they may stay away.
  const k = Math.min(script.herringCount, Math.max(0, n - 1))

  const out: Hypothesis[] = []
  for (let culprit = script.suicide ? -1 : 0; culprit < n; culprit++) {
    const roles: Hypothesis = new Array<RoleId | null>(n).fill(null)
    if (culprit >= 0) roles[culprit] = 'culprit'
    const used = new Set<RoleId>()
    // (Nobody did it: one more of the suspicious, and nobody's friend.)
    const herrings = culprit >= 0 ? k : Math.min(script.herringCount + 1, n)
    const pool = culprit >= 0 ? [...script.herrings, ...script.helpers] : script.herrings
    const needHelper = culprit >= 0 && script.helpers.length > 0 && !script.helperMaybe

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
    seatHerrings(0, herrings, 0)
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
  /** Those who say they saw somebody somewhere. */
  seers: CharId[]
}

export function groundwork(
  input: Pick<WorldInput, 'cast' | 'spoken' | 'evidence'> & { caseSheet?: Pick<CaseSheet, 'sceneRoom'> },
): Groundwork {
  const scene = input.caseSheet?.sceneRoom
  const borneOut = new Map<number, CharId[][]>()
  input.spoken.forEach(({ speaker, claim }, i) => {
    if (claim.kind !== 'whereabouts' || claim.companions.length > 0) return
    const by = input.evidence.flatMap((f) =>
      f.kind === 'trace' &&
      f.room === claim.room &&
      // Whatever lies at the scene was put there.
      (scene === undefined || f.room !== scene) &&
      attrMatches(f.attr, input.cast[speaker])
        ? [f.givenBy === undefined ? [] : [f.givenBy]]
        : [],
    )
    if (by.length > 0) borneOut.set(i, by)
  })
  const seers = [...new Set(input.spoken.filter((s) => s.claim.kind === 'sighting').map((s) => s.speaker))]
  return { partners: mutualPartners(input.spoken), borneOut, seers }
}

/**
 * Indices of whereabouts statements that hold whoever made them, so long as
 * nobody in the house is forging or swearing falsely: one half of a mutual
 * alibi, or a lonely account borne out by a trace in the room.
 */
export function boundAccounts(
  input: Pick<WorldInput, 'cast' | 'spoken' | 'evidence'> & { caseSheet?: Pick<CaseSheet, 'sceneRoom'> },
): Set<number> {
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
  const whisperer = roles.indexOf('whisperer')
  if (whisperer < 0) return fits(roles, input, ground, -1)
  // Somebody honest is repeating the Whisperer's story. Any of them will do —
  // and to take a story from somebody who has told none changes nothing.
  const recanted = input.spoken.some((s) => s.claim.kind === 'toldBy')
  if (!recanted && fits(roles, input, ground, -1)) return true
  return ground.seers.some(
    (c) => truthClassOf(roles[c]) === 'honest' && fits(roles, input, ground, c),
  )
}

/** The same, with it settled whose sightings are the Whisperer's words (-1: nobody's). */
function fits(roles: Hypothesis, input: WorldInput, ground: Groundwork, whispered: CharId): boolean {
  const { cast, caseSheet, spoken, evidence } = input
  const n = roles.length
  const culprit = roles.indexOf('culprit')
  const thief = roles.indexOf('thief')
  const perjurer = roles.indexOf('perjurer')
  const cleaner = roles.indexOf('cleaner')
  const honest = (c: CharId) => truthClassOf(roles[c]) === 'honest'

  /** Bound whoever said it — in this world. */
  const isBound = (index: number, speaker: CharId): boolean => {
    // A trace bears it out, if the trace can be trusted.
    if (ground.borneOut.get(index)?.some((givers) => givers.every(honest))) return true
    // Somebody answers for them — unless the Perjurer is one of the two.
    const with_ = ground.partners.get(index)
    if (!with_) return false
    return perjurer < 0 || (speaker !== perjurer && !with_.includes(perjurer))
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

  // The culprit was at the scene during the window — or, on a night with a
  // passage, may have come to it through the wall (settled below).
  const ways = caseSheet.passageRooms ?? []
  /** Nobody did it: he took his own life, alone. */
  const nobody = culprit < 0
  if (!nobody && ways.length === 0 && !pin(culprit, caseSheet.sceneRoom)) return false
  if (nobody) {
    // He left a note to say so, beside him: a scene searched and no note
    // found was no suicide. And there is nothing of his own writing to set
    // beside it — where there is, it shows the note for a forgery.
    const sceneSeen = evidence.some((f) => f.kind === 'weapon' && f.foundIn === undefined)
    if (sceneSeen && !evidence.some((f) => f.kind === 'suicideNote')) return false
    if (evidence.some((f) => f.kind === 'handSample')) return false
  }
  /** Where the passage is said to run, by whatever must be believed. */
  const passageSaid = new Set<string>()
  /** Rooms whose box was found untouched: no theft was done there. */
  const intact = new Set<string>()

  // Evidence constraints.
  for (const fact of evidence) {
    switch (fact.kind) {
      case 'lockboxIntact':
        intact.add(fact.room)
        break
      case 'trace':
        // Binds the lonely account it bears out (see isBound).
        break
      case 'weapon':
        // The murder was done this way; the culprit had the access it needed.
        if (!nobody && !cast[culprit].means.includes(fact.means)) return false
        if (fact.foundIn !== undefined && fact.foundIn !== caseSheet.sceneRoom) {
          // Carried off, and hidden where the Cleaner spent the hour.
          if (cleaner < 0 || !pin(cleaner, fact.foundIn)) return false
        } else if (cleaner >= 0) return false
        break
      case 'sceneCleared':
        if (cleaner < 0) return false
        break
      case 'passage':
        passageSaid.add(fact.room)
        break
      case 'killed':
        // The murderer goes on living; and it was somebody honest who knew too much.
        if (nobody || !honest(fact.victim)) return false
        break
      case 'secondTrace':
        if (nobody || !attrMatches(fact.attr, cast[culprit])) return false
        break
      case 'bribe':
        // Nobody pays for the silence of somebody with nothing true to tell.
        if (!roles.includes('sponsor') || !honest(fact.to)) return false
        break
      case 'forcedLockbox':
        if (thief === -1) return false
        if (!pin(thief, fact.room)) return false
        break
      case 'motiveDocument':
        if (!pinRel(fact.subject, fact.rel)) return false
        break
      case 'suicideNote':
      case 'handSample':
        // (Settled above: they say whether he did it himself, not who did not.)
      case 'flavor':
        break
    }
  }

  // Statement constraints, gated by the speaker's truth class in this world.
  const exactClaims: ExactClaim[] = []
  for (const [index, { speaker, claim }] of spoken.entries()) {
    // Who owns to it at the last did it — or is the one who would hang for them.
    if (claim.kind === 'confession') {
      if (roles[speaker] !== 'culprit' && roles[speaker] !== 'martyr') return false
      continue
    }
    // Who owns to the theft is the Thief — and was in the room whose box was
    // forced — or is somebody with a lie to cover, taking the Thief's part.
    if (claim.kind === 'theft') {
      if (roles[speaker] === 'thief') {
        if (intact.has(claim.room) || !pin(speaker, claim.room)) return false
      } else if (truthClassOf(roles[speaker]) !== 'concealer') return false
      continue
    }
    const cls = truthClassOf(roles[speaker])
    if (!holds(cls, claim.kind, claim.kind === 'whereabouts' && isBound(index, speaker))) continue
    if (speaker === whispered && claim.kind === 'sighting') continue
    switch (claim.kind) {
      case 'role':
        if (roles[speaker] !== claim.role) return false
        break
      case 'liarsAmong':
        if (claim.pair.filter((c) => liesAboutWhereabouts(roles[c])).length !== claim.count) return false
        break
      case 'blackmailed':
        if (roles[claim.by] !== 'blackmailer') return false
        break
      case 'bribed':
        if (roles[claim.by] !== 'sponsor') return false
        break
      case 'toldBy':
        if (roles[claim.by] !== 'whisperer' || whispered !== speaker) return false
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
        // The Red Herring was seen at the scene, and was gone before the hour:
        // a sighting of them there places them nowhere.
        if (claim.room === caseSheet.sceneRoom && roles[claim.target] === 'redherring') break
        if (!pin(claim.target, claim.room)) return false
        break
      case 'glimpse':
        // Only a glimpse at the scene carries structure: the scene's sole
        // occupant during the window was the culprit.
        // — or the Red Herring, who was there before them.
        if (claim.room === caseSheet.sceneRoom) {
          const herring = roles.indexOf('redherring')
          const fits =
            (!nobody && attrMatches(claim.attr, cast[culprit])) ||
            (herring >= 0 && attrMatches(claim.attr, cast[herring]))
          if (!fits) return false
        }
        break
      case 'culpritAttr':
        if (nobody || !attrMatches(claim.attr, cast[culprit])) return false
        break
      case 'among':
        if (nobody || !claim.suspects.includes(culprit)) return false
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
      case 'passage':
        passageSaid.add(claim.room)
        break
      case 'passing':
      case 'silent':
      case 'trust':
      case 'suspicion':
        break // opinion, never structural
    }
  }

  // Where nobody did it, nobody was with him when he did.
  if (nobody) {
    if (pins.some((p) => p === caseSheet.sceneRoom)) return false
    if (passageSaid.size > 1) return false
    return complete()
  }
  // Where was the murderer? At the scene; or alone in the room the passage
  // leads to — which is one room, wherever it is said to be.
  if (ways.length > 0) {
    if (passageSaid.size > 1) return false
    const known = passageSaid.size === 1 ? [...passageSaid][0] : null
    if (known !== null && !ways.includes(known)) return false
    const was = pins[culprit]
    const options = was !== null ? [was] : [caseSheet.sceneRoom, ...(known !== null ? [known] : ways)]
    return options.some((room) => {
      if (room !== caseSheet.sceneRoom) {
        if (!ways.includes(room) || (known !== null && known !== room)) return false
        // Nobody slips away from company.
        if (pins.some((p, c) => c !== culprit && p === room)) return false
      }
      pins[culprit] = room
      const ok = complete()
      pins[culprit] = was
      return ok
    })
  }
  return complete()

  // Exactness: an honest "I was in R with S" is complete — anyone else pinned
  // to R must appear in S. (Catches "alone" claims vs pinned co-occupants,
  // including the hypothesized culprit pinned to the scene.)
  function complete(): boolean {
    return exactClaims.every(wholeAccount)
  }
  function wholeAccount(ec: ExactClaim): boolean {
    for (let c = 0; c < n; c++) {
      if (c === ec.speaker) continue
      // The Sweetheart's company is the one thing an honest guest may leave out.
      if (roles[c] === 'sweetheart') continue
      if (pins[c] === ec.room && !ec.companions.includes(c)) return false
    }
    return true
  }
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

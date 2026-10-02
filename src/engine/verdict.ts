// The case board. No jury: the accusation is judged purely on how well the
// case was built. Two layers agree:
//  - the world enumerator, restricted to what the player puts forward, says
//    who is CLEARED (impossible as culprit) and who remains;
//  - the classic trio — MEANS, MOTIVE, OPPORTUNITY — is read off the same
//    material per suspect, and an airtight case must establish all three
//    against the accused while leaving them the only candidate standing.

import { possibleHelpers } from './deck'
import { enumerateWorlds } from './solver/worlds'
import type { CharId, EvidenceFact, Mystery, Spoken } from './types'
import { attrMatches, isMotiveGrade } from './types'

export type SuspectState = 'cleared' | 'sole' | 'open'

export interface CaseBoard {
  /** Who the put-forward case still allows as culprit. */
  remaining: CharId[]
  /** Per CharId. */
  states: SuspectState[]
  clearedCount: number
}

/** Evaluate any body of put-forward material into a per-suspect board. */
export function evaluateCase(
  mystery: Mystery,
  spoken: Spoken[],
  evidence: EvidenceFact[],
): CaseBoard {
  const worlds = enumerateWorlds({
    cast: mystery.cast,
    caseSheet: mystery.caseSheet,
    spoken,
    evidence,
  })
  // (-1 among them: he may have done it himself.)
  const remaining = worlds.culprits
  const states = mystery.cast.map<SuspectState>((m) =>
    remaining.includes(m.id) ? (remaining.length === 1 ? 'sole' : 'open') : 'cleared',
  )
  return { remaining, states, clearedCount: mystery.cast.filter((m) => !remaining.includes(m.id)).length }
}

// ---------- the trio ----------

export type PillarState = 'established' | 'ruledOut' | 'unknown'

export interface Pillars {
  means: PillarState
  motive: PillarState
  /** established = their account of the window is broken; ruledOut = vouched. */
  opportunity: PillarState
}

/** A realised thread as the pillar reader needs it. */
export interface ThreadInfo {
  type: 'contradiction' | 'link'
  reason: string
  implicated: CharId[]
  supports: CharId[]
  /** The thread rests on an exhibit that was handed over, not found. */
  given?: boolean
}

export interface CaseMaterial {
  spoken: Spoken[]
  evidence: EvidenceFact[]
  threads: ThreadInfo[]
}

export const OPPORTUNITY_BREAKS = new Set([
  'whereabouts-vs-sighting',
  'companion-mismatch',
  'sighting-vs-sighting',
  'self-contradiction',
  'sighting-vs-company',
])
const OPPORTUNITY_VOUCHES = new Set(['mutual-alibi', 'vouched', 'account-confirmed', 'alibi-trace'])
/** Corroborations that hold whoever gave the account: liars lie alone, and leave no trace. */
export const BINDING = new Set(['mutual-alibi', 'alibi-trace'])

/** Read means / motive / opportunity for one suspect off the put-forward case. */
export function pillarsFor(mystery: Mystery, char: CharId, material: CaseMaterial): Pillars {
  // MEANS: public access tags, activated once the weapon names the method.
  const weapon = material.evidence.find((f) => f.kind === 'weapon')
  const means: PillarState = weapon
    ? mystery.cast[char].means.includes(weapon.means)
      ? 'established'
      : 'ruledOut'
    : 'unknown'

  // MOTIVE: documents prove either way; accepted testimony can establish
  // (gossip, an admission against interest) but never launder someone benign.
  let motive: PillarState = 'unknown'
  for (const f of material.evidence) {
    if (f.kind === 'motiveDocument' && f.subject === char) {
      motive = isMotiveGrade(f.rel) ? 'established' : 'ruledOut'
    }
  }
  if (motive === 'unknown') {
    for (const s of material.spoken) {
      if (s.claim.kind === 'relationship' && s.claim.subject === char && isMotiveGrade(s.claim.rel)) {
        motive = 'established'
      }
    }
  }

  // OPPORTUNITY: a corroboration that speaks for them accounts for the half
  // hour; a contradiction breaking their account leaves it wide open — and so
  // does being at the scene, on their own word or anybody else's.
  let opportunity: PillarState = 'unknown'
  const scene = mystery.caseSheet.sceneRoom
  const atScene = material.spoken.some(
    (s) =>
      (s.claim.kind === 'whereabouts' && s.speaker === char && s.claim.room === scene) ||
      (s.claim.kind === 'sighting' && s.claim.target === char && s.claim.room === scene),
  )
  // On a night with a passage: where it has been found to run, and whether
  // they were alone in the room at the end of it.
  const passageNight = (mystery.caseSheet.passageRooms?.length ?? 0) > 0
  const passageAt = material.evidence.find((f) => f.kind === 'passage')?.room
  const byPassage =
    passageAt !== undefined &&
    material.spoken.some(
      (s) =>
        s.speaker === char &&
        s.claim.kind === 'whereabouts' &&
        s.claim.room === passageAt &&
        s.claim.companions.length === 0,
    )
  /** Borne out past doubting: no contradiction can break such an account. */
  let bound = false
  for (const t of material.threads) {
    if (t.type !== 'link' || !OPPORTUNITY_VOUCHES.has(t.reason) || !t.supports.includes(char)) continue
    // To have been alone in a room is no alibi until the passage is known to
    // run somewhere else.
    if (passageNight && t.reason !== 'mutual-alibi' && (passageAt === undefined || byPassage)) continue
    // With the Perjurer in the house, two people vouching for each other
    // proves nothing by itself.
    const helpers = possibleHelpers(mystery.caseSheet.script, material.evidence, scene)
    if (t.reason === 'mutual-alibi' && helpers.includes('perjurer')) continue
    // Nor, with the Forger about, does an exhibit somebody handed over.
    if (t.reason === 'alibi-trace' && t.given && helpers.includes('forger')) continue
    opportunity = 'ruledOut'
    if (BINDING.has(t.reason)) bound = true
  }
  // When an account that is borne out clashes with one that is not, it is the
  // other that is broken.
  if (!bound) {
    for (const t of material.threads) {
      if (t.type === 'contradiction' && OPPORTUNITY_BREAKS.has(t.reason) && t.implicated.includes(char)) {
        opportunity = 'established'
      }
    }
    if (atScene) opportunity = 'established'
  }
  if (byPassage) opportunity = 'established'
  // Alone, by their own account, with nothing to bear it out: nobody can say
  // they did not slip away. The chance was theirs, as it was the Loner's; the
  // Loner is to be cleared some other way.
  const alone = material.spoken.some(
    (s) => s.speaker === char && s.claim.kind === 'whereabouts' && s.claim.companions.length === 0,
  )
  const backed = material.threads.some(
    (t) => t.type === 'link' && OPPORTUNITY_VOUCHES.has(t.reason) && t.supports.includes(char),
  )
  if (alone && !backed && opportunity === 'unknown') opportunity = 'established'

  return { means, motive, opportunity }
}

// ---------- what truly stood against each of them ----------

/**
 * The trio as it truly was, for setting beside the marks the detective made:
 * who could have done it this way, who had cause to, and who was at the scene
 * within the hour.
 */
export function truePillars(mystery: Mystery, char: CharId): Pillars {
  const { truth, cast } = mystery
  // At the scene — or alone at the other end of the passage, whether or not
  // they went by it: the chance was theirs. So it was, too, for anybody alone
  // whose room holds nothing of them to say they stayed there (the Loner, or
  // whoever the Framer has framed).
  const alone = truth.companions[char].length === 0
  const borneOut = mystery.evidence.some(
    (e) =>
      e.room === truth.locations[char] &&
      !e.forged &&
      ((e.fact.kind === 'trace' && attrMatches(e.fact.attr, cast[char])) ||
        (e.fact.kind === 'forcedLockbox' && truth.roles[char] === 'thief')),
  )
  const there =
    truth.locations[char] === truth.sceneRoom ||
    (truth.passage?.room === truth.locations[char] && alone) ||
    (alone && !borneOut)
  return {
    means: cast[char].means.includes(truth.methodMeans) ? 'established' : 'ruledOut',
    motive: isMotiveGrade(truth.relationships[char]) ? 'established' : 'ruledOut',
    opportunity: there ? 'established' : 'ruledOut',
  }
}

// ---------- the accusation ----------

export type CaseTier = 'airtight' | 'strong' | 'thin' | 'wrong'

export interface Accusation {
  /** Who did it: -1 for nobody, for he took his own life; -2, for he is not dead. */
  accused: CharId
  /** The case put forward: what is pinned to the board. It is judged for how
   *  well it fixes the deed on the accused. */
  citedSpoken: Spoken[]
  citedEvidence: EvidenceFact[]
  citedThreads?: ThreadInfo[]
  /**
   * The night's work: everything the detective found and every thread they
   * drew, pinned or not. It is judged for how little doubt it leaves about
   * everybody else. Left out, the case put forward stands for it.
   */
  gathered?: { spoken: Spoken[]; evidence: EvidenceFact[] }
}

export interface Verdict {
  correct: boolean
  /** Who the night's work still allows, and who it clears. */
  board: CaseBoard
  /** The trio, read against the accused from the case put forward. */
  pillars: Pillars
  /** How surely the deed was fixed on the accused: how many of the three, 0 to 3. */
  conviction: number
  /** How many of the others the night's work cleared, and out of how many. */
  cleared: number
  others: number
  /** 0..1 — the two measures, in equal parts. */
  score: number
  tier: CaseTier
}

export function judgeAccusation(mystery: Mystery, accusation: Accusation): Verdict {
  // (-1 where he did it himself; -2 where he is not dead.)
  const culprit = mystery.truth.hoax ? -2 : mystery.truth.roles.indexOf('culprit')
  const gathered = accusation.gathered ?? {
    spoken: accusation.citedSpoken,
    evidence: accusation.citedEvidence,
  }
  const board = evaluateCase(mystery, gathered.spoken, gathered.evidence)
  const pillars: Pillars = accusation.accused < 0
    ? { means: 'unknown', motive: 'unknown', opportunity: 'unknown' }
    : pillarsFor(mystery, accusation.accused, {
    spoken: accusation.citedSpoken,
    evidence: accusation.citedEvidence,
    threads: accusation.citedThreads ?? [],
  })
  // (Nobody accused, on a night with no murderer, is the right answer; and
  // culprit is -1 then too.)
  const correct = accusation.accused === culprit
  const nobody = accusation.accused < 0
  const others = nobody ? mystery.cast.length : mystery.cast.length - 1
  const cleared = mystery.cast.filter(
    (m) => m.id !== accusation.accused && board.states[m.id] === 'cleared',
  ).length
  // Where nobody did it, there is nobody to show anything against: the case
  // is how many of them were shown not to have done it, and only that.
  const conviction = nobody
    ? Math.floor((cleared / others) * 3 + 1e-9)
    : [pillars.means, pillars.motive, pillars.opportunity].filter((p) => p === 'established').length
  const score = correct ? (nobody ? cleared / others : (conviction / 3 + cleared / others) / 2) : 0

  // Two measures, each out of three: the three signs against the accused, and
  // the others cleared by thirds. Both full is airtight; half between them is
  // a strong case; less is a lucky finger.
  const clearing = Math.floor((cleared / others) * 3 + 1e-9)
  let tier: CaseTier
  if (!correct) tier = 'wrong'
  else if (conviction === 3 && cleared === others) tier = 'airtight'
  else if (nobody ? clearing >= 2 : conviction + clearing >= 3) tier = 'strong'
  else tier = 'thin'

  return { correct, board, pillars, conviction, cleared, others, score, tier }
}

// The case board. No jury: the accusation is judged purely on how well the
// case was built. Two layers agree:
//  - the world enumerator, restricted to what the player puts forward, says
//    who is CLEARED (impossible as culprit) and who remains;
//  - the classic trio — MEANS, MOTIVE, OPPORTUNITY — is read off the same
//    material per suspect, and an airtight case must establish all three
//    against the accused while leaving them the only candidate standing.

import { enumerateWorlds } from './solver/worlds'
import type { CharId, EvidenceFact, Mystery, Spoken } from './types'
import { isMotiveGrade } from './types'

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
  const remaining = worlds.culprits
  const states = mystery.cast.map<SuspectState>((m) =>
    remaining.includes(m.id) ? (remaining.length === 1 ? 'sole' : 'open') : 'cleared',
  )
  return { remaining, states, clearedCount: mystery.cast.length - remaining.length }
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
])
const OPPORTUNITY_VOUCHES = new Set(['mutual-alibi', 'vouched', 'account-confirmed', 'alibi-trace'])

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
  // hour; a contradiction breaking their account leaves it wide open.
  let opportunity: PillarState = 'unknown'
  for (const t of material.threads) {
    if (t.type !== 'link' || !OPPORTUNITY_VOUCHES.has(t.reason) || !t.supports.includes(char)) continue
    // With the Accomplice in the house, two people vouching for each other
    // proves nothing by itself.
    if (t.reason === 'mutual-alibi' && mystery.caseSheet.deck.includes('accomplice')) continue
    opportunity = 'ruledOut'
  }
  for (const t of material.threads) {
    if (t.type === 'contradiction' && OPPORTUNITY_BREAKS.has(t.reason) && t.implicated.includes(char)) {
      opportunity = 'established'
    }
  }

  return { means, motive, opportunity }
}

// ---------- the accusation ----------

export type CaseTier = 'airtight' | 'strong' | 'thin' | 'wrong'

export interface Accusation {
  accused: CharId
  citedSpoken: Spoken[]
  citedEvidence: EvidenceFact[]
  citedThreads?: ThreadInfo[]
}

export interface Verdict {
  correct: boolean
  board: CaseBoard
  /** The trio, read against the accused from the cited case. */
  pillars: Pillars
  /** 0..1 — fraction of the innocent your case cleared. */
  score: number
  tier: CaseTier
}

export function judgeAccusation(mystery: Mystery, accusation: Accusation): Verdict {
  const culprit = mystery.truth.roles.indexOf('culprit')
  const board = evaluateCase(mystery, accusation.citedSpoken, accusation.citedEvidence)
  const pillars = pillarsFor(mystery, accusation.accused, {
    spoken: accusation.citedSpoken,
    evidence: accusation.citedEvidence,
    threads: accusation.citedThreads ?? [],
  })
  const correct = accusation.accused === culprit
  const innocents = mystery.cast.length - 1
  const score = correct ? board.clearedCount / innocents : 0

  const trioComplete =
    pillars.means === 'established' &&
    pillars.motive === 'established' &&
    pillars.opportunity === 'established'

  let tier: CaseTier
  if (!correct) tier = 'wrong'
  else if (board.remaining.length === 1 && trioComplete) tier = 'airtight'
  else if (board.remaining.length === 1 || board.remaining.length <= 3) tier = 'strong'
  else tier = 'thin'

  return { correct, board, pillars, score, tier }
}

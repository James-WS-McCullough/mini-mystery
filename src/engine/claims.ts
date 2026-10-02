// Truth evaluation of claims against the actual ground truth — used to mark
// lies for the reveal screen and to sanity-check generation (honest claims
// must be true, fabricated claims must be false).

import { isEvil, liesAboutWhereabouts } from './deck'
import type { CastMember, CharId, Claim, GroundTruth } from './types'
import { attrMatches } from './types'

function sameSet(a: readonly CharId[], b: readonly CharId[]): boolean {
  if (a.length !== b.length) return false
  const bs = new Set(b)
  return a.every((x) => bs.has(x))
}

/**
 * true / false for evaluable claims; null for pure opinion (suspicion).
 */
export function claimIsTrue(
  claim: Claim,
  speaker: CharId,
  truth: GroundTruth,
  cast: CastMember[],
): boolean | null {
  const culprit = truth.roles.indexOf('culprit')
  switch (claim.kind) {
    case 'role':
      return truth.roles[speaker] === claim.role
    case 'whereabouts':
      return (
        truth.locations[speaker] === claim.room &&
        sameSet(claim.companions, truth.companions[speaker])
      )
    case 'sighting':
      // (The Red Herring was seen at the scene, truly — and spent the hour elsewhere.)
      return (
        truth.locations[claim.target] === claim.room ||
        (claim.room === truth.sceneRoom && truth.roles[claim.target] === 'redherring')
      )
    case 'glimpse':
      return culprit >= 0 && claim.room === truth.sceneRoom && attrMatches(claim.attr, cast[culprit])
    case 'culpritAttr':
      return culprit >= 0 && attrMatches(claim.attr, cast[culprit])
    case 'liarsAmong':
      return claim.pair.filter((c) => liesAboutWhereabouts(truth.roles[c])).length === claim.count
    case 'blackmailed':
      return truth.roles[claim.by] === 'blackmailer'
    case 'bribed':
      return truth.roles[claim.by] === 'sponsor' && truth.bribed === speaker
    case 'toldBy':
      return truth.roles[claim.by] === 'whisperer' && truth.whispered === speaker
    case 'among':
      return culprit >= 0 && claim.suspects.includes(culprit)
    case 'theft':
      return truth.roles[speaker] === 'thief' && truth.theftRoom === claim.room
    case 'earlier':
      // Only the Red Herring was at the scene before the murder.
      return truth.roles[claim.target] === 'redherring' && claim.room === truth.sceneRoom
    case 'alignment':
      return (claim.alignment === 'evil') === isEvil(truth.roles[claim.target])
    case 'relationship':
      return truth.relationships[claim.subject] === claim.rel
    case 'heard':
      return claim.sound === 'crash'
        ? truth.theftRoom === claim.room
        : claim.room === truth.sceneRoom // quarrels happen at the scene, earlier that day
    case 'passage':
      return truth.passage?.room === claim.room
    case 'confession':
      return truth.roles[speaker] === 'culprit'
    case 'passing':
      // Somebody was in the corridor; it was who it was, and it proves nothing.
      return truth.corridor === undefined || truth.corridor === null ? null : claim.target === truth.corridor
    case 'silent':
    case 'trust':
    case 'suspicion':
      return null
  }
}

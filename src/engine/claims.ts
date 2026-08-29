// Truth evaluation of claims against the actual ground truth — used to mark
// lies for the reveal screen and to sanity-check generation (honest claims
// must be true, fabricated claims must be false).

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
      return truth.locations[claim.target] === claim.room
    case 'glimpse':
      return claim.room === truth.sceneRoom && attrMatches(claim.attr, cast[culprit])
    case 'culpritAttr':
      return attrMatches(claim.attr, cast[culprit])
    case 'alignment':
      return (claim.alignment === 'evil') === (truth.roles[claim.target] === 'culprit')
    case 'relationship':
      return truth.relationships[claim.subject] === claim.rel
    case 'heard':
      return claim.sound === 'crash'
        ? truth.theftRoom === claim.room
        : claim.room === truth.sceneRoom // quarrels happen at the scene, earlier that day
    case 'suspicion':
      return null
  }
}

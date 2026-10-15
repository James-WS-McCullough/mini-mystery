// Putting to a guest what somebody else has said of them. Most guests,
// honest or not, have only a word to say to it. But a guest whose story was
// bent for somebody else's sake (the Sweetheart and the one they were with,
// the Clinger and the kind soul who swore to them) owns up, as though
// pressed, when what they are shown gives their story the lie.

import { findContradictions } from './contradictions'
import { allSpoken } from './dealing/night'
import type { CharId, Claim, Mystery, Spoken } from './types'

/** Whether a claim names a guest: somebody seen, vouched for, suspected, paired, or paid. */
export function namesGuest(claim: Claim, c: CharId): boolean {
  switch (claim.kind) {
    case 'whereabouts':
      return claim.companions.includes(c)
    case 'sighting':
    case 'earlier':
    case 'passing':
    case 'suspicion':
    case 'trust':
    case 'alignment':
      return claim.target === c
    case 'together':
    case 'liarsAmong':
      return claim.pair.includes(c)
    case 'among':
      return claim.suspects.includes(c)
    case 'relationship':
      return claim.subject === c
    case 'blackmailed':
    case 'bribed':
    case 'toldBy':
      return claim.by === c
    default:
      return false
  }
}

/**
 * The two halves of each story told for somebody else's sake tonight: the
 * Sweetheart and whom they were with; whoever clings (the Clinger, or the
 * murderer playing the part) and the kind soul who swore to them.
 */
export function tiedPairs(mystery: Pick<Mystery, 'truth'>): [CharId, CharId][] {
  const { roles, sweetheartOf, clingerOf } = mystery.truth
  const pairs: [CharId, CharId][] = []
  const sweetheart = roles.indexOf('sweetheart')
  if (sweetheart >= 0 && sweetheartOf != null) pairs.push([sweetheart, sweetheartOf])
  if (clingerOf != null) {
    // (A Cunning Murderer playing the Clinger answers as a Clinger would: the act is the same.)
    const clinger = roles.indexOf('clinger')
    const clung = clinger >= 0 ? clinger : roles.indexOf('murderer')
    if (clung >= 0) pairs.push([clung, clingerOf])
  }
  return pairs
}

/** Whether a guest's story is one of those halves. */
export function isTied(mystery: Pick<Mystery, 'truth'>, c: CharId): boolean {
  return tiedPairs(mystery).some((pair) => pair.includes(c))
}

/**
 * Whether, shown what somebody else said of them, a guest owns up: they are
 * one of a tied pair, and what they are shown cannot stand with what they
 * have told.
 */
export function ownsUpTo(mystery: Mystery, c: CharId, shown: Spoken, told: readonly Spoken[] = allSpoken(mystery)): boolean {
  if (shown.speaker === c || !namesGuest(shown.claim, c) || !isTied(mystery, c)) return false
  const theirs = told.filter((s) => s.speaker === c)
  const statements = [shown, ...theirs].map((s, i) => ({ id: `c${i}`, ...s }))
  return findContradictions(statements, mystery.evidence, mystery.caseSheet).some(
    (x) => x.statementIds.includes('c0') && x.implicated.includes(c),
  )
}

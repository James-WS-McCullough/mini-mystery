// Putting to a guest what somebody else has said of them. Most guests,
// honest or not, have only a word to say to it. But a guest whose story was
// bent for somebody else's sake (the Sweetheart and the one they were with,
// the Clinger and the kind soul who swore to them, the honest mouth the
// Whisperer put a story in) owns up, as though pressed, when what they are
// told gives their story the lie; and the witness paid to say nothing, when
// shown the money.

import { findContradictions } from './contradictions'
import type { Answer, CharId, Claim, Mystery, Spoken } from './types'

/** Everything a guest will say before they are pressed: what they own to under pressing is not their story. */
export function toldBefore(mystery: Pick<Mystery, 'policies'>): Spoken[] {
  return mystery.policies.flatMap((p, speaker) =>
    ([p.reaction, ...p.role, ...p.alibi, ...p.knowledge, p.seen, p.suspect, ...Object.values(p.aboutPerson), ...Object.values(p.aboutEvidence)] as Answer[])
      .flatMap((a) => [...a.claims, ...(a.also?.claims ?? [])])
      .map((claim) => ({ speaker, claim })),
  )
}

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

/**
 * Whether a guest's story was bent for somebody else's sake: one of those
 * halves; or the honest guest repeating the Whisperer's story; or the one
 * paid to say nothing.
 */
export function isTied(mystery: Pick<Mystery, 'truth'>, c: CharId): boolean {
  return tiedPairs(mystery).some((pair) => pair.includes(c)) || mystery.truth.whispered === c || mystery.truth.bribed === c
}

/** Whether an exhibit, shown them, is what they were paid with: the bought witness owns up. */
export function paidWith(mystery: Pick<Mystery, 'evidence'>, c: CharId, item: string): boolean {
  const fact = mystery.evidence.find((e) => e.id === item)?.fact
  return fact?.kind === 'bribe' && fact.to === c
}

/** The room a claim places somebody in, if it places anybody. */
function roomOf(claim: Claim): string | null {
  return claim.kind === 'whereabouts' || claim.kind === 'sighting' || claim.kind === 'roomState' ? claim.room : null
}

/**
 * Whether a note is worth telling a guest: it names them; or it names, or
 * speaks of the room of, somebody they say they saw. (Asked the same of
 * every guest, honest or not: what may be told them gives nothing away.)
 */
export function concerns(note: Spoken, c: CharId, theirs: readonly Spoken[]): boolean {
  if (note.speaker === c) return false
  if (namesGuest(note.claim, c)) return true
  return theirs.some(
    (t) =>
      t.speaker === c &&
      t.claim.kind === 'sighting' &&
      (namesGuest(note.claim, t.claim.target) || roomOf(note.claim) === t.claim.room),
  )
}

/**
 * Whether, shown what somebody else said of them, a guest owns up: they are
 * one of a tied pair, and what they are shown cannot stand with what they
 * have told.
 */
export function ownsUpTo(mystery: Mystery, c: CharId, shown: Spoken, told: readonly Spoken[] = toldBefore(mystery)): boolean {
  if (shown.speaker === c || !isTied(mystery, c)) return false
  const theirs = told.filter((s) => s.speaker === c)
  const statements = [shown, ...theirs].map((s, i) => ({ id: `c${i}`, ...s }))
  return findContradictions(statements, mystery.evidence, mystery.caseSheet).some(
    (x) => x.statementIds.includes('c0') && x.implicated.includes(c),
  )
}

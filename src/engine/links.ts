// Corroborations — the other half of deduction. A LINK is a pair of notebook
// items that hold together: testimony that vouches for someone, clues that
// agree, an account confirmed by physical evidence. Realising a link admits
// its statements into the player's case, where the world enumerator lets them
// CLEAR people — the mirror image of a contradiction.

import type { NotedStatement } from './contradictions'
import type { CaseSheet, CastMember, CharId, Claim, EvidenceItem, ItemId } from './types'
import { attrMatches } from './types'

export type LinkReason =
  | 'mutual-alibi' // each puts the other beside them in the same room
  | 'vouched' // a sighting agrees with someone's own account
  | 'sound-explained' // the crash heard is the theft the lockbox proves
  | 'clues-agree' // two descriptions of the culprit coincide
  | 'account-confirmed' // physical evidence bears out what someone said
  | 'alibi-trace' // a trace in the room bears out "I was there alone"
  | 'seen-at-scene' // two accounts agree that somebody was at the scene: no alibi, but opportunity

export interface Link {
  reason: LinkReason
  statementIds: string[]
  evidenceId?: ItemId
  /** Whose account this corroboration speaks for (empty for clue agreements). */
  supports: CharId[]
}

function attrsEqual(a: Claim & { kind: 'culpritAttr' | 'glimpse' }, b: Claim & { kind: 'culpritAttr' | 'glimpse' }): boolean {
  if (a.attr.kind === 'trait' && b.attr.kind === 'trait') return a.attr.trait === b.attr.trait
  if (a.attr.kind === 'sex' && b.attr.kind === 'sex') return a.attr.sex === b.attr.sex
  return false
}

export function findLinks(
  statements: NotedStatement[],
  evidence: EvidenceItem[],
  caseSheet: CaseSheet,
  /** The guests, for matching a trace to whoever it fits. */
  cast: readonly CastMember[] = [],
): Link[] {
  const out: Link[] = []
  const seen = new Set<string>()
  const add = (l: Link) => {
    const key = `${l.reason}|${[...l.statementIds].sort().join(',')}|${l.evidenceId ?? ''}`
    if (!seen.has(key)) {
      seen.add(key)
      out.push(l)
    }
  }

  const whereabouts = statements.filter(
    (s): s is NotedStatement & { claim: Claim & { kind: 'whereabouts' } } => s.claim.kind === 'whereabouts',
  )
  const sightings = statements.filter(
    (s): s is NotedStatement & { claim: Claim & { kind: 'sighting' } } => s.claim.kind === 'sighting',
  )
  const crashes = statements.filter(
    (s): s is NotedStatement & { claim: Claim & { kind: 'heard' } } =>
      s.claim.kind === 'heard' && s.claim.sound === 'crash',
  )
  const attrClaims = statements.filter(
    (s): s is NotedStatement & { claim: Claim & { kind: 'culpritAttr' | 'glimpse' } } =>
      s.claim.kind === 'culpritAttr' ||
      (s.claim.kind === 'glimpse' && s.claim.room === caseSheet.sceneRoom),
  )
  const relationships = statements.filter(
    (s): s is NotedStatement & { claim: Claim & { kind: 'relationship' } } => s.claim.kind === 'relationship',
  )

  // Each puts the other beside them, in the same room.
  for (const a of whereabouts) {
    for (const b of whereabouts) {
      if (a.id >= b.id) continue
      if (
        a.claim.room === b.claim.room &&
        a.claim.companions.includes(b.speaker) &&
        b.claim.companions.includes(a.speaker)
      ) {
        add({
          reason: 'mutual-alibi',
          statementIds: [a.id, b.id],
          supports: [a.speaker, b.speaker],
        })
      }
    }
  }

  // A sighting that agrees with the sighted person's own account.
  for (const s of sightings) {
    for (const w of whereabouts) {
      if (s.claim.target !== w.speaker || s.speaker === w.speaker) continue
      if (s.claim.room !== w.claim.room) continue
      // To be borne out at the scene of the crime is no alibi at all.
      if (s.claim.room === caseSheet.sceneRoom) {
        add({ reason: 'seen-at-scene', statementIds: [w.id, s.id], supports: [] })
      } else {
        add({ reason: 'vouched', statementIds: [w.id, s.id], supports: [w.speaker] })
      }
    }
  }

  // The crash somebody heard is the theft the forced lockbox proves.
  for (const c of crashes) {
    for (const item of evidence) {
      if (item.fact.kind === 'forcedLockbox' && item.fact.room === c.claim.room) {
        add({ reason: 'sound-explained', statementIds: [c.id], evidenceId: item.id, supports: [c.speaker] })
      }
    }
  }

  // Two descriptions of the culprit that coincide.
  for (const a of attrClaims) {
    for (const b of attrClaims) {
      if (a.id >= b.id) continue
      if (a.speaker !== b.speaker && attrsEqual(a.claim, b.claim)) {
        add({ reason: 'clues-agree', statementIds: [a.id, b.id], supports: [] })
      }
    }
  }

  // An account of the victim confirmed by a document; whereabouts confirmed by
  // the scene of the theft (the confessed thief's story checks out).
  for (const r of relationships) {
    for (const item of evidence) {
      if (item.fact.kind !== 'motiveDocument') continue
      if (item.fact.subject === r.claim.subject && item.fact.rel === r.claim.rel) {
        add({ reason: 'account-confirmed', statementIds: [r.id], evidenceId: item.id, supports: [r.speaker] })
      }
    }
  }
  for (const w of whereabouts) {
    for (const item of evidence) {
      if (item.fact.kind === 'forcedLockbox' && item.fact.room === w.claim.room) {
        add({ reason: 'account-confirmed', statementIds: [w.id], evidenceId: item.id, supports: [w.speaker] })
      }
    }
  }

  // "I was alone in the library" — and in the library, a trace that fits them.
  for (const w of whereabouts) {
    if (w.claim.companions.length > 0) continue
    for (const item of evidence) {
      if (item.fact.kind !== 'trace' || item.fact.room !== w.claim.room) continue
      // Nothing found at the scene bears anybody out: nobody left it there innocently.
      if (item.fact.room === caseSheet.sceneRoom) continue
      const who = cast[w.speaker]
      if (!who || !attrMatches(item.fact.attr, who)) continue
      add({ reason: 'alibi-trace', statementIds: [w.id], evidenceId: item.id, supports: [w.speaker] })
    }
  }

  return out
}

/** Does the player's chosen pair realise any link? (Exact pair match.) */
export function matchLink(selection: readonly string[], links: Link[]): Link[] {
  if (selection.length !== 2) return []
  const [a, b] = selection
  return links.filter((l) => {
    const items = l.evidenceId ? [...l.statementIds, l.evidenceId] : [...l.statementIds]
    return items.length === 2 && items.includes(a) && items.includes(b)
  })
}

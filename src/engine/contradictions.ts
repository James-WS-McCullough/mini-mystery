// Structural contradiction detection over collected statements + evidence.
// These are ENGINE VERDICTS: two claims (or a claim and a physical fact) that
// cannot both be true, regardless of who is guilty. `implicated` lists the
// speakers who cannot all be honest; `proven` marks contradictions where one
// side is physical evidence or the speaker contradicted themself — proof that
// that speaker is not honest (lying, or sincerely wrong).

import type { CaseSheet, CharId, Claim, EvidenceItem, ItemId } from './types'

export interface NotedStatement {
  id: string
  speaker: CharId
  claim: Claim
}

export type ContradictionReason =
  | 'whereabouts-vs-sighting'
  | 'companion-mismatch'
  | 'sighting-vs-sighting'
  | 'role-overclaimed'
  | 'relationship-conflict'
  | 'relationship-vs-document'
  | 'attr-conflict'
  | 'shortlist-conflict'
  | 'blackmail-vs-role'
  | 'crash-conflict'
  | 'self-contradiction'

export interface Contradiction {
  reason: ContradictionReason
  statementIds: string[]
  evidenceId?: ItemId
  /** Speakers who cannot all be honest. */
  implicated: CharId[]
  /** True when the falsehood is pinned on a specific speaker with certainty. */
  proven: boolean
}

function attrsConflict(a: Claim & { kind: 'culpritAttr' | 'glimpse' }, b: Claim & { kind: 'culpritAttr' | 'glimpse' }): boolean {
  if (a.attr.kind === 'trait' && b.attr.kind === 'trait') return a.attr.trait !== b.attr.trait
  if (a.attr.kind === 'parity' && b.attr.kind === 'parity') return a.attr.parity !== b.attr.parity
  return false // trait vs parity can both describe one person
}

export function findContradictions(
  statements: NotedStatement[],
  evidence: EvidenceItem[],
  caseSheet: CaseSheet,
): Contradiction[] {
  const out: Contradiction[] = []
  const seen = new Set<string>()
  const add = (c: Contradiction) => {
    const key = `${c.reason}|${[...c.statementIds].sort().join(',')}|${c.evidenceId ?? ''}`
    if (!seen.has(key)) {
      seen.add(key)
      out.push(c)
    }
  }

  const whereabouts = statements.filter(
    (s): s is NotedStatement & { claim: Claim & { kind: 'whereabouts' } } => s.claim.kind === 'whereabouts',
  )
  const sightings = statements.filter(
    (s): s is NotedStatement & { claim: Claim & { kind: 'sighting' } } => s.claim.kind === 'sighting',
  )
  const relationships = statements.filter(
    (s): s is NotedStatement & { claim: Claim & { kind: 'relationship' } } => s.claim.kind === 'relationship',
  )
  const roleClaims = statements.filter(
    (s): s is NotedStatement & { claim: Claim & { kind: 'role' } } => s.claim.kind === 'role',
  )
  // Oracle claims plus glimpses at the scene both describe the culprit.
  const attrClaims = statements.filter(
    (s): s is NotedStatement & { claim: Claim & { kind: 'culpritAttr' | 'glimpse' } } =>
      s.claim.kind === 'culpritAttr' ||
      (s.claim.kind === 'glimpse' && s.claim.room === caseSheet.sceneRoom),
  )
  const crashes = statements.filter(
    (s): s is NotedStatement & { claim: Claim & { kind: 'heard' } } =>
      s.claim.kind === 'heard' && s.claim.sound === 'crash',
  )
  const alignments = statements.filter(
    (s): s is NotedStatement & { claim: Claim & { kind: 'alignment' } } => s.claim.kind === 'alignment',
  )

  // Whereabouts vs sighting of that speaker elsewhere.
  for (const w of whereabouts) {
    for (const s of sightings) {
      if (s.claim.target !== w.speaker || s.speaker === w.speaker) continue
      if (s.claim.room !== w.claim.room) {
        add({
          reason: 'whereabouts-vs-sighting',
          statementIds: [w.id, s.id],
          implicated: [w.speaker, s.speaker],
          proven: false,
        })
      }
    }
  }

  // Whereabouts vs whereabouts: named companions must corroborate.
  for (const a of whereabouts) {
    for (const b of whereabouts) {
      if (a.id === b.id) continue
      if (a.speaker === b.speaker) {
        // Same speaker telling two different stories.
        if (a.claim.room !== b.claim.room && a.id < b.id) {
          add({
            reason: 'self-contradiction',
            statementIds: [a.id, b.id],
            implicated: [a.speaker],
            proven: true,
          })
        }
        continue
      }
      const aNamesB = a.claim.companions.includes(b.speaker)
      if (aNamesB && b.claim.room !== a.claim.room) {
        add({
          reason: 'companion-mismatch',
          statementIds: [a.id, b.id],
          implicated: [a.speaker, b.speaker],
          proven: false,
        })
      }
      if (
        a.claim.room === b.claim.room &&
        (!aNamesB || !b.claim.companions.includes(a.speaker)) &&
        a.id < b.id
      ) {
        // Both put themselves in the same room but the lists disagree
        // ("alone in the library" twice, or one-sided companionship).
        add({
          reason: 'companion-mismatch',
          statementIds: [a.id, b.id],
          implicated: [a.speaker, b.speaker],
          proven: false,
        })
      }
    }
  }

  // Two sightings of the same person in different rooms.
  for (const s1 of sightings) {
    for (const s2 of sightings) {
      if (s1.id >= s2.id) continue
      if (s1.claim.target === s2.claim.target && s1.claim.room !== s2.claim.room) {
        add({
          reason: 'sighting-vs-sighting',
          statementIds: [s1.id, s2.id],
          implicated: [s1.speaker, s2.speaker],
          proven: false,
        })
      }
    }
  }

  // A role claimed by more people than the deck holds copies. For single-copy
  // roles this decomposes into PAIRS — any two claimants cannot both be honest
  // — so each pair is separately spottable in the deduction menu.
  const deckCount = new Map<string, number>()
  for (const role of caseSheet.deck) deckCount.set(role, (deckCount.get(role) ?? 0) + 1)
  const claimantsByRole = new Map<string, NotedStatement[]>()
  for (const rc of roleClaims) {
    const list = claimantsByRole.get(rc.claim.role) ?? []
    if (!list.some((s) => s.speaker === rc.speaker)) list.push(rc)
    claimantsByRole.set(rc.claim.role, list)
  }
  for (const [role, claimants] of claimantsByRole) {
    const copies = deckCount.get(role) ?? 0
    if (claimants.length <= copies) continue
    if (copies === 1) {
      for (let i = 0; i < claimants.length; i++) {
        for (let j = i + 1; j < claimants.length; j++) {
          add({
            reason: 'role-overclaimed',
            statementIds: [claimants[i].id, claimants[j].id],
            implicated: [claimants[i].speaker, claimants[j].speaker],
            proven: false,
          })
        }
      }
    } else {
      add({
        reason: 'role-overclaimed',
        statementIds: claimants.map((s) => s.id),
        implicated: claimants.map((s) => s.speaker),
        proven: false,
      })
    }
  }

  // Relationship claims vs each other and vs motive documents.
  for (const r1 of relationships) {
    for (const r2 of relationships) {
      if (r1.id >= r2.id) continue
      if (r1.claim.subject === r2.claim.subject && r1.claim.rel !== r2.claim.rel) {
        add({
          reason: 'relationship-conflict',
          statementIds: [r1.id, r2.id],
          implicated: [...new Set([r1.speaker, r2.speaker])],
          proven: false,
        })
      }
    }
    for (const item of evidence) {
      if (item.fact.kind !== 'motiveDocument') continue
      if (item.fact.subject === r1.claim.subject && item.fact.rel !== r1.claim.rel) {
        add({
          reason: 'relationship-vs-document',
          statementIds: [r1.id],
          evidenceId: item.id,
          implicated: [r1.speaker],
          proven: true,
        })
      }
    }
  }

  // Conflicting descriptions of the culprit.
  for (const a1 of attrClaims) {
    for (const a2 of attrClaims) {
      if (a1.id >= a2.id) continue
      if (a1.speaker !== a2.speaker && attrsConflict(a1.claim, a2.claim)) {
        add({
          reason: 'attr-conflict',
          statementIds: [a1.id, a2.id],
          implicated: [a1.speaker, a2.speaker],
          proven: false,
        })
      }
    }
  }

  // Two shortlists with no name in common: the murderer is on both or neither.
  const shortlists = statements.filter(
    (s): s is NotedStatement & { claim: Claim & { kind: 'among' } } => s.claim.kind === 'among',
  )
  for (const l1 of shortlists) {
    for (const l2 of shortlists) {
      if (l1.id >= l2.id || l1.speaker === l2.speaker) continue
      if (!l1.claim.suspects.some((c) => l2.claim.suspects.includes(c))) {
        add({
          reason: 'shortlist-conflict',
          statementIds: [l1.id, l2.id],
          implicated: [l1.speaker, l2.speaker],
          proven: false,
        })
      }
    }
  }

  // Named as a blackmailer by one of their victims, and claiming to be
  // something else.
  for (const b of statements) {
    if (b.claim.kind !== 'blackmailed') continue
    const by = b.claim.by
    const theirs = roleClaims.filter((r) => r.speaker === by)
    if (theirs.some((r) => r.claim.role === 'blackmailer')) continue
    for (const r of theirs) {
      add({
        reason: 'blackmail-vs-role',
        statementIds: [b.id, r.id],
        implicated: [b.speaker, by],
        proven: false,
      })
    }
  }

  // Two crashes in different rooms — there was one theft.
  for (const c1 of crashes) {
    for (const c2 of crashes) {
      if (c1.id >= c2.id) continue
      if (c1.claim.room !== c2.claim.room) {
        add({
          reason: 'crash-conflict',
          statementIds: [c1.id, c2.id],
          implicated: [c1.speaker, c2.speaker],
          proven: false,
        })
      }
    }
  }

  // Conflicting alignment claims about the same person.
  for (const a1 of alignments) {
    for (const a2 of alignments) {
      if (a1.id >= a2.id) continue
      if (a1.claim.target === a2.claim.target && a1.claim.alignment !== a2.claim.alignment) {
        add({
          reason: 'relationship-conflict',
          statementIds: [a1.id, a2.id],
          implicated: [a1.speaker, a2.speaker],
          proven: false,
        })
      }
    }
  }

  return out
}

/** Characters against whom a contradiction stands — the Press unlock set. */
export function pressableChars(contradictions: Contradiction[]): Set<CharId> {
  const set = new Set<CharId>()
  for (const c of contradictions) for (const id of c.implicated) set.add(id)
  return set
}

/**
 * The deduction menu: does the player's chosen PAIR of notebook items
 * (statement ids and/or evidence item ids) realise any contradiction?
 * A pair matches a contradiction whose item set is exactly that pair.
 */
export function matchContradiction(
  selection: readonly string[],
  contradictions: Contradiction[],
): Contradiction[] {
  if (selection.length !== 2) return []
  const [a, b] = selection
  return contradictions.filter((c) => {
    const items = c.evidenceId ? [...c.statementIds, c.evidenceId] : [...c.statementIds]
    return items.length === 2 && items.includes(a) && items.includes(b)
  })
}

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
  | 'sighting-vs-company'
  | 'silence-vs-bribe'
  | 'passage-conflict'
  | 'two-confessions'
  | 'crash-conflict'
  | 'theft-vs-box'
  | 'blackmail-unclaimed'
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
  if (a.attr.kind === 'sex' && b.attr.kind === 'sex') return a.attr.sex !== b.attr.sex
  return false // a trait and a sex can both describe one person
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

  // Somebody seen in a room, by one who was not there — and somebody else who
  // was, and says who was with them, and does not name the one seen. (Not at
  // the scene: whoever was there before the murderer was there alone.)
  for (const s of sightings) {
    if (s.claim.room === caseSheet.sceneRoom) continue
    for (const w of whereabouts) {
      if (w.claim.room !== s.claim.room) continue
      if (w.speaker === s.speaker || w.speaker === s.claim.target) continue
      if (w.claim.companions.includes(s.claim.target)) continue
      add({
        reason: 'sighting-vs-company',
        statementIds: [w.id, s.id],
        implicated: [w.speaker, s.speaker],
        proven: false,
      })
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

  // Two sightings of the same person in different rooms — unless one of them
  // is at the scene: whoever looked in there within the hour (the Red Herring)
  // may truly have been seen elsewhere too. That pair is opportunity, not a lie.
  for (const s1 of sightings) {
    for (const s2 of sightings) {
      if (s1.id >= s2.id) continue
      if (s1.claim.room === caseSheet.sceneRoom || s2.claim.room === caseSheet.sceneRoom) continue
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

  // Nobody shares a role: any two who claim the same one cannot both be what
  // they say. Each pair is separately spottable in the deduction menu.
  const claimantsByRole = new Map<string, NotedStatement[]>()
  for (const rc of roleClaims) {
    const list = claimantsByRole.get(rc.claim.role) ?? []
    if (!list.some((s) => s.speaker === rc.speaker)) list.push(rc)
    claimantsByRole.set(rc.claim.role, list)
  }
  for (const claimants of claimantsByRole.values()) {
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

  // There is one passage. Two who say it runs to different rooms cannot both
  // be right; and one who says it runs where it has not been found is wrong.
  const passages = statements.filter(
    (s): s is NotedStatement & { claim: Claim & { kind: 'passage' } } => s.claim.kind === 'passage',
  )
  for (const p1 of passages) {
    for (const p2 of passages) {
      if (p1.id >= p2.id || p1.speaker === p2.speaker) continue
      if (p1.claim.room !== p2.claim.room) {
        add({
          reason: 'passage-conflict',
          statementIds: [p1.id, p2.id],
          implicated: [p1.speaker, p2.speaker],
          proven: false,
        })
      }
    }
    for (const item of evidence) {
      if (item.fact.kind !== 'passage' || item.fact.room === p1.claim.room) continue
      add({
        reason: 'passage-conflict',
        statementIds: [p1.id],
        evidenceId: item.id,
        implicated: [p1.speaker],
        proven: true,
      })
    }
  }

  // One hand did it. Two who each say it was theirs cannot both be believed.
  const confessions = statements.filter((s) => s.claim.kind === 'confession')
  for (const c1 of confessions) {
    for (const c2 of confessions) {
      if (c1.id >= c2.id || c1.speaker === c2.speaker) continue
      add({
        reason: 'two-confessions',
        statementIds: [c1.id, c2.id],
        implicated: [c1.speaker, c2.speaker],
        proven: false,
      })
    }
  }

  // Nothing to tell, they say — and money found with their name on it.
  for (const s of statements) {
    if (s.claim.kind !== 'silent') continue
    for (const item of evidence) {
      if (item.fact.kind !== 'bribe' || item.fact.to !== s.speaker) continue
      add({
        reason: 'silence-vs-bribe',
        statementIds: [s.id],
        evidenceId: item.id,
        implicated: [s.speaker],
        proven: true,
      })
    }
  }

  // Owning to a theft in a room whose box was found untouched — or while the
  // forced box was found in some other room. Proof: a box does not lie.
  for (const s of statements) {
    if (s.claim.kind !== 'theft') continue
    const room = s.claim.room
    for (const item of evidence) {
      const wrong =
        (item.fact.kind === 'lockboxIntact' && item.fact.room === room) ||
        (item.fact.kind === 'forcedLockbox' && item.fact.room !== room)
      if (!wrong) continue
      add({
        reason: 'theft-vs-box',
        statementIds: [s.id],
        evidenceId: item.id,
        implicated: [s.speaker],
        proven: true,
      })
    }
    // Or while somebody heard the crash of it from another room.
    for (const c of statements) {
      if (c.claim.kind !== 'heard' || c.claim.sound !== 'crash' || c.claim.room === room) continue
      add({
        reason: 'crash-conflict',
        statementIds: [s.id, c.id],
        implicated: [s.speaker, c.speaker],
        proven: false,
      })
    }
  }
  // Owning to the blackmail while a victim of it names somebody else.
  for (const r of roleClaims) {
    if (r.claim.role !== 'blackmailer') continue
    for (const b of statements) {
      if (b.claim.kind !== 'blackmailed' || b.claim.by === r.speaker) continue
      add({
        reason: 'blackmail-unclaimed',
        statementIds: [r.id, b.id],
        implicated: [r.speaker, b.speaker],
        proven: false,
      })
    }
  }

  // Named as a blackmailer by one of their victims — or as the one who paid
  // for a silence, or put a story about — and claiming to be something else.
  const NAMED_AS = { blackmailed: 'blackmailer', bribed: 'sponsor', toldBy: 'whisperer' } as const
  for (const b of statements) {
    if (b.claim.kind !== 'blackmailed' && b.claim.kind !== 'bribed' && b.claim.kind !== 'toldBy') continue
    const by = b.claim.by
    const as = NAMED_AS[b.claim.kind]
    const theirs = roleClaims.filter((r) => r.speaker === by)
    if (theirs.some((r) => r.claim.role === as)) continue
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

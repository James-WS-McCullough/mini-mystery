// Statement policies: what each character will SAY. Honest characters speak
// their knowledge; concealers deploy their cover story and planned lies; the
// drunk sincerely repeats their corrupted information. Every character gets an
// answer for every question — no statement-count tells.

import { claimIsTrue } from './claims'
import { truthClassOf } from './deck'
import { Rng } from './rng'
import type {
  Answer,
  CastMember,
  CharId,
  Claim,
  EvidenceItem,
  GroundTruth,
  Mystery,
  Policy,
  PressOutcome,
  Relationship,
  RoleId,
  RoomId,
} from './types'
import { MOTIVE_GRADE, attrMatches, isMotiveGrade, seatParity } from './types'

/** Corrupted info for the Drunk: sincere, wrong, and never a reliable-class claim. */
export function corruptedInfo(
  rng: Rng,
  believed: RoleId,
  cast: CastMember[],
  culprit: CharId,
  drunk: CharId,
  sceneRoom: RoomId,
): Claim {
  const wrongTraits = [...new Set(cast.map((m) => m.trait))].filter((t) => t !== cast[culprit].trait)
  switch (believed) {
    case 'witness':
      return { kind: 'glimpse', attr: { kind: 'trait', trait: rng.pick(wrongTraits) }, room: sceneRoom }
    case 'oracle': {
      const wrongParity = seatParity(cast[culprit].seat) === 'odd' ? 'even' : 'odd'
      return rng.chance(0.5)
        ? { kind: 'culpritAttr', attr: { kind: 'parity', parity: wrongParity } }
        : { kind: 'culpritAttr', attr: { kind: 'trait', trait: rng.pick(wrongTraits) } }
    }
    default: {
      const innocents = cast.map((m) => m.id).filter((c) => c !== drunk && c !== culprit)
      return rng.chance(0.5)
        ? { kind: 'alignment', target: rng.pick(innocents), alignment: 'evil' }
        : { kind: 'alignment', target: culprit, alignment: 'good' }
    }
  }
}

/** A concealer's fabricated role-power info. Must never truthfully incriminate the culprit. */
export function fabricateInfo(
  rng: Rng,
  cover: RoleId,
  cast: CastMember[],
  relationships: Relationship[],
  speaker: CharId,
  culprit: CharId,
  sceneRoom: RoomId,
): Claim | null {
  const safeTraits = [...new Set(cast.map((m) => m.trait))].filter(
    (t) => t !== cast[culprit].trait && t !== cast[speaker].trait,
  )
  switch (cover) {
    case 'witness': {
      const frameTargets = cast.map((m) => m.id).filter((c) => c !== speaker && c !== culprit)
      if (rng.chance(0.3)) {
        return { kind: 'sighting', target: rng.pick(frameTargets), room: sceneRoom }
      }
      const pool = safeTraits.length > 0 ? safeTraits : [cast[rng.pick(frameTargets)].trait]
      return { kind: 'glimpse', attr: { kind: 'trait', trait: rng.pick(pool) }, room: sceneRoom }
    }
    case 'oracle': {
      if (rng.chance(0.5) || safeTraits.length === 0) {
        const wrongParity = seatParity(cast[culprit].seat) === 'odd' ? 'even' : 'odd'
        return { kind: 'culpritAttr', attr: { kind: 'parity', parity: wrongParity } }
      }
      return { kind: 'culpritAttr', attr: { kind: 'trait', trait: rng.pick(safeTraits) } }
    }
    case 'gossip': {
      // Invented dirt: a false motive pinned on an innocent.
      const subjects = cast
        .map((m) => m.id)
        .filter((c) => c !== speaker && c !== culprit && !isMotiveGrade(relationships[c]))
      if (subjects.length === 0) return null
      const subject = rng.pick(subjects)
      const fakeRels = MOTIVE_GRADE.filter((r) => r !== relationships[subject])
      return { kind: 'relationship', subject, rel: rng.pick(fakeRels) }
    }
    default: {
      // Fake confidant: accuse an innocent, or (unfalsifiably) vouch for one.
      const others = cast.map((m) => m.id).filter((c) => c !== speaker && c !== culprit)
      const target = rng.pick(others)
      return rng.chance(0.4)
        ? { kind: 'alignment', target, alignment: 'evil' }
        : { kind: 'alignment', target, alignment: 'good' }
    }
  }
}

export interface PolicyContext {
  cast: CastMember[]
  truth: GroundTruth
  evidence: EvidenceItem[]
  knowledge: Claim[][]
  coverRoles: Map<CharId, RoleId>
  fabricated: Map<CharId, Claim>
  lieRooms: Map<CharId, RoomId>
  suspicionTarget: Map<CharId, CharId>
  docReferralHolder: CharId
  docRoom: RoomId
  weaponReferralHolder: CharId
  weaponRoom: RoomId
  quarrelHearer: CharId
}

export function buildPolicy(c: CharId, ctx: PolicyContext): Policy {
  const { cast, truth, evidence, knowledge, coverRoles, fabricated, lieRooms, suspicionTarget } = ctx
  const me = cast[c]
  const cls = truthClassOf(truth.roles[c])
  const isConcealerChar = cls === 'concealer'
  const twoStep = me.strategy === 'evasive' || me.strategy === 'reticent'

  // Role claim: cover for concealers, sincere belief for the drunk, truth otherwise.
  const claimedRole: RoleId = isConcealerChar
    ? coverRoles.get(c)!
    : cls === 'unreliable'
      ? truth.drunkBelievedRole!
      : truth.roles[c]
  const roleClaim: Claim = { kind: 'role', role: claimedRole }

  // Whereabouts: the lie or the truth.
  const whereClaim: Claim = isConcealerChar
    ? { kind: 'whereabouts', room: lieRooms.get(c)!, companions: [] }
    : { kind: 'whereabouts', room: truth.locations[c], companions: truth.companions[c] }

  // What they'll offer under "what do you know?".
  const infoClaims: Claim[] = isConcealerChar ? [fabricated.get(c)!] : [...knowledge[c]]

  // Reaction: the free opener. Routing hooks surface here.
  const heard = infoClaims.find((k): k is Claim & { kind: 'heard' } => k.kind === 'heard')
  const fingerPointer = me.strategy === 'accuser' || me.strategy === 'deflector'
  let reaction: Answer
  if (heard) {
    reaction = { claims: [heard], lineKey: `reaction.heard.${heard.sound}` }
  } else if (fingerPointer && suspicionTarget.has(c)) {
    const target = suspicionTarget.get(c)!
    reaction = {
      claims: [{ kind: 'suspicion', target }],
      lineKey: 'reaction.accuse',
      slots: { target: cast[target].shortName },
    }
  } else if (c === ctx.docReferralHolder) {
    reaction = {
      claims: [],
      lineKey: 'reaction.referral',
      slots: { room: ctx.docRoom },
      refer: { room: ctx.docRoom },
    }
  } else if (c === ctx.weaponReferralHolder) {
    reaction = {
      claims: [],
      lineKey: 'reaction.weaponhint',
      slots: { room: ctx.weaponRoom },
      refer: { room: ctx.weaponRoom },
    }
  } else {
    reaction = { claims: [], lineKey: 'reaction.plain' }
  }

  const vague = (lineKey: string): Answer => ({ claims: [], lineKey })

  const role: Answer[] = twoStep
    ? [vague('role.vague'), { claims: [roleClaim], lineKey: 'role.claim' }]
    : [{ claims: [roleClaim], lineKey: 'role.claim' }]

  const alibi: Answer[] = [
    {
      claims: [whereClaim],
      lineKey:
        whereClaim.kind === 'whereabouts' && whereClaim.companions.length > 0
          ? 'alibi.company'
          : 'alibi.alone',
    },
  ]

  const knowledgeFull: Answer = {
    claims: [roleClaim, ...infoClaims],
    lineKey: me.strategy === 'hedger' || me.strategy === 'theorist' ? 'knowledge.hedged' : 'knowledge.share',
  }
  if (c === ctx.docReferralHolder) {
    // "His lordship spent the afternoon writing…" — routes to the motive document.
    knowledgeFull.refer = { room: ctx.docRoom }
    knowledgeFull.slots = { ...knowledgeFull.slots, room: ctx.docRoom }
  } else if (c === ctx.weaponReferralHolder) {
    // "Something in that room is not as it should be…" — routes to the weapon.
    knowledgeFull.refer = { room: ctx.weaponRoom }
    knowledgeFull.slots = { ...knowledgeFull.slots, room: ctx.weaponRoom }
  }
  const knowledgeAnswers: Answer[] = twoStep ? [vague('knowledge.vague'), knowledgeFull] : [knowledgeFull]

  let suspect: Answer
  if (suspicionTarget.has(c)) {
    const target = suspicionTarget.get(c)!
    const hedged = me.strategy === 'hedger' || me.strategy === 'theorist'
    suspect = {
      claims: [{ kind: 'suspicion', target }],
      lineKey: hedged ? 'suspect.hedge' : 'suspect.point',
      slots: { target: cast[target].shortName },
    }
  } else {
    const knowledgeable = cast.map((m) => m.id).find((d) => d !== c && knowledge[d].length > 0)
    suspect = {
      claims: [],
      lineKey: 'suspect.none',
      refer: knowledgeable !== undefined ? { person: knowledgeable } : undefined,
    }
  }

  // About each other person.
  const aboutPerson: Record<string, Answer> = {}
  for (const other of cast) {
    if (other.id === c) continue
    const material: Claim[] = []
    if (!isConcealerChar) {
      if (truth.companions[c].includes(other.id)) {
        material.push({ kind: 'sighting', target: other.id, room: truth.locations[c] })
      }
      for (const k of knowledge[c]) {
        if (k.kind === 'sighting' && k.target === other.id) material.push(k)
        if (k.kind === 'relationship' && k.subject === other.id) material.push(k)
        if (k.kind === 'alignment' && k.target === other.id) material.push(k)
      }
    }
    if (material.length > 0) {
      aboutPerson[String(other.id)] = { claims: material, lineKey: 'about.person' }
    } else {
      const holder = cast
        .map((m) => m.id)
        .find(
          (d) =>
            d !== c &&
            d !== other.id &&
            truthClassOf(truth.roles[d]) !== 'concealer' &&
            (truth.companions[d].includes(other.id) ||
              knowledge[d].some(
                (k) =>
                  (k.kind === 'sighting' && k.target === other.id) ||
                  (k.kind === 'relationship' && k.subject === other.id) ||
                  (k.kind === 'alignment' && k.target === other.id),
              )),
        )
      aboutPerson[String(other.id)] =
        holder !== undefined
          ? {
              claims: [],
              lineKey: 'about.referral',
              slots: { person: cast[holder].shortName },
              refer: { person: holder, about: other.id },
            }
          : { claims: [], lineKey: 'about.nothing' }
    }
  }
  // About the victim: the relationship self-report (the motive lie lives here).
  const myRel = truth.relationships[c]
  const relClaim: Claim =
    isConcealerChar && isMotiveGrade(myRel)
      ? { kind: 'relationship', subject: c, rel: 'cordial' }
      : { kind: 'relationship', subject: c, rel: myRel }
  const victimClaims: Claim[] = [relClaim]
  if (c === ctx.quarrelHearer) {
    for (const k of knowledge[c]) {
      if (k.kind === 'heard' && k.sound === 'quarrel') victimClaims.push(k)
      if (k.kind === 'relationship') victimClaims.push(k)
    }
  }
  aboutPerson['victim'] = { claims: victimClaims, lineKey: 'about.victim' }

  // About each evidence item.
  const aboutEvidence: Record<string, Answer> = {}
  for (const item of evidence) {
    switch (item.fact.kind) {
      case 'traceAtScene': {
        const attr = item.fact.attr
        const matchesMe = attrMatches(attr, me)
        aboutEvidence[item.id] = matchesMe
          ? { claims: [], lineKey: 'evidence.deny' }
          : { claims: [], lineKey: 'evidence.identify' }
        break
      }
      case 'weapon': {
        const hasMeans = me.means.includes(item.fact.means)
        aboutEvidence[item.id] = hasMeans
          ? { claims: [], lineKey: 'evidence.weapon.deny' }
          : { claims: [], lineKey: 'evidence.weapon.comment' }
        break
      }
      case 'forcedLockbox':
        aboutEvidence[item.id] = { claims: [], lineKey: 'evidence.lockbox' }
        break
      case 'motiveDocument': {
        const docSubject = item.fact.subject
        if (docSubject === c) {
          aboutEvidence[item.id] =
            isConcealerChar && isMotiveGrade(myRel)
              ? { claims: [{ kind: 'relationship', subject: c, rel: 'cordial' }], lineKey: 'evidence.doc.deny' }
              : { claims: [{ kind: 'relationship', subject: c, rel: myRel }], lineKey: 'evidence.doc.confirm' }
        } else {
          const gossipClaims = knowledge[c].filter(
            (k) => k.kind === 'relationship' && k.subject === docSubject,
          )
          aboutEvidence[item.id] =
            gossipClaims.length > 0
              ? { claims: gossipClaims, lineKey: 'evidence.doc.gossip' }
              : { claims: [], lineKey: 'evidence.doc.comment' }
        }
        break
      }
      case 'flavor':
        aboutEvidence[item.id] = { claims: [], lineKey: 'evidence.flavor' }
        break
    }
  }

  // Press. Only a confession changes the surface: deflection, bafflement and
  // standing firm all draw from ONE bank keyed by defense style, so the culprit
  // sounds exactly like a shaken honest guest (the anti-meta-tell rule).
  let press: PressOutcome
  if (cls === 'concealer' && truth.roles[c] === 'thief') {
    press = {
      kind: 'confess',
      claims: [
        { kind: 'role', role: 'thief' },
        { kind: 'whereabouts', room: truth.locations[c], companions: truth.companions[c] },
        { kind: 'relationship', subject: c, rel: myRel },
      ],
      lineKey: 'press.confess',
    }
  } else if (cls === 'concealer') {
    press = { kind: 'deflect', claims: [], lineKey: 'press.hold' }
  } else if (cls === 'unreliable') {
    press = { kind: 'baffled', claims: [], lineKey: 'press.hold' }
  } else {
    press = { kind: 'standFirm', claims: [], lineKey: 'press.hold' }
  }

  return { reaction, role, alibi, knowledge: knowledgeAnswers, suspect, aboutPerson, aboutEvidence, press }
}

export function passesSanity(mystery: Mystery): boolean {
  const { cast, truth, policies } = mystery
  for (const m of cast) {
    const cls = truthClassOf(truth.roles[m.id])
    const policy = policies[m.id]
    const answers: Answer[] = [
      policy.reaction,
      ...policy.role,
      ...policy.alibi,
      ...policy.knowledge,
      policy.suspect,
      ...Object.values(policy.aboutPerson),
      ...Object.values(policy.aboutEvidence),
    ]
    for (const answer of answers) {
      for (const claim of answer.claims) {
        const truthy = claimIsTrue(claim, m.id, truth, cast)
        if (truthy === null) continue
        if (cls === 'honest' && !truthy) return false
        if (cls === 'unreliable') {
          const infoKind =
            claim.kind === 'role' ||
            claim.kind === 'culpritAttr' ||
            claim.kind === 'alignment' ||
            claim.kind === 'glimpse'
          if (!infoKind && !truthy) return false
        }
        if (cls === 'concealer' && truthy) {
          const culprit = truth.roles.indexOf('culprit')
          const incriminating =
            claim.kind === 'culpritAttr' ||
            claim.kind === 'glimpse' ||
            (claim.kind === 'sighting' && claim.target === culprit && claim.room === truth.sceneRoom) ||
            (claim.kind === 'alignment' && claim.target === culprit && claim.alignment === 'evil') ||
            (claim.kind === 'relationship' && claim.subject === culprit && isMotiveGrade(claim.rel))
          if (incriminating) return false
        }
      }
    }
  }
  return true
}

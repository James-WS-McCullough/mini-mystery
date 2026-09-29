// Statement policies: what each character will SAY. Honest characters speak
// their knowledge; concealers deploy their cover story and planned lies; the
// drunk sincerely repeats their corrupted information. Every character gets an
// answer for every question — no statement-count tells.

import { claimIsTrue } from './claims'
import { liesAboutRole, liesAboutWhereabouts, truthClassOf } from './deck'
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
import { INFO_CLAIMS, MOTIVE_GRADE, attrMatches, isMotiveGrade, neighbours, seatParity } from './types'

/** Corrupted info for the Drunk: sincere, wrong, and never a reliable-class claim. */
export function corruptedInfo(
  rng: Rng,
  believed: RoleId,
  cast: CastMember[],
  roles: RoleId[],
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
    case 'sleuth':
      return { kind: 'among', suspects: shortlist(rng, cast, [drunk, culprit]) }
    case 'steward':
      return { kind: 'liarsBeside', count: wrongCount(rng, roles, drunk) }
    default: {
      const innocents = cast.map((m) => m.id).filter((c) => c !== drunk && c !== culprit)
      return rng.chance(0.5)
        ? { kind: 'alignment', target: rng.pick(innocents), alignment: 'evil' }
        : { kind: 'alignment', target: culprit, alignment: 'good' }
    }
  }
}

/** How many of the two beside them are lying about the hour — got wrong. */
function wrongCount(rng: Rng, roles: RoleId[], speaker: CharId): number {
  const truly = neighbours(speaker, roles.length).filter((c) => liesAboutWhereabouts(roles[c])).length
  return rng.pick([0, 1, 2].filter((k) => k !== truly))
}

/** Three of the household, in seat order, none of them from `without`. */
function shortlist(rng: Rng, cast: CastMember[], without: CharId[]): CharId[] {
  const pool = cast.map((m) => m.id).filter((c) => !without.includes(c))
  return rng.sample(pool, 3).sort((a, b) => a - b)
}

/** A concealer's fabricated role-power info. Must never truthfully incriminate the culprit. */
export function fabricateInfo(
  rng: Rng,
  cover: RoleId,
  cast: CastMember[],
  roles: RoleId[],
  relationships: Relationship[],
  speaker: CharId,
  culprit: CharId,
  sceneRoom: RoomId,
  /** Per CharId: the motives that person could have. A lie is a likely story. */
  fitting: Relationship[][] = cast.map(() => [...MOTIVE_GRADE]),
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
    case 'sleuth':
      // Three names, none of them the murderer's — nor the speaker's own.
      return { kind: 'among', suspects: shortlist(rng, cast, [speaker, culprit]) }
    case 'steward':
      return { kind: 'liarsBeside', count: wrongCount(rng, roles, speaker) }
    case 'gossip': {
      // Invented dirt: a false motive pinned on an innocent.
      const subjects = cast
        .map((m) => m.id)
        .filter((c) => c !== speaker && c !== culprit && !isMotiveGrade(relationships[c]))
      if (subjects.length === 0) return null
      const subject = rng.pick(subjects)
      const fakeRels = fitting[subject].filter((r) => r !== relationships[subject])
      if (fakeRels.length === 0) return null
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
  /** Where those who lie about the hour say they were, and with whom. */
  lies: Map<CharId, { room: RoomId; companions: CharId[] }>
  suspicionTarget: Map<CharId, CharId>
  docReferralHolder: CharId
  docRoom: RoomId
  weaponReferralHolder: CharId
  weaponRoom: RoomId
  quarrelHearer: CharId
}

export function buildPolicy(c: CharId, ctx: PolicyContext): Policy {
  const { cast, truth, evidence, knowledge, coverRoles, fabricated, lies, suspicionTarget } = ctx
  const me = cast[c]
  const cls = truthClassOf(truth.roles[c])
  const myRole = truth.roles[c]
  const liesRole = liesAboutRole(myRole)
  const liesWhere = liesAboutWhereabouts(myRole)
  const twoStep = me.strategy === 'evasive' || me.strategy === 'reticent'

  // Role claim: cover for concealers, sincere belief for the drunk, truth otherwise.
  const claimedRole: RoleId = liesRole
    ? coverRoles.get(c)!
    : cls === 'unreliable'
      ? truth.drunkBelievedRole!
      : truth.roles[c]
  const roleClaim: Claim = { kind: 'role', role: claimedRole }

  // Whereabouts: the lie or the truth.
  const trueWhere: Claim = {
    kind: 'whereabouts',
    room: truth.locations[c],
    companions: truth.companions[c],
  }
  const whereClaim: Claim = liesWhere ? { kind: 'whereabouts', ...lies.get(c)! } : trueWhere

  // What they'll offer under "what do you know?".
  const fab = fabricated.get(c)
  const infoClaims: Claim[] = liesRole ? (fab ? [fab] : []) : [...knowledge[c]]

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

  const alibi: Answer[] = myRole === 'amnesiac'
    ? // The hour is gone from them. Only the room itself can give it back.
      [{ claims: [], lineKey: 'alibi.forgot' }]
    : [
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
    gives: evidence.filter((e) => e.heldBy === c).map((e) => e.id),
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
    if (!liesWhere && myRole !== 'amnesiac' && truth.companions[c].includes(other.id)) {
      material.push({ kind: 'sighting', target: other.id, room: truth.locations[c] })
    }
    if (!liesRole) {
      for (const k of knowledge[c]) {
        if (k.kind === 'blackmailed' && k.by === other.id) material.push(k)
        if (k.kind === 'sighting' && k.target === other.id) material.push(k)
        if (k.kind === 'earlier' && k.target === other.id) material.push(k)
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
            !liesAboutRole(truth.roles[d]) &&
            !liesAboutWhereabouts(truth.roles[d]) &&
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
    liesRole && isMotiveGrade(myRel)
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
      case 'trace': {
        // Whoever truly left it owns to it, and says again where they were.
        // Everyone else — guilty or not — can only say it is not theirs.
        const mine =
          !liesWhere &&
          truth.roles[c] !== 'loner' &&
          truth.locations[c] === item.fact.room &&
          truth.companions[c].length === 0 &&
          attrMatches(item.fact.attr, me)
        aboutEvidence[item.id] = mine
          ? { claims: [trueWhere], lineKey: 'evidence.trace.own' }
          : attrMatches(item.fact.attr, me)
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
            liesRole && isMotiveGrade(myRel)
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
  if (myRole === 'sweetheart') {
    // Nothing worse than a secret: where they were, and with whom.
    press = {
      kind: 'confess',
      claims: [{ kind: 'role', role: 'sweetheart' }, trueWhere],
      lineKey: 'press.confess',
    }
  } else if (myRole === 'blackmailer') {
    press = {
      kind: 'confess',
      claims: [{ kind: 'role', role: 'blackmailer' }, { kind: 'relationship', subject: c, rel: myRel }],
      lineKey: 'press.confess',
    }
  } else if (cls === 'concealer' && truth.roles[c] === 'thief') {
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
        if (cls === 'unreliable' && !INFO_CLAIMS.has(claim.kind) && !truthy) return false
        if (cls === 'secretive' && claim.kind !== 'whereabouts' && !truthy) return false
        if (
          cls === 'masked' &&
          !INFO_CLAIMS.has(claim.kind) &&
          claim.kind !== 'relationship' &&
          !truthy
        ) {
          return false
        }
        if ((cls === 'concealer' || cls === 'masked') && truthy) {
          const culprit = truth.roles.indexOf('culprit')
          const incriminating =
            claim.kind === 'culpritAttr' ||
            claim.kind === 'among' ||
            claim.kind === 'liarsBeside' ||
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

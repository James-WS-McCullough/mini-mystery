// Statement policies: what each character will SAY. Honest characters speak
// their knowledge; concealers deploy their cover story and planned lies; the
// drunk sincerely repeats their corrupted information. Every character gets an
// answer for every question — no statement-count tells.

import { claimIsTrue } from './claims'
import { liesAboutRole, liesAboutWhereabouts, truthClassOf } from './deck'
import { INFO } from './info'
import { pressOf, tell } from './parts'
import { Rng } from './rng'
import type {
  Answer,
  CastMember,
  CharId,
  Claim,
  EvidenceItem,
  GroundTruth,
  Guest,
  TrueAccount,
  Mystery,
  Policy,
  PressOutcome,
  Relationship,
  RoleId,
  RoomId,
} from './types'
import { INFO_CLAIMS, MOTIVE_GRADE, attrMatches, isMotiveGrade } from './types'

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
  /** On a night with a passage: where it might run, where it does, and whether the murderer went by it. */
  passage?: { rooms: RoomId[]; truly: RoomId; used: boolean },
  /** Who was truly in the corridor after, if anybody was seen there. */
  corridor: CharId | null = null,
  /** The rooms, which of them somebody truly spent the hour in (for the Porter's part), and where each guest was (the Spinster's). */
  rooms?: { all: RoomId[]; used: ReadonlySet<RoomId>; at?: readonly RoomId[] },
): Claim | null {
  // (A part with nothing of its own to tell passes, falsely, for a Confidant's word.)
  const part = INFO[cover] ?? INFO.confidant!
  return part.fabricate({ rng, cast, roles, relationships, speaker, culprit, sceneRoom, fitting, passage, corridor, rooms })
}

export interface PolicyContext {
  cast: CastMember[]
  truth: GroundTruth
  evidence: EvidenceItem[]
  knowledge: Claim[][]
  /** What they happened to see or hear: not their role's, and told only when asked what they have seen. */
  incidental: ReadonlySet<Claim>
  coverRoles: Map<CharId, RoleId>
  fabricated: Map<CharId, Claim>
  /** Where those who lie about the hour say they were, and with whom. */
  lies: Map<CharId, { room: RoomId; companions: CharId[] }>
  suspicionTarget: Map<CharId, CharId>
  /** What an honest guest knows against the one they suspect. */
  grounds?: Map<CharId, Claim[]>
  /** Whom those with nobody to suspect feel sure of. */
  trusts?: Map<CharId, CharId>
  docReferralHolder: CharId
  docRoom: RoomId
  weaponReferralHolder: CharId
  weaponRoom: RoomId
  quarrelHearer: CharId
  /** Who stands up at the last and says it was them. */
  confessors?: ReadonlySet<CharId>
  /** The Sponsor's doing: who was paid, by whom, and what they are keeping back. */
  bribe?: { to: CharId; by: CharId; withheld: Claim[] }
  /** The Whisperer's: who is repeating the story, and whose story it is. */
  whisper?: { to: CharId; by: CharId }
  /**
   * The murderer's part when pressed: the Red Herring's ("I looked in, and he
   * was alive"), the Thief's ("I was robbing the box in that room"), or the
   * Blackmailer's ("I have been bleeding half the house") — a lesser guilt,
   * owned to, that would explain the lie. Each has its tell.
   */
  act?: 'herring' | 'thief' | 'blackmailer' | 'clinger'
  /** The one the Sweetheart was with: honest in all but this, they say they were alone. */
  sweetheartOf?: CharId
  /** The kind soul who swears the Clinger was with them: honest in all but this. */
  clingerOf?: CharId
  /** Whom they swear to: the Clinger, or the Cunning Murderer playing the part. */
  clung?: CharId
  /** Where the murderer playing the Clinger says, when pressed, they truly were: a room with nothing of theirs in it. */
  fallback?: RoomId
  /**
   * Who has seen the key to the locked room, and says so when asked what they
   * have seen: where it lies, or who picked it up.
   */
  keyHint?: { by: CharId; locked: RoomId; room?: RoomId; holder?: CharId }
}

/**
 * A guest's night, as it truly was and as they will tell it: who they are,
 * where they were and with whom, how they stood with him, and what they know
 * (or say they do). The answers to every question are drawn from these.
 */
export function accountOf(c: CharId, ctx: PolicyContext): Guest {
  const { truth, knowledge, incidental } = ctx
  const truly: TrueAccount = {
    role: truth.roles[c],
    where: { room: truth.locations[c], companions: truth.companions[c] },
    standing: truth.relationships[c],
    knows: knowledge[c],
    byChance: knowledge[c].filter((k) => incidental.has(k)),
  }
  // As they tell it: their part's telling, and whatever somebody else's story made of it.
  return { id: c, truth: truly, told: tell(c, ctx, truly) }
}

export function buildPolicy(c: CharId, ctx: PolicyContext, guest: Guest = accountOf(c, ctx)): Policy {
  const { cast, truth, evidence, knowledge, suspicionTarget } = ctx
  const me = cast[c]
  const myRole = truth.roles[c]
  const liesRole = liesAboutRole(myRole)
  const liesWhere = liesAboutWhereabouts(myRole)
  // The quiet: a vague word for who they are and what they know, until shown
  // something that touches them. Only where something does — a guest nothing
  // in the house concerns has no reason to hold back.
  const opens = evidence.filter((item) => concerns(item, me, c)).map((item) => item.id)
  const twoStep = (me.strategy === 'evasive' || me.strategy === 'reticent') && opens.length > 0

  const { told } = guest
  const roleClaim: Claim = { kind: 'role', role: told.role }
  const trueWhere: Claim = { kind: 'whereabouts', ...guest.truth.where }
  const whereClaim: Claim | null = told.where && { kind: 'whereabouts', ...told.where }
  const infoClaims = told.knows
  const seenClaims = told.saw

  // Reaction: the free opener. Routing hooks surface here.
  const heard = knowledge[c].find((k): k is Claim & { kind: 'heard' } => k.kind === 'heard')
  const fingerPointer = me.strategy === 'accuser' || me.strategy === 'deflector'
  let reaction: Answer
  if (c === ctx.weaponReferralHolder) {
    // A room that is not as it should be comes before anything else they have to say.
    reaction = {
      claims: [],
      lineKey: 'reaction.weaponhint',
      slots: { room: ctx.weaponRoom },
      refer: { room: ctx.weaponRoom },
    }
  } else if (heard) {
    // The crash has its own opener; whatever the afternoon held is "what I overheard".
    reaction = {
      claims: [heard],
      lineKey: heard.sound === 'crash' ? 'reaction.heard.crash' : 'reaction.overheard',
    }
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
  } else {
    reaction = { claims: [], lineKey: 'reaction.plain' }
  }

  const vague = (lineKey: string): Answer => ({ claims: [], lineKey })

  const role: Answer[] = twoStep
    ? [vague('role.vague'), { claims: [roleClaim], lineKey: 'role.claim' }]
    : [{ claims: [roleClaim], lineKey: 'role.claim' }]

  const alibi: Answer[] = told.where === null
    ? // The hour is gone from them. Only the room itself can give it back.
      [{ claims: [], lineKey: 'alibi.forgot' }]
    : [{ claims: [whereClaim!], lineKey: told.where.companions.length > 0 ? 'alibi.company' : 'alibi.alone' }]

  const bought = ctx.bribe?.to === c
  const knowledgeFull: Answer = bought
    ? // Paid to say nothing: who they are, and not a word of what they know by it.
      { claims: [roleClaim, ...infoClaims], lineKey: 'knowledge.silent' }
    : {
        claims: [roleClaim, ...infoClaims],
        gives: evidence.filter((e) => e.heldBy === c).map((e) => e.id),
        lineKey:
          me.strategy === 'hedger' || me.strategy === 'theorist' ? 'knowledge.hedged' : 'knowledge.share',
      }
  if (bought) {
    // Nothing to point at, either.
  } else if (c === ctx.docReferralHolder) {
    // "His lordship spent the afternoon writing…" — routes to the motive document.
    knowledgeFull.refer = { room: ctx.docRoom }
    knowledgeFull.slots = { ...knowledgeFull.slots, room: ctx.docRoom }
  } else if (c === ctx.weaponReferralHolder) {
    // "Something in that room is not as it should be…" — routes to the weapon.
    knowledgeFull.refer = { room: ctx.weaponRoom }
    knowledgeFull.slots = { ...knowledgeFull.slots, room: ctx.weaponRoom }
  }
  const knowledgeAnswers: Answer[] = twoStep ? [vague('knowledge.vague'), knowledgeFull] : [knowledgeFull]

  // "You're looking for the key to the study? I saw it in the ballroom."
  const hint = ctx.keyHint?.by === c ? ctx.keyHint : undefined
  const keyAnswer: Answer | null = !hint
    ? null
    : hint.holder !== undefined
      ? { claims: [], lineKey: 'seen.key.held', slots: { locked: hint.locked }, refer: { person: hint.holder } }
      : { claims: [], lineKey: 'seen.key', slots: { locked: hint.locked, room: hint.room! }, refer: { room: hint.room! } }
  const seen: Answer =
    seenClaims.length > 0
      ? { claims: seenClaims, lineKey: 'seen.share', ...(keyAnswer ? { also: keyAnswer } : {}) }
      : (keyAnswer ?? { claims: [], lineKey: 'seen.nothing' })

  // Whom they suspect, and whatever they truly know of that person.
  let suspect: Answer
  if (suspicionTarget.has(c)) {
    const target = suspicionTarget.get(c)!
    const hedged = me.strategy === 'hedger' || me.strategy === 'theorist'
    const material: Claim[] = liesRole
      ? []
      : knowledge[c].filter(
          (k) =>
            ((k.kind === 'sighting' || k.kind === 'earlier' || k.kind === 'passing') && k.target === target) ||
            // (What they know of the one they suspect, and only what tells against them.)
            (k.kind === 'relationship' && k.subject === target && k.rel !== 'cordial' && k.rel !== 'devoted') ||
            (k.kind === 'alignment' && k.target === target && k.alignment === 'evil') ||
            (k.kind === 'blackmailed' && k.by === target),
        )
    suspect = {
      // (Said once, however many ways they came to know it.)
      claims: (
        [{ kind: 'suspicion', target }, ...material, ...(liesRole ? [] : (ctx.grounds?.get(c) ?? []))] as Claim[]
      ).filter((k, i, all) => all.findIndex((o) => JSON.stringify(o) === JSON.stringify(k)) === i),
      lineKey: hedged ? 'suspect.hedge' : 'suspect.point',
      slots: { target: cast[target].shortName },
    }
  } else {
    // No name for the detective — but somebody they would answer for. It is a
    // feeling and no more: as likely to be wrong as any other.
    const sure = ctx.trusts?.get(c) ?? cast.map((m) => m.id).find((o) => o !== c)!
    suspect = {
      claims: [{ kind: 'trust', target: sure }],
      lineKey: 'suspect.vouch',
      slots: { target: cast[sure].shortName },
    }
  }

  // There is no asking them about one another: what they know of the others
  // they tell when asked their role, what they have seen, and whom they suspect.
  const aboutPerson: Record<string, Answer> = {}
  // About the victim: the relationship self-report (the motive lie lives here).
  const myRel = guest.truth.standing
  /** Whether they hide a grudge (see accountOf). */
  const hidesGrudge = told.standing !== myRel
  const victimClaims: Claim[] = [{ kind: 'relationship', subject: c, rel: told.standing }]
  if (c === ctx.quarrelHearer) {
    for (const k of knowledge[c]) {
      if (k.kind === 'heard' && k.sound !== 'crash') victimClaims.push(k)
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
          // (The murderer who went by the passage was truly there, and says so.)
          (!liesWhere || (myRole === 'murderer' && truth.passage?.used === true)) &&
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
      case 'lockboxIntact':
        aboutEvidence[item.id] = { claims: [], lineKey: 'evidence.lockbox.intact' }
        break
      case 'sceneCleared':
        aboutEvidence[item.id] = { claims: [], lineKey: 'evidence.bare' }
        break
      case 'ashes':
        aboutEvidence[item.id] = { claims: [], lineKey: 'evidence.ashes' }
        break
      case 'passage':
        aboutEvidence[item.id] = { claims: [], lineKey: 'evidence.passage' }
        break
      case 'killed':
        aboutEvidence[item.id] = { claims: [], lineKey: 'evidence.killed' }
        break
      case 'secondTrace':
        // Nobody owns to it: it is the murderer's.
        aboutEvidence[item.id] = attrMatches(item.fact.attr, me)
          ? { claims: [], lineKey: 'evidence.deny' }
          : { claims: [], lineKey: 'evidence.identify' }
        break
      case 'bribe':
        // Whoever it was meant for knows nothing about it — until pressed.
        aboutEvidence[item.id] =
          item.fact.to === c
            ? { claims: [], lineKey: 'evidence.deny' }
            : { claims: [], lineKey: 'evidence.bribe' }
        break
      case 'motiveDocument': {
        const docSubject = item.fact.subject
        if (docSubject === c) {
          aboutEvidence[item.id] =
            hidesGrudge
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
      case 'suicideNote':
        aboutEvidence[item.id] = { claims: [], lineKey: 'evidence.note' }
        break
      case 'key':
        aboutEvidence[item.id] = { claims: [], lineKey: 'evidence.key', slots: { locked: item.fact.room } }
        break
      case 'handSample':
        aboutEvidence[item.id] = { claims: [], lineKey: 'evidence.hand' }
        break
      case 'flavor':
        aboutEvidence[item.id] = { claims: [], lineKey: 'evidence.flavor' }
        break
    }
  }

  // Press. Only a confession changes the surface: deflection, bafflement and
  // standing firm all draw from ONE bank keyed by defense style, so the culprit
  // sounds exactly like a shaken honest guest (the anti-meta-tell rule).
  const press: PressOutcome = pressOf(c, ctx, guest)

  const confession: Answer | undefined = ctx.confessors?.has(c)
    ? { claims: [{ kind: 'confession' }], lineKey: 'confession' }
    : undefined

  return {
    reaction,
    role,
    alibi,
    knowledge: knowledgeAnswers,
    seen,
    suspect,
    aboutPerson,
    aboutEvidence,
    press,
    ...(confession ? { confession } : {}),
    ...(twoStep ? { opens } : {}),
  }
}

/** Does this exhibit touch them: would being shown it loosen a quiet tongue? */
export function concerns(item: EvidenceItem, me: CastMember, c: CharId): boolean {
  const fact = item.fact
  switch (fact.kind) {
    case 'trace':
    case 'secondTrace':
      return attrMatches(fact.attr, me)
    case 'weapon':
      return me.means.includes(fact.means)
    case 'motiveDocument':
      return fact.subject === c
    case 'bribe':
      return fact.to === c
    default:
      return false
  }
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
      policy.seen,
      policy.suspect,
      ...Object.values(policy.aboutPerson),
      ...Object.values(policy.aboutEvidence),
    ]
    for (const answer of answers) {
      for (const claim of answer.claims) {
        const truthy = claimIsTrue(claim, m.id, truth, cast)
        if (truthy === null) continue
        // What the Whisperer put in an honest mouth is false, and honestly said.
        if (m.id === truth.whispered && claim.kind === 'sighting' && cls === 'honest') continue
        // The one the Sweetheart was with says they were alone: the one lie they tell.
        if (m.id === truth.sweetheartOf && claim.kind === 'whereabouts') continue
        // And the one who swears the Clinger was with them: the one lie they tell.
        if (m.id === truth.clingerOf && claim.kind === 'whereabouts') continue
        if (cls === 'honest' && !truthy) return false
        if (cls === 'unreliable' && !INFO_CLAIMS.has(claim.kind) && !truthy) return false
        if (
          cls === 'masked' &&
          !INFO_CLAIMS.has(claim.kind) &&
          claim.kind !== 'relationship' &&
          !truthy
        ) {
          return false
        }
        if ((cls === 'concealer' || cls === 'masked') && truthy) {
          const culprit = truth.roles.indexOf('murderer')
          // (The Careful Murderer tells truly what the part they claim would
          // know of others, and owns to their own grudge.)
          const careful = m.id === culprit && truth.murderer === 'careful'
          const incriminating =
            claim.kind === 'culpritAttr' ||
            claim.kind === 'among' ||
            (claim.kind === 'liarsAmong' && !careful) ||
            claim.kind === 'glimpse' ||
            (claim.kind === 'sighting' && claim.target === culprit && claim.room === truth.sceneRoom) ||
            (claim.kind === 'alignment' && claim.target === culprit && claim.alignment === 'evil') ||
            (claim.kind === 'relationship' && claim.subject === culprit && isMotiveGrade(claim.rel) && !careful)
          if (incriminating) return false
        }
      }
    }
  }
  return true
}

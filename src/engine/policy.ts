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
import { INFO_CLAIMS, MOTIVE_GRADE, attrMatches, isMotiveGrade, otherSex, type Sex } from './types'

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
  const wrongTraits = [...new Set(cast.map((m) => m.trait))].filter((t) => culprit < 0 || t !== cast[culprit].trait)
  switch (believed) {
    case 'witness':
      return { kind: 'glimpse', attr: { kind: 'trait', trait: rng.pick(wrongTraits) }, room: sceneRoom }
    case 'discoverer': {
      // A last word misheard.
      const wrong = wrongSex(cast, culprit)
      return wrong && rng.chance(0.5)
        ? { kind: 'culpritAttr', attr: { kind: 'sex', sex: wrong }, dying: true }
        : { kind: 'culpritAttr', attr: { kind: 'trait', trait: rng.pick(wrongTraits) }, dying: true }
    }
    case 'sleuth':
      return { kind: 'among', suspects: shortlist(rng, cast, [drunk, culprit]) }
    case 'steward':
      return wrongCount(rng, cast, roles, drunk)
    default: {
      // An innocent called guilty, or the murderer called innocent; and where
      // there is no murderer, nobody to call innocent wrongly.
      const innocents = cast.map((m) => m.id).filter((c) => c !== drunk && c !== culprit)
      return culprit < 0 || rng.chance(0.5)
        ? { kind: 'alignment', target: rng.pick(innocents), alignment: 'evil' }
        : { kind: 'alignment', target: culprit, alignment: 'good' }
    }
  }
}

/** Two of the household the Steward had an eye on: anybody but themselves. */
export function watched(rng: Rng, cast: CastMember[], speaker: CharId): [CharId, CharId] {
  const [a, b] = rng
    .sample(
      cast.map((m) => m.id).filter((c) => c !== speaker),
      2,
    )
    .sort((x, y) => x - y)
  return [a, b]
}

/** How many of two of the household are lying about the hour — got wrong. */
function wrongCount(rng: Rng, cast: CastMember[], roles: RoleId[], speaker: CharId): Claim {
  const pair = watched(rng, cast, speaker)
  const truly = pair.filter((c) => liesAboutWhereabouts(roles[c])).length
  return { kind: 'liarsAmong', pair, count: rng.pick([0, 1, 2].filter((k) => k !== truly)) }
}

/** The sex the murderer is not — if the murderer is a man or a woman, and there is one. */
function wrongSex(cast: CastMember[], culprit: CharId): Sex | null {
  if (culprit < 0) return null
  const theirs = cast[culprit].pronouns
  return theirs === 'they' ? null : otherSex(theirs)
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
  /** On a night with a passage: where it might run, where it does, and whether the murderer went by it. */
  passage?: { rooms: RoomId[]; truly: RoomId; used: boolean },
  /** Who was truly in the corridor after, if anybody was seen there. */
  corridor: CharId | null = null,
  /** The rooms, and which of them somebody truly spent the hour in (for the Porter's part). */
  rooms?: { all: RoomId[]; used: ReadonlySet<RoomId> },
): Claim | null {
  const safeTraits = [...new Set(cast.map((m) => m.trait))].filter(
    (t) => (culprit < 0 || t !== cast[culprit].trait) && t !== cast[speaker].trait,
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
    case 'discoverer': {
      // A last word invented: of the wrong sex, or a habit that is not the murderer's.
      const wrong = wrongSex(cast, culprit)
      if (wrong && (rng.chance(0.5) || safeTraits.length === 0)) {
        return { kind: 'culpritAttr', attr: { kind: 'sex', sex: wrong }, dying: true }
      }
      if (safeTraits.length === 0) return null
      return { kind: 'culpritAttr', attr: { kind: 'trait', trait: rng.pick(safeTraits) }, dying: true }
    }
    case 'oracle': {
      // Somebody passed in the corridor: anybody but the murderer — and not
      // whoever truly did, or the lie would happen to be true.
      const passed = cast.map((m) => m.id).filter((c) => c !== speaker && c !== culprit && c !== corridor)
      if (passed.length === 0) return null
      return { kind: 'passing', target: rng.pick(passed) }
    }
    case 'sleuth':
      // Three names, none of them the murderer's — nor the speaker's own.
      return { kind: 'among', suspects: shortlist(rng, cast, [speaker, culprit]) }
    case 'steward':
      return wrongCount(rng, cast, roles, speaker)
    case 'porter': {
      // A room said to have stood empty that was in use, or the other way about.
      const choices = (rooms?.all ?? []).filter((r) => r !== sceneRoom)
      if (choices.length === 0) return null
      const room = rng.pick(choices)
      return { kind: 'roomState', room, occupied: !rooms!.used.has(room) }
    }
    case 'architect': {
      // A passage, and to the wrong room.
      const wrong = (passage?.rooms ?? []).filter((r) => r !== passage?.truly)
      if (wrong.length === 0) return null
      return { kind: 'passage', room: rng.pick(wrong) }
    }
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
  act?: 'herring' | 'thief' | 'blackmailer'
  /** The one the Sweetheart was with: honest in all but this, they say they were alone. */
  sweetheartOf?: CharId
  /**
   * Who has seen the key to the locked room, and says so when asked what they
   * have seen: where it lies, or who picked it up.
   */
  keyHint?: { by: CharId; locked: RoomId; room?: RoomId; holder?: CharId }
}

export function buildPolicy(c: CharId, ctx: PolicyContext): Policy {
  const { cast, truth, evidence, knowledge, incidental, coverRoles, fabricated, lies, suspicionTarget } = ctx
  const me = cast[c]
  const cls = truthClassOf(truth.roles[c])
  const myRole = truth.roles[c]
  const liesRole = liesAboutRole(myRole)
  const liesWhere = liesAboutWhereabouts(myRole)
  // The quiet: a vague word for who they are and what they know, until shown
  // something that touches them. Only where something does — a guest nothing
  // in the house concerns has no reason to hold back.
  const opens = evidence.filter((item) => concerns(item, me, c)).map((item) => item.id)
  const twoStep = (me.strategy === 'evasive' || me.strategy === 'reticent') && opens.length > 0

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
  const hidesCompany = c === ctx.sweetheartOf
  const whereClaim: Claim = liesWhere
    ? { kind: 'whereabouts', ...lies.get(c)! }
    : hidesCompany
      ? { kind: 'whereabouts', room: truth.locations[c], companions: [] }
      : trueWhere

  // What they'll offer when asked their role: what the role tells them, and no more.
  const fab = fabricated.get(c)
  const infoClaims: Claim[] = liesRole
    ? fab
      ? [fab]
      : []
    : knowledge[c].filter((k) => !incidental.has(k))
  // And when asked what they have seen: whatever else came their way.
  const seenClaims: Claim[] = knowledge[c].filter((k) => incidental.has(k))

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

  const bought = ctx.bribe?.to === c
  const knowledgeFull: Answer = bought
    ? // Paid to say nothing: who they are, and not a word of what they know by it.
      { claims: [roleClaim, { kind: 'silent' }], lineKey: 'knowledge.silent' }
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
  const myRel = truth.relationships[c]
  // Whoever hides who they are hides their grudge too — all but the Careful
  // Murderer, who owns to it: it would be found out anyway, and a lie that a
  // paper gives away is just the attention they avoid.
  const hidesGrudge = liesRole && isMotiveGrade(myRel) && !(myRole === 'culprit' && truth.murderer === 'careful')
  const relClaim: Claim =
    hidesGrudge
      ? { kind: 'relationship', subject: c, rel: 'cordial' }
      : { kind: 'relationship', subject: c, rel: myRel }
  const victimClaims: Claim[] = [relClaim]
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
          (!liesWhere || (myRole === 'culprit' && truth.passage?.used === true)) &&
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
  let press: PressOutcome
  if (bought && ctx.bribe) {
    // Who paid — and then, at last, what they were paid not to say.
    press = {
      kind: 'recant',
      claims: [{ kind: 'bribed', by: ctx.bribe.by }, ...ctx.bribe.withheld],
      lineKey: 'press.bribed',
    }
  } else if (ctx.whisper?.to === c) {
    press = {
      kind: 'recant',
      claims: [{ kind: 'toldBy', by: ctx.whisper.by }],
      lineKey: 'press.recant',
    }
  } else if (myRole === 'sweetheart') {
    // Nothing worse than a secret: where they were, and with whom.
    press = {
      kind: 'confess',
      claims: [{ kind: 'role', role: 'sweetheart' }, trueWhere],
      lineKey: 'press.confess',
    }
  } else if (hidesCompany) {
    // The other half of the secret: not alone, after all.
    press = {
      kind: 'confess',
      claims: [trueWhere],
      lineKey: 'press.confess.company',
    }
  } else if (myRole === 'redherring' || (myRole === 'culprit' && ctx.act === 'herring')) {
    // "I looked in — for a minute, no more; he was alive. Then I went to <room>."
    // The Red Herring's room bears them out. The murderer's does not.
    press = {
      kind: 'confess',
      claims: [{ kind: 'role', role: 'redherring' }, whereClaim],
      lineKey: 'press.confess.herring',
      slots: { scene: truth.sceneRoom, room: whereClaim.room },
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
        { kind: 'theft', room: truth.locations[c] },
        { kind: 'whereabouts', room: truth.locations[c], companions: truth.companions[c] },
        { kind: 'relationship', subject: c, rel: myRel },
      ],
      lineKey: 'press.confess',
    }
  } else if (myRole === 'culprit' && ctx.act === 'thief' && whereClaim.kind === 'whereabouts') {
    // The double bluff: a lesser crime, owned to, in the room they lie about.
    // The box in that room was never forced — or the forced one is elsewhere.
    press = {
      kind: 'confess',
      claims: [{ kind: 'role', role: 'thief' }, { kind: 'theft', room: whereClaim.room }, whereClaim],
      lineKey: 'press.confess',
    }
  } else if (myRole === 'culprit' && ctx.act === 'blackmailer') {
    // The other double bluff. Nobody in the house will say they were bled by
    // them — and the Blackmailer says truly where they were, which this one cannot.
    press = {
      kind: 'confess',
      claims: [{ kind: 'role', role: 'blackmailer' }, { kind: 'relationship', subject: c, rel: 'cordial' }],
      lineKey: 'press.confess',
    }
  } else if (cls === 'concealer') {
    press = { kind: 'deflect', claims: [], lineKey: 'press.hold' }
  } else if (cls === 'unreliable') {
    press = { kind: 'baffled', claims: [], lineKey: 'press.hold' }
  } else {
    press = { kind: 'standFirm', claims: [], lineKey: 'press.hold' }
  }

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

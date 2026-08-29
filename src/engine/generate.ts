// Constructive mystery generation. Builds ground truth deliberately (a
// witness-or-evidence chain toward the culprit, an exoneration chain per
// red herring, leads pointing at every required room), precomputes every
// character's complete statement policy, then GATES the result:
//   1. sanity     — honest claims true, lies false, no fabrication truthfully
//                   incriminates the culprit
//   2. uniqueness — the brute-force world enumerator, fed everything
//                   obtainable, agrees on exactly the true culprit
//   3. drama      — at least one discoverable contradiction implicates the
//                   culprit (Press material is guaranteed)
//   4. humanity   — the rule-based detective bot solves it within the round
//                   budget, following only leads and referrals
// Decks are drawn from a SCRIPT (culprit + two red herrings from the pool +
// innocents to fill); any failure resamples deck and all, so every shipped
// seed is a solvable night.

import type { SettingPack } from '../content/schema'
import { claimIsTrue } from './claims'
import { findContradictions, pressableChars, type NotedStatement } from './contradictions'
import { CLASSIC_SCRIPT, INFO_ROLES, buildDeck, truthClassOf, type Script } from './deck'
import { Rng } from './rng'
import { solveMystery } from './solver/deduce'
import { enumerateWorlds } from './solver/worlds'
import { OPPORTUNITY_BREAKS } from './verdict'
import type {
  Answer,
  AttrRef,
  CastMember,
  CharId,
  Claim,
  DefenseStyle,
  EvidenceItem,
  GameConfig,
  GroundTruth,
  Mystery,
  Policy,
  PressOutcome,
  Relationship,
  RoleId,
  RoomId,
  Spoken,
  Strategy,
  Temperament,
} from './types'
import { MOTIVE_GRADE, attrMatches, isMotiveGrade, seatParity } from './types'

const TEMPERAMENTS: Temperament[] = ['gracious', 'prickly', 'gossipy', 'reserved', 'dramatic']
const DEFENSES: DefenseStyle[] = ['indignant', 'flustered', 'calm', 'selfdoubting']
const CONCEALER_STRATEGIES: Strategy[] = ['bluffer', 'deflector', 'hedger', 'evasive']
const HONEST_STRATEGIES: Strategy[] = ['open', 'accuser', 'theorist', 'reticent']
/** Roles the Drunk can sincerely believe themself to be. Never 'gossip': the
 *  solver treats an unreliable speaker's relationship claims as true, so their
 *  corrupted info must live in the discounted claim kinds. */
const DRUNK_BELIEFS: readonly RoleId[] = ['witness', 'oracle', 'confidant']

export interface GenerateOptions {
  seed: number
  pack: SettingPack
  script?: Script
  config?: Partial<GameConfig>
}

export function generateMystery(opts: GenerateOptions): Mystery {
  for (let attempt = 0; attempt < 500; attempt++) {
    const rng = new Rng(`${opts.seed}:${attempt}`)
    const mystery = tryGenerate(rng, opts)
    if (mystery) return mystery
  }
  throw new Error(`could not generate a solvable mystery for seed ${opts.seed}`)
}

/** Every statement obtainable through play (all questions at full depth). */
export function allSpoken(mystery: Mystery): Spoken[] {
  const out: Spoken[] = []
  mystery.policies.forEach((policy, speaker) => {
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
      for (const claim of answer.claims) out.push({ speaker, claim })
    }
  })
  return out
}

function tryGenerate(rng: Rng, opts: GenerateOptions): Mystery | null {
  const pack = opts.pack
  const deck = buildDeck(rng, opts.script ?? CLASSIC_SCRIPT)
  const config: GameConfig = {
    castSize: deck.length,
    rounds: 4,
    questionsPerRound: 6,
    citeCap: 6,
    deck,
    ...opts.config,
  }
  const n = config.castSize

  // ---- cast & roles ----
  const defs = rng.sample(pack.characters, n)
  const roles = rng.shuffle(deck)
  const culprit = roles.indexOf('culprit')
  const thief = roles.indexOf('thief')
  const drunk = roles.indexOf('drunk')
  const begrudged = roles.indexOf('begrudged')
  const loner = roles.indexOf('loner')
  const witness = roles.indexOf('witness')
  const oracle = roles.indexOf('oracle')
  const confidant = roles.indexOf('confidant')
  const gossip = roles.indexOf('gossip')
  const alibiPair = roles.flatMap((r, i) => (r === 'alibi' ? [i] : []))

  const cast: CastMember[] = defs.map((d, i) => ({
    id: i,
    defId: d.id,
    name: d.name,
    shortName: d.shortName,
    title: d.title,
    portrait: d.portrait,
    pronouns: d.pronouns,
    trait: d.trait,
    means: [...d.means],
    seat: i + 1,
    temperament: rng.pick(TEMPERAMENTS),
    strategy: 'open',
    defense: rng.pick(DEFENSES),
  }))

  // The culprit's trait must be shared, or the scene trace would name them outright.
  if (cast.filter((m) => m.trait === cast[culprit].trait).length < 2) return null

  // ---- the method: means the culprit has, the begrudged lacks, others share ----
  const methodOptions = pack.methods.filter(
    (m) =>
      cast[culprit].means.includes(m.means) &&
      (begrudged < 0 || !cast[begrudged].means.includes(m.means)) &&
      cast.some((x) => x.id !== culprit && x.means.includes(m.means)),
  )
  if (methodOptions.length === 0) return null
  const method = rng.pick(methodOptions)

  const honestIds = cast.map((m) => m.id).filter((c) => truthClassOf(roles[c]) === 'honest')

  // ---- relationships to the victim ----
  const relationships: Relationship[] = new Array(n).fill('cordial')
  relationships[culprit] = rng.pick(MOTIVE_GRADE)
  if (begrudged >= 0) relationships[begrudged] = rng.pick(MOTIVE_GRADE)
  const thiefMotive = thief >= 0 && rng.chance(0.5)
  if (thief >= 0) relationships[thief] = thiefMotive ? rng.pick(MOTIVE_GRADE) : 'strained'
  // The loner's herring is opportunity, not motive: they stay benign.
  const strainCandidates = honestIds.filter((c) => c !== begrudged && c !== loner)
  if (strainCandidates.length > 0) relationships[rng.pick(strainCandidates)] = 'strained'
  const devotedCandidates = strainCandidates.filter((c) => relationships[c] === 'cordial')
  if (devotedCandidates.length > 0 && rng.chance(0.6)) {
    relationships[rng.pick(devotedCandidates)] = 'devoted'
  }

  // ---- geography: the murder window as one time slot ----
  const allRooms = pack.rooms.map((r) => r.id)
  const sceneRoom = rng.pick(pack.sceneRooms)
  const theftRoom = thief >= 0 ? rng.pick(pack.valuableRooms.filter((r) => r !== sceneRoom)) : null

  const locations: RoomId[] = new Array(n).fill('')
  const companions: CharId[][] = Array.from({ length: n }, () => [])
  locations[culprit] = sceneRoom
  if (thief >= 0 && theftRoom) locations[thief] = theftRoom

  const freeRooms = rng.shuffle(allRooms.filter((r) => r !== sceneRoom && r !== theftRoom))
  if (alibiPair.length > 0) {
    const alibiRoom = freeRooms.pop()
    if (!alibiRoom) return null
    for (const a of alibiPair) {
      locations[a] = alibiRoom
      companions[a] = alibiPair.filter((b) => b !== a)
    }
  }

  const floaters = cast
    .map((m) => m.id)
    .filter((c) => c !== culprit && c !== thief && !alibiPair.includes(c) && c !== loner)
  const floaterGroups: CharId[][] = []
  if (loner >= 0) floaterGroups.push([loner]) // the loner is always, definitionally, alone
  if (floaters.length >= 2 && rng.chance(0.5)) {
    const pair = rng.sample(floaters, 2)
    floaterGroups.push(pair)
    for (const f of floaters) if (!pair.includes(f)) floaterGroups.push([f])
  } else {
    for (const f of floaters) floaterGroups.push([f])
  }
  for (const group of floaterGroups) {
    const room = freeRooms.pop()
    if (!room) return null
    for (const g of group) {
      locations[g] = room
      companions[g] = group.filter((x) => x !== g)
    }
  }

  const quarrelCandidates = cast
    .map((m) => m.id)
    .filter((c) => isMotiveGrade(relationships[c]) || relationships[c] === 'strained')
  const quarrelParticipant = rng.chance(0.5) ? culprit : rng.pick(quarrelCandidates)

  const truth: GroundTruth = {
    roles,
    locations,
    companions,
    relationships,
    sceneRoom,
    methodId: method.id,
    methodMeans: method.means,
    theftRoom,
    quarrelParticipant,
    drunkBelievedRole: drunk >= 0 ? rng.pick(DRUNK_BELIEFS) : null,
  }

  // ---- physical evidence ----
  const traitDef = (id: string) => pack.traits.find((t) => t.id === id)
  const evidence: EvidenceItem[] = []
  evidence.push({
    id: 'trace',
    room: sceneRoom,
    name: traitDef(cast[culprit].trait)?.evidenceName ?? 'a telltale trace',
    fact: { kind: 'traceAtScene', attr: { kind: 'trait', trait: cast[culprit].trait } },
  })
  // The killer HID the weapon — it lies in another room, and an observant
  // member of the household points the way. (Placing it at the scene lets a
  // single search intersect trait × means and collapse the case.)
  const weaponRoom = rng.pick(allRooms.filter((r) => r !== sceneRoom))
  evidence.push({
    id: 'weapon',
    room: weaponRoom,
    name: method.weaponName,
    fact: { kind: 'weapon', means: method.means },
  })
  if (thief >= 0 && theftRoom) {
    evidence.push({
      id: 'lockbox',
      room: theftRoom,
      name: 'a lockbox with its hasp forced',
      fact: { kind: 'forcedLockbox', room: theftRoom },
    })
  }
  const docRoom = rng.pick(pack.docRooms)
  evidence.push({
    id: 'doc-motive',
    room: docRoom,
    name: pack.motiveItems[relationships[culprit]] ?? 'a compromising document',
    fact: { kind: 'motiveDocument', subject: culprit, rel: relationships[culprit] },
  })
  // A second motive document for a red herring with a grudge of their own.
  const herringDocSubject = begrudged >= 0 ? begrudged : thiefMotive ? thief : -1
  const herringRooms = pack.docRooms.filter((r) => r !== docRoom)
  if (herringDocSubject >= 0 && herringRooms.length > 0 && rng.chance(0.7)) {
    evidence.push({
      id: 'doc-herring',
      room: rng.pick(herringRooms),
      name: pack.motiveItems[relationships[herringDocSubject]] ?? 'a compromising document',
      fact: {
        kind: 'motiveDocument',
        subject: herringDocSubject,
        rel: relationships[herringDocSubject],
      },
    })
  }
  const evidencedRooms = new Set(evidence.map((e) => e.room))
  for (const room of rng.sample(allRooms.filter((r) => !evidencedRooms.has(r)), 2)) {
    evidence.push({ id: `flavor-${room}`, room, name: rng.pick(pack.flavorItems), fact: { kind: 'flavor' } })
  }

  // ---- knowledge: who truly knows what ----
  const knowledge: Claim[][] = Array.from({ length: n }, () => [])

  if (witness >= 0) {
    const full = rng.chance(0.35)
    knowledge[witness].push(
      full
        ? { kind: 'sighting', target: culprit, room: sceneRoom }
        : { kind: 'glimpse', attr: { kind: 'trait', trait: cast[culprit].trait }, room: sceneRoom },
    )
  }
  if (oracle >= 0) {
    const attr: AttrRef = rng.chance(0.7)
      ? { kind: 'parity', parity: seatParity(cast[culprit].seat) }
      : { kind: 'trait', trait: cast[culprit].trait }
    knowledge[oracle].push({ kind: 'culpritAttr', attr })
  }
  if (confidant >= 0) {
    // Biased toward exonerating whoever tonight's herrings are.
    const herringPresent = [thief, begrudged, loner, drunk].filter((x) => x >= 0)
    const roll = rng.next()
    let target: CharId
    if (herringPresent.length > 0 && roll < 0.4) target = rng.pick(herringPresent)
    else if (roll < 0.55) target = culprit
    else target = rng.pick(cast.map((m) => m.id).filter((c) => c !== confidant))
    knowledge[confidant].push({
      kind: 'alignment',
      target,
      alignment: roles[target] === 'culprit' ? 'evil' : 'good',
    })
  }
  // Sounds in the house: the theft's crash; the afternoon quarrel.
  let crashHearer = -1
  if (thief >= 0 && theftRoom) {
    crashHearer = rng.pick(honestIds)
    knowledge[crashHearer].push({ kind: 'heard', sound: 'crash', room: theftRoom })
  }
  // The quarrel and its meaning: the Gossip's power when present, else a
  // random honest guest overheard it.
  const quarrelHearer =
    gossip >= 0
      ? gossip
      : rng.pick(honestIds.filter((c) => c !== crashHearer && c !== quarrelParticipant))
  knowledge[quarrelHearer].push({ kind: 'heard', sound: 'quarrel', room: sceneRoom })
  knowledge[quarrelHearer].push({
    kind: 'relationship',
    subject: quarrelParticipant,
    rel: relationships[quarrelParticipant],
  })
  if (gossip >= 0) {
    // The gossip knows one more relationship besides the quarreller's.
    const others = cast
      .map((m) => m.id)
      .filter((c) => c !== gossip && c !== quarrelParticipant && c !== culprit)
    if (others.length > 0) {
      const subject = rng.pick(others)
      knowledge[gossip].push({ kind: 'relationship', subject, rel: relationships[subject] })
    }
  }
  // Incidental sightings (always true): the thief glimpsed near the theft;
  // someone corroborates an innocent. Nobody ever vouches for the loner.
  if (thief >= 0 && theftRoom && rng.chance(0.75)) {
    const seer = rng.pick(honestIds)
    knowledge[seer].push({ kind: 'sighting', target: thief, room: theftRoom })
  }
  if (rng.chance(0.5)) {
    const seer = rng.pick(honestIds)
    const targets = cast
      .map((m) => m.id)
      .filter(
        (c) =>
          c !== seer &&
          c !== culprit &&
          c !== thief &&
          c !== loner &&
          !companions[seer].includes(c),
      )
    if (targets.length > 0) {
      const target = rng.pick(targets)
      knowledge[seer].push({ kind: 'sighting', target, room: locations[target] })
    }
  }
  if (drunk >= 0 && truth.drunkBelievedRole) {
    knowledge[drunk].push(corruptedInfo(rng, truth.drunkBelievedRole, cast, culprit, drunk, sceneRoom))
  }
  const docReferralHolder = rng.pick(honestIds)
  const weaponReferralHolder = rng.pick(honestIds.filter((c) => c !== docReferralHolder))

  // ---- strategies, covers, lies ----
  for (const m of cast) {
    m.strategy =
      truthClassOf(roles[m.id]) === 'concealer'
        ? rng.pick(CONCEALER_STRATEGIES)
        : rng.pick(HONEST_STRATEGIES)
  }

  // Smart liars only claim roles the evening actually holds.
  const coverPool = rng.shuffle(INFO_ROLES.filter((r) => deck.includes(r)))
  if (coverPool.length === 0) return null
  const coverRoles = new Map<CharId, RoleId>()
  const fabricated = new Map<CharId, Claim>()
  const concealers = cast.map((m) => m.id).filter((c) => truthClassOf(roles[c]) === 'concealer')
  concealers.forEach((c, i) => {
    const cover = coverPool[i % coverPool.length]
    coverRoles.set(c, cover)
    const fab = fabricateInfo(rng, cover, cast, relationships, c, culprit, sceneRoom)
    if (!fab) return
    fabricated.set(c, fab)
  })
  if (concealers.some((c) => !fabricated.has(c))) return null

  const occupiedRooms = new Set(locations.filter((r) => r !== ''))
  const lieRooms = new Map<CharId, RoomId>()
  for (const c of concealers) {
    const emptyRooms = allRooms.filter((r) => !occupiedRooms.has(r))
    const occupiedOptions = allRooms.filter(
      (r) => occupiedRooms.has(r) && r !== sceneRoom && r !== theftRoom && r !== locations[c],
    )
    const pool = rng.chance(0.5) && occupiedOptions.length > 0 ? occupiedOptions : emptyRooms
    if (pool.length === 0) return null
    lieRooms.set(c, rng.pick(pool))
  }

  // Suspicion targets: accusers/deflectors point fingers; hedgers/theorists
  // name a lead suspect among their scenarios. Same surface, either alignment.
  const suspicionTarget = new Map<CharId, CharId>()
  for (const m of cast) {
    if (['accuser', 'deflector', 'hedger', 'theorist'].includes(m.strategy)) {
      suspicionTarget.set(m.id, rng.pick(cast.map((x) => x.id).filter((c) => c !== m.id)))
    }
  }

  // ---- statement policies ----
  const policies: Policy[] = cast.map((m) =>
    buildPolicy(m.id, {
      cast,
      truth,
      evidence,
      knowledge,
      coverRoles,
      fabricated,
      lieRooms,
      suspicionTarget,
      docReferralHolder,
      docRoom,
      weaponReferralHolder,
      weaponRoom,
      quarrelHearer,
    }),
  )

  const caseSheet = {
    deck,
    sceneRoom,
    victimName: pack.victim.name,
    windowLabel: pack.windowLabel,
    seats: cast.map((m) => m.seat),
  }

  const mystery: Mystery = {
    seed: opts.seed,
    settingId: pack.id,
    config,
    cast,
    caseSheet,
    truth,
    evidence,
    policies,
  }

  // ---- gates ----
  if (!passesSanity(mystery)) return null

  const spoken = allSpoken(mystery)
  const facts = evidence.map((e) => e.fact)
  const worlds = enumerateWorlds({ cast, caseSheet, spoken, evidence: facts })
  if (worlds.culprits.length !== 1 || worlds.culprits[0] !== culprit) return null
  if (!worlds.worlds.some((w) => w.every((r, i) => r === roles[i]))) {
    throw new Error(`seed ${opts.seed}: the true world is inconsistent — generation bug`)
  }

  const statements: NotedStatement[] = spoken.map((s, i) => ({
    id: `s${i}`,
    speaker: s.speaker,
    claim: s.claim,
  }))
  const contradictions = findContradictions(statements, evidence, caseSheet)
  if (!pressableChars(contradictions).has(culprit)) return null
  // The trio must be completable: some OPPORTUNITY-type contradiction breaks
  // the culprit's account of the window (means and motive are guaranteed by
  // the weapon and the motive document).
  if (
    !contradictions.some(
      (c) => OPPORTUNITY_BREAKS.has(c.reason) && c.implicated.includes(culprit),
    )
  ) {
    return null
  }

  // The bot must solve it — but not TOO fast, or the puzzle is trivial even
  // for a careful human. Rejecting quick collapses is the difficulty floor.
  const solution = solveMystery(mystery)
  if (!solution || solution.questionsUsed < 8) return null
  mystery.solution = solution

  return mystery
}

/** Corrupted info for the Drunk: sincere, wrong, and never a reliable-class claim. */
function corruptedInfo(
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
function fabricateInfo(
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

interface PolicyContext {
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

function buildPolicy(c: CharId, ctx: PolicyContext): Policy {
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

  // Press.
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
    press = { kind: 'deflect', claims: [], lineKey: 'press.deflect' }
  } else if (cls === 'unreliable') {
    press = { kind: 'baffled', claims: [], lineKey: 'press.baffled' }
  } else {
    press = { kind: 'standFirm', claims: [], lineKey: 'press.standfirm' }
  }

  return { reaction, role, alibi, knowledge: knowledgeAnswers, suspect, aboutPerson, aboutEvidence, press }
}

function passesSanity(mystery: Mystery): boolean {
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

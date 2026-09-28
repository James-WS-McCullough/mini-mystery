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
// innocents to fill). The deck is fixed per seed so herring distribution
// matches the draw; failed attempts resample everything else, and every
// shipped seed is a solvable night.

import type { SettingPack } from '../content/schema'
import { findContradictions, pressableChars, type NotedStatement } from './contradictions'
import { CLASSIC_SCRIPT, INFO_ROLES, buildDeck, truthClassOf, type Script } from './deck'
import { Rng } from './rng'
import { dealTraits } from './traits'
import { buildPolicy, corruptedInfo, fabricateInfo, passesSanity } from './policy'
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
  Relationship,
  RoleId,
  RoomId,
  Spoken,
  Strategy,
  Temperament,
} from './types'
import { MOTIVE_GRADE, isMotiveGrade, seatParity } from './types'

const TEMPERAMENTS: Temperament[] = ['gracious', 'prickly', 'gossipy', 'reserved', 'dramatic']
const DEFENSES: DefenseStyle[] = ['indignant', 'flustered', 'calm', 'selfdoubting']
const CONCEALER_STRATEGIES: Strategy[] = ['bluffer', 'deflector', 'hedger', 'evasive']
const HONEST_STRATEGIES: Strategy[] = ['open', 'accuser', 'theorist', 'reticent']
/** Roles the Drunk can sincerely believe themself to be. Never 'gossip': the
 *  solver treats an unreliable speaker's relationship claims as true, so their
 *  corrupted info must live in the discounted claim kinds. */
const DRUNK_BELIEFS: readonly RoleId[] = ['witness', 'oracle', 'confidant']

/** Why an attempt was rejected — for tuning probes, never for gameplay. */
export type GenFailure =
  | 'trait-share'
  | 'no-method'
  | 'rooms-exhausted'
  | 'cover-pool'
  | 'fabrication'
  | 'lie-room'
  | 'sanity'
  | 'not-unique'
  | 'no-press-material'
  | 'no-opportunity-break'
  | 'bot-unsolved'
  | 'too-easy'

export interface GenerateOptions {
  seed: number
  pack: SettingPack
  script?: Script
  config?: Partial<GameConfig>
  /** Diagnostics hook: called with the failure reason of each rejected attempt. */
  onAttempt?: (failure: GenFailure, deck: RoleId[]) => void
}

const MAX_ATTEMPTS = 500
/** Attempts that must respect the seed's drawn deck before redrawing is allowed. */
const FIXED_DECK_ATTEMPTS = 400

export function generateMystery(opts: GenerateOptions): Mystery {
  const script = opts.script ?? CLASSIC_SCRIPT
  // The deck is drawn ONCE per seed, so which herrings walk tonight matches
  // the draw's distribution — hard combinations get more attempts instead of
  // losing the race to easier decks. Only a truly stubborn seed redraws.
  const fixedDeck = buildDeck(new Rng(`${opts.seed}:deck`), script)
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const rng = new Rng(`${opts.seed}:${attempt}`)
    const deck = attempt < FIXED_DECK_ATTEMPTS ? fixedDeck : buildDeck(rng, script)
    const result = tryGenerate(rng, opts, deck)
    if (typeof result !== 'string') return result
    opts.onAttempt?.(result, deck)
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

function tryGenerate(rng: Rng, opts: GenerateOptions, deck: RoleId[]): Mystery | GenFailure {
  const pack = opts.pack
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
  // Traits are dealt from a stream of their own, knowing nothing of the roles.
  const traits = dealTraits(rng.fork('traits'), defs, pack.traits)

  const cast: CastMember[] = defs.map((d, i) => ({
    id: i,
    defId: d.id,
    name: d.name,
    shortName: d.shortName,
    title: d.title,
    portrait: d.portrait,
    pronouns: d.pronouns,
    trait: traits[i].trait,
    furtive: traits[i].furtive,
    means: [...d.means],
    seat: i + 1,
    temperament: rng.pick(TEMPERAMENTS),
    strategy: 'open',
    defense: rng.pick(DEFENSES),
  }))

  // The culprit's trait must be shared, or the scene trace would name them outright.
  if (cast.filter((m) => m.trait === cast[culprit].trait).length < 2) return 'trait-share'

  // ---- the method: means the culprit has, and at least one innocent shares ----
  const methodOptions = pack.methods.filter(
    (m) =>
      cast[culprit].means.includes(m.means) &&
      cast.some((x) => x.id !== culprit && x.means.includes(m.means)),
  )
  if (methodOptions.length === 0) return 'no-method'
  const method = rng.pick(methodOptions)

  // The begrudged must LACK the means (that is their card). If tonight's
  // begrudged happens to hold them, swap the card to a guest who doesn't,
  // rather than throwing the whole attempt away.
  const SWAPPABLE: RoleId[] = ['witness', 'oracle', 'confidant', 'gossip', 'loner']
  const begrudgedAt = roles.indexOf('begrudged')
  if (begrudgedAt >= 0 && cast[begrudgedAt].means.includes(method.means)) {
    const swapTargets = roles.flatMap((r, i) =>
      SWAPPABLE.includes(r) && !cast[i].means.includes(method.means) ? [i] : [],
    )
    if (swapTargets.length === 0) return 'no-method'
    const target = rng.pick(swapTargets)
    ;[roles[begrudgedAt], roles[target]] = [roles[target], roles[begrudgedAt]]
  }

  const thief = roles.indexOf('thief')
  const drunk = roles.indexOf('drunk')
  const begrudged = roles.indexOf('begrudged')
  const loner = roles.indexOf('loner')
  const witness = roles.indexOf('witness')
  const oracle = roles.indexOf('oracle')
  const confidant = roles.indexOf('confidant')
  const gossip = roles.indexOf('gossip')
  const alibiPair = roles.flatMap((r, i) => (r === 'alibi' ? [i] : []))
  /** With a single liar the world collapses fast — informants soften so the
   *  night keeps its length. */
  const singleLiar = thief < 0

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
    if (!alibiRoom) return 'rooms-exhausted'
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
    if (!room) return 'rooms-exhausted'
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
    // A full identification only on two-liar nights; otherwise a glimpse.
    const full = !singleLiar && rng.chance(0.35)
    knowledge[witness].push(
      full
        ? { kind: 'sighting', target: culprit, room: sceneRoom }
        : { kind: 'glimpse', attr: { kind: 'trait', trait: cast[culprit].trait }, room: sceneRoom },
    )
  }
  if (oracle >= 0) {
    const attr: AttrRef = rng.chance(singleLiar ? 0.85 : 0.7)
      ? { kind: 'parity', parity: seatParity(cast[culprit].seat) }
      : { kind: 'trait', trait: cast[culprit].trait }
    knowledge[oracle].push({ kind: 'culpritAttr', attr })
  }
  if (confidant >= 0) {
    // Biased toward exonerating whoever tonight's herrings are; never handed
    // the culprit outright on a single-liar night.
    const herringPresent = [thief, begrudged, loner, drunk].filter((x) => x >= 0)
    const roll = rng.next()
    let target: CharId
    if (herringPresent.length > 0 && roll < 0.4) target = rng.pick(herringPresent)
    else if (!singleLiar && roll < 0.55) target = culprit
    else target = rng.pick(cast.map((m) => m.id).filter((c) => c !== confidant && c !== culprit))
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
  if (rng.chance(singleLiar ? 0.3 : 0.5)) {
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
  if (coverPool.length === 0) return 'cover-pool'
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
  if (concealers.some((c) => !fabricated.has(c))) return 'fabrication'

  const occupiedRooms = new Set(locations.filter((r) => r !== ''))
  const lieRooms = new Map<CharId, RoomId>()
  for (const c of concealers) {
    const emptyRooms = allRooms.filter((r) => !occupiedRooms.has(r))
    const occupiedOptions = allRooms.filter(
      (r) => occupiedRooms.has(r) && r !== sceneRoom && r !== theftRoom && r !== locations[c],
    )
    // The culprit leans toward an occupied room: that collision is the
    // opportunity-breaking contradiction the accusation phase depends on.
    const occupiedChance = c === culprit ? 0.75 : 0.5
    const pool = rng.chance(occupiedChance) && occupiedOptions.length > 0 ? occupiedOptions : emptyRooms
    if (pool.length === 0) return 'lie-room'
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
  if (!passesSanity(mystery)) return 'sanity'

  const spoken = allSpoken(mystery)
  const facts = evidence.map((e) => e.fact)
  const worlds = enumerateWorlds({ cast, caseSheet, spoken, evidence: facts })
  if (worlds.culprits.length !== 1 || worlds.culprits[0] !== culprit) return 'not-unique'
  if (!worlds.worlds.some((w) => w.every((r, i) => r === roles[i]))) {
    throw new Error(`seed ${opts.seed}: the true world is inconsistent — generation bug`)
  }

  const statements: NotedStatement[] = spoken.map((s, i) => ({
    id: `s${i}`,
    speaker: s.speaker,
    claim: s.claim,
  }))
  const contradictions = findContradictions(statements, evidence, caseSheet)
  if (!pressableChars(contradictions).has(culprit)) return 'no-press-material'
  // The trio must be completable: some OPPORTUNITY-type contradiction breaks
  // the culprit's account of the window (means and motive are guaranteed by
  // the weapon and the motive document).
  if (
    !contradictions.some(
      (c) => OPPORTUNITY_BREAKS.has(c.reason) && c.implicated.includes(culprit),
    )
  ) {
    return 'no-opportunity-break'
  }

  // The bot must solve it — but not TOO fast, or the puzzle is trivial even
  // for a careful human. Rejecting quick collapses is the difficulty floor.
  const solution = solveMystery(mystery)
  if (!solution) return 'bot-unsolved'
  if (solution.questionsUsed < 8) return 'too-easy'
  mystery.solution = solution

  return mystery
}

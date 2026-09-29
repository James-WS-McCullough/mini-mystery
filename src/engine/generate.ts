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

import type { CharacterDef, SettingPack } from '../content/schema'
import { findContradictions, pressableChars, type NotedStatement } from './contradictions'
import {
  CLASSIC_SCRIPT,
  INFO_ROLES,
  buildDeck,
  isEvil,
  liesAboutRole,
  liesAboutWhereabouts,
  truthClassOf,
  type Script,
} from './deck'
import { Rng } from './rng'
import { dealMeans } from './means'
import { dealTraits } from './traits'
import { buildPolicy, corruptedInfo, fabricateInfo, passesSanity } from './policy'
import { solveMystery } from './solver/deduce'
import { enumerateWorlds, isConsistent } from './solver/worlds'
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
import { MOTIVE_GRADE, TEMPERAMENTS, isMotiveGrade, neighbours, seatParity } from './types'

const DEFENSES: DefenseStyle[] = ['indignant', 'flustered', 'calm', 'selfdoubting']
const CONCEALER_STRATEGIES: Strategy[] = ['bluffer', 'deflector', 'hedger', 'evasive']
const HONEST_STRATEGIES: Strategy[] = ['open', 'accuser', 'theorist', 'reticent']
/** Roles the Drunk can sincerely believe themself to be. Never 'gossip': the
 *  solver treats an unreliable speaker's relationship claims as true, so their
 *  corrupted info must live in the discounted claim kinds. */
const DRUNK_BELIEFS: readonly RoleId[] = ['witness', 'oracle', 'confidant', 'sleuth', 'steward']

/** Why an attempt was rejected — for tuning probes, never for gameplay. */
export type GenFailure =
  | 'trait-share'
  | 'no-method'
  | 'rooms-exhausted'
  | 'no-company'
  | 'cover-pool'
  | 'fabrication'
  | 'lie-room'
  | 'sanity'
  | 'not-unique'
  | 'no-press-material'
  | 'no-opportunity-break'
  | 'bot-unsolved'
  | 'too-easy'

/**
 * Tonight's way of talking: one of the manners that suit the character, and
 * never one that does not. Knows nothing of roles.
 */
function pickManner(rng: Rng, def: CharacterDef): Temperament {
  const weights = TEMPERAMENTS.map((t) => Math.max(0, def.manners?.[t] ?? 0))
  if (weights.every((w) => w === 0)) return rng.pick(TEMPERAMENTS)
  let roll = rng.next() * weights.reduce((a, b) => a + b, 0)
  let at = 0
  while (at < weights.length - 1 && roll >= weights[at]) {
    roll -= weights[at]
    at++
  }
  return TEMPERAMENTS[at]
}

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
  const script = opts.script ?? CLASSIC_SCRIPT
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
  // The method is one nearly anyone could have managed: it rules out one or
  // two guests, the begrudged (motive, but no means) always among them.
  if (pack.methods.length === 0) return 'no-method'
  const method = rng.pick(pack.methods)
  const means = dealMeans(rng.fork('means'), defs, pack.means, {
    method: method.means,
    culprit,
    mustLack: roles.flatMap((r, i) => (r === 'begrudged' ? [i] : [])),
  })

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
    means: means[i],
    seat: i + 1,
    temperament: pickManner(rng, d),
    strategy: 'open',
    defense: rng.pick(DEFENSES),
  }))

  // The culprit's trait must be shared, or the scene trace would name them outright.
  if (cast.filter((m) => m.trait === cast[culprit].trait).length < 2) return 'trait-share'

  const thief = roles.indexOf('thief')
  const drunk = roles.indexOf('drunk')
  const begrudged = roles.indexOf('begrudged')
  const loner = roles.indexOf('loner')
  const witness = roles.indexOf('witness')
  const oracle = roles.indexOf('oracle')
  const confidant = roles.indexOf('confidant')
  const gossip = roles.indexOf('gossip')
  const sleuth = roles.indexOf('sleuth')
  const redherring = roles.indexOf('redherring')
  const steward = roles.indexOf('steward')
  const companion = roles.indexOf('alibi')
  const accomplice = roles.indexOf('accomplice')
  const blackmailer = roles.indexOf('blackmailer')
  const amnesiac = roles.indexOf('amnesiac')
  const sweetheart = roles.indexOf('sweetheart')
  const collector = roles.indexOf('collector')
  const forger = roles.indexOf('forger')
  /** Whoever looks worse than they are tonight — and the Accomplice, who is. */
  const shadyIds = [thief, begrudged, loner, redherring, blackmailer, amnesiac, sweetheart, accomplice, forger, drunk].filter(
    (x) => x >= 0,
  )
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
  const together = (group: CharId[]): boolean => {
    const room = freeRooms.pop()
    if (!room) return false
    for (const g of group) {
      locations[g] = room
      companions[g] = group.filter((x) => x !== g)
    }
    return true
  }
  // The Companion spent the hour with somebody who has nothing to hide — and
  // a role of their own.
  const good = rng.shuffle(
    cast
      .map((m) => m.id)
      .filter(
        (c) =>
          c !== companion && c !== loner && c !== amnesiac && truthClassOf(roles[c]) === 'honest',
      ),
  )
  let companionOf = -1
  if (companion >= 0) {
    const other = good.pop()
    if (other === undefined) return 'no-company'
    companionOf = other
    if (!together([companion, companionOf])) return 'rooms-exhausted'
  }
  // The Sweetheart was with somebody too — who will say so, and be contradicted.
  let sweetheartOf = -1
  if (sweetheart >= 0) {
    const other = good.pop()
    if (other === undefined) return 'no-company'
    sweetheartOf = other
    if (!together([sweetheart, sweetheartOf])) return 'rooms-exhausted'
  }
  // The murderer's friends were each alone, whatever they say.
  if (accomplice >= 0 && !together([accomplice])) return 'rooms-exhausted'
  if (forger >= 0 && !together([forger])) return 'rooms-exhausted'

  const placed = new Set<CharId>(
    [culprit, thief, companion, companionOf, sweetheart, sweetheartOf, accomplice, forger, loner, amnesiac].filter(
      (x) => x >= 0,
    ),
  )
  const floaters = cast.map((m) => m.id).filter((c) => !placed.has(c))
  const floaterGroups: CharId[][] = []
  if (loner >= 0) floaterGroups.push([loner]) // the loner is always, definitionally, alone
  if (amnesiac >= 0) floaterGroups.push([amnesiac]) // and nobody can say where the amnesiac was
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
  // The scene tells HOW it was done, and nothing of who: the killer left the
  // weapon and no trace of themselves.
  evidence.push({
    id: 'weapon',
    room: sceneRoom,
    name: method.weaponName,
    fact: { kind: 'weapon', means: method.means },
  })
  // Anyone who truly spent the window alone left some trace of themselves
  // where they were — which is what bears out a lonely alibi. Not the loner:
  // nothing vouches for them, not even the furniture. Not the thief either,
  // whose mark on the room is the lockbox.
  const traceRooms = new Map<RoomId, string>()
  for (const m of cast) {
    const c = m.id
    if (liesAboutWhereabouts(roles[c]) || c === loner) continue
    if (companions[c].length > 0) continue
    traceRooms.set(locations[c], m.trait)
    evidence.push({
      id: `trace-${locations[c]}`,
      room: locations[c],
      name: traitDef(m.trait)?.evidenceName ?? 'a telltale trace',
      fact: { kind: 'trace', room: locations[c], attr: { kind: 'trait', trait: m.trait } },
    })
  }
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

  // The Collector took something up before the detective could find it: a
  // trace, which now bears nobody out until the Collector has been asked.
  if (collector >= 0) {
    const traces = evidence.filter((e) => e.fact.kind === 'trace')
    if (traces.length > 0) {
      const taken = rng.pick(traces)
      taken.heldBy = collector
      if (taken.fact.kind === 'trace') taken.fact = { ...taken.fact, givenBy: collector }
    }
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
    const herringPresent = shadyIds.filter((x) => x !== accomplice)
    const roll = rng.next()
    let target: CharId
    if (herringPresent.length > 0 && roll < 0.4) target = rng.pick(herringPresent)
    else if (!singleLiar && roll < 0.55) target = culprit
    else target = rng.pick(cast.map((m) => m.id).filter((c) => c !== confidant && c !== culprit))
    knowledge[confidant].push({
      kind: 'alignment',
      target,
      alignment: isEvil(roles[target]) ? 'evil' : 'good',
    })
  }
  if (sleuth >= 0) {
    // The murderer and two others. The two are whoever looks worst tonight,
    // where there is anyone to choose: a shortlist of the plainly innocent
    // would be as good as a name.
    const others = cast.map((m) => m.id).filter((c) => c !== sleuth && c !== culprit)
    const shady = rng.shuffle(others.filter((c) => shadyIds.includes(c)))
    const plain = rng.shuffle(others.filter((c) => !shady.includes(c)))
    const beside = [...shady.slice(0, 1), ...plain, ...shady.slice(1)].slice(0, 2)
    knowledge[sleuth].push({
      kind: 'among',
      suspects: [culprit, ...beside].sort((a, b) => a - b),
    })
  }
  if (steward >= 0) {
    // Seated between two of them all evening: how many are lying about the hour?
    knowledge[steward].push({
      kind: 'liarsBeside',
      count: neighbours(steward, n).filter((c) => liesAboutWhereabouts(roles[c])).length,
    })
  }
  // The Blackmailer's victims: they will say whom they fear, and why.
  const victims =
    blackmailer >= 0 ? rng.sample(honestIds, Math.min(honestIds.length, rng.chance(0.5) ? 3 : 2)) : []
  for (const v of victims) knowledge[v].push({ kind: 'blackmailed', by: blackmailer })
  if (redherring >= 0) {
    // Somebody saw them at the scene — earlier, before the hour of the murder.
    const seers = honestIds.filter((c) => c !== redherring)
    if (seers.length > 0) {
      knowledge[rng.pick(seers)].push({ kind: 'earlier', target: redherring, room: sceneRoom })
    }
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
          c !== amnesiac &&
          c !== accomplice &&
          c !== forger &&
          c !== sweetheart &&
          c !== sweetheartOf &&
          !companions[seer].includes(c),
      )
    if (targets.length > 0) {
      const target = rng.pick(targets)
      knowledge[seer].push({ kind: 'sighting', target, room: locations[target] })
    }
  }
  if (drunk >= 0 && truth.drunkBelievedRole) {
    knowledge[drunk].push(corruptedInfo(rng, truth.drunkBelievedRole, cast, roles, culprit, drunk, sceneRoom))
  }
  const docReferralHolder = rng.pick(honestIds)
  // The weapon lies at the scene, where any detective begins: nobody need
  // point the way to it.
  const weaponReferralHolder = -1
  const weaponRoom = sceneRoom

  // ---- strategies, covers, lies ----
  for (const m of cast) {
    m.strategy =
      liesAboutRole(roles[m.id]) || liesAboutWhereabouts(roles[m.id])
        ? rng.pick(CONCEALER_STRATEGIES)
        : rng.pick(HONEST_STRATEGIES)
  }

  // Anyone who needs to be somebody else takes a role from the script — which
  // may or may not be in the house tonight. Nobody is told which.
  const coverPool = rng.shuffle(INFO_ROLES.filter((r) => script.innocents.includes(r)))
  if (coverPool.length === 0) return 'cover-pool'
  const coverRoles = new Map<CharId, RoleId>()
  const fabricated = new Map<CharId, Claim>()
  // The Accomplice passes for the Companion, and has nothing to tell but the
  // alibi; the Forger for the Collector, with something to hand over.
  if (accomplice >= 0) coverRoles.set(accomplice, 'alibi')
  if (forger >= 0) coverRoles.set(forger, 'collector')
  const bluffers = cast
    .map((m) => m.id)
    .filter((c) => liesAboutRole(roles[c]) && c !== accomplice && c !== forger)
  bluffers.forEach((c, i) => {
    const cover = coverPool[i % coverPool.length]
    coverRoles.set(c, cover)
    const fab = fabricateInfo(rng, cover, cast, roles, relationships, c, culprit, sceneRoom)
    if (!fab) return
    fabricated.set(c, fab)
  })
  if (bluffers.some((c) => !fabricated.has(c))) return 'fabrication'

  const occupiedRooms = new Set(locations.filter((r) => r !== ''))
  const lies = new Map<CharId, { room: RoomId; companions: CharId[] }>()
  /** Rooms where somebody honest truly spent the hour alone, and will say so. */
  const kept = rng.shuffle(
    cast
      .map((m) => m.id)
      .filter(
        (c) => truthClassOf(roles[c]) === 'honest' && c !== amnesiac && companions[c].length === 0,
      )
      .map((c) => locations[c]),
  )
  if (accomplice >= 0) {
    // Each swears the other was beside them — in a room they chose badly:
    // somebody was there, alone, and the room will bear that somebody out.
    const room = kept.find((r) => traceRooms.has(r)) ?? kept[0]
    if (!room) return 'lie-room'
    lies.set(accomplice, { room, companions: [culprit] })
    lies.set(culprit, { room, companions: [accomplice] })
  }
  if (sweetheart >= 0) {
    // Alone, they say, and somewhere else — while the one they were with says
    // otherwise.
    const room = rng
      .shuffle(allRooms)
      .find(
        (r) =>
          r !== sceneRoom &&
          r !== theftRoom &&
          r !== locations[sweetheart] &&
          traceRooms.get(r) !== cast[sweetheart].trait,
      )
    if (!room) return 'lie-room'
    lies.set(sweetheart, { room, companions: [] })
  }
  if (forger >= 0) {
    // Made to order: the murderer's own mark, in the room the murderer means
    // to claim — an empty one, where nothing true can gainsay it.
    const empty = rng.shuffle(
      allRooms.filter((r) => !occupiedRooms.has(r) && r !== sceneRoom && r !== theftRoom),
    )
    const room = empty[0]
    if (!room) return 'lie-room'
    lies.set(culprit, { room, companions: [] })
    evidence.push({
      id: 'trace-forged',
      room,
      name: traitDef(cast[culprit].trait)?.evidenceName ?? 'a telltale trace',
      fact: {
        kind: 'trace',
        room,
        attr: { kind: 'trait', trait: cast[culprit].trait },
        givenBy: forger,
      },
      heldBy: forger,
      forged: true,
    })
  }
  const loneLiars = cast
    .map((m) => m.id)
    .filter((c) => truthClassOf(roles[c]) === 'concealer' && !lies.has(c))
  for (const c of loneLiars) {
    // A liar never claims a room holding a trace that would fit them: a trace
    // that bears out an account must always be bearing out a true one.
    const fitsMe = (r: RoomId) => traceRooms.get(r) === cast[c].trait
    const emptyRooms = allRooms.filter((r) => !occupiedRooms.has(r))
    const occupiedOptions = allRooms.filter(
      (r) =>
        occupiedRooms.has(r) &&
        r !== sceneRoom &&
        r !== theftRoom &&
        r !== locations[c] &&
        !fitsMe(r),
    )
    // The culprit leans toward an occupied room: that collision is the
    // opportunity-breaking contradiction the accusation phase depends on.
    const occupiedChance = c === culprit ? 0.75 : 0.5
    const pool = rng.chance(occupiedChance) && occupiedOptions.length > 0 ? occupiedOptions : emptyRooms
    if (pool.length === 0) return 'lie-room'
    lies.set(c, { room: rng.pick(pool), companions: [] })
  }

  // Suspicion targets: accusers/deflectors point fingers; hedgers/theorists
  // name a lead suspect among their scenarios. Same surface, either alignment.
  const suspicionTarget = new Map<CharId, CharId>()
  for (const m of cast) {
    if (['accuser', 'deflector', 'hedger', 'theorist'].includes(m.strategy)) {
      suspicionTarget.set(m.id, rng.pick(cast.map((x) => x.id).filter((c) => c !== m.id)))
    }
  }
  // Whoever is being bled looks no further than the one bleeding them — and
  // the murderer goes unremarked.
  for (const v of victims) suspicionTarget.set(v, blackmailer)

  // ---- statement policies ----
  const policies: Policy[] = cast.map((m) =>
    buildPolicy(m.id, {
      cast,
      truth,
      evidence,
      knowledge,
      coverRoles,
      fabricated,
      lies,
      suspicionTarget,
      docReferralHolder,
      docRoom,
      weaponReferralHolder,
      weaponRoom,
      quarrelHearer,
    }),
  )

  const caseSheet = {
    script: {
      innocents: [...script.innocents],
      herrings: [...script.herrings],
      helpers: [...script.helpers],
      herringCount: script.herringCount,
    },
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
  if (!isConsistent(roles, { cast, caseSheet, spoken, evidence: facts })) {
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

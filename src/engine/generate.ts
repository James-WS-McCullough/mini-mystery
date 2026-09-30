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
  HELPERS,
  INFO_ROLES,
  buildDeck,
  pickMurderer,
  isEvil,
  liesAboutRole,
  liesAboutWhereabouts,
  truthClassOf,
  type Script,
} from './deck'
import { Rng } from './rng'
import { dealMeans } from './means'
import { dealTraits } from './traits'
import { buildPolicy, corruptedInfo, fabricateInfo, passesSanity, watched } from './policy'
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
  MurdererKind,
  GroundTruth,
  Mystery,
  Policy,
  Relationship,
  RoleId,
  RoomId,
  SoundKind,
  Spoken,
  Strategy,
  Temperament,
} from './types'
import { MOTIVE_GRADE, TEMPERAMENTS, isMotiveGrade } from './types'

const DEFENSES: DefenseStyle[] = ['indignant', 'flustered', 'calm', 'selfdoubting']
const CONCEALER_STRATEGIES: Strategy[] = ['bluffer', 'deflector', 'hedger', 'evasive']
const HONEST_STRATEGIES: Strategy[] = ['open', 'accuser', 'theorist', 'reticent']
/** Roles the Drunk can sincerely believe themself to be. Never 'gossip': the
 *  solver treats an unreliable speaker's relationship claims as true, so their
 *  corrupted info must live in the discounted claim kinds. */
const DRUNK_BELIEFS: readonly RoleId[] = ['witness', 'oracle', 'confidant', 'sleuth', 'steward']
/** Whose silence is worth paying for, the likeliest first. */
const WORTH_BUYING: readonly RoleId[] = [
  'witness',
  'oracle',
  'sleuth',
  'architect',
  'confidant',
  'steward',
]
/** What the bought witness keeps back: what they know by their role, and whom they saw. */
const KEPT_BACK: ReadonlySet<Claim['kind']> = new Set([
  'sighting',
  'glimpse',
  'culpritAttr',
  'among',
  'alignment',
  'liarsAmong',
  'passage',
])

/** Why an attempt was rejected — for tuning probes, never for gameplay. */
export type GenFailure =
  | 'trait-share'
  | 'no-method'
  | 'rooms-exhausted'
  | 'no-company'
  | 'cover-pool'
  | 'fabrication'
  | 'lie-room'
  | 'no-frame'
  | 'no-seam'
  | 'no-passage'
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

/** Whom a piece of knowledge tells against, if anybody but the one who holds it. */
function pointsAt(k: Claim, holder: CharId): CharId[] {
  switch (k.kind) {
    case 'relationship':
      return k.subject !== holder && k.rel !== 'devoted' && k.rel !== 'cordial' ? [k.subject] : []
    case 'earlier':
      return [k.target]
    case 'alignment':
      return k.alignment === 'evil' ? [k.target] : []
    case 'blackmailed':
      return [k.by]
    default:
      return []
  }
}

/**
 * Tonight's guests, drawn so that neither the men nor the women are fewer
 * than three (where the house has enough of both to choose from).
 */
function mixedCompany(rng: Rng, pool: readonly CharacterDef[], n: number): CharacterDef[] {
  const least = Math.min(3, Math.floor(n / 2))
  const enough = (['he', 'she'] as const).every(
    (sex) => pool.filter((d) => d.pronouns === sex).length >= least,
  )
  if (!enough) return rng.sample([...pool], n)
  const most = n - least
  const count = { he: 0, she: 0, they: 0 }
  const out: CharacterDef[] = []
  for (const def of rng.shuffle([...pool])) {
    if (out.length === n) break
    if (def.pronouns !== 'they' && count[def.pronouns] >= most) continue
    // Leave room for whoever is still wanted of the others.
    const owed = (['he', 'she'] as const)
      .filter((sex) => sex !== def.pronouns)
      .reduce((sum, sex) => sum + Math.max(0, least - count[sex]), 0)
    if (n - out.length - 1 < owed) continue
    count[def.pronouns]++
    out.push(def)
  }
  return out
}

/** One of several, each by its weight. */
function weightedPick<T extends { weight?: number }>(rng: Rng, from: readonly T[]): T {
  let roll = rng.next() * from.reduce((sum, x) => sum + (x.weight ?? 1), 0)
  for (const x of from) {
    roll -= x.weight ?? 1
    if (roll < 0) return x
  }
  return from[from.length - 1]
}

/** The motives a character could have. Never none. */
export function motivesOf(def: CharacterDef): Relationship[] {
  const fits = MOTIVE_GRADE.filter((rel) => !def.motives || (def.motives[rel] ?? 0) > 0)
  return fits.length > 0 ? fits : [...MOTIVE_GRADE]
}

export interface GenerateOptions {
  seed: number
  pack: SettingPack
  script?: Script
  config?: Partial<GameConfig>
  /** Diagnostics hook: called with the failure reason of each rejected attempt. */
  onAttempt?: (failure: GenFailure, deck: RoleId[], culprit?: string) => void
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
  // What kind of murderer, likewise: settled by the seed, and not by which
  // attempt happens to come off.
  const kind = pickMurderer(new Rng(`${opts.seed}:murderer`), script)
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const rng = new Rng(`${opts.seed}:${attempt}`)
    const deck = attempt < FIXED_DECK_ATTEMPTS ? fixedDeck : buildDeck(rng, script)
    const probe = { culprit: '' }
    const result = tryGenerate(rng, opts, deck, probe, kind)
    if (typeof result !== 'string') return result
    opts.onAttempt?.(result, deck, probe.culprit)
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
    // What an honest guest takes back, or gives up, when it is put to them.
    if (policy.press.kind === 'recant') {
      for (const claim of policy.press.claims) out.push({ speaker, claim })
    }
  })
  return out
}

function tryGenerate(
  rng: Rng,
  opts: GenerateOptions,
  deck: RoleId[],
  /** Filled in for diagnostics: who this attempt made the culprit. */
  probe: { culprit: string } = { culprit: '' },
  kind: MurdererKind = 'plain',
): Mystery | GenFailure {
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
  // Men and women both, and three at least of each: "it was a woman" must
  // never be as good as a name.
  const defs = mixedCompany(rng, pack.characters, n)
  const roles = rng.shuffle(deck)
  const culprit = roles.indexOf('culprit')
  probe.culprit = defs[culprit].id
  // What the one who takes the blame could never have had.
  const martyrLacks = roles.includes('martyr')
    ? rng.fork('martyr').pick(['means', 'motive', 'opportunity'] as const)
    : null
  // Traits are dealt from a stream of their own, knowing nothing of the roles.
  const traits = dealTraits(rng.fork('traits'), defs, pack.traits)
  // The method is one nearly anyone could have managed: it rules out one or
  // two guests, the begrudged (motive, but no means) always among them.
  // Where it was done, and then how: some ways of killing want a particular
  // place — a balcony to fall from, a drive to be run down on.
  const sceneRoom = rng.pick(pack.sceneRooms)
  // (What the Cleaner carries off must be something that can be carried: not a
  // balcony, and not the motor-car.)
  const carried = roles.includes('cleaner')
  const ways = pack.methods.filter(
    (m) => (!m.rooms || m.rooms.includes(sceneRoom)) && !(carried && m.rooms),
  )
  if (ways.length === 0) return 'no-method'
  // A way that belongs to the place is likelier there than one that would do anywhere.
  const method = rng.pick(ways.flatMap((m) => (m.rooms ? [m, m] : [m])))
  const means = dealMeans(rng.fork('means'), defs, pack.means, {
    method: method.means,
    culprit,
    mustLack: roles.flatMap((r, i) =>
      r === 'begrudged' || (r === 'martyr' && martyrLacks === 'means') ? [i] : [],
    ),
    mustHave: roles.flatMap((r, i) => (r === 'martyr' && martyrLacks !== 'means' ? [i] : [])),
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
    temperament: pickManner(rng, d),
    strategy: 'open',
    defense: rng.pick(DEFENSES),
  }))

  /** A night with a passage — and whether the murderer went by it. */
  const passageNight = script.passage === true
  // (Not where a friend has already made the murderer an alibi to order.)
  const alibiMade = roles.some((r) => r === 'accomplice' || r === 'forger' || r === 'whisperer')
  const viaPassage = passageNight && !alibiMade && rng.chance(0.4)

  /** Nobody else has the culprit's trait: to describe it would be to name them. */
  const tellingTrait = cast.filter((m) => m.trait === cast[culprit].trait).length < 2
  /** What can be said of the murderer by their sex — where that would not name them. */
  const bySex: AttrRef | null =
    cast[culprit].pronouns !== 'they' &&
    cast.filter((m) => m.pronouns === cast[culprit].pronouns).length >= 3
      ? { kind: 'sex', sex: cast[culprit].pronouns }
      : null
  const byTrait: AttrRef = { kind: 'trait', trait: cast[culprit].trait }
  if (tellingTrait && !bySex) return 'trait-share'

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
  const architect = roles.indexOf('architect')
  const forger = roles.indexOf('forger')
  const framer = roles.indexOf('framer')
  const cleaner = roles.indexOf('cleaner')
  const whisperer = roles.indexOf('whisperer')
  const sponsor = roles.indexOf('sponsor')
  const martyr = roles.indexOf('martyr')
  /** The murderer's friend, where there is one. */
  const helper = roles.findIndex((r) => HELPERS.includes(r))
  /** Whoever looks worse than they are tonight — and the murderer's friend, who is. */
  const shadyIds = [thief, begrudged, loner, redherring, blackmailer, amnesiac, sweetheart, helper, drunk].filter(
    (x) => x >= 0,
  )
  /** With a single liar the world collapses fast — informants soften so the
   *  night keeps its length. */
  const singleLiar = thief < 0

  const honestIds = cast.map((m) => m.id).filter((c) => truthClassOf(roles[c]) === 'honest')

  // ---- the occasion: why they had all come ----
  const occasions = pack.occasions ?? []
  const occasion = occasions.length > 0 ? weightedPick(rng.fork('occasion'), occasions) : null
  const event: SoundKind = occasion?.event ?? 'quarrel'

  // ---- relationships to the victim ----
  const relationships: Relationship[] = new Array(n).fill('cordial')
  // A motive is one that fits whoever has it: the bootboy was never jilted —
  // and one the occasion makes likelier: a will to be signed makes heirs.
  const motiveFor = (c: CharId): Relationship => {
    const fits = motivesOf(defs[c])
    const weights = fits.map((rel) => (defs[c].motives?.[rel] ?? 1) * (occasion?.motives?.[rel] ?? 1))
    let roll = rng.next() * weights.reduce((a, b) => a + b, 0)
    let at = 0
    while (at < weights.length - 1 && roll >= weights[at]) {
      roll -= weights[at]
      at++
    }
    return fits[at]
  }
  relationships[culprit] = motiveFor(culprit)
  if (begrudged >= 0) relationships[begrudged] = motiveFor(begrudged)
  // Whoever means to take the blame had cause enough — unless that is the very
  // thing they lacked, and then nobody was fonder of the dead man.
  if (martyr >= 0) relationships[martyr] = martyrLacks === 'motive' ? 'devoted' : motiveFor(martyr)
  const thiefMotive = thief >= 0 && rng.chance(0.5)
  if (thief >= 0) relationships[thief] = thiefMotive ? motiveFor(thief) : 'strained'
  // The loner's herring is opportunity, not motive: they stay benign.
  const strainCandidates = honestIds.filter((c) => c !== begrudged && c !== loner)
  if (strainCandidates.length > 0) relationships[rng.pick(strainCandidates)] = 'strained'
  const devotedCandidates = strainCandidates.filter((c) => relationships[c] === 'cordial')
  if (devotedCandidates.length > 0 && rng.chance(0.6)) {
    relationships[rng.pick(devotedCandidates)] = 'devoted'
  }

  // ---- geography: the murder window as one time slot ----
  const allRooms = pack.rooms.map((r) => r.id)
  const theftRoom = thief >= 0 ? rng.pick(pack.valuableRooms.filter((r) => r !== sceneRoom)) : null

  const locations: RoomId[] = new Array(n).fill('')
  const companions: CharId[][] = Array.from({ length: n }, () => [])
  if (!viaPassage) locations[culprit] = sceneRoom
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
          c !== companion &&
          c !== loner &&
          c !== amnesiac &&
          c !== redherring &&
          truthClassOf(roles[c]) === 'honest',
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
  // The Red Herring was at the scene within the hour, and gone before it was
  // done: they were there, and will say so, and somebody saw them.
  if (redherring >= 0) locations[redherring] = sceneRoom
  // The murderer who went by the passage spent the hour at the other end of
  // it, alone — and may say so, for it is true.
  if (viaPassage && !together([culprit])) return 'rooms-exhausted'
  // The murderer's friend was alone, whatever they say — all but the one who
  // will take the blame and could not have done it: they were in company.
  let martyrOf = -1
  if (martyr >= 0 && martyrLacks === 'opportunity') {
    const other = good.pop()
    if (other === undefined) return 'no-company'
    martyrOf = other
    if (!together([martyr, martyrOf])) return 'rooms-exhausted'
  } else if (helper >= 0 && !together([helper])) return 'rooms-exhausted'

  const placed = new Set<CharId>(
    [culprit, thief, companion, companionOf, sweetheart, sweetheartOf, helper, martyrOf, loner, amnesiac, redherring].filter(
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

  // Whoever was at odds with him that afternoon: the murderer half the time,
  // and the rest of the time somebody else with cause — a lead, not a proof.
  const quarrelCandidates = cast
    .map((m) => m.id)
    .filter((c) => c !== culprit && (isMotiveGrade(relationships[c]) || relationships[c] === 'strained'))
  const quarrelParticipant =
    quarrelCandidates.length === 0 || rng.chance(0.5) ? culprit : rng.pick(quarrelCandidates)

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
    event,
    ...(occasion ? { occasion: occasion.id } : {}),
  }

  // ---- physical evidence ----
  const traitDef = (id: string) => pack.traits.find((t) => t.id === id)
  const evidence: EvidenceItem[] = []
  // The scene tells HOW it was done, and nothing of who: the killer left the
  // weapon and no trace of themselves.
  // — unless the Cleaner has been there first, and carried it off to wherever
  // they spent the hour.
  const weaponRoom = cleaner >= 0 ? locations[cleaner] : sceneRoom
  evidence.push({
    id: 'weapon',
    room: weaponRoom,
    name: method.weaponName,
    fact:
      cleaner >= 0
        ? { kind: 'weapon', means: method.means, method: method.id, foundIn: weaponRoom }
        : { kind: 'weapon', means: method.means, method: method.id },
  })
  if (cleaner >= 0) {
    evidence.push({
      id: 'scene-bare',
      room: sceneRoom,
      name: pack.bareScene ?? 'the place where it was done, and nothing it was done with',
      fact: { kind: 'sceneCleared' },
    })
  }
  // What the Sponsor paid, where the Sponsor spent the hour.
  const bribed =
    sponsor >= 0
      ? (WORTH_BUYING.map((r) => roles.indexOf(r)).find((c) => c >= 0 && rng.chance(0.7)) ??
        WORTH_BUYING.map((r) => roles.indexOf(r)).find((c) => c >= 0) ??
        -1)
      : -1
  if (sponsor >= 0) {
    if (bribed < 0) return 'no-seam'
    evidence.push({
      id: 'bribe',
      room: locations[sponsor],
      name: (pack.bribeItem ?? 'an envelope of banknotes, with {name}’s name on it').replace(
        '{name}',
        cast[bribed].shortName,
      ),
      fact: { kind: 'bribe', to: bribed },
    })
  }
  // Anyone who truly spent the window alone left some trace of themselves
  // where they were — which is what bears out a lonely alibi. Not the loner:
  // nothing vouches for them, not even the furniture. Not the thief either,
  // whose mark on the room is the lockbox.
  const traceRooms = new Map<RoomId, string>()
  for (const m of cast) {
    const c = m.id
    const wentByPassage = viaPassage && c === culprit
    if ((liesAboutWhereabouts(roles[c]) && !wentByPassage) || c === loner || c === redherring) continue
    // Nor does anything vouch for the one who means to be blamed.
    if (c === martyr) continue
    if (companions[c].length > 0) continue
    traceRooms.set(locations[c], m.trait)
    evidence.push({
      id: `trace-${locations[c]}`,
      room: locations[c],
      name: traitDef(m.trait)?.evidenceName ?? 'a telltale trace',
      fact: { kind: 'trace', room: locations[c], attr: { kind: 'trait', trait: m.trait } },
    })
  }
  // The passage: from the scene to the room where the murderer spent the
  // hour — or to a room where somebody else did, alone, who never used it.
  let passageRoom: RoomId | null = null
  if (passageNight) {
    if (viaPassage) passageRoom = locations[culprit]
    else {
      const lonely = cast
        .map((m) => m.id)
        .filter(
          (c) =>
            c !== amnesiac &&
            truthClassOf(roles[c]) === 'honest' &&
            companions[c].length === 0 &&
            traceRooms.has(locations[c]),
        )
      if (lonely.length === 0) return 'no-passage'
      passageRoom = locations[rng.pick(lonely)]
    }
    evidence.push({
      id: 'passage',
      room: passageRoom,
      name: pack.passageItem ?? 'a panel in the wall that swings inward on a dark passage',
      fact: { kind: 'passage', room: passageRoom },
    })
    truth.passage = { room: passageRoom, used: viaPassage }
  }
  if (thief >= 0 && theftRoom) {
    evidence.push({
      id: 'lockbox',
      room: theftRoom,
      name: 'a lockbox with its hasp forced',
      fact: { kind: 'forcedLockbox', room: theftRoom },
    })
  }
  // What the grievance was written on. Chosen from a stream of its own, and
  // never the same paper twice in one house.
  const papers = rng.fork('papers')
  const usedPapers = new Set<string>()
  const motiveItem = (rel: Relationship): string => {
    const all = pack.motiveItems[rel] ?? []
    const fresh = all.filter((name) => !usedPapers.has(name))
    const name = (fresh.length > 0 ? papers.pick(fresh) : all[0]) ?? 'a compromising document'
    usedPapers.add(name)
    return name
  }
  const docRoom = rng.pick(pack.docRooms)
  evidence.push({
    id: 'doc-motive',
    room: docRoom,
    name: motiveItem(relationships[culprit]),
    fact: { kind: 'motiveDocument', subject: culprit, rel: relationships[culprit] },
  })
  // A second motive document for a red herring with a grudge of their own.
  const herringDocSubject =
    martyr >= 0 ? martyr : begrudged >= 0 ? begrudged : thiefMotive ? thief : -1
  const herringRooms = pack.docRooms.filter((r) => r !== docRoom)
  // (How the one who takes the blame stood with him is always on paper: it
  // is what shows them to have had cause — or none.)
  if (herringDocSubject >= 0 && herringRooms.length > 0 && (martyr >= 0 || rng.chance(0.7))) {
    evidence.push({
      id: 'doc-herring',
      room: rng.pick(herringRooms),
      name: motiveItem(relationships[herringDocSubject]),
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
    // (Nobody saw the murderer at the scene who came and went through the wall.)
    const full = !singleLiar && !viaPassage && rng.chance(0.35)
    knowledge[witness].push(
      full
        ? { kind: 'sighting', target: culprit, room: sceneRoom }
        : {
            kind: 'glimpse',
            attr: tellingTrait && bySex ? bySex : byTrait,
            room: sceneRoom,
          },
    )
  }
  if (oracle >= 0) {
    const attr: AttrRef = bySex && (tellingTrait || rng.chance(singleLiar ? 0.85 : 0.7)) ? bySex : byTrait
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
  if (architect >= 0 && passageRoom !== null) {
    knowledge[architect].push({ kind: 'passage', room: passageRoom })
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
    // Had an eye on two of them all evening: how many are lying about the hour?
    const pair = watched(rng, cast, steward)
    knowledge[steward].push({
      kind: 'liarsAmong',
      pair,
      count: pair.filter((c) => liesAboutWhereabouts(roles[c])).length,
    })
  }
  // The Blackmailer's victims: they will say whom they fear, and why.
  // (Not one who knows the Blackmailer to be no murderer: they would clear the
  // very name they point at.)
  const bled = honestIds.filter(
    (c) =>
      !knowledge[c].some(
        (k) => k.kind === 'alignment' && k.target === blackmailer && k.alignment === 'good',
      ),
  )
  const victims = blackmailer >= 0 ? rng.sample(bled, Math.min(bled.length, rng.chance(0.5) ? 3 : 2)) : []
  for (const v of victims) knowledge[v].push({ kind: 'blackmailed', by: blackmailer })
  if (cleaner >= 0) {
    // Somebody saw the Cleaner where the Cleaner truly was — which is where
    // the weapon is, and not where the Cleaner will say.
    const seers = honestIds.filter((c) => !companions[c].includes(cleaner))
    if (seers.length > 0) {
      knowledge[rng.pick(seers)].push({ kind: 'sighting', target: cleaner, room: locations[cleaner] })
    }
  }
  if (redherring >= 0) {
    // Somebody saw them at the scene, within the hour. It is a true sighting,
    // and it looks exactly like one of the murderer.
    const seers = honestIds.filter((c) => c !== redherring)
    if (seers.length > 0) {
      knowledge[rng.pick(seers)].push({ kind: 'sighting', target: redherring, room: sceneRoom })
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
  knowledge[quarrelHearer].push({ kind: 'heard', sound: event, room: sceneRoom })
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
          c !== helper &&
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
  // point the way to it. But where the murderer's friend has hidden something
  // — the weapon, or the money — somebody has noticed the room is not right.
  const hintRoom = cleaner >= 0 ? weaponRoom : sponsor >= 0 ? locations[sponsor] : null
  const hinters = honestIds.filter((c) => c !== docReferralHolder && c !== bribed)
  const weaponReferralHolder = hintRoom !== null && hinters.length > 0 ? rng.pick(hinters) : -1

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
  // The murderer may take the Red Herring's part: "I was there, yes, and he
  // was alive when I left." It is the one lie that needs no false alibi.
  const playsHerring =
    helper < 0 && !viaPassage && script.herrings.includes('redherring') && rng.chance(0.25)

  // The Framer has chosen somebody: one whose own account will stand, in the
  // end, and whose trait is not the murderer's. Something of theirs is at the
  // scene, and the Framer saw them there — so the Framer will say.
  let framed = -1
  if (framer >= 0) {
    const found = (c: CharId) =>
      evidence.some(
        (e) => e.fact.kind === 'trace' && e.room === locations[c] && e.heldBy === undefined && !e.forged,
      )
    const standing = honestIds.filter(
      (c) =>
        c !== redherring &&
        // (Nobody alone at the end of the passage: their account clears nobody.)
        !(companions[c].length === 0 && locations[c] === passageRoom) &&
        c !== amnesiac &&
        cast[c].trait !== cast[culprit].trait &&
        (companions[c].length > 0
          ? companions[c].every((o) => truthClassOf(roles[o]) === 'honest')
          : found(c)),
    )
    if (standing.length === 0) return 'no-frame'
    framed = rng.pick(standing)
    evidence.push({
      id: 'trace-planted',
      room: sceneRoom,
      name: traitDef(cast[framed].trait)?.evidenceName ?? 'a telltale trace',
      fact: { kind: 'trace', room: sceneRoom, attr: { kind: 'trait', trait: cast[framed].trait } },
      planted: true,
    })
    if (script.innocents.includes('witness')) coverRoles.set(framer, 'witness')
    fabricated.set(framer, { kind: 'sighting', target: framed, room: sceneRoom })
    cast[framer].strategy = 'deflector'
  }
  if (playsHerring) coverRoles.set(culprit, 'redherring')
  const bluffers = cast
    .map((m) => m.id)
    .filter((c) => liesAboutRole(roles[c]) && !coverRoles.has(c))
  bluffers.forEach((c, i) => {
    const cover = coverPool[i % coverPool.length]
    coverRoles.set(c, cover)
    if (fabricated.has(c)) return
    const fab = fabricateInfo(
      rng,
      cover,
      cast,
      roles,
      relationships,
      c,
      culprit,
      sceneRoom,
      defs.map(motivesOf),
      passageRoom !== null
        ? { rooms: allRooms.filter((r) => r !== sceneRoom), truly: passageRoom }
        : undefined,
    )
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
  if (playsHerring) lies.set(culprit, { room: sceneRoom, companions: [] })
  // The best account is the true one: alone, in the room at the end of the passage.
  if (viaPassage) lies.set(culprit, { room: locations[culprit], companions: [] })
  if (accomplice >= 0) {
    // Each swears the other was beside them — in a room they chose badly:
    // somebody was there, alone, and the room will bear that somebody out.
    const room = kept.find((r) => traceRooms.has(r)) ?? kept[0]
    if (!room) return 'lie-room'
    lies.set(accomplice, { room, companions: [culprit] })
    lies.set(culprit, { room, companions: [accomplice] })
  }
  // The Whisperer has given the murderer a room to have been in, and an honest
  // guest who will swear to having seen them there. It was chosen badly:
  // somebody else was in it, alone, and the room bears that somebody out.
  let whispered = -1
  if (whisperer >= 0) {
    const room = kept.find(
      (r) =>
        // (Whoever holds the trace: the two accounts collide either way.)
        traceRooms.has(r) && traceRooms.get(r) !== cast[culprit].trait,
    )
    if (!room) return 'lie-room'
    lies.set(culprit, { room, companions: [] })
    const mouths = honestIds.filter((c) => locations[c] !== room && c !== bribed)
    if (mouths.length === 0) return 'no-seam'
    whispered = rng.pick(mouths)
    knowledge[whispered].push({ kind: 'sighting', target: culprit, room })
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
  // Whom each of them suspects. Most suspect somebody: whoever they know
  // something against, or else whoever looks worst to them — which is as
  // often a herring as the murderer, and sometimes nobody in particular. It
  // points the detective at the guests worth a second look, and at no one guest.
  const suspicionTarget = new Map<CharId, CharId>()
  /** What somebody knows against the one they suspect, and tells only when asked whom. */
  const grounds = new Map<CharId, Claim[]>()
  /** Whom those with nobody to suspect would answer for — rightly or wrongly. */
  const trusts = new Map<CharId, CharId>()
  for (const m of cast) {
    if (!rng.chance(0.85)) {
      trusts.set(m.id, rng.pick(cast.map((x) => x.id).filter((o) => o !== m.id)))
      continue
    }
    const c = m.id
    const honestly = truthClassOf(roles[c]) === 'honest'
    const against = honestly
      ? [...new Set(knowledge[c].flatMap((k) => pointsAt(k, c)))]
      : []
    if (against.length > 0 && rng.chance(0.7)) {
      suspicionTarget.set(c, rng.pick(against))
      continue
    }
    /** Somebody they know to be innocent, or on good terms with the dead man: not to be suspected. */
    const cleared = (o: CharId) =>
      [...knowledge[c], ...(fabricated.has(c) ? [fabricated.get(c)!] : [])].some(
        (k) =>
          (k.kind === 'alignment' && k.target === o && k.alignment === 'good') ||
          (k.kind === 'relationship' && k.subject === o && !isMotiveGrade(k.rel)),
      )
    const others = cast
      .map((x) => x.id)
      // The murderer and their friends do not point at one another; and nobody
      // suspects somebody they would clear in the same breath.
      .filter((o) => o !== c && !(isEvil(roles[c]) && isEvil(roles[o])) && !cleared(o))
    const weights = others.map((o) => (o === culprit ? 1.5 : shadyIds.includes(o) ? 2 : 1))
    let roll = rng.next() * weights.reduce((a, b) => a + b, 0)
    let at = 0
    while (at < weights.length - 1 && roll >= weights[at]) {
      roll -= weights[at]
      at++
    }
    suspicionTarget.set(c, others[at])
    // Half the time there is a reason for it: they know how the one they
    // suspect stood with the dead man, and it was not well.
    const theirs = relationships[others[at]]
    if (honestly && theirs !== 'cordial' && theirs !== 'devoted' && rng.chance(0.5)) {
      grounds.set(c, [{ kind: 'relationship', subject: others[at], rel: theirs }])
    }
  }
  // Whoever is being bled looks no further than the one bleeding them — and
  // the murderer goes unremarked.
  for (const v of victims) {
    suspicionTarget.set(v, blackmailer)
    grounds.delete(v)
    trusts.delete(v)
  }
  // The Framer has one name to give, and gives it.
  if (framer >= 0 && framed >= 0) {
    suspicionTarget.set(framer, framed)
    trusts.delete(framer)
  }
  // Whoever has the Whisperer's story would answer for the murderer.
  if (whispered >= 0) {
    suspicionTarget.delete(whispered)
    grounds.delete(whispered)
    trusts.set(whispered, culprit)
  }
  // Whoever has been given a name to point at, and knows that name to be
  // innocent, does not point at it: they would clear it in the same breath.
  const clears = (c: CharId, o: CharId) =>
    [...knowledge[c], ...(fabricated.has(c) ? [fabricated.get(c)!] : [])].some(
      (k) =>
        (k.kind === 'alignment' && k.target === o && k.alignment === 'good') ||
        (k.kind === 'relationship' && k.subject === o && !isMotiveGrade(k.rel)),
    )
  for (const [c, t] of [...suspicionTarget]) {
    if (victims.includes(c) || !clears(c, t)) continue
    suspicionTarget.delete(c)
    grounds.delete(c)
    trusts.set(c, t)
  }
  // And whoever was paid says nothing against anybody.
  const withheld = bribed >= 0 ? knowledge[bribed].filter((k) => KEPT_BACK.has(k.kind)) : []
  if (bribed >= 0) {
    knowledge[bribed] = knowledge[bribed].filter((k) => !KEPT_BACK.has(k.kind))
    grounds.delete(bribed)
  }
  // ---- the murderer who kills again ----
  // Whoever knows most against them is dead by the third hour, in the room
  // where they spent the evening. It was done in a hurry, and something of the
  // murderer was left behind.
  if (kind === 'serial') {
    const knows = (c: CharId) =>
      knowledge[c].some(
        (k) =>
          (k.kind === 'sighting' && k.target === culprit) ||
          k.kind === 'glimpse' ||
          k.kind === 'culpritAttr' ||
          k.kind === 'among' ||
          (k.kind === 'alignment' && k.target === culprit) ||
          (k.kind === 'relationship' && k.subject === culprit),
      )
    // (Not anybody the murderer's friend has work for.)
    const spared = [bribed, whispered, framed]
    const living = honestIds.filter((c) => !spared.includes(c) && locations[c] !== sceneRoom)
    const marked = living.filter(knows)
    const pool = marked.length > 0 ? marked : living
    if (pool.length === 0) return 'no-seam'
    const victim = rng.pick(pool)
    const room = locations[victim]
    const round = Math.min(2, config.rounds - 1)
    evidence.push({
      id: 'second-body',
      room,
      name: (pack.secondBody ?? '{name}, dead — and silenced').replace('{name}', cast[victim].shortName),
      fact: { kind: 'killed', victim, room },
      from: round,
      plain: true,
    })
    const attr: AttrRef = tellingTrait && bySex ? bySex : byTrait
    evidence.push({
      id: 'second-trace',
      room,
      name:
        attr.kind === 'sex'
          ? (pack.secondTraceBySex?.[attr.sex] ?? 'a footprint in what was spilled')
          : (traitDef(attr.trait)?.evidenceName ?? 'a telltale trace'),
      fact: { kind: 'secondTrace', room, attr },
      from: round,
    })
    truth.second = { victim, room, round }
  }
  truth.murderer = kind
  truth.martyrLacks = martyrLacks
  /** Who will stand up at the last and say it was them. */
  const confessors = new Set<CharId>([
    ...(kind === 'regretful' ? [culprit] : []),
    ...(martyr >= 0 ? [martyr] : []),
  ])
  truth.whispered = whispered >= 0 ? whispered : null
  truth.bribed = bribed >= 0 ? bribed : null

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
      grounds,
      trusts,
      docReferralHolder,
      docRoom,
      weaponReferralHolder,
      weaponRoom: hintRoom ?? sceneRoom,
      quarrelHearer,
      confessors,
      bribe: bribed >= 0 ? { to: bribed, by: sponsor, withheld } : undefined,
      whisper: whispered >= 0 ? { to: whispered, by: whisperer } : undefined,
    }),
  )

  const caseSheet = {
    script: {
      innocents: [...script.innocents],
      herrings: [...script.herrings],
      helpers: [...script.helpers],
      herringCount: script.herringCount,
      ...(script.murderers ? { murderers: Object.keys(script.murderers) as MurdererKind[] } : {}),
    },
    ...(occasion ? { occasion: occasion.id } : {}),
    sceneRoom,
    victimName: pack.victim.name,
    windowLabel: pack.windowLabel,
    ...(passageNight ? { passageRooms: allRooms.filter((r) => r !== sceneRoom) } : {}),
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
  // Whoever is to be killed may never have been asked a thing: the night must
  // come out without a word of theirs but what they said before them all.
  const dead = truth.second?.victim ?? -1
  const heard =
    dead < 0
      ? spoken
      : [
          ...policies[dead].reaction.claims.map((claim) => ({ speaker: dead, claim })),
          ...spoken.filter((s) => s.speaker !== dead),
        ]
  const worlds = enumerateWorlds({ cast, caseSheet, spoken: heard, evidence: facts })
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
  // Whoever has been bought, or told what to say, can be brought to say so.
  for (const c of [bribed, whispered]) {
    if (c >= 0 && !pressableChars(contradictions).has(c)) return 'no-seam'
  }
  // The trio must be completable: some OPPORTUNITY-type contradiction breaks
  // the culprit's account of the window (means and motive are guaranteed by
  // the weapon and the motive document).
  // A culprit who owns to having been at the scene has given the opportunity away.
  // — and one who went by the passage has no need to lie about the hour at all.
  if (
    !playsHerring &&
    !viaPassage &&
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

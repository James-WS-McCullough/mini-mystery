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
  suicideDeck,
  hoaxDeck,
  committeeDeck,
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
  NightKind,
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
import { MOTIVE_GRADE, TEMPERAMENTS, isMotiveGrade, type Lifeline, type LifelineKind } from './types'

const DEFENSES: DefenseStyle[] = ['indignant', 'flustered', 'calm', 'selfdoubting']
const CONCEALER_STRATEGIES: Strategy[] = ['bluffer', 'deflector', 'hedger', 'evasive']
const HONEST_STRATEGIES: Strategy[] = ['open', 'accuser', 'theorist', 'reticent']
/** Roles the Drunk can sincerely believe themself to be. Never 'gossip': the
 *  solver treats an unreliable speaker's relationship claims as true, so their
 *  corrupted info must live in the discounted claim kinds. */
const DRUNK_BELIEFS: readonly RoleId[] = ['witness', 'discoverer', 'confidant', 'sleuth', 'steward']
/** How often one with something to hide has seen something, true and harmless. */
const LIAR_SAW = 0.4
/**
 * The parts whose knowledge the Careful Murderer can tell truly without
 * naming themselves: a count of two others, somebody's footing with the dead
 * man, an innocent vouched for, where the passage runs.
 */
const CAREFUL_TRUTHS: readonly RoleId[] = ['steward', 'gossip', 'confidant', 'architect', 'porter']
/** Whose silence is worth paying for, the likeliest first. */
const WORTH_BUYING: readonly RoleId[] = [
  'witness',
  'discoverer',
  'sleuth',
  'architect',
  'oracle',
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
  'passing',
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
  | 'no-lock'
  | 'no-seam'
  | 'no-passage'
  | 'sanity'
  | 'not-unique'
  | 'no-press-material'
  | 'no-opportunity-break'
  | 'careful-noticed'
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
    case 'passing':
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
  const kind = pickMurderer(new Rng(`${opts.seed}:murderer`), script, fixedDeck)
  // And whether a room is locked tonight, and whose papers are behind the door.
  const lockRoll = new Rng(`${opts.seed}:lock`)
  const lock = { tonight: lockRoll.chance(script.lockedRoom ?? 0), others: lockRoll.chance(0.5) }
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const rng = new Rng(`${opts.seed}:${attempt}`)
    const drawn = attempt < FIXED_DECK_ATTEMPTS ? fixedDeck : buildDeck(rng, script)
    const probe = { culprit: '' }
    // (A redrawn deck may have no friend for the Martyr's part; then nobody
    // owns to it. And the Cunning and the Careful Murderer lie alone: with a
    // friend to make the story, there is no part for them to play. Nor is
    // there a friend where there is no murderer.)
    const friend = drawn.some((r) => HELPERS.includes(r))
    const alone = kind === 'cunning' || kind === 'careful' || kind === 'suicide' || kind === 'hoax' || kind === 'committee'
    const tonight = (kind === 'regretful' && !friend) || (alone && friend) ? 'plain' : kind
    // Where he did it himself, one more of the suspicious sits in the
    // murderer's place — the same one, attempt after attempt.
    const deck =
      tonight === 'suicide'
        ? suicideDeck(new Rng(`${opts.seed}:suicide`), drawn, script)
        : tonight === 'hoax'
          ? hoaxDeck(new Rng(`${opts.seed}:hoax`), drawn, script)
          : tonight === 'committee'
            ? committeeDeck(new Rng(`${opts.seed}:committee`), script, drawn.length)
            : drawn
    if (!deck) {
      opts.onAttempt?.('cover-pool', drawn, probe.culprit)
      continue
    }
    const result = tryGenerate(rng, opts, deck, probe, tonight, lock)
    if (typeof result !== 'string') return { ...result, lifelines: hideLifelines(opts.seed, result, opts.pack.rooms.map((r) => r.id)) }
    opts.onAttempt?.(result, deck, probe.culprit)
  }
  throw new Error(`could not generate a solvable mystery for seed ${opts.seed}`)
}

/** How many lifelines a night hides. */
const LIFELINES_PER_NIGHT = 2
const LIFELINE_KINDS: LifelineKind[] = ['pike', 'coffee', 'telegram', 'expert', 'note']

/**
 * Two kinds of help, hidden in two rooms other than the scene. Drawn from a
 * line of the seed's own, so that the night itself comes out just as before.
 */
function hideLifelines(seed: number, m: Mystery, rooms: RoomId[]): Lifeline[] {
  const rng = new Rng(`${seed}:lifelines`)
  // (Nor behind a locked door.)
  const places = rng.shuffle(rooms.filter((r) => r !== m.caseSheet.sceneRoom && r !== m.truth.locked))
  const kinds = rng.shuffle([...LIFELINE_KINDS]).slice(0, LIFELINES_PER_NIGHT)
  return kinds.slice(0, places.length).map((kind, i) => ({ id: `lifeline-${kind}`, kind, room: places[i] }))
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
      policy.seen,
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
  kind: NightKind = 'plain',
  /** A room locked tonight; and whether it holds somebody else's papers rather than the murderer's. */
  lock: { tonight: boolean; others: boolean } = { tonight: false, others: false },
): Mystery | GenFailure {
  const pack = opts.pack
  const script = opts.script ?? CLASSIC_SCRIPT
  const config: GameConfig = {
    castSize: deck.length,
    rounds: 4,
    questionsPerRound: script.questionsPerRound ?? 7,
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
  /** He did it himself: there is no murderer tonight, and `culprit` is -1. */
  const suicide = kind === 'suicide'
  /** He is not dead: the Hoaxer helped him fake it. No murderer either. */
  const hoax = kind === 'hoax'
  const hoaxer = roles.indexOf('hoaxer')
  /** No murderer tonight, one way or the other. */
  const nobody = suicide || hoax
  /** Four did it together, and agreed one story: the Committee. */
  const committee = kind === 'committee'
  const members = roles.flatMap((r, i) => (r === 'committee' ? [i] : []))
  /** No one murderer: nobody did it, or four did. */
  const noSingle = nobody || committee
  const culprit = roles.indexOf('culprit')
  probe.culprit = culprit >= 0 ? defs[culprit].id : 'nobody'
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
  // (A death that is to look like his own doing, or was, is one he could
  // have done to himself.)
  const ownHand = suicide || kind === 'artful'
  const ways = pack.methods.filter(
    (m) => (!m.rooms || m.rooms.includes(sceneRoom)) && !(carried && m.rooms) && (!ownHand || m.selfInflicted),
  )
  if (ways.length === 0) return 'no-method'
  // A way that belongs to the place is likelier there than one that would do anywhere.
  const method = rng.pick(ways.flatMap((m) => (m.rooms ? [m, m] : [m])))
  const means = dealMeans(rng.fork('means'), defs, pack.means, {
    method: method.means,
    // (The Hoaxer could have done it, to look at: that is the point of them.)
    culprit: hoax ? hoaxer : committee ? members[0] : culprit,
    mustLack: roles.flatMap((r, i) =>
      r === 'begrudged' || (r === 'martyr' && martyrLacks === 'means') ? [i] : [],
    ),
    // (Every one of the Committee could have done it, and did.)
    mustHave: roles.flatMap((r, i) =>
      (r === 'martyr' && martyrLacks !== 'means') || r === 'committee' ? [i] : [],
    ),
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
  const alibiMade = roles.some((r) => r === 'perjurer' || r === 'forger' || r === 'whisperer')
  // (Nor the Cunning Murderer, whose lie about the hour is the whole of the
  // part; nor the Careful one, whose lie is to have been somewhere nobody was.)
  const careful = kind === 'careful'
  const viaPassage = passageNight && !alibiMade && kind !== 'cunning' && !careful && !noSingle && rng.chance(0.4)

  /** The murderer, where there is one. */
  const killer: CastMember | null = culprit >= 0 ? cast[culprit] : null
  /** Nobody else has the culprit's trait: to describe it would be to name them. */
  const tellingTrait = killer !== null && cast.filter((m) => m.trait === killer.trait).length < 2
  /** What can be said of the murderer by their sex — where that would not name them. */
  const bySex: AttrRef | null =
    killer !== null &&
    killer.pronouns !== 'they' &&
    cast.filter((m) => m.pronouns === killer.pronouns).length >= 3
      ? { kind: 'sex', sex: killer.pronouns }
      : null
  // (Nobody asks after the murderer's habits on a night with no murderer:
  // whoever would have, is not in the house.)
  const byTrait: AttrRef = { kind: 'trait', trait: (killer ?? cast[0]).trait }
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
  const perjurer = roles.indexOf('perjurer')
  const blackmailer = roles.indexOf('blackmailer')
  const amnesiac = roles.indexOf('amnesiac')
  const sweetheart = roles.indexOf('sweetheart')
  const collector = roles.indexOf('collector')
  const architect = roles.indexOf('architect')
  const porter = roles.indexOf('porter')
  const discoverer = roles.indexOf('discoverer')
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
  // Whoever had the cause: the murderer — or, on a night with none, somebody
  // who had every reason and did nothing about it. Their grudge is on paper.
  const motiveSubject = committee
    ? members[0]
    : nobody
      ? rng.pick(cast.map((m) => m.id).filter((c) => c !== loner && c !== begrudged && c !== hoaxer))
      : culprit
  relationships[motiveSubject] = motiveFor(motiveSubject)
  // Every one of the Committee had cause.
  for (const m of members) relationships[m] = motiveFor(m)
  if (begrudged >= 0) relationships[begrudged] = motiveFor(begrudged)
  // Whoever means to take the blame had cause enough — unless that is the very
  // thing they lacked, and then nobody was fonder of the dead man.
  if (martyr >= 0) relationships[martyr] = martyrLacks === 'motive' ? 'devoted' : motiveFor(martyr)
  const thiefMotive = thief >= 0 && rng.chance(0.5)
  // (Whoever's grudge is to be on paper keeps it.)
  if (thief >= 0 && thief !== motiveSubject) relationships[thief] = thiefMotive ? motiveFor(thief) : 'strained'
  // The loner's herring is opportunity, not motive: they stay benign.
  const strainCandidates = honestIds.filter((c) => c !== begrudged && c !== loner && c !== motiveSubject)
  if (strainCandidates.length > 0) relationships[rng.pick(strainCandidates)] = 'strained'
  const devotedCandidates = strainCandidates.filter((c) => relationships[c] === 'cordial')
  if (devotedCandidates.length > 0 && rng.chance(0.6)) {
    relationships[rng.pick(devotedCandidates)] = 'devoted'
  }
  // Whoever helped him fake it did so out of love for him, and had no cause to kill him.
  if (hoax) relationships[hoaxer] = 'devoted'

  // ---- geography: the murder window as one time slot ----
  const allRooms = pack.rooms.map((r) => r.id)
  const theftRoom = thief >= 0 ? rng.pick(pack.valuableRooms.filter((r) => r !== sceneRoom)) : null

  const locations: RoomId[] = new Array(n).fill('')
  const companions: CharId[][] = Array.from({ length: n }, () => [])
  if (!viaPassage && culprit >= 0) locations[culprit] = sceneRoom
  // The Committee spent the hour at the scene, all four of them.
  for (const m of members) locations[m] = sceneRoom
  // The Hoaxer spent the hour at the scene, setting it to look like murder.
  if (hoax) locations[hoaxer] = sceneRoom
  if (thief >= 0 && theftRoom) locations[thief] = theftRoom

  const freeRooms = rng.shuffle(allRooms.filter((r) => r !== sceneRoom && r !== theftRoom))
  // Held back before anybody is placed, so that there is one to lock: a room
  // with papers in it, on a night with a locked room; on a night he is not
  // dead, a room with nothing in it at all, for him to hide in.
  const held = rng.fork('held')
  const holdable =
    kind === 'hoax'
      ? freeRooms.filter((r) => !pack.docRooms.includes(r) && !pack.valuableRooms.includes(r))
      : lock.tonight
        ? freeRooms.filter((r) => pack.docRooms.includes(r))
        : []
  const heldRoom: RoomId | null = holdable.length > 0 ? held.pick(holdable) : null
  if (heldRoom !== null) freeRooms.splice(freeRooms.indexOf(heldRoom), 1)
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
  // The Red Herring looked in at the scene within the hour, and was gone
  // before it was done: somebody saw them there. The hour itself they spent
  // alone in a room of their own — which will bear them out, once pressed.
  if (redherring >= 0 && !together([redherring])) return 'rooms-exhausted'
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
    [culprit, hoaxer, ...members, thief, companion, companionOf, sweetheart, sweetheartOf, helper, martyrOf, loner, amnesiac, redherring].filter(
      (x) => x >= 0,
    ),
  )
  const floaters = cast.map((m) => m.id).filter((c) => !placed.has(c))
  const floaterGroups: CharId[][] = []
  if (loner >= 0) floaterGroups.push([loner]) // the loner is always, definitionally, alone
  if (amnesiac >= 0) floaterGroups.push([amnesiac]) // and nobody can say where the amnesiac was
  // On a night with a passage, somebody honest is alone at the end of it (if
  // the murderer did not go by it): kept out of any pair.
  const passageEnd =
    passageNight && !viaPassage
      ? floaters.find((c) => truthClassOf(roles[c]) === 'honest' && c !== amnesiac && c !== loner)
      : undefined
  const pairable = floaters.filter((c) => c !== passageEnd)
  if (pairable.length >= 2 && rng.chance(0.5)) {
    const pair = rng.sample(pairable, 2)
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
  const quarrelParticipant = noSingle
    ? rng.pick(quarrelCandidates.length > 0 ? quarrelCandidates : [motiveSubject])
    : quarrelCandidates.length === 0 || rng.chance(0.5)
      ? culprit
      : rng.pick(quarrelCandidates)

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
    corridor: null,
    ...(occasion ? { occasion: occasion.id } : {}),
    ...(suicide ? { suicide: true } : {}),
    ...(hoax ? { hoax: true } : {}),
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
  // A note beside him, to say he did it himself. Where he truly did, it is
  // in his own hand; where the Artful Murderer did it for him, it is not.
  if (ownHand) {
    evidence.push({
      id: 'note',
      room: sceneRoom,
      name: pack.suicideNote ?? 'a note beside him: “Forgive me.”',
      fact: { kind: 'suicideNote' },
    })
  }
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
    if ((liesAboutWhereabouts(roles[c]) && !wentByPassage) || c === loner) continue
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
  // Every other box worth forcing is found as it should be: proof, if anybody
  // owns to a theft in that room, that there was none.
  for (const room of pack.valuableRooms) {
    if (room === theftRoom || room === sceneRoom) continue
    evidence.push({
      id: `lockbox-${room}`,
      room,
      name: 'a lockbox, locked and untouched',
      fact: { kind: 'lockboxIntact', room },
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
  // ---- a locked room ----
  // A room with papers in it is locked tonight, and its key has gone missing:
  // nothing in it can be found until the key is. Nobody spent the hour in it.
  // Whose papers, the murderer's or another's, is a toss: the locked door
  // must not say which. (The details are drawn from a stream of their own;
  // forking it moves the main stream on by one draw, like any fork.)
  const lockRng = rng.fork('lock')
  // (On a night he is not dead, the locked door is his own, and holds no papers.)
  const lockTonight = lock.tonight && !hoax
  const lockOthers = lock.others
  const occupied = new Set(locations)
  const lockable = (r: RoomId) => r !== sceneRoom && r !== theftRoom && r !== passageRoom && !occupied.has(r)
  // A second motive document for a red herring with a grudge of their own.
  // (On the Committee's night, a second of them: their cause was shared.)
  // Settled before any paper is put anywhere, so that the room held back for
  // the locked door is the one the locked papers go into.
  const herringDocSubject =
    committee ? members[1] : martyr >= 0 ? martyr : begrudged >= 0 ? begrudged : thiefMotive ? thief : -1
  // (How the one who takes the blame stood with him is always on paper: it
  // is what shows them to have had cause — or none.)
  const herringDoc =
    herringDocSubject >= 0 && pack.docRooms.length > 1 && (martyr >= 0 || rng.chance(0.7))
  /** Whose papers go behind the locked door: another's, where there are any. */
  const lockHerring = lockTonight && lockOthers && herringDoc
  const behindTheDoor = lockTonight && heldRoom !== null ? heldRoom : null
  const docRoom =
    behindTheDoor !== null && !lockHerring
      ? behindTheDoor
      : rng.pick(pack.docRooms.filter((r) => r !== behindTheDoor))
  evidence.push({
    id: 'doc-motive',
    room: docRoom,
    name: motiveItem(relationships[motiveSubject]),
    fact: { kind: 'motiveDocument', subject: motiveSubject, rel: relationships[motiveSubject] },
  })
  // Something he truly wrote, among his papers: set beside the note, it shows
  // the note for a forgery. Where the note is his own, there is nothing of
  // the kind to be found.
  if (kind === 'artful') {
    evidence.push({
      id: 'hand',
      room: docRoom,
      name: (pack.handSample ?? 'a letter in {victim}’s own hand').replace('{victim}', pack.victim.shortName),
      fact: { kind: 'handSample' },
    })
  }
  let herringRoom: RoomId | null = null
  if (herringDoc) {
    const elsewhere = pack.docRooms.filter((r) => r !== docRoom && r !== behindTheDoor)
    herringRoom =
      lockHerring && behindTheDoor !== null
        ? behindTheDoor
        : rng.pick(elsewhere.length > 0 ? elsewhere : pack.docRooms.filter((r) => r !== docRoom))
    evidence.push({
      id: 'doc-herring',
      room: herringRoom,
      name: motiveItem(relationships[herringDocSubject]),
      fact: {
        kind: 'motiveDocument',
        subject: herringDocSubject,
        rel: relationships[herringDocSubject],
      },
    })
  }
  // How his lordship stood with whoever helped him fake it: on paper.
  if (hoax) {
    evidence.push({
      id: 'doc-fond',
      room: rng.pick(pack.docRooms),
      name: motiveItem('devoted'),
      fact: { kind: 'motiveDocument', subject: hoaxer, rel: 'devoted' },
    })
  }
  let locked: RoomId | null = null
  if (hoax) {
    // He is behind a locked door, and has the only key: nobody has seen it,
    // and nobody will find it. Nobody else was in there, and nothing else is.
    const papered = new Set(evidence.map((e) => e.room))
    const hiding = allRooms.filter((r) => lockable(r) && !papered.has(r))
    if (hiding.length === 0) return 'no-lock'
    locked = lockRng.pick(hiding)
    truth.locked = locked
  } else if (lockTonight) {
    const order = lockOthers ? [herringRoom, docRoom] : [docRoom, herringRoom]
    locked = order.find((r): r is RoomId => r !== null && lockable(r)) ?? null
    // (Every room with papers in it was in use: try the night another way.)
    if (locked === null) return 'no-lock'
    {
      const where = lockRng.pick(allRooms.filter((r) => r !== locked && r !== sceneRoom))
      const name = pack.rooms.find((r) => r.id === locked)?.name ?? locked
      evidence.push({
        id: 'key',
        room: where,
        name: (pack.keyItem ?? 'the key to {room}, on a brass ring').replace('{room}', name),
        fact: { kind: 'key', room: locked },
      })
      truth.locked = locked
    }
  }
  const evidencedRooms = new Set(evidence.map((e) => e.room))
  // (Nothing is left lying behind a door nobody will open.)
  for (const room of rng.sample(allRooms.filter((r) => !evidencedRooms.has(r) && !(hoax && r === locked)), 2)) {
    evidence.push({ id: `flavor-${room}`, room, name: rng.pick(pack.flavorItems), fact: { kind: 'flavor' } })
  }

  // The Collector took something up before the detective could find it: a
  // trace, which now bears nobody out until the Collector has been asked.
  // Never their own — from where they spent the hour, or fitting them — or the
  // one honest guest who hands things over would look just like the Forger.
  // Or the key, half the time, where there is a locked room.
  const keyItem = evidence.find((e) => e.id === 'key')
  if (collector >= 0 && keyItem && keyItem.room !== locations[collector] && lockRng.chance(0.5)) {
    keyItem.heldBy = collector
  } else if (collector >= 0) {
    const traces = evidence.filter(
      (e) =>
        e.fact.kind === 'trace' &&
        e.room !== locations[collector] &&
        !(e.fact.attr.kind === 'trait' && e.fact.attr.trait === cast[collector].trait),
    )
    if (traces.length > 0) {
      const taken = rng.pick(traces)
      taken.heldBy = collector
      if (taken.fact.kind === 'trace') taken.fact = { ...taken.fact, givenBy: collector }
    }
  }

  // ---- knowledge: who truly knows what ----
  const knowledge: Claim[][] = Array.from({ length: n }, () => [])
  /**
   * What they happened to see or hear, beside anything their role tells them:
   * given up when asked what they have seen, and not when asked their role.
   */
  const incidental = new Set<Claim>()
  const saw = (c: CharId, claim: Claim) => {
    knowledge[c].push(claim)
    incidental.add(claim)
  }

  if (witness >= 0) {
    // A full identification only on two-liar nights; otherwise a glimpse.
    // (Nobody saw the murderer at the scene who came and went through the wall,
    // nor the Careful one, who made sure of it.)
    const full = !singleLiar && !viaPassage && !careful && rng.chance(0.35)
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
  if (discoverer >= 0) {
    // Found him living, for a moment: a last word, or a last sign.
    const attr: AttrRef = bySex && (tellingTrait || rng.chance(singleLiar ? 0.85 : 0.7)) ? bySex : byTrait
    knowledge[discoverer].push({ kind: 'culpritAttr', attr, dying: true })
  }
  if (oracle >= 0) {
    // Passed somebody in the corridor, coming away from the scene: the
    // murderer half the time, else whoever else had been that way — the Red
    // Herring, or anybody. A lead, and nothing more.
    const others = cast.map((m) => m.id).filter((c) => c !== oracle && c !== culprit)
    const target =
      rng.chance(0.5) || others.length === 0
        ? culprit
        : redherring >= 0 && redherring !== oracle && rng.chance(0.5)
          ? redherring
          : rng.pick(others)
    if (target !== oracle) {
      knowledge[oracle].push({ kind: 'passing', target })
      truth.corridor = target
    }
  }
  if (confidant >= 0) {
    // Biased toward exonerating whoever tonight's herrings are; never handed
    // the culprit outright on a single-liar night.
    const herringPresent = shadyIds.filter((x) => x !== perjurer)
    const roll = rng.next()
    let target: CharId
    if (herringPresent.length > 0 && roll < 0.4) target = rng.pick(herringPresent)
    else if (!singleLiar && culprit >= 0 && roll < 0.55) target = culprit
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
  for (const v of victims) saw(v, { kind: 'blackmailed', by: blackmailer })
  if (cleaner >= 0) {
    // Somebody saw the Cleaner where the Cleaner truly was — which is where
    // the weapon is, and not where the Cleaner will say.
    const seers = honestIds.filter((c) => !companions[c].includes(cleaner))
    if (seers.length > 0) {
      saw(rng.pick(seers), { kind: 'sighting', target: cleaner, room: locations[cleaner] })
    }
  }
  if (redherring >= 0) {
    // Somebody saw them at the scene, within the hour. It is a true sighting,
    // and it looks exactly like one of the murderer — and the Red Herring,
    // who says truly they spent the hour elsewhere, will not mention it.
    if (honestIds.length === 0) return 'no-seam'
    saw(rng.pick(honestIds), { kind: 'sighting', target: redherring, room: sceneRoom })
  }
  // Sounds in the house: the theft's crash; the afternoon quarrel.
  let crashHearer = -1
  if (thief >= 0 && theftRoom) {
    crashHearer = rng.pick(honestIds)
    saw(crashHearer, { kind: 'heard', sound: 'crash', room: theftRoom })
  }
  // The quarrel and its meaning: the Gossip's power when present, else a
  // random honest guest overheard it.
  const quarrelHearer =
    gossip >= 0
      ? gossip
      : rng.pick(honestIds.filter((c) => c !== crashHearer && c !== quarrelParticipant))
  // (The Gossip hears it by their role; anybody else, by chance.)
  const overheard = gossip >= 0 ? (c: CharId, k: Claim) => knowledge[c].push(k) : saw
  overheard(quarrelHearer, { kind: 'heard', sound: event, room: sceneRoom })
  overheard(quarrelHearer, {
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
  // Somebody knew how fond of him the Hoaxer was, and will say so.
  if (hoax && rng.chance(0.5)) {
    const knew = honestIds.filter((c) => c !== quarrelHearer)
    if (knew.length > 0) saw(rng.pick(knew), { kind: 'relationship', subject: hoaxer, rel: 'devoted' })
  }
  // Incidental sightings (always true): the thief glimpsed near the theft;
  // someone corroborates an innocent. Nobody ever vouches for the loner.
  if (thief >= 0 && theftRoom && rng.chance(0.75)) {
    const seer = rng.pick(honestIds)
    saw(seer, { kind: 'sighting', target: thief, room: theftRoom })
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
          !members.includes(c) &&
          !companions[seer].includes(c),
      )
    if (targets.length > 0) {
      const target = rng.pick(targets)
      saw(seer, { kind: 'sighting', target, room: locations[target] })
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
  // Somebody honest has seen the key: where it lies, or who picked it up.
  let keyHint: { by: CharId; locked: RoomId; room?: RoomId; holder?: CharId } | undefined
  if (locked !== null && keyItem) {
    const holder = keyItem.heldBy
    const seers = honestIds.filter(
      (c) => c !== holder && c !== bribed && c !== docReferralHolder && c !== weaponReferralHolder,
    )
    const pool = seers.length > 0 ? seers : honestIds.filter((c) => c !== holder)
    if (pool.length === 0) return 'no-seam'
    // The Porter keeps the keys, and knows where one has gone, where there is a
    // Porter (and not the one holding it); otherwise somebody else saw.
    const porterSaw = porter >= 0 && porter !== holder && porter !== bribed
    keyHint = {
      by: porterSaw ? porter : lockRng.pick(pool),
      locked,
      ...(holder !== undefined ? { holder } : { room: keyItem.room }),
    }
  }

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
  // The Perjurer passes for the Companion, and has nothing to tell but the
  // alibi; the Forger for the Collector, with something to hand over.
  if (perjurer >= 0) coverRoles.set(perjurer, 'alibi')
  if (forger >= 0) coverRoles.set(forger, 'collector')
  // The murderer may take the Red Herring's part when pressed: "I looked in,
  // yes, and he was alive when I left — and then I went to <the room they
  // lie about>." The Red Herring, pressed, says the same, and the room bears
  // them out; it does not bear out the murderer.
  // Or the Thief's ("I was robbing the box in that room, and that is why I
  // lied") or the Blackmailer's ("I have been bleeding half the house"): a
  // bad role, owned to, that would explain the lie — a double bluff. Each has
  // its tell: the box in the room they name is untouched, or the forced one
  // is elsewhere; and nobody in the house says they were bled by them, while
  // the Blackmailer says truly where they were, which this one cannot.
  // This is the Cunning Murderer's part, and nobody else's.
  const acts = (['herring', 'thief', 'blackmailer'] as const).filter((a) =>
    script.herrings.includes(a === 'herring' ? 'redherring' : a),
  )
  const act = kind === 'cunning' && helper < 0 && !viaPassage && acts.length > 0 ? rng.pick(acts) : null
  const playsThief = act === 'thief'

  // The Framer has chosen somebody who spent the hour alone, honestly, and
  // has taken away whatever of theirs was left in that room: nothing bears
  // their account out now. And the Framer saw them at the scene — so the
  // Framer will say. Nothing is found of it; there is only the gap where an
  // alibi should be.
  let framed = -1
  if (framer >= 0) {
    const standing = honestIds.filter(
      (c) =>
        c !== redherring &&
        // (Nobody alone at the end of the passage: their account clears nobody.)
        locations[c] !== passageRoom &&
        c !== amnesiac &&
        companions[c].length === 0 &&
        traceRooms.has(locations[c]),
    )
    if (standing.length === 0) return 'no-frame'
    framed = rng.pick(standing)
    const taken = evidence.findIndex((e) => e.id === `trace-${locations[framed]}`)
    if (taken >= 0) evidence.splice(taken, 1)
    traceRooms.delete(locations[framed])
    if (script.innocents.includes('witness')) coverRoles.set(framer, 'witness')
    fabricated.set(framer, { kind: 'sighting', target: framed, room: sceneRoom })
    cast[framer].strategy = 'deflector'
  }
  // The Hoaxer, too, has somebody to put it on: one whose own account will
  // stand, seen at the scene (so the Hoaxer says), and named when asked.
  let hoaxed = -1
  if (hoax) {
    const standing = honestIds.filter(
      (c) =>
        c !== redherring &&
        c !== amnesiac &&
        locations[c] !== passageRoom &&
        (companions[c].length > 0
          ? companions[c].every((o) => truthClassOf(roles[o]) === 'honest')
          : traceRooms.has(locations[c])),
    )
    if (standing.length === 0) return 'no-frame'
    hoaxed = rng.pick(standing)
    if (script.innocents.includes('witness')) coverRoles.set(hoaxer, 'witness')
    fabricated.set(hoaxer, { kind: 'sighting', target: hoaxed, room: sceneRoom })
    cast[hoaxer].strategy = 'deflector'
  }
  // The Careful Murderer is somebody nobody at the table is: no honest guest
  // will say the same, nor any other liar, nor the Drunk in their cups. And
  // what they tell of the part is true, where the truth of it would not name
  // them: they lie about themselves, and about nobody else.
  if (careful) {
    const free = coverPool.filter((r) => !roles.includes(r) && r !== truth.drunkBelievedRole)
    const truthful = free.filter(
      (r) => CAREFUL_TRUTHS.includes(r) && (r !== 'architect' || passageRoom !== null),
    )
    const cover = truthful.length > 0 ? rng.pick(truthful) : free.length > 0 ? rng.pick(free) : null
    if (cover === null) return 'cover-pool'
    coverRoles.set(culprit, cover)
    const others = cast.map((m) => m.id).filter((c) => c !== culprit)
    const told: Claim | null = !truthful.includes(cover)
      ? fabricateInfo(rng, cover, cast, roles, relationships, culprit, culprit, sceneRoom, defs.map(motivesOf),
          passageRoom !== null
            ? { rooms: allRooms.filter((r) => r !== sceneRoom), truly: passageRoom, used: false }
            : undefined,
          truth.corridor ?? null,
          { all: allRooms, used: new Set(locations) })
      : cover === 'steward'
        ? (() => {
            const pair = watched(rng, cast, culprit)
            return { kind: 'liarsAmong', pair, count: pair.filter((c) => liesAboutWhereabouts(roles[c])).length }
          })()
        : cover === 'gossip'
          ? (() => {
              const subject = rng.pick(others)
              return { kind: 'relationship', subject, rel: relationships[subject] }
            })()
          : cover === 'confidant'
            ? { kind: 'alignment', target: rng.pick(others), alignment: 'good' }
            : cover === 'porter'
              ? (() => {
                  // A room somebody truly had: a room said to be in use gives nobody the lie.
                  const had = others.map((c) => locations[c]).filter((r) => r !== sceneRoom)
                  return had.length > 0 ? { kind: 'roomState', room: rng.pick(had), occupied: true } : null
                })()
              : { kind: 'passage', room: passageRoom! }
    if (!told) return 'fabrication'
    fabricated.set(culprit, told)
  }
  // ---- the Committee's story ----
  // Four did it, and agreed beforehand where each of them was, and who each
  // of them is. The story holds between them: pairs who vouch for each other,
  // and those alone seen where they say by another of them, or borne out by a
  // trace one of them hands over as the Collector. It breaks only against the
  // honest three: a room one of them truly had, a part one of them truly
  // plays. And they put it on one of the three: seen at the scene, and with a
  // grudge, so they say; who has an alibi of their own, and a letter to show
  // how fond of him they were.
  const committeeLies = new Map<CharId, { room: RoomId; companions: CharId[] }>()
  let smeared = -1
  if (committee) {
    const cr = rng.fork('committee')
    const honest = cast.map((m) => m.id).filter((c) => !members.includes(c))
    const standing = honest.filter(
      (c) =>
        locations[c] !== passageRoom &&
        (companions[c].length > 0 ? companions[c].every((o) => !members.includes(o)) : traceRooms.has(locations[c])),
    )
    if (standing.length === 0) return 'no-frame'
    smeared = cr.pick(standing)
    // Pairs and those alone.
    const order = cr.shuffle([...members])
    const shape = cr.pick([[2, 1, 1], [2, 2], [1, 1, 1, 1], [2, 1, 1]])
    const units: CharId[][] = []
    let at = 0
    for (const size of shape) {
      units.push(order.slice(at, at + size))
      at += size
    }
    // Where they say they were: one unit, at least, in a room an honest guest
    // truly had alone (not the one they smear); the rest where nobody was.
    const honestAlone = cr.shuffle(
      honest.filter((c) => c !== smeared && companions[c].length === 0).map((c) => locations[c]),
    )
    const taken = new Set(locations.filter((r) => r !== ''))
    const empty = cr.shuffle(
      allRooms.filter((r) => r !== sceneRoom && r !== locked && r !== theftRoom && r !== passageRoom && !taken.has(r)),
    )
    const clash = honestAlone.length > 0 && cr.chance(0.75)
    // (Where the empty rooms run out, another room an honest guest had: one
    // more place the story breaks.)
    const spareClash = honestAlone.slice(clash ? 1 : 0)
    units.forEach((unit, i) => {
      const room = i === 0 && clash ? honestAlone[0] : (empty.pop() ?? spareClash.shift())
      if (!room) return
      for (const c of unit) committeeLies.set(c, { room, companions: unit.filter((o) => o !== c) })
    })
    if (committeeLies.size !== members.length) return 'lie-room'
    // Who they claim to be: parts that tell nothing against one another.
    const can = (r: RoleId) => script.innocents.includes(r)
    const honestRoles = new Set(honest.map((c) => roles[c]))
    const covers: RoleId[] = []
    const pairMember = units.find((u) => u.length === 2)?.[0]
    // One saw the smeared guest at the scene; one knows of a grudge.
    if (can('witness')) covers.push('witness')
    if (can('gossip')) covers.push('gossip')
    const spare = cr.shuffle((['collector', 'confidant', 'alibi'] as RoleId[]).filter(can))
    covers.push(...spare)
    // Where the rooms did not clash, a part must: one of the honest three's own.
    if (!clash) {
      const theirs = covers.find((r) => honestRoles.has(r))
      if (!theirs) {
        const steal = cr.shuffle([...honestRoles]).find((r) => r !== null && !covers.includes(r))
        if (!steal) return 'cover-pool'
        covers.splice(Math.min(2, covers.length), 0, steal)
      } else if (covers.indexOf(theirs) >= members.length) {
        covers.splice(covers.indexOf(theirs), 1)
        covers.splice(Math.min(2, covers.length), 0, theirs)
      }
    }
    if (covers.length < members.length) return 'cover-pool'
    // The Companion's part goes to one of a pair, where there is a pair.
    const parts = covers.slice(0, members.length)
    const seats = cr.shuffle([...members])
    const alibiAt = parts.indexOf('alibi')
    if (alibiAt >= 0 && pairMember !== undefined) {
      const j = seats.indexOf(pairMember)
      ;[seats[alibiAt], seats[j]] = [seats[j], seats[alibiAt]]
    }
    seats.forEach((c, i) => {
      coverRoles.set(c, parts[i])
      cast[c].strategy = cr.pick(CONCEALER_STRATEGIES)
    })
    const holder = (r: RoleId) => seats[parts.indexOf(r)]
    // The smear.
    if (parts.includes('witness')) {
      fabricated.set(holder('witness'), { kind: 'sighting', target: smeared, room: sceneRoom })
    }
    if (parts.includes('gossip')) {
      const fake = motivesOf(defs[smeared])
      fabricated.set(holder('gossip'), { kind: 'relationship', subject: smeared, rel: cr.pick(fake) })
      // And the truth of it, on paper: nobody was fonder of him.
      relationships[smeared] = 'devoted'
      evidence.push({
        id: 'doc-fond',
        room: cr.pick(pack.docRooms.filter((r) => r !== locked)),
        name: motiveItem('devoted'),
        fact: { kind: 'motiveDocument', subject: smeared, rel: 'devoted' },
      })
    }
    // The Confidant's word for one of their own.
    if (parts.includes('confidant')) {
      const c = holder('confidant')
      fabricated.set(c, { kind: 'alignment', target: cr.pick(members.filter((o) => o !== c)), alignment: 'good' })
    }
    // Those alone are seen where they say, by another of them; or the
    // Collector hands over a trace that bears them out.
    const alone = units.filter((u) => u.length === 1).map((u) => u[0])
    const collector = parts.includes('collector') ? holder('collector') : -1
    const backed = alone.find((c) => c !== collector && !honestAlone.includes(committeeLies.get(c)!.room))
    if (collector >= 0 && backed !== undefined) {
      const room = committeeLies.get(backed)!.room
      evidence.push({
        id: 'trace-committee',
        room,
        name: traitDef(cast[backed].trait)?.evidenceName ?? 'a telltale trace',
        fact: { kind: 'trace', room, attr: { kind: 'trait', trait: cast[backed].trait }, givenBy: collector },
        heldBy: collector,
        forged: true,
      })
    }
    for (const c of alone) {
      if (c === backed && collector >= 0) continue
      const seer = cr.pick(members.filter((o) => o !== c))
      saw(seer, { kind: 'sighting', target: c, room: committeeLies.get(c)!.room })
    }
  }
  const bluffers = cast
    .map((m) => m.id)
    .filter((c) => liesAboutRole(roles[c]) && !coverRoles.has(c))
  // (Not the Careful Murderer's part: that one is nobody's.)
  const covers = coverPool.filter((r) => !careful || r !== coverRoles.get(culprit))
  if (covers.length === 0) return 'cover-pool'
  bluffers.forEach((c, i) => {
    const cover = covers[i % covers.length]
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
        ? { rooms: allRooms.filter((r) => r !== sceneRoom), truly: passageRoom, used: viaPassage }
        : undefined,
      truth.corridor ?? null,
      { all: allRooms, used: new Set(locations) },
    )
    if (!fab) return
    fabricated.set(c, fab)
  })
  if (bluffers.some((c) => !fabricated.has(c))) return 'fabrication'

  const occupiedRooms = new Set(locations.filter((r) => r !== ''))
  const lies = new Map<CharId, { room: RoomId; companions: CharId[] }>(committeeLies)
  /** Rooms where somebody honest truly spent the hour alone, and will say so. */
  const kept = rng.shuffle(
    cast
      .map((m) => m.id)
      .filter(
        (c) => truthClassOf(roles[c]) === 'honest' && c !== amnesiac && companions[c].length === 0,
      )
      .map((c) => locations[c]),
  )
  // The best account is the true one: alone, in the room at the end of the passage.
  if (viaPassage) lies.set(culprit, { room: locations[culprit], companions: [] })
  if (playsThief) {
    // A room worth robbing, and not the one that was robbed — nor one whose
    // trace would fit them.
    const rooms = rng.shuffle(
      pack.valuableRooms.filter(
        (r) => r !== sceneRoom && r !== theftRoom && r !== locked && traceRooms.get(r) !== cast[culprit].trait,
      ),
    )
    // Occupied for choice: that collision is the opportunity-breaking contradiction.
    const room = rooms.find((r) => occupiedRooms.has(r)) ?? rooms[0]
    if (!room) return 'lie-room'
    lies.set(culprit, { room, companions: [] })
  }
  if (perjurer >= 0) {
    // Each swears the other was beside them — in a room they chose badly:
    // somebody was there, alone, and the room will bear that somebody out.
    const room = kept.find((r) => traceRooms.has(r)) ?? kept[0]
    if (!room) return 'lie-room'
    lies.set(perjurer, { room, companions: [culprit] })
    lies.set(culprit, { room, companions: [perjurer] })
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
    // (Not the one who keeps the Sweetheart's secret: one lie to a mouth.)
    const mouths = honestIds.filter((c) => locations[c] !== room && c !== bribed && c !== sweetheartOf)
    if (mouths.length === 0) return 'no-seam'
    whispered = rng.pick(mouths)
    saw(whispered, { kind: 'sighting', target: culprit, room })
  }
  if (sweetheart >= 0) {
    // Alone, they say, and somewhere else — and the one they were with says
    // they were alone too, where they truly were. Somebody honest saw the
    // Sweetheart where they really spent the hour, which gives both the lie.
    const room = rng
      .shuffle(allRooms)
      .find(
        (r) =>
          r !== sceneRoom &&
          r !== theftRoom &&
          r !== locked &&
          r !== locations[sweetheart] &&
          traceRooms.get(r) !== cast[sweetheart].trait,
      )
    if (!room) return 'lie-room'
    lies.set(sweetheart, { room, companions: [] })
    const seers = honestIds.filter((c) => c !== sweetheartOf && locations[c] !== locations[sweetheart])
    if (seers.length === 0) return 'no-seam'
    saw(rng.pick(seers), { kind: 'sighting', target: sweetheart, room: locations[sweetheart] })
  }
  if (forger >= 0) {
    // Made to order: the murderer's own mark, in the room the murderer means
    // to claim — an empty one, where nothing true can gainsay it.
    const empty = rng.shuffle(
      allRooms.filter((r) => !occupiedRooms.has(r) && r !== sceneRoom && r !== theftRoom && r !== locked),
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
    // (The Careful Murderer chooses first, and nobody else chooses the same.)
    .sort((a, b) => Number(careful && b === culprit) - Number(careful && a === culprit))
  for (const c of loneLiars) {
    // A liar never claims a room holding a trace that would fit them: a trace
    // that bears out an account must always be bearing out a true one.
    const fitsMe = (r: RoomId) => traceRooms.get(r) === cast[c].trait
    // Nor the scene itself, though nobody was in it (as when the murderer came
    // by the passage): nobody innocent of it would put themselves there.
    const carefulRoom = careful && c !== culprit ? lies.get(culprit)?.room : undefined
    // Nor a room that was locked all evening.
    const emptyRooms = allRooms.filter(
      (r) => !occupiedRooms.has(r) && r !== sceneRoom && r !== carefulRoom && r !== locked,
    )
    // The Careful Murderer was somewhere nobody was, nor was robbed: no
    // account in the house will meet theirs.
    if (careful && c === culprit) {
      const quiet = emptyRooms.filter((r) => r !== theftRoom)
      if (quiet.length === 0) return 'lie-room'
      lies.set(c, { room: rng.pick(quiet), companions: [] })
      continue
    }
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
    const preferred = rng.chance(occupiedChance) && occupiedOptions.length > 0 ? occupiedOptions : emptyRooms
    // (Where the one kind of room is all taken, the other will do.)
    const pool = preferred.length > 0 ? preferred : occupiedOptions.length > 0 ? occupiedOptions : emptyRooms
    if (pool.length === 0) return 'lie-room'
    lies.set(c, { room: rng.pick(pool), companions: [] })
  }

  // The Porter knows the rooms: whether one stood empty all hour, or was in
  // use. Most often a room somebody says, falsely, they were in alone (it stood
  // empty), or one they say they were in that somebody else truly had.
  if (porter >= 0) {
    const pr = rng.fork('porter')
    // (Never the room the Careful Murderer says they had: nobody's account catches them.)
    const hidden = careful ? lies.get(culprit)?.room : undefined
    const open = (r: RoomId) => r !== sceneRoom && r !== locations[porter] && r !== hidden
    const claimed = [...lies.values()].map((l) => l.room).filter(open)
    const rooms = allRooms.filter(open)
    const room = claimed.length > 0 && pr.chance(0.7) ? pr.pick(claimed) : pr.pick(rooms)
    knowledge[porter].push({ kind: 'roomState', room, occupied: locations.includes(room) })
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
  // The Framer has one name to give, and gives it; and so has the Hoaxer.
  if (framer >= 0 && framed >= 0) {
    suspicionTarget.set(framer, framed)
    trusts.delete(framer)
  }
  // The Committee all point at the one they agreed on.
  if (committee && smeared >= 0) {
    for (const m of members) {
      suspicionTarget.set(m, smeared)
      trusts.delete(m)
      grounds.delete(m)
    }
  }
  if (hoax && hoaxed >= 0) {
    suspicionTarget.set(hoaxer, hoaxed)
    trusts.delete(hoaxer)
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
  // where they spent the evening. The murderer leaves nothing of themselves:
  // they are a harder murderer, and are caught without the dead.
  if (kind === 'serial') {
    const knows = (c: CharId) =>
      knowledge[c].some(
        (k) =>
          (k.kind === 'sighting' && k.target === culprit) ||
          k.kind === 'glimpse' ||
          k.kind === 'culpritAttr' ||
          k.kind === 'among' ||
          (k.kind === 'passing' && k.target === culprit) ||
          (k.kind === 'alignment' && k.target === culprit) ||
          (k.kind === 'relationship' && k.subject === culprit),
      )
    // (Not anybody the murderer's friend has work for; nor whoever has the
    // key to the locked room, or knows where it lies: the door must open.)
    const spared = [bribed, whispered, framed, keyItem?.heldBy ?? -1, keyHint?.by ?? -1]
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
      name: (pack.secondBody ?? '{name}, dead and silenced').replace('{name}', cast[victim].shortName),
      fact: { kind: 'killed', victim, room },
      from: round,
      plain: true,
    })
    truth.second = { victim, room, round }
  }
  if (!nobody) truth.murderer = kind as MurdererKind
  if (committee) {
    truth.committee = members
    truth.smeared = smeared
  }
  truth.martyrLacks = martyrLacks
  /** Who will stand up at the last and say it was them. */
  const confessors = new Set<CharId>([
    ...(kind === 'regretful' ? [culprit] : []),
    ...(martyr >= 0 ? [martyr] : []),
  ])
  truth.whispered = whispered >= 0 ? whispered : null
  truth.framed = framed >= 0 ? framed : null
  if (hoax) truth.hoaxed = hoaxed
  truth.bribed = bribed >= 0 ? bribed : null
  truth.sweetheartOf = sweetheartOf >= 0 ? sweetheartOf : null

  // Those with something to hide saw things too, now and then — something true
  // and harmless, of a guest where they truly were — so having seen something
  // marks nobody out as honest.
  const seeable = cast
    .map((m) => m.id)
    .filter(
      (t) =>
        truthClassOf(roles[t]) === 'honest' &&
        !liesAboutWhereabouts(roles[t]) &&
        ![loner, amnesiac, sweetheart, sweetheartOf, redherring].includes(t),
    )
  for (const m of cast) {
    const c = m.id
    const hiding = liesAboutRole(roles[c]) || truthClassOf(roles[c]) === 'unreliable'
    if (!hiding || !rng.chance(LIAR_SAW)) continue
    // (The Careful Murderer saw nothing worth the mention, and says so; nor
    // does the Committee say anything beyond the story it agreed.)
    if (careful && c === culprit) continue
    if (members.includes(c)) continue
    const targets = seeable.filter((t) => t !== c && !companions[c].includes(t))
    if (targets.length === 0) continue
    const target = rng.pick(targets)
    saw(c, { kind: 'sighting', target, room: locations[target] })
  }

  // ---- statement policies ----
  const policyContext = {
      cast,
      truth,
      evidence,
      knowledge,
      incidental,
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
      act: act ?? undefined,
      sweetheartOf: sweetheartOf >= 0 ? sweetheartOf : undefined,
      keyHint,
    }
  const policies: Policy[] = cast.map((m) => buildPolicy(m.id, policyContext))

  const caseSheet = {
    script: {
      innocents: [...script.innocents],
      herrings: [...script.herrings],
      helpers: [...script.helpers],
      herringCount: script.herringCount,
      ...(script.innocentCount !== undefined ? { innocentCount: script.innocentCount } : {}),
      ...(script.murderers
        ? {
            murderers: (Object.keys(script.murderers) as NightKind[]).filter(
              (k): k is MurdererKind => k !== 'suicide' && k !== 'hoax',
            ),
          }
        : {}),
      ...(script.murderers?.suicide ? { suicide: true } : {}),
      ...(script.murderers?.hoax ? { hoax: true } : {}),
      ...(script.murderers?.committee ? { committee: true } : {}),
      ...((script.helperChance ?? 1) < 1 ? { helperMaybe: true } : {}),
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

  // (On a night he did it himself, the only answer left is nobody: -1; on a
  // night he is not dead at all, -2; on the Committee's, -3, and its four.)
  const answer = hoax ? -2 : committee ? -3 : culprit
  const guilty = committee ? members : culprit >= 0 ? [culprit] : []
  let spoken = allSpoken(mystery)
  let facts = evidence.map((e) => e.fact)
  // Whoever is to be killed may never have been asked a thing: the night must
  // come out without a word of theirs but what they said before them all.
  const dead = truth.second?.victim ?? -1
  const heardOf = (said: Spoken[]) =>
    dead < 0
      ? said
      : [
          ...mystery.policies[dead].reaction.claims.map((claim) => ({ speaker: dead, claim })),
          ...said.filter((s) => s.speaker !== dead),
        ]
  let worlds = enumerateWorlds({ cast, caseSheet, spoken: heardOf(spoken), evidence: facts })
  const settled = () =>
    worlds.culprits.length === 1 &&
    worlds.culprits[0] === answer &&
    (!committee || (worlds.committees.length === 1 && worlds.committees[0] === members.join(',')))
  // Somebody innocent still in doubt, who truly had no cause to kill him: a
  // paper showing how they stood with him puts them out of it (the murderer
  // had a motive). Added where it is so, and the night weighed again, rather
  // than dealt again from nothing.
  for (let round = 0; round < 3 && !settled(); round++) {
    const doubt = new Set<CharId>([
      ...worlds.culprits.filter((c) => c >= 0),
      ...worlds.committees.flatMap((k) => k.split(',').map(Number)),
    ])
    const standing = [...doubt].filter(
      (c) =>
        !guilty.includes(c) &&
        !isMotiveGrade(relationships[c]) &&
        !evidence.some((e) => e.fact.kind === 'motiveDocument' && e.fact.subject === c),
    )
    if (standing.length === 0) break
    const desks = pack.docRooms.filter((r) => r !== truth.locked)
    for (const c of standing) {
      evidence.push({
        id: `doc-standing-${c}`,
        room: rng.pick(desks.length > 0 ? desks : pack.docRooms),
        name: motiveItem(relationships[c]),
        fact: { kind: 'motiveDocument', subject: c, rel: relationships[c] },
      })
    }
    mystery.policies = cast.map((m) => buildPolicy(m.id, policyContext))
    if (!passesSanity(mystery)) return 'sanity'
    spoken = allSpoken(mystery)
    facts = evidence.map((e) => e.fact)
    worlds = enumerateWorlds({ cast, caseSheet, spoken: heardOf(spoken), evidence: facts })
  }
  if (!settled()) return 'not-unique'
  if (!isConsistent(roles, { cast, caseSheet, spoken, evidence: facts })) {
    throw new Error(`seed ${opts.seed}: the true world is inconsistent — generation bug`)
  }

  const statements: NotedStatement[] = spoken.map((s, i) => ({
    id: `s${i}`,
    speaker: s.speaker,
    claim: s.claim,
  }))
  const contradictions = findContradictions(statements, evidence, caseSheet)
  // The Careful Murderer is caught by no account in the house: only by
  // clearing everybody else.
  if (careful && contradictions.some((c) => c.implicated.includes(culprit))) return 'careful-noticed'
  // (The Hoaxer, like any murderer, can be caught in their story.)
  if (!careful && !suicide && !committee && !pressableChars(contradictions).has(hoax ? hoaxer : culprit)) {
    return 'no-press-material'
  }
  // The Committee's story breaks against the honest, and in more than one place.
  if (committee && contradictions.filter((c) => c.implicated.some((x) => members.includes(x))).length < 2) {
    return 'no-seam'
  }
  // Whoever has been bought, or told what to say, can be brought to say so —
  // and the Sweetheart, and the one who hides their company.
  for (const c of [bribed, whispered, sweetheart, sweetheartOf]) {
    if (c >= 0 && !pressableChars(contradictions).has(c)) return 'no-seam'
  }
  // The trio must be completable: some OPPORTUNITY-type contradiction breaks
  // the culprit's account of the window (means and motive are guaranteed by
  // the weapon and the motive document).
  // A culprit who owns to having been at the scene has given the opportunity away.
  // — and one who went by the passage has no need to lie about the hour at all.
  if (
    !viaPassage &&
    !careful &&
    !noSingle &&
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

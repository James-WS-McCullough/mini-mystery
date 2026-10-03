import type { EvidenceFact, NightKind, PublicScript, RoleId, RoomId, TruthClass } from './types'
import type { Rng } from './rng'

/**
 * Scripts, Blood-on-the-Clocktower style. A script is the list of roles that
 * MAY be in the house — it is public, and longer than the table. Each night
 * draws the culprit, TWO from the herrings and innocents to fill, and nobody
 * is told which: a role on the script and not in the house is there for the
 * taking by anyone who needs to be somebody else.
 *
 * Nobody shares a role. One guest, one role.
 */
export interface Script {
  id: string
  /** Innocents with something to tell, or somebody to vouch for. */
  innocents: RoleId[]
  /** Those who look worse than they are. */
  herrings: RoleId[]
  /**
   * The accomplices: the murderer's friends. Where a script has any, one of
   * them may be in the house, in the place of one herring.
   */
  helpers: RoleId[]
  /** How many of the table are herrings (a helper among them, if there is one). */
  herringCount: number
  /**
   * How likely a night with helpers on the script is to have one in the
   * house (1: always). The Drunk never walks on a night the helper does.
   */
  helperChance?: number
  /** A secret passage runs from the scene to one other room. */
  passage?: boolean
  /** How likely a room is to be locked tonight, its key gone missing. */
  lockedRoom?: number
  /**
   * The kinds of murderer there may be, each with how likely it is; and
   * 'suicide', how likely it is that there is none, for he did it himself.
   */
  murderers?: Partial<Record<NightKind, number>>
  /** How many innocent guests (4 unless said). */
  innocentCount?: number
  /** Questions an hour (7 unless said). */
  questionsPerRound?: number
}

/** A small household: four at the table — the murderer, one suspicious, two innocent — and four questions an hour. */
export function smallScript(script: Script): Script {
  return { ...script, herringCount: 1, innocentCount: 2, questionsPerRound: 4 }
}

const INNOCENTS: RoleId[] = [
  'witness',
  'oracle',
  'confidant',
  'gossip',
  'sleuth',
  'steward',
  'collector',
  'discoverer',
  'alibi',
  'porter',
]
const HERRINGS: RoleId[] = [
  'thief',
  'begrudged',
  'loner',
  'redherring',
  'blackmailer',
  'amnesiac',
  'sweetheart',
]

export const CLASSIC_SCRIPT: Script = {
  id: 'classic',
  innocents: INNOCENTS,
  herrings: HERRINGS,
  helpers: [],
  herringCount: 2,
}

/**
 * Adds the Drunk to the herring pool: sincere, wrong, and dangerous. And on
 * the harder nights the house has a way through its walls (see below).
 */
export const FOGGY_SCRIPT: Script = {
  id: 'foggy',
  innocents: [...INNOCENTS, 'architect'],
  herrings: [...HERRINGS, 'drunk'],
  helpers: [],
  herringCount: 2,
  lockedRoom: 0.4,
  passage: true,
  murderers: { plain: 3, serial: 2, cunning: 2, careful: 2 },
}

/**
 * A way through the walls: a passage from the scene to one other room.
 * Whoever spent the hour alone in that room could have gone by it and come
 * back — a trace says they were there, and not that they stayed. The Architect
 * knows where it runs. The harder evenings all have one; this is the passage
 * by itself, with nothing else added, and is not an evening anybody is offered.
 */
export const PASSAGE_SCRIPT: Script = {
  id: 'passages',
  innocents: [...INNOCENTS, 'architect'],
  herrings: HERRINGS,
  helpers: [],
  herringCount: 2,
  passage: true,
}

/** The accomplices: the murderer's friends. One of them at most, on a night that has any. */
export const HELPERS: readonly RoleId[] = [
  'perjurer',
  'forger',
  'framer',
  'cleaner',
  'whisperer',
  'sponsor',
  'martyr',
]

/**
 * The murderer has a friend in the house, and nobody is told which: one who
 * will swear to their company, or forge for them, or frame somebody else, or
 * clear the scene, or put a story in an honest mouth, or pay a witness to keep
 * a shut one. Each leaves one thing undone that gives them away.
 */
export const CONSPIRACY_SCRIPT: Script = {
  id: 'conspiracy',
  innocents: [...INNOCENTS, 'architect'],
  herrings: HERRINGS,
  helpers: [...HELPERS],
  herringCount: 2,
  lockedRoom: 0.4,
  helperChance: 0.5,
  passage: true,
  // The one who owns to it is only to be doubted where somebody else might:
  // the Martyr is among the murderer's friends here, and nowhere else.
  murderers: { plain: 5, serial: 3, regretful: 2, cunning: 3, careful: 3 },
}

/**
 * Both ticked: the Drunk may walk, or the murderer may have a friend — one or
 * the other on a night, and never both, and on some nights neither.
 */
export const BOTH_SCRIPT: Script = {
  id: 'both',
  innocents: [...INNOCENTS, 'architect'],
  herrings: [...HERRINGS, 'drunk'],
  helpers: [...HELPERS],
  herringCount: 2,
  lockedRoom: 0.4,
  helperChance: 0.5,
  passage: true,
  murderers: { plain: 5, serial: 3, regretful: 2, cunning: 3, careful: 3 },
}

/**
 * The Tangled Web: the Drunk or an accomplice, as on the Knot of Lies, and
 * every kind of murderer there is — or none at all: he may have taken his own
 * life, or not be dead. (The Artful Murderer, who makes it look as though he
 * did it himself, comes only where he truly may have: the one is no puzzle
 * without the other.)
 */
export const WEB_SCRIPT: Script = {
  ...BOTH_SCRIPT,
  id: 'web',
  murderers: { ...BOTH_SCRIPT.murderers, artful: 2, suicide: 2, hoax: 2, committee: 2 },
}

/** The night's script, from what the detective ticked. */
export function scriptFor(drunk: boolean, helper: boolean): Script {
  if (drunk && helper) return BOTH_SCRIPT
  if (helper) return CONSPIRACY_SCRIPT
  if (drunk) return FOGGY_SCRIPT
  return CLASSIC_SCRIPT
}

/** How many innocents sit at every table. */
const INNOCENT_GUESTS = 4

/** Cast size 7: culprit + 2 herrings (one a helper, where there is one) + 4 innocents. */
export function buildDeck(rng: Rng, script: Script): RoleId[] {
  const withHelper = script.helpers.length > 0 && rng.chance(script.helperChance ?? 1)
  const herrings: RoleId[] = withHelper
    ? // (Never the Drunk on the same night as the murderer's friend.)
      [pickHelper(rng, script.helpers), ...rng.sample(script.herrings.filter((h) => h !== 'drunk'), script.herringCount - 1)]
    : rng.sample(script.herrings, script.herringCount)
  return ['culprit', ...herrings, ...rng.sample(script.innocents, script.innocentCount ?? INNOCENT_GUESTS)]
}

/**
 * What is honestly known by the parts that look for the murderer: whom they
 * saw at the scene, or in the corridor after, what he said as he died, which
 * three it was among. On a night with no murderer these have nothing true to
 * tell, and are not in the house (though anybody may say they are).
 */
const LOOKS_FOR_THE_MURDERER: readonly RoleId[] = ['witness', 'oracle', 'discoverer', 'sleuth']

/**
 * The deck for a night with no murderer: one more of the suspicious sits in
 * the murderer's place, and whoever would have told of the murderer is
 * somebody else with nothing to tell of one.
 */
export function suicideDeck(rng: Rng, deck: readonly RoleId[], script: Script): RoleId[] | null {
  const herring = rng.shuffle(script.herrings.filter((h) => !deck.includes(h) && h !== 'drunk'))[0]
  if (!herring) return null
  return withoutMurderer(rng, deck, script, herring)
}

/**
 * The deck for a night he is not dead: the Hoaxer, who helped him fake it,
 * sits in the murderer's place; and whoever would have told of a murderer is
 * somebody else.
 */
export function hoaxDeck(rng: Rng, deck: readonly RoleId[], script: Script): RoleId[] | null {
  return withoutMurderer(rng, deck, script, 'hoaxer')
}

/** How many sit on the Committee. */
export const COMMITTEE_SIZE = 4

/**
 * The deck for a night the Committee did it: four of them, and three
 * innocents, none of whom look for a murderer (what they would see, they
 * would see of four).
 */
export function committeeDeck(rng: Rng, script: Script, size: number): RoleId[] | null {
  const innocents = rng.shuffle(script.innocents.filter((r) => !LOOKS_FOR_THE_MURDERER.includes(r)))
  const honest = size - COMMITTEE_SIZE
  if (honest < 1 || innocents.length < honest) return null
  return [...new Array<RoleId>(COMMITTEE_SIZE).fill('committee'), ...innocents.slice(0, honest)]
}

/** The murderer's seat given to another, and the parts that look for a murderer put away. */
function withoutMurderer(rng: Rng, deck: readonly RoleId[], script: Script, seat: RoleId): RoleId[] | null {
  const spare = rng.shuffle(
    script.innocents.filter((r) => !deck.includes(r) && !LOOKS_FOR_THE_MURDERER.includes(r)),
  )
  const out: RoleId[] = []
  for (const role of deck) {
    if (role === 'culprit') out.push(seat)
    else if (LOOKS_FOR_THE_MURDERER.includes(role)) {
      const other = spare.pop()
      if (!other) return null
      out.push(other)
    } else out.push(role)
  }
  return out
}

/** The Martyr comes twice as often as the rest: a confession is to be doubted. */
function pickHelper(rng: Rng, helpers: readonly RoleId[]): RoleId {
  return rng.pick(helpers.flatMap((h) => (h === 'martyr' ? [h, h] : [h])))
}

/**
 * Tonight's kind of murderer, by the script's odds. Nobody owns to it on a
 * night with no Martyr possible; and the Cunning and the Careful Murderer,
 * who lie alone, have no part on a night the murderer has a friend. Nor is
 * there a friend on a night with no murderer to stand with.
 */
export function pickMurderer(rng: Rng, script: Script, deck?: readonly RoleId[]): NightKind {
  const helperTonight = !deck || deck.some((r) => HELPERS.includes(r))
  const lone = (kind: NightKind) =>
    kind === 'cunning' || kind === 'careful' || kind === 'suicide' || kind === 'hoax' || kind === 'committee'
  const odds = (Object.entries(script.murderers ?? { plain: 1 }) as [NightKind, number][]).filter(
    ([kind]) => (kind !== 'regretful' || helperTonight) && (!lone(kind) || !deck || !helperTonight),
  )
  let roll = rng.next() * odds.reduce((sum, [, w]) => sum + w, 0)
  for (const [kind, w] of odds) {
    roll -= w
    if (roll < 0) return kind
  }
  return odds[odds.length - 1][0]
}

/**
 * The four classes of role, as the case file lists them: the Murderer; the
 * Accomplices, who stand with them; the Suspicious, who look worse than they
 * are; and the Innocent, who have nothing to hide.
 */
export type RoleClass = 'murderer' | 'accomplice' | 'suspicious' | 'innocent'

export const ROLE_CLASSES: readonly { id: RoleClass; name: string; blurb: string }[] = [
  { id: 'murderer', name: 'Murderer', blurb: 'the one who did it' },
  { id: 'accomplice', name: 'Accomplice', blurb: 'whoever stands with them' },
  { id: 'suspicious', name: 'Suspicious', blurb: 'those who look worse than they are' },
  { id: 'innocent', name: 'Innocent', blurb: 'those with nothing to hide' },
]

export function roleClassOf(role: RoleId): RoleClass {
  if (role === 'culprit' || role === 'hoaxer' || role === 'committee') return 'murderer'
  if (HELPERS.includes(role)) return 'accomplice'
  if (HERRINGS.includes(role) || role === 'drunk') return 'suspicious'
  return 'innocent'
}

/** A script in its four parts, in the case file's order. Empty parts are left out. */
export function scriptParts(
  script: Pick<PublicScript, 'innocents' | 'herrings' | 'helpers' | 'hoax' | 'committee'>,
): { id: RoleClass; name: string; blurb: string; roles: RoleId[] }[] {
  const roles: Record<RoleClass, RoleId[]> = {
    // (And where he may not be dead at all, the one who helped him fake it;
    // and where four may have done it together, the Committee.)
    murderer: [
      'culprit',
      ...(script.hoax ? (['hoaxer'] as RoleId[]) : []),
      ...(script.committee ? (['committee'] as RoleId[]) : []),
    ],
    accomplice: script.helpers,
    suspicious: script.herrings,
    innocent: script.innocents,
  }
  return ROLE_CLASSES.flatMap((c) => (roles[c.id].length > 0 ? [{ ...c, roles: roles[c.id] }] : []))
}

/**
 * How many guests in the house are of a class, as the case file tells it:
 * "6", or "0 or 1" where the helper may not have come.
 */
export function guestsOf(
  script: Pick<PublicScript, 'helpers' | 'herringCount' | 'helperMaybe' | 'innocentCount' | 'suicide'>,
  id: RoleClass,
): string {
  const helper = script.helpers.length > 0
  switch (id) {
    case 'murderer':
      return script.suicide ? '0 or 1' : '1'
    case 'accomplice':
      return script.helperMaybe ? '0 or 1' : '1'
    case 'suspicious': {
      // (One more where there is no murderer, and so no friend of one.)
      const n = script.herringCount
      const most = script.suicide ? n + 1 : n
      if (!helper) return most > n ? `${n} or ${most}` : `${n}`
      if (!script.helperMaybe) return `${n - 1}`
      return most > n ? `${n - 1} to ${most}` : `${n - 1} or ${n}`
    }
    case 'innocent':
      return `${script.innocentCount ?? INNOCENT_GUESTS}`
  }
}

/** A guest whose role is not known is taken for an honest one. */
export function truthClassOf(role: RoleId | null): TruthClass {
  switch (role) {
    case 'culprit':
    case 'thief':
    case 'perjurer':
    case 'forger':
    case 'framer':
    case 'cleaner':
    case 'whisperer':
    case 'sponsor':
      return 'concealer'
    case 'sweetheart':
      // Innocent, and with a secret worth every lie it takes to keep.
      return 'concealer'
    case 'drunk':
      return 'unreliable'
    case 'blackmailer':
      return 'masked'
    case 'martyr':
      // Says truly where they were, and nothing true of who they are — till the last.
      return 'masked'
    case 'hoaxer':
      // Lies like a murderer: where they were, who they are, and whom they saw.
      return 'concealer'
    case 'committee':
      // Every word of the story they agreed between them.
      return 'concealer'
    case 'redherring':
      // Looked in at the scene and was seen; spent the hour elsewhere, and says
      // so truly — but claims to be somebody else, and says nothing of the scene
      // until pressed.
      return 'masked'
    default:
      return 'honest'
  }
}

export function isConcealer(role: RoleId | null): boolean {
  return truthClassOf(role) === 'concealer'
}

/** The murderer, and whoever stands with them. */
export function isEvil(role: RoleId | null): boolean {
  return role === 'culprit' || role === 'committee' || (role !== null && HELPERS.includes(role))
}

/**
 * Which of the script's helpers may yet be in the house, going by what has
 * been found. Some of them cannot work without leaving a mark: a scene with
 * the weapon gone is the Cleaner's, money with a name on it is the Sponsor's
 * — and there is only ever the one of them.
 */
export function possibleHelpers(
  script: Pick<PublicScript, 'helpers'>,
  evidence: readonly EvidenceFact[],
  sceneRoom: RoomId,
): RoleId[] {
  const shown = new Set<RoleId>()
  let weaponAtScene = false
  for (const f of evidence) {
    if (f.kind === 'sceneCleared') shown.add('cleaner')
    else if (f.kind === 'weapon') {
      if (f.foundIn !== undefined && f.foundIn !== sceneRoom) shown.add('cleaner')
      else weaponAtScene = true
    } else if (f.kind === 'bribe') shown.add('sponsor')
  }
  const named = script.helpers.filter((h) => shown.has(h))
  if (named.length > 0) return named
  return script.helpers.filter((h) => !(h === 'cleaner' && weaponAtScene))
}

/** Those who give a role that is not theirs. */
export function liesAboutRole(role: RoleId | null): boolean {
  const cls = truthClassOf(role)
  return cls === 'concealer' || cls === 'masked'
}

/** Those who will not say truly where they were — until, some of them, pressed. */
export function liesAboutWhereabouts(role: RoleId | null): boolean {
  const cls = truthClassOf(role)
  return cls === 'concealer' || cls === 'secretive'
}

/** Info roles a Bluffer can claim / a Drunk can believe themself to be. */
export const INFO_ROLES: readonly RoleId[] = [
  'witness',
  'oracle',
  'confidant',
  'gossip',
  'sleuth',
  'steward',
  'architect',
  'discoverer',
  'porter',
]

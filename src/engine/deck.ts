import type { EvidenceFact, NightKind, PublicScript, RoleId, RoomId, TruthClass } from './types'
import type { Rng } from './rng'
import {
  ACCOMPLICES,
  INFO_ROLES,
  INNOCENT_POOL,
  ROLES,
  SEEKS_MURDERER,
  SUSPICIOUS_POOL,
  type RoleClass,
} from './roles'

// (Where the parts used to be listed: re-exported, so nothing that reads them moves.)
export { ACCOMPLICES, INFO_ROLES, type RoleClass }

/**
 * Scripts, Blood-on-the-Clocktower style. A script is everything an evening is
 * dealt from: the parts that MAY be in the house (public, and longer than the
 * table), how many of each class sit down, which kinds of night there may be,
 * and what else may happen. Each night draws the murderer, the suspicious and
 * the innocent from it, and nobody is told which: a part on the script and
 * not in the house is there for the taking by anyone who needs to be
 * somebody else. Nobody shares a part. One guest, one part.
 *
 * The four evenings the title page offers are scripts (SCRIPTS); so is a
 * Custom evening, which the detective sets, and `checkScript` says whether
 * one can be dealt.
 */
export interface Script {
  /** Which evening: one of the four, or 'custom'. */
  id: ScriptId
  /** Innocents with something to tell, or somebody to vouch for. */
  innocents: RoleId[]
  /** Those who look worse than they are. */
  suspicious: RoleId[]
  /**
   * The accomplices: the murderer's friends. Where a script has any, one of
   * them may be in the house, in the place of one herring.
   */
  accomplices: RoleId[]
  /** How many of the table are suspicious (a helper among them, if there is one). */
  suspiciousCount: number
  /**
   * How likely a night with accomplices on the script is to have one in the
   * house (1: always). The Drunk never walks on a night the helper does.
   */
  accompliceChance?: number
  /** A secret passage runs from the scene to one other room. */
  passage?: boolean
  /** How likely a room is to be locked tonight, its key gone missing. */
  lockedRoom?: number
  /**
   * The kinds of night there may be, each with how likely it is: the kinds of
   * murderer; and the nights with none (he did it himself, or is not dead),
   * or with four of them (the Committee).
   */
  nights?: Partial<Record<NightKind, number>>
  /** How many innocent guests (4 unless said). */
  innocentCount?: number
  /** Questions an hour (7 unless said). */
  questionsPerRound?: number
  /** Help hidden about the place to be found (unless said not). */
  lifelines?: boolean
}

/** The evenings, by name: the four the title page offers, and one the detective sets. */
export type ScriptId = 'simple' | 'twist' | 'knot' | 'web' | 'custom'

/** A small household: four at the table — the murderer, one suspicious, two innocent — and four questions an hour. */
export function smallScript(script: Script): Script {
  return { ...script, suspiciousCount: 1, innocentCount: 2, questionsPerRound: 4 }
}

const INNOCENTS: RoleId[] = [...INNOCENT_POOL]
const HERRINGS: RoleId[] = [...SUSPICIOUS_POOL]

/** A Simple Case: one murderer, two of the suspicious, four innocent. */
export const SIMPLE_SCRIPT: Script = {
  id: 'simple',
  innocents: INNOCENTS,
  // (Not the Clinger: on the simplest evening, liars lie alone.)
  suspicious: HERRINGS.filter((r) => r !== 'clinger'),
  accomplices: [],
  suspiciousCount: 2,
}

/**
 * With a Twist: the Drunk among the suspicious (sincere, wrong, and
 * dangerous), a way through the walls from the scene, a door locked now and
 * then, and murderers of more than one kind.
 */
export const TWIST_SCRIPT: Script = {
  id: 'twist',
  innocents: [...INNOCENTS, 'architect'],
  suspicious: [...HERRINGS, 'drunk'],
  accomplices: [],
  suspiciousCount: 2,
  lockedRoom: 0.4,
  passage: true,
  nights: { plain: 3, serial: 2, cunning: 2, careful: 2 },
}

/**
 * A Knot of Lies: the Drunk may walk, or the murderer may have a friend in the
 * house (one who will swear to their company, or forge for them, or frame
 * somebody else, or clear the scene, or put a story in an honest mouth, or pay
 * a witness, or take the blame); one or the other on a night, never both, and
 * on some nights neither.
 */
export const KNOT_SCRIPT: Script = {
  id: 'knot',
  innocents: [...INNOCENTS, 'architect'],
  suspicious: [...HERRINGS, 'drunk'],
  accomplices: [...ACCOMPLICES],
  suspiciousCount: 2,
  lockedRoom: 0.4,
  accompliceChance: 0.5,
  passage: true,
  nights: { plain: 5, serial: 3, regretful: 2, cunning: 3, careful: 3 },
}

/**
 * The Tangled Web: the Drunk or an accomplice, as on the Knot of Lies, and
 * every kind of murderer there is — or none at all: he may have taken his own
 * life, or not be dead. (The Artful Murderer, who makes it look as though he
 * did it himself, comes only where he truly may have: the one is no puzzle
 * without the other.)
 */
export const WEB_SCRIPT: Script = {
  ...KNOT_SCRIPT,
  id: 'web',
  // (You are on your own.)
  lifelines: false,
  nights: { ...KNOT_SCRIPT.nights, artful: 2, suicide: 2, hoax: 2, committee: 2 },
}

/** The four evenings the title page offers, by name. */
export const SCRIPTS: Record<Exclude<ScriptId, 'custom'>, Script> = {
  simple: SIMPLE_SCRIPT,
  twist: TWIST_SCRIPT,
  knot: KNOT_SCRIPT,
  web: WEB_SCRIPT,
}

/** How many innocents sit at every table. */
const INNOCENT_GUESTS = 4

/** Cast size 7: culprit + 2 suspicious (one a helper, where there is one) + 4 innocents. */
export function buildDeck(rng: Rng, script: Script): RoleId[] {
  const withHelper = script.accomplices.length > 0 && rng.chance(script.accompliceChance ?? 1)
  const suspicious: RoleId[] = withHelper
    ? // (Never the Drunk on the same night as the murderer's friend.)
      [pickHelper(rng, script.accomplices), ...rng.sample(script.suspicious.filter((h) => h !== 'drunk'), script.suspiciousCount - 1)]
    : rng.sample(script.suspicious, script.suspiciousCount)
  return ['murderer', ...suspicious, ...rng.sample(script.innocents, script.innocentCount ?? INNOCENT_GUESTS)]
}

/**
 * What is honestly known by the parts that look for the murderer: whom they
 * saw at the scene, or in the corridor after, what he said as he died, which
 * three it was among. On a night with no murderer these have nothing true to
 * tell, and are not in the house (though anybody may say they are).
 */
const LOOKS_FOR_THE_MURDERER: readonly RoleId[] = SEEKS_MURDERER

/**
 * The deck for a night with no murderer: one more of the suspicious sits in
 * the murderer's place, and whoever would have told of the murderer is
 * somebody else with nothing to tell of one.
 */
export function suicideDeck(rng: Rng, deck: readonly RoleId[], script: Script): RoleId[] | null {
  const herring = rng.shuffle(script.suspicious.filter((h) => !deck.includes(h) && h !== 'drunk'))[0]
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

/** How many sit on the Committee: a majority of the table. */
export function committeeSize(table: number): number {
  // A majority of the table: three of five, four of six or seven, five of eight.
  return Math.floor(table / 2) + 1
}

/**
 * The deck for a night the Committee did it: four of them, and three
 * innocents, none of whom look for a murderer (what they would see, they
 * would see of four).
 */
export function committeeDeck(rng: Rng, script: Script, size: number): RoleId[] | null {
  const innocents = rng.shuffle(script.innocents.filter((r) => !LOOKS_FOR_THE_MURDERER.includes(r)))
  const honest = size - committeeSize(size)
  if (honest < 1 || innocents.length < honest) return null
  return [...new Array<RoleId>(committeeSize(size)).fill('committee'), ...innocents.slice(0, honest)]
}

/** The murderer's seat given to another, and the parts that look for a murderer put away. */
function withoutMurderer(rng: Rng, deck: readonly RoleId[], script: Script, seat: RoleId): RoleId[] | null {
  const spare = rng.shuffle(
    script.innocents.filter((r) => !deck.includes(r) && !LOOKS_FOR_THE_MURDERER.includes(r)),
  )
  const out: RoleId[] = []
  for (const role of deck) {
    if (role === 'murderer') out.push(seat)
    else if (LOOKS_FOR_THE_MURDERER.includes(role)) {
      const other = spare.pop()
      if (!other) return null
      out.push(other)
    } else out.push(role)
  }
  return out
}

/** The Martyr comes twice as often as the rest: a confession is to be doubted. */
function pickHelper(rng: Rng, accomplices: readonly RoleId[]): RoleId {
  return rng.pick(accomplices.flatMap((h) => (h === 'martyr' ? [h, h] : [h])))
}

/**
 * Tonight's kind of murderer, by the script's odds. Nobody owns to it on a
 * night with no Martyr possible; and the Cunning and the Careful Murderer,
 * who lie alone, have no part on a night the murderer has a friend. Nor is
 * there a friend on a night with no murderer to stand with.
 */
export function pickMurderer(rng: Rng, script: Script, deck?: readonly RoleId[]): NightKind {
  const helperTonight = !deck || deck.some((r) => ACCOMPLICES.includes(r))
  const lone = (kind: NightKind) =>
    kind === 'cunning' || kind === 'careful' || kind === 'suicide' || kind === 'hoax' || kind === 'committee'
  const odds = (Object.entries(script.nights ?? { plain: 1 }) as [NightKind, number][]).filter(
    ([kind]) => (kind !== 'regretful' || helperTonight) && (!lone(kind) || !deck || !helperTonight),
  )
  // (Where every kind the script has is one that cannot sit beside tonight's friend, a plain murderer.)
  if (odds.length === 0) return 'plain'
  let roll = rng.next() * odds.reduce((sum, [, w]) => sum + w, 0)
  for (const [kind, w] of odds) {
    roll -= w
    if (roll < 0) return kind
  }
  return odds[odds.length - 1][0]
}

/** The four classes of role, as the case file lists them (see `RoleClass`). */

export const ROLE_CLASSES: readonly { id: RoleClass; name: string; blurb: string }[] = [
  { id: 'murderer', name: 'Murderer', blurb: 'the one who did it' },
  { id: 'accomplice', name: 'Accomplice', blurb: 'whoever stands with them' },
  { id: 'suspicious', name: 'Suspicious', blurb: 'those who look worse than they are' },
  { id: 'innocent', name: 'Innocent', blurb: 'those with nothing to hide' },
]

export function roleClassOf(role: RoleId): RoleClass {
  return ROLES[role].class
}

/** A script in its four parts, in the case file's order. Empty parts are left out. */
export function scriptParts(
  script: Pick<PublicScript, 'innocents' | 'suspicious' | 'accomplices' | 'hoax' | 'committee'>,
): { id: RoleClass; name: string; blurb: string; roles: RoleId[] }[] {
  const roles: Record<RoleClass, RoleId[]> = {
    // (And where he may not be dead at all, the one who helped him fake it;
    // and where four may have done it together, the Committee.)
    murderer: [
      'murderer',
      ...(script.hoax ? (['hoaxer'] as RoleId[]) : []),
      ...(script.committee ? (['committee'] as RoleId[]) : []),
    ],
    accomplice: script.accomplices,
    suspicious: script.suspicious,
    innocent: script.innocents,
  }
  return ROLE_CLASSES.flatMap((c) => (roles[c.id].length > 0 ? [{ ...c, roles: roles[c.id] }] : []))
}

/**
 * How many guests in the house are of a class, as the case file tells it:
 * "6", or "0 or 1" where the helper may not have come.
 */
export function guestsOf(
  script: Pick<PublicScript, 'accomplices' | 'suspiciousCount' | 'accompliceMaybe' | 'innocentCount' | 'suicide'>,
  id: RoleClass,
): string {
  const helper = script.accomplices.length > 0
  switch (id) {
    case 'murderer':
      return script.suicide ? '0 or 1' : '1'
    case 'accomplice':
      return script.accompliceMaybe ? '0 or 1' : '1'
    case 'suspicious': {
      // (One more where there is no murderer, and so no friend of one.)
      const n = script.suspiciousCount
      const most = script.suicide ? n + 1 : n
      if (!helper) return most > n ? `${n} or ${most}` : `${n}`
      if (!script.accompliceMaybe) return `${n - 1}`
      return most > n ? `${n - 1} to ${most}` : `${n - 1} or ${n}`
    }
    case 'innocent':
      return `${script.innocentCount ?? INNOCENT_GUESTS}`
  }
}

/** A guest whose role is not known is taken for an honest one. */
export function truthClassOf(role: RoleId | null): TruthClass {
  return role === null ? 'honest' : ROLES[role].truth
}

export function isConcealer(role: RoleId | null): boolean {
  return truthClassOf(role) === 'concealer'
}

/** The murderer, and whoever stands with them. */
export function isEvil(role: RoleId | null): boolean {
  return role !== null && !!ROLES[role].evil
}

/**
 * Which of the script's accomplices may yet be in the house, going by what has
 * been found. Some of them cannot work without leaving a mark: a scene with
 * the weapon gone is the Cleaner's, money with a name on it is the Sponsor's
 * — and there is only ever the one of them.
 */
export function possibleHelpers(
  script: Pick<PublicScript, 'accomplices'>,
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
  const named = script.accomplices.filter((h) => shown.has(h))
  if (named.length > 0) return named
  return script.accomplices.filter((h) => !(h === 'cleaner' && weaponAtScene))
}

/**
 * Whether the Cunning Murderer may be playing the Clinger, by the script: a
 * kind friend swearing the murderer was with them. (Only where no friend of
 * the murderer's is sure to be in the house.)
 */
export function cunningClingerMay(script: Pick<PublicScript, 'murderers' | 'suspicious' | 'accomplices' | 'accompliceMaybe'>): boolean {
  return (
    (script.murderers?.includes('cunning') ?? false) &&
    script.suspicious.includes('clinger') &&
    (script.accomplices.length === 0 || !!script.accompliceMaybe)
  )
}

/** Those who give a role that is not theirs. */
export function liesAboutRole(role: RoleId | null): boolean {
  const cls = truthClassOf(role)
  return cls === 'concealer' || cls === 'masked'
}

/** Those who will not say truly where they were — until, some of them, pressed. */
export function liesAboutWhereabouts(role: RoleId | null): boolean {
  const cls = truthClassOf(role)
  return cls === 'concealer'
}


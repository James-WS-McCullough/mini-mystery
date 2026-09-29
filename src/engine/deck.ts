import type { EvidenceFact, PublicScript, RoleId, RoomId, TruthClass } from './types'
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
   * The murderer's friends. Where a script has any, exactly one of them is in
   * the house, in the place of one herring.
   */
  helpers: RoleId[]
  /** How many of the table are herrings (a helper among them, if there is one). */
  herringCount: number
}

const INNOCENTS: RoleId[] = [
  'witness',
  'oracle',
  'confidant',
  'gossip',
  'sleuth',
  'steward',
  'collector',
  'alibi',
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

/** Adds the Drunk to the herring pool: sincere, wrong, and dangerous. */
export const FOGGY_SCRIPT: Script = {
  id: 'foggy',
  innocents: INNOCENTS,
  herrings: [...HERRINGS, 'drunk'],
  helpers: [],
  herringCount: 2,
}

/** The murderer's friends. One of them, and one only, on a night that has any. */
export const HELPERS: readonly RoleId[] = [
  'accomplice',
  'forger',
  'framer',
  'cleaner',
  'whisperer',
  'sponsor',
]

/**
 * The murderer has a friend in the house, and nobody is told which: one who
 * will swear to their company, or forge for them, or frame somebody else, or
 * clear the scene, or put a story in an honest mouth, or pay a witness to keep
 * a shut one. Each leaves one thing undone that gives them away.
 */
export const CONSPIRACY_SCRIPT: Script = {
  id: 'conspiracy',
  innocents: INNOCENTS,
  herrings: HERRINGS,
  helpers: [...HELPERS],
  herringCount: 2,
}

/** Cast size 7: culprit + 2 herrings (one a helper, where there are any) + 4 innocents. */
export function buildDeck(rng: Rng, script: Script): RoleId[] {
  const herrings: RoleId[] =
    script.helpers.length > 0
      ? [rng.pick(script.helpers), ...rng.sample(script.herrings, script.herringCount - 1)]
      : rng.sample(script.herrings, script.herringCount)
  return ['culprit', ...herrings, ...rng.sample(script.innocents, 4)]
}

/** A guest whose role is not known is taken for an honest one. */
export function truthClassOf(role: RoleId | null): TruthClass {
  switch (role) {
    case 'culprit':
    case 'thief':
    case 'accomplice':
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
    default:
      return 'honest'
  }
}

export function isConcealer(role: RoleId | null): boolean {
  return truthClassOf(role) === 'concealer'
}

/** The murderer, and whoever stands with them. */
export function isEvil(role: RoleId | null): boolean {
  return role === 'culprit' || (role !== null && HELPERS.includes(role))
}

/**
 * Which of the script's helpers may yet be in the house, going by what has
 * been found. Some of them cannot work without leaving a mark: a scene with
 * the weapon gone is the Cleaner's, something of somebody's left at the scene
 * is the Framer's, money with a name on it is the Sponsor's — and there is
 * only ever the one of them.
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
    else if (f.kind === 'trace' && f.room === sceneRoom && f.givenBy === undefined) shown.add('framer')
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
]

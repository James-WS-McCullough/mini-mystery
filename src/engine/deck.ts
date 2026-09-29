import type { RoleId, TruthClass } from './types'
import type { Rng } from './rng'

/**
 * Scripts, Blood-on-the-Clocktower style: a curated pool of roles by TYPE.
 * Each night's deck draws the culprit, TWO red herrings from the script's
 * herring pool, and innocents to fill the table — so every case holds a
 * different pair of innocent-but-suspicious situations.
 */
export interface Script {
  id: string
  /** Innocents with something to tell, or somebody to vouch for. */
  innocents: RoleId[]
  /**
   * Those who look worse than they are — or, in the Accomplice, are. The
   * Sweethearts come as a pair and take both places.
   */
  herrings: RoleId[]
}

const INNOCENTS: RoleId[] = ['witness', 'oracle', 'confidant', 'gossip', 'sleuth', 'steward', 'alibi']
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
}

/** Adds the Drunk to the herring pool: sincere, wrong, and dangerous. */
export const FOGGY_SCRIPT: Script = {
  id: 'foggy',
  innocents: INNOCENTS,
  herrings: [...HERRINGS, 'drunk'],
}

/**
 * The murderer has a friend in the house. The Accomplice always walks, and
 * with them the Companion whose place they take: on these nights two people
 * swearing to each other's company proves nothing.
 */
export const CONSPIRACY_SCRIPT: Script = {
  id: 'conspiracy',
  innocents: INNOCENTS,
  herrings: ['accomplice', ...HERRINGS.filter((r) => r !== 'sweetheart')],
}

/** Cast size 7: culprit + 2 herrings + 4 innocents. */
export function buildDeck(rng: Rng, script: Script): RoleId[] {
  const conspiracy = script.herrings.includes('accomplice')
  const pool = rng.shuffle(script.herrings.filter((r) => r !== 'accomplice'))
  let herrings: RoleId[]
  if (conspiracy) {
    herrings = ['accomplice', pool.find((r) => r !== 'sweetheart')!]
  } else if (pool[0] === 'sweetheart') {
    herrings = ['sweetheart', 'sweetheart']
  } else {
    herrings = [pool[0], pool.find((r, i) => i > 0 && r !== 'sweetheart')!]
  }
  // The Accomplice passes for the Companion, so there must be one to pass for.
  const innocents: RoleId[] = conspiracy
    ? ['alibi', ...rng.sample(script.innocents.filter((r) => r !== 'alibi'), 3)]
    : rng.sample(script.innocents, 4)
  return ['culprit', ...herrings, ...innocents]
}

export function truthClassOf(role: RoleId): TruthClass {
  switch (role) {
    case 'culprit':
    case 'thief':
    case 'accomplice':
      return 'concealer'
    case 'drunk':
      return 'unreliable'
    case 'sweetheart':
      return 'secretive'
    case 'blackmailer':
      return 'masked'
    default:
      return 'honest'
  }
}

export function isConcealer(role: RoleId): boolean {
  return truthClassOf(role) === 'concealer'
}

/** The murderer, and whoever stands with them. */
export function isEvil(role: RoleId): boolean {
  return role === 'culprit' || role === 'accomplice'
}

/** Those who give a role that is not theirs. */
export function liesAboutRole(role: RoleId): boolean {
  const cls = truthClassOf(role)
  return cls === 'concealer' || cls === 'masked'
}

/** Those who will not say truly where they were — until, some of them, pressed. */
export function liesAboutWhereabouts(role: RoleId): boolean {
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

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
  /** Single-slot innocent info roles ('alibi' is special: enters as a pair). */
  innocents: RoleId[]
  herrings: RoleId[]
}

export const CLASSIC_SCRIPT: Script = {
  id: 'classic',
  innocents: ['witness', 'oracle', 'confidant', 'gossip', 'alibi'],
  herrings: ['thief', 'begrudged', 'loner'],
}

/** Adds the Drunk to the herring pool: sincere, wrong, and dangerous. */
export const FOGGY_SCRIPT: Script = {
  id: 'foggy',
  innocents: ['witness', 'oracle', 'confidant', 'gossip', 'alibi'],
  herrings: ['thief', 'begrudged', 'loner', 'drunk'],
}

/** Cast size 7: culprit + 2 herrings + 4 innocents. */
export function buildDeck(rng: Rng, script: Script): RoleId[] {
  const herrings = rng.sample(script.herrings, 2)
  const singles = script.innocents.filter((r) => r !== 'alibi')
  const withPair = script.innocents.includes('alibi') && rng.chance(0.6)
  const innocents: RoleId[] = withPair
    ? ['alibi', 'alibi', ...rng.sample(singles, 2)]
    : rng.sample(singles, 4)
  return ['culprit', ...herrings, ...innocents]
}

export function truthClassOf(role: RoleId): TruthClass {
  switch (role) {
    case 'culprit':
    case 'thief':
      return 'concealer'
    case 'drunk':
      return 'unreliable'
    default:
      return 'honest'
  }
}

export function isConcealer(role: RoleId): boolean {
  return truthClassOf(role) === 'concealer'
}

/** Info roles a Bluffer can claim / a Drunk can believe themself to be. */
export const INFO_ROLES: readonly RoleId[] = ['witness', 'oracle', 'confidant', 'gossip']

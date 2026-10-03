// Every part with something to tell (see part.ts), by its role.
import type { RoleId } from '../types'
import { architect } from './architect'
import { confidant } from './confidant'
import { discoverer } from './discoverer'
import { gossip } from './gossip'
import { oracle } from './oracle'
import type { InfoPart } from './part'
import { porter } from './porter'
import { sleuth } from './sleuth'
import { spinster } from './spinster'
import { steward } from './steward'
import { witness } from './witness'

export type { CarefulTelling, InfoPart, Telling } from './part'
export { watched } from './part'

/**
 * The parts whose knowledge is dealt with the rest of what is known, in this
 * order: the order decides the dice, so a new part goes at the end.
 */
export const KNOWN_IN_TURN: readonly RoleId[] = ['witness', 'discoverer', 'oracle', 'confidant', 'architect', 'sleuth', 'steward']
/** And those whose knowledge is of the liars' stories, dealt once those are told, in this order. */
export const KNOWN_OF_THE_LIES: readonly RoleId[] = ['porter', 'spinster']

export const INFO: Partial<Record<RoleId, InfoPart>> = {
  witness,
  oracle,
  confidant,
  gossip,
  sleuth,
  steward,
  architect,
  discoverer,
  porter,
  spinster,
}

// What the house plan needs to be drawn for something other than tonight's
// case: see ManorMap's `source`.

import type { SettingPack } from '../content/schema'
import type { RoomId } from '../engine/types'
import type { Placement } from './placements'

/**
 * The plan drawn for something other than tonight's case (the Evening Timeline,
 * while it is playtested): the house, the scene, who is pinned where, and what
 * has been searched and found. Left out, everything comes from the case.
 */
export interface MapSource {
  seed: number
  pack: SettingPack
  scene: RoomId
  placements: Placement[]
  nameOf(char: number): string
  defIdOf(char: number): string | undefined
  searched(room: RoomId): boolean
  found(room: RoomId): { id: string; name: string; proves: string }[]
  /** A pin that will not fit with what else has been said: marked as a contradiction. */
  flag?(p: Placement): boolean
  /** A room to have open beside the plan, its people listed. */
  focus?: RoomId
}

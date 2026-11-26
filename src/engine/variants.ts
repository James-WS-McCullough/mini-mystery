// The ways a night may be played. Each is a layer over the ordinary night,
// dealt after it from a line of the seed's own, so the night underneath is
// just the night the same number always deals; and the classic way adds
// nothing at all.

import type { SettingPack } from '../content/schema'
import { dealEvening } from './evening/deal'
import type { Mystery } from './types'

export type VariantId = 'classic' | 'timeline'

export interface NightVariant {
  id: VariantId
  /** What the variant adds to a night dealt the ordinary way. */
  layer(m: Mystery, pack: SettingPack): Mystery
}

export const VARIANTS: Record<VariantId, NightVariant> = {
  classic: { id: 'classic', layer: (m) => m },
  /** The Evening Timeline: the whole evening around the hour, and nobody told which hour it was. */
  timeline: { id: 'timeline', layer: dealEvening },
}

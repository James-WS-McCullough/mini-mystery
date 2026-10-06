// The exhibits for the castle evenings, cut from black paper like the rest.
// Drawn on a 100 × 100 square; see ../manor1920s/items.ts for the conventions.

import type { SilhouetteLayer } from '../schema'

const ink = (d: string, stroke?: number): SilhouetteLayer => ({ d, tone: 'ink', stroke })
const pale = (d: string, stroke?: number): SilhouetteLayer => ({ d, tone: 'pale', stroke })
const brass = (d: string, stroke?: number): SilhouetteLayer => ({ d, tone: 'brass', stroke })

export const CASTLE_GLYPHS: Record<string, SilhouetteLayer[]> = {
  // A sharpened stake, point down and to the left, and a mallet standing beside it.
  'weapon.stake': [
    ink('M74 11L82 17L40 71L22 86L32 65z'),
    pale('M76 18L36 69', 1.6),
    ink('M60 50h36v22H60z'),
    brass('M66 50v22M90 50v22', 3),
    pale('M70 55h16', 1.6),
    ink('M75 72h6v22h-6z'),
    brass('M75 90h6', 2.5),
  ],
}

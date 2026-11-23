// The Bramblewood exhibits, cut from black paper like the rest: the apple,
// the oven, the spindle, the rolling pin and the beanstalk (the axe is the
// one the Queen of Hearts keeps, as like a woodcutter's as makes no matter).
// Drawn on a 100 × 100 square; `ink` is the object itself, `pale` and `brass`
// pick out a shine, an edge, a flame.

import type { SilhouetteLayer } from '../schema'
import { WONDERLAND_GLYPHS } from '../wonderland1865/items'

const ink = (d: string, stroke?: number): SilhouetteLayer => ({ d, tone: 'ink', stroke })
const pale = (d: string, stroke?: number): SilhouetteLayer => ({ d, tone: 'pale', stroke })
const brass = (d: string, stroke?: number): SilhouetteLayer => ({ d, tone: 'brass', stroke })

export const BRAMBLEWOOD_GLYPHS: Record<string, SilhouetteLayer[]> = {
  // An apple, one bite gone, a leaf on the stalk and a shine on the skin.
  'weapon.poison': [
    ink('M50 30c-8-6-26-6-32 8-7 16 2 40 14 48 7 5 12 3 18 0 6 3 11 5 18 0 12-8 21-32 14-48-6-14-24-14-32-8z'),
    // (The bite, taken out of the side.)
    pale('M82 52c-6 0-9 4-8 8-4 1-6 5-4 9 4 0 8-2 10-5 3 0 5-3 5-6z'),
    brass('M50 30c0-8 2-14 6-18', 2.6),
    brass('M56 16c6-6 16-6 20 0-6 4-14 4-20 0z'),
    pale('M28 44c2-6 7-9 12-9', 2.4),
  ],
  // The oven: an iron door with its latch thrown, flames behind the grate, smoke from the flue.
  'weapon.oven': [
    ink('M14 34h72v58H14z'),
    ink('M60 10h12v24H60z'),
    pale('M24 44h52v30H24z'),
    ink('M28 48h44v22H28z'),
    brass('M34 68c0-8 6-10 6-16 4 4 4 8 2 12 3-2 5-6 5-10 5 5 7 10 5 14 3-1 5-4 5-7 4 4 3 7 1 7z'),
    brass('M70 58h16', 3.2),
    brass('M84 54v8', 3),
    pale('M24 82h52', 2),
    pale('M66 6c4-3 0-6 4-9', 1.8),
  ],
  'weapon.axe': WONDERLAND_GLYPHS['weapon.axe'],
  // A spindle: a long tapering shaft, its whorl, and a dark point.
  'weapon.spindle': [
    ink('M22 86L74 18l4 3-46 72z', 1),
    ink('M30 70a10 6 -52 1 0 14 10 10 6 -52 1 0 -14 -10z'),
    pale('M32 74c3-4 7-6 10-6', 1.6),
    brass('M28 90c2 4 6 6 10 4', 2.4),
    brass('M74 18l9-10', 2.2),
    ink('M83 8l3-3', 3),
    pale('M58 40c-5 2-9 6-11 10M62 46c-6 2-10 6-12 10', 1.2),
  ],
  // A rolling pin, floured, with its two turned handles.
  'weapon.bludgeon': [
    ink('M20 36l58 30c4 2 5 7 3 11s-7 5-11 3L12 50c-4-2-5-7-3-11s7-5 11-3z'),
    brass('M10 38L2 34', 5),
    brass('M82 76l8 4', 5),
    pale('M26 46l46 24', 1.8),
    pale('M30 56h.2M42 60h.2M58 68h.2M36 48h.2', 3),
  ],
  // The beanstalk, going up out of the picture, a torn leaf and the drop below.
  'weapon.fall': [
    ink('M44 100c-6-20 12-30 4-48-6-14 10-26 6-52h10c4 24-10 38-4 52 8 18-10 28-6 48z'),
    ink('M50 64c-14-8-28-6-36 4 12 2 24 2 36-4z'),
    ink('M56 36c12-10 26-10 34-2-12 4-24 4-34 2z'),
    pale('M18 68c10-3 22-4 30-4M58 36c10-2 20-2 28 0', 1.2),
    pale('M22 66l4 4-2 4 4 2', 1.6),
    brass('M8 96h84', 3),
  ],
}

// The Wonderland exhibits, cut from black paper like the rest: a flamingo
// pressed into service as a croquet mallet, and the Queen's axe. Drawn on a
// 100 × 100 square; `ink` is the object itself, `pale` and `brass` pick out
// a feather, an edge, a ball.

import type { SilhouetteLayer } from '../schema'

const ink = (d: string, stroke?: number): SilhouetteLayer => ({ d, tone: 'ink', stroke })
const pale = (d: string, stroke?: number): SilhouetteLayer => ({ d, tone: 'pale', stroke })
const brass = (d: string, stroke?: number): SilhouetteLayer => ({ d, tone: 'brass', stroke })

export const WONDERLAND_GLYPHS: Record<string, SilhouetteLayer[]> = {
  // A flamingo, held upside down by the legs: the neck is the shaft, the head the mallet.
  'weapon.mallet': [
    // The legs, up in the air, are the grip.
    ink('M46 3l3 15M56 3l-3 15', 2.6),
    ink('M40 3h8M54 3h8', 2.6),
    ink('M36 30c0-8 8-13 17-12 10 1 15 7 13 14-2 7-11 10-20 9-6-1-10-5-10-11z'),
    pale('M42 28c6-3 13-2 18 3', 1.8),
    // The neck, the shaft.
    ink('M50 38c-10 8 10 16 0 26s2 10 0 14', 5.5),
    // The head, the mallet: a bill hooked down at the end.
    ink('M32 78h36c4 0 6 2 6 5s-2 6-6 6H36c-3 0-6-2-8-6z'),
    ink('M32 78c-6 0-9 5-9 13 4-3 7-6 9-10z'),
    pale('M63 82.5a1.6 1.6 0 1 0 3.2 0 1.6 1.6 0 1 0-3.2 0z'),
    // The ball it is about to strike.
    brass('M76 92a9 9 0 1 0 18 0 9 9 0 1 0-18 0z'),
    pale('M77 89c5 3 12 3 16 0', 1.8),
  ],
  // The Queen's axe: a long haft, a broad blade, a brass-bound collar.
  'weapon.axe': [
    ink('M30 96L53 14', 6),
    ink('M55 10C78 4 96 20 92 46 80 38 66 40 47 46z'),
    pale('M70 8c14 3 22 15 20 31', 2.2),
    brass('M47 36l11 3M45 44l11 3', 3.8),
    brass('M28 90l5 1.5', 4.5),
  ],
}

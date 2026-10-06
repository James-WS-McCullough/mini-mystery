// Cameo portraits for the castle evenings. Six are drawn here; the rest of
// the company stands in the likeness of a sitter from another setting. Same
// box, same tones: see ../manor1920s/silhouettes.ts for the conventions.

import type { SilhouetteDef } from '../schema'
import { silhouettes as MANOR } from '../manor1920s/silhouettes'
import { THEATRE_SILHOUETTES } from '../theatre1929/silhouettes'

/** A filled disc, for buttons, clasps and jewels. */
function dot(cx: number, cy: number, r: number): string {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0z`
}

const n = (v: number) => Math.round(v * 10) / 10

/** Shoulders of a given half-width, sloping away from the base of the neck. */
function shoulders(half: number, neck = 1): string {
  const l = 48 - half
  const r = 48 + half
  const a = 47 - 12.5 * neck
  const b = 48 + 12.5 * neck
  return (
    `M${l} 120C${l} 109 ${n(l + (a - l) * 0.35)} 101 ${n(a - 1.5)} 97L${n(a)} 94.5H${n(b)}` +
    `L${n(b + 1.5)} 97C${n(r - (r - b) * 0.35)} 101 ${r} 109 ${r} 120z`
  )
}

/** A band of cloth round the neck, from one edge to the other at its upper and lower rims. */
function band(top: [number, number, number], foot: [number, number, number]): string {
  const [l1, r1, y1] = top
  const [l2, r2, y2] = foot
  const w1 = r1 - l1
  const w2 = r2 - l2
  return (
    `M${l1} ${y1}c${n(w1 * 0.3)} 4.5 ${n(w1 * 0.7)} 5 ${n(w1)} 1L${r2} ${y2}` +
    `c${n(-w2 * 0.3)} 4 ${n(-w2 * 0.7)} 3.5 ${n(-w2)} -1z`
  )
}

/** Where the edges of a sitter's neck are at a given height, for a collar to meet them. */
function neckEdges(neck: number, y: number, flare = 1.4): [number, number] {
  const t = Math.min(1, (y - 68) / 22.5)
  const l = y <= 90.5 ? 38 - 2.6 * t : 35.4 - 1.4 * Math.min(1, (y - 90.5) / 5)
  const r = y <= 90.5 ? 57 + 2.6 * t : 59.6 + 1.4 * Math.min(1, (y - 90.5) / 5)
  return [n(47 + (l - 47) * neck - flare), n(47 + (r - 47) * neck + flare)]
}

/** A collar between two heights, fitted to a neck of the given thickness. */
function collar(neck: number, y1: number, y2: number, flare = 1.4): string {
  const [l1, r1] = neckEdges(neck, y1, flare)
  const [l2, r2] = neckEdges(neck, y2, flare + 0.8)
  return band([l1, r1, y1], [l2, r2, y2])
}

/** A forearm rising from the lower right to a hand at about (82, 76). */
const RAISED_ARM =
  'M72 120c1-9 4-16 9-21L79 78c-.5-3 1-5 3.5-5.5 2.5-.5 4.5 1 5 3.5l4 25c1 7-1 13-5 19z'
const RAISED_HAND = 'M77 76c-1-4 1-7.5 5-8.5 3-.5 6 1 7 4 .5 3-1 5.5-4 6.5-4 1-7 0-8-2z'
/** A forearm held low and forward, for what hangs from the hand. */
const LOW_ARM = 'M64 120c1-9 5-16 11-20l6 5c-4 4-7 9-8 15z'

const DRAWN: Record<string, SilhouetteDef> = {
  // Tall and thin, hair swept back to a widow's peak, a collar standing up behind the head, and a candle in long fingers.
  count: {
    tint: '#8a1c2a',
    head: { wide: 0.92, tall: 1.08, dy: -2, tilt: -2 },
    body: shoulders(28, 0.88),
    neck: 0.88,
    layers: [
      // The high stiff collar of the cloak, standing up behind the head, with its pale lining.
      { tone: 'ink', on: 'figure', d: 'M20 100L15 54C23 59 30 70 37 84L39 96z' },
      { tone: 'pale', on: 'figure', stroke: 1.3, d: 'M23 96L19 62C25 67 31 75 36 85' },
      { tone: 'ink', on: 'figure', d: 'M60 96L65 78C63 83 60 87 57 89z' },
      // Hair swept straight back off a high brow, coming down to a point.
      { tone: 'ink', d: 'M27 49C24 28 38 15 54 15.5c8 .3 14 3.5 17 8l-5 10c-4-5-11-6-19-4.5-7 5-11 12-12 20z' },
      { tone: 'pale', stroke: 1.2, d: 'M38 22c7-3 15-3 23 0' },
      { tone: 'ink', d: 'M28 50c-4 6-4 15 1 21 3-6 4-14 2-20z' },
      // The hairline, coming down to its point.
      { tone: 'pale', stroke: 1, d: 'M71 25l-5 8c-4-4-10-5-17-3' },
      // The shirt at the throat, and the heavy clasp of the cloak.
      { tone: 'pale', on: 'figure', d: collar(0.88, 85.5, 92) },
      { tone: 'pale', on: 'figure', stroke: 1.2, d: 'M34 100L47.5 112 61 100' },
      { tone: 'brass', on: 'figure', d: dot(47.5, 99.5, 4.4) },
      { tone: 'ink', on: 'figure', d: dot(47.5, 99.5, 1.9) },
      { tone: 'brass', on: 'figure', stroke: 1.4, d: 'M43.5 101c-3 3-6 5-10 6M51.5 101c3 3 6 5 10 6' },
    ],
    // A candle held up in long fingers, the flame above them.
    prop: [
      { tone: 'ink', on: 'figure', d: RAISED_ARM },
      { tone: 'pale', on: 'figure', d: 'M79.5 54h6.5v18h-6.5z' },
      { tone: 'brass', on: 'figure', d: 'M82.8 53.5c-3.5-4-1.5-8 0-12 1.8 4 3.8 8 0 12z' },
      { tone: 'ink', on: 'figure', d: RAISED_HAND },
      { tone: 'ink', on: 'figure', stroke: 2, d: 'M78 66h9.5M78.5 69.5h9' },
      { tone: 'ink', on: 'figure', stroke: 1.8, d: 'M86 68l3.5-6' },
    ],
  },

  // A bald dome with a grey fringe, a short beard, and a doctor's black bag.
  vanhelsing: {
    tint: '#2f5d8a',
    head: { wide: 1.02, tall: 1, dy: 0, tilt: 2 },
    body: shoulders(27, 1.05),
    neck: 1.05,
    layers: [
      // A fringe round the back of the head only, grey, and a shine on the dome.
      { tone: 'grey', d: 'M29 52c-4-9-2-18 4-24 1 8 1 15 0 25 2 1 3 4 3 8-3 1-6 0-7-3z' },
      { tone: 'pale', d: 'M44 19c4-3 10-3 14-1-4 0-10 1-14 1z' },
      // A short pointed beard, from the ear round the chin.
      { tone: 'grey', d: 'M36 55c-3 10 0 20 8 26 8 5 19 4 25-3 3-4 4-8 3-12-4 3-9 4-14 2-6-2-10-6-12-13z' },
      { tone: 'ink', stroke: 1.6, d: 'M60 40c4-2 8-2 12-.5' },
      // A stiff collar and a dark tie.
      { tone: 'pale', on: 'figure', d: collar(1.05, 86, 92.5) },
      { tone: 'ink', on: 'figure', d: 'M47.5 93.5l-3 17 3 3 3-3z' },
      { tone: 'ink', on: 'figure', d: dot(47.5, 95, 2) },
    ],
    // The black bag, carried low by its handle.
    prop: [
      { tone: 'ink', on: 'figure', d: LOW_ARM },
      { tone: 'leather', on: 'figure', d: 'M56 106c0-4 3-6 7-6h20c4 0 7 2 7 6v14H56z' },
      { tone: 'ink', on: 'figure', stroke: 1.8, d: 'M70 99c0-8 12-8 12 0' },
      { tone: 'brass', on: 'figure', d: 'M73 104h6v3.5h-6z' },
      { tone: 'ink', on: 'figure', stroke: 1, d: 'M56 111h34' },
      { tone: 'ink', on: 'figure', d: dot(76, 99, 4.4) },
    ],
  },

  // Hair on end, a loose hospital jacket, and two cupped hands held up to something small.
  renfield: {
    tint: '#5e7d4a',
    head: { wide: 0.94, tall: 1, dy: 1, tilt: 6 },
    body: shoulders(24, 0.8),
    neck: 0.8,
    layers: [
      // Hair standing up on end in spikes.
      {
        tone: 'ink',
        d: 'M27 49C23 36 27 24 33 16l1-8 6 8 3-10 5 9 5-11 4 10 6-8 1 10 7-4-3 9c-6-2-13-1-19 4-7 5-11 12-12 20z',
      },
      { tone: 'ink', d: 'M28 50c-4 5-3 12 1 17 2-5 3-11 2-16z' },
      // Hollow, worried brows.
      { tone: 'ink', stroke: 1.6, d: 'M60 40c3-2 7-2 11 0' },
      // The plain jacket, its flat collar, and a single button.
      { tone: 'grey', on: 'figure', d: 'M26 120C26 110 31 102 39 98l8.5 8 8.5-8c8 4 14 12 14 22z' },
      { tone: 'pale', on: 'figure', d: collar(0.8, 85.5, 92, 1.8) },
      { tone: 'pale', on: 'figure', d: 'M37 98l10.5 9.5L58 98l-4-4.5H41z' },
      { tone: 'ink', on: 'figure', stroke: 1, d: 'M47.5 107.5V120' },
      { tone: 'ink', on: 'figure', d: dot(47.5, 112, 1.3) },
    ],
    // Cupped hands held up together, as if they held a fly.
    prop: [
      { tone: 'grey', on: 'figure', d: RAISED_ARM },
      { tone: 'ink', on: 'figure', d: RAISED_HAND },
      { tone: 'ink', on: 'figure', d: 'M71 75c0-7 6-12 13-10 5 1 8 6 7 11-2 5-6 7-11 7-5-1-9-3-9-8z' },
      { tone: 'pale', on: 'figure', stroke: 1.1, d: 'M75 72c2-2 5-3 8-2.5M74 77c3-1 6-2 10-1.5M78 82c3 0 6-1 8-3' },
      { tone: 'pale', on: 'figure', d: dot(86.2, 69.2, 0.9) },
    ],
  },

  // A great mass of loose hair, a loose gown, a bare throat, and her hands folded.
  bride: {
    tint: '#b79ad6',
    head: { wide: 0.96, tall: 1, dy: -1, tilt: -4 },
    body: shoulders(26, 0.7),
    neck: 0.7,
    layers: [
      // The hair: a heavy mass off the crown, falling behind her to the waist.
      {
        tone: 'ink',
        d: 'M72 32C73 15 59 6 45 7 28 9 14 23 14 44c0 18-6 34-3 52 1 12 7 20 15 22 4-10 3-22 5-32 2-9 6-14 9-21-5-7-5-15-1-22 6-6 16-9 28-8z',
      },
      { tone: 'pale', stroke: 1.1, d: 'M32 14c-9 5-14 15-14 28M38 11c-5 3-8 6-10 10' },
      // A lock falling forward over the shoulder, and strands loose at the brow.
      { tone: 'ink', on: 'figure', d: 'M31 93c-5 8-5 18 0 27 5-4 6-12 5-21z' },
      { tone: 'ink', d: 'M60 36c-6-3-13-3-19 0 5-8 14-11 21-6z' },
      // A loose pale gown, cut low and wide, leaving the throat bare.
      { tone: 'pale', on: 'figure', d: 'M22 120C22 108 28 100 37 96c3 8 7 11 11 11s8-3 11-11c9 4 15 12 15 24z' },
      { tone: 'ink', on: 'figure', stroke: 0.9, d: 'M33 112c1 3 1 5 0 8M62 112c-1 3-1 5 0 8M42 114v6M54 114v6' },
    ],
    // Folded hands, in long sleeves.
    prop: [
      { tone: 'ink', on: 'figure', stroke: 1.6, d: 'M32 120c0-7 3-11 9-13M66 120c0-7-3-11-9-13' },
      { tone: 'ink', on: 'figure', d: 'M38 106c5-4 16-4 21 0 2 5-1 10-6 11-7 1-12-2-15-11z' },
      { tone: 'pale', on: 'figure', stroke: 0.9, d: 'M44 108l-1 6M49 107v8M54 108l1 6' },
    ],
  },

  // A wide-brimmed Stetson, a knotted neckerchief, and the hat itself, held in his hand.
  quincey: {
    tint: '#c98c8c',
    head: { wide: 1.04, tall: 1, dy: 1, tilt: 1 },
    body: shoulders(29, 1.12),
    neck: 1.12,
    layers: [
      // The Stetson: a high dented crown, a hatband, and a wide brim over the brow.
      { tone: 'leather', d: 'M31 34C28 16 38 7 52 7c14 0 24 9 22 27z' },
      { tone: 'ink', stroke: 1.2, d: 'M40 9c5 3 8 3 12 1' },
      { tone: 'brass', stroke: 2.6, d: 'M31 30c14-3 29-3 43 0' },
      { tone: 'leather', d: 'M12 38c7-6 22-9 40-9 19 0 34 4 42 11-8 6-26 7-43 6-17-1-32-4-39-8z' },
      { tone: 'ink', stroke: 1, d: 'M18 39c10 3 22 5 34 5 14 0 28-1 38-5' },
      // Whiskers at the jaw, and a chin that wants shaving.
      { tone: 'ink', d: 'M32 55c-3 7-1 14 5 19 1-6 1-13-1-19z' },
      // The neckerchief, knotted at the throat.
      { tone: 'russet', on: 'figure', d: collar(1.12, 85.5, 92, 1.4) },
      { tone: 'russet', on: 'figure', d: 'M34 94l13.5 24L61 94c-4 3-9 4-13.5 4S38 97 34 94z' },
      { tone: 'ink', on: 'figure', d: dot(47.5, 97, 2.2) },
    ],
    // The Stetson, held low by the brim.
    prop: [
      { tone: 'ink', on: 'figure', d: LOW_ARM },
      { tone: 'leather', on: 'figure', d: 'M64 112c-1-10 4-14 12-14s13 4 12 14z' },
      { tone: 'brass', on: 'figure', stroke: 2.2, d: 'M64.5 108c7-2 16-2 23 0' },
      { tone: 'leather', on: 'figure', d: 'M52 113c7-4 25-5 38-1 2 2 0 5-4 6-10 2-26 1-34-1z' },
      { tone: 'ink', on: 'figure', d: dot(77, 101, 4.2) },
    ],
  },

  // Hair up in a neat knot, a high lace collar, and a notebook with a pencil.
  mina: {
    tint: '#2b8a8a',
    head: { wide: 0.94, tall: 1.02, tilt: -3 },
    body: shoulders(24, 0.66),
    neck: 0.66,
    layers: [
      // Hair centre parted, rolled back from the brow, pinned in a tidy knot on the crown.
      { tone: 'ink', d: 'M26 47C24 27 37 14 54 14c9 .3 15 4 17 9-8-2-15-1-22 3-7 5-11 12-11 21-5 1-10-1-12-4z' },
      { tone: 'ink', d: dot(36, 12, 8) },
      { tone: 'pale', stroke: 1, d: 'M30 11c3-4 8-5 12-3M38 22c6-4 14-5 22-2' },
      { tone: 'brass', stroke: 1.4, d: 'M40 8l4 6' },
      { tone: 'ink', d: 'M28 52c-3 5-2 11 2 14 3-2 4-7 3-12z' },
      // A high lace collar, scalloped at its rim, and a small cameo brooch.
      { tone: 'pale', on: 'figure', d: collar(0.66, 83, 92, 1.8) },
      { tone: 'pale', on: 'figure', d: dot(36, 93, 1.5) + dot(40.5, 95, 1.5) + dot(47.5, 96, 1.5) + dot(54.5, 95, 1.5) + dot(59, 93, 1.5) },
      { tone: 'ink', on: 'figure', stroke: 0.8, d: 'M38 87c3 2 7 2 10 2s7 0 10-2' },
      { tone: 'brass', on: 'figure', d: dot(47.5, 99.5, 2.4) },
      { tone: 'grey', on: 'figure', d: 'M25 120C25 112 30 105 38 101l9.5 8L57 101c8 4 13 11 13 19z' },
    ],
    // A leather notebook held to the chest, and the pencil in her fingers.
    prop: [
      { tone: 'ink', on: 'figure', d: 'M58 120c1-7 4-12 9-15l9 4c-3 3-5 7-5 11z' },
      { tone: 'leather', on: 'figure', d: 'M54 96l21-4.5 4.5 19-21 4.5z' },
      { tone: 'pale', on: 'figure', d: 'M59 99.5l12-2.6 2.2 9.5-12 2.6z' },
      { tone: 'ink', on: 'figure', stroke: 1, d: 'M62 103l8-1.8M63 106.5l8-1.8' },
      { tone: 'ink', on: 'figure', d: 'M66 112c1-4 5-6 9-5 3 1 4 4 2 6l-4 3c-3 1-6 0-7-4z' },
      { tone: 'brass', on: 'figure', stroke: 1.7, d: 'M75 109L86 96' },
      { tone: 'pale', on: 'figure', stroke: 1.7, d: 'M86 96l2.4-2.8' },
    ],
  },
}

export const CASTLE_SILHOUETTES: Record<string, SilhouetteDef> = {
  ...DRAWN,
  // The others stand in the likeness of someone from another setting.
  harker: MANOR.son,
  lucy: MANOR.heiress,
  godalming: THEATRE_SILHOUETTES.juvenile,
  seward: MANOR.duval,
  mrswestenra: MANOR.dowager,
  agatha: MANOR.nanny,
  coachman: THEATRE_SILHOUETTES.flyman,
}

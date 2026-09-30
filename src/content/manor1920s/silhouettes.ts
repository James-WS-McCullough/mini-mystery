// Cameo portraits for the Blackwood household, drawn broad: every sitter has
// a build, a head and a pose of their own, so that each can be known at a
// glance — and, at the size of a pin on the map, by colour alone.
//
// Coordinates live in a 100 × 120 box, the sitter facing right. A portrait
// shows only what anyone at the table can see — never anything about guilt.
//
// Traits are dealt afresh each case, so they are drawn separately: TRAIT_LOOKS
// is how each is usually worn, and a sitter may have a way of their own
// (`traits`). What a sitter holds when left to themselves is their `prop`,
// which they put down when a trait wants their hands.

import type { SilhouetteDef, TraitLook } from '../schema'

/** A filled disc, for pearls, medals and embers. */
function dot(cx: number, cy: number, r: number): string {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0z`
}

/** A curl of smoke rising from (x, y). */
function smoke(x: number, y: number): string {
  return `M${x} ${y}c4-5-3-9 1-15 3-4 0-8 2-12`
}

/** A four-pointed glint, for scent on the air. */
function glint(cx: number, cy: number, r: number): string {
  const k = r * 0.22
  return `M${cx} ${cy - r}l${k} ${r - k} ${r - k} ${k}-${r - k} ${k}-${k} ${r - k}-${k}-${r - k}-${r - k}-${k} ${r - k}-${k}z`
}

/**
 * Shoulders of a given half-width, sloping away from the base of the neck.
 * For the slighter sitters: the broad ones have bodies of their own. `neck`
 * is the sitter's own, so that the shoulders begin where the neck ends.
 */
function shoulders(half: number, neck = 1): string {
  const l = 48 - half
  const r = 48 + half
  const a = 47 - 12.5 * neck
  const b = 48 + 12.5 * neck
  const n = (v: number) => Math.round(v * 10) / 10
  return (
    `M${l} 120C${l} 109 ${n(l + (a - l) * 0.35)} 101 ${n(a - 1.5)} 97L${n(a)} 94.5H${n(b)}` +
    `L${n(b + 1.5)} 97C${n(r - (r - b) * 0.35)} 101 ${r} 109 ${r} 120z`
  )
}

/**
 * A band of cloth round the neck — a collar, a neckcloth, a scarf — from one
 * edge of the neck to the other. `top` and `foot` are where the neck's edges
 * are at the band's upper and lower rims: [left, right, height]. Measure them
 * from the drawing; a band that stops short of the neck shows as a gap.
 */
function band(top: [number, number, number], foot: [number, number, number]): string {
  const [l1, r1, y1] = top
  const [l2, r2, y2] = foot
  const w1 = r1 - l1
  const w2 = r2 - l2
  const n = (v: number) => Math.round(v * 10) / 10
  return (
    `M${l1} ${y1}c${n(w1 * 0.3)} 4.5 ${n(w1 * 0.7)} 5 ${n(w1)} 1L${r2} ${y2}` +
    `c${n(-w2 * 0.3)} 4 ${n(-w2 * 0.7)} 3.5 ${n(-w2)} -1z`
  )
}

/** A string of pearls across the neck, from edge to edge, sagging a little. */
function pearls(l: number, r: number, y: number, count: number, size = 1.6): string {
  let d = ''
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1)
    // Lowest a little forward of the middle, as a necklace hangs on a turned neck.
    const sag = Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.1)) * 3
    d += dot(Math.round((l + (r - l) * t) * 10) / 10, Math.round((y + sag) * 10) / 10, size)
  }
  return d
}

/** A forearm rising from the lower right to a hand at about (82, 76). */
const RAISED_ARM =
  'M72 120c1-9 4-16 9-21L79 78c-.5-3 1-5 3.5-5.5 2.5-.5 4.5 1 5 3.5l4 25c1 7-1 13-5 19z'
const RAISED_HAND = 'M77 76c-1-4 1-7.5 5-8.5 3-.5 6 1 7 4 .5 3-1 5.5-4 6.5-4 1-7 0-8-2z'

export const traitLooks: Record<string, TraitLook> = {
  cane: {
    takesHands: true,
    layers: [
      { tone: 'ink', on: 'figure', d: 'M54 120c2-13 9-23 19-29l7 8c-8 5-12 12-13 21z' },
      { tone: 'brass', on: 'figure', stroke: 3.4, d: 'M77 120V84' },
      { tone: 'brass', on: 'figure', stroke: 3.4, d: 'M77 84c0-9 13-9 14 1' },
      { tone: 'ink', on: 'figure', d: dot(76, 89, 6.5) },
    ],
  },
  smoker: {
    layers: [
      { tone: 'pale', d: 'M69 60.5l13-2.5.6 2.5-13 2.5z' },
      { tone: 'brass', d: dot(83.5, 59, 1.6) },
      { tone: 'brass', stroke: 1.3, d: smoke(85, 54) },
    ],
  },
  perfume: {
    layers: [
      { tone: 'brass', on: 'figure', d: glint(22, 74, 7) + glint(11, 60, 4.5) + glint(27, 56, 3.5) },
    ],
  },
  spectacles: {
    layers: [
      { tone: 'brass', stroke: 1.7, d: dot(62, 43, 5) },
      { tone: 'brass', stroke: 1.4, d: 'M57 42.5L40 45' },
      { tone: 'brass', stroke: 1.4, d: 'M67 42l2-1' },
    ],
  },
  gloves: {
    takesHands: true,
    layers: [
      { tone: 'pale', on: 'figure', d: 'M66 120l3-22c-1-6 0-11 3-14.5 2-2.5 5.5-3.5 8-2 2 1.5 2.5 4 1.5 6.5L79 97l5 23z' },
      { tone: 'pale', on: 'figure', d: 'M69 86c-2-4-1-8 2-9.5 3-1.5 6.5 0 8 3 1 3 0 6-3 7.5-3 1-5.5.5-7-1z' },
      { tone: 'brass', on: 'figure', d: dot(73, 101, 1.2) + dot(73.5, 106, 1.2) + dot(74, 111, 1.2) },
    ],
  },
}

export const silhouettes: Record<string, SilhouetteDef> = {
  // Barrel chest, shoulders like a mantelpiece, and a moustache to match.
  colonel: {
    tint: '#c8372d',
    head: { wide: 1.04, tall: 0.96 },
    body: 'M-2 120V101c0-6 5-9.5 13-10.5L33 87h30l22 3.5c8 1 13 4.5 13 10.5v19z',
    neck: 1.55,
    layers: [
      { tone: 'ink', d: 'M27 52C25 31 37 17.5 54 17h13.5l.5 9c-8-3.5-17-2.5-24 2.5-6 5-9 12.5-9 23.5z' },
      // A jaw you could strike a match on.
      { tone: 'ink', d: 'M56 68c5 2.5 11 2 15.5-2 2 6-1 12.5-8 14.5-5 .5-8-5-7.5-12.5z' },
      // A walrus moustache, worn over the mouth.
      { tone: 'ink', d: 'M63 55c4.5-1.5 9-.5 11 2.5 1.5 3.5 1.2 8.5-1.5 12.5-2-3.5-5.5-5.5-10.5-6z' },
      // Epaulettes, fringed.
      { tone: 'brass', on: 'figure', d: 'M0 96c0-3.5 3-6 8-6.5l13-2 1.5 7.5L0 99z' },
      { tone: 'brass', on: 'figure', d: 'M96 96c0-3.5-3-6-8-6.5l-13-2-1.5 7.5L96 99z' },
      { tone: 'brass', on: 'figure', stroke: 1.2, d: 'M3 100v5M8 99.5v5M13 98.5v5M18 97.5v5M93 100v5M88 99.5v5M83 98.5v5M78 97.5v5' },
      // A row of medals.
      { tone: 'brass', on: 'figure', stroke: 1.3, d: 'M40 101h22' },
      { tone: 'brass', on: 'figure', d: dot(43, 106.5, 2.6) + dot(51, 106.5, 2.6) + dot(59, 106.5, 2.6) },
    ],
  },

  // Thin as a taper, bald as an egg, hands together.
  vicar: {
    tint: '#3d5fd0',
    head: { wide: 0.9, tall: 1.12, tilt: 3 },
    body: shoulders(26),
    layers: [
      { tone: 'ink', d: 'M28.5 54c-5 3-5 16 3.5 23-2-7-2.5-15-1-22z' },
      // A long, doubtful nose.
      { tone: 'ink', d: 'M67 42l9 11.5c.5 2.5-3 3.5-6.5 3z' },
      { tone: 'pale', on: 'figure', d: band([35.7, 59.4, 87.5], [34, 61, 93.5]) },
    ],
    // A prayer book, held to the chest.
    prop: [
      { tone: 'ink', on: 'figure', d: 'M58 120c1-7 4-12 9-15l9 4c-3 3-5 7-5 11z' },
      { tone: 'pale', on: 'figure', d: 'M57 97l17-4 3 15-17 4z' },
      { tone: 'brass', on: 'figure', stroke: 1.3, d: 'M66.5 98.5l2 9M63.5 102l7.5-1.7' },
    ],
  },

  // A man of substance: a bull neck, a watch-chain, a cigar like a chair leg.
  trent: {
    tint: '#2f9960',
    head: { wide: 1.12, tall: 0.94 },
    body: 'M0 120c0-17 9-27 27-31l8-2h26l9 2.5c18 4.5 30 14 30 30.5z',
    neck: 1.45,
    layers: [
      { tone: 'ink', d: 'M28 52C25 30 40 13.5 56 14.5c9 .5 15 5 16 11-6-3-12-3-17-1.5-10 3-17 11-18.5 22-.5 4 0 7.5.5 10.5-4 0-8-1.5-9-4.5z' },
      { tone: 'ink', d: dot(71.5, 51.5, 4.2) },
      { tone: 'brass', on: 'figure', stroke: 1.4, d: 'M44 106c9 7 22 7 32-1' },
      { tone: 'brass', on: 'figure', d: dot(44, 106, 2.4) },
    ],
    traits: {
      // Nothing so slight as a cigarette.
      smoker: {
        layers: [
          { tone: 'ink', d: 'M69 60l19-4 1 4.5-19 4z' },
          { tone: 'brass', d: dot(89.5, 58, 2) },
          { tone: 'brass', stroke: 1.3, d: smoke(91, 53) },
        ],
      },
    },
  },

  // All neck and elbows, a long holder held high.
  josephine: {
    tint: '#c23f9a',
    head: { wide: 0.94, tall: 1, dy: -5, tilt: -6 },
    body: shoulders(25, 0.73),
    neck: 0.73,
    layers: [
      { tone: 'ink', d: 'M70.5 33C71 20 60 11.5 47 12.5 31 13.5 21 28 22 46c.5 12 3.5 22 9.5 29.5 7 2 14-1 15.5-7 2-8-1-16 1.5-24 2.5-7 9-11 22-11.5z' },
      { tone: 'brass', stroke: 2.4, d: 'M24.5 38c13-9 30-12 46-8.5' },
      { tone: 'ink', d: 'M33 32C24 25 19 14 21 2c9 7 15 18 15 29z' },
      { tone: 'brass', stroke: 1.2, d: 'M34 31C28 23 24 14 22 5' },
      { tone: 'pale', on: 'figure', d: dot(44, 96.5, 1.5) + dot(48.5, 98, 1.5) + dot(53, 97.5, 1.5) },
    ],
    // A glass of something, held high.
    prop: [
      { tone: 'ink', on: 'figure', d: RAISED_ARM },
      { tone: 'ink', on: 'figure', d: RAISED_HAND },
      { tone: 'pale', on: 'figure', stroke: 1.6, d: 'M83 70V59' },
      { tone: 'pale', on: 'figure', d: 'M75 47h16c0 7-3.5 12-8 12s-8-5-8-12z' },
    ],
    traits: {
      // The raised arm, the hand, the long holder.
      smoker: {
        takesHands: true,
        layers: [
          { tone: 'ink', on: 'figure', d: RAISED_ARM },
          { tone: 'ink', on: 'figure', d: RAISED_HAND },
          { tone: 'ink', on: 'figure', stroke: 1.8, d: 'M80 70L97 56' },
          { tone: 'brass', on: 'figure', d: dot(98, 55, 2) },
          { tone: 'brass', on: 'figure', stroke: 1.3, d: smoke(99, 50) },
        ],
      },
    },
  },

  // A hat like a cartwheel and a fox round her shoulders.
  vivienne: {
    tint: '#17a3a8',
    head: { wide: 0.96, tall: 1.02, dy: -2, tilt: -4 },
    body: 'M4 120c-3-9 0-17 8-21 2-5 7-7.5 12-6 3-3.5 8-5 12.5-3h17c4.5-2 9.5-.5 12.5 3 5-1.5 10 1 12 6 8 4 11 12 8 21z',
    neck: 0.73,
    layers: [
      { tone: 'ink', d: 'M6 36C18 24 40 17 62 18c14 .5 27 5 33 12-13 3.5-29 5.5-47 6.5-16 1-31 1.5-42-.5z' },
      { tone: 'ink', d: 'M32 27c1-12 11-19 24-18 10 1 17 8 17 18z' },
      { tone: 'brass', stroke: 2.2, d: 'M32 27c13-4 28-4 41 0' },
      // The plume.
      { tone: 'brass', d: 'M36 22C26 16 16 4 18-8c11 6 20 17 22 29z' },
      { tone: 'brass', stroke: 1, d: 'M45 62v6' },
      { tone: 'brass', d: dot(45, 69.5, 2) },
      { tone: 'pale', on: 'figure', d: dot(41, 85, 1.6) + dot(45, 86.6, 1.6) + dot(49, 87, 1.6) + dot(53, 85.8, 1.6) },
    ],
  },

  // Small, quick, and carrying a candle.
  elsie: {
    tint: '#8fb02c',
    head: { wide: 0.96, tall: 0.92, dy: 4 },
    body: 'M18 120c0-9 3-15 9-19-4-4-1-10 6-10.5 3.5 0 6 1.5 7.5 4h14c2-2.5 5-4 8.5-3.5 6 .5 8.5 6 5 10 6 4 9.5 10 9.5 19z',
    layers: [
      { tone: 'ink', d: 'M28 52C25.5 31 40 15.5 55 16.5c7 .4 12 4 13.5 9.5-7-3-16-2.5-23 2.5-7 5-10 12.5-10.5 23.5z' },
      { tone: 'ink', d: dot(21, 54, 9.5) },
      // The cap and its ribbons.
      { tone: 'pale', d: 'M38 23c1-6 3.5-11.5 7.5-11 2 .2 2 3.5 3.5 3.5 2 0 2.5-6 6-5.5 2.5.3 2 4 4 4.5 2.2.5 3.5-3.5 6.5-2 3.5 2 4.5 8 5 12.5-9-5-21-5.5-32.5-2z' },
      { tone: 'pale', stroke: 2, d: 'M38 23.5c-6 4-10 10-12 17' },
      { tone: 'pale', on: 'figure', d: 'M37 93c6 5 15 5.5 23 2.5l1.5 4.5c-9 3.5-19 3-27-2.5z' },
    ],
    // The candle, held out before her.
    prop: [
      { tone: 'ink', on: 'figure', d: 'M70 120c1-8 3-14 7-18l-1-9 9-1 3 12c1 6 0 11-2 16z' },
      { tone: 'ink', on: 'figure', d: 'M74 92h16l-2 5H76z' },
      { tone: 'pale', on: 'figure', d: 'M79.5 74h5v18h-5z' },
      { tone: 'brass', on: 'figure', d: 'M82 60c4 5 5 9 3.5 12-1.5 2.5-5.5 2.5-7 0-1.5-3-.5-7 3.5-12z' },
    ],
  },

  // Stooped, domed, bearded; spectacles like cartwheels.
  ellison: {
    tint: '#8db8d6',
    head: { wide: 0.98, tall: 1.08, dx: 2, tilt: 8 },
    body: 'M10 120c0-15 7-24 19-28l8-3h17l8 5c12 5 22 12 22 26z',
    layers: [
      { tone: 'ink', d: 'M31 49c-7 4-7 20 3 29-1-9-1.5-19-1-29z' },
      { tone: 'ink', d: 'M52 72c5 3 12 2 17-4 4 9 3 20-4 29-6-4-11-12-13-25z' },
      // The stethoscope.
      { tone: 'brass', on: 'figure', stroke: 1.5, d: 'M42 95c-2 9 1 17 9 21' },
      { tone: 'brass', on: 'figure', stroke: 1.5, d: 'M60 96c3 8 0 15-7 20' },
      { tone: 'brass', on: 'figure', d: dot(52, 116.5, 3) },
    ],
    traits: {
      // Spectacles like cartwheels.
      spectacles: {
        layers: [
          { tone: 'brass', stroke: 2, d: dot(62, 43, 6.5) },
          { tone: 'brass', stroke: 1.5, d: 'M55.5 42.5L40 45' },
          { tone: 'brass', stroke: 1.5, d: 'M68.5 42l2-1' },
        ],
      },
    },
  },

  // Narrow, upright, bowler-hatted; a nose for small print.
  barrow: {
    tint: '#d9661c',
    head: { wide: 0.86, tall: 1.14 },
    body: shoulders(25, 0.63),
    neck: 0.63,
    layers: [
      { tone: 'ink', d: 'M26 33C26 18 37 9 51 9s24 9 24 23z' },
      { tone: 'ink', d: 'M15 31.5c19-4 50-4 70 0 1.5 2.5 0 5-2.5 5.5-20-2.5-45-2.5-65 0-2.5-.5-4-3-2.5-5.5z' },
      { tone: 'ink', d: 'M66.5 41l11.5 14c.5 3-4 4.5-8.5 3.5z' },
      { tone: 'pale', on: 'figure', d: band([39.3, 55.8, 87], [38.3, 56.3, 92]) },
    ],
    // The papers, under his arm.
    prop: [
      { tone: 'pale', on: 'figure', d: 'M60 103l26-7 2.5 8-26 7z' },
      { tone: 'brass', on: 'figure', stroke: 1.4, d: 'M72 100l2.5 8' },
    ],
    traits: {
      // Pince-nez on a cord.
      spectacles: {
        layers: [
          { tone: 'brass', stroke: 1.5, d: dot(62.5, 43.5, 4) },
          { tone: 'brass', stroke: 0.9, d: 'M59.5 46.5c-7 12-9 30-3.5 45' },
        ],
      },
    },
  },

  // Seventeen: ringlets, an enormous bow, a gloved hand at her chin.
  constance: {
    tint: '#f08aa8',
    head: { wide: 1.04, tall: 0.94, dy: 3, tilt: -3 },
    body: 'M20 120c0-9 3-15 9-19-4-4-1-10 6-10.5 3.5 0 6 1.5 7.5 4h12c2-2.5 5-4 8.5-3.5 6 .5 8.5 6 5 10 6 4 9.5 10 9.5 19z',
    layers: [
      { tone: 'ink', d: 'M70.5 31C71 18.5 59 11.5 47 12.5 31 13.5 22 28 23 46c.5 15-4 31-11 47 9 5 21 2 28-5 2-6 1.5-12 0-16-1-10 2-20 8-27 5-6 13-9 22.5-14z' },
      // Ringlets.
      { tone: 'ink', d: dot(15, 72, 6) + dot(11, 84, 6) + dot(16, 96, 6) },
      { tone: 'brass', d: 'M46 13C38 0 22-3 18 5c-2 10 12 15 28 8z' },
      { tone: 'brass', d: 'M46 13C54 0 70-3 74 5c2 10-12 15-28 8z' },
      { tone: 'brass', d: 'M43.5 14l-5 13 5.5-2 2 4 2-4 5.5 2-5-13z' },
      { tone: 'ink', d: dot(46, 13, 3) },
    ],
    // A novel, held open.
    prop: [
      { tone: 'ink', on: 'figure', d: 'M64 120c1-8 4-14 10-18l8 5c-4 4-6 8-6 13z' },
      { tone: 'pale', on: 'figure', d: 'M66 92l12 3 12-5 2 13-13 5-12-3z' },
      { tone: 'ink', on: 'figure', stroke: 1, d: 'M78 95l1 13' },
    ],
  },

  // Built like a dresser, keys at her waist, a bun like a fist.
  pemberton: {
    tint: '#8257d6',
    head: { wide: 1.08, tall: 0.98, tilt: -3 },
    body: 'M2 120c0-15 8-25 25-29l9-2.5h22l10 3c17 4.5 27 13 27 28.5z',
    neck: 1.36,
    layers: [
      { tone: 'ink', d: 'M28 52C26 32 40 16 55 17c7 .4 11.5 4 13 9-7-3-15.5-2.5-22 2.5-7 5-10.5 12.5-11 23.5z' },
      { tone: 'ink', d: dot(29, 19, 11) },
      { tone: 'pale', on: 'figure', d: band([33.6, 61.8, 80], [30.2, 64.4, 90]) },
      { tone: 'brass', on: 'figure', d: dot(62.5, 95, 2.6) },
    ],
    // The household keys.
    prop: [
      { tone: 'brass', on: 'figure', stroke: 1.5, d: dot(72, 104, 5) },
      { tone: 'brass', on: 'figure', stroke: 1.8, d: 'M69 108.5l-4 9M72 109.5v9.5M75.5 108.5l4 9' },
    ],
  },

  // ---------- the wider household, and the guests who come and go ----------

  // A cap, a beard like a breaking wave, and brass buttons to the chin.
  captain: {
    tint: '#1f6fb5',
    head: { wide: 1.06, tall: 0.98 },
    body: 'M2 120c0-14 8-23 24-27l9-3h24l10 3c16 4 27 13 27 27z',
    neck: 1.45,
    layers: [
      { tone: 'pale', d: 'M26 31c0-13 11-21 26-21s23 7 24 19z' },
      { tone: 'ink', d: 'M25 29h52v6.5H25z' },
      { tone: 'ink', d: 'M66 33l17 4.5c1.5 2-.5 4-3 3.5L66 39z' },
      { tone: 'brass', d: dot(55, 21, 3.2) },
      { tone: 'ink', d: 'M38 64c6 12 20 14 31 3 3 11 0 24-11 31-12-3-20-16-20-34z' },
      { tone: 'brass', on: 'figure', d: dot(42, 103, 2.2) + dot(42, 112, 2.2) + dot(58, 104, 2.2) + dot(58, 113, 2.2) },
    ],
    // A spyglass, under the arm.
    prop: [
      { tone: 'brass', on: 'figure', d: 'M62 103l27-9 2.5 7-27 9z' },
      { tone: 'ink', on: 'figure', stroke: 1.6, d: 'M72 99.5l2.5 7.5' },
    ],
    traits: {
      // A pipe, naturally.
      smoker: {
        layers: [
          { tone: 'ink', stroke: 2.4, d: 'M69 61.5l11 4' },
          { tone: 'ink', d: 'M78 59h8.5v9.5c0 2.5-8.5 2.5-8.5 0z' },
          { tone: 'brass', d: 'M78.5 59h7.5v2h-7.5z' },
          { tone: 'brass', stroke: 1.3, d: smoke(83, 54) },
        ],
      },
    },
  },

  // A pith helmet, a moustache, and field glasses he never takes off.
  explorer: {
    tint: '#a8743a',
    head: { wide: 1, tall: 1, tilt: -3 },
    neck: 1.16,
    layers: [
      { tone: 'pale', d: 'M24 35c0-17 12-26 27-26s26 9 27 24z' },
      { tone: 'pale', d: 'M16 33c21-5 48-4 69 2 1.5 2.5-.5 5-3.5 4.5-21-3.5-43-4.5-63-1-2.5 0-4-3-2.5-5.5z' },
      { tone: 'ink', stroke: 1.8, d: 'M25 30c16-4.5 36-4.5 52 .5' },
      { tone: 'ink', d: 'M64.5 56c4.5-1.5 9-.5 11.5 3-3.5 2-8 1.5-11.5-.5z' },
      { tone: 'brass', on: 'figure', stroke: 1.3, d: 'M41 92l7 13M59 92l-6 13' },
      { tone: 'brass', on: 'figure', d: dot(46, 109, 4.2) + dot(55, 109, 4.2) },
      { tone: 'ink', on: 'figure', d: dot(46, 109, 2) + dot(55, 109, 2) },
    ],
  },

  // A great moustache, brows like hedges, and a rifle over the shoulder.
  hunter: {
    tint: '#8a6d2a',
    head: { wide: 1.04, tall: 1 },
    body: 'M4 120c0-14 8-23 24-27l9-3h24l10 3c16 4 26 13 26 27z',
    neck: 1.4,
    layers: [
      // Hair brushed flat, a widow's peak, the back of the head cropped close.
      { tone: 'ink', d: 'M27 50C24 30 36 17 54 17c7 0 12 2.5 15 6.5-8-1.5-16 .5-22 5-7 5-11 12-12 21.5z' },
      // The classic moustache, in brown: two lobes pinched together under the
      // nose and drooping to either side, each rounding off to a point.
      {
        tone: 'russet',
        d: 'M69 56.5C66 56 62.5 57 59.5 59.5 62 63 66 63 69 60.5zM69 56.5C72 56 75.5 57 78.5 59.5 76 63 72 63 69 60.5z',
      },
      // Brows like hedges.
      { tone: 'ink', stroke: 2.4, d: 'M57 40c4.5-2.5 9.5-2.5 13.5 .5' },
      // A bandolier across the chest, and the cartridges in it.
      { tone: 'brass', on: 'figure', stroke: 2.6, d: 'M28 94l40 26' },
      { tone: 'pale', on: 'figure', d: 'M34 96l3 2-1.5 3-3-2zM41 100.5l3 2-1.5 3-3-2zM48 105l3 2-1.5 3-3-2zM55 109.5l3 2-1.5 3-3-2z' },
    ],
    // The rifle, slung: barrel up past the far shoulder.
    prop: [
      { tone: 'ink', on: 'figure', d: 'M14 120l-3.5-1 12-46 3.5 1z' },
      { tone: 'brass', on: 'figure', d: 'M22.5 73l3.5 1-1.5 6-3.5-1z' },
      { tone: 'ink', on: 'figure', stroke: 2.4, d: 'M24 72l3-13' },
    ],
  },

  // A turban with a brooch, hoops in the ears, a shawl, and a glass ball held up to the light.
  medium: {
    tint: '#5b3a8c',
    head: { wide: 0.98, tall: 1, tilt: -4 },
    body: shoulders(27, 0.72),
    neck: 0.72,
    layers: [
      // The turban, wound high.
      { tone: 'ink', d: 'M23 38C19 18 36 6 55 9c13 2 20 11 19 22l3 5c-10-2-20-1-29 2-9 3-18 4-25 0z' },
      { tone: 'pale', stroke: 1.6, d: 'M27 30c14-8 30-9 44-4M25 36c15-6 32-7 47-3' },
      { tone: 'brass', d: 'M69 24l3.5 5.5 6.5.5-5 4 1.5 6.5-6-3.5-6 3.5 1.5-6.5-5-4 6.5-.5z' },
      // A hoop at the ear.
      { tone: 'brass', stroke: 1.5, d: 'M37 63a4.5 5.5 0 1 0 .1 0' },
      // The shawl, fringed, across the shoulders.
      { tone: 'pale', on: 'figure', stroke: 1.5, d: 'M24 108c8-6 18-9 26-8 8-1 17 2 24 8M30 112l-1 6M38 110l-1 6M46 109l-.5 6M56 109l.5 6M64 110l1 6' },
    ],
    // The crystal ball, held up in the raised hand.
    prop: [
      { tone: 'ink', on: 'figure', d: RAISED_ARM },
      { tone: 'ink', on: 'figure', d: RAISED_HAND },
      { tone: 'pale', on: 'figure', d: dot(86, 60, 8.5) },
      { tone: 'brass', on: 'figure', d: dot(83, 57, 2.4) },
    ],
  },

  // A straw hat, a nose like a new potato, something in flower.
  gardener: {
    tint: '#4f9a3a',
    head: { wide: 1.06, tall: 0.96, tilt: 4 },
    body: 'M6 120c0-14 8-23 23-27l8-2.5h20l9 3c15 4 25 12 25 26.5z',
    neck: 1.36,
    layers: [
      { tone: 'pale', d: 'M30 32c1-13 10-20 22-20s20 7 21 18z' },
      { tone: 'pale', d: 'M10 33c20-7 58-7 80 0 1.5 3-1 6-4.5 5.5-22-4.5-48-4.5-70 0-3.5.5-6.5-2.5-5.5-5.5z' },
      { tone: 'ink', stroke: 2, d: 'M30 30c13-3 29-3 43 0' },
      { tone: 'ink', d: dot(72, 51, 4.6) },
      // Whiskers.
      { tone: 'ink', d: 'M34 58c-5 6-5 16 2 22 4-6 5-14 3-22z' },
    ],
    prop: [
      { tone: 'ink', on: 'figure', d: 'M62 120c2-11 8-18 17-23l5 7c-6 4-9 9-10 16z' },
      { tone: 'ink', on: 'figure', d: dot(81, 97, 5.5) },
      { tone: 'pale', on: 'figure', stroke: 1.8, d: 'M82 96V72' },
      { tone: 'pale', on: 'figure', d: 'M82 84c-6-1-9-5-9-10 6 0 9 4 9 10zM82 80c6-1 9-5 9-10-6 0-9 4-9 10z' },
      { tone: 'brass', on: 'figure', d: dot(82, 63, 4) + dot(76, 66, 3.5) + dot(88, 66, 3.5) + dot(79, 59, 3.5) + dot(85, 59, 3.5) },
    ],
  },

  // Sixteen, a cap too big for her, two plaits and a duster.
  scullery: {
    tint: '#b9a3e0',
    head: { wide: 0.96, tall: 0.9, dy: 6 },
    body: shoulders(24),
    layers: [
      { tone: 'pale', d: 'M25 42c-4-17 8-31 25-31 15 0 25 9 25 22-9-5-19-6-28-3-9 3-16 7-22 12z' },
      { tone: 'ink', d: dot(24, 60, 5.5) + dot(22, 71, 5.5) + dot(23, 82, 5.5) },
      { tone: 'pale', stroke: 1.5, d: 'M20 88l3 7 3-7' },
      { tone: 'pale', on: 'figure', stroke: 2.2, d: 'M40 98l-3 22M58 98l3 22' },
    ],
    prop: [
      { tone: 'ink', on: 'figure', d: 'M66 120c1-10 6-17 14-21l5 6c-5 4-8 9-9 15z' },
      { tone: 'ink', on: 'figure', d: dot(83, 99, 5) },
      { tone: 'pale', on: 'figure', stroke: 1.8, d: 'M84 98V78' },
      { tone: 'pale', on: 'figure', d: 'M75 79c-4-10 0-20 9-23 9 3 13 13 9 23z' },
    ],
  },

  // Fourteen, a flat cap, hair that will not lie down, and somebody's boot.
  bootboy: {
    tint: '#7d9a2a',
    head: { wide: 1.02, tall: 0.88, dy: 8 },
    body: shoulders(23),
    layers: [
      { tone: 'ink', d: 'M25 35c0-13 10-20 25-20 12 0 21 5 23 14l11 3.5c1.5 2 0 4.5-2.5 4.5l-31 1c-9 0-18-1-25.5-3z' },
      { tone: 'ink', d: 'M28 40l-7 5 6 2-5 7 7-1-2 7 6-4z' },
      { tone: 'pale', on: 'figure', d: band([34.6, 60.4, 90.5], [33.9, 61.1, 95.5]) },
    ],
    prop: [
      { tone: 'ink', on: 'figure', d: 'M64 120c1-10 5-17 12-21l5 6c-4 4-7 9-8 15z' },
      { tone: 'ink', on: 'figure', d: 'M76 70h11v16l9 3.5c2.5 1 2.5 6 0 6H76z' },
      { tone: 'brass', on: 'figure', d: dot(81.5, 76, 1.6) + dot(81.5, 82, 1.6) },
      { tone: 'pale', on: 'figure', stroke: 1.5, d: 'M76 96h22' },
    ],
  },

  // Round as a cottage loaf, bonneted, and never without her knitting.
  nanny: {
    tint: '#d65f8a',
    head: { wide: 1.1, tall: 0.94, tilt: 5 },
    body: 'M4 120c0-15 9-24 25-28l8-2h20l9 3c16 4 26 12 26 27z',
    neck: 1.36,
    layers: [
      { tone: 'pale', d: 'M23 52C19 29 33 12 52 13c10 .5 17 6 19 14-8-3-17-2-24 3-7 5-10 13-11 25-5 0-10-1-13-3z' },
      { tone: 'pale', d: dot(24, 34, 4) + dot(28, 24, 4) + dot(36, 16, 4) + dot(46, 12, 4) },
      // The bonnet's ribbon, tied in a bow beneath the chin.
      { tone: 'pale', stroke: 2, d: 'M33 56c4 12 12 20 23 25' },
      { tone: 'pale', d: 'M57 81c-5-4-10-3.5-10.5-.5s4.5 5 10.5.5zM57 81c4-5 9-5.5 10.5-2.5s-3.5 5.5-10.5 2.5z' },
      { tone: 'pale', d: 'M55.5 82l-4 9 3.5-1 2 3 1.5-10zM58.5 82l5 8-3.5-.5-1.5 3.5-1.5-10z' },
    ],
    prop: [
      { tone: 'pale', on: 'figure', stroke: 1.6, d: 'M64 110l26-16M68 94l20 20' },
      { tone: 'brass', on: 'figure', d: dot(84, 114, 5.5) },
      { tone: 'brass', on: 'figure', stroke: 1.2, d: 'M80 110c-6-2-10-1-14 3' },
    ],
  },

  // All collar and composure, with a tray that has never once wobbled.
  butler: {
    tint: '#7d8aa0',
    head: { wide: 0.92, tall: 1.1, tilt: -5 },
    body: shoulders(28, 0.68),
    neck: 0.68,
    layers: [
      { tone: 'ink', d: 'M28.5 48c-6 5-6 20 3 29-2-9-2-20-.5-29z' },
      { tone: 'ink', d: 'M58 70c4 2 8 1.5 11-1.5 1.5 6-1 12-7 13.5-4 0-5-5-4-12z' },
      { tone: 'pale', on: 'figure', d: 'M38.4 84l8.6 8-10 3.5zM55.6 84l-8.6 8 10.8 3.5z' },
      { tone: 'ink', on: 'figure', d: 'M40 95l7 3 7-3v7l-7-3-7 3z' },
    ],
    prop: [
      { tone: 'ink', on: 'figure', d: 'M70 120c1-9 4-16 9-21L78 84c-.5-3 1-5 3.5-5.5 2.5-.5 4.5 1 5 3.5l3 19c1 7-1 13-5 19z' },
      { tone: 'pale', on: 'figure', d: 'M64 76h34v3.5H64z' },
      { tone: 'pale', on: 'figure', d: 'M74 58h8v18h-8zM76 52h4v6h-4z' },
      { tone: 'brass', on: 'figure', d: 'M86 66h7v10h-7z' },
    ],
  },

  // Built to her own recipes, in a cap like a cottage loaf, armed.
  cook: {
    tint: '#e26d5a',
    head: { wide: 1.12, tall: 0.95 },
    body: 'M2 120c0-15 8-25 25-29l9-2.5h22l10 3c17 4.5 27 13 27 28.5z',
    neck: 1.45,
    layers: [
      // A cook's cap: a band that sits on the brow, and the crown gathered above it.
      { tone: 'pale', d: 'M31 30c-6-7-2-17 8-17 3-5 11-6 16-1.5 8-2.5 15 2.5 14.5 10.5 0 3.5-1.5 6-3.5 8-12-3-24-3-35 0z' },
      { tone: 'pale', d: 'M29.5 29c12.5-3.5 26.5-3.5 39 0l.5 7c-13-3.5-27-3.5-40 0z' },
      { tone: 'ink', stroke: 0.9, d: 'M30 30.5c12.5-3.5 26-3.5 38.5 0' },
      { tone: 'ink', d: dot(71, 51.5, 3.8) },
      { tone: 'pale', on: 'figure', d: 'M38 97h24l5 23H33z' },
    ],
    prop: [
      { tone: 'ink', on: 'figure', d: 'M66 120c2-12 8-20 17-25l6 8c-6 4-9 10-10 17z' },
      { tone: 'ink', on: 'figure', d: dot(84, 93, 6) },
      { tone: 'brass', on: 'figure', d: 'M72 84l22-12 3.5 6.5-22 12z' },
      { tone: 'brass', on: 'figure', stroke: 2, d: 'M68 92l5-2.5M96 74l4-2' },
    ],
  },

  // Peaked cap, goggles pushed up, a scarf that is still travelling.
  chauffeur: {
    tint: '#3aa6c9',
    head: { wide: 0.98, tall: 1, tilt: -2 },
    layers: [
      { tone: 'ink', d: 'M26 31c0-13 11-21 26-21s23 7 24 19z' },
      { tone: 'ink', d: 'M25 29h52v6.5H25z' },
      { tone: 'ink', d: 'M66 33l18 5c1.5 2-.5 4.5-3 4L66 39z' },
      { tone: 'brass', stroke: 1.6, d: dot(42, 22, 5) + dot(55, 21, 5) },
      { tone: 'brass', stroke: 1.4, d: 'M37 23c-5 1-9 3-11 6M60 21c5 0 10 2 14 5' },
      { tone: 'ink', d: 'M65 57c4-1 8-.5 10.5 2-3.5 1.5-7.5 1-10.5-.5z' },
      { tone: 'pale', on: 'figure', d: 'M37.5 84c-8 2.5-16 1.5-23-3l-2.5 7.5c8 4.5 17 6 26 3.5z' },
      { tone: 'pale', on: 'figure', d: band([36.9, 58.1, 82], [35.4, 59.7, 89]) },
      { tone: 'brass', on: 'figure', d: dot(44, 103, 2) + dot(44, 111, 2) + dot(57, 104, 2) + dot(57, 112, 2) },
    ],
  },

  // A tiara, a chin held at the angle of a drawn sword, and a fan.
  dowager: {
    tint: '#8e3a6e',
    head: { wide: 1.06, tall: 1, tilt: -9, dy: -1 },
    body: 'M2 120c-2-10 2-19 12-23 3-5 9-7 14-5l9-3h20l9 3c6-2 11 1 14 6 9 4 13 12 11 22z',
    neck: 1.26,
    layers: [
      { tone: 'ink', d: 'M28 52C21 27 35 5 56 7c13 1 19 11 17 22-6-5-14-6-21-3-10 4-15 14-16 26z' },
      { tone: 'brass', d: 'M42 12l3-9 4.5 7 4.5-9 4.5 9 4.5-6 1 10z' },
      { tone: 'pale', on: 'figure', d: pearls(36.6, 58.8, 79.5, 6) },
      { tone: 'pale', on: 'figure', d: pearls(35.4, 60, 84.5, 6) },
    ],
    prop: [
      { tone: 'ink', on: 'figure', d: 'M64 120c2-10 7-17 15-21l5 6c-5 4-8 9-9 15z' },
      { tone: 'pale', on: 'figure', d: 'M78 100l14-30 5 2-9 32z' },
      { tone: 'brass', on: 'figure', d: dot(81, 101, 2.2) },
    ],
    traits: {
      // A lorgnette, raised.
      spectacles: {
        takesHands: true,
        layers: [
          { tone: 'ink', on: 'figure', d: RAISED_ARM },
          { tone: 'ink', on: 'figure', d: RAISED_HAND },
          { tone: 'brass', on: 'figure', stroke: 1.5, d: 'M82 70L72 46' },
          { tone: 'brass', on: 'figure', stroke: 1.6, d: dot(70, 41, 4.5) + dot(79, 39, 4.5) },
        ],
      },
    },
  },

  // A beret, a pointed beard, and paint on everything he owns.
  painter: {
    tint: '#d94f2a',
    head: { wide: 0.98, tall: 1.02, tilt: -4 },
    body: 'M14 120c0-13 7-21 20-25l6-3h16l7 3c13 4 21 12 21 25z',
    layers: [
      { tone: 'ink', d: 'M20 31c2-13 17-21 34-20 15 1 25 8 24 17-11 4-42 8-58 3z' },
      { tone: 'ink', stroke: 1.8, d: 'M50 11l3-6' },
      { tone: 'ink', d: 'M28 50c-7 7-8 24 0 35 4-11 4-24 3-35z' },
      { tone: 'ink', d: 'M58 70c3 2 7 1.5 10-1.5 3 7 1 15-5 21-4-4-6-11-5-19.5z' },
      { tone: 'ink', stroke: 1.6, d: 'M66 57c4 0 8 1 11-2' },
      { tone: 'pale', on: 'figure', d: 'M48 96c-7-6-15-7-18-2-1 6 7 9 18 2zM48 96c7-6 15-7 18-2 1 6-7 9-18 2z' },
      { tone: 'pale', on: 'figure', d: 'M45.5 97l-5 14 7.5-5 7.5 5-5-14z' },
    ],
    prop: [
      { tone: 'brass', on: 'figure', d: 'M62 106c0-8 8-13 18-12 9 1 14 6 13 12-1 6-8 9-17 8-9 0-14-3-14-8z' },
      { tone: 'ink', on: 'figure', d: dot(69, 106, 2.4) },
      { tone: 'pale', on: 'figure', d: dot(78, 100, 2) + dot(86, 103, 2) + dot(84, 110, 2) },
      { tone: 'pale', on: 'figure', stroke: 1.8, d: 'M80 94l12-26' },
      { tone: 'ink', on: 'figure', stroke: 2.6, d: 'M91 70l2.5-6' },
    ],
  },

  // A cloche hat, a rope of pearls, and her own reflection.
  heiress: {
    tint: '#35b89a',
    head: { wide: 0.95, tall: 0.98, dy: -3, tilt: -5 },
    body: shoulders(26, 0.68),
    neck: 0.68,
    layers: [
      { tone: 'ink', d: 'M25 46C21 25 35 10 54 11c12 1 20 9 20 20l3.5 6.5c-8 0-17 1-25 3.5-10 3-19 5-27.5 5z' },
      { tone: 'brass', stroke: 2.4, d: 'M26 37c15-7 33-9 48-5.5' },
      { tone: 'brass', d: 'M30 36c-7-5-13-4-14 1 0 5 6 7 14 3zM30 38c-6 4-8 10-5 13 4 1 7-4 7-11z' },
      { tone: 'ink', d: 'M44 60c-5 4-6 11-2 15 4-3 5-9 4-15z' },
      { tone: 'pale', on: 'figure', stroke: 1.6, d: 'M38.9 88c-3 12 .5 22 8.5 28 8.5-6 11.5-16 8.5-28' },
    ],
    prop: [
      { tone: 'ink', on: 'figure', d: RAISED_ARM },
      { tone: 'ink', on: 'figure', d: RAISED_HAND },
      { tone: 'brass', on: 'figure', d: dot(86, 61, 8) },
      { tone: 'pale', on: 'figure', d: dot(86, 61, 5.5) },
    ],
  },
  // A shingled bob, a bandeau with a feather, and a glass in her hand.
  daughter: {
    tint: '#f0cf3a',
    head: { wide: 0.96, tall: 0.97, dy: -1, tilt: -6 },
    body: shoulders(26),
    layers: [
      { tone: 'ink', d: 'M24 62C18 38 30 12 54 12c13 0 21 8 21 19l1 6c-7 1-14 0-20-3-2 9-2 19 1 29-10 6-24 5-33-1z' },
      { tone: 'ink', d: 'M24 60c-3 5-2 11 3 14 5-2 8-7 7-13z' },
      { tone: 'brass', stroke: 3, d: 'M27 33c15-7 32-9 47-5' },
      { tone: 'pale', d: 'M33 30C27 16 28 5 35 0c6 8 6 19 2 30z' },
      { tone: 'brass', d: dot(35, 31, 3.2) },
      { tone: 'pale', on: 'figure', stroke: 1.6, d: 'M35.6 92c-2.5 10 1.5 19 11.9 25 10.4-6 14.4-15 11.9-25' },
    ],
    prop: [
      { tone: 'ink', on: 'figure', d: RAISED_ARM },
      { tone: 'ink', on: 'figure', d: RAISED_HAND },
      { tone: 'pale', on: 'figure', d: 'M74 50h22l-11 14z' },
      { tone: 'pale', on: 'figure', stroke: 1.6, d: 'M85 64v10' },
      { tone: 'brass', on: 'figure', d: dot(88, 55, 2) },
    ],
  },
  // Brilliantined hair, a soft collar and a buttonhole.
  son: {
    tint: '#f2a03d',
    head: { wide: 0.97, tall: 1.03, dy: -2, tilt: -2 },
    body: 'M13 120c0-13 7-21 20-25l7-3h15l7 3c13 4 21 12 21 25z',
    layers: [
      { tone: 'ink', d: 'M27 47C23 27 35 11 54 11c11 0 19 5 21 14-9-4-20-4-29 0-7 4-13 12-19 22z' },
      { tone: 'pale', stroke: 1.4, d: 'M38 17c8-4 18-5 28-2' },
      { tone: 'pale', on: 'figure', d: 'M39 93l9 12 9-12-3-3H42z' },
      { tone: 'ink', on: 'figure', d: 'M48 97c-5-4-10-4-12-1 0 4 5 5 12 1zM48 97c5-4 10-4 12-1 0 4-5 5-12 1z' },
      { tone: 'brass', on: 'figure', d: dot(27, 106, 3.4) },
      { tone: 'pale', on: 'figure', d: dot(27, 106, 1.5) },
    ],
  },
}

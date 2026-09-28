// Cameo portraits for the Blackwood household, drawn broad: every sitter has
// a build, a head and a pose of their own, so that each can be known at a
// glance — and, at the size of a pin on the map, by colour alone.
//
// Coordinates live in a 100 × 120 box, the sitter facing right. A portrait
// shows only what anyone at the table can see — never anything about guilt.

import type { SilhouetteDef } from '../schema'

/** A filled disc, for pearls, medals and embers. */
function dot(cx: number, cy: number, r: number): string {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0z`
}

/** A curl of smoke rising from (x, y). */
function smoke(x: number, y: number): string {
  return `M${x} ${y}c4-5-3-9 1-15 3-4 0-8 2-12`
}

export const silhouettes: Record<string, SilhouetteDef> = {
  // Barrel chest, shoulders like a mantelpiece, and a moustache to match.
  colonel: {
    tint: '#c8372d',
    head: { wide: 1.04, tall: 0.96 },
    body: 'M-2 120V101c0-6 5-9.5 13-10.5L33 87h30l22 3.5c8 1 13 4.5 13 10.5v19z',
    layers: [
      { tone: 'ink', d: 'M27 52C25 31 37 17.5 54 17h13.5l.5 9c-8-3.5-17-2.5-24 2.5-6 5-9 12.5-9 23.5z' },
      // A jaw you could strike a match on.
      { tone: 'ink', d: 'M56 68c5 2.5 11 2 15.5-2 2 6-1 12.5-8 14.5-5 .5-8-5-7.5-12.5z' },
      // A walrus moustache, worn over the mouth.
      { tone: 'ink', d: 'M63 55c4.5-1.5 9-.5 11 2.5 1.5 3.5 1.2 8.5-1.5 12.5-2-3.5-5.5-5.5-10.5-6z' },
      // A bull neck.
      { tone: 'ink', on: 'figure', d: 'M32 80h32v14H32z' },
      // Epaulettes, fringed.
      { tone: 'brass', on: 'figure', d: 'M0 96c0-3.5 3-6 8-6.5l13-2 1.5 7.5L0 99z' },
      { tone: 'brass', on: 'figure', d: 'M96 96c0-3.5-3-6-8-6.5l-13-2-1.5 7.5L96 99z' },
      { tone: 'brass', on: 'figure', stroke: 1.2, d: 'M3 100v5M8 99.5v5M13 98.5v5M18 97.5v5M93 100v5M88 99.5v5M83 98.5v5M78 97.5v5' },
      // A row of medals.
      { tone: 'brass', on: 'figure', stroke: 1.3, d: 'M56 101h22' },
      { tone: 'brass', on: 'figure', d: dot(59, 106.5, 2.6) + dot(67, 106.5, 2.6) + dot(75, 106.5, 2.6) },
    ],
  },

  // Thin as a taper, bald as an egg, hands together.
  vicar: {
    tint: '#3d5fd0',
    head: { wide: 0.9, tall: 1.12, tilt: 5 },
    body: 'M24 120c0-11 5-18 14-22l5-3.5h12l6 3.5c9 4 14 11 14 22z',
    layers: [
      { tone: 'ink', d: 'M28.5 54c-5 3-5 16 3.5 23-2-7-2.5-15-1-22z' },
      // A long, doubtful nose.
      { tone: 'ink', d: 'M67 42l9 11.5c.5 2.5-3 3.5-6.5 3z' },
      { tone: 'pale', on: 'figure', d: 'M39.5 88c5 4 11 4.5 17 1.5l1 5c-6 3.5-13.5 3-19-1.5z' },
      // Hands pressed in prayer.
      { tone: 'ink', on: 'figure', d: 'M62 118c0-11 4-22 11-31 2.5 1 3.5 3.5 3.5 6.5 1.5 8 .5 17-3 25z' },
      { tone: 'pale', on: 'figure', d: 'M60.5 112l13.5 2.5-1 5.5-13.5-2.5z' },
    ],
  },

  // A man of substance: two chins, a watch-chain, a cigar like a chair leg.
  trent: {
    tint: '#2f9960',
    head: { wide: 1.12, tall: 0.94 },
    body: 'M0 120c0-17 9-27 27-31l8-2h26l9 2.5c18 4.5 30 14 30 30.5z',
    layers: [
      { tone: 'ink', d: 'M28 52C25 30 40 13.5 56 14.5c9 .5 15 5 16 11-6-3-12-3-17-1.5-10 3-17 11-18.5 22-.5 4 0 7.5.5 10.5-4 0-8-1.5-9-4.5z' },
      { tone: 'ink', d: 'M42 74c5 10 17 12 27 1 2 8-3 17-13 18-8 0-14-8-14-19z' },
      { tone: 'ink', d: dot(71.5, 51.5, 4.2) },
      { tone: 'ink', on: 'figure', d: 'M34 78h30v16H34z' },
      // The cigar, its ember and its smoke.
      { tone: 'ink', d: 'M69 60l19-4 1 4.5-19 4z' },
      { tone: 'brass', d: dot(89.5, 58, 2) },
      { tone: 'brass', stroke: 1.3, d: smoke(91, 53) },
      { tone: 'brass', on: 'figure', stroke: 1.4, d: 'M44 106c9 7 22 7 32-1' },
      { tone: 'brass', on: 'figure', d: dot(44, 106, 2.4) },
    ],
  },

  // All neck and elbows, a long holder held high.
  josephine: {
    tint: '#c23f9a',
    head: { wide: 0.94, tall: 1, dy: -5, tilt: -6 },
    body: 'M26 120c0-10 4-17 12-21l4-4h13l6 4c8 4 13 10 13 21z',
    layers: [
      { tone: 'ink', d: 'M70.5 33C71 20 60 11.5 47 12.5 31 13.5 21 28 22 46c.5 12 3.5 22 9.5 29.5 7 2 14-1 15.5-7 2-8-1-16 1.5-24 2.5-7 9-11 22-11.5z' },
      { tone: 'brass', stroke: 2.4, d: 'M24.5 38c13-9 30-12 46-8.5' },
      { tone: 'ink', d: 'M33 32C24 25 19 14 21 2c9 7 15 18 15 29z' },
      { tone: 'brass', stroke: 1.2, d: 'M34 31C28 23 24 14 22 5' },
      { tone: 'ink', on: 'figure', d: 'M41 76h15v22H41z' },
      // The raised arm, the hand, the holder.
      { tone: 'ink', on: 'figure', d: 'M72 120c1-9 4-16 9-21L79 78c-.5-3 1-5 3.5-5.5 2.5-.5 4.5 1 5 3.5l4 25c1 7-1 13-5 19z' },
      { tone: 'ink', on: 'figure', d: 'M77 76c-1-4 1-7.5 5-8.5 3-.5 6 1 7 4 .5 3-1 5.5-4 6.5-4 1-7 0-8-2z' },
      { tone: 'ink', on: 'figure', stroke: 1.8, d: 'M80 70L97 56' },
      { tone: 'brass', on: 'figure', d: dot(98, 55, 2) },
      { tone: 'brass', on: 'figure', stroke: 1.3, d: smoke(99, 50) },
      { tone: 'pale', on: 'figure', d: dot(44, 96.5, 1.5) + dot(48.5, 98, 1.5) + dot(53, 97.5, 1.5) },
    ],
  },

  // A hat like a cartwheel and a fox round her shoulders.
  vivienne: {
    tint: '#17a3a8',
    head: { wide: 0.96, tall: 1.02, dy: -2, tilt: -4 },
    body: 'M4 120c-3-9 0-17 8-21 2-5 7-7.5 12-6 3-3.5 8-5 12.5-3h17c4.5-2 9.5-.5 12.5 3 5-1.5 10 1 12 6 8 4 11 12 8 21z',
    layers: [
      { tone: 'ink', d: 'M6 36C18 24 40 17 62 18c14 .5 27 5 33 12-13 3.5-29 5.5-47 6.5-16 1-31 1.5-42-.5z' },
      { tone: 'ink', d: 'M32 27c1-12 11-19 24-18 10 1 17 8 17 18z' },
      { tone: 'brass', stroke: 2.2, d: 'M32 27c13-4 28-4 41 0' },
      // The plume.
      { tone: 'brass', d: 'M36 22C26 16 16 4 18-8c11 6 20 17 22 29z' },
      { tone: 'ink', on: 'figure', d: 'M41 78h15v16H41z' },
      { tone: 'brass', stroke: 1, d: 'M45 62v6' },
      { tone: 'brass', d: dot(45, 69.5, 2) },
      { tone: 'pale', on: 'figure', d: dot(41, 84.5, 1.7) + dot(45.5, 86.5, 1.7) + dot(50, 87.2, 1.7) + dot(54.5, 86, 1.7) },
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
      // The candle, held out before her.
      { tone: 'ink', on: 'figure', d: 'M70 120c1-8 3-14 7-18l-1-9 9-1 3 12c1 6 0 11-2 16z' },
      { tone: 'ink', on: 'figure', d: 'M74 92h16l-2 5H76z' },
      { tone: 'pale', on: 'figure', d: 'M79.5 74h5v18h-5z' },
      { tone: 'brass', on: 'figure', d: 'M82 60c4 5 5 9 3.5 12-1.5 2.5-5.5 2.5-7 0-1.5-3-.5-7 3.5-12z' },
    ],
  },

  // Stooped, domed, bearded; spectacles like cartwheels.
  ellison: {
    tint: '#8db8d6',
    head: { wide: 0.98, tall: 1.1, dx: 3, tilt: 11 },
    body: 'M10 120c0-15 7-24 19-28l8-3h17l8 5c12 5 22 12 22 26z',
    layers: [
      { tone: 'ink', d: 'M28.5 50c-6 4-5.5 19 4 27-2-8-2.5-18-.5-27z' },
      { tone: 'ink', d: 'M52 72c5 3 12 2 17-4 4 9 3 20-4 29-6-4-11-12-13-25z' },
      { tone: 'ink', on: 'figure', d: 'M24 100c2-9 8-14 16-14h10v12z' },
      { tone: 'brass', stroke: 2, d: dot(62, 43, 6.5) },
      { tone: 'brass', stroke: 1.5, d: 'M55.5 42.5L40 45' },
      { tone: 'brass', stroke: 1.5, d: 'M68.5 42l2-1' },
      // The stethoscope.
      { tone: 'brass', on: 'figure', stroke: 1.5, d: 'M42 95c-2 9 1 17 9 21' },
      { tone: 'brass', on: 'figure', stroke: 1.5, d: 'M60 96c3 8 0 15-7 20' },
      { tone: 'brass', on: 'figure', d: dot(52, 116.5, 3) },
    ],
  },

  // Narrow, upright, bowler-hatted; a nose for small print.
  barrow: {
    tint: '#d9661c',
    head: { wide: 0.86, tall: 1.14 },
    body: 'M26 120c0-11 5-18 13-21l4-3.5h13l5 3.5c8 3 13 10 13 21z',
    layers: [
      { tone: 'ink', d: 'M26 33C26 18 37 9 51 9s24 9 24 23z' },
      { tone: 'ink', d: 'M15 31.5c19-4 50-4 70 0 1.5 2.5 0 5-2.5 5.5-20-2.5-45-2.5-65 0-2.5-.5-4-3-2.5-5.5z' },
      { tone: 'ink', d: 'M66.5 41l11.5 14c.5 3-4 4.5-8.5 3.5z' },
      { tone: 'brass', stroke: 1.5, d: dot(62.5, 43.5, 4) },
      { tone: 'brass', stroke: 0.9, d: 'M59.5 46.5c-7 12-9 30-3.5 45' },
      { tone: 'ink', on: 'figure', d: 'M42 78h13v18H42z' },
      { tone: 'pale', on: 'figure', d: 'M54 86l8 7-7 3.5z' },
      // The papers, under his arm.
      { tone: 'pale', on: 'figure', d: 'M60 103l26-7 2.5 8-26 7z' },
      { tone: 'brass', on: 'figure', stroke: 1.4, d: 'M72 100l2.5 8' },
    ],
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
      // The long glove.
      { tone: 'pale', on: 'figure', d: 'M66 120l3-22c-1-6 0-11 3-14.5 2-2.5 5.5-3.5 8-2 2 1.5 2.5 4 1.5 6.5L79 97l5 23z' },
      { tone: 'pale', on: 'figure', d: 'M69 86c-2-4-1-8 2-9.5 3-1.5 6.5 0 8 3 1 3 0 6-3 7.5-3 1-5.5.5-7-1z' },
    ],
  },

  // Built like a dresser, keys at her waist, a bun like a fist.
  pemberton: {
    tint: '#8257d6',
    head: { wide: 1.08, tall: 0.98, tilt: -3 },
    body: 'M2 120c0-15 8-25 25-29l9-2.5h22l10 3c17 4.5 27 13 27 28.5z',
    layers: [
      { tone: 'ink', d: 'M28 52C26 32 40 16 55 17c7 .4 11.5 4 13 9-7-3-15.5-2.5-22 2.5-7 5-10.5 12.5-11 23.5z' },
      { tone: 'ink', d: dot(29, 19, 11) },
      { tone: 'ink', d: 'M46 74c5 8 15 9 23 0 2 7-2 15-11 16-7 0-12-7-12-16z' },
      { tone: 'ink', d: 'M60 69c4 2 8 1.5 11.5-2 1.5 5-1 10-6.5 11.5-4 0-5.5-4-5-9.5z' },
      { tone: 'ink', on: 'figure', d: 'M35 78h28v16H35z' },
      { tone: 'pale', on: 'figure', d: 'M36 80c8 5 19 5.5 27 1l1 9c-9 4.5-21 4-29-1z' },
      { tone: 'brass', on: 'figure', d: dot(64, 94, 2.6) },
      // The household keys.
      { tone: 'brass', on: 'figure', stroke: 1.5, d: dot(72, 104, 5) },
      { tone: 'brass', on: 'figure', stroke: 1.8, d: 'M69 108.5l-4 9M72 109.5v9.5M75.5 108.5l4 9' },
    ],
  },
}

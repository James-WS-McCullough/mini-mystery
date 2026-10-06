// Cameo portraits for the Wonderland evening. Seven of the company are drawn
// here, the ones nobody could mistake; the rest borrow a sitter from another
// setting who suits them. Same box, same tones: see
// ../manor1920s/silhouettes.ts for the conventions.

import type { SilhouetteDef } from '../schema'
import { silhouettes as MANOR } from '../manor1920s/silhouettes'
import { COLLEGE_SILHOUETTES } from '../college1927/silhouettes'
import { THEATRE_SILHOUETTES } from '../theatre1929/silhouettes'

/** A filled disc, for buttons, jewels and nostrils. */
function dot(cx: number, cy: number, r: number): string {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0z`
}

const n = (v: number) => Math.round(v * 10) / 10

/** A heart with its tip at the bottom, about (cx, cy), of size s. */
function heart(cx: number, cy: number, s: number): string {
  return (
    `M${n(cx)} ${n(cy + 0.9 * s)}L${n(cx - 1.1 * s)} ${n(cy - 0.1 * s)}` +
    `A${n(0.6 * s)} ${n(0.6 * s)} 0 0 1 ${n(cx)} ${n(cy - 0.55 * s)}` +
    `A${n(0.6 * s)} ${n(0.6 * s)} 0 0 1 ${n(cx + 1.1 * s)} ${n(cy - 0.1 * s)}z`
  )
}

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

/** A ruff: a flat ellipse round the neck, its lower rim scalloped. */
function ruff(cx: number, y: number, rx: number, ry: number, count: number, r: number): string {
  let d = `M${cx - rx} ${y}a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0z`
  for (let i = 0; i < count; i++) {
    const t = Math.PI * (i / (count - 1))
    d += dot(n(cx + rx * Math.cos(t)), n(y + ry * 1.05 * Math.sin(t)), r)
  }
  return d
}

/** A curl of steam or smoke rising from (x, y). */
function curl(x: number, y: number): string {
  return `M${x} ${y}c3-4-2-7 1-11 2-3 0-6 1-9`
}

/** A forearm rising from the lower right to a hand at about (82, 76). */
const RAISED_ARM =
  'M72 120c1-9 4-16 9-21L79 78c-.5-3 1-5 3.5-5.5 2.5-.5 4.5 1 5 3.5l4 25c1 7-1 13-5 19z'
const RAISED_HAND = 'M77 76c-1-4 1-7.5 5-8.5 3-.5 6 1 7 4 .5 3-1 5.5-4 6.5-4 1-7 0-8-2z'

export const WONDERLAND_SILHOUETTES: Record<string, SilhouetteDef> = {
  // A top hat with its price still in the band, a bow tie, and the tea held up.
  hatter: {
    tint: '#7b3fa0',
    head: { wide: 1, tall: 1.02, dy: 0, tilt: -2 },
    body: shoulders(27, 1),
    layers: [
      // Wild hair under the brim.
      { tone: 'russet', d: 'M30 40c-9 1-13 9-9 20 1-5 4-8 8-9zM30 55c-9 3-10 13-4 20 1-6 4-10 8-12zM34 38c-6 4-8 8-7 12z' },
      // The tall hat: crown, brim on the brow, the band, and the ticket tucked in it.
      { tone: 'ink', d: 'M33 33L36 5c3-6 29-6 32 0l3 28z' },
      { tone: 'ink', d: 'M19 31c20-4 46-4 67 0 2 3-1 5.5-4 6-18-3.5-41-3.5-59 0-3-.5-6-3-4-6z' },
      { tone: 'brass', d: 'M33.6 25.5l.8-7c11 2.5 24 2.5 35.5 0l.8 7c-12 3-25 3-37 0z' },
      { tone: 'pale', d: 'M51 15.5l10-1.2 1.2 10-10 1.2z' },
      { tone: 'ink', stroke: 1, d: 'M53 19.5l6-.7M53.5 22.5l5-.6' },
      // A long nose, and a grin.
      { tone: 'ink', d: 'M66 41l11 13c1 3-3 4-7 3.5z' },
      { tone: 'pale', stroke: 1.2, d: 'M62 64c4 3 8 3 11 1' },
      // Collar, and the big bow tie.
      { tone: 'pale', on: 'figure', d: collar(1, 85, 91) },
      { tone: 'russet', on: 'figure', d: 'M47.5 95c-6-6-14-6-17-1.5 1 6 9 6.5 17 1.5zM47.5 95c6-6 14-6 17-1.5-1 6-9 6.5-17 1.5z' },
      { tone: 'brass', on: 'figure', d: dot(47.5, 95, 2.2) },
      { tone: 'pale', on: 'figure', stroke: 1.2, d: 'M36 100l11.5 12 11.5-12' },
      { tone: 'brass', on: 'figure', d: dot(47.5, 115, 1.4) },
    ],
    // The cup on its saucer, held up on the fingertips, steaming.
    prop: [
      { tone: 'ink', on: 'figure', d: RAISED_ARM },
      { tone: 'ink', on: 'figure', d: RAISED_HAND },
      { tone: 'brass', on: 'figure', d: 'M74 66c4 2.5 13 2.5 17 0-.5 3.5-3.5 5-8.5 5s-7.5-1.5-8.5-5z' },
      { tone: 'pale', on: 'figure', d: 'M77 66c-.5-9 0-11 .5-12h12c.5 1 1 3 .5 12-4 3-9 3-13 0z' },
      { tone: 'pale', on: 'figure', stroke: 1.4, d: 'M90 57c5.5 0 5.5 7 0 7' },
      { tone: 'pale', on: 'figure', stroke: 1.2, d: 'M81 51c2-3-2-5 0-8M86 51c2-3-2-5 0-8' },
    ],
  },

  // Long ears, a waistcoat, and a watch on a chain, always checked.
  rabbit: {
    tint: '#2f6fd0',
    head: { wide: 0.96, tall: 0.92, dy: 2, tilt: 3 },
    body: shoulders(24, 0.8),
    neck: 0.8,
    layers: [
      // Two long ears, standing up and leaning back, pale within.
      { tone: 'ink', d: 'M40 30C33 14 35 -2 42 -8c7 2 10 16 9 33z' },
      { tone: 'ink', d: 'M50 26C50 10 56 -2 64 -6c5 4 3 19-2 33z' },
      { tone: 'pale', stroke: 1.4, d: 'M42 22C38 12 38 4 41 -2M58 22c0-8 3-16 6-22' },
      // A round muzzle with a pale nose, two buck teeth and whiskers.
      { tone: 'ink', d: 'M62 49c9-2 15 2 14 8-1 6-9 8-15 5z' },
      { tone: 'pale', d: dot(76.5, 53.5, 1.8) },
      { tone: 'pale', d: 'M66.5 62h3.5v5.5h-3.5zM70.5 61.5h3v5h-3z' },
      { tone: 'pale', stroke: 0.9, d: 'M72 57l13-3M72 59l14 2M71 61l12 6' },
      // Collar and cravat, a waistcoat, brass buttons and a pocket.
      { tone: 'pale', on: 'figure', d: collar(0.8, 85, 91) },
      { tone: 'pale', on: 'figure', d: 'M24 120c0-10 5-17 13-21l10.5 12 10.5-12c8 4 13 11 13 21z' },
      { tone: 'ink', on: 'figure', stroke: 1, d: 'M47.5 111v9M37 99l10.5 12' },
      { tone: 'brass', on: 'figure', d: dot(51, 109, 1.3) + dot(51, 115, 1.3) },
      { tone: 'brass', on: 'figure', stroke: 1.3, d: 'M33 108c5-1 11 0 13 2' },
    ],
    // The watch held up in a paw, its chain looping down to the pocket.
    prop: [
      { tone: 'ink', on: 'figure', d: RAISED_ARM },
      { tone: 'brass', on: 'figure', stroke: 1, d: 'M83 51c-4-9-16-4-18 8-1 10-6 32-14 49' },
      { tone: 'brass', on: 'figure', d: dot(83, 60, 8.5) },
      { tone: 'pale', on: 'figure', d: dot(83, 60, 6.5) },
      { tone: 'ink', on: 'figure', stroke: 1, d: 'M83 60v-4.5M83 60l3 2' },
      { tone: 'brass', on: 'figure', d: 'M81 49.5h4v3h-4z' },
      { tone: 'ink', on: 'figure', d: RAISED_HAND },
    ],
  },

  // The one sitter who faces the viewer: a round head drawn over the profile, two sharp ears, two slit eyes, and a grin with nothing to hold it up.
  cat: {
    tint: '#d6336c',
    head: { wide: 1.15, tall: 1.05, dy: 3, tilt: 0 },
    // Facing you, the Cat wears its spectacles square on: a rim round each eye, a bridge between, and the arms away to the ears.
    traits: {
      spectacles: {
        layers: [
          { tone: 'brass', stroke: 1.6, d: dot(37.5, 42, 9.5) + dot(60.5, 42, 9.5) },
          { tone: 'brass', stroke: 1.6, d: 'M47 42h4M28 41l-6-3M70 41l6-3' },
        ],
      },
    },
    body: shoulders(17, 0.9),
    neck: 0.9,
    layers: [
      // Two pointed ears, then the broad round face that hides the profile beneath.
      { tone: 'ink', d: 'M24 36L26 3l22 17z' },
      { tone: 'ink', d: 'M74 36L72 3L50 20z' },
      { tone: 'grey', d: 'M29 28l1.5-15 11 8zM69 28l-1.5-15-11 8z' },
      { tone: 'ink', d: 'M49 14a29 34 0 1 0 .1 0z' },
      // Stripes on the brow.
      { tone: 'grey', stroke: 2, d: 'M49 19v8M41 21l2 7M57 21l-2 7' },
      // Two almond eyes, each with a slit pupil.
      { tone: 'pale', d: 'M30 42c4-6 11-6 15 0-4 4-11 4-15 0zM53 42c4-6 11-6 15 0-4 4-11 4-15 0z' },
      { tone: 'ink', stroke: 1.8, d: 'M37.5 38.5v7M60.5 38.5v7' },
      // A small nose, and the grin, wide and full of teeth.
      { tone: 'pale', d: 'M46 50h6l-3 3.5z' },
      { tone: 'pale', d: 'M25 58c8 22 40 22 48 0-12 7-36 7-48 0z' },
      { tone: 'ink', stroke: 1.2, d: 'M33 63l.5 5M39 66l.5 5M45 67.5v5M53 67.5v5M59 66l-.5 5M65 63l-.5 5' },
      // A bell on a ribbon, a bare hint of a body.
      { tone: 'pale', on: 'figure', d: collar(0.9, 85, 90) },
      { tone: 'brass', on: 'figure', d: dot(47.5, 97, 2.8) },
    ],
  },

  // Soft and round and sleepy, a mushroom for a throne, and the hookah.
  caterpillar: {
    tint: '#2f9e5b',
    head: { wide: 1.08, tall: 0.92, dy: 3, tilt: 5 },
    body: 'M6 120c0-13 5-19 12-21 1-5 7-8 13-6l5 .5h18l5-.5c6-2 12 1 13 6 7 2 12 8 12 21z',
    neck: 1.1,
    layers: [
      // A bald, soft dome, with a pair of antennae.
      { tone: 'ink', d: 'M29 50C26 28 38 14 54 15c11 1 18 8 16 19-7-4-18-3-26 4-7 5-12 8-15 12z' },
      { tone: 'ink', stroke: 2.2, d: 'M47 18c-3-8-2-13 2-17M60 19c2-7 6-10 10-10' },
      { tone: 'ink', d: dot(50, 0.5, 2.8) + dot(71, 8.5, 2.8) },
      // A heavy lid over a pale eye, and a long, slow lip.
      { tone: 'pale', d: 'M56 47c3-4 9-4 13 0-4 3-9 3-13 0z' },
      { tone: 'ink', stroke: 2.4, d: 'M55.5 46c4-3 9-3 13.5 0' },
      { tone: 'pale', stroke: 1.2, d: 'M60 64c5 1 10 0 13-2' },
      // The segments of the body, ruffled at the neck.
      { tone: 'grey', on: 'figure', stroke: 1.4, d: 'M28 102c4 4 4 12 0 18M64 102c-4 4-4 12 0 18M47 99v21' },
      { tone: 'pale', on: 'figure', d: collar(1.1, 85, 91, 1.6) },
    ],
    // The hookah, its pipe in the hand, and the smoke rising.
    prop: [
      { tone: 'brass', on: 'figure', d: 'M57 120c-1-7 1-12 8-12s9 5 8 12z' },
      { tone: 'brass', on: 'figure', stroke: 2.2, d: 'M65 108V96' },
      { tone: 'brass', on: 'figure', d: 'M59 96c0-4 2-5 6-5s6 1 6 5z' },
      { tone: 'brass', on: 'figure', stroke: 1.4, d: 'M73 114c9-6-1-20 5-33' },
      { tone: 'ink', on: 'figure', d: RAISED_ARM },
      { tone: 'brass', on: 'figure', stroke: 2, d: 'M79 72L72 63' },
      { tone: 'ink', on: 'figure', d: RAISED_HAND },
      { tone: 'brass', on: 'figure', stroke: 1.4, d: curl(65, 88) },
    ],
  },

  // A crown of hearts, a ruff like a cartwheel, and a sceptre for pointing.
  queen: {
    tint: '#c92a2a',
    head: { wide: 1.04, tall: 1, dy: -1, tilt: -3 },
    body: shoulders(31, 1),
    layers: [
      // Hair piled under the crown, and curled at the nape.
      { tone: 'ink', d: 'M26 54C21 32 33 16 54 16c10 0 17 5 17 12-7-3-15-1-21 4-6 4-9 12-9 22z' },
      { tone: 'ink', d: dot(29, 62, 6.5) + dot(27, 50, 5.5) },
      // The crown, its band and three hearts.
      { tone: 'brass', d: 'M30 28c14-4 29-4 42 0l-.5 8c-13-4-28-4-41 0z' },
      { tone: 'brass', d: heart(38, 21, 5) + heart(52, 17, 5.5) + heart(66, 21, 5) },
      // Heavy brows, a jaw that means it.
      { tone: 'pale', stroke: 1.6, d: 'M58 42c4-2 8-2 11 0' },
      { tone: 'ink', d: 'M56 68c5 2.5 11 2 15-2 2 6-1 12-8 14-5 .5-7-5-7-12z' },
      { tone: 'pale', stroke: 1.2, d: 'M62 66c3 1.5 7 1.5 10 0' },
      // The ruff and the heart at the breast.
      { tone: 'pale', on: 'figure', d: ruff(47.5, 89, 24, 6, 9, 4.5) },
      { tone: 'ink', on: 'figure', stroke: 1, d: 'M30 91c5 3 12 4 17.5 4M65 91c-5 3-12 4-17.5 4' },
      { tone: 'brass', on: 'figure', d: heart(47.5, 106, 5.5) },
      { tone: 'pale', on: 'figure', stroke: 1.2, d: 'M30 120c1-9 6-14 11-16M65 120c-1-9-6-14-11-16' },
    ],
    // The sceptre, held upright in the fist, topped with a heart.
    prop: [
      { tone: 'ink', on: 'figure', d: RAISED_ARM },
      { tone: 'brass', on: 'figure', stroke: 2.6, d: 'M84 80V38' },
      { tone: 'ink', on: 'figure', d: RAISED_HAND },
      { tone: 'brass', on: 'figure', d: heart(84, 31, 6) },
      { tone: 'pale', on: 'figure', d: dot(84, 31, 1.5) },
    ],
  },

  // A headdress like a haystack, a jaw like a hod, and something pink in a shawl.
  duchess: {
    tint: '#e8590c',
    head: { wide: 1.06, tall: 1, dy: 2, tilt: 3 },
    body: 'M-2 120V104c0-7 6-11 14-12l22-4h26l20 4c8 1 14 5 14 12v16z',
    neck: 1.4,
    layers: [
      // The headdress: a great pale dome of folds, pinned with brass, with a feather.
      { tone: 'pale', d: 'M22 40C10 14 28 -8 52 -8c26 0 38 20 22 46-10-4-30-5-52 2z' },
      { tone: 'ink', stroke: 1.2, d: 'M30 28c8-12 20-18 32-17M26 18c10-10 24-14 38-10M40 36c-4-14 0-28 10-34M56 34c-2-14 2-26 12-30' },
      { tone: 'brass', d: dot(30, 33, 3.5) },
      { tone: 'ink', d: dot(30, 33, 1.5) },
      // A jaw like a hod, a double chin, and a scowl.
      { tone: 'ink', d: 'M54 68c8 3 17 2 22-3 3 7-1 15-10 16-8 0-12-5-12-13z' },
      { tone: 'ink', d: 'M42 78c7 8 16 8 26 3l-4 8c-9 3-18 0-22-11z' },
      { tone: 'pale', stroke: 1.4, d: 'M60 64c5-1 9 0 13 2' },
      { tone: 'pale', stroke: 1.6, d: 'M56 45l12 3' },
      // A frilled collar, a brooch.
      { tone: 'pale', on: 'figure', d: collar(1.4, 84, 91, 0.6) },
      { tone: 'brass', on: 'figure', d: dot(30, 100, 3.2) },
    ],
    // The baby, a pig in a shawl, rocked in the crook of her arm.
    prop: [
      { tone: 'ink', on: 'figure', d: 'M60 120c1-8 5-15 11-19l9 4c-3 4-6 8-7 15z' },
      { tone: 'pale', on: 'figure', d: 'M54 104C55 92 78 88 90 97c6 9 3 20-4 23H56z' },
      { tone: 'grey', on: 'figure', d: dot(76, 93, 8) },
      { tone: 'grey', on: 'figure', d: 'M69 88l-3-9 9 3zM79 86l3-9 6 8z' },
      { tone: 'ink', on: 'figure', d: 'M79 94.5a4 3.3 0 1 0 8 0a4 3.3 0 1 0 -8 0z' },
      { tone: 'pale', on: 'figure', d: dot(81.5, 94.5, 0.8) + dot(84.5, 94.5, 0.8) },
      { tone: 'ink', on: 'figure', d: dot(75, 90.5, 1.2) },
      { tone: 'ink', on: 'figure', stroke: 1.2, d: 'M62 108c6-3 14-3 22 0M60 114c8-3 17-3 26 0' },
      { tone: 'ink', on: 'figure', d: 'M60 114c2-6 8-8 13-6l3 5c-4 4-10 6-16 1z' },
    ],
  },

  // An egg, plainly: a great ink oval over the head with a round-eyed face, a tiny cravat, stick arms, and a wall to sit on.
  humpty: {
    tint: '#0b9aa8',
    head: { wide: 1, tall: 1, dy: 2, tilt: 0 },
    // Facing you, the egg's spectacles sit square on: a rim round each eye and a bridge between.
    traits: {
      spectacles: {
        layers: [
          { tone: 'brass', stroke: 1.6, d: dot(40, 46, 9.5) + dot(60, 46, 9.5) },
          { tone: 'brass', stroke: 1.6, d: 'M49.5 46h1M30.5 45l-6-2M69.5 45l6-2' },
        ],
      },
    },
    body: 'M24 120c0-14 8-22 20-24h8c12 2 20 10 20 24z',
    neck: 0.3,
    layers: [
      // The egg, narrower at the top, with the shine and a crack across it.
      { tone: 'ink', d: 'M50 14C67 14 78 36 78 54 78 72 66 85 50 85 34 85 22 72 22 54 22 36 33 14 50 14z' },
      { tone: 'pale', stroke: 1.6, d: 'M36 26c4-5 9-8 14-8' },
      { tone: 'pale', stroke: 1.2, d: 'M64 30l-5 4 4 4-5 3' },
      // Two round eyes with ink pupils, rosy cheeks, and a small smile.
      { tone: 'pale', d: dot(40, 46, 7.5) + dot(60, 46, 7.5) },
      { tone: 'ink', d: dot(41, 47, 3.4) + dot(59, 47, 3.4) },
      { tone: 'pale', d: dot(42.2, 45.5, 1.1) + dot(60.2, 45.5, 1.1) },
      { tone: 'pale', d: dot(32, 62, 3.2) + dot(68, 62, 3.2) },
      { tone: 'pale', stroke: 1.8, d: 'M42 66c5 5 11 5 16 0' },
      // A tiny cravat at the base, and its pin.
      { tone: 'pale', on: 'figure', d: 'M42 97l6-3.5 6 3.5-3 7h-6z' },
      { tone: 'brass', on: 'figure', d: dot(48, 100, 1.3) },
      // Stick arms, folded on the wall.
      { tone: 'ink', on: 'figure', stroke: 2.4, d: 'M28 108c-5 0-9-3-11-7M68 108c5 0 9-3 11-7M32 108c7 3 25 3 32 0' },
      // The wall.
      { tone: 'grey', on: 'figure', d: 'M-2 111h104v12H-2z' },
      { tone: 'ink', on: 'figure', stroke: 1, d: 'M-2 116h104M14 111v5M38 111v5M62 111v5M86 111v5M26 116v6M50 116v6M74 116v6' },
    ],
  },

  // The company borrowed from other evenings.
  hare: COLLEGE_SILHOUETTES.undergraduate,
  dormouse: MANOR.nanny,
  cook: MANOR.cook,
  king: COLLEGE_SILHOUETTES.master,
  knave: THEATRE_SILHOUETTES.juvenile,
  turtle: COLLEGE_SILHOUETTES.scout,
  gryphon: THEATRE_SILHOUETTES.flyman,
}

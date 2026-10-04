// Cameo portraits for the Empress Theatre's own company (the rest are drawn in
// the manor's silhouettes). Same box, same tones: see
// ../manor1920s/silhouettes.ts for the conventions. The company are known by
// what they wear and carry: the actor-manager by his mane and his raised hand,
// the stage manager by his prompt book, the ASM by her torch, and so on.

import type { SilhouetteDef } from '../schema'

/** A filled disc, for buttons, brooches and beads. */
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

/** Beads along a curve (a quadratic, from p to q by way of c), evenly spaced. */
function beadsAlong(p: [number, number], c: [number, number], q: [number, number], count: number, size: number): string {
  let d = ''
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1)
    const x = (1 - t) ** 2 * p[0] + 2 * (1 - t) * t * c[0] + t ** 2 * q[0]
    const y = (1 - t) ** 2 * p[1] + 2 * (1 - t) * t * c[1] + t ** 2 * q[1]
    d += dot(n(x), n(y), size)
  }
  return d
}

/** Short cross-strokes along the line from p to q, as the ticks on a tape measure. */
function ticks(p: [number, number], q: [number, number], count: number, half: number): string {
  const dx = q[0] - p[0]
  const dy = q[1] - p[1]
  const len = Math.hypot(dx, dy)
  const nx = dy / len
  const ny = -dx / len
  let d = ''
  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1)
    const x = p[0] + dx * t
    const y = p[1] + dy * t
    d += `M${n(x - nx * half)} ${n(y - ny * half)}L${n(x + nx * half)} ${n(y + ny * half)}`
  }
  return d
}

/** A closed loop (an ellipse turned through `deg`), as a path of short segments: a coil of rope. */
function loop(cx: number, cy: number, rx: number, ry: number, deg: number): string {
  const a = (deg * Math.PI) / 180
  let d = ''
  for (let i = 0; i < 28; i++) {
    const t = (i / 28) * Math.PI * 2
    const x = rx * Math.cos(t)
    const y = ry * Math.sin(t)
    d += `${i ? 'L' : 'M'}${n(cx + x * Math.cos(a) - y * Math.sin(a))} ${n(cy + x * Math.sin(a) + y * Math.cos(a))}`
  }
  return d + 'z'
}

/** A forearm rising from the lower right to a hand at about (82, 76). */
const RAISED_ARM =
  'M72 120c1-9 4-16 9-21L79 78c-.5-3 1-5 3.5-5.5 2.5-.5 4.5 1 5 3.5l4 25c1 7-1 13-5 19z'
const RAISED_HAND = 'M77 76c-1-4 1-7.5 5-8.5 3-.5 6 1 7 4 .5 3-1 5.5-4 6.5-4 1-7 0-8-2z'
/** A forearm held low and forward, for what hangs from the hand. */
const LOW_ARM = 'M64 120c1-9 5-16 11-20l6 5c-4 4-7 9-8 15z'

export const THEATRE_SILHOUETTES: Record<string, SilhouetteDef> = {
  // Leonine: a mane swept back off a great brow, a fur collar, and one hand raised to declaim.
  actormanager: {
    tint: '#682768',
    head: { wide: 1.04, tall: 1.02, tilt: -4 },
    body: 'M0 120c0-15 8-24 24-28l9-3h30l9 3c16 4 24 13 24 28z',
    neck: 1.35,
    layers: [
      // The mane, up from the brow and back over the crown to the collar, with grey at the temples.
      { tone: 'ink', d: 'M71 29C72 12 58 3 43 5 25 7 12 22 14 44c1 12 5 24 11 33 5 1 10-2 12-7-3-9-3-18 0-26 3-10 11-15 21-17 6-1 10 0 13 2z' },
      { tone: 'grey', stroke: 1.3, d: 'M64 12C48 8 30 14 22 30M60 19C46 17 32 23 27 36M52 11C37 11 24 20 19 36' },
      { tone: 'grey', stroke: 2, d: 'M40 40c-1.5 6-1 11 1 16M46 36c-1 7-1 12 1 18' },
      { tone: 'grey', stroke: 1.4, d: 'M20 50c1 10 4 20 8 27M25 48c1 9 3 17 7 24' },
      // Brows, strong and level.
      { tone: 'grey', stroke: 2.2, d: 'M57 39c5-2.5 10-2.5 14 0' },
      // The high wing collar and its points; the shirt front; the wide bow tie.
      { tone: 'pale', on: 'figure', d: collar(1.35, 82, 91, 1) },
      { tone: 'pale', on: 'figure', d: 'M34.5 90l5 3-3.5 5zM60.5 90l-5 3 3.5 5z' },
      { tone: 'pale', on: 'figure', d: 'M31 92h33l-7 24H38z' },
      { tone: 'ink', on: 'figure', d: 'M47.5 97c-8-6.5-17-6.5-18 -1-.5 5.5 10 7 18 1zM47.5 97c8-6.5 17-6.5 18-1 .5 5.5-10 7-18 1z' },
      { tone: 'brass', on: 'figure', d: dot(47.5, 97, 1.7) },
      // The fur collar of the coat, greyed, curling at its edge.
      { tone: 'grey', on: 'figure', d: 'M10 120c0-12 6-19 17-24l8-4 6 5 6 17-6 6zM85 120c0-12-6-19-17-24l-8-4-6 5-6 17 6 6z' },
      { tone: 'grey', on: 'figure', d: dot(13, 113, 3) + dot(17, 106, 3) + dot(22, 100, 3) + dot(28, 95.5, 3) + dot(82, 113, 3) + dot(78, 106, 3) + dot(73, 100, 3) + dot(67, 95.5, 3) },
      { tone: 'ink', on: 'figure', stroke: 1, d: 'M18 114c3-6 8-10 14-13M24 119c3-5 7-9 12-12M77 114c-3-6-8-10-14-13M71 119c-3-5-7-9-12-12' },
    ],
    // The hand raised, palm out, the fingers spread: declaiming.
    prop: [
      { tone: 'ink', on: 'figure', d: RAISED_ARM },
      { tone: 'ink', on: 'figure', stroke: 2.8, d: 'M78.5 70L74 58M82 68.5L81 55M86 69L88 56M89 71.5L95 62M77 77L70 73' },
      { tone: 'ink', on: 'figure', d: RAISED_HAND },
    ],
  },

  // A glossy marcelled bob, a long drop earring, bare shoulders under a fur stole, and roses on her arm.
  leadinglady: {
    tint: '#d0255e',
    head: { wide: 0.94, tall: 1, tilt: -5 },
    body: shoulders(29, 0.7),
    neck: 0.7,
    layers: [
      // The bob, waved, with a fringe of curl on the brow.
      { tone: 'ink', d: 'M72 31C72 16 60 9 47 10 31 11 21 25 22 45c0 11 2 21 6 29 5 1 11-1 14-6-2-8-2-16 1-23 3-8 10-12 20-13 6 0 9 0 9-1z' },
      { tone: 'ink', d: 'M28 70c-4 3-6 7-5 11 5 1 11-1 14-6zM60 25c6 0 11 3 13 8-4-2-9-3-14-2z' },
      { tone: 'pale', stroke: 1.2, d: 'M31 21c8-6 18-8 28-4M26 32c3-5 7-8 11-10' },
      { tone: 'pale', stroke: 0.9, d: 'M25 46c3 2 5 5 5 9M26 58c3 2 4 5 4 8' },
      // The long drop earring.
      { tone: 'brass', stroke: 1.1, d: 'M42 60v14' },
      { tone: 'brass', d: dot(42, 76.5, 3) },
      // The fur stole, over the bare shoulders and down the front, and the long string of beads.
      { tone: 'grey', on: 'figure', d: 'M14 120c0-10 4-18 13-23 5-3 11-5 16-5l2 8c-5 1-10 4-12 9-2 4-2 8-1 11z' },
      { tone: 'grey', on: 'figure', d: 'M82 120c0-10-4-18-13-23-5-3-11-5-16-5l-2 8c5 1 10 4 12 9 2 4 2 8 1 11z' },
      { tone: 'grey', on: 'figure', d: 'M60 102l9 2-4 16-9-2z' },
      { tone: 'ink', on: 'figure', stroke: 1, d: 'M20 112c3-6 7-10 12-12M76 112c-3-6-7-10-12-12M64 108l3 8' },
      { tone: 'pale', on: 'figure', d: beadsAlong([41, 91], [36, 124], [53, 118], 9, 1.3) + beadsAlong([53, 118], [60, 112], [55, 91], 5, 1.3) },
    ],
    // A bouquet of roses, cradled in the crook of the arm.
    prop: [
      { tone: 'ink', on: 'figure', stroke: 2.4, d: 'M71 106L79 86M72 106L90 82M73 106L94 92' },
      { tone: 'ink', on: 'figure', d: 'M75 88c-8-1-13-5-14-11 8-1 13 4 14 11zM78 75c-5-5-5-10-2-14 5 2 6 8 2 14z' },
      { tone: 'pale', on: 'figure', d: dot(78, 84, 6.6) + dot(89.5, 80, 6.2) + dot(94, 92, 5.6) + dot(84, 72, 5.2) },
      { tone: 'ink', on: 'figure', stroke: 0.9, d: 'M75 83c2-2.5 6-2.5 6 .5M86.5 79c2-2.5 6-2.5 6 .5M91.5 91c2-2 5-2 5 .5M81.5 71c2-2 4-2 4 .3M78 84c0 2 2 3 4 2M89.5 80c0 2 2 3 4 2' },
      { tone: 'ink', on: 'figure', d: LOW_ARM },
    ],
  },

  // Brilliantined hair, a clean jaw, a cricket sweater, and the script rolled in his fist.
  juvenile: {
    tint: '#52c9e0',
    head: { wide: 1, tall: 1.02, tilt: -2 },
    body: shoulders(27, 1),
    layers: [
      // Hair slicked over from a parting, a quiff at the front, a high shine.
      { tone: 'ink', d: 'M27 49C24 28 37 13 54 13c10 0 17 4 20 11 1 3 0 5-2 6-6-4-14-4-22 1-7 5-11 12-12 20z' },
      { tone: 'pale', stroke: 1.5, d: 'M37 22c8-5 18-6 28-3M45 17c5-1 10-1 14 1' },
      // A clean jaw.
      { tone: 'ink', d: 'M52 69c6 3 12 3 18-1 1 5-1 9-5 11-7 1-12-3-13-10z' },
      // The cricket sweater, a V at the neck with a brass stripe round it.
      { tone: 'pale', on: 'figure', d: 'M20 120c0-13 6-21 18-25l-2-5c4 2 8 4 11 5.5 3-1.5 7-3.5 11-5.5l-2 5c12 4 18 12 18 25z' },
      { tone: 'brass', on: 'figure', stroke: 2, d: 'M35 92l12.5 19L60 92' },
      { tone: 'brass', on: 'figure', stroke: 1.6, d: 'M25 118c1-8 4-14 10-18M70 118c-1-8-4-14-10-18' },
    ],
    // The script, rolled, in the fist.
    prop: [
      { tone: 'ink', on: 'figure', d: LOW_ARM },
      { tone: 'pale', on: 'figure', d: 'M66.7 105.4L88.7 77.4L95.3 82.6L73.3 110.6z' },
      { tone: 'ink', on: 'figure', stroke: 1.2, d: 'M88.7 77.4c2.5-.8 5.5 0 6.6 5.2M84 83.5l5.8 4.4' },
      { tone: 'ink', on: 'figure', d: dot(74, 105, 5.6) },
    ],
  },

  // Plump, a bun with wisps loose from it, a double chin, a shawl and a brooch, and her knitting.
  characteractress: {
    tint: '#c7996b',
    head: { wide: 1.08, tall: 0.96, tilt: -3 },
    body: 'M2 120c0-15 8-24 24-28l10-3h24l10 3c16 4 26 13 26 28z',
    neck: 1.3,
    layers: [
      { tone: 'ink', d: 'M28 52C26 33 39 17 55 17.5c7 .3 12 4 14 9-7-3-14-3-21 2-7 5-10 12-11 23.5z' },
      { tone: 'ink', d: dot(30, 29, 10) },
      { tone: 'grey', stroke: 1.2, d: 'M24 25c4-3 9-3 13-.5M23 32c5-2 9-1 13 2' },
      // Wisps, escaping at the nape and the brow.
      { tone: 'ink', stroke: 1.2, d: 'M21 38c-5 2-7 7-6 12M26 20c-4-3-9-2-11 2M33 57c-3 4-4 8-2 12M65 25c3 0 6 2 8 5' },
      // A double chin, and a second.
      { tone: 'ink', d: 'M48 72c7 5 15 4 21-1 2 7-1 13-9 14-6-1-11-6-12-13z' },
      { tone: 'ink', d: 'M43 82c6 6 15 6 21 0 1 5-2 9-9 10-6-1-11-4-12-10z' },
      // The shawl, grey, over the shoulders and crossed at the breast, with its fringe.
      { tone: 'grey', on: 'figure', d: 'M4 120c0-14 7-22 21-27l10-3 12 24 12-24 10 3c14 5 21 13 21 27z' },
      { tone: 'ink', on: 'figure', stroke: 1.1, d: 'M16 112c6-9 14-14 23-16M80 112c-6-9-14-14-23-16M26 119c4-6 9-10 15-13M70 119c-4-6-9-10-15-13' },
      // The brooch.
      { tone: 'brass', on: 'figure', d: dot(30, 105, 3.6) },
      { tone: 'pale', on: 'figure', d: dot(30, 105, 1.4) },
    ],
    // Knitting, held low: two needles from the fist, the work hanging below, a ball of wool.
    prop: [
      { tone: 'ink', on: 'figure', d: LOW_ARM },
      { tone: 'pale', on: 'figure', d: 'M68 106h14l-1.5 10H69.5z' },
      { tone: 'ink', on: 'figure', stroke: 0.8, d: 'M70 109.5h10M70.5 112.5h9.5' },
      { tone: 'brass', on: 'figure', stroke: 2, d: 'M74 104L93 83M77 103L63 83' },
      { tone: 'brass', on: 'figure', d: dot(93.5, 82.5, 1.4) + dot(62.5, 82.5, 1.4) },
      { tone: 'ink', on: 'figure', d: dot(76, 104, 4.6) },
      { tone: 'pale', on: 'figure', d: dot(57, 110, 6.6) },
      { tone: 'ink', on: 'figure', stroke: 0.8, d: 'M51.5 108c3 3 8 4 11 2M52 113c3-1 6-3 8-6M54 105c3-1 6 0 8 2' },
      { tone: 'pale', on: 'figure', stroke: 1, d: 'M63 108c3-1 6-1 9-.5' },
    ],
  },

  // Cropped hair, a jaw like a brick, shirtsleeves rolled over a waistcoat, a pencil behind the ear, the prompt book.
  stagemanager: {
    tint: '#794715',
    head: { wide: 1.06, tall: 0.96 },
    body: 'M2 120c0-14 8-23 24-27l9-3h24l10 3c16 4 27 13 27 27z',
    neck: 1.5,
    layers: [
      // Hair cropped close.
      { tone: 'ink', d: 'M27 50C24 31 36 16 54 16.5c8 .3 13 3 16 7.5-8-2-16 0-22 5-7 5-11 12-12 21z' },
      // A jaw like a brick.
      { tone: 'ink', d: 'M50 66h23v11c0 3-2 5-5 5H55c-4 0-5-3-5-6z' },
      // The pencil behind the ear.
      { tone: 'brass', stroke: 1.8, d: 'M33 53L50 45.5' },
      { tone: 'pale', stroke: 1.8, d: 'M33 53l-3 1.3' },
      // The shirt, collar open, with the waistcoat over it.
      { tone: 'pale', on: 'figure', d: 'M2 120c0-14 8-23 24-27l9-3 12 17 12-17 10 3c16 4 27 13 27 27z' },
      { tone: 'ink', on: 'figure', d: 'M28 120c0-9 3-16 10-21l7-7 2.5 13V120zM67 120c0-9-3-16-10-21l-7-7-2.5 13V120z' },
      { tone: 'brass', on: 'figure', d: dot(43, 108, 1.5) + dot(43, 114, 1.5) },
      { tone: 'brass', on: 'figure', stroke: 1.2, d: 'M30 108c4 4 8 5 13 4' },
    ],
    // The prompt book, thick and ink-bound, held open in the hand, a rolled sleeve at the elbow.
    prop: [
      { tone: 'ink', on: 'figure', d: LOW_ARM },
      { tone: 'pale', on: 'figure', d: 'M62 112c4-2 9-3 14-3l1 7c-5 0-9 1-12 3z' },
      { tone: 'ink', on: 'figure', d: 'M60 84l25-4 3 22-25 4z' },
      { tone: 'pale', on: 'figure', d: 'M62.4 86.2l20.4-3.2 2.6 16.8-20.4 4z' },
      { tone: 'ink', on: 'figure', stroke: 0.9, d: 'M64 89.7l19.3-3.3M64.4 93.2l19.4-3.5M65 96.8l19.4-3.7M65.5 100.3l19.4-3.9M72.6 84.6l2.6 17.2' },
      { tone: 'pale', on: 'figure', stroke: 1, d: 'M63.5 106.8L88 102.6M64 108.4L88.5 104.2' },
      { tone: 'ink', on: 'figure', d: dot(76, 105.5, 5) },
    ],
  },

  // Slight, young and practical: short hair under a beret, a jersey, an electric torch held up.
  asm: {
    tint: '#b4d025',
    head: { wide: 0.94, tall: 0.98, dy: 2, tilt: -2 },
    body: shoulders(24, 0.76),
    neck: 0.76,
    layers: [
      // Short hair at the nape, and a beret tipped back over the crown, with its stalk.
      { tone: 'ink', d: 'M28 54c-3 6-3 13 0 17 3-1 5-3 5-7z' },
      { tone: 'ink', d: 'M22 38C20 20 34 9 53 9c15 0 24 8 23 20-2 6-7 8-12 7-10-3-24-3-36 3z' },
      { tone: 'ink', d: 'M47.5 4.5h5v5h-5z' },
      { tone: 'grey', stroke: 1, d: 'M30 20c8-5 18-6 28-4' },
      // The jersey: grey, a rolled neck and a stripe.
      { tone: 'grey', on: 'figure', d: shoulders(24, 0.76) },
      { tone: 'grey', on: 'figure', d: collar(0.76, 82, 91, 1.6) },
      { tone: 'ink', on: 'figure', stroke: 1.4, d: 'M25 110c14-6 32-6 46 0M26 117c14-6 30-6 44 0' },
    ],
    // The torch, held up, its beam a thin cone.
    prop: [
      { tone: 'ink', on: 'figure', d: RAISED_ARM },
      { tone: 'ink', on: 'figure', d: 'M81.5 74V52h6v22z' },
      { tone: 'brass', on: 'figure', d: 'M80 52l-3-7h13l-3 7zM81.5 59h6v2h-6z' },
      { tone: 'pale', on: 'figure', stroke: 0.9, d: 'M78 44L64 12M91 44l9-32M64 12c12-3 24-3 36 0' },
      { tone: 'ink', on: 'figure', d: RAISED_HAND },
    ],
  },

  // Old, in a flat cap, a muffler and a cardigan, a grey moustache drooping, with the night's letters and flowers.
  doorkeeper: {
    tint: '#39721d',
    head: { wide: 1.02, tall: 0.98, dy: 1, tilt: 3 },
    body: shoulders(29, 1.1),
    neck: 1.1,
    layers: [
      // The flat cap, pulled down, with its peak.
      { tone: 'ink', d: 'M22 35c2-12 14-19 30-18 12 1 20 6 24 13l6 5c-14-3-30-3-46 1-5 1-10 1-14-1z' },
      { tone: 'ink', d: 'M64 31c7 0 14 2 20 6.5-1 2-3 3-5.5 3-6-3-12-4-18-3.5z' },
      { tone: 'grey', stroke: 1.1, d: 'M27 33c14-3 30-3 45 0' },
      // Grey hair at the back, and a moustache that droops.
      { tone: 'grey', d: 'M29 41c-4 6-4 14 0 19 3-1 5-4 5-8z' },
      { tone: 'grey', d: 'M62 57c3-2.5 9-3 13-.5 1.5 3 1 9-.5 14-1 3-3.5 3.5-4.5 1-.8-3-2.5-5-5-6.5-2.5-1-3.5-4-3-8z' },
      // The cardigan, grey, with its buttons and pockets; the muffler wound round, an end hanging.
      { tone: 'grey', on: 'figure', d: 'M19 120c0-12 6-21 18-26l10 9 10-9c12 5 18 14 18 26z' },
      { tone: 'ink', on: 'figure', stroke: 1.1, d: 'M47 103v17M27 112h11M67 112H56' },
      { tone: 'brass', on: 'figure', d: dot(44, 108, 1.5) + dot(44, 114, 1.5) },
      { tone: 'pale', on: 'figure', d: collar(1.1, 79, 91, 1.6) },
      { tone: 'pale', on: 'figure', d: collar(1.1, 85, 95, 2.4) },
      { tone: 'pale', on: 'figure', d: 'M41 94l-8 4 3 22 8-3z' },
      { tone: 'ink', on: 'figure', stroke: 1, d: 'M36 101l-3 1.5M37 108l-3 1.5' },
    ],
    // The bundle of letters, tied, and the flowers he takes in, held low.
    prop: [
      { tone: 'ink', on: 'figure', stroke: 2.2, d: 'M76 102L80 84M78 102L89 88M75 102L72 86' },
      { tone: 'ink', on: 'figure', d: 'M71 90c-6 0-10-3-11-8 6-1 10 2 11 8zM92 98c3-5 8-6 11-3-1 5-6 7-11 3z' },
      { tone: 'brass', on: 'figure', d: dot(80, 80, 4.8) + dot(90, 84, 4.4) + dot(71.5, 82, 4.2) },
      { tone: 'pale', on: 'figure', d: dot(84, 73, 4.2) + dot(76, 74, 3.8) },
      { tone: 'pale', on: 'figure', d: 'M56 98l19-5.5 3.5 14-19 5.5z' },
      { tone: 'ink', on: 'figure', stroke: 1, d: 'M64 96l3.5 14M70 94.5l3.5 14M57.5 104l19-5.5' },
      { tone: 'ink', on: 'figure', d: LOW_ARM },
    ],
  },

  // Her hair in a net, a tape measure round her neck, a pincushion on her wrist, a pair of scissors.
  wardrobe: {
    tint: '#c76bb8',
    head: { wide: 1.04, tall: 0.98, tilt: -2 },
    body: shoulders(27, 1.1),
    neck: 1.1,
    layers: [
      { tone: 'ink', d: 'M28 52C26 32 39 17 55 17.5c8 .3 12.5 3.5 14.5 8-7-2-14-1-21 4-7 5-10 12-11 22.5z' },
      { tone: 'ink', d: dot(28, 21, 10.5) },
      // The hair net: a few lines crossing over the bun, and the crown.
      { tone: 'grey', stroke: 0.9, d: 'M20 14l16 14M18 21l17 7M22 29l13-19M28 11l-1 21M34 14l-11 14M38 19l-12 12' },
      { tone: 'grey', stroke: 0.9, d: 'M36 24l12 12M46 19l-8 14M52 19l-5 17M60 21l-11 14M64 25l-14 8' },
      // The tape measure, pale with ink ticks, hung round the neck and down the front.
      { tone: 'pale', on: 'figure', d: collar(1.1, 82, 88, 1.2) },
      { tone: 'pale', on: 'figure', stroke: 3.4, d: 'M36 90L43 117M57 90L52 117' },
      { tone: 'ink', on: 'figure', stroke: 0.7, d: ticks([36, 90], [43, 117], 7, 1.7) + ticks([57, 90], [52, 117], 7, 1.7) },
      { tone: 'ink', on: 'figure', stroke: 0.7, d: 'M36.5 84l-.5 4M58.5 84l.5 4' },
    ],
    // A pair of scissors, held up, a pincushion strapped to the wrist.
    prop: [
      { tone: 'ink', on: 'figure', d: RAISED_ARM },
      { tone: 'grey', on: 'figure', d: 'M83 61L74 29l6 1.5 7 31zM85 61L95 31l-6-.5-7 31z' },
      { tone: 'brass', on: 'figure', stroke: 2.2, d: 'M83.5 60L79.5 76M84.5 60L89.5 76' },
      { tone: 'brass', on: 'figure', d: dot(84, 60.5, 1.6) },
      { tone: 'ink', on: 'figure', d: RAISED_HAND },
      { tone: 'brass', on: 'figure', d: dot(82, 100, 6.6) },
      { tone: 'russet', on: 'figure', d: dot(82, 100, 5.2) },
      { tone: 'brass', on: 'figure', d: dot(79.5, 98, 1) + dot(84, 97, 1) + dot(84.5, 102, 1) + dot(79.5, 102.5, 1) + dot(82, 100, 1) },
    ],
  },

  // Thin, a high bald brow with a widow's peak, a pointed chin, a bow tie, an astrakhan collar, and a notebook.
  critic: {
    tint: '#1d1d72',
    head: { wide: 0.88, tall: 1.1, tilt: 3 },
    body: shoulders(25, 0.7),
    neck: 0.7,
    layers: [
      // What hair there is, grey, drawn back from a receding hairline with a widow's peak.
      { tone: 'grey', d: 'M28 50C25 32 34 19 50 17c6-.5 11 1 14 4-3 2-5 5-7 8l-3 8-3-6c-4-2-8-2-12 2-3 3-4 8-4 12-2 4-4 7-6 7z' },
      // A pointed chin.
      { tone: 'ink', d: 'M54 68c5 4 9 6 10 13-6-1-11-4-14-10z' },
      // The stiff collar, the small bow tie, and the astrakhan collar of the coat, curled at its edge.
      { tone: 'pale', on: 'figure', d: collar(0.7, 85, 92, 1) },
      { tone: 'ink', on: 'figure', d: 'M47.5 96c-5-3.5-10-3.5-12-1 .5 3.5 6 4.5 12 1zM47.5 96c5-3.5 10-3.5 12-1-.5 3.5-6 4.5-12 1z' },
      { tone: 'pale', on: 'figure', d: 'M38 95h19l-4.5 17h-10z' },
      { tone: 'grey', on: 'figure', d: 'M21 120c0-12 5-20 14-25l5 3-3 22zM74 120c0-12-5-20-14-25l-5 3 3 22z' },
      {
        tone: 'grey',
        on: 'figure',
        d:
          dot(24, 112, 2.8) + dot(28, 105, 2.8) + dot(34, 99, 2.8) + dot(38, 106, 2.8) + dot(38, 114, 2.8) + dot(30, 116, 2.8) +
          dot(71, 112, 2.8) + dot(67, 105, 2.8) + dot(61, 99, 2.8) + dot(57, 106, 2.8) + dot(57, 114, 2.8) + dot(65, 116, 2.8),
      },
      { tone: 'ink', on: 'figure', stroke: 0.9, d: 'M30 108c3 2 4 5 3 8M68 108c-3 2-4 5-3 8' },
    ],
    // A notebook held up, and the pencil that is writing in it.
    prop: [
      { tone: 'ink', on: 'figure', d: RAISED_ARM },
      { tone: 'pale', on: 'figure', d: 'M78 42h20v28H78z' },
      { tone: 'ink', on: 'figure', d: dot(81, 42, 1.1) + dot(85, 42, 1.1) + dot(89, 42, 1.1) + dot(93, 42, 1.1) + dot(97, 42, 1.1) },
      { tone: 'ink', on: 'figure', stroke: 0.9, d: 'M81 48h13M81 52h15M81 56h11M81 60h14' },
      { tone: 'brass', on: 'figure', stroke: 1.8, d: 'M86 74L94 54' },
      { tone: 'ink', on: 'figure', d: RAISED_HAND },
    ],
  },

  // Long untidy hair, a soft collar open, a loose tie askew, a scarf, and a sheaf of pages being read.
  playwright: {
    tint: '#8d8de2',
    head: { wide: 0.98, tall: 1.04, tilt: 5 },
    body: shoulders(27, 0.95),
    neck: 0.95,
    layers: [
      // Long hair pushed back off the brow and hanging to the collar, a lock fallen over the brow.
      { tone: 'ink', d: 'M73 33C77 16 64 3 46 5 26 7 13 26 14 50c1 14 4 26 8 36 1 4 5 5 7 2 1 3 5 4 8 1 1-4-1-6-2-9-2-8-2-17 0-25 3-9 10-14 20-15 6 0 10 1 14 3z' },
      { tone: 'ink', d: 'M62 27c8-1 14 3 15 10 .5 2.5-.2 4.8-1.8 6.4-.6-4.4-3.8-7.4-8.6-9z' },
      { tone: 'ink', stroke: 1.6, d: 'M16 70c-5 4-7 9-5 14M24 88c-4 5-4 9-1 12M20 14c-6 4-9 9-9 15' },
      { tone: 'grey', stroke: 0.9, d: 'M30 16c-9 8-14 22-12 40M38 12c-9 8-13 24-11 44M48 8c-6 3-11 7-14 12' },
      // The soft collar, open at the throat, a loose tie askew, and a scarf slung about the neck.
      { tone: 'pale', on: 'figure', d: 'M34 90l13 18 13-18-5-4-8 6-8-6z' },
      { tone: 'pale', on: 'figure', d: 'M30 92l5-4 6 11zM64 92l-5-4-6 11z' },
      { tone: 'ink', on: 'figure', d: 'M45 96l8-1.5 5 9-5 14-6-1 3-12z' },
      { tone: 'russet', on: 'figure', d: collar(0.95, 79, 88, 2) },
      { tone: 'russet', on: 'figure', d: 'M60 87l7 3-2 28-8 1 2-24z' },
      { tone: 'ink', on: 'figure', stroke: 1.1, d: 'M62 104l4 1M61 110l4 1M60 116l4 1' },
    ],
    // The sheaf of manuscript, held up before him and read.
    prop: [
      { tone: 'ink', on: 'figure', d: RAISED_ARM },
      { tone: 'pale', on: 'figure', d: 'M76 40l20-3 4 32-20 3z' },
      { tone: 'pale', on: 'figure', d: 'M79 36l20-2 3 31-20 3z' },
      { tone: 'ink', on: 'figure', stroke: 0.9, d: 'M83 43l13-1.2M83.5 47l13-1.2M84 51l13-1.2M84.5 55l13-1.2M85 59l13-1.2M85.5 63l10-1' },
      { tone: 'ink', on: 'figure', stroke: 0.8, d: 'M76.5 41l3.5 28' },
      { tone: 'ink', on: 'figure', d: RAISED_HAND },
    ],
  },

  // Broad as a flat, a cap pushed back over a heavy brow, a collarless shirt with the sleeves rolled, rope on the shoulder.
  flyman: {
    tint: '#5281e0',
    head: { wide: 1.06, tall: 0.96 },
    body: 'M0 120c0-14 8-23 24-27l9-3h26l10 3c16 4 27 13 27 27z',
    neck: 1.55,
    layers: [
      // The cap, pushed back, its peak turned up; a heavy brow below the line of it.
      { tone: 'ink', d: 'M26 36c0-12 11-20 26-20 15 0 24 7 24 17-13-4-33-4-50 3z' },
      { tone: 'ink', d: 'M66 26c6-2 13-1 18 3-5 3-12 4-19 2z' },
      { tone: 'grey', stroke: 1.2, d: 'M31 28c12-5 28-5 42-1' },
      { tone: 'ink', d: 'M55 37c7-3 16-2 20 3-1 3-4 4-7 3-4-2-9-2-13-1z' },
      // The collarless shirt, pale, and the shoulder under the rope.
      { tone: 'pale', on: 'figure', d: 'M0 120c0-14 8-23 24-27l9-3c4 5 9 8 14.5 8s10.5-3 14.5-8l9 3c16 4 27 13 27 27z' },
      { tone: 'ink', on: 'figure', stroke: 1.2, d: 'M47.5 98v14' },
      { tone: 'brass', on: 'figure', d: dot(47.5, 103, 1.4) + dot(47.5, 109, 1.4) },
      // The coil of rope over the near shoulder: loops of ink with a grey twist, the end hanging.
      { tone: 'ink', on: 'figure', stroke: 3.4, d: loop(58, 98, 14, 8.5, -22) + loop(63, 95, 14, 8.5, -22) + loop(68, 92, 14, 8.5, -22) },
      { tone: 'grey', on: 'figure', stroke: 1.1, d: loop(58, 98, 14, 8.5, -22) + loop(63, 95, 14, 8.5, -22) + loop(68, 92, 14, 8.5, -22) },
      { tone: 'ink', on: 'figure', stroke: 2.6, d: 'M46 104c-3 6-2 10 0 13' },
      { tone: 'grey', on: 'figure', stroke: 1, d: 'M46 104c-3 6-2 10 0 13' },
      { tone: 'ink', on: 'figure', d: dot(46, 118, 2.2) },
    ],
    // A bare forearm, the sleeve rolled to the elbow, the hand laid on the coil.
    prop: [
      { tone: 'ink', on: 'figure', d: RAISED_ARM },
      { tone: 'pale', on: 'figure', d: 'M71 108c5-3 13-4 20-2l1 8c-7-2-14-1-21 2z' },
      { tone: 'ink', on: 'figure', d: RAISED_HAND },
    ],
  },
}

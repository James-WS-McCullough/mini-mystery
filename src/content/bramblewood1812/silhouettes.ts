// Cameo portraits for Bramblewood. Nine of the neighbours are drawn here,
// the ones nobody could mistake: the hood, the Wolf, the Pig, the man of
// gingerbread, the Witch, the Godmother, the cat in boots, the puppet and
// Grandmother in her mob-cap; the
// rest borrow a sitter from another setting who suits them. Same box, same
// tones: see ../manor1920s/silhouettes.ts for the conventions.

import type { SilhouetteDef } from '../schema'
import { silhouettes as MANOR } from '../manor1920s/silhouettes'
import { CASTLE_SILHOUETTES } from '../castle1897/silhouettes'

/** A filled disc, for buttons, eyes and nostrils. */
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

/** A five-pointed star about (cx, cy), of outer radius r. */
function star(cx: number, cy: number, r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const rr = i % 2 === 0 ? r : r * 0.45
    pts.push(`${n(cx + rr * Math.cos(a))} ${n(cy + rr * Math.sin(a))}`)
  }
  return `M${pts.join('L')}z`
}

/** A row of discs along a quadratic curve from p0 through p1 to p2: a frill, a string of beads. */
function along(p0: [number, number], p1: [number, number], p2: [number, number], count: number, r: number): string {
  let d = ''
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1)
    const x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0]
    const y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1]
    d += dot(n(x), n(y), r)
  }
  return d
}

/**
 * A path moved down by `dy`: every absolute point shifted, relative steps left as they are. (For drawing a
 * head that sits lower than the standard one, without redrawing it.)
 */
function lower(d: string, dy: number): string {
  const out: string[] = []
  let cmd = ''
  let i = 0
  for (const token of d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? []) {
    if (/[a-zA-Z]/.test(token)) {
      cmd = token
      i = 0
      out.push(token)
      continue
    }
    let v = Number(token)
    // (Absolute commands only: the y of each pair; V's one number; A's last.)
    if ((/[MLCSQT]/.test(cmd) && i % 2 === 1) || cmd === 'V' || (cmd === 'A' && i % 7 === 6)) v += dy
    out.push(String(n(v)))
    i++
  }
  return out.join(' ')
}

/** A forearm rising from the lower right to a hand at about (82, 76). */
const RAISED_ARM =
  'M72 120c1-9 4-16 9-21L79 78c-.5-3 1-5 3.5-5.5 2.5-.5 4.5 1 5 3.5l4 25c1 7-1 13-5 19z'
const RAISED_HAND = 'M77 76c-1-4 1-7.5 5-8.5 3-.5 6 1 7 4 .5 3-1 5.5-4 6.5-4 1-7 0-8-2z'

/** How far Puss's head sits below the standard one: low on his shoulders, as a cat's is, not up on a neck. */
const SIT = 14

export const BRAMBLEWOOD_SILHOUETTES: Record<string, SilhouetteDef> = {
  // The red hood, up over the head and down over the shoulders as a cape, and a basket on the arm.
  red: {
    tint: '#3f7a3a',
    head: { wide: 0.94, tall: 0.96, dy: 3, tilt: -3 },
    body: shoulders(24, 0.75),
    neck: 0.75,
    layers: [
      // A fringe under the hood.
      { tone: 'russet', d: 'M50 22c8-2 14 1 16 7-5-2-10-1-14 3z' },
      // The hood: round the back of the head and over the crown, its rim down the cheek, gathered under the chin.
      { tone: 'scarlet', d: 'M28 86C14 72 12 44 22 27 32 10 54 4 67 13c5 4 6 9 4 13-6-2-12 0-15 5-5 8-6 22-3 34 2 7 5 13 8 18-9 4-21 5-33 3z' },
      { tone: 'ink', stroke: 1.1, d: 'M30 26c-6 10-8 24-5 38M42 12c-6 6-9 14-9 22M68 26c-6-1-11 2-13 7' },
      // The cape over the shoulders, tied at the throat.
      { tone: 'scarlet', on: 'figure', d: 'M12 120c0-12 6-20 16-24 6-3 12-4 19-4s13 1 19 4c10 4 16 12 16 24z' },
      { tone: 'pale', on: 'figure', d: dot(47.5, 95, 2.4) },
      { tone: 'pale', on: 'figure', stroke: 1.4, d: 'M47.5 97l-4 8M47.5 97l4 8' },
    ],
    // The basket, a cloth over it, hung on the crook of the arm.
    prop: [
      { tone: 'brass', on: 'figure', stroke: 2, d: 'M68 102c2-12 20-12 22 0' },
      { tone: 'brass', on: 'figure', d: 'M64 102h30l-4 16H68z' },
      { tone: 'ink', on: 'figure', stroke: 1, d: 'M66 107h26M67 112h24M72 102v16M79 102v16M86 102v16' },
      { tone: 'pale', on: 'figure', d: 'M65 101c6-4 22-4 28 0l-2 4c-8-3-17-3-25 0z' },
    ],
  },

  // A long muzzle, two pricked ears, a ruff of fur at the throat and a gentleman's cravat.
  wolf: {
    tint: '#4d5d6e',
    head: { wide: 1.04, tall: 1, dy: 1, tilt: 2 },
    body: shoulders(29, 1.1),
    neck: 1.1,
    layers: [
      // The ears, pricked and pointed, pale within.
      { tone: 'ink', d: 'M36 30L36 2l17 20z' },
      { tone: 'ink', d: 'M48 22L58 -1l8 25z' },
      { tone: 'grey', d: 'M39 24l.5-14 7 9zM53 19l5-11 3 13z' },
      // The muzzle, long, with a dark nose at the end and a line of teeth.
      { tone: 'ink', d: 'M60 38L90 46c4 1 5 5 3 8l-4 3-24 5c-4 0-6-4-5-8z' },
      { tone: 'ink', d: dot(92, 48.5, 3.4) },
      { tone: 'pale', stroke: 1.1, d: 'M68 59l2 3 2-3.4 2 3.2 2-3.6 2 3 2-3.8' },
      { tone: 'pale', stroke: 1, d: 'M66 54c7-1 15-2 23-4' },
      // A yellow eye under a heavy brow.
      { tone: 'brass', d: 'M57 37c3-3 7-3 9 0-3 2.5-6 2.5-9 0z' },
      { tone: 'ink', d: dot(61.5, 37, 1.1) },
      { tone: 'grey', stroke: 1.6, d: 'M55 33l12 1' },
      // Fur at the cheek and throat.
      { tone: 'ink', d: 'M38 76l-6 6 7-1-4 7 8-4 1 6 5-6 3 5 3-6' },
      // The cravat and a waistcoat.
      { tone: 'pale', on: 'figure', d: 'M41 95c4 2 9 2 13 0l-2 6 3 9-7.5-4-7.5 4 3-9z' },
      { tone: 'grey', on: 'figure', d: 'M22 120c0-9 4-15 11-19l8 6 7 13zM73 120c0-9-4-15-11-19l-8 6-7 13z' },
      { tone: 'brass', on: 'figure', d: dot(30, 112, 1.3) + dot(65, 112, 1.3) },
    ],
  },

  // A round snout and a lop ear, and a builder's apron with the trowel in its pocket.
  pig: {
    tint: '#c25e78',
    head: { wide: 1.08, tall: 0.94, dy: 4, tilt: 0 },
    body: shoulders(27, 1.1),
    neck: 1.15,
    layers: [
      // A lop ear, falling forward over the brow.
      { tone: 'ink', d: 'M40 26l-4-20 22 14c-1 4-4 7-8 9z' },
      { tone: 'grey', d: 'M41 21l-1.5-9 10 7z' },
      // The snout: a short drum with two nostrils.
      { tone: 'ink', d: 'M63 44h13c4 0 6 4 6 9s-2 9-6 9H64z' },
      { tone: 'pale', d: 'M80.5 47.5a2.6 5.5 0 1 0 .1 0z' },
      { tone: 'ink', d: dot(80.6, 50.5, 1) + dot(80.6, 55.5, 1) },
      // A small bright eye, and a cheek.
      { tone: 'pale', d: dot(60, 38, 2.4) },
      { tone: 'ink', d: dot(60.6, 38.2, 1.2) },
      { tone: 'grey', d: dot(54, 54, 4) },
      // A smile that knows it built in brick.
      { tone: 'pale', stroke: 1.3, d: 'M62 68c4 2 9 1 12-2' },
      // A neat collar and a builder's apron, the trowel in its pocket.
      { tone: 'pale', on: 'figure', d: 'M37 95h21l-3 5H40z' },
      { tone: 'leather', on: 'figure', d: 'M26 120c0-8 3-14 9-17h25c6 3 9 9 9 17z' },
      { tone: 'brass', on: 'figure', stroke: 1.6, d: 'M33 112l9-8M41 104l3 3' },
    ],
  },

  // A man of gingerbread, square on, his icing and his gumdrop buttons, and a grin that says catch me.
  gingerbread: {
    tint: '#b7701f',
    head: { wide: 1, tall: 1, dy: 0, tilt: 0 },
    body: 'M26 120c0-6 1-10 3-12-8 1-17-2-21-7-3-5 1-10 7-9l18 1c4-1 8-2 14-2s10 1 14 2l18-1c6-1 10 4 7 9-4 5-13 8-21 7 2 2 3 6 3 12z',
    neck: 0.6,
    layers: [
      // The round head, drawn over the profile.
      { tone: 'ink', d: 'M50 14a30 31 0 1 0 .1 0z' },
      // Icing round the brow.
      { tone: 'pale', stroke: 1.6, d: 'M27 34c3-3 5 3 8 0s5 3 8 0 5 3 8 0 5 3 8 0 5 3 8 0 5 3 8 0' },
      // Two currant eyes in icing rings, and the grin.
      { tone: 'pale', d: dot(40, 45, 4.6) + dot(60, 45, 4.6) },
      { tone: 'ink', d: dot(40.5, 45.5, 2.6) + dot(59.5, 45.5, 2.6) },
      { tone: 'pale', stroke: 2, d: 'M36 60c7 8 21 8 28 0' },
      { tone: 'russet', d: dot(31, 56, 3) + dot(69, 56, 3) },
      // Icing at the wrists, and gumdrop buttons down the front.
      { tone: 'pale', on: 'figure', stroke: 1.6, d: 'M14 94l2 4 2-4 2 4M77 94l2 4 2-4 2 4' },
      { tone: 'brass', on: 'figure', d: dot(48, 101, 2.6) + dot(48, 110, 2.6) },
      { tone: 'russet', on: 'figure', d: dot(48, 118, 2.6) },
    ],
  },

  // The tall black hat, a hooked nose with its wart, hair like string, and a shawl.
  witch: {
    tint: '#4b2d6b',
    head: { wide: 1, tall: 1, dy: 2, tilt: -4 },
    body: 'M2 120c0-12 6-20 18-24l14-5h27l13 5c12 4 18 12 18 24z',
    layers: [
      // Long grey hair, hanging straight from under the brim.
      { tone: 'grey', d: 'M28 34c-6 14-6 32-2 48 3-8 4-16 8-24 1-9 2-16 6-22z' },
      { tone: 'grey', d: 'M34 36c-2 12 0 24 5 34 0-12 1-22 5-31z' },
      // The hat: a broad brim, a tall crown bent over at the tip, and a buckled band.
      { tone: 'ink', d: 'M10 34c22-9 52-9 76-1 2 3-1 5-4 5-22-4-46-4-68 1-3 0-6-3-4-5z' },
      { tone: 'ink', d: 'M28 34C34 20 38 6 46 -6c4 6 9 10 18 12-6 0-10 3-12 6 4 6 8 14 13 22z' },
      { tone: 'brass', d: 'M29 31c11-3 24-3 36-1l-1 4c-11-2-23-2-34 1z' },
      { tone: 'pale', d: 'M44 29.5h6v5h-6z' },
      // The nose, long and hooked, with a wart; and a chin to meet it.
      { tone: 'ink', d: 'M66 40c6 6 12 12 14 19 0 3-3 4-6 2l-8-5z' },
      { tone: 'pale', d: dot(72, 50, 1.4) },
      { tone: 'ink', d: 'M60 72c5 0 9-1 12-4 1 5-2 9-8 10z' },
      // A sharp eye, and a smile you would not trust.
      { tone: 'pale', d: 'M58 42c2-2 5-2 7 0-2 1.6-5 1.6-7 0z' },
      { tone: 'pale', stroke: 1.2, d: 'M61 66c3 1.5 6 1.5 9-1' },
      // The shawl, crossed over and knotted.
      { tone: 'grey', on: 'figure', d: 'M12 120c0-10 5-17 14-21l21 14 21-14c9 4 14 11 14 21z' },
      { tone: 'ink', on: 'figure', stroke: 1, d: 'M26 99l21 14 21-14M40 108l7 5 7-5' },
    ],
  },

  // Hair in a bun, a small crown with a star, a frilled collar, and the wand.
  godmother: {
    tint: '#3d6fb5',
    head: { wide: 1.02, tall: 1, dy: 1, tilt: -5 },
    body: 'M4 120c-1-11 3-19 12-23 4-3 10-5 16-5l7-2h17l7 2c6 0 12 2 16 5 9 4 13 12 12 23z',
    layers: [
      // Soft hair, swept up into a bun.
      { tone: 'grey', d: 'M28 56C24 34 34 18 52 17c9 0 15 4 16 10-8-3-17-2-24 3-6 5-9 13-9 22z' },
      { tone: 'grey', d: dot(30, 24, 8) },
      // A little crown, a star at its peak.
      { tone: 'brass', d: 'M40 21l2-8 5 5 4-8 4 8 5-5 2 8c-7-2-15-2-22 0z' },
      { tone: 'pale', d: star(51, 6, 4) },
      // A kind eye, round cheeks, a smile.
      { tone: 'pale', stroke: 1.3, d: 'M58 40c2-1.5 5-1.5 7 0' },
      { tone: 'grey', d: dot(56, 56, 4) },
      { tone: 'pale', stroke: 1.3, d: 'M61 66c4 2.5 8 1.5 10-1' },
      // The frilled collar.
      { tone: 'pale', on: 'figure', d: 'M30 96c3 3 6-2 9 1s6-2 9 1 6-2 9 1 6-2 9 1l-2 6c-11-4-22-4-33 0z' },
      { tone: 'brass', on: 'figure', d: dot(47.5, 106, 2.4) },
    ],
    // The wand, raised, with its star and a spark or two.
    prop: [
      { tone: 'ink', on: 'figure', d: RAISED_ARM },
      { tone: 'pale', on: 'figure', stroke: 1.8, d: 'M84 76L90 40' },
      { tone: 'brass', on: 'figure', d: star(91, 35, 6.5) },
      { tone: 'pale', on: 'figure', d: star(80, 27, 2) + star(97, 22, 1.6) + star(99, 44, 1.4) },
      { tone: 'ink', on: 'figure', d: RAISED_HAND },
    ],
  },

  // A cat, plainly, and nothing of a man's face under it: the profile behind is shrunk out of sight, and
  // the head is drawn whole on the figure: round, and wider than it is tall, on a thick neck of fur, two
  // ears set wide, a brow, a short muzzle with the nose at its tip, and the cheeks tufted all along beneath;
  // a lace collar and a cape. His own way of wearing spectacles, and of smoking, to suit.
  puss: {
    tint: '#9a5a1f',
    head: { wide: 0.4, tall: 0.4, dy: 0, tilt: 0 },
    traits: {
      spectacles: {
        layers: [
          { tone: 'brass', on: 'figure', stroke: 1.5, d: lower(dot(64.5, 40, 5.4), SIT) },
          { tone: 'brass', on: 'figure', stroke: 1.3, d: lower('M59 39.5L44 36', SIT) },
        ],
      },
      smoker: {
        layers: [
          { tone: 'pale', on: 'figure', d: lower('M72 57l13-2.5.6 2.5-13 2.5z', SIT) },
          { tone: 'brass', on: 'figure', d: lower(dot(85.5, 55.5, 1.6), SIT) },
          { tone: 'brass', on: 'figure', stroke: 1.3, d: lower('M87 51c3-4-2-7 1-11 2-3 0-6 1-9', SIT) },
        ],
      },
    },
    body: shoulders(26, 1.3),
    neck: 1.4,
    layers: [
      // The head: round, and wider than it is tall; the brow, a short muzzle with the nose at its tip, the
      // jaw back from the nose, and the fur of the cheeks in tufts all along beneath it.
      {
        tone: 'ink',
        on: 'figure',
        d: lower('M30 66L24 63l2-3-6-1 3-3-5-3C16 40 22 30 30 25 38 19 50 17 62 22c8 4 12 10 13 16 1 4 4 7 6 10 0 4-3 6-6 7-2 5-7 9-13 11l-4 3-1-3-5 3-1-3-5 3-1-3-5 3-1-3-5 3z', SIT),
      },
      // A broad ruff of fur from the cheeks down to the collar, tufted at its edges: no neck to speak of.
      { tone: 'ink', on: 'figure', d: lower('M24 60c-3 9-2 18 3 25l-3 3 5 0 1 5 4-3 3 4 4-3 4 3 3-3 4 3 2-4 5 1-1-4 4-2-3-3c5-8 7-17 5-26z', SIT) },
      // Two ears, set wide, pointed, pale inside.
      { tone: 'ink', on: 'figure', d: lower('M50 22L63 2l8 26z', SIT) },
      { tone: 'ink', on: 'figure', d: lower('M22 35L19 8l20 13z', SIT) },
      { tone: 'grey', on: 'figure', d: lower('M55 20l7.5-12 4.5 15zM25 29l-2-15 10 8z', SIT) },
      // Tabby stripes on the brow and the cheek.
      { tone: 'grey', on: 'figure', stroke: 1.4, d: lower('M46 23c2 4 2 8 0 11M38 26c3 3 4 7 3 10M30 32c3 3 4 6 4 9M26 50c4 1 7 3 9 6', SIT) },
      // A green-gold eye, almond-shaped, with its slit.
      { tone: 'brass', on: 'figure', d: lower('M58 40c3-5 10-5 13 0-3 4.5-10 4.5-13 0z', SIT) },
      { tone: 'ink', on: 'figure', stroke: 1.7, d: lower('M64.5 36v8', SIT) },
      { tone: 'pale', on: 'figure', d: lower(dot(66.6, 38.2, 0.8), SIT) },
      // The nose at the tip of the muzzle, and whiskers fanned out from the pad behind it.
      { tone: 'pale', on: 'figure', d: lower('M78.5 47.5l2.6 1.6-2.4 2z', SIT) },
      { tone: 'pale', on: 'figure', stroke: 0.8, d: lower('M73 53l23-5M73 55l23 1M72 57l20 6', SIT) },
      // The lace collar, and the cape over the shoulders, clasped.
      { tone: 'scarlet', on: 'figure', d: 'M14 120c0-12 6-20 17-24l16-2 16 2c11 4 17 12 17 24z' },
      { tone: 'pale', on: 'figure', d: 'M33 93h29l-4 9c-3 2-5-1-7 1s-4-1-6 1-4-1-6 1-4-1-6-1z' },
      { tone: 'brass', on: 'figure', d: dot(47.5, 108, 2) },
    ],
  },

  // A puppet of pine, as the carpenter made him: a long nose with a twig sprouting from it, a pointed
  // cap, a hinged jaw, painted eye and cheek, the grain of the wood, a ringed wooden neck, and a shirt of
  // flowered paper.
  pinocchio: {
    tint: '#2f8f8a',
    head: { wide: 0.96, tall: 0.96, dy: 4, tilt: -2 },
    body: shoulders(22, 0.7),
    neck: 0.7,
    layers: [
      // The nose: long, straight and pointed, a little longer than it was, and putting out a twig.
      { tone: 'ink', d: 'M64 44L98 49l-33 6z' },
      { tone: 'ink', stroke: 1.2, d: 'M84 47.5l3-7' },
      { tone: 'pale', d: 'M87 40.5c1-4 5-5 7-3-1 3-4 4-7 3z' },
      // A pointed cap, all of a piece: up from the brim to a point, flopped back.
      { tone: 'pale', d: 'M28 32C27 20 23 8 16 -4c14 5 28 12 40 18 6 2 11 5 13 9-14-2-28 1-41 9z' },
      { tone: 'ink', stroke: 1, d: 'M31 27c11-6 24-8 36-6' },
      // The grain of the wood across the face and the crown, and a knot in it.
      { tone: 'grey', stroke: 0.8, d: 'M32 42c5-3 10-3 15 0M30 52c6-2 11-2 16 0M34 62c4-2 8-2 11 0M30 72c3-1 6-1 9 0' },
      { tone: 'grey', stroke: 0.8, d: 'M40 46a3 2 0 1 0 .1 0z' },
      // A round painted eye, wide open, with a painted brow; and a round painted cheek.
      { tone: 'pale', d: dot(59, 39, 4.2) },
      { tone: 'ink', d: dot(60, 39.5, 2.1) },
      { tone: 'pale', stroke: 1.2, d: 'M54 32c3-2 7-2 10 0' },
      { tone: 'scarlet', d: dot(55, 54, 3.6) },
      // The hinged jaw of a puppet: a slot from each corner of the mouth down to the chin, and a peg at the hinge.
      { tone: 'pale', stroke: 1.2, d: 'M61 64c3 1.5 6 1 9-1' },
      { tone: 'pale', stroke: 1, d: 'M61 64.5V77M69 63.5l-1 10' },
      { tone: 'brass', d: dot(46, 66, 1.6) },
      // A neck of turned wood, in rings.
      { tone: 'grey', on: 'figure', stroke: 1, d: 'M40 82h14M39.5 86h15M39 90h16' },
      // A shirt of flowered paper, a ruff of the same, and pegged joints at the shoulders.
      { tone: 'pale', on: 'figure', d: 'M26 120c0-9 4-16 11-20h21c7 4 11 11 11 20z' },
      { tone: 'scarlet', on: 'figure', d: dot(36, 108, 2) + dot(48, 104, 2) + dot(58, 112, 2) + dot(42, 116, 2) + dot(62, 104, 1.6) },
      { tone: 'brass', on: 'figure', d: dot(36, 108, 0.8) + dot(48, 104, 0.8) + dot(58, 112, 0.8) + dot(42, 116, 0.8) },
      { tone: 'pale', on: 'figure', d: 'M33 93l5 6 4-6 5 6 5-6 4 6 5-6-1 9H34z' },
      { tone: 'ink', on: 'figure', stroke: 0.8, d: 'M34 102h28' },
      { tone: 'brass', on: 'figure', d: dot(29, 106, 2.2) + dot(66, 106, 2.2) },
    ],
  },

  // A mob-cap with a frilled edge and its ribbon tied in a bow under the chin, grey curls under it, a
  // knitted shawl, and a ball of red wool with the needles stuck through it. (Spectacles only when the
  // night deals them to her: little round ones, on the nose.)
  granny: {
    tint: '#8e3a6e',
    head: { wide: 1.02, tall: 0.98, dy: 3, tilt: 4 },
    body: 'M4 120c-1-11 3-19 12-23 4-3 10-5 16-5l7-2h17l7 2c6 0 12 2 16 5 9 4 13 12 12 23z',
    traits: {
      spectacles: {
        layers: [
          { tone: 'brass', stroke: 1.5, d: dot(64, 41, 4.4) },
          { tone: 'brass', stroke: 1.2, d: 'M59.6 40.5L42 38' },
        ],
      },
    },
    layers: [
      // Grey curls, at the temple and over the ear.
      { tone: 'grey', d: dot(61, 27, 3.6) + dot(55, 25, 3.6) + dot(34, 60, 4) + dot(37, 66, 3.6) },
      // The cap: a soft puffed dome over the crown and the back of the head.
      { tone: 'pale', d: 'M28 66C14 54 12 30 24 18 34 7 54 5 66 15c3 3 2 6-2 7-10-3-22-1-29 7-6 8-7 22-3 34z' },
      { tone: 'grey', stroke: 1, d: 'M24 30c4-6 10-10 17-12M22 44c3-10 9-17 17-21M26 58c0-12 4-22 11-29' },
      // Its frilled edge, from the brow round past the ear.
      { tone: 'pale', d: along([66, 21], [36, 23], [32, 64], 11, 3.6) },
      // The ribbon, down the cheek and tied in a bow under the chin.
      { tone: 'pale', stroke: 1.6, d: 'M33 64c5 9 13 14 22 16' },
      { tone: 'pale', d: 'M55 80c-4-5-10-5-11-1 1 4 7 4 11 1zM55 80c4-5 10-5 11-1-1 4-7 4-11 1z' },
      { tone: 'pale', stroke: 1.4, d: 'M54 81l-3 6M56 81l3 6' },
      // A crinkled eye, and a smile.
      { tone: 'pale', stroke: 1, d: 'M62 41.5c1.5-1 3-1 4 0M57 44l-2.5 1.5M57.5 46.5l-2 2' },
      { tone: 'pale', stroke: 1.2, d: 'M61 66c3 1.5 6 1 8-1' },
      // The shawl, knitted, crossed over the breast and pinned with a brooch.
      { tone: 'grey', on: 'figure', d: 'M10 120c0-11 6-19 16-23l21 13 21-13c10 4 16 12 16 23z' },
      { tone: 'ink', on: 'figure', stroke: 0.8, d: 'M26 97l21 13 21-13M18 108l4 3 4-3 4 3M64 108l4 3 4-3 4 3M14 116l4 3 4-3 4 3M68 116l4 3 4-3 4 3' },
      { tone: 'brass', on: 'figure', d: dot(47.5, 110, 2.6) },
      { tone: 'scarlet', on: 'figure', d: dot(47.5, 110, 1.2) },
    ],
    // A ball of red wool in her lap, the two needles stuck through it.
    prop: [
      { tone: 'scarlet', on: 'figure', d: dot(80, 108, 9) },
      { tone: 'ink', on: 'figure', stroke: 0.9, d: 'M72 104c6 2 12 6 15 12M74 112c4-5 10-8 15-8M78 99c2 5 2 12 0 18' },
      { tone: 'brass', on: 'figure', stroke: 1.6, d: 'M66 96l26 22M94 94L70 118' },
      { tone: 'brass', on: 'figure', d: dot(65.5, 95.5, 1.6) + dot(94.5, 93.5, 1.6) },
      { tone: 'scarlet', on: 'figure', stroke: 1, d: 'M72 112c-6 4-12 4-18 2' },
    ],
  },

  // The neighbours borrowed from other evenings.
  woodcutter: MANOR.blacksmith,
  goldilocks: MANOR.heiress,
  stepmother: MANOR.vivienne,
  jack: MANOR.bootboy,
  rumpel: CASTLE_SILHOUETTES.renfield,
}

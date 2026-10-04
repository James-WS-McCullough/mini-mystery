// Cameo portraits for the Marine Hotel's own people (the rest of the company
// is drawn in the manor's silhouettes). Same box, same tones: see
// ../manor1920s/silhouettes.ts for the conventions.

import type { SilhouetteDef } from '../schema'

/** A filled disc, for buttons, jewels and beads. */
function dot(cx: number, cy: number, r: number): string {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0z`
}

/** A curl of smoke rising from (x, y). */
function smoke(x: number, y: number): string {
  return `M${x} ${y}c4-5-3-9 1-15 3-4 0-8 2-12`
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

/** A forearm rising from the lower right to a hand at about (82, 76). */
const RAISED_ARM =
  'M72 120c1-9 4-16 9-21L79 78c-.5-3 1-5 3.5-5.5 2.5-.5 4.5 1 5 3.5l4 25c1 7-1 13-5 19z'
const RAISED_HAND = 'M77 76c-1-4 1-7.5 5-8.5 3-.5 6 1 7 4 .5 3-1 5.5-4 6.5-4 1-7 0-8-2z'
/** A forearm held low and forward, for what hangs from the hand. */
const LOW_ARM = 'M64 120c1-9 5-16 11-20l6 5c-4 4-7 9-8 15z'

export const HOTEL_SILHOUETTES: Record<string, SilhouetteDef> = {
  // Tall, thin and stiff in the neck, with the bills clutched like a hymnal.
  wainwright: {
    tint: '#5a3a2e',
    head: { wide: 0.9, tall: 1.1, dy: -3, tilt: -3 },
    body: shoulders(25, 0.78),
    neck: 0.78,
    layers: [
      // Hair slicked flat and parted, a high shine along the parting.
      { tone: 'ink', d: 'M27 49C24 28 38 15 54 15.5c8 .3 14 3.5 16 8-8-2-17 0-23 5-7 5-11 12-12 20z' },
      { tone: 'pale', stroke: 1.3, d: 'M42 20c7-3 15-3 22-.5' },
      // A small clipped moustache.
      { tone: 'ink', d: 'M65.5 55.5c4-2 9-1.5 12 1.2-1.5 3.6-6.5 5-12 2.6z' },
      // The stiff collar and the bow tie.
      { tone: 'pale', on: 'figure', d: collar(0.78, 85.5, 92) },
      { tone: 'pale', on: 'figure', d: 'M47.5 95c-5-4-11-4.5-13-1.5 0 4 6 5 13 1.5zM47.5 95c5-4 11-4.5 13-1.5 0 4-6 5-13 1.5z' },
      { tone: 'brass', on: 'figure', d: dot(47.5, 95, 1.6) },
    ],
    // A sheaf of bills, clutched to the chest in a fist, a corner curling.
    prop: [
      { tone: 'pale', on: 'figure', d: 'M64 96l19-6 5 17-19 6z' },
      { tone: 'pale', on: 'figure', d: 'M68 90l19-5 5 17-19 5z' },
      { tone: 'ink', on: 'figure', stroke: 1.1, d: 'M73 95l12-3.4M74.5 99.5l12-3.4M76 104l12-3.4' },
      { tone: 'brass', on: 'figure', d: 'M85 85.5l7 16.5-3 .8z' },
      { tone: 'ink', on: 'figure', d: 'M58 120c1-8 4-14 10-18l9-3 3 8-7 3c-3 2-5 6-5 10z' },
    ],
  },

  // Hair piled in waves, a long rope of beads, and a holder held like a baton.
  manageress: {
    tint: '#a3195b',
    head: { wide: 1, tall: 1, dy: -2, tilt: -8 },
    body: shoulders(26, 0.74),
    neck: 0.74,
    layers: [
      // The face, framed by waves piled up on the crown and rolled at the nape.
      { tone: 'ink', d: 'M70 32C71 17 60 7 46 8 32 9 21 22 22 40c.5 10 3 19 8 28 6 1 10-1 12-7-3-8-2-16 3-21 5-6 14-9 25-8z' },
      { tone: 'ink', d: dot(36, 11, 8) + dot(48, 5.5, 8.5) + dot(60, 10, 7.5) + dot(26, 24, 7) },
      { tone: 'pale', stroke: 1.2, d: 'M30 17c6-5 14-6 20-3M44 9c6-3 13-2 17 2M25 28c2-4 5-7 9-8' },
      // The rope of beads, down the chest to a knot.
      { tone: 'pale', on: 'figure', d: beadsAlong([37, 92], [34, 112], [51, 114], 8, 1.5) + beadsAlong([51, 114], [60, 112], [58, 92], 7, 1.5) },
      // The brooch.
      { tone: 'brass', on: 'figure', d: dot(66, 103, 3.4) },
      { tone: 'pale', on: 'figure', d: dot(66, 103, 1.3) },
    ],
    // A cigarette in a long holder, and the hand that holds it, held high.
    prop: [
      { tone: 'ink', on: 'figure', d: RAISED_ARM },
      { tone: 'ink', on: 'figure', d: RAISED_HAND },
      { tone: 'brass', on: 'figure', stroke: 1.8, d: 'M80 71L96 58' },
      { tone: 'pale', on: 'figure', stroke: 1.8, d: 'M96 58l3-2.4' },
    ],
    traits: {
      smoker: {
        takesHands: true,
        layers: [
          { tone: 'ink', on: 'figure', d: RAISED_ARM },
          { tone: 'ink', on: 'figure', d: RAISED_HAND },
          { tone: 'brass', on: 'figure', stroke: 1.8, d: 'M80 71L96 58' },
          { tone: 'pale', on: 'figure', stroke: 1.8, d: 'M96 58l3-2.4' },
          { tone: 'brass', on: 'figure', d: dot(100, 55, 1.8) },
          { tone: 'brass', on: 'figure', stroke: 1.3, d: smoke(101, 50) },
        ],
      },
    },
  },

  // Slight, young, and keen: a white jacket, and a tray balanced on the fingertips.
  waiter: {
    tint: '#e0b84a',
    head: { wide: 0.92, tall: 0.97, dy: 2, tilt: 2 },
    body: shoulders(23, 0.7),
    neck: 0.7,
    layers: [
      // Hair flat and shining, with a sharp parting.
      { tone: 'ink', d: 'M28 49C25 30 38 17 54 17c9 .3 15 4 17 9-8-2-16-.5-22 4.5-7 5-11 12-12 19.5z' },
      { tone: 'pale', stroke: 1.3, d: 'M38 24c7-4 16-5 25-2.5' },
      // The white jacket over the chest, a dark bow tie at the throat, and its buttons.
      { tone: 'pale', on: 'figure', d: 'M26 120C26 110 31 102 39 98l8 9 8-9c8 4 14 12 14 22z' },
      { tone: 'pale', on: 'figure', d: collar(0.7, 86, 92.5) },
      { tone: 'ink', on: 'figure', d: 'M47 95c-5-3.5-10-3.5-12-1 .5 3.5 6 4.5 12 1zM47 95c5-3.5 10-3.5 12-1-.5 3.5-6 4.5-12 1z' },
      { tone: 'ink', on: 'figure', d: dot(47, 95, 1.5) + dot(47, 112, 1.5) + dot(47, 118, 1.5) },
      { tone: 'ink', on: 'figure', stroke: 1, d: 'M39 99l8 9 8-9' },
    ],
    // The tray, high on the fingertips, with a bottle and two glasses.
    prop: [
      { tone: 'pale', on: 'figure', d: RAISED_ARM },
      { tone: 'ink', on: 'figure', stroke: 1, d: 'M73 103c3-2 7-3 10-3' },
      { tone: 'ink', on: 'figure', d: RAISED_HAND },
      { tone: 'brass', on: 'figure', d: 'M71 62c8-3 20-3 28 0-8 3.5-20 3.5-28 0z' },
      { tone: 'pale', on: 'figure', d: 'M75 60.5V47h4.2v13.5zM76 47v-3.3h2.2V47z' },
      { tone: 'pale', on: 'figure', d: 'M84 60.5l-1.4-8h6.4l-1.4 8zM92 60.5l-1.4-8H97l-1.4 8z' },
    ],
  },

  // A toque like a tower, a moustache like a handlebar, and two rows of buttons.
  chef: {
    tint: '#2a6f6a',
    head: { wide: 1.1, tall: 0.95 },
    body: 'M0 120c0-16 8-25 25-29l9-2.5h28l10 3c17 4.5 28 13 28 28.5z',
    neck: 1.5,
    layers: [
      // The toque: a band on the brow, and a tall pleated crown above it.
      { tone: 'pale', d: 'M30 31C23 21 25 6 36 2c3-8 18-9 24-2 9 1 15 12 9 29z' },
      { tone: 'pale', d: 'M29.5 29c12.5-3.5 26-3.5 39 0l.5 8c-13-3.5-27-3.5-40 0z' },
      { tone: 'ink', stroke: 1, d: 'M38 29V11M47 28V6M56 28V6M65 29V12' },
      { tone: 'ink', stroke: 1, d: 'M30 33c12.5-3.5 26-3.5 39 0' },
      // The moustache, in brown so that it shows against the face as the Major's does: two long
      // lobes pinched under the nose, waxed, and curling up at either end to a point.
      {
        tone: 'russet',
        d: 'M69 57C73 56 78 56.5 81 58.5C83.5 56 84.5 53 85 50C86 55 84.5 60 81 62C77 63.5 72.5 63 69 61zM69 57C65 56 60 56.5 57 58.5C54.5 56 53.5 53 53 50C52 55 53.5 60 57 62C61 63.5 65.5 63 69 61z',
      },
      // The double-breasted jacket, its two rows of buttons, and the neckerchief.
      { tone: 'pale', on: 'figure', d: 'M14 120c1-12 8-20 22-25l11 9 11-9c14 5 21 13 22 25z' },
      { tone: 'ink', on: 'figure', stroke: 1.2, d: 'M47 104v16' },
      { tone: 'ink', on: 'figure', d: dot(36, 107, 2) + dot(36, 114, 2) + dot(58, 107, 2) + dot(58, 114, 2) },
      { tone: 'brass', on: 'figure', stroke: 1.2, d: 'M47 104l-5-8M47 104l5-8' },
      { tone: 'pale', on: 'figure', d: collar(1.5, 84, 91, 0.6) },
    ],
    // A ladle, raised like a sceptre.
    prop: [
      { tone: 'pale', on: 'figure', d: RAISED_ARM },
      { tone: 'brass', on: 'figure', stroke: 2, d: 'M84 100V58' },
      { tone: 'ink', on: 'figure', d: RAISED_HAND },
      { tone: 'brass', on: 'figure', d: 'M76 50c0-5 4-9 9-9s9 4 9 9c0 3-2 5-4 5H80c-2 0-4-2-4-5z' },
      { tone: 'ink', on: 'figure', d: 'M79 50c0-3 3-5 6-5s6 2 6 5c0 1-1 2-2 2h-8c-1 0-2-1-2-2z' },
    ],
  },

  // Stooped and grey, with a lamp for the long hours, and brass buttons to the knee.
  nightporter: {
    tint: '#9a8f7a',
    head: { wide: 0.96, tall: 1, dx: 2, dy: 3, tilt: 9 },
    body: 'M8 120c0-14 8-23 21-27l6-2.5h17l9 4c14 5 23 12 25 25.5z',
    neck: 1.0,
    layers: [
      // The peaked cap, with its band and the hotel's badge.
      { tone: 'ink', d: 'M25 34C20 22 30 11 51 11c22 0 33 11 27 23z' },
      { tone: 'ink', d: 'M23 32h55v6H23z' },
      { tone: 'ink', d: 'M66 36l17 4.5c1.5 2-.5 4-3 3.5L66 41z' },
      { tone: 'brass', stroke: 1.2, d: 'M24 35h53' },
      { tone: 'brass', d: 'M52 19l3.2 4.2 5.2.4-4 3.5 1.3 5-5.7-3-5.7 3 1.3-5-4-3.5 5.2-.4z' },
      // White hair at the nape, drooping brows and a drooping moustache.
      { tone: 'grey', d: 'M29 50c-5 4-6 14-2 22 3-5 5-14 3-20z' },
      { tone: 'grey', stroke: 2, d: 'M57 42c4-2 9-2.5 13-.5' },
      { tone: 'grey', d: 'M63 57c4-2.5 8-2.5 11.5.5-1 4-1.5 8-3 12-2-4-3-8-8.5-10.5z' },
      // The long coat: a double row of brass buttons, and the collar.
      { tone: 'brass', on: 'figure', d: dot(42, 100, 1.9) + dot(42, 108, 1.9) + dot(42, 116, 1.9) + dot(54, 100, 1.9) + dot(54, 108, 1.9) + dot(54, 116, 1.9) },
      { tone: 'brass', on: 'figure', stroke: 1.2, d: 'M35 94l9-3M60 94l-9-3' },
    ],
    // A storm lantern, hanging from the hand by its ring.
    prop: [
      { tone: 'ink', on: 'figure', d: 'M66 120c2-12 6-21 13-27l6 5c-4 5-8 12-9 22z' },
      { tone: 'ink', on: 'figure', d: dot(82, 91, 4.6) },
      { tone: 'brass', on: 'figure', stroke: 1.5, d: 'M82 92v6' },
      { tone: 'brass', on: 'figure', d: 'M76.5 98h11l-1.5 3h-8z' },
      { tone: 'brass', on: 'figure', stroke: 1.4, d: 'M77.5 101l.5 12M86.5 101l-.5 12' },
      { tone: 'brass', on: 'figure', d: 'M76 113h12l-1.5 3h-9z' },
      { tone: 'pale', on: 'figure', d: 'M79.5 102.5h5l.6 9.5h-6.2z' },
    ],
  },

  // Round and merry in a check cap, with a wide tie and a case of samples.
  traveller: {
    tint: '#e8c3a0',
    head: { wide: 1.1, tall: 0.94 },
    body: 'M2 120c0-15 8-24 24-28l8-2.5h24l10 3c16 4 26 13 26 27.5z',
    neck: 1.4,
    layers: [
      // The flat cap, loud with check, with its short peak.
      { tone: 'ink', d: 'M23 38C21 20 36 12 52 13c14 1 23 8 24 19l-2 6C58 33 40 34 25 41z' },
      { tone: 'ink', d: 'M66 31c9-.5 16 3 20 9-7 1-14-.5-21-4z' },
      { tone: 'grey', stroke: 0.7, d: 'M28 24h46M25 30h50M30 36h42M36 15v22M46 13v22M56 13v22M66 15v21' },
      { tone: 'brass', d: dot(52, 13, 1.8) },
      // A second chin, and a round cheek.
      { tone: 'ink', d: 'M50 73c7 5 15 4 20-1 2 7-1 13-9 14-6-1-10-6-11-13z' },
      // The collar, and a very wide tie in brass.
      { tone: 'pale', on: 'figure', d: 'M37 83l9.5 9-11 4zM58 83l-9.5 9 11 4z' },
      { tone: 'brass', on: 'figure', d: 'M43.5 93.5h8l-1 3 5 20-8 5-8-5 5-20z' },
      { tone: 'ink', on: 'figure', stroke: 1.2, d: 'M44 103l7-2.5M42.5 109l9.5-3M43 115l9-3' },
    ],
    // The sample case, swung up from the hand by its handle.
    prop: [
      { tone: 'ink', on: 'figure', d: LOW_ARM },
      { tone: 'leather', on: 'figure', d: 'M60 102h34v20H60z' },
      { tone: 'brass', on: 'figure', stroke: 1.6, d: 'M72 102c0-6 10-6 10 0' },
      { tone: 'brass', on: 'figure', d: 'M60 102h3.5v3.5H60zM90.5 102H94v3.5h-3.5zM68 101h4v4h-4zM82 101h4v4h-4z' },
      { tone: 'pale', on: 'figure', d: 'M71 108h12v7H71z' },
      { tone: 'ink', on: 'figure', stroke: 1, d: 'M73.5 110.5h7M73.5 113h7' },
      { tone: 'ink', on: 'figure', d: dot(77, 102, 4.4) },
    ],
  },

  // Young and sleek: a dinner jacket, a carnation, and a flute of something fizzing.
  groom: {
    tint: '#a7c957',
    head: { wide: 0.97, tall: 1.03, dy: -2, tilt: -3 },
    body: 'M11 120c0-13 7-21 21-25l7-3h18l7 3c14 4 22 12 22 25z',
    layers: [
      // Brilliantined hair, swept back with a high gloss.
      { tone: 'ink', d: 'M27 48C23 27 36 11 55 11c11 0 19 5 21 14-8-3-16-3-24 .5-8 4-14 12-19 22z' },
      { tone: 'pale', stroke: 1.5, d: 'M36 18c9-5 21-6 31-2M32 25c4-3 8-5 12-6' },
      // The shirt front, a wing collar and a black bow tie.
      { tone: 'pale', on: 'figure', d: 'M38 93l9 24 9-24-4-2H42z' },
      { tone: 'pale', on: 'figure', d: 'M37 88l9 8-9 2zM57 88l-9 8 9 2z' },
      { tone: 'ink', on: 'figure', d: 'M47 97c-5-3.5-10-3.5-12-1 .5 3.5 6 4.5 12 1zM47 97c5-3.5 10-3.5 12-1-.5 3.5-6 4.5-12 1z' },
      { tone: 'brass', on: 'figure', d: dot(47, 104, 1.1) + dot(47, 110, 1.1) },
      // The carnation, in the lapel.
      { tone: 'pale', on: 'figure', d: 'M25 106c-4-2-4-6-1-7 1-3 5-3 6-.5 3-.5 4 3 2 5-1 2.5-4 4-7 2.5z' },
      { tone: 'brass', on: 'figure', stroke: 1, d: 'M28 108l3 6' },
    ],
    // A flute of champagne, raised.
    prop: [
      { tone: 'ink', on: 'figure', d: RAISED_ARM },
      { tone: 'ink', on: 'figure', d: RAISED_HAND },
      { tone: 'pale', on: 'figure', stroke: 1.6, d: 'M83 70V63' },
      { tone: 'pale', on: 'figure', d: 'M78 41h10l-1.5 21c0 2-1.5 3.5-3.5 3.5s-3.5-1.5-3.5-3.5z' },
      { tone: 'brass', on: 'figure', d: 'M79.3 47h7.4l-.8 14c0 1.5-1.2 2.5-2.9 2.5s-2.9-1-2.9-2.5z' },
    ],
  },

  // A shingled bob, a jewelled bandeau, and a dress that has dropped to the hip.
  bride: {
    tint: '#a8e0c0',
    head: { wide: 0.96, tall: 0.97, dy: -1, tilt: -5 },
    body: shoulders(25, 0.68),
    neck: 0.68,
    layers: [
      // The bob, cut to the jaw and curving in at the cheek.
      { tone: 'ink', d: 'M24 66C17 40 28 13 54 13c13 0 21 8 21 19l1 5c-7 0-13-1-19-3-3 8-3 19 0 28-5 8-14 11-23 13-6-2-9-5-10-9z' },
      // A wave across the brow.
      { tone: 'ink', d: 'M60 36c-6-3-13-3-19 0 5-8 14-11 21-6z' },
      // The bandeau and its jewel.
      { tone: 'brass', stroke: 2.2, d: 'M26 38c14-7 30-9 47-5' },
      { tone: 'brass', d: dot(46, 31.5, 3.6) },
      { tone: 'pale', d: dot(46, 31.5, 1.5) },
      // A straight neckline, a dropped waist and the corsage at the hip.
      { tone: 'pale', on: 'figure', stroke: 1.4, d: 'M33 100c9 5 22 5 30 0' },
      { tone: 'pale', on: 'figure', stroke: 1.4, d: 'M25 114h46' },
      { tone: 'pale', on: 'figure', d: dot(34, 111, 3.4) + dot(39.5, 109, 3.4) + dot(37, 115, 3.4) + dot(31, 115, 3) },
      { tone: 'brass', on: 'figure', d: dot(36, 112.2, 1.4) },
    ],
    // A small evening bag, held in front on a chain.
    prop: [
      { tone: 'ink', on: 'figure', d: 'M66 120c2-12 6-20 12-25l5 4c-4 5-7 11-8 21z' },
      { tone: 'ink', on: 'figure', d: dot(79, 93, 4.4) },
      { tone: 'brass', on: 'figure', stroke: 1.2, d: 'M75 97c0-3 2-4 4-4s4 1 4 4' },
      { tone: 'pale', on: 'figure', d: 'M70 98h18c1.2 0 2 .8 2 2v10c0 1.2-.8 2-2 2H70c-1.2 0-2-.8-2-2v-10c0-1.2.8-2 2-2z' },
      { tone: 'brass', on: 'figure', d: dot(79, 98.4, 2) },
    ],
  },

  // Neat to the last pin: a bun on the crown, a high collar, a cardigan, a pencil.
  receptionist: {
    tint: '#c0d0a0',
    head: { wide: 0.94, tall: 1.03, tilt: -2 },
    body: shoulders(24, 0.66),
    neck: 0.66,
    layers: [
      // Hair centre parted and drawn back to a tidy bun, high on the crown.
      { tone: 'ink', d: 'M26 47C24 27 37 15 54 15c9 .3 15 4 17 9-8-2-15-1-22 3-7 5-11 12-11 21-5 1-10-1-12-4z' },
      { tone: 'ink', d: dot(38, 14, 8.5) },
      // A pencil behind the ear.
      { tone: 'brass', stroke: 1.7, d: 'M42 52l8-9.5' },
      { tone: 'pale', stroke: 1.7, d: 'M50.6 42l1.4-1.6' },
      { tone: 'ink', d: 'M28 52c-3 5-2 11 2 14 3-2 4-7 3-12z' },
      // The cardigan, open at the throat on a high collar, with a bar brooch.
      { tone: 'grey', on: 'figure', d: 'M25 120C25 110 30 102 38 98l9.5 11L57 98c8 4 13 12 13 22z' },
      { tone: 'pale', on: 'figure', d: collar(0.66, 85, 92, 1.6) },
      { tone: 'pale', on: 'figure', d: 'M38 98l9.5 11L57 98l-3-4.5H41z' },
      { tone: 'brass', on: 'figure', stroke: 1.8, d: 'M44.5 92.5h6' },
      { tone: 'ink', on: 'figure', d: dot(47.5, 114, 1.4) + dot(47.5, 119, 1.4) },
    ],
    // The register, held to the chest.
    prop: [
      { tone: 'ink', on: 'figure', d: 'M58 120c1-7 4-12 9-15l9 4c-3 3-5 7-5 11z' },
      { tone: 'ink', on: 'figure', d: 'M55 96l20-4.5 4 18-20 4.5z' },
      { tone: 'pale', on: 'figure', d: 'M59 99.5l11-2.5 2 8.5-11 2.5z' },
      { tone: 'brass', on: 'figure', d: 'M55 96l4.5-1 .8 3.5-4.5 1z' },
      { tone: 'ink', on: 'figure', stroke: 1, d: 'M62 102l7-1.6' },
    ],
  },
}

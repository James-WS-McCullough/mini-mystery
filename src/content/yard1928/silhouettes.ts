// Cameo portraits for the Yard's own people (Sergeant Pike's is the manor's,
// and the rest of the company are drawn there too). Same box, same tones: see
// ../manor1920s/silhouettes.ts for the conventions. The policemen wear Pike's
// uniform in their several ranks: a stand collar with its brass numerals, a
// row of brass buttons, and their rank in brass on the cap, the sleeve or the
// strap; the plain-clothes men are known by their hats, and the civilians by
// what they carry.

import type { SilhouetteDef } from '../schema'

/** A filled disc, for buttons, rings and badges. */
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

export const YARD_SILHOUETTES: Record<string, SilhouetteDef> = {
  // A heavy overcoat with the collar turned up, a bowler sitting high and square,
  // a thick grey moustache over a jaw like a shovel, and a file under his arm.
  craddock: {
    tint: '#966254',
    head: { wide: 1.05, tall: 0.98 },
    body: 'M0 120c0-15 9-24 26-28l8-3h28l9 3c17 4 27 13 27 28z',
    neck: 1.5,
    layers: [
      // Grey hair at the nape, under the bowler.
      { tone: 'grey', d: 'M29 46c-4 6-3 17 2 23 3-3 4-8 3-14z' },
      // The bowler: a high, square crown, a hard flat brim, and a band.
      { tone: 'ink', d: 'M27 35V19c0-8 6-13 24-13s23 5 23 13v16z' },
      { tone: 'ink', d: 'M17 33c19-3.5 48-3.5 66 0 1.5 2.5-.5 5-3 5-19-2.5-41-2.5-60 0-3 0-5-2.5-3-5z' },
      { tone: 'grey', stroke: 1.4, d: 'M27 30c15-1.5 31-1.5 47 0' },
      // A jaw like a shovel, and a thick grey moustache.
      { tone: 'ink', d: 'M50 66h23v11c0 4-2.5 6-6 6H56c-3.5 0-6-3-6-6z' },
      { tone: 'grey', d: 'M62 56c5-2 11-1 15 3-1 4-5 6.5-9.5 5.5-3-1-5-4-5.5-8.5z' },
      // The bag under the eye.
      { tone: 'grey', stroke: 1.5, d: 'M57 48c3 1.5 6 1.5 9 .2' },
      // The overcoat's collar turned up, edged in grey, and its seam.
      { tone: 'ink', on: 'figure', d: 'M21 98L26 80l13 4-2 14z' },
      { tone: 'grey', on: 'figure', stroke: 1.6, d: 'M26.5 80.5L38.5 84.5L36.5 97.5' },
      { tone: 'ink', on: 'figure', d: 'M56 98l1-14 12-2 6 15z' },
      { tone: 'grey', on: 'figure', stroke: 1.6, d: 'M57 85l12-2.5 5.5 14' },
      { tone: 'grey', on: 'figure', stroke: 1.2, d: 'M47 100v20' },
    ],
  },

  // The peaked cap with its brass braid, the stand collar, the Sam Browne belt
  // across his chest, and a swagger stick under the arm.
  superintendent: {
    tint: '#3838b2',
    body: 'M4 120c0-14 8-23 24-27l9-3h24l10 3c16 4 26 13 26 27z',
    neck: 1.2,
    layers: [
      // Cropped grey hair at the nape.
      { tone: 'grey', d: 'M29 46c-3 7-3 15 0 22l5-3c-1-6-1-13 0-18z' },
      // The peaked cap: a flared crown, its band, and the peak with its braid.
      { tone: 'ink', d: 'M29 34L21 22C31 13 43 10 53 11c13 1 21 5 26 12L72 34z' },
      { tone: 'ink', d: 'M25 30h52l1 6c-17-3-35-3-53 0z' },
      { tone: 'ink', d: 'M62 33c9-.5 18 1.5 24 6.5-1 2.5-4 3.5-7 3-6-2.5-11-3.5-17-3.5z' },
      { tone: 'brass', stroke: 1.3, d: 'M64 40c7 .3 13 1.5 19 3' },
      { tone: 'brass', stroke: 1.3, d: 'M26 32c16-2.5 34-2.5 51 0' },
      { tone: 'brass', d: dot(60, 23, 3.6) },
      { tone: 'pale', d: dot(60, 23, 1.4) },
      // A neat grey moustache.
      { tone: 'grey', d: 'M62 56.5c5-3 10-2.5 14 1.5-1 4-5 6-9.5 5-2.5-1-3.5-3.5-4.5-6.5z' },
      // The stand collar and its badges; the buttons; the Sam Browne strap.
      { tone: 'brass', on: 'figure', stroke: 1.6, d: 'M52 90.5h5.5M52.5 93.5h5.5' },
      { tone: 'brass', on: 'figure', d: dot(50, 99, 1.6) + dot(50, 105, 1.6) + dot(50, 111, 1.6) + dot(50, 117, 1.6) },
      { tone: 'brass', on: 'figure', stroke: 3, d: 'M24 97L68 120' },
      { tone: 'ink', on: 'figure', stroke: 0.8, d: 'M25 98L68 120' },
    ],
  },

  // A trilby with a snap brim, hair slicked at the sides, a cocky chin, a loud
  // tie and a double-breasted overcoat; a pair of handcuffs on one finger.
  lowther: {
    tint: '#ae4dc7',
    head: { tilt: -5 },
    body: 'M0 120c0-15 8-24 24-28l10-3h28l10 3c16 4 26 13 26 28z',
    neck: 1.2,
    layers: [
      // Hair slicked down at the sides, with a shine.
      { tone: 'ink', d: 'M27 48c-3 7-3 15 0 21 4-1 6-3 7-7z' },
      { tone: 'pale', stroke: 0.9, d: 'M30 53c-1 5-1 9 1 13' },
      // The trilby: a crown with its band, and the brim snapped down in front.
      { tone: 'ink', d: 'M27 35C25 20 34 9 50 9c14 0 24 9 25 26z' },
      { tone: 'pale', stroke: 1.6, d: 'M27 30c14-2.5 31-2.5 48 0' },
      { tone: 'ink', d: 'M17 34c3 1 7 2 10 2 12-2.5 24-3 36-.5 8 1.5 15 3.5 21 6.5 1 2-1 3.5-3.5 3.2-6-2.5-13-4-20-4.5-12-.6-25-.5-38 1.5-3 .4-6-1-7.5-4.2z' },
      // A cocky chin.
      { tone: 'ink', d: 'M56 68c5 3 11 2 16-1 1 5-2 10-8 12z' },
      // The collar, the knot, and a very loud tie.
      { tone: 'pale', on: 'figure', d: collar(1.2, 84, 91.5, 1.2) },
      { tone: 'brass', on: 'figure', d: 'M43.5 92.5l3.7-2.5 3.7 2.5-1.6 4h-4.2z' },
      { tone: 'brass', on: 'figure', d: 'M45 96.5h4.6l3.4 17-5.5 4.5-5.5-4.5z' },
      { tone: 'ink', on: 'figure', stroke: 1.2, d: 'M44 101.5l7.4-2.5M44 107l8.4-2.8M44.8 112.5l7.6-2.5' },
      // The overcoat's lapels, and its double row of buttons.
      { tone: 'grey', on: 'figure', stroke: 1.3, d: 'M29 104l15-8M65 104L53 96' },
      { tone: 'grey', on: 'figure', d: dot(36, 108, 1.8) + dot(36, 115, 1.8) + dot(60, 108, 1.8) + dot(60, 115, 1.8) },
    ],
    // A pair of brass handcuffs, hung from one finger.
    prop: [
      { tone: 'ink', on: 'figure', d: 'M60 120c1-10 5-18 10-23l6 4c-4 5-6 11-7 19z' },
      { tone: 'ink', on: 'figure', d: dot(73, 98, 5) },
      { tone: 'brass', on: 'figure', stroke: 1.8, d: dot(77, 104.5, 3.3) + dot(70.5, 110, 3.3) },
      { tone: 'brass', on: 'figure', stroke: 1.5, d: 'M75 107l-2.200 1.500' },
    ],
  },

  // A high-crowned hat, its wide brim turned up at the side with a brass badge,
  // hair pinned under it, the stand collar and its numerals; a notebook and pencil.
  wpc: {
    tint: '#5bb9af',
    head: { wide: 0.96, tall: 1.02, tilt: -2 },
    body: shoulders(25, 0.75),
    neck: 0.75,
    layers: [
      // The hair, pinned in a roll at the nape, with a brass pin.
      { tone: 'ink', d: dot(24, 50, 8) },
      { tone: 'brass', stroke: 1.2, d: 'M19 47l-5-4' },
      // The hat: a high crown, a band, the back of the brim, and the front turned up.
      { tone: 'ink', d: 'M30 36C28 17 36 5 52 5c14 0 22 10 22 30z' },
      { tone: 'pale', stroke: 1.5, d: 'M30 31c14-3 29-3 44 0' },
      { tone: 'ink', d: 'M14 37c8-4 20-6 34-5l13 2v5c-16-3-33-3-45 0-2 .5-3-.5-2-2z' },
      { tone: 'ink', d: 'M59 36C67 35 76 31 83 23c3 3 4 9 2 15-8 4-16 3-26 0z' },
      { tone: 'brass', d: dot(77, 30, 3.2) },
      { tone: 'pale', d: dot(77, 30, 1.2) },
      // The collar's numerals; the buttons.
      { tone: 'brass', on: 'figure', stroke: 1.1, d: 'M52.5 89.5v4M55.5 89v4.5' },
      { tone: 'brass', on: 'figure', d: dot(48, 99.5, 1.5) + dot(48, 106.5, 1.5) + dot(48, 113.5, 1.5) },
    ],
    // A notebook, upright and tilted, the pencil in the same hand, writing.
    prop: [
      { tone: 'ink', on: 'figure', d: RAISED_ARM },
      { tone: 'pale', on: 'figure', d: 'M78 69L75 50l17-4 4 19z' },
      { tone: 'brass', on: 'figure', stroke: 1.8, d: 'M75 50l17-4' },
      { tone: 'ink', on: 'figure', stroke: 0.9, d: 'M78.5 56l12.5-2.6M79.5 61.5l12.5-2.6' },
      { tone: 'ink', on: 'figure', d: RAISED_HAND },
      { tone: 'brass', on: 'figure', stroke: 1.9, d: 'M88 72L81 60' },
      { tone: 'ink', on: 'figure', d: dot(80.6, 59.2, 1.2) },
    ],
  },

  // Stout in Pike's uniform: the helmet and its brass plate, a walrus
  // moustache gone grey, three chevrons on the sleeve, and the cell keys.
  chargesergeant: {
    tint: '#645bb9',
    head: { wide: 1.06, tall: 0.97 },
    body: 'M2 120c0-14 8-23 24-27l9-3h24l10 3c16 4 27 13 27 27z',
    neck: 1.45,
    layers: [
      // The helmet: the dome, the brim, the plate, the boss, the strap.
      { tone: 'ink', d: 'M24 44C22 20 34 2 52 2c17 0 27 16 26 40-17-6-35-5-54 2z' },
      { tone: 'ink', d: 'M19 45c20-5 42-5 62 0 1 2.5-1 4.5-3.5 4-18-3.5-37-3.5-55 0-2.5.5-4.5-1.5-3.5-4z' },
      { tone: 'brass', d: dot(64, 28, 4.2) },
      { tone: 'pale', d: dot(64, 28, 1.6) },
      { tone: 'brass', d: dot(51, 4.5, 2.4) },
      { tone: 'pale', stroke: 0.9, d: 'M31 49c1 10 5 19 12 27' },
      // A big walrus moustache, gone grey.
      { tone: 'grey', d: 'M69 57c-6-2-12-1-14 3 1 4 4 7 8 7 2-3 4-6 6-10zM69 57c5-1.5 10-.5 12 3-1 4-4 7-8 7-2-3-3-6-4-10z' },
      // The collar's numerals, the buttons, and three chevrons on the sleeve.
      { tone: 'brass', on: 'figure', stroke: 1.1, d: 'M55 89.5v4M58 89v4.5' },
      { tone: 'brass', on: 'figure', d: dot(50, 99, 1.7) + dot(50, 107, 1.7) + dot(50, 115, 1.7) },
      { tone: 'brass', on: 'figure', stroke: 1.8, d: 'M19 95l7 4 7-4M19 100l7 4 7-4M19 105l7 4 7-4' },
    ],
    // A ring of cell keys, large and grey, hung from the hand.
    prop: [
      { tone: 'ink', on: 'figure', d: RAISED_ARM },
      { tone: 'ink', on: 'figure', d: RAISED_HAND },
      { tone: 'grey', on: 'figure', stroke: 2, d: dot(80, 80, 4.5) },
      { tone: 'grey', on: 'figure', stroke: 1.6, d: dot(75, 86, 2.8) + dot(80, 88, 2.8) + dot(85, 86, 2.8) },
      { tone: 'grey', on: 'figure', stroke: 2.6, d: 'M75 88.8V102M80 90.8V104M85 88.8V102' },
      { tone: 'grey', on: 'figure', stroke: 2.2, d: 'M75 99h4M80 101h4M85 99h-4' },
    ],
  },

  // Thin hair slicked flat, a wing collar and a narrow tie, a slight stoop, and
  // a magnifying glass held to the eye in long fingers.
  fingerprint: {
    tint: '#69ab6f',
    head: { wide: 0.92, tall: 1.1, dx: 2, tilt: 6 },
    body: shoulders(25, 0.85),
    neck: 0.85,
    layers: [
      // Thin hair, combed flat, grey at the temple.
      { tone: 'grey', stroke: 1, d: 'M33 28c10-6 24-8 36-3M30 36c10-5 22-7 34-3M29 44c6-3 11-4 17-3' },
      // The wing collar, its points, the shirt front and the narrow tie.
      { tone: 'pale', on: 'figure', d: collar(0.85, 83, 91, 1.2) },
      { tone: 'pale', on: 'figure', d: 'M36.5 90l4.5 3-3 5zM58.5 90l-4.5 3 3 5z' },
      { tone: 'pale', on: 'figure', d: 'M38 96h19l-4 24H42z' },
      { tone: 'ink', on: 'figure', d: 'M45.5 94l2-1.5 2 1.5-.5 24-1.5 2-1.5-2z' },
    ],
    // The glass, raised to the eye: a pale lens in a brass rim, the handle in the fist.
    prop: [
      { tone: 'ink', on: 'figure', d: RAISED_ARM },
      { tone: 'brass', on: 'figure', stroke: 2.8, d: 'M77.5 56L83.5 71' },
      { tone: 'pale', on: 'figure', d: dot(73, 49, 6.5) },
      { tone: 'brass', on: 'figure', stroke: 2, d: dot(73, 49, 6.9) },
      { tone: 'ink', on: 'figure', d: RAISED_HAND },
    ],
  },

  // Hair in a tight bun with a pencil through it, a high pale collar with a
  // bar brooch under a grey cardigan, and a buff file against her chest.
  records: {
    tint: '#ab6990',
    head: { wide: 0.94, tall: 1.03, tilt: -2 },
    body: shoulders(24, 0.66),
    neck: 0.66,
    layers: [
      // The hair drawn smooth and tight into a bun at the back of the crown, a pencil through it.
      { tone: 'ink', d: 'M26 47C24 27 37 15 54 15c9 .3 15 4 17 9-8-2-15-1-22 3-7 5-11 12-11 21-5 1-10-1-12-4z' },
      { tone: 'ink', d: dot(27, 28, 7.5) },
      { tone: 'brass', stroke: 1.7, d: 'M16 36L40 20' },
      { tone: 'pale', stroke: 1.7, d: 'M16 36l-2.4 1.6' },
      // The cardigan, open on a high pale collar, with a brass bar brooch.
      { tone: 'grey', on: 'figure', d: 'M25 120C25 110 30 102 38 98l9.5 11L57 98c8 4 13 12 13 22z' },
      { tone: 'pale', on: 'figure', d: collar(0.66, 85, 92, 1.6) },
      { tone: 'pale', on: 'figure', d: 'M38 98l9.5 11L57 98l-3-4.5H41z' },
      { tone: 'brass', on: 'figure', stroke: 1.8, d: 'M44.5 92.5h6' },
      { tone: 'ink', on: 'figure', d: dot(47.5, 114, 1.4) + dot(47.5, 119, 1.4) },
    ],
    // A buff file, held to the chest, with a pale tab.
    prop: [
      { tone: 'ink', on: 'figure', d: 'M58 120c1-7 4-12 9-15l9 4c-3 3-5 7-5 11z' },
      { tone: 'leather', on: 'figure', d: 'M56 85l22-4 4 20-22 4z' },
      { tone: 'pale', on: 'figure', d: 'M62 83.6l7-1.3.8 4.2-7 1.3z' },
      { tone: 'ink', on: 'figure', stroke: 0.9, d: 'M62 93l14-2.6M62.8 97l14-2.6' },
      { tone: 'ink', on: 'figure', d: dot(70, 103, 4.5) },
    ],
  },

  // Weaselly: a thin face and a sharp nose, a cap pulled low, a grey muffler
  // knotted at the throat, and a jacket two sizes too big, the hands in the pockets.
  informer: {
    tint: '#7c9654',
    head: { wide: 0.9, tall: 1.06, tilt: 5 },
    body: 'M-4 120C-4 107 6 98 22 94l16-4h22l16 4c15 4 26 13 26 26z',
    neck: 0.8,
    layers: [
      // Straggling grey hair at the nape and the ear.
      { tone: 'grey', d: 'M29 46c-3 5-4 11-2 16l5-2c-1-4-1-9 0-13z' },
      // The flat cap, pulled low, with its short peak.
      { tone: 'ink', d: 'M25 38C23 22 33 13 49 13c14 0 23 6 26 17l-1 8c-14-4-32-4-49 1z' },
      { tone: 'ink', d: 'M62 32c8-1 16 1 22 6-1 2-3 3-5.5 2.5-5-2-10-3-16-2.5z' },
      { tone: 'grey', stroke: 1.1, d: 'M28 31c13-5 31-5 45-.5' },
      // A sharp nose.
      { tone: 'ink', d: 'M70 44l10 9c.5 2-2 3.2-6 2.7z' },
      // The muffler, knotted at the throat, with its ends hanging.
      { tone: 'grey', on: 'figure', d: collar(0.8, 79, 91, 3.5) },
      { tone: 'ink', on: 'figure', stroke: 0.9, d: 'M35 85c6 3 15 3 22 0M34 89c6 3.5 16 3.5 24 0' },
      { tone: 'grey', on: 'figure', d: dot(54, 94, 5.5) },
      { tone: 'grey', on: 'figure', d: 'M50 96l-7 15 7 2.5 5-15zM56 97l3 13 7-1.5-3-14z' },
      { tone: 'ink', on: 'figure', stroke: 0.9, d: 'M47 101l-3 7M60 100l1.5 7' },
      // The jacket's loose seams, and its one fastened button.
      { tone: 'grey', on: 'figure', stroke: 1.2, d: 'M10 109c3-6 8-10 14-12M86 109c-3-6-8-10-14-12' },
    ],
    // The hands deep in the pockets: a sagging flap, and the arm gone in to the elbow.
    prop: [
      { tone: 'ink', on: 'figure', d: LOW_ARM },
      { tone: 'grey', on: 'figure', stroke: 1.5, d: 'M62 102c6-1.5 11-2 17-1.5' },
      { tone: 'grey', on: 'figure', stroke: 1.5, d: 'M62 102l1.5 8' },
    ],
  },

  // A headscarf tied in front with grey hair escaping it, a wraparound apron,
  // sleeves rolled, a broad build; her bucket hung from her hand.
  charwoman: {
    tint: '#b25138',
    head: { wide: 1.08, tall: 0.98, tilt: -2 },
    body: 'M2 120c0-15 8-25 25-29l9-2.5h22l10 3c17 4 27 13 27 28.5z',
    neck: 1.36,
    layers: [
      // The headscarf, tied at the front, with a pattern of spots.
      { tone: 'pale', d: 'M24 44C21 22 33 10 51 11c15 1 25 9 26 22-9-3-17-3-26 0-9 3-18 8-27 11z' },
      { tone: 'pale', d: dot(75, 33, 3.4) },
      { tone: 'pale', d: 'M75 33l8-3.5 1 6.5zM75 34l5.5 5.5-5 .5z' },
      { tone: 'ink', d: dot(36, 24, 1.3) + dot(45, 18, 1.3) + dot(55, 20, 1.3) + dot(63, 16, 1.2) + dot(42, 30, 1.2) + dot(52, 29, 1.2) },
      // Grey hair escaping at the nape, and over the brow.
      { tone: 'grey', stroke: 2, d: 'M27 47c-5 3-6 10-3 17M24 54c-4 2-5 7-3 11' },
      { tone: 'grey', stroke: 1.4, d: 'M65 36c3 0 6 1.5 7.5 4.5M60 37c2 .5 3.5 1.5 4.5 3' },
      // The wraparound apron over a dark dress: the lapped edge, the tie, the pocket.
      { tone: 'pale', on: 'figure', d: 'M20 120c0-12 7-21 17-25l11 7 11-7c10 4 17 13 17 25z' },
      { tone: 'ink', on: 'figure', stroke: 1.1, d: 'M38 103l30 17' },
      { tone: 'ink', on: 'figure', stroke: 1.1, d: 'M22 113c14 4 32 4 48 0' },
    ],
    // A grey bucket on a brass handle, hung from the hand; a sleeve rolled to the elbow.
    prop: [
      { tone: 'ink', on: 'figure', d: 'M62 120c1-14 5-26 12-34l6 4c-3 8-5 18-6 30z' },
      { tone: 'pale', on: 'figure', stroke: 2.6, d: 'M72 98l9 4' },
      { tone: 'brass', on: 'figure', stroke: 1.5, d: 'M67 97c1-9 5-13 11-13 6 0 10 5 11 13' },
      { tone: 'grey', on: 'figure', d: 'M65.5 97h24l-5.5 12H70z' },
      { tone: 'ink', on: 'figure', stroke: 1.2, d: 'M66.5 101h22M68 105h18' },
      { tone: 'ink', on: 'figure', d: dot(78, 87, 5) },
    ],
  },

  // A trilby pushed back with a press card in the band, a loosened tie, and a
  // raincoat with its belt hanging; a notebook held high and flat.
  reporter: {
    tint: '#9069ab',
    head: { tilt: 3 },
    body: 'M0 120c0-15 8-24 24-28l10-3h28l10 3c16 4 26 13 26 28z',
    neck: 1.2,
    layers: [
      // The trilby, pushed back off the brow: a modest crown, a short brim fore and aft, and the band.
      { tone: 'ink', d: 'M27 34C24 21 33 12 47 12c12 0 20 7 21 22z' },
      { tone: 'ink', d: 'M16 33c4-2.5 8-4 12-4l1.5 6c-5 0-9 1-12 2.5z' },
      { tone: 'ink', d: 'M60 25c5 0 10 1.5 14 5-4 1-9 1-14 0z' },
      { tone: 'grey', stroke: 1.4, d: 'M27 29c13-2 27-2 41 0' },
      // The press card in the band.
      { tone: 'pale', d: 'M47 23.5h10v6.5H47z' },
      { tone: 'ink', stroke: 0.8, d: 'M49 26h6M49 28.2h4.5' },
      // The open collar and the tie, pulled loose and crooked.
      // The raincoat: pale-grey cloth, its lapels, and the belt hanging.
      { tone: 'grey', on: 'figure', d: 'M0 120c0-15 8-24 24-28l10-3h28l10 3c16 4 26 13 26 28z' },
      { tone: 'pale', on: 'figure', d: 'M36 91l11 21 11-21z' },
      { tone: 'ink', on: 'figure', stroke: 1.5, d: 'M33 90l14 25M61 90L48 115' },
      { tone: 'pale', on: 'figure', d: collar(1.2, 84, 91.5, 1.2) },
      { tone: 'ink', on: 'figure', d: 'M44 94.5l6-1.5 1.5 4-2 13-4.5-2.5z' },
      { tone: 'ink', on: 'figure', stroke: 3.2, d: 'M4 109c20 5 44 5 64 1' },
      { tone: 'ink', on: 'figure', stroke: 3, d: 'M62 110l3 10' },
      { tone: 'brass', on: 'figure', d: dot(57, 110, 2.2) },
      { tone: 'ink', on: 'figure', d: dot(47, 103, 1.3) },
    ],
    // The notebook held flat at the chest, the pencil poised in the same hand; the sleeve is the raincoat's.
    prop: [
      { tone: 'grey', on: 'figure', d: LOW_ARM },
      { tone: 'pale', on: 'figure', d: 'M69 88l2-7 24-1 .8 7.5z' },
      { tone: 'ink', on: 'figure', stroke: 0.9, d: 'M74 85.5l18-.8M75 83.2l16-.7' },
      { tone: 'ink', on: 'figure', d: 'M77 98c-1-4 1-7.5 5-8.5 3-.5 6 1 7 4 .5 3-1 5.5-4 6.5-4 1-7 0-8-2z' },
      { tone: 'brass', on: 'figure', stroke: 1.9, d: 'M85 92L94 77' },
      { tone: 'ink', on: 'figure', d: dot(84.5, 93, 1.3) },
    ],
  },

  // A flat cap with goggles pushed up on it, a leather driving coat with a
  // broad collar, a scarf, a square jaw; a starting handle in his fist.
  driver: {
    tint: '#4c7f6f',
    head: { wide: 1.04, tall: 0.98 },
    body: 'M2 120c0-14 8-23 24-27l9-3h24l10 3c16 4 26 13 26 27z',
    neck: 1.4,
    layers: [
      // The flat cap and its peak.
      { tone: 'ink', d: 'M22 35c2-12 14-19 30-18 12 1 20 6 24 13l6 5c-14-3-30-3-46 1-5 1-10 1-14-1z' },
      { tone: 'ink', d: 'M64 31c7 0 14 2 20 6.5-1 2-3 3-5.5 3-6-3-12-4-18-3.5z' },
      // The goggles pushed up on the cap: strap, two pale lenses in brass rims.
      { tone: 'grey', stroke: 1.5, unless: 'spectacles', d: 'M26 31c14-3.5 30-3.5 46 0' },
      { tone: 'pale', unless: 'spectacles', d: dot(49, 25, 5.2) + dot(62, 26, 5.2) },
      { tone: 'brass', stroke: 1.5, unless: 'spectacles', d: dot(49, 25, 5.6) + dot(62, 26, 5.6) },
      // A square jaw.
      { tone: 'ink', d: 'M52 66h21v10c0 4-2 6-6 6H57c-4 0-5-3-5-7z' },
      // The leather coat, its broad collar turned down, and a scarf at the throat.
      { tone: 'leather', on: 'figure', d: 'M2 120c0-14 8-23 24-27l9-3h24l10 3c16 4 26 13 26 27z' },
      { tone: 'ink', on: 'figure', stroke: 1.4, d: 'M47 102v18M27 98l15 12M67 98L53 110' },
      { tone: 'pale', on: 'figure', d: collar(1.4, 83, 91, 1.4) },
      { tone: 'pale', on: 'figure', d: 'M56 92l8 15-6 2.5-7-14z' },
      { tone: 'brass', on: 'figure', d: dot(47, 108, 1.7) + dot(47, 115, 1.7) },
    ],
    // A starting handle: the grip in the fist, the crank, and the shaft with its dog.
    prop: [
      { tone: 'leather', on: 'figure', d: 'M58 120c1-12 4-22 10-28l6 5c-4 5-6 12-7 23z' },
      { tone: 'grey', on: 'figure', stroke: 3.6, d: 'M60 92h15' },
      { tone: 'grey', on: 'figure', stroke: 3.4, d: 'M75 92v12' },
      { tone: 'grey', on: 'figure', stroke: 3.6, d: 'M75 104h11' },
      { tone: 'brass', on: 'figure', stroke: 3.4, d: 'M86 100.5v7' },
      { tone: 'ink', on: 'figure', d: dot(69, 93, 5) },
    ],
  },
}

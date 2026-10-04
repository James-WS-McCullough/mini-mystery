// Cameo portraits for St. Jude's own people (the rest of the college is drawn
// in the manor's silhouettes). Same box, same tones: see
// ../manor1920s/silhouettes.ts for the conventions. The dons wear academic
// gowns, drawn as ink shoulders with the hood or the bands in a lighter tone;
// the fellow and the undergraduate wear the same college scarf, in brass and
// pale stripes, so that they read as one college.

import type { SilhouetteDef } from '../schema'

/** A filled disc, for buttons, rings and pins. */
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

/** The college scarf wound round the neck: two stripes of brass on pale. */
function scarfStripes(neck: number, y1: number, flare: number): string {
  return collar(neck, y1 + 2.2, y1 + 4, flare) + collar(neck, y1 + 6.4, y1 + 8.2, flare)
}

/** A forearm rising from the lower right to a hand at about (82, 76). */
const RAISED_ARM =
  'M72 120c1-9 4-16 9-21L79 78c-.5-3 1-5 3.5-5.5 2.5-.5 4.5 1 5 3.5l4 25c1 7-1 13-5 19z'
const RAISED_HAND = 'M77 76c-1-4 1-7.5 5-8.5 3-.5 6 1 7 4 .5 3-1 5.5-4 6.5-4 1-7 0-8-2z'
/** A forearm held low and forward, for what hangs from the hand. */
const LOW_ARM = 'M64 120c1-9 5-16 11-20l6 5c-4 4-7 9-8 15z'

/** A mortarboard, seen a little from above: the board, its button, and the tassel hung over a corner. */
function mortarboard(): { tone: 'ink' | 'brass'; d: string; stroke?: number }[] {
  return [
    { tone: 'ink', d: 'M17 26L50 14l41 8L58 34z' },
    { tone: 'brass', d: dot(50, 15.5, 2.2) },
    { tone: 'brass', stroke: 1.5, d: 'M50 16c-14 1-25 7-30 17' },
    { tone: 'brass', d: 'M17.5 31.5l5.5 1.5-2 8.5-5-1z' },
  ]
}

export const COLLEGE_SILHOUETTES: Record<string, SilhouetteDef> = {
  // Stout and elderly, the dome under his cap bare but for a grey fringe; a doctor's hood.
  master: {
    tint: '#3f3a7a',
    head: { wide: 1.06, tall: 0.98, tilt: 3 },
    body: 'M2 120c0-14 8-23 24-27l9-3h24l10 3c16 4 27 13 27 27z',
    neck: 1.35,
    layers: [
      // The fringe of grey, round the back of the head and over the ear.
      { tone: 'grey', d: 'M31.5 44c-5 4-5.5 14-2 22 2 2 4.5 1.5 5.5-.5-2-7-2.5-14-1.5-21z' },
      { tone: 'grey', d: 'M41 53c2.4-1 4.6 0 5.6 2.2-.2 2.6-1.4 4.4-3.6 5.4-1.2-2.4-2-4.6-2-7.6z' },
      // The mortarboard, tilted back a little on the dome.
      ...mortarboard(),
      // Brows like a ledge, and jowls.
      { tone: 'grey', stroke: 3, d: 'M56 40c5-2.5 10-2.5 15 .5' },
      { tone: 'ink', d: 'M49 72c7 5 15 4 20-1 2 7-1 13-9 14-6-1-10-6-11-13z' },
      // A stiff collar, and the doctor's hood: lining turned out across the shoulders.
      { tone: 'pale', on: 'figure', d: collar(1.35, 85.5, 92, 1) },
      { tone: 'pale', on: 'figure', d: 'M36 91c-12 1-22 7-27 18l10 3c4-8 10-13 19-14z' },
      { tone: 'grey', on: 'figure', stroke: 1.2, d: 'M22 109c5-8 11-12 19-14' },
    ],
    // A thick book, held closed against the chest.
    prop: [
      { tone: 'ink', on: 'figure', d: 'M58 120c1-7 4-12 9-15l9 4c-3 3-5 7-5 11z' },
      { tone: 'leather', on: 'figure', d: 'M52 94l25-5 5 21-25 6z' },
      { tone: 'pale', on: 'figure', d: 'M77 89l5 21-2.5.6-5-20.4z' },
      { tone: 'brass', on: 'figure', d: 'M52 94l4.5-.9 1 4-4.5.9zM55 114.5l4.5-1 1 4-4.5 1z' },
      { tone: 'brass', on: 'figure', stroke: 1.2, d: 'M60 92.5l4 21M66 91.5l4 21' },
      { tone: 'ink', on: 'figure', d: dot(70, 113, 4.2) },
    ],
  },

  // Gaunt as a heron: a long thin face, the clerical collar, his watch held up to time you.
  dean: {
    tint: '#a3a85a',
    head: { wide: 0.86, tall: 1.12, dy: -1, tilt: 2 },
    body: shoulders(28, 0.7),
    neck: 0.7,
    layers: [
      // Hair cropped close at the nape.
      { tone: 'grey', d: 'M31 50c-3 5-3 13 0 20 3-1 5-4 5-8z' },
      // The mortarboard, square and level.
      { tone: 'ink', d: 'M20 27L50 18l37 7-31 9z' },
      { tone: 'brass', d: dot(50, 19.5, 2) },
      { tone: 'brass', stroke: 1.4, d: 'M50 20c-12 1-22 6-27 14' },
      { tone: 'brass', d: 'M20.5 32.5l5 1.5-2 7.5-4.5-1z' },
      // A beak of a nose.
      { tone: 'ink', d: 'M66.5 41l10 13c.5 2.5-3 3.5-7 3z' },
      // The clerical collar, and the preaching bands beneath it.
      { tone: 'pale', on: 'figure', d: collar(0.7, 85, 91.5, 1) },
      { tone: 'pale', on: 'figure', d: 'M42 95l5 15-6.2 1zM53 95l-5 15 6.2 1z' },
    ],
    // A pocket watch, held up in the hand, its chain dangling.
    prop: [
      { tone: 'ink', on: 'figure', d: RAISED_ARM },
      { tone: 'brass', on: 'figure', stroke: 1.2, d: 'M84 48c9-2 14 4 14 13 0 7-2 12-5 17' },
      { tone: 'brass', on: 'figure', d: 'M90.6 78l5 0 -.6 5h-3.8z' },
      { tone: 'brass', on: 'figure', d: dot(84, 58, 8.5) },
      { tone: 'brass', on: 'figure', d: 'M82 46h4v3h-4z' },
      { tone: 'pale', on: 'figure', d: dot(84, 58, 6.2) },
      { tone: 'ink', on: 'figure', stroke: 1.2, d: 'M84 58V53M84 58l4 2.5' },
      { tone: 'brass', on: 'figure', d: 'M82.5 64.5h3v5h-3z' },
      { tone: 'ink', on: 'figure', d: RAISED_HAND },
    ],
  },

  // Plump and prosperous: hair oiled flat, a double chin, a waistcoat and its chain.
  bursar: {
    tint: '#a4283f',
    head: { wide: 1.1, tall: 0.95, dy: 1 },
    body: 'M0 120c0-16 8-25 25-29l9-2.5h28l10 3c17 4.5 28 13 28 28.5z',
    neck: 1.5,
    layers: [
      // Hair slicked back over the crown, with its shine.
      { tone: 'ink', d: 'M27 49C24 28 37 14 54 14.5c9 .3 15 4 17 9-8-2-17 0-23 5-7 5-11 12-12 20z' },
      { tone: 'pale', stroke: 1.4, d: 'M38 22c8-4 18-5 28-2' },
      // A double chin, and then another.
      { tone: 'ink', d: 'M49 72c7 5 15 4 20-1 2 7-1 13-9 14-6-1-10-6-11-13z' },
      { tone: 'ink', d: 'M44 82c6 6 15 6 21 0 1 5-2 9-9 10-6-1-11-4-12-10z' },
      // The waistcoat in grey, its V of shirt, a bow tie, and its buttons.
      { tone: 'grey', on: 'figure', d: 'M27 120c0-10 4-17 12-22l8.5 9 8.5-9c8 5 12 12 12 22z' },
      { tone: 'pale', on: 'figure', d: 'M38 91h19l-9.5 18z' },
      { tone: 'ink', on: 'figure', d: 'M47.5 95c-5-4.2-10-4.4-12.5-1.5.6 4.2 6.5 5.3 12.5 1.5zM47.5 95c5-4.2 10-4.4 12.5-1.5-.6 4.2-6.5 5.3-12.5 1.5z' },
      { tone: 'brass', on: 'figure', d: dot(47.5, 95, 1.5) + dot(47.5, 112, 1.7) + dot(47.5, 118, 1.7) },
      // The brass chain, looped across to the pocket.
      { tone: 'brass', on: 'figure', stroke: 1.5, d: 'M47.5 106c7 6 14 7 21 3' },
      { tone: 'brass', on: 'figure', d: dot(69, 109, 2) },
    ],
    // The college cash box, swung low from the hand by its handle.
    prop: [
      { tone: 'ink', on: 'figure', d: LOW_ARM },
      { tone: 'brass', on: 'figure', stroke: 1.6, d: 'M70 99c0-6 11-6 11 0' },
      { tone: 'leather', on: 'figure', d: 'M64 99h24v13H64z' },
      { tone: 'brass', on: 'figure', d: 'M64 99h24v2.5H64zM73 99h6v6h-6z' },
      { tone: 'ink', on: 'figure', d: dot(76, 102.5, 1) },
      { tone: 'ink', on: 'figure', d: dot(75.5, 96, 4.4) },
    ],
  },

  // Lean and stooping, a nose for a mistake, hair combed across the bare crown; a grey hood.
  tutor: {
    tint: '#b7bcc2',
    head: { wide: 0.9, tall: 1.1, dx: 2, dy: 3, tilt: 9 },
    body: 'M10 120c0-15 7-24 19-28l8-3h17l8 5c12 5 22 12 22 26z',
    neck: 0.9,
    layers: [
      // Thin hair combed from the ear over the crown.
      { tone: 'grey', d: 'M30 48c-6 4-6 20 3 29-1-9-1.5-19-1-29z' },
      { tone: 'grey', stroke: 1.1, d: 'M33 32c8-8 20-11 31-7M32 38c10-6 22-8 32-4M34 44c8-5 17-7 25-3' },
      // A long scholar's nose.
      { tone: 'ink', d: 'M66.5 40l12.5 15.5c.5 3-3.5 4.5-8.5 3.5z' },
      // A stiff collar, the gown's grey hood, and its fold.
      { tone: 'pale', on: 'figure', d: collar(0.9, 85.5, 92, 1.2) },
      { tone: 'grey', on: 'figure', d: 'M35 91c-10 1-18 6-22 15l9 4c3-7 8-12 15-13z' },
    ],
    // A sheaf of essays, held in the hand at the side, the top sheet curling.
    prop: [
      { tone: 'ink', on: 'figure', d: 'M60 120c2-10 8-17 16-21l6 6c-5 4-8 9-9 15z' },
      { tone: 'pale', on: 'figure', d: 'M70 92l18-3 4 22-18 3z' },
      { tone: 'pale', on: 'figure', d: 'M74 88l16-3 3.4 3-17 3.5z' },
      { tone: 'ink', on: 'figure', stroke: 1, d: 'M75 98l12-2M76 103l12-2M77 108l12-2' },
      { tone: 'ink', on: 'figure', d: dot(78, 111, 4) },
    ],
  },

  // Young, hair in his eyes, a scarf wound twice about the neck, a flask held to the light.
  fellow: {
    tint: '#2a8a7a',
    head: { wide: 0.97, tall: 1.03, dy: -1, tilt: -3 },
    body: shoulders(26, 0.88),
    neck: 0.88,
    layers: [
      // Hair that will not be parted: a tuft on the crown, and a lock fallen over the brow.
      { tone: 'ink', d: 'M36 26c-4-9 3-14 9-11 5-6 15-4 18 3 6 0 10 5 9 12-1 3-3 5-4 8-2-5-6-7-10-8-9-1-16 2-22 6z' },
      { tone: 'ink', d: 'M60 27c8-2 14 2 16 9 .6 3 0 6-1.6 8-.8-5-3.6-8-8.4-10z' },
      // The scarf, and the end of it hanging in front.
      { tone: 'pale', on: 'figure', d: collar(0.88, 80, 91, 1.4) },
      { tone: 'brass', on: 'figure', d: scarfStripes(0.88, 80, 1.4) },
      { tone: 'pale', on: 'figure', d: 'M50 92l11 3-1.5 22-11-2z' },
      { tone: 'brass', on: 'figure', d: 'M49.7 100l11.3 3 -.3 3.6-11.3-3zM48.8 108l11.3 3-.3 3.6-11.3-3z' },
      { tone: 'pale', on: 'figure', stroke: 1.2, d: 'M49 116.5l-.3 3M51.5 117l-.3 3M54 117.5l-.3 3M56.5 118l-.3 3M59 118.5l-.3 3' },
      // The short gown's yoke, with its pleats.
      { tone: 'grey', on: 'figure', stroke: 1, d: 'M24 112c3-6 7-10 12-12M72 112c-3-6-7-10-12-12' },
    ],
    // A round-bottomed flask of something amber, held up by the neck.
    prop: [
      { tone: 'ink', on: 'figure', d: RAISED_ARM },
      { tone: 'pale', on: 'figure', stroke: 3.4, d: 'M84 70V57' },
      { tone: 'pale', on: 'figure', d: dot(84, 48, 9) },
      { tone: 'brass', on: 'figure', d: 'M75.5 50h17a8.6 8.6 0 0 1-17 0z' },
      { tone: 'pale', on: 'figure', stroke: 1.6, d: 'M81.6 38.5h4.8' },
      { tone: 'ink', on: 'figure', d: RAISED_HAND },
    ],
  },

  // A bowler hat, a moustache like a hedge, and the keys to every door in the college.
  headporter: {
    tint: '#2b5a3a',
    head: { wide: 1.04, tall: 0.96 },
    body: 'M2 120c0-14 8-23 24-27l9-3h24l10 3c16 4 27 13 27 27z',
    neck: 1.5,
    layers: [
      // The bowler: the dome, the rolled brim, and the college's badge.
      { tone: 'ink', d: 'M27 35C25 16 37 6 52 6s26 10 25 29z' },
      { tone: 'ink', d: 'M16 35c21-5 49-5 70 0 1.5 2.5 0 5-2.5 5.5-21-3-45-3-65 0-2.5-.5-4-3-2.5-5.5z' },
      { tone: 'brass', stroke: 1.5, d: 'M27 32c16-3 34-3 50 0' },
      { tone: 'brass', d: dot(66, 21, 2.4) },
      // Grey side-whiskers, and a moustache that has seen off many an undergraduate.
      { tone: 'grey', d: 'M34 52c-5 5-5 15 1 21 3-5 4-13 2-21z' },
      { tone: 'grey', d: 'M69 57c-4-1.6-9-.6-13 2.6 3.6 5.6 9 6.6 13 3zM69 57c4.4-1.6 9.4-.6 13 2.4-2.6 6-8.6 7-13 3.4z' },
      // The stiff collar, and the dark coat with its brass buttons.
      { tone: 'pale', on: 'figure', d: collar(1.5, 82, 90, 0.8) },
      { tone: 'brass', on: 'figure', d: dot(47, 100, 1.9) + dot(47, 107, 1.9) + dot(47, 114, 1.9) },
      { tone: 'brass', on: 'figure', stroke: 1.2, d: 'M36 94l9 4M58 94l-9 4' },
    ],
    // A great iron ring of keys, hung from the hand and jangling.
    prop: [
      { tone: 'ink', on: 'figure', d: RAISED_ARM },
      { tone: 'grey', on: 'figure', stroke: 2, d: 'M83 77a7 7 0 1 0 .1 0' },
      { tone: 'grey', on: 'figure', stroke: 2, d: 'M77 91l-4 15M83 93v18M89 91l4 14' },
      { tone: 'grey', on: 'figure', d: dot(77, 91, 2.6) + dot(83, 93, 2.6) + dot(89, 91, 2.6) },
      { tone: 'brass', on: 'figure', stroke: 2, d: 'M73 106h-4M74 102h-3.4M83 111h4M83 106.5h-3.6M93 105h4M92 101h-3.6' },
      { tone: 'ink', on: 'figure', d: RAISED_HAND },
    ],
  },

  // Old, bald and stooped over the Master's tea: a white jacket buttoned to the throat.
  scout: {
    tint: '#b07a5a',
    head: { wide: 0.98, tall: 0.98, dx: 2, dy: 4, tilt: 8 },
    body: 'M8 120c0-14 8-23 21-27l6-2.5h17l9 4c14 5 23 12 25 25.5z',
    neck: 0.95,
    layers: [
      // A shine on the crown, a ring of white hair behind, and drooping brows.
      { tone: 'pale', d: dot(52, 23, 2.2) },
      { tone: 'grey', d: 'M31 43c-6 5-7 17-2 27 4-2 7-6 7-12-1-5-2-10-5-15z' },
      { tone: 'grey', stroke: 2.2, d: 'M56 41c5-2 10-2.3 14-.4' },
      // The steward's jacket, with its stand collar and ink buttons.
      { tone: 'pale', on: 'figure', d: 'M8 120c0-14 8-23 21-27l8-2 10 3 12-3 8 3c14 5 23 12 25 26z' },
      { tone: 'pale', on: 'figure', d: collar(0.95, 83.5, 91.5, 1.4) },
      { tone: 'ink', on: 'figure', stroke: 1, d: 'M47 96v24' },
      { tone: 'ink', on: 'figure', d: dot(44, 101, 1.5) + dot(44, 108, 1.5) + dot(44, 115, 1.5) },
    ],
    // The Master's tea tray, carried low on the flat of the hand, a pot upon it.
    prop: [
      { tone: 'pale', on: 'figure', d: LOW_ARM },
      { tone: 'ink', on: 'figure', stroke: 1, d: 'M64 120c1-9 5-16 11-20' },
      { tone: 'ink', on: 'figure', d: 'M70 94c0-6 4-9 9-9s9 3 9 9z' },
      { tone: 'ink', on: 'figure', d: 'M79 80.5c2 0 3 1.4 3 3.2h-6c0-1.8 1-3.2 3-3.2z' },
      { tone: 'ink', on: 'figure', stroke: 1.7, d: 'M87 91l7-4M70 87c-5-1-5 7 0 6' },
      { tone: 'brass', on: 'figure', d: 'M60 96h34l-3 5H63z' },
      { tone: 'ink', on: 'figure', d: dot(78, 103, 3.6) },
    ],
  },

  // A woman of firm opinions: hair dragged into a bun, a round set face, the gown over a high collar.
  don: {
    tint: '#d2e24a',
    head: { wide: 1.05, tall: 0.97, tilt: -2 },
    body: shoulders(26, 0.76),
    neck: 0.76,
    layers: [
      // Hair pulled back from the brow and screwed into a bun at the nape, a streak of grey in it.
      { tone: 'ink', d: dot(26, 62, 9) },
      { tone: 'brass', stroke: 1.4, d: 'M20 58l8 7' },
      { tone: 'grey', stroke: 1.6, d: 'M36 29c8-8 21-10 31-5' },
      // A jaw that has made up its mind.
      { tone: 'ink', d: 'M52 70c6 3 12 2 17-2 1.5 6-1 11-8 12-5-1-8-5-9-10z' },
      // The gown over a blouse buttoned high, with a cameo at the throat.
      { tone: 'pale', on: 'figure', d: collar(0.76, 82, 92, 1.6) },
      { tone: 'pale', on: 'figure', d: 'M40 94l7.5 13 7.5-13z' },
      { tone: 'brass', on: 'figure', d: dot(47.5, 95.5, 2.4) },
      { tone: 'pale', on: 'figure', stroke: 1, d: 'M25 118c2-8 6-13 11-16M71 118c-2-8-6-13-11-16' },
    ],
    // A book carried under the arm, spine to her.
    prop: [
      { tone: 'ink', on: 'figure', d: 'M58 120c2-9 8-15 16-18l7 5c-6 3-10 8-12 13z' },
      { tone: 'leather', on: 'figure', d: 'M52 100l33-8 3 11-33 9z' },
      { tone: 'pale', on: 'figure', d: 'M85 92l3 11-2.4.6-3-10.6z' },
      { tone: 'brass', on: 'figure', stroke: 1.2, d: 'M64 97.5l3 11M72 95.5l3 11' },
      { tone: 'ink', on: 'figure', d: dot(74, 108, 4) },
    ],
  },

  // Nineteen and untidy: hair like a hayrick, the college scarf, a commoner's gown, and a tankard.
  undergraduate: {
    tint: '#7a3fa0',
    head: { wide: 0.98, tall: 1.02, dy: -1, tilt: -4 },
    body: shoulders(27, 1.05),
    neck: 1.05,
    layers: [
      // Tousled hair: tufts at the crown and a lock in the eyes.
      { tone: 'ink', d: 'M34 27c-5-8 2-14 8-12 3-7 13-6 16-.5 6-3 13 0 14 7 5 1 8 6 6 12-1 2-3 4-4 6-2-5-5-7-9-8-9-1-17 2-23 6z' },
      { tone: 'ink', d: 'M58 26c9-3 17 1 19 8 .8 3 .2 6-1.6 8-.7-5-4-8-9-9z' },
      { tone: 'ink', d: 'M36 20l-5-5 8 1zM48 14l-1-6 5 5zM62 14l3-5 2 6z' },
      // The college scarf, thrown over one shoulder behind.
      { tone: 'pale', on: 'figure', d: collar(1.05, 80.5, 91, 1.4) },
      { tone: 'brass', on: 'figure', d: scarfStripes(1.05, 80.5, 1.4) },
      { tone: 'pale', on: 'figure', d: 'M36 91l-9 3-3 23 9 2z' },
      { tone: 'brass', on: 'figure', d: 'M31.2 103.6l-9.6 3.2.8 3.4 9.6-3.2zM29.6 111.4l-9.6 3.2.8 3.4 9.6-3.2z' },
      // The open collar, and the commoner's gown with its leading strings.
      { tone: 'pale', on: 'figure', d: 'M40 93l7.5 10 7.5-10-3.5-3H43.5z' },
      { tone: 'grey', on: 'figure', stroke: 1.3, d: 'M60 98c3 5 4 12 3 20M66 100c3 5 4 12 3 20' },
    ],
    // A pewter tankard, raised, its froth running over.
    prop: [
      { tone: 'ink', on: 'figure', d: RAISED_ARM },
      { tone: 'grey', on: 'figure', d: 'M76 48h15l-1.8 22H77.8z' },
      { tone: 'grey', on: 'figure', stroke: 2.2, d: 'M91 54c8 1 8 11 .6 12' },
      { tone: 'pale', on: 'figure', d: 'M75 49c1-4 3-5.5 5-4 1-3 5-3.4 6 0 2.4-1.2 5 .6 5 4z' },
      { tone: 'brass', on: 'figure', d: 'M77.6 66h12.4l-.4 4H78z' },
      { tone: 'ink', on: 'figure', d: RAISED_HAND },
    ],
  },
}

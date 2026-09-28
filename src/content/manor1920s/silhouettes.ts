// Cameo portraits for the Blackwood household: shapes laid over the shared
// profile bust (100 × 120, facing right). They show only what anyone at the
// table can see — never anything about guilt.

import type { SilhouetteDef } from '../schema'

/** A small filled disc, for pearls, medals and embers. */
function dot(cx: number, cy: number, r: number): string {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0z`
}

const SMOKE = 'M88 55c4-5-3-9 1-15 3-4 0-8 2-12'

export const silhouettes: Record<string, SilhouetteDef> = {
  colonel: {
    tint: '#5b2d28',
    layers: [
      // Close-cropped hair, brushed back.
      { tone: 'ink', d: 'M28 52C25 31 40 15 55 16c7 .4 12 4 13.5 9.5-7-3-16-2.5-23 2.5-7 5-10 13-10.5 24z' },
      // A cavalry moustache.
      { tone: 'ink', d: 'M66.5 56c2.6-.7 5.2 .4 6.4 2.6 .7 1.3 .4 2.9-.4 3.8-1.7-1-3.9-1.5-6.3-1.7z' },
      // A row of medals on their ribbon bar.
      { tone: 'brass', stroke: 1.2, d: 'M47 102l16 5' },
      { tone: 'brass', d: dot(50, 107, 2.3) + dot(56, 108.8, 2.3) + dot(62, 110.6, 2.3) },
    ],
  },
  vicar: {
    tint: '#2c3848',
    layers: [
      // A bald crown, a fringe left at the back.
      { tone: 'ink', d: 'M28.5 54c-5 3-5 16 3.5 23-2-7-2.5-15-1-22z' },
      // The clerical collar.
      { tone: 'pale', d: 'M39 83c6 4.5 13 5 19.5 2l1 4.5c-7 3.5-15 3-21.5-1.5z' },
    ],
  },
  trent: {
    tint: '#40391f',
    layers: [
      // Brilliantined hair with a forward sweep.
      { tone: 'ink', d: 'M28 52C25 30 40 13.5 56 14.5c9 .5 15 5 16 11-6-3-12-3-17-1.5-10 3-17 11-18.5 22-.5 4 0 7.5 .5 10.5-4 0-8-1.5-9-4.5z' },
      // The cigar, its ember and its smoke.
      { tone: 'ink', d: 'M69.5 60.5l15-3 .8 3-15 3.2z' },
      { tone: 'brass', d: dot(85.5, 59, 1.5) },
      { tone: 'brass', stroke: 1, d: SMOKE },
    ],
  },
  josephine: {
    tint: '#4a2742',
    layers: [
      // A sharp bob with a fringe.
      { tone: 'ink', d: 'M70.5 33C71 20 60 11.5 47 12.5 31 13.5 21 28 22 46c.5 12 3.5 22 9.5 29.5 7 2 14-1 15.5-7 2-8-1-16 1.5-24 2.5-7 9-11 22-11.5z' },
      // Beaded headband and its feather.
      { tone: 'brass', stroke: 2, d: 'M24.5 38c13-9 30-12 46-8.5' },
      { tone: 'ink', d: 'M33 32C24 25 19 14 21 2c9 7 15 18 15 29z' },
      { tone: 'brass', stroke: 0.9, d: 'M34 31C28 23 24 14 22 5' },
      // A long cigarette holder.
      { tone: 'ink', stroke: 1.5, d: 'M69.5 62l22-7.5' },
      { tone: 'brass', d: dot(92, 54.3, 1.3) },
      { tone: 'brass', stroke: 1, d: 'M93 51c4-5-3-9 1-15 3-4 0-8 2-12' },
    ],
  },
  vivienne: {
    tint: '#25403f',
    layers: [
      // Swept-up hair and a heavy chignon.
      { tone: 'ink', d: 'M28 50C25 28 40 11.5 57 12.5c9 .5 14 7 13.5 15.5-6-4-13-5-19.5-3-10 3.5-16 13-17 25z' },
      { tone: 'ink', d: dot(21.5, 50, 10.5) },
      // A jewelled comb, a drop earring, a pearl choker.
      { tone: 'brass', d: 'M27 36l5-9 3 2.5-4 8.5z' },
      { tone: 'brass', stroke: 1, d: 'M45 62v6' },
      { tone: 'brass', d: dot(45, 69.5, 1.8) },
      { tone: 'pale', d: dot(41.5, 84.5, 1.5) + dot(45.5, 86.5, 1.5) + dot(49.8, 87.5, 1.5) + dot(54, 87.2, 1.5) + dot(57.8, 85.8, 1.5) },
    ],
  },
  elsie: {
    tint: '#33452f',
    layers: [
      // Hair pinned into a bun under a frilled cap.
      { tone: 'ink', d: 'M28 52C25.5 31 40 15.5 55 16.5c7 .4 12 4 13.5 9.5-7-3-16-2.5-23 2.5-7 5-10 12.5-10.5 23.5z' },
      { tone: 'ink', d: dot(22.5, 55, 8.5) },
      { tone: 'pale', d: 'M41 22c1-5 3-9.5 6-9 1.5 .2 1.5 3 2.5 3 1.5 0 2-5 5-4.5 2 .3 1.5 3.5 3 4 1.8 .5 3-3 5.5-1.5 3 1.8 4 7 4.5 11-8-4.5-18-5-26.5-3z' },
      { tone: 'pale', stroke: 1.6, d: 'M41 22.5c-6 4-10 10-12 17' },
      // The apron's white collar.
      { tone: 'pale', d: 'M36 91.5c8 6 19 6.5 29 3l1.5 4.5c-11 4-23 3-32.5-3.5z' },
    ],
  },
  ellison: {
    tint: '#25394a',
    layers: [
      // Thinning on top, a fringe behind.
      { tone: 'ink', d: 'M28.5 50c-6 4-5.5 19 4 27-2-8-2.5-18-.5-27z' },
      // A pointed beard.
      { tone: 'ink', d: 'M55 72c4 2 9 1.5 13.5-3.5 3 7 2.5 15-3 21.5-4-3-8-8.5-10.5-18z' },
      // Round spectacles.
      { tone: 'brass', stroke: 1.3, d: dot(61.5, 42.5, 4.6) },
      { tone: 'brass', stroke: 1.1, d: 'M57 42 41 44.5' },
      { tone: 'brass', stroke: 1.1, d: 'M66 41.5l1.5-.8' },
    ],
  },
  barrow: {
    tint: '#3e3324',
    layers: [
      // Hair parted with a ruler.
      { tone: 'ink', d: 'M28 52C26 31 40 14.5 55 15.5c8 .5 13 4.5 14 10-7-3.5-15-3-21.5 1-7.5 5-11.5 13.5-12 25.5z' },
      // Pince-nez on a cord.
      { tone: 'brass', stroke: 1.2, d: dot(62.5, 42.5, 3.6) },
      { tone: 'brass', stroke: 0.6, d: 'M59.5 44.5c-7 12-9 30-3.5 47' },
      // A starched wing collar.
      { tone: 'pale', d: 'M56.8 83.5l6.5 5.5-6 3z' },
    ],
  },
  constance: {
    tint: '#4b343c',
    layers: [
      // Long hair worn loose down the back.
      { tone: 'ink', d: 'M70.5 31C71 18.5 59 11.5 47 12.5 31 13.5 22 28 23 46c.5 15-4 31-11 47 9 5 21 2 28-5 2-6 1.5-12 0-16-1-10 2-20 8-27 5-6 13-9 22.5-14z' },
      // A wide satin bow, worn on the crown.
      { tone: 'brass', d: 'M46 13c-6-8-16-9-18-4-1 6 8 9 18 4z' },
      { tone: 'brass', d: 'M46 13c6-8 16-9 18-4 1 6-8 9-18 4z' },
      { tone: 'brass', d: 'M44.5 14l-3 9 3.5-1.5 1 2.5 1-2.5 3.5 1.5-3-9z' },
      { tone: 'ink', d: dot(46, 13, 2.2) },
    ],
  },
  pemberton: {
    tint: '#2f2e3c',
    layers: [
      // Scraped-back hair and a bun like a fist.
      { tone: 'ink', d: 'M28 52C26 32 40 16 55 17c7 .4 11.5 4 13 9-7-3-15.5-2.5-22 2.5-7 5-10.5 12.5-11 23.5z' },
      { tone: 'ink', d: dot(31, 21, 9) },
      // High lace collar, fastened with a brooch.
      { tone: 'pale', d: 'M38.5 79c6 4 14 4.5 19.5 1l.8 8c-7 4-15.5 3.5-21.5-.5z' },
      { tone: 'brass', d: dot(60.5, 93, 2.4) },
    ],
  },
}

// The exhibits, cut from black paper like the household: one drawing for each
// thing that can be found. Drawn on a 100 × 100 square. `ink` is the object
// itself; `pale` and `brass` pick out a label, a lens, a ribbon.

import type { ItemArt, SilhouetteLayer } from '../schema'

const ink = (d: string, stroke?: number): SilhouetteLayer => ({ d, tone: 'ink', stroke })
const pale = (d: string, stroke?: number): SilhouetteLayer => ({ d, tone: 'pale', stroke })
const brass = (d: string, stroke?: number): SilhouetteLayer => ({ d, tone: 'brass', stroke })

export const itemArt: ItemArt = {
  glyphs: {
    // ---- how it was done ----
    'weapon.poison': [
      ink('M41 8h18v12H41z'),
      ink('M44 20h12v14c11 5 18 15 18 28v18a9 9 0 0 1-9 9H35a9 9 0 0 1-9-9V62c0-13 7-23 18-28z'),
      pale('M34 58h32v20H34z'),
      ink('M50 61a6 6 0 0 1 6 6c0 2-1 3.5-2 4.5V75h-8v-3.5c-1-1-2-2.5-2-4.5a6 6 0 0 1 6-6z'),
    ],
    'weapon.revolver': [
      ink('M10 32h56v-5h12l6 9v14h-7l9 36-19 4-7-28h-7c-2 7-9 9-13 4l-3-9H10z'),
      pale('M48 35h5v13h-5zM58 35h5v13h-5z'),
      pale('M40 58c3 4 7 4 9 0', 2.5),
    ],
    'weapon.bludgeon': [
      ink('M22 74l50-52 7 7-50 52z'),
      ink('M74 16l12-7 5 8-9 6 5 11-8 4-8-16z'),
      brass('M10 80a10 10 0 1 0 20 0 10 10 0 0 0-20 0z'),
      brass('M30 66l6 6', 5),
    ],

    // ---- who was where ----
    'trace.cane': [
      ink('M38 90V34a14 14 0 0 1 28 0v10', 11),
      brass('M38 80v10', 11),
      pale('M58 84h22M62 73h16M60 94h14', 4),
    ],
    'trace.smoker': [
      ink('M14 56h52v10H14z'),
      brass('M66 56h10v10H66z'),
      ink('M78 50c-7-8 5-12-1-20s5-12 0-19l5-2c7 8-5 12 1 20s-5 12 0 20z'),
      pale('M20 88c4-9 11-11 17-6 5-7 13-7 18 0 6-3 11 0 13 6z'),
    ],
    'trace.perfume': [
      ink('M40 18h20v12H40z'),
      ink('M44 30h12v12H44z'),
      ink('M30 42h40a7 7 0 0 1 7 7v32a9 9 0 0 1-9 9H32a9 9 0 0 1-9-9V49a7 7 0 0 1 7-7z'),
      pale('M50 52l11 14-11 14-11-14z'),
      ink('M60 22h14', 3),
      brass('M74 22a8 8 0 1 0 16 0 8 8 0 0 0-16 0z'),
    ],
    'trace.spectacles': [
      ink('M12 58a18 18 0 1 0 36 0 18 18 0 0 0-36 0zM52 58a18 18 0 1 0 36 0 18 18 0 0 0-36 0z'),
      pale('M18 58a12 12 0 1 0 24 0 12 12 0 0 0-24 0zM58 58a12 12 0 1 0 24 0 12 12 0 0 0-24 0z'),
      ink('M46 54c3-3 5-3 8 0', 4),
      ink('M14 52L6 36M86 52l8-16', 4),
      ink('M64 48l7 9-5 4 7 9M71 57l8-3', 2),
    ],
    'trace.gloves': [
      ink(
        'M32 92V58L21 43c-4-6 4-11 8-5l7 9V24c0-7 9-7 9 0v22h2V17c0-7 9-7 9 0v29h2V21c0-7 9-7 9 0v27h2V32c0-7 9-7 9 0v34c0 10-4 18-8 26z',
      ),
      pale('M32 80h38v12H32z'),
      brass('M38 86h.2M46 86h.2', 4),
      pale('M58 50l4 8-5 5 5 8', 2.5),
    ],

    // ---- what else went on ----
    lockbox: [
      ink('M16 46h68v40H16z'),
      ink('M14 42l62-20 5 13-62 20z'),
      brass('M16 58h68v6H16z'),
      pale('M50 60a6 6 0 0 1 3.5 10.8L56 80H44l2.5-9.2A6 6 0 0 1 50 60z'),
      brass('M24 34l5-1.6M66 20l5-1.6', 3),
    ],

    // ---- why ----
    'doc.hostile': [
      ink('M24 10h38l14 14v66H24z'),
      pale('M62 10v14h14z'),
      pale('M32 36h36M32 46h36M32 56h36M32 66h22', 3.5),
      ink('M30 80c8-8 12 4 20-4s10 2 16-4', 3),
    ],
    'doc.indebted': [
      ink('M8 26c15-6 29-6 42 3 13-9 27-9 42-3v56c-15-6-29-6-42 3-13-9-27-9-42-3z'),
      pale('M50 32v54', 2.5),
      pale('M16 40c10-3 18-2 26 2M16 52c10-3 18-2 26 2M16 64c10-3 18-2 26 2', 3),
      pale('M58 42c8-4 16-5 26-2M58 54c8-4 16-5 26-2', 3),
      brass('M58 68c8-4 16-5 26-2M58 73c8-4 16-5 26-2', 2.5),
    ],
    'doc.jilted': [
      ink('M12 40h76v46H12z'),
      ink('M17 31h66v9H17zM22 22h56v9H22z'),
      pale('M17 45h66v36H17z'),
      ink('M17 45l33 20 33-20', 3),
      ink('M12 60h76', 7),
      ink('M50 60c-10-12-20-7-15 0 -5 7 5 12 15 0zM50 60c10-12 20-7 15 0 5 7-5 12-15 0z'),
    ],

    // ---- of no account ----
    timetable: [
      ink('M22 10h56v80H22z'),
      pale('M30 18h40v12H30z'),
      pale('M30 40h40M30 50h40M30 60h40M30 70h40M30 80h40', 3),
      ink('M46 36v48M60 36v48', 2.5),
    ],
    decanter: [
      brass('M42 4h16v10H42z'),
      ink('M45 14h10v16c13 8 21 20 21 36v16a8 8 0 0 1-8 8H32a8 8 0 0 1-8-8V66c0-16 8-28 21-36z'),
      pale('M34 60c-2 8-2 16 0 22', 3.5),
    ],
    crossword: [
      ink('M14 14h72v72H14z'),
      pale(
        'M20 20h14v14H20zM37 20h14v14H37zM54 20h14v14H54zM20 37h14v14H20zM54 37h14v14H54zM71 37h9v14h-9zM37 54h14v14H37zM54 54h14v14H54zM20 71h14v9H20zM37 71h14v9H37z',
      ),
    ],
    novel: [
      ink('M22 10h50a6 6 0 0 1 6 6v74H28a6 6 0 0 1-6-6z'),
      pale('M28 80h50v6H28z'),
      brass('M50 34a6 6 0 1 0 0 .1zM40 44a6 6 0 1 0 0 .1zM60 44a6 6 0 1 0 0 .1zM44 56a6 6 0 1 0 0 .1zM56 56a6 6 0 1 0 0 .1z'),
      pale('M50 44a4 4 0 1 0 0 .1z'),
    ],
    programme: [
      ink('M12 70h76L76 88H24z'),
      ink('M48 10v56H18z'),
      pale('M53 20v46h27z'),
      brass('M48 10l14 5-14 5z'),
    ],
    misc: [
      ink('M20 30h60v56H20z'),
      ink('M14 22h72v10H14z'),
      pale('M42 50h16', 4),
    ],
  },

  flavor: {
    'a dog-eared railway timetable': 'timetable',
    'an empty decanter, rinsed clean': 'decanter',
    'a half-finished crossword in an unsteady hand': 'crossword',
    'a novel with a pressed flower at chapter three': 'novel',
    'a programme from last season’s regatta': 'programme',
  },

  tints: {
    weapon: '#b9443b',
    trace: '#d98a36',
    lockbox: '#8d66bd',
    document: '#3f82b8',
    flavor: '#6c787f',
  },
}

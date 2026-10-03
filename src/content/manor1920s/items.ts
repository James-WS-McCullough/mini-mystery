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

    'weapon.cord': [
      ink('M30 12c30 6 44 22 40 40s-26 26-40 18-16-28 0-34 30 4 28 18-14 22-26 16', 7),
      brass('M22 84l10-14 8 6-6 14z'),
      brass('M18 96l6-10M26 98l4-10M33 97l2-9', 3),
    ],
    'weapon.knife': [
      ink('M84 14C70 30 50 52 34 66l-8-8C40 40 62 22 84 14z'),
      brass('M22 62l14 14-16 14c-4 3-10 2-13-2s-2-9 2-12z'),
      pale('M76 22C64 34 50 48 38 60', 2),
    ],
    'weapon.fall': [
      ink('M6 26h88v8H6z'),
      ink('M12 34h6v40h-6zM28 34h6v40h-6zM82 34h6v40h-6z'),
      ink('M46 34l5 18-7 22h-6l6-22-5-18zM62 34l6 16-3 24h-6l3-24-6-16z'),
      ink('M6 74h38v8H6zM72 74h22v8H72z'),
      pale('M50 82l6 6-8 4M60 80l2 10', 2.5),
      brass('M46 92h22', 3),
    ],
    'weapon.motor': [
      ink('M8 62c0-8 4-12 12-13l8-17c2-4 5-6 10-6h24c5 0 8 2 10 6l6 16c8 1 14 6 14 14v10H8z'),
      pale('M34 34h12v14H30zM50 34h12l5 14H50z'),
      ink('M16 72a10 10 0 1 0 20 0 10 10 0 0 0-20 0zM62 72a10 10 0 1 0 20 0 10 10 0 0 0-20 0z'),
      pale('M22 72a4 4 0 1 0 8 0 4 4 0 0 0-8 0zM68 72a4 4 0 1 0 8 0 4 4 0 0 0-8 0z'),
      brass('M86 56l8-6M88 62h8M86 68l8 5', 2.5),
    ],

    // ---- and elsewhere than the manor ----
    'weapon.shotgun': [
      ink('M8 62h50l4-6h22l6 4-4 8H62l-4 6H8z'),
      ink('M20 70l-6 22h8l6-22z'),
      brass('M44 56h4v14h-4z'),
      pale('M62 60h24', 2),
    ],
    'weapon.millpond': [
      ink('M6 66c10-8 20-8 30 0s20 8 30 0 20-8 28 0v28H6z'),
      pale('M14 76c8-5 16-5 24 0s16 5 24 0 16-5 24 0', 2.5),
      ink('M40 20l6 34-8 2-8-30z'),
      brass('M44 30l6-5 4 6-6 5z'),
    ],
    'weapon.trap': [
      ink('M20 70a12 12 0 1 0 24 0 12 12 0 0 0-24 0zM64 70a12 12 0 1 0 24 0 12 12 0 0 0-24 0z'),
      pale('M26 70a6 6 0 1 0 12 0 6 6 0 0 0-12 0zM70 70a6 6 0 1 0 12 0 6 6 0 0 0-12 0z'),
      ink('M28 44h44l8 16H22z'),
      ink('M14 46l-6-24 5-1 6 24z'),
      brass('M34 36h30v6H34z'),
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
    // Shut, and locked, as it should be: nothing was taken from this one.
    'lockbox.intact': [
      ink('M16 44h68v40H16z'),
      ink('M13 32h74v13H13z'),
      brass('M16 56h68v6H16z'),
      pale('M46 40h8v24h-8z'),
      brass('M42 72v-7a8 8 0 0 1 16 0v7', 4),
      brass('M36 70h28v22H36z'),
      ink('M50 75a3 3 0 0 1 1.8 5.4L53 87h-6l1.2-6.6A3 3 0 0 1 50 75z'),
    ],

    // ---- the key to the locked room ----
    key: [
      ink('M12 50a16 16 0 1 0 32 0 16 16 0 0 0-32 0z'),
      pale('M20 50a8 8 0 1 0 16 0 8 8 0 0 0-16 0z'),
      ink('M42 46h46v8H42z'),
      ink('M74 54h7v13h-7zM62 54h7v9h-7z'),
      brass('M8 26c6-10 20-12 26-4', 3),
    ],

    // ---- by his own hand, or so it says ----
    'doc.note': [
      ink('M24 12h52v66l-6 6-7-5-6 6-7-5-6 6-7-5-6 5-7-5z'),
      pale('M32 28c6-4 10 3 16 0s10-3 18 1M32 40c5-3 9 2 14 0s12-2 20 1M32 52c7-3 11 2 17-1', 3),
      pale('M48 66c4-5 8 2 12-1s6-2 8 0', 2.5),
    ],
    'doc.letter': [
      pale('M26 10h48v44H26z'),
      ink('M32 20c6-3 10 2 16 0s10-2 18 1M32 30c6-3 10 2 16 0s8-2 14 1', 2.5),
      ink('M12 40h76v48H12z'),
      pale('M12 40l38 26 38-26', 3),
    ],

    // ---- how somebody truly stood with him, where it was no motive ----
    'doc.pleasant': [
      ink('M18 14h64v72H18z'),
      pale('M26 26h48M26 36h48M26 46h36', 3.5),
      brass('M58 68a6 6 0 1 0 12 0 6 6 0 0 0-12 0zM64 62v-6M64 80v-6M58 68h-6M76 68h-6', 2.5),
    ],
    'doc.dinner': [
      ink('M14 22h72v56H14z'),
      pale('M20 28h60v44H20z', 2.5),
      brass('M40 40v24M36 40v8c0 4 8 4 8 0v-8M60 40c-4 0-6 6-6 12h6v12', 3),
    ],
    'doc.curt': [
      ink('M22 34h56v32H22z'),
      pale('M30 46h40', 3.5),
      ink('M30 56h16', 3),
    ],
    'doc.declined': [
      ink('M18 14h64v72H18z'),
      pale('M26 26h48M26 36h48M26 46h40', 3.5),
      brass('M52 58l20 20M72 58L52 78', 4),
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

    'doc.photograph': [
      ink('M16 12h68v76H16z'),
      pale('M23 19h54v54H23z'),
      ink('M40 38a10 10 0 1 0 20 0 10 10 0 0 0-20 0z'),
      ink('M30 73c2-14 10-20 20-20s18 6 20 20z'),
      pale('M38 28l24 20M62 28L38 48M36 38h28', 2.5),
    ],
    'doc.suit': [
      ink('M22 8h56v84H22z'),
      pale('M30 18h40v8H30z'),
      pale('M30 36h40M30 46h40M30 56h40M30 66h18', 3.5),
      brass('M56 76a10 10 0 1 0 20 0 10 10 0 0 0-20 0z'),
      brass('M60 82l-4 12 8-4zM72 82l4 12-8-4z'),
    ],
    'doc.diary': [
      ink('M20 12h54a6 6 0 0 1 6 6v64a6 6 0 0 1-6 6H20z'),
      pale('M30 12v76', 3),
      pale('M40 26h30v14H40z'),
      brass('M76 44h12v12H76z'),
      ink('M44 33h22', 2.5),
    ],
    'doc.notes': [
      ink('M36 10h50v56H36z'),
      pale('M36 10h50v56H36z', 2.5),
      ink('M14 30h52v60H14z'),
      pale('M14 30h52v60H14z', 2.5),
      pale('M22 44h36M22 54h36M22 64h22', 3.5),
      brass('M24 80c6-8 10 4 16-4s8 2 14-2', 3),
    ],
    'doc.ticket': [
      ink('M10 30h80v12a8 8 0 0 0 0 16v12H10V58a8 8 0 0 0 0-16z'),
      pale('M64 36v4M64 46v4M64 56v4M64 64v2', 2.5),
      brass('M24 42a6 6 0 1 0 12 0 6 6 0 0 0-12 0zM40 42a6 6 0 1 0 12 0 6 6 0 0 0-12 0zM32 56a6 6 0 1 0 12 0 6 6 0 0 0-12 0z'),
      pale('M72 44h10M72 54h10', 3),
    ],
    'doc.demand': [
      ink('M10 26h80v52H10z'),
      pale('M12 28l38 28 38-28', 3),
      pale('M12 76l28-24M88 76L60 52', 2.5),
      brass('M40 58a10 10 0 1 0 20 0 10 10 0 0 0-20 0z'),
    ],
    'doc.ring': [
      ink('M20 56V34a9 9 0 0 1 9-9h42a9 9 0 0 1 9 9v22z'),
      ink('M18 56h64v30H18z'),
      pale('M26 58h48v8H26z'),
      brass('M40 50a10 10 0 1 0 20 0 10 10 0 0 0-20 0z', 4.5),
      pale('M50 28l7 8-7 8-7-8z'),
    ],
    'doc.locket': [
      ink('M24 8c4 18 14 26 26 30M76 8c-4 18-14 26-26 30', 3),
      brass('M44 40a6 6 0 1 0 12 0 6 6 0 0 0-12 0z', 3),
      ink('M26 68a24 24 0 1 0 48 0 24 24 0 0 0-48 0z'),
      pale('M34 68a16 16 0 1 0 32 0 16 16 0 0 0-32 0z'),
      ink('M42 60l16 16M58 60L42 76', 2.5),
    ],
    'doc.invitation': [
      ink('M10 22h38l-7 11 9 11-9 11 9 11-7 12H10z'),
      ink('M56 28h34v56H59l7-12-9-11 9-11-9-11z'),
      pale('M17 34h20M17 46h16M17 58h20M17 68h14', 3),
      pale('M68 44h16M70 56h14M68 68h16', 3),
      brass('M24 22c0-8 10-8 10 0', 3),
    ],

    // a will not yet signed
    'doc.will': [
      ink('M22 8h56v84H22z'),
      pale('M32 18h36v9H32z'),
      pale('M30 38h40M30 48h40M30 58h40', 3.5),
      brass('M30 78h6M41 78h6M52 78h6M63 78h6', 3),
    ],
    'doc.struck': [
      ink('M22 8h56v84H22z'),
      pale('M30 22h40M30 34h40M30 58h40M30 70h26', 3.5),
      pale('M30 46h40', 3.5),
      brass('M26 50l48-8', 4),
    ],
    'doc.card': [
      ink('M12 26h76v50H12z'),
      pale('M18 32h64v38H18z'),
      ink('M26 42h26M26 52h20', 3),
      ink('M58 50a10 10 0 1 0 20 0 10 10 0 0 0-20 0z'),
      pale('M68 44v6l4 3', 2.5),
    ],
    'doc.quill': [
      ink('M18 60h38a4 4 0 0 1 4 4v20a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6V64a4 4 0 0 1 4-4z'),
      ink('M26 52h22v8H26z'),
      pale('M22 72h30', 3),
      ink('M44 56C56 30 70 16 90 8c-2 20-14 36-36 50z'),
      pale('M46 56C58 38 70 26 86 12', 2),
    ],
    // a will just signed
    'doc.signed': [
      ink('M22 8h56v84H22z'),
      pale('M32 18h36v9H32z'),
      pale('M30 38h40M30 48h40', 3.5),
      pale('M30 66c5-8 9 4 14-3s8 3 13-2', 3),
      brass('M58 74a10 10 0 1 0 20 0 10 10 0 0 0-20 0z'),
      brass('M62 80l-4 12 8-4zM74 80l4 12-8-4z'),
    ],
    'doc.codicil': [
      ink('M16 8h52v72H16z'),
      pale('M24 20h36M24 30h36M24 40h36', 3.5),
      ink('M44 48h42v44H44z'),
      pale('M44 48h42v44H44z', 2.5),
      pale('M52 60h26M52 70h26M52 80h14', 3),
      brass('M58 40v14', 5),
    ],
    'doc.policy': [
      ink('M20 8h60v84H20z'),
      brass('M50 18l18 6v14c0 12-8 20-18 24-10-4-18-12-18-24V24z'),
      ink('M50 26l10 3.5v9c0 7-4 12-10 15z'),
      pale('M30 72h40M30 82h28', 3.5),
    ],
    'doc.deedbox': [
      ink('M12 38h76v48H12z'),
      ink('M16 26h68v12H16z'),
      brass('M40 18h20v8H40z'),
      pale('M34 50h32v16H34z'),
      ink('M40 58h20', 3),
      brass('M46 74h8v12h-8z'),
    ],
    // about to be turned out
    'doc.dismissal': [
      ink('M22 8h56v84H22z'),
      pale('M30 20h40M30 30h40M30 40h24', 3.5),
      brass('M36 56l28 28M64 56L36 84', 6),
    ],
    'doc.quit': [
      ink('M50 10L12 42h10v44h56V42h10z'),
      pale('M42 60h16v26H42z'),
      pale('M26 50h10v10H26zM64 50h10v10H64z'),
      brass('M58 20h10v16l-10-8z'),
    ],
    'doc.advert': [
      ink('M12 14h76v72H12z'),
      pale('M20 22h60v10H20z'),
      pale('M20 40h26M20 50h26M20 60h26M20 70h26', 3),
      brass('M54 40h26v32H54z', 3),
      pale('M60 50h14M60 60h14', 3),
    ],
    'doc.wages': [
      ink('M10 22h80v50H10z'),
      pale('M12 24l38 26 38-26', 3),
      brass('M22 80a10 5 0 1 0 20 0 10 5 0 0 0-20 0zM40 86a10 5 0 1 0 20 0 10 5 0 0 0-20 0zM58 80a10 5 0 1 0 20 0 10 5 0 0 0-20 0z'),
    ],
    // about to be exposed
    'doc.report': [
      ink('M14 22h30l6 8h36v60H14z'),
      pale('M22 40h40M22 50h40M22 60h24', 3.5),
      brass('M56 66a11 11 0 1 0 22 0 11 11 0 0 0-22 0z', 4.5),
      brass('M75 75l12 12', 6),
    ],
    'doc.cutting': [
      ink('M16 10l8 6 8-6 8 6 8-6 8 6 8-6 8 6 8-6v80H16z'),
      pale('M24 26h52v8H24z'),
      pale('M24 44h52M24 54h52M24 74h52M24 84h30', 3),
      pale('M34 64h32', 3),
      brass('M26 64a24 9 0 1 0 48 0 24 9 0 0 0-48 0z', 3),
    ],
    'doc.telegram': [
      ink('M8 24h84v52H8z'),
      pale('M14 30h72v8H14z'),
      pale('M14 46h72v8H14zM14 60h48v8H14z'),
      ink('M20 50h14M40 50h20M66 50h14M20 64h22', 3),
      brass('M70 58h16v14H70z'),
    ],
    'doc.iknow': [
      ink('M10 24h80v56H10z'),
      pale('M12 26l38 28 38-28', 3),
      pale('M30 62c10-12 30-12 40 0-10 12-30 12-40 0z'),
      ink('M44 62a6 6 0 1 0 12 0 6 6 0 0 0-12 0z'),
    ],

    // partners in business
    'doc.articles': [
      ink('M20 8h60v84H20z'),
      pale('M28 18h44v8H28z'),
      pale('M28 36h44M28 46h44M28 66h44M28 76h26', 3.5),
      brass('M26 52h48v8H26z'),
      ink('M30 56h40', 2.5),
    ],
    'doc.dissolve': [
      ink('M10 26h80v52H10z'),
      pale('M12 28l38 28 38-28', 3),
      brass('M70 32h14v18H70z'),
      pale('M18 66h24M18 72h16', 3),
    ],
    'doc.share': [
      ink('M8 22h84v56H8z'),
      brass('M14 28h72v44H14z', 3),
      pale('M26 40h48M26 50h48', 3.5),
      brass('M40 62a8 8 0 1 0 16 0 8 8 0 0 0-16 0z'),
      brass('M22 36l6 6M78 36l-6 6', 3),
    ],
    'doc.accounts': [
      ink('M16 10h62a6 6 0 0 1 6 6v68a6 6 0 0 1-6 6H16z'),
      pale('M26 10v80', 3),
      pale('M34 24h40M34 36h40M34 48h40M34 60h40M34 72h40', 3),
      ink('M58 18v60', 2.5),
      brass('M62 36h10M62 60h10', 4),
    ],
    // forbidden to marry
    'doc.forbid': [
      ink('M22 8h56v84H22z'),
      pale('M30 20h40M30 30h40M30 40h28', 3.5),
      brass('M50 52c-8-10-22-2-14 10l14 16 14-16c8-12-6-20-14-10z'),
      ink('M38 50l24 30', 5),
    ],
    'doc.ringback': [
      ink('M10 30h80v50H10z'),
      pale('M12 32l38 26 38-26', 3),
      brass('M38 22a12 12 0 1 0 24 0 12 12 0 0 0-24 0z', 5),
      pale('M50 4l6 6-6 6-6-6z'),
    ],
    'doc.tickets': [
      ink('M26 14h58v12a6 6 0 0 0 0 12v12H26V38a6 6 0 0 0 0-12z'),
      pale('M68 18v4M68 28v4M68 38v4M68 46v2', 2.5),
      pale('M34 26h24M34 36h18', 3),
      ink('M12 48h58v12a6 6 0 0 0 0 12v12H12V72a6 6 0 0 0 0-12z'),
      pale('M12 48h58v12a6 6 0 0 0 0 12v12H12V72a6 6 0 0 0 0-12z', 2),
      brass('M22 60h26M22 72h18', 3.5),
      pale('M56 54v4M56 64v4M56 74v4', 2.5),
    ],
    'doc.folded': [
      ink('M18 16h64v68H18z'),
      pale('M18 38h64M18 62h64M50 16v68', 2),
      pale('M26 26h16M26 48h18M58 48h16M26 72h14', 3),
      brass('M60 22c-4-5-11-1-7 5l7 8 7-8c4-6-3-10-7-5z'),
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
    // ---- on the best of terms ----
    'doc.thanks': [
      ink('M18 10h64v80H18z'),
      pale('M28 24h44M28 36h44M28 48h30', 3),
      brass('M62 60c-6-8-18 0-12 9l12 13 12-13c6-9-6-17-12-9z'),
    ],
    'doc.fond': [
      ink('M14 26h72v50H14z'),
      pale('M24 40h40M24 52h52M24 64h28', 3),
      brass('M70 18l6 12 12 2-9 9 2 12-11-6-11 6 2-12-9-9 12-2z'),
    ],
    // ---- the second killing ----
    body: [
      ink('M8 78h84v8H8z'),
      ink('M14 78c2-14 10-22 24-24l26-2c14 0 22 8 24 26z'),
      ink('M24 40a11 11 0 1 0 22 0 11 11 0 0 0-22 0z'),
      pale('M40 62l40-4', 3),
      brass('M60 30l4 8M70 26l2 9M80 30l-2 8', 3),
    ],
    footprint: [
      ink('M38 10c12-2 22 8 22 24 0 12-4 20-6 30H34c0-12-8-20-8-32 0-12 4-20 12-22z'),
      ink('M34 70h22c2 10-2 20-11 20s-13-10-11-20z'),
      pale('M36 64h20', 2.5),
    ],
    // ---- the way through the walls ----
    passage: [
      ink('M10 12h80v78H10z'),
      pale('M18 20h30v62H18zM52 20h30v62H52z', 2.5),
      ink('M52 20l24 10v62l-24-10z'),
      brass('M70 58a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'),
      pale('M56 30l16 7M56 40l16 6', 2),
    ],
    // ---- what the murderer's friend left behind ----
    bribe: [
      ink('M12 34h76v48H12z'),
      pale('M12 34l38 28 38-28', 3),
      brass('M30 18h40v22l-20 14-20-14z'),
      ink('M50 24a8 8 0 1 0 0 16 8 8 0 0 0 0-16z'),
      pale('M22 72h24', 3),
    ],
    bare: [
      ink('M10 78h80v8H10z'),
      pale('M26 70c-4-14 2-26 12-30 4-12 20-12 24 0 10 4 16 16 12 30', 3),
      pale('M40 40l-6-10M62 40l6-10', 3),
      brass('M44 58h12', 3),
    ],
    misc: [
      ink('M20 30h60v56H20z'),
      ink('M14 22h72v10H14z'),
      pale('M42 50h16', 4),
    ],
  },

  documents: {
    'a letter in his lordship’s hand, thanking them warmly': 'doc.thanks',
    'a note from his lordship: “I could not do without you”': 'doc.fond',
    'an unsent letter, furious in tone': 'doc.hostile',
    'a photograph of his lordship, the face scratched out': 'doc.photograph',
    'a solicitor’s letter threatening suit against his lordship': 'doc.suit',
    'a diary, the pen pressed clean through the page': 'doc.diary',
    'a ledger page of debts, underlined twice in red': 'doc.indebted',
    'a sheaf of notes of hand, made out to his lordship': 'doc.notes',
    'a pleasant letter from his lordship, about nothing in particular': 'doc.pleasant',
    'a dinner invitation in his lordship’s hand, warmly worded': 'doc.dinner',
    'a curt note from his lordship, and nothing worse than curt': 'doc.curt',
    'a letter from his lordship declining a favour, politely enough': 'doc.declined',
    'a pawnbroker’s ticket for the family silver': 'doc.ticket',
    'a banker’s final demand, unopened': 'doc.demand',
    'a bundle of returned love-letters, tied with black ribbon': 'doc.jilted',
    'an engagement ring, returned in its box': 'doc.ring',
    'a locket with the portrait prised out': 'doc.locket',
    'a wedding invitation, torn across': 'doc.invitation',
    'a new will, drawn up and not yet signed': 'doc.will',
    'a draft of a will, one name struck through': 'doc.struck',
    'a solicitor’s card: “Monday, eleven, to sign”': 'doc.card',
    'his lordship’s letter to his solicitor, asking for a new will': 'doc.quill',
    'a will, signed and witnessed this very week': 'doc.signed',
    'a codicil in a fresh hand, the ink barely dry': 'doc.codicil',
    'a life-assurance policy, lately doubled': 'doc.policy',
    'a deed-box, newly labelled and newly locked': 'doc.deedbox',
    'a letter of dismissal, without a character': 'doc.dismissal',
    'a notice to quit by quarter-day': 'doc.quit',
    'an advertisement for the place, already sent to the paper': 'doc.advert',
    'an envelope of money, marked “in full and final”': 'doc.wages',
    'an enquiry agent’s report, addressed to his lordship': 'doc.report',
    'a newspaper cutting, one name ringed in ink': 'doc.cutting',
    'a telegram: “PROOF IN HAND STOP WILL SPEAK TUESDAY”': 'doc.telegram',
    'a letter in his lordship’s hand, beginning “I know”': 'doc.iknow',
    'articles of partnership, one clause underlined': 'doc.articles',
    'a letter dissolving the partnership, ready for the post': 'doc.dissolve',
    'a share certificate, made over without consent': 'doc.share',
    'the firm’s account book, with a second set of figures': 'doc.accounts',
    'a letter forbidding the match, in his lordship’s hand': 'doc.forbid',
    'a ring, sent back by his lordship’s order': 'doc.ringback',
    'two railway tickets to Gretna Green': 'doc.tickets',
    'a note, much folded: “Father will never consent”': 'doc.folded',
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
    sign: '#3f9a78',
    passage: '#2f8f9a',
    flavor: '#6c787f',
  },
}

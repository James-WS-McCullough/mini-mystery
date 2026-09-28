// The floor plan of the house, drawn afresh for every case.
//
// Pure and deterministic: the same seed always builds the same manor. The
// plan is presentation only — the engine knows rooms by id and nothing of
// where they lie — so it draws from its own random stream and can never
// perturb the mystery.
//
// The house is a long gallery with a row of rooms on the garden side and a
// row on the entrance side, each room as deep as it pleases (so the outline
// steps in and out like a real country house), an entrance hall let into the
// front, sometimes a pavilion closing one end of the gallery, and any outdoor
// room laid against the garden front.

import { Rng } from '../engine/rng'
import type { RoomId } from '../engine/types'

export type RoomKind = 'indoor' | 'outdoor' | 'glasshouse'

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface MapDoor {
  x: number
  y: number
  /** Orientation of the wall the door is let into. */
  wall: 'h' | 'v'
  size: number
}

export interface MapRoom extends Rect {
  id: RoomId
  kind: RoomKind
  door: MapDoor
}

export interface ManorMap {
  width: number
  height: number
  rooms: MapRoom[]
  /** The gallery and the entrance hall: floor that belongs to no room. */
  halls: Rect[]
  /** The front door. */
  entrance: MapDoor
}

export interface RoomSpec {
  id: RoomId
  kind?: RoomKind
}

const SPAN = 120
const GALLERY = 11
const VESTIBULE = 16
const PAVILION = 30
const TERRACE = 14
const MIN_ROOM = 22
const DOOR = 7
const MARGIN = 6

/** Split `total` into `n` random lengths, none shorter than MIN_ROOM. */
function partition(rng: Rng, total: number, n: number): number[] {
  const weights = Array.from({ length: n }, () => 1 + rng.next() * 0.9)
  const sum = weights.reduce((a, b) => a + b, 0)
  const spare = total - MIN_ROOM * n
  return weights.map((w) => MIN_ROOM + (spare * w) / sum)
}

function between(rng: Rng, lo: number, hi: number): number {
  return lo + rng.next() * (hi - lo)
}

export function generateManor(seed: number, specs: readonly RoomSpec[]): ManorMap {
  const rng = new Rng(`${seed}:manor`)
  const kindOf = (s: RoomSpec): RoomKind => s.kind ?? 'indoor'
  const outdoor = specs.filter((s) => kindOf(s) === 'outdoor')
  let indoor = rng.shuffle(specs.filter((s) => kindOf(s) !== 'outdoor'))

  // A pavilion at one end of the gallery — the glasshouse, if the house has one.
  let pavilion: { spec: RoomSpec; side: 'left' | 'right' } | null = null
  if (indoor.length >= 5 && rng.chance(0.6)) {
    const spec = indoor.find((s) => kindOf(s) === 'glasshouse') ?? indoor[0]
    pavilion = { spec, side: rng.chance(0.5) ? 'left' : 'right' }
    indoor = indoor.filter((s) => s !== spec)
  }

  const nGarden = rng.chance(0.5) ? Math.ceil(indoor.length / 2) : Math.floor(indoor.length / 2)
  const garden = indoor.slice(0, Math.max(1, nGarden))
  const front = indoor.slice(garden.length)

  const gardenDepths = garden.map(() => between(rng, 26, 40))
  const galleryY = Math.max(...gardenDepths)
  const frontY = galleryY + GALLERY

  const rooms: MapRoom[] = []
  const halls: Rect[] = [{ x: 0, y: galleryY, w: SPAN, h: GALLERY }]

  // The garden side.
  const gardenWidths = partition(rng, SPAN, garden.length)
  let x = 0
  garden.forEach((spec, i) => {
    const w = gardenWidths[i]
    const h = gardenDepths[i]
    rooms.push({
      id: spec.id,
      kind: kindOf(spec),
      x,
      y: galleryY - h,
      w,
      h,
      door: { x: x + w * between(rng, 0.3, 0.7), y: galleryY, wall: 'h', size: DOOR },
    })
    x += w
  })

  // The entrance side, with the hall let in between two of its rooms.
  const hallSlot = front.length <= 1 ? front.length : 1 + rng.int(front.length - 1)
  const frontWidths = partition(rng, SPAN - VESTIBULE, Math.max(1, front.length))
  const frontDepths = front.map(() => between(rng, 24, 36))
  const hallDepth = Math.min(...frontDepths, 30) * between(rng, 0.7, 0.9)
  let entrance: MapDoor = { x: SPAN / 2, y: frontY + hallDepth, wall: 'h', size: DOOR + 2 }
  x = 0
  for (let slot = 0; slot <= front.length; slot++) {
    if (slot === hallSlot) {
      halls.push({ x, y: frontY, w: VESTIBULE, h: hallDepth })
      entrance = { x: x + VESTIBULE / 2, y: frontY + hallDepth, wall: 'h', size: DOOR + 2 }
      x += VESTIBULE
    }
    if (slot === front.length) break
    const spec = front[slot]
    const w = frontWidths[slot]
    rooms.push({
      id: spec.id,
      kind: kindOf(spec),
      x,
      y: frontY,
      w,
      h: frontDepths[slot],
      door: { x: x + w * between(rng, 0.3, 0.7), y: frontY, wall: 'h', size: DOOR },
    })
    x += w
  }

  if (pavilion) {
    const wing = between(rng, 11, 17)
    const left = pavilion.side === 'left'
    rooms.push({
      id: pavilion.spec.id,
      kind: kindOf(pavilion.spec),
      x: left ? -PAVILION : SPAN,
      y: galleryY - wing,
      w: PAVILION,
      h: GALLERY + wing * 2,
      door: { x: left ? 0 : SPAN, y: galleryY + GALLERY / 2, wall: 'v', size: DOOR },
    })
  }

  // Outdoor rooms lie against the garden front, each along one room's wall.
  const hosts = rng.shuffle(rooms.filter((r) => garden.some((g) => g.id === r.id)))
  outdoor.forEach((spec, i) => {
    const host = hosts[i % hosts.length]
    const stack = Math.floor(i / hosts.length)
    rooms.push({
      id: spec.id,
      kind: 'outdoor',
      x: host.x,
      y: host.y - TERRACE * (stack + 1),
      w: host.w,
      h: TERRACE,
      door: { x: host.x + host.w / 2, y: host.y - TERRACE * stack, wall: 'h', size: DOOR + 3 },
    })
  })

  // Settle the plan into its sheet, with a margin of grounds all round.
  const all: Rect[] = [...rooms, ...halls]
  const minX = Math.min(...all.map((r) => r.x))
  const minY = Math.min(...all.map((r) => r.y))
  const maxX = Math.max(...all.map((r) => r.x + r.w))
  const maxY = Math.max(...all.map((r) => r.y + r.h))
  const dx = MARGIN - minX
  const dy = MARGIN - minY
  const round = (n: number) => Math.round(n * 100) / 100
  const moveRect = <T extends Rect>(r: T): T => ({
    ...r,
    x: round(r.x + dx),
    y: round(r.y + dy),
    w: round(r.w),
    h: round(r.h),
  })
  const moveDoor = (d: MapDoor): MapDoor => ({ ...d, x: round(d.x + dx), y: round(d.y + dy) })

  return {
    width: round(maxX - minX + MARGIN * 2),
    height: round(maxY - minY + MARGIN * 2 + 4),
    rooms: rooms.map((r) => ({ ...moveRect(r), door: moveDoor(r.door) })),
    halls: halls.map(moveRect),
    entrance: moveDoor(entrance),
  }
}

/** The same house turned on its side, for tall, narrow screens. */
export function transpose(map: ManorMap): ManorMap {
  const rect = <T extends Rect>(r: T): T => ({ ...r, x: r.y, y: r.x, w: r.h, h: r.w })
  const door = (d: MapDoor): MapDoor => ({
    ...d,
    x: d.y,
    y: d.x,
    wall: d.wall === 'h' ? 'v' : 'h',
  })
  return {
    width: map.height,
    height: map.width,
    rooms: map.rooms.map((r) => ({ ...rect(r), door: door(r.door) })),
    halls: map.halls.map(rect),
    entrance: door(map.entrance),
  }
}

// The floor plan of the house, drawn afresh for every case.
//
// Pure and deterministic: the same seed always builds the same manor. The
// plan is presentation only — the engine knows rooms by id and nothing of
// where they lie — so it draws from its own random stream and can never
// perturb the mystery.
//
// A house is built in two steps. First a STYLE lays down the passages — a
// long gallery, an L, a courtyard, a cross, a pair of wings — and says which
// stretches of passage wall may have rooms built against them (the strips).
// Then the rooms are dealt along those strips, each as wide and as deep as
// it pleases, so two houses of the same style still differ in every wall.

import { Rng } from '../engine/rng'
import type { RoomId } from '../engine/types'

export type RoomKind = 'indoor' | 'outdoor' | 'glasshouse'
export type ManorStyle = 'gallery' | 'ell' | 'courtyard' | 'cross' | 'wings'

export const MANOR_STYLES: readonly ManorStyle[] = ['gallery', 'ell', 'courtyard', 'cross', 'wings']

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
  style: ManorStyle
  width: number
  height: number
  rooms: MapRoom[]
  /** Passages and the entrance hall: floor that belongs to no room. */
  halls: Rect[]
  /** The front door. */
  entrance: MapDoor
}

export interface RoomSpec {
  id: RoomId
  kind?: RoomKind
}

/** Width of a passage. */
const G = 11
const VESTIBULE = 16
const TERRACE = 19
const MIN_ROOM = 22
const DOOR = 7
const MARGIN = 6

/**
 * A stretch of passage wall that rooms may be built against. `along` is the
 * axis the wall runs on, `at` its position on the other axis, and `out` the
 * side the rooms stand on.
 */
interface Strip {
  along: 'x' | 'y'
  at: number
  from: number
  to: number
  out: 1 | -1
  depth: [number, number]
  /** The entrance hall may be let into this strip. */
  vestibule?: boolean
  /** Holds exactly this many rooms, whatever the others get (a pavilion). */
  fixed?: number
  /** The part of the wall that actually has passage behind it. */
  doorSpan?: [number, number]
  prefer?: RoomKind
}

interface Blueprint {
  halls: Rect[]
  strips: Strip[]
  /** Passage ends that reach the outside wall: places for a front door. */
  ends: MapDoor[]
  /** A place already set aside for the first outdoor room. */
  court?: { rect: Rect; door: MapDoor }
}

function between(rng: Rng, lo: number, hi: number): number {
  return lo + rng.next() * (hi - lo)
}

const EPS = 0.01

function overlaps(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w - EPS &&
    b.x < a.x + a.w - EPS &&
    a.y < b.y + b.h - EPS &&
    b.y < a.y + a.h - EPS
  )
}

// ---------- the styles ----------

/** One long gallery, rooms down both sides, perhaps a pavilion closing an end. */
function gallery(rng: Rng, k: number): Blueprint {
  const span = between(rng, 108, 124) * k
  const strips: Strip[] = [
    { along: 'x', at: 0, from: 0, to: span, out: -1, depth: [26, 40] },
    { along: 'x', at: G, from: 0, to: span, out: 1, depth: [24, 36], vestibule: true },
  ]
  const ends: MapDoor[] = []
  const closed = rng.chance(0.6) ? (rng.chance(0.5) ? 'left' : 'right') : null
  if (closed) {
    const wing = between(rng, 11, 17)
    strips.push({
      along: 'y',
      at: closed === 'left' ? 0 : span,
      from: -wing,
      to: G + wing,
      out: closed === 'left' ? -1 : 1,
      depth: [28, 32],
      fixed: 1,
      doorSpan: [0, G],
      prefer: 'glasshouse',
    })
  }
  if (closed !== 'left') ends.push({ x: 0, y: G / 2, wall: 'v', size: DOOR + 2 })
  if (closed !== 'right') ends.push({ x: span, y: G / 2, wall: 'v', size: DOOR + 2 })
  return { halls: [{ x: 0, y: 0, w: span, h: G }], strips, ends }
}

/** Two passages meeting at a corner, rooms inside the angle and out. */
function ell(rng: Rng, k: number): Blueprint {
  const run = Math.max(70, between(rng, 72, 90) * k)
  const drop = between(rng, 46, 60) * k
  const inner = 32
  return {
    halls: [
      { x: 0, y: 0, w: run, h: G },
      { x: run - G, y: G, w: G, h: drop },
    ],
    strips: [
      { along: 'x', at: 0, from: 0, to: run, out: -1, depth: [26, 38] },
      { along: 'x', at: G, from: 0, to: run - G - inner, out: 1, depth: [24, 34] },
      { along: 'y', at: run - G, from: G, to: G + drop, out: -1, depth: [24, inner] },
      { along: 'y', at: run, from: 0, to: G + drop, out: 1, depth: [24, 36] },
    ],
    ends: [
      { x: 0, y: G / 2, wall: 'v', size: DOOR + 2 },
      { x: run - G / 2, y: G + drop, wall: 'h', size: DOOR + 2 },
    ],
  }
}

/** Passages round a courtyard — closed on all four sides, or open on one. */
function courtyard(rng: Rng, k: number): Blueprint {
  const ring = rng.chance(0.5)
  const w = Math.max(50, between(rng, 66, 80) * k)
  const h = Math.max(46, (ring ? between(rng, 54, 64) : between(rng, 68, 78)) * k)
  const halls: Rect[] = [
    { x: 0, y: h - G, w, h: G },
    { x: 0, y: 0, w: G, h: h - G },
    { x: w - G, y: 0, w: G, h: h - G },
  ]
  const strips: Strip[] = [
    { along: 'x', at: h, from: 0, to: w, out: 1, depth: [24, 34], vestibule: true },
    { along: 'y', at: 0, from: 0, to: h, out: -1, depth: [24, 34] },
    { along: 'y', at: w, from: 0, to: h, out: 1, depth: [24, 34] },
  ]
  const ends: MapDoor[] = []
  if (ring) {
    halls.push({ x: G, y: 0, w: w - G * 2, h: G })
    strips.push({ along: 'x', at: 0, from: 0, to: w, out: -1, depth: [24, 36] })
  } else {
    ends.push({ x: G / 2, y: 0, wall: 'h', size: DOOR + 2 })
    ends.push({ x: w - G / 2, y: 0, wall: 'h', size: DOOR + 2 })
  }
  const top = ring ? G : 0
  return {
    halls,
    strips,
    ends,
    court: {
      rect: { x: G, y: top, w: w - G * 2, h: h - G - top },
      door: { x: w / 2, y: h - G, wall: 'h', size: DOOR + 3 },
    },
  }
}

/** Two passages crossing, a block of rooms in each of the four angles. */
function cross(rng: Rng, k: number): Blueprint {
  // At most one block turns to face the other passage, as a single great room.
  const turned = rng.chance(0.5) ? rng.int(4) : -1
  const blocks = [0, 1, 2, 3].map((i) => ({
    w: Math.max(34, between(rng, 45, 56) * k),
    h: between(rng, 28, 38),
    sx: (i % 2 === 0 ? -1 : 1) as 1 | -1,
    sy: (i < 2 ? -1 : 1) as 1 | -1,
    turned: i === turned,
  }))
  const reach = (sx: number, sy: number, key: 'w' | 'h') =>
    Math.max(
      ...blocks.filter((b) => (sx !== 0 ? b.sx === sx : b.sy === sy)).map((b) => b[key]),
    )
  const left = reach(-1, 0, 'w')
  const right = reach(1, 0, 'w')
  const up = reach(0, -1, 'h')
  const down = reach(0, 1, 'h')

  const strips = blocks.map<Strip>((b) => {
    if (b.turned) {
      return {
        along: 'y',
        at: b.sx === -1 ? 0 : G,
        from: b.sy === -1 ? -b.h : G,
        to: b.sy === -1 ? 0 : G + b.h,
        out: b.sx,
        depth: [b.w - 8, b.w],
      }
    }
    return {
      along: 'x',
      at: b.sy === -1 ? 0 : G,
      from: b.sx === -1 ? -b.w : G,
      to: b.sx === -1 ? 0 : G + b.w,
      out: b.sy,
      depth: [b.h - 8, b.h],
    }
  })

  const ends: MapDoor[] = [
    { x: -left, y: G / 2, wall: 'v', size: DOOR + 2 },
    { x: G + right, y: G / 2, wall: 'v', size: DOOR + 2 },
    { x: G / 2, y: G + down, wall: 'h', size: DOOR + 2 },
  ]
  return {
    halls: [
      { x: -left, y: 0, w: left + G + right, h: G },
      { x: 0, y: -up, w: G, h: up },
      { x: 0, y: G, w: G, h: down },
    ],
    strips,
    ends,
    // The fourth arm opens onto the garden.
    court: {
      rect: { x: G / 2 - 16, y: -up - TERRACE, w: 32, h: TERRACE },
      door: { x: G / 2, y: -up, wall: 'h', size: DOOR + 3 },
    },
  }
}

/** A short gallery between two long wings: the letter H. */
function wings(rng: Rng, k: number): Blueprint {
  const link = Math.max(40, between(rng, 46, 60) * k)
  const wing = Math.max(50, between(rng, 68, 80) * k)
  const gy = (wing - G) / 2 + between(rng, -8, 8)
  const far = G + link
  return {
    halls: [
      { x: 0, y: 0, w: G, h: wing },
      { x: far, y: 0, w: G, h: wing },
      { x: G, y: gy, w: link, h: G },
    ],
    strips: [
      { along: 'y', at: 0, from: 0, to: wing, out: -1, depth: [24, 34] },
      { along: 'y', at: far + G, from: 0, to: wing, out: 1, depth: [24, 34] },
      { along: 'x', at: gy, from: G, to: far, out: -1, depth: [18, Math.max(19, gy - 2)] },
      {
        along: 'x',
        at: gy + G,
        from: G,
        to: far,
        out: 1,
        depth: [18, Math.max(19, wing - gy - G - 2)],
        vestibule: true,
      },
    ],
    ends: [
      { x: G / 2, y: 0, wall: 'h', size: DOOR + 2 },
      { x: far + G / 2, y: 0, wall: 'h', size: DOOR + 2 },
      { x: G / 2, y: wing, wall: 'h', size: DOOR + 2 },
      { x: far + G / 2, y: wing, wall: 'h', size: DOOR + 2 },
    ],
  }
}

const BUILDERS: Record<ManorStyle, (rng: Rng, k: number) => Blueprint> = {
  gallery,
  ell,
  courtyard,
  cross,
  wings,
}

// ---------- dealing the rooms ----------

const lengthOf = (s: Strip) => s.to - s.from
const capacityOf = (s: Strip) =>
  s.fixed ?? Math.max(0, Math.floor((lengthOf(s) - (s.vestibule ? VESTIBULE : 0)) / MIN_ROOM))

/** How many rooms each strip gets: keep them all of a comfortable width. */
function allocate(rng: Rng, strips: Strip[], rooms: number): number[] {
  const counts = strips.map((s) => s.fixed ?? 0)
  const taste = strips.map(() => between(rng, 0.75, 1.25))
  let left = rooms - counts.reduce((a, b) => a + b, 0)
  while (left > 0) {
    let best = -1
    let bestRoom = 0
    strips.forEach((s, i) => {
      if (s.fixed !== undefined || counts[i] >= capacityOf(s)) return
      const room = (lengthOf(s) * taste[i]) / (counts[i] + 1)
      if (room > bestRoom) {
        best = i
        bestRoom = room
      }
    })
    if (best < 0) throw new Error('the house has no wall left to build against')
    counts[best]++
    left--
  }
  return counts
}

/** Split `total` into `n` random lengths, none shorter than MIN_ROOM. */
function partition(rng: Rng, total: number, n: number): number[] {
  const weights = Array.from({ length: n }, () => 1 + rng.next() * 0.9)
  const sum = weights.reduce((a, b) => a + b, 0)
  const spare = Math.max(0, total - MIN_ROOM * n)
  const floor = Math.min(MIN_ROOM, total / n)
  return weights.map((w) => floor + (spare * w) / sum)
}

function slotRect(s: Strip, a: number, b: number, depth: number): Rect {
  const lo = s.out === 1 ? s.at : s.at - depth
  return s.along === 'x'
    ? { x: a, y: lo, w: b - a, h: depth }
    : { x: lo, y: a, w: depth, h: b - a }
}

function slotDoor(s: Strip, pos: number, size: number): MapDoor {
  return s.along === 'x'
    ? { x: pos, y: s.at, wall: 'h', size }
    : { x: s.at, y: pos, wall: 'v', size }
}

/** The far wall of a room from its passage: where a terrace may be laid. */
function beyond(s: Strip, room: Rect): { rect: Rect; door: MapDoor } {
  const a = s.along === 'x' ? room.x : room.y
  const b = a + (s.along === 'x' ? room.w : room.h)
  const depth = s.along === 'x' ? room.h : room.w
  const edge = s.at + s.out * depth
  const rect = slotRect({ ...s, at: edge }, a, b, TERRACE)
  return { rect, door: slotDoor({ ...s, at: edge }, (a + b) / 2, DOOR + 3) }
}

export function generateManor(
  seed: number,
  specs: readonly RoomSpec[],
  /** Force a style (for tests and tools); by default the case number chooses. */
  force?: ManorStyle,
): ManorMap {
  const rng = new Rng(`${seed}:manor`)
  const kindOf = (s: RoomSpec): RoomKind => s.kind ?? 'indoor'
  const outdoor = specs.filter((s) => kindOf(s) === 'outdoor')
  const indoor = rng.shuffle(specs.filter((s) => kindOf(s) !== 'outdoor'))

  const picked = rng.pick(MANOR_STYLES)
  const style = force ?? picked

  // The house is built to the size of the household: smaller for a few
  // rooms, and let out until there is wall enough for all of them.
  let k = Math.min(1, Math.max(0.6, indoor.length / 7))
  let plan = BUILDERS[style](new Rng(`${seed}:manor:${style}`), k)
  const roomFor = (p: Blueprint) => p.strips.reduce((n, s) => n + capacityOf(s), 0)
  while (roomFor(plan) < indoor.length) {
    k *= 1.12
    plan = BUILDERS[style](new Rng(`${seed}:manor:${style}`), k)
  }
  const counts = allocate(rng, plan.strips, indoor.length)

  // Strips that ask for a kind of room get first pick of the pack.
  const pool = [...indoor]
  const hands: RoomSpec[][] = plan.strips.map(() => [])
  plan.strips.forEach((s, i) => {
    if (!s.prefer) return
    for (let n = 0; n < counts[i]; n++) {
      const at = pool.findIndex((r) => kindOf(r) === s.prefer)
      hands[i].push(...pool.splice(at < 0 ? 0 : at, 1))
    }
  })
  plan.strips.forEach((_s, i) => {
    while (hands[i].length < counts[i]) hands[i].push(pool.shift()!)
  })

  // The front door: at the end of a passage, or through a hall of its own.
  const hallStrips = plan.strips.flatMap((s, i) => (s.vestibule ? [i] : []))
  const byHall = hallStrips.length > 0 && (plan.ends.length === 0 || rng.chance(0.5))
  const hallStrip = byHall ? rng.pick(hallStrips) : -1
  let entrance: MapDoor = byHall ? plan.ends[0] : rng.pick(plan.ends)

  const rooms: MapRoom[] = []
  const halls: Rect[] = [...plan.halls]
  const hosts: { strip: Strip; room: MapRoom }[] = []

  plan.strips.forEach((s, i) => {
    const hand = hands[i]
    const withHall = i === hallStrip
    if (hand.length === 0 && !withHall) return
    const widths =
      hand.length > 0
        ? partition(rng, lengthOf(s) - (withHall ? VESTIBULE : 0), hand.length)
        : []
    const depths = hand.map(() => between(rng, s.depth[0], s.depth[1]))
    const hallSlot = !withHall
      ? -1
      : hand.length <= 1
        ? rng.int(hand.length + 1)
        : 1 + rng.int(hand.length - 1)

    // An empty strip holds the hall alone, somewhere along its length.
    let pos = hand.length === 0 ? between(rng, s.from, s.to - VESTIBULE) : s.from
    for (let slot = 0; slot <= hand.length; slot++) {
      if (slot === hallSlot) {
        const depth = Math.min(...depths, 30) * between(rng, 0.7, 0.9)
        halls.push(slotRect(s, pos, pos + VESTIBULE, depth))
        entrance = slotDoor({ ...s, at: s.at + s.out * depth }, pos + VESTIBULE / 2, DOOR + 2)
        pos += VESTIBULE
      }
      if (slot === hand.length) break
      const end = pos + widths[slot]
      const span = s.doorSpan ?? [s.from, s.to]
      const lo = Math.max(pos, span[0]) + DOOR / 2 + 1
      const hi = Math.min(end, span[1]) - DOOR / 2 - 1
      const room: MapRoom = {
        id: hand[slot].id,
        kind: kindOf(hand[slot]),
        ...slotRect(s, pos, end, depths[slot]),
        door: slotDoor(s, lo < hi ? between(rng, lo, hi) : (lo + hi) / 2, DOOR),
      }
      rooms.push(room)
      hosts.push({ strip: s, room })
      pos = end
    }
  })

  // Outdoor rooms: the courtyard if the house has one, else against a far wall.
  const free = rng.shuffle(hosts)
  outdoor.forEach((spec, i) => {
    const taken: Rect[] = [...rooms, ...halls]
    const clear = (r: Rect) => !taken.some((t) => overlaps(t, r))
    let place = i === 0 && plan.court && clear(plan.court.rect) ? plan.court : null
    while (!place && free.length > 0) {
      const host = free.shift()!
      const spot = beyond(host.strip, host.room)
      if (clear(spot.rect)) place = spot
    }
    if (!place) throw new Error('the house has nowhere to lay a terrace')
    rooms.push({ id: spec.id, kind: 'outdoor', ...place.rect, door: place.door })
  })

  // Turn the house about, then settle it into its sheet with grounds all round.
  const flipX = rng.chance(0.5)
  const flipY = rng.chance(0.5)
  const all: Rect[] = [...rooms, ...halls]
  const minX = Math.min(...all.map((r) => r.x))
  const minY = Math.min(...all.map((r) => r.y))
  const maxX = Math.max(...all.map((r) => r.x + r.w))
  const maxY = Math.max(...all.map((r) => r.y + r.h))
  const round = (n: number) => Math.round(n * 100) / 100
  const px = (x: number) => round(MARGIN + (flipX ? maxX - x : x - minX))
  const py = (y: number) => round(MARGIN + (flipY ? maxY - y : y - minY))
  const moveRect = <T extends Rect>(r: T): T => ({
    ...r,
    x: px(flipX ? r.x + r.w : r.x),
    y: py(flipY ? r.y + r.h : r.y),
    w: round(r.w),
    h: round(r.h),
  })
  const moveDoor = (d: MapDoor): MapDoor => ({ ...d, x: px(d.x), y: py(d.y) })

  return {
    style,
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
    ...map,
    width: map.height,
    height: map.width,
    rooms: map.rooms.map((r) => ({ ...rect(r), door: door(r.door) })),
    halls: map.halls.map(rect),
    entrance: door(map.entrance),
  }
}

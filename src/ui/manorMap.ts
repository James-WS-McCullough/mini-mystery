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
export type ManorStyle =
  | 'gallery'
  | 'ell'
  | 'courtyard'
  | 'cross'
  | 'wings'
  // Not houses at all: a train of two carriages, a ship, a village street.
  | 'train'
  | 'boat'
  | 'village'

export const MANOR_STYLES: readonly ManorStyle[] = [
  'gallery',
  'ell',
  'courtyard',
  'cross',
  'wings',
  'train',
  'boat',
  'village',
]

/** What the plan is a plan of: it sets the ground it is drawn on. */
export type Ground = 'grounds' | 'track' | 'water' | 'fields'
export const GROUND_OF: Record<ManorStyle, Ground> = {
  gallery: 'grounds',
  ell: 'grounds',
  courtyard: 'grounds',
  cross: 'grounds',
  wings: 'grounds',
  train: 'track',
  boat: 'water',
  village: 'fields',
}

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
  /** What the plan stands on: grounds, a railway, the sea, fields. */
  ground: Ground
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
  /** Fixed at one end of the plan, where the plan has ends: the engine, the guard's van. */
  end?: 'front' | 'back'
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
  /** Rooms stand apart, this much clear on either side: the houses of a street. */
  detached?: number
  /** This strip begins, or ends, with the room the specs mark so. */
  head?: 'front' | 'back'
  tail?: 'front' | 'back'
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

/**
 * A train of two carriages, drawn one above the other: each a corridor along
 * the bottom with its compartments above it, the same way round, so that the
 * corridor runs the whole length of the train. The engine is at the front of
 * the first, the guard's van at the back of the second; the coupling between
 * them is drawn, not walked.
 */
function train(rng: Rng, k: number): Blueprint {
  const span = Math.max(80, between(rng, 96, 112) * k)
  // Room between the carriages for each to be framed and named on its own.
  const gap = 22
  const lower = G + gap + 27
  return {
    halls: [
      { x: 0, y: 0, w: span, h: G },
      { x: 0, y: lower, w: span, h: G },
    ],
    strips: [
      { along: 'x', at: 0, from: 0, to: span, out: -1, depth: [22, 27], head: 'front' },
      { along: 'x', at: lower, from: 0, to: span, out: -1, depth: [22, 27], tail: 'back' },
    ],
    ends: [{ x: 0, y: G / 2, wall: 'v', size: DOOR + 2 }],
  }
}

/** A ship: one long alleyway with the cabins and saloons to either side, and the decks at the ends. */
function boat(rng: Rng, k: number): Blueprint {
  const span = Math.max(84, between(rng, 100, 118) * k)
  return {
    halls: [{ x: 0, y: 0, w: span, h: G }],
    strips: [
      { along: 'x', at: 0, from: 0, to: span, out: -1, depth: [24, 32] },
      { along: 'x', at: G, from: 0, to: span, out: 1, depth: [24, 32] },
    ],
    ends: [{ x: 0, y: G / 2, wall: 'v', size: DOOR + 2 }],
    // The stern, and the promenade deck across it.
    court: {
      rect: { x: span, y: -18, w: TERRACE + 4, h: G + 36 },
      door: { x: span, y: G / 2, wall: 'v', size: DOOR + 3 },
    },
  }
}

/** A village: houses standing apart along the street and down a lane, and the green at the end of the lane. */
function village(rng: Rng, k: number): Blueprint {
  const street = Math.max(90, between(rng, 110, 130) * k)
  const lane = Math.max(64, between(rng, 72, 86) * k)
  const laneAt = street * between(rng, 0.45, 0.6)
  const gap = 5
  return {
    halls: [
      { x: 0, y: 0, w: street, h: G + 2 },
      { x: laneAt, y: G + 2, w: G, h: lane },
    ],
    strips: [
      { along: 'x', at: 0, from: 0, to: street, out: -1, depth: [22, 30], detached: gap },
      { along: 'x', at: G + 2, from: 0, to: laneAt - 2, out: 1, depth: [22, 30], detached: gap },
      { along: 'x', at: G + 2, from: laneAt + G + 2, to: street, out: 1, depth: [22, 30], detached: gap },
      // (Down the lane, past the corner house on the street.)
      { along: 'y', at: laneAt + G, from: G + 2 + 32, to: G + 2 + lane, out: 1, depth: [22, 28], detached: gap },
    ],
    ends: [
      { x: 0, y: (G + 2) / 2, wall: 'v', size: DOOR + 2 },
      { x: street, y: (G + 2) / 2, wall: 'v', size: DOOR + 2 },
    ],
    // The green, at the bottom of the lane.
    court: {
      rect: { x: laneAt - 22, y: G + 2 + lane, w: 44 + G, h: TERRACE + 8 },
      door: { x: laneAt + G / 2, y: G + 2 + lane, wall: 'h', size: DOOR + 3 },
    },
  }
}

const BUILDERS: Record<ManorStyle, (rng: Rng, k: number) => Blueprint> = {
  gallery,
  ell,
  courtyard,
  cross,
  wings,
  train,
  boat,
  village,
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
  /** The styles the setting allows (all of them, if left out). */
  allowed?: readonly string[],
): ManorMap {
  const rng = new Rng(`${seed}:manor`)
  const kindOf = (s: RoomSpec): RoomKind => s.kind ?? 'indoor'
  const outdoor = specs.filter((s) => kindOf(s) === 'outdoor')
  const indoor = rng.shuffle(specs.filter((s) => kindOf(s) !== 'outdoor'))

  const choices = MANOR_STYLES.filter((s) => !allowed || allowed.includes(s))
  const picked = rng.pick(choices.length > 0 ? choices : MANOR_STYLES)
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
  // A strip that begins or ends with a particular room takes it now.
  plan.strips.forEach((s, i) => {
    for (const which of [s.head, s.tail]) {
      if (!which) continue
      const at = pool.findIndex((r) => r.end === which)
      if (at >= 0 && hands[i].length < counts[i]) hands[i].push(...pool.splice(at, 1))
    }
  })
  plan.strips.forEach((_s, i) => {
    while (hands[i].length < counts[i]) hands[i].push(pool.shift()!)
  })
  plan.strips.forEach((s, i) => {
    const first = s.head ? hands[i].findIndex((r) => r.end === s.head) : -1
    if (first > 0) hands[i].unshift(...hands[i].splice(first, 1))
    const last = s.tail ? hands[i].findIndex((r) => r.end === s.tail) : -1
    if (last >= 0 && last < hands[i].length - 1) hands[i].push(...hands[i].splice(last, 1))
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
      // A detached house stands clear of its neighbours on either side.
      const inset = s.detached ?? 0
      const span = s.doorSpan ?? [s.from, s.to]
      const lo = Math.max(pos + inset, span[0]) + DOOR / 2 + 1
      const hi = Math.min(end - inset, span[1]) - DOOR / 2 - 1
      const room: MapRoom = {
        id: hand[slot].id,
        kind: kindOf(hand[slot]),
        ...slotRect(s, pos + inset, end - inset, depths[slot]),
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
  // (A train is read like a page: the engine top left, the van bottom right,
  // and the corridor along the bottom of the compartments in both carriages.)
  const flipX = style !== 'train' && rng.chance(0.5)
  const flipY = style !== 'train' && rng.chance(0.5)
  const all: Rect[] = [...rooms, ...halls]
  const minX = Math.min(...all.map((r) => r.x))
  const minY = Math.min(...all.map((r) => r.y))
  const maxX = Math.max(...all.map((r) => r.x + r.w))
  const maxY = Math.max(...all.map((r) => r.y + r.h))
  const round = (n: number) => Math.round(n * 100) / 100
  // A ship wants water beyond her bow and stern, and a little either side.
  const padX = style === 'boat' ? 26 : style === 'train' ? 8 : 0
  const padY = style === 'boat' ? 6 : style === 'train' ? 6 : 0
  const px = (x: number) => round(MARGIN + padX + (flipX ? maxX - x : x - minX))
  const py = (y: number) => round(MARGIN + padY + (flipY ? maxY - y : y - minY))
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
    ground: GROUND_OF[style],
    width: round(maxX - minX + MARGIN * 2 + padX * 2),
    height: round(maxY - minY + MARGIN * 2 + 4 + padY * 2),
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

// ---------- the passages as one connected space ----------

/** Plans are rounded to two places, so edges that meet may differ by a hair. */
const TOL = 0.05

export interface Segment {
  x1: number
  y1: number
  x2: number
  y2: number
}

interface Edge {
  /** Horizontal edges lie at a fixed y and run along x; vertical ones the reverse. */
  horizontal: boolean
  at: number
  from: number
  to: number
}

function edgesOf(r: Rect): Edge[] {
  return [
    { horizontal: true, at: r.y, from: r.x, to: r.x + r.w },
    { horizontal: true, at: r.y + r.h, from: r.x, to: r.x + r.w },
    { horizontal: false, at: r.x, from: r.y, to: r.y + r.h },
    { horizontal: false, at: r.x + r.w, from: r.y, to: r.y + r.h },
  ]
}

/** The stretches along which two halls lie open to one another. */
function openings(a: Rect, b: Rect): Edge[] {
  const found: Edge[] = []
  for (const ea of edgesOf(a)) {
    for (const eb of edgesOf(b)) {
      if (ea.horizontal !== eb.horizontal || Math.abs(ea.at - eb.at) > TOL) continue
      const from = Math.max(ea.from, eb.from)
      const to = Math.min(ea.to, eb.to)
      if (to - from > TOL) found.push({ horizontal: ea.horizontal, at: ea.at, from, to })
    }
  }
  return found
}

/**
 * The walls of the passages taken together: every edge of every hall, less
 * the stretches where one hall opens into the next.
 */
export function passageWalls(halls: readonly Rect[]): Segment[] {
  const walls: Segment[] = []
  halls.forEach((hall, i) => {
    const gaps = halls.flatMap((other, j) => (i === j ? [] : openings(hall, other)))
    for (const edge of edgesOf(hall)) {
      const cuts = gaps
        .filter((g) => g.horizontal === edge.horizontal && Math.abs(g.at - edge.at) <= TOL)
        .sort((a, b) => a.from - b.from)
      let pos = edge.from
      const pieces: [number, number][] = []
      for (const cut of cuts) {
        if (cut.from - pos > TOL) pieces.push([pos, cut.from])
        pos = Math.max(pos, cut.to)
      }
      if (edge.to - pos > TOL) pieces.push([pos, edge.to])
      for (const [from, to] of pieces) {
        walls.push(
          edge.horizontal
            ? { x1: from, y1: edge.at, x2: to, y2: edge.at }
            : { x1: edge.at, y1: from, x2: edge.at, y2: to },
        )
      }
    }
  })
  return walls
}

/**
 * Can every passage be walked to from every other? Two halls join where they
 * lie open to one another for at least the width of a doorway.
 */
export function passagesConnected(halls: readonly Rect[]): boolean {
  if (halls.length === 0) return true
  const reached = new Set([0])
  const queue = [0]
  while (queue.length > 0) {
    const i = queue.pop()!
    halls.forEach((other, j) => {
      if (reached.has(j)) return
      if (openings(halls[i], other).some((o) => o.to - o.from >= DOOR - TOL)) {
        reached.add(j)
        queue.push(j)
      }
    })
  }
  return reached.size === halls.length
}

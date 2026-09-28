// The generated floor plan must always be a sound drawing, whatever style of
// house the case number chooses: every room on the sheet exactly once,
// nothing overlapping, and every door leading somewhere.

import { describe, expect, it } from 'vitest'
import { manor1920s } from '../../src/content/manor1920s'
import {
  MANOR_STYLES,
  generateManor,
  transpose,
  type ManorMap,
  type MapDoor,
  type Rect,
} from '../../src/ui/manorMap'

const SPECS = manor1920s.rooms.map((r) => ({ id: r.id, kind: r.kind }))
const EPS = 0.02

function overlaps(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w - EPS &&
    b.x < a.x + a.w - EPS &&
    a.y < b.y + b.h - EPS &&
    b.y < a.y + a.h - EPS
  )
}

/** Does this point of a wall lie on an edge of the rectangle? */
function touches(x: number, y: number, wall: MapDoor['wall'], r: Rect): boolean {
  if (wall === 'h') {
    const level = Math.abs(y - r.y) < EPS || Math.abs(y - (r.y + r.h)) < EPS
    return level && x >= r.x - EPS && x <= r.x + r.w + EPS
  }
  const level = Math.abs(x - r.x) < EPS || Math.abs(x - (r.x + r.w)) < EPS
  return level && y >= r.y - EPS && y <= r.y + r.h + EPS
}

/**
 * Does the whole width of the door lie along the edges of these rectangles?
 * (A wall may be backed by two lengths of passage meeting end to end.)
 */
function onEdge(d: MapDoor, ...rects: Rect[]): boolean {
  return [-0.5, -0.25, 0, 0.25, 0.5].every((t) => {
    const x = d.wall === 'h' ? d.x + t * d.size : d.x
    const y = d.wall === 'h' ? d.y : d.y + t * d.size
    return rects.some((r) => touches(x, y, d.wall, r))
  })
}

/** Is the point strictly inside the rectangle? */
function inside(x: number, y: number, r: Rect): boolean {
  return x > r.x + EPS && x < r.x + r.w - EPS && y > r.y + EPS && y < r.y + r.h - EPS
}

function checkPlan(map: ManorMap, label: string) {
  expect(map.rooms.map((r) => r.id).sort(), label).toEqual(SPECS.map((s) => s.id).sort())

  const solids: Rect[] = [...map.rooms, ...map.halls]
  for (let i = 0; i < solids.length; i++) {
    for (let j = i + 1; j < solids.length; j++) {
      expect(overlaps(solids[i], solids[j]), `${label}: rects ${i} and ${j} overlap`).toBe(false)
    }
  }

  for (const r of solids) {
    expect(r.x, label).toBeGreaterThanOrEqual(0)
    expect(r.y, label).toBeGreaterThanOrEqual(0)
    expect(r.x + r.w, label).toBeLessThanOrEqual(map.width + EPS)
    expect(r.y + r.h, label).toBeLessThanOrEqual(map.height + EPS)
  }

  for (const r of map.rooms) {
    expect(Math.min(r.w, r.h), `${label}: ${r.id} is too small to draw`).toBeGreaterThanOrEqual(11)
    expect(onEdge(r.door, r), `${label}: ${r.id} door is off its wall`).toBe(true)

    // A door leads into a passage — or, from the terrace, into a room.
    const others = r.kind === 'outdoor' ? solids.filter((s) => s !== r) : map.halls
    expect(onEdge(r.door, ...others), `${label}: ${r.id} door leads nowhere`).toBe(true)
  }

  // The front door opens from a passage onto the grounds.
  const e = map.entrance
  expect(onEdge(e, ...map.halls), `${label}: front door is on no hall`).toBe(true)
  const step = 0.5
  const sides: [number, number][] =
    e.wall === 'h'
      ? [
          [e.x, e.y - step],
          [e.x, e.y + step],
        ]
      : [
          [e.x - step, e.y],
          [e.x + step, e.y],
        ]
  const indoors = sides.filter(([x, y]) => solids.some((s) => inside(x, y, s)))
  expect(indoors.length, `${label}: front door does not reach the grounds`).toBe(1)
}

describe('generateManor', () => {
  it('draws a sound plan for every seed', () => {
    for (let seed = 1; seed <= 400; seed++) checkPlan(generateManor(seed, SPECS), `seed ${seed}`)
  })

  for (const style of MANOR_STYLES) {
    it(`draws a sound ${style} house every time`, () => {
      for (let seed = 1; seed <= 200; seed++) {
        const map = generateManor(seed, SPECS, style)
        expect(map.style).toBe(style)
        checkPlan(map, `${style} ${seed}`)
      }
    })
  }

  it('stays sound when turned on its side', () => {
    for (let seed = 1; seed <= 100; seed++) {
      checkPlan(transpose(generateManor(seed, SPECS)), `transposed ${seed}`)
    }
  })

  it('is the same house for the same case number', () => {
    expect(generateManor(7, SPECS)).toEqual(generateManor(7, SPECS))
  })

  it('builds a different house for different cases', () => {
    const plans = new Set<string>()
    for (let seed = 1; seed <= 40; seed++) plans.add(JSON.stringify(generateManor(seed, SPECS)))
    expect(plans.size).toBe(40)
  })

  it('deals every style of house, none of them rarely', () => {
    const seen = new Map<string, number>()
    for (let seed = 1; seed <= 500; seed++) {
      const { style } = generateManor(seed, SPECS)
      seen.set(style, (seen.get(style) ?? 0) + 1)
    }
    for (const style of MANOR_STYLES) {
      expect(seen.get(style) ?? 0, style).toBeGreaterThan(60)
    }
  })

  it('copes with a pack of only a few rooms, or of many', () => {
    const few = SPECS.slice(0, 4)
    const many = [
      ...SPECS,
      { id: 'gunroom' },
      { id: 'stillroom' },
      { id: 'lawn', kind: 'outdoor' as const },
    ]
    for (const style of MANOR_STYLES) {
      for (let seed = 1; seed <= 40; seed++) {
        expect(generateManor(seed, few, style).rooms).toHaveLength(few.length)
        expect(generateManor(seed, many, style).rooms).toHaveLength(many.length)
      }
    }
  })
})

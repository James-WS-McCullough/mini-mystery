// The generated floor plan must always be a sound drawing: every room on the
// sheet exactly once, nothing overlapping, every door on its own room's wall.

import { describe, expect, it } from 'vitest'
import { manor1920s } from '../../src/content/manor1920s'
import { generateManor, transpose, type ManorMap, type Rect } from '../../src/ui/manorMap'

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

function checkPlan(map: ManorMap) {
  expect(map.rooms.map((r) => r.id).sort()).toEqual(SPECS.map((s) => s.id).sort())

  const solids: Rect[] = [...map.rooms, ...map.halls]
  for (let i = 0; i < solids.length; i++) {
    for (let j = i + 1; j < solids.length; j++) {
      expect(overlaps(solids[i], solids[j]), `rects ${i} and ${j} overlap`).toBe(false)
    }
  }

  for (const r of solids) {
    expect(r.x).toBeGreaterThanOrEqual(0)
    expect(r.y).toBeGreaterThanOrEqual(0)
    expect(r.x + r.w).toBeLessThanOrEqual(map.width + EPS)
    expect(r.y + r.h).toBeLessThanOrEqual(map.height + EPS)
  }

  for (const r of map.rooms) {
    expect(Math.min(r.w, r.h), `${r.id} is too small to draw`).toBeGreaterThanOrEqual(11)
    const d = r.door
    if (d.wall === 'h') {
      const onEdge = Math.abs(d.y - r.y) < EPS || Math.abs(d.y - (r.y + r.h)) < EPS
      expect(onEdge, `${r.id} door is off its wall`).toBe(true)
      expect(d.x - d.size / 2).toBeGreaterThanOrEqual(r.x - EPS)
      expect(d.x + d.size / 2).toBeLessThanOrEqual(r.x + r.w + EPS)
    } else {
      const onEdge = Math.abs(d.x - r.x) < EPS || Math.abs(d.x - (r.x + r.w)) < EPS
      expect(onEdge, `${r.id} door is off its wall`).toBe(true)
      expect(d.y - d.size / 2).toBeGreaterThanOrEqual(r.y - EPS)
      expect(d.y + d.size / 2).toBeLessThanOrEqual(r.y + r.h + EPS)
    }
  }
}

describe('generateManor', () => {
  it('draws a sound plan for every seed', () => {
    for (let seed = 1; seed <= 300; seed++) checkPlan(generateManor(seed, SPECS))
  })

  it('stays sound when turned on its side', () => {
    for (let seed = 1; seed <= 50; seed++) checkPlan(transpose(generateManor(seed, SPECS)))
  })

  it('is the same house for the same case number', () => {
    expect(generateManor(7, SPECS)).toEqual(generateManor(7, SPECS))
  })

  it('builds a different house for different cases', () => {
    const plans = new Set<string>()
    for (let seed = 1; seed <= 40; seed++) plans.add(JSON.stringify(generateManor(seed, SPECS)))
    expect(plans.size).toBe(40)
  })

  it('keeps outdoor rooms on the garden front, outside the walls', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const map = generateManor(seed, SPECS)
      const terrace = map.rooms.find((r) => r.kind === 'outdoor')!
      const gallery = map.halls[0]
      expect(terrace.y + terrace.h).toBeLessThanOrEqual(gallery.y + EPS)
    }
  })
})

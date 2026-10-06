import { describe, expect, it } from 'vitest'
import { besideOf, wireBoard } from '../../src/ui/wiring'

describe('the electric lock', () => {
  it('lays out pairs that one set of wires joins, none crossing, every square used', () => {
    for (let seed = 0; seed < 300; seed++) {
      const b = wireBoard(seed)
      expect([5, 6], `seed ${seed}`).toContain(b.pairs.length)
      const used = b.wires.flat()
      expect(new Set(used).size).toBe(b.size * b.size)
      b.wires.forEach((w, i) => {
        expect(w.length).toBeGreaterThanOrEqual(3)
        expect([w[0], w[w.length - 1]]).toEqual(b.pairs[i])
        for (let k = 1; k < w.length; k++) expect(besideOf(w[k - 1], b.size)).toContain(w[k])
      })
      // No pair sits side by side.
      for (const [a, z] of b.pairs) expect(besideOf(a, b.size)).not.toContain(z)
    }
  })

  it('lays out the same board from the same seed, and others from others', () => {
    expect(wireBoard(7)).toEqual(wireBoard(7))
    const many = new Set(Array.from({ length: 30 }, (_, s) => JSON.stringify(wireBoard(s).pairs)))
    expect(many.size).toBe(30)
  })
})

import { describe, expect, it } from 'vitest'
import { ORDERS, dealCards, sound } from '../../src/ui/cardClues'

const text = (words: ReturnType<typeof dealCards>['clues'][number]['words']) =>
  words.map((w) => (typeof w === 'string' ? w : `[${w.suit}]`)).join('')

describe('the card lock', () => {
  it('has the four suits in every order once', () => {
    expect(ORDERS).toHaveLength(24)
    expect(new Set(ORDERS.map((o) => o.join())).size).toBe(24)
  })

  it('deals three cards that tell the one order, each card needed, for any seed', () => {
    const kinds = new Map<string, number>()
    for (let seed = 0; seed < 600; seed++) {
      const deal = dealCards(seed)
      expect(sound(deal.clues), `seed ${seed}`).toBe(true)
      for (const c of deal.clues) {
        expect(c.fits(deal.answer)).toBe(true)
        kinds.set(c.kind, (kinds.get(c.kind) ?? 0) + 1)
      }
    }
    // (A fair spread of kinds of clue, not the same few every time.)
    expect(kinds.size).toBeGreaterThanOrEqual(10)
  })

  it('deals the same from the same seed, and differently from another', () => {
    expect(dealCards(7).answer).toEqual(dealCards(7).answer)
    expect(dealCards(7).clues.map((c) => text(c.words))).toEqual(dealCards(7).clues.map((c) => text(c.words)))
    const many = new Set(Array.from({ length: 40 }, (_, s) => dealCards(s).answer.join()))
    expect(many.size).toBeGreaterThan(10)
  })

  it('writes every card short enough to sit on a card, without a dash', () => {
    for (let seed = 0; seed < 200; seed++) {
      for (const c of dealCards(seed).clues) {
        const t = text(c.words)
        expect(t.replace(/\[\w+\]/g, '♠').length, t).toBeLessThanOrEqual(42)
        expect(t).not.toMatch(/[—–-]/)
      }
    }
  })
})

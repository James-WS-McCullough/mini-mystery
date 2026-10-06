// The card lock's puzzle: the four suits in some order, and three cards that
// say enough about the order to tell it, and no more. Every deal has exactly
// one order that fits all three cards, and needs every one of them to find it.

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs'
export const SUITS: readonly Suit[] = ['spades', 'hearts', 'diamonds', 'clubs']
export const PIP: Record<Suit, string> = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }
export const RED: readonly Suit[] = ['hearts', 'diamonds']
export const isRed = (s: Suit) => RED.includes(s)

/** A card's words: plain text, and suits drawn as their pips. */
export type Words = (string | { suit: Suit })[]

export interface Clue {
  words: Words
  /** What kind of clue: no deal has two of a kind. */
  kind: string
  /** How strong a clue it is: a deal takes at most one that names a place outright. */
  names?: boolean
  /** Whether an order (the suits, left to right) fits it. */
  fits: (order: readonly Suit[]) => boolean
}

export interface Deal {
  answer: Suit[]
  clues: [Clue, Clue, Clue]
}

function mulberry32(a: number) {
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Every order the four suits can lie in. */
export const ORDERS: readonly Suit[][] = (() => {
  const out: Suit[][] = []
  const go = (left: Suit[], made: Suit[]) => {
    if (left.length === 0) out.push(made)
    left.forEach((s, i) => go([...left.slice(0, i), ...left.slice(i + 1)], [...made, s]))
  }
  go([...SUITS], [])
  return out
})()

const PLACE = ['first', 'second', 'third', 'last']
const at = (o: readonly Suit[], s: Suit) => o.indexOf(s)
const S = (suit: Suit) => ({ suit })

/** Every clue there is to be had about four suits. */
function allClues(): Clue[] {
  const out: Clue[] = []
  for (const x of SUITS) {
    out.push({ kind: 'end', words: ['The ', S(x), ' lies at one end.'], fits: (o) => [0, 3].includes(at(o, x)) })
    out.push({ kind: 'middle', words: ['The ', S(x), ' lies at neither end.'], fits: (o) => [1, 2].includes(at(o, x)) })
    PLACE.forEach((p, n) => {
      out.push({ kind: 'place', names: true, words: ['The ', S(x), ` is the ${p} card.`], fits: (o) => at(o, x) === n })
      out.push({ kind: 'notPlace', words: ['The ', S(x), ` is not the ${p} card.`], fits: (o) => at(o, x) !== n })
    })
    for (const y of SUITS) {
      if (x === y) continue
      out.push({ kind: 'left', words: ['The ', S(x), ' lies somewhere left of the ', S(y), '.'], fits: (o) => at(o, x) < at(o, y) })
      out.push({ kind: 'justLeft', words: ['The ', S(x), ' lies just left of the ', S(y), '.'], fits: (o) => at(o, y) - at(o, x) === 1 })
      // (The pairs below read the same either way round: each is made once.)
      if (SUITS.indexOf(x) > SUITS.indexOf(y)) continue
      out.push({ kind: 'beside', words: ['The ', S(x), ' and the ', S(y), ' lie side by side.'], fits: (o) => Math.abs(at(o, x) - at(o, y)) === 1 })
      out.push({ kind: 'apart', words: ['The ', S(x), ' and the ', S(y), ' do not touch.'], fits: (o) => Math.abs(at(o, x) - at(o, y)) > 1 })
      out.push({ kind: 'oneBetween', words: ['One card lies between the ', S(x), ' and the ', S(y), '.'], fits: (o) => Math.abs(at(o, x) - at(o, y)) === 2 })
      out.push({ kind: 'ends', words: ['The ', S(x), ' and the ', S(y), ' lie at the two ends.'], fits: (o) => [at(o, x), at(o, y)].sort().join() === '0,3' })
    }
    // Before both of the other colour.
    const others = SUITS.filter((s) => isRed(s) !== isRed(x))
    const colour = isRed(x) ? 'black' : 'red'
    out.push({ kind: 'beforeColour', words: ['The ', S(x), ` lies left of both ${colour} suits.`], fits: (o) => others.every((s) => at(o, x) < at(o, s)) })
  }
  for (const [colour, pair] of [['red', RED], ['black', SUITS.filter((s) => !isRed(s))]] as const) {
    const [a, b] = pair
    out.push({ kind: 'colourBeside', words: [`The two ${colour} suits lie side by side.`], fits: (o) => Math.abs(at(o, a) - at(o, b)) === 1 })
    out.push({ kind: 'colourApart', words: [`The two ${colour} suits do not touch.`], fits: (o) => Math.abs(at(o, a) - at(o, b)) > 1 })
    out.push({ kind: 'colourEnds', words: [`The ${colour} suits lie at the two ends.`], fits: (o) => [at(o, a), at(o, b)].sort().join() === '0,3' })
  }
  return out
}
const CLUES = allClues()

const solutions = (clues: readonly Clue[]) => ORDERS.filter((o) => clues.every((c) => c.fits(o)))

/** Whether three clues tell one order, need all three to tell it, and are fair: three kinds, at most one place named. */
export function sound(clues: readonly Clue[]): boolean {
  if (solutions(clues).length !== 1) return false
  if (clues.some((_, i) => solutions(clues.filter((__, j) => j !== i)).length === 1)) return false
  if (new Set(clues.map((c) => c.kind)).size !== clues.length) return false
  return clues.filter((c) => c.names).length <= 1
}

/** A deal from a seed: the order, and three cards that tell it. */
export function dealCards(seed: number): Deal {
  const rand = mulberry32(seed)
  const pick = <T>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)]
  for (;;) {
    const answer = pick(ORDERS)
    const true_ = CLUES.filter((c) => c.fits(answer))
    // A few hundred draws of three; nearly every order is told well before then.
    for (let tries = 0; tries < 400; tries++) {
      const three = [pick(true_), pick(true_), pick(true_)]
      if (new Set(three).size === 3 && sound(three)) return { answer: [...answer], clues: three as [Clue, Clue, Clue] }
    }
  }
}

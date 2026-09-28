// Who has which visible characteristic tonight.
//
// Traits belong to the evening, not to the person: each case deals them out
// afresh. A character only has LEANINGS — how likely each trait is to fall to
// them — so Miss Hart usually smokes and the Reverend almost never does, and
// when he does, he is furtive about it.
//
// The deal is made before roles are looked at and draws on nothing but the
// guest list, so a trait (or being furtive about one) can never say anything
// about guilt.

import type { CharacterDef, TraitDef } from '../content/schema'
import type { Rng } from './rng'
import type { TraitId } from './types'

/** A leaning at or below this is out of character: the guest is furtive about it. */
export const FURTIVE_BELOW = 0.2
/** The weight of a trait the character sheet does not mention. */
const NEUTRAL = 0.5
/** Nobody is ever quite impossible: the deal must always be able to finish. */
const FLOOR = 0.02
/** Tables up to this size are dealt exactly; larger ones place by place. */
const EXACT_UP_TO = 8

export interface TraitDeal {
  trait: TraitId
  furtive: boolean
}

export function leaningOf(def: CharacterDef, trait: TraitId): number {
  return def.leanings?.[trait] ?? NEUTRAL
}

/**
 * How many guests share each trait. Trace evidence names a trait, not a
 * person, so the table is laid in pairs with a few guests on their own: two
 * or three pairs, the rest singles.
 */
function shape(rng: Rng, guests: number, traits: number): number[] {
  const pairs = Math.min(Math.floor(guests / 2), rng.chance(1 / 3) ? 3 : 2)
  const sizes = Array.from({ length: pairs }, () => 2)
  let left = guests - pairs * 2
  while (left > 0 && sizes.length < traits) {
    sizes.push(1)
    left--
  }
  // More guests than traits to go round: the groups grow.
  for (let i = 0; left > 0; i = (i + 1) % sizes.length) {
    sizes[i]++
    left--
  }
  return sizes
}

/** Deal a trait to every guest, in guest order. */
export function dealTraits(
  rng: Rng,
  guests: readonly CharacterDef[],
  traits: readonly TraitDef[],
): TraitDeal[] {
  if (traits.length === 0) throw new Error('the setting pack has no traits to deal')
  const sizes = shape(rng, guests.length, traits.length)
  const order = rng.shuffle(traits.map((t) => t.id))
  const places: TraitId[] = rng.shuffle(sizes.flatMap((size, i) => Array<TraitId>(size).fill(order[i])))

  const weight = (guest: number, trait: TraitId) =>
    Math.max(FLOOR, leaningOf(guests[guest], trait))
  const seating =
    guests.length <= EXACT_UP_TO
      ? seatExactly(rng, guests.length, places, weight)
      : seatInTurn(rng, guests.length, places, weight)

  return seating.map((trait, guest) => ({
    trait,
    furtive: leaningOf(guests[guest], trait) <= FURTIVE_BELOW,
  }))
}

type Weigher = (guest: number, trait: TraitId) => number

/**
 * Every way of seating the guests at the places, each as likely as the
 * product of its leanings. Exact, so a guest's favourite trait is not lost
 * merely because someone was seated before them.
 */
function seatExactly(rng: Rng, n: number, places: TraitId[], weight: Weigher): TraitId[] {
  const table = Array.from({ length: n }, (_, g) => places.map((t) => weight(g, t)))
  const seatings: number[][] = []
  const odds: number[] = []
  const order: number[] = []
  const taken = new Array<boolean>(n).fill(false)
  let total = 0

  const seat = (guest: number, product: number) => {
    if (guest === n) {
      seatings.push([...order])
      odds.push(product)
      total += product
      return
    }
    for (let place = 0; place < n; place++) {
      if (taken[place]) continue
      taken[place] = true
      order.push(place)
      seat(guest + 1, product * table[guest][place])
      order.pop()
      taken[place] = false
    }
  }
  seat(0, 1)

  let roll = rng.next() * total
  let at = 0
  while (at < odds.length - 1 && roll >= odds[at]) {
    roll -= odds[at]
    at++
  }
  return seatings[at].map((place) => places[place])
}

/** For a large table: fill the places one at a time, by leaning. */
function seatInTurn(rng: Rng, n: number, places: TraitId[], weight: Weigher): TraitId[] {
  const seating = new Array<TraitId>(n)
  const waiting = Array.from({ length: n }, (_, i) => i)
  for (const trait of places) {
    const weights = waiting.map((g) => weight(g, trait))
    let roll = rng.next() * weights.reduce((a, b) => a + b, 0)
    let at = 0
    while (at < weights.length - 1 && roll >= weights[at]) {
      roll -= weights[at]
      at++
    }
    const [guest] = waiting.splice(at, 1)
    seating[guest] = trait
  }
  return seating
}

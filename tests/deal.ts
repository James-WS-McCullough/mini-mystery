// Dealing many cases for a test takes a while. Done in one breath, it keeps
// the test worker from answering the runner, which on a slow machine gives
// up on it; so the cases are dealt one by one, with a breath between.

import { buildDeck, pickMurderer, type Script } from '../src/engine/deck'
import { Rng } from '../src/engine/rng'
import type { NightKind } from '../src/engine/types'

/** `count` of whatever `make` deals, for seeds `from` onward. */
export async function deal<T>(count: number, make: (seed: number) => T, from = 1): Promise<T[]> {
  const out: T[] = []
  for (let i = 0; i < count; i++) {
    out.push(make(from + i))
    await new Promise((resolve) => setImmediate(resolve))
  }
  return out
}

/** A breath between cases, inside a test that deals them one after another. */
export function breath(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve))
}

/** Long enough to deal a few hundred cases on a slow machine. */
export const DEALING = 600_000

/**
 * The first `count` seeds whose own dice deal this kind of night — found
 * without dealing the nights themselves (as generateMystery draws them).
 */
export function seedsOf(script: Script, kind: NightKind, count: number, max = 5000): number[] {
  const out: number[] = []
  for (let seed = 1; seed <= max && out.length < count; seed++) {
    const deck = buildDeck(new Rng(`${seed}:deck`), script)
    if (pickMurderer(new Rng(`${seed}:murderer`), script, deck) === kind) out.push(seed)
  }
  return out
}

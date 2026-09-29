// Who could have done it, by which method.
//
// Like traits, the means — access to the still-room, knowledge of the
// gun-room, the strength for a blow — are dealt afresh each case. The murder
// method is one that nearly everybody could have managed: learning it at the
// scene strikes one or two guests off the list and no more. Finding the
// culprit is a matter of elimination, not of one lucky clue.
//
// A character's own `means` are only what they usually have: they make that
// means likelier to fall to them, and never decide it.

import type { CharacterDef, MeansDef } from '../content/schema'
import type { Rng } from './rng'
import type { CharId, MeansId } from './types'

export interface MeansDealOptions {
  /** The means the murder method needs. */
  method: MeansId
  culprit: CharId
  /** Guests who must lack the method's means (the begrudged: motive, no means). */
  mustLack: readonly CharId[]
  /** Guests who must have it, besides the culprit: those who mean to look guilty. */
  mustHave?: readonly CharId[]
}

/** How many guests the method rules out. */
const RULED_OUT = [1, 2] as const
/** How much likelier a means is to fall to someone who usually has it. */
const USUAL = 3

export function dealMeans(
  rng: Rng,
  guests: readonly CharacterDef[],
  means: readonly MeansDef[],
  opts: MeansDealOptions,
): MeansId[][] {
  const n = guests.length
  const hands: MeansId[][] = guests.map(() => [])

  // The method: everyone could have, bar one or two.
  const lacking = new Set<CharId>(opts.mustLack.filter((c) => c !== opts.culprit))
  const want = Math.max(lacking.size, rng.pick(RULED_OUT))
  const others = rng.shuffle(
    guests
      .map((_, i) => i)
      .filter((i) => i !== opts.culprit && !lacking.has(i) && !opts.mustHave?.includes(i)),
  )
  while (lacking.size < want && others.length > 0) lacking.add(others.pop()!)
  for (let g = 0; g < n; g++) if (!lacking.has(g)) hands[g].push(opts.method)

  // The other means: held by about half the table, leaning to the usual hands.
  for (const m of means) {
    if (m.id === opts.method) continue
    const holders = Math.max(1, Math.round(n * (0.4 + rng.next() * 0.25)))
    const waiting = guests.map((_, i) => i)
    for (let k = 0; k < holders && waiting.length > 0; k++) {
      const weights = waiting.map((g) => (guests[g].means.includes(m.id) ? USUAL : 1))
      let roll = rng.next() * weights.reduce((a, b) => a + b, 0)
      let at = 0
      while (at < weights.length - 1 && roll >= weights[at]) {
        roll -= weights[at]
        at++
      }
      hands[waiting.splice(at, 1)[0]].push(m.id)
    }
  }

  // Nobody is left with nothing to their name.
  const spare = means.map((m) => m.id).filter((id) => id !== opts.method)
  for (let g = 0; g < n; g++) {
    if (hands[g].length === 0 && spare.length > 0) hands[g].push(rng.pick(spare))
  }

  // In the pack's own order, so the cast sheet reads the same way for everyone.
  const order = means.map((m) => m.id)
  return hands.map((hand) => [...hand].sort((a, b) => order.indexOf(a) - order.indexOf(b)))
}

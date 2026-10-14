// The Spinster: knows whether a couple truly spent the hour together. Always
// a couple worth asking about: two who say they were together (and were, or
// were not), or two who say they were apart and were not. Never two guests
// picked at random, which would tell the detective nothing.
import { truthClassOf } from '../deck'
import type { CharId, RoomId } from '../types'
import type { InfoPart } from './part'

const key = (a: CharId, b: CharId): [CharId, CharId] => (a < b ? [a, b] : [b, a])

/** Honest guests who truly spent the hour together, and so say so: couples to confirm. */
function honestCouples(roles: readonly string[], at: readonly RoomId[], others: readonly CharId[]): [CharId, CharId][] {
  const honest = others.filter((c) => truthClassOf(roles[c] as never) === 'honest')
  return honest.flatMap((a) => honest.filter((b) => b > a && at[a] === at[b]).map((b) => key(a, b)))
}

export const spinster: InfoPart = {
  knowsOfTheLies({ rng, lies, sweetheart, sweetheartOf, companions, cast, locations }, spinster) {
    const sp = rng.fork('spinster')
    // Who each guest says they were with: their story, where they tell one;
    // else the truth.
    const said = (c: CharId) => lies.get(c)?.companions ?? companions[c]
    const couples = new Map<string, [CharId, CharId]>()
    const couple = (a: CharId, b: CharId) => {
      if (a < 0 || b < 0 || a === b || a === spinster || b === spinster) return
      couples.set(key(a, b).join(','), key(a, b))
    }
    for (const m of cast) for (const o of said(m.id)) couple(m.id, o)
    // (And the sweethearts, who were together and both say they were alone.)
    couple(sweetheart, sweetheartOf)
    const all = [...couples.values()]
    const together = ([a, b]: [CharId, CharId]) => locations[a] === locations[b]
    const saysSo = ([a, b]: [CharId, CharId]) => said(a).includes(b) && said(b).includes(a)
    // Most often a couple whose story is not the truth; else one to confirm.
    const telling = all.filter((p) => together(p) !== saysSo(p))
    const plain = all.filter((p) => together(p) === saysSo(p))
    const from = telling.length > 0 && (plain.length === 0 || sp.chance(0.7)) ? telling : plain
    if (from.length === 0) return null
    const pair = sp.pick(from)
    return { kind: 'together', pair, together: together(pair) }
  },
  fabricate({ rng, cast, roles, speaker, culprit, rooms }) {
    // Passing for her: a couple who truly were together, said not to have
    // been. (Never the murderer: no lie of this kind is told about them.)
    const at = rooms?.at
    if (!at) return null
    const others = cast.map((m) => m.id).filter((c) => c !== speaker && c !== culprit)
    const couples = honestCouples(roles, at, others)
    if (couples.length > 0) return { kind: 'together', pair: rng.pick(couples), together: false }
    // (Where no couple sat together tonight: two said to have been together who were not.)
    const pair = rng.sample(others, 2).sort((x, y) => x - y)
    return { kind: 'together', pair: [pair[0], pair[1]], together: at[pair[0]] !== at[pair[1]] }
  },
  careful({ rng, roles, locations, ties, others }) {
    // Two honest guests who truly were together, confirmed: true, and it catches nobody.
    const couples = honestCouples(roles, locations, others).filter(([a, b]) => ties.free(a, 'carefulPair') && ties.free(b, 'carefulPair'))
    return couples.length > 0 ? { kind: 'together', pair: rng.pick(couples), together: true } : null
  },
}

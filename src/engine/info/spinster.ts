// The Spinster: knows whether two guests truly spent the hour together.
import { truthClassOf } from '../deck'
import type { CharId } from '../types'
import type { InfoPart } from './part'

export const spinster: InfoPart = {
  knowsOfTheLies({ rng, lies, sweetheart, sweetheartOf, companion, companionOf, cast, locations }, spinster) {
    // Most often a pair worth knowing about (two who say they were together,
    // or two who were and say not); else two who were apart, which tells
    // against nobody.
    const sp = rng.fork('spinster')
    const key = (a: CharId, b: CharId): [CharId, CharId] => (a < b ? [a, b] : [b, a])
    const telling = new Map<string, [CharId, CharId]>()
    const note = (a: CharId, b: CharId) => {
      if (a < 0 || b < 0 || a === spinster || b === spinster) return
      telling.set(key(a, b).join(','), key(a, b))
    }
    for (const [c, l] of lies) for (const o of l.companions) note(c, o)
    note(sweetheart, sweetheartOf)
    note(companion, companionOf)
    const worth = [...telling.values()]
    const others = cast.map((m) => m.id).filter((c) => c !== spinster)
    const apart = others.flatMap((a) => others.filter((b) => b > a && locations[a] !== locations[b]).map((b) => key(a, b)))
    const pair = worth.length > 0 && sp.chance(0.7) ? sp.pick(worth) : sp.pick(apart)
    return { kind: 'together', pair, together: locations[pair[0]] === locations[pair[1]] }
  },
  fabricate({ rng, cast, speaker, culprit, rooms }) {
    // Two said to have been together who were not, or the other way about.
    // (Never the murderer: no lie of this kind is told about them.)
    const at = rooms?.at
    if (!at) return null
    const pair = rng.sample(cast.map((m) => m.id).filter((c) => c !== speaker && c !== culprit), 2).sort((x, y) => x - y)
    return { kind: 'together', pair: [pair[0], pair[1]], together: at[pair[0]] !== at[pair[1]] }
  },
  careful({ rng, roles, locations, ties, others }) {
    // Two honest guests who were apart: true, and it catches nobody.
    const plain = others.filter((c) => truthClassOf(roles[c]) === 'honest' && ties.free(c, 'carefulPair'))
    const apart = plain.flatMap((a) =>
      plain.filter((b) => b > a && locations[a] !== locations[b]).map((b): [CharId, CharId] => [a, b]),
    )
    return apart.length > 0 ? { kind: 'together', pair: rng.pick(apart), together: false } : null
  },
}

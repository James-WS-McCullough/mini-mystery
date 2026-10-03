// The Observer: first along the corridor after, and passed somebody coming away.
import type { InfoPart } from './part'

export const oracle: InfoPart = {
  knows({ rng, cast, culprit, redherring, truth }, oracle) {
    // Passed somebody in the corridor, coming away from the scene: the
    // murderer half the time, else whoever else had been that way — the Red
    // Herring, or anybody. A lead, and nothing more.
    const others = cast.map((m) => m.id).filter((c) => c !== oracle && c !== culprit)
    const target =
      rng.chance(0.5) || others.length === 0
        ? culprit
        : redherring >= 0 && redherring !== oracle && rng.chance(0.5)
          ? redherring
          : rng.pick(others)
    if (target === oracle) return null
    truth.corridor = target
    return { kind: 'passing', target }
  },
  fabricate({ rng, cast, speaker, culprit, corridor }) {
    // Somebody passed in the corridor: anybody but the murderer — and not
    // whoever truly did, or the lie would happen to be true.
    const passed = cast.map((m) => m.id).filter((c) => c !== speaker && c !== culprit && c !== corridor)
    if (passed.length === 0) return null
    return { kind: 'passing', target: rng.pick(passed) }
  },
}

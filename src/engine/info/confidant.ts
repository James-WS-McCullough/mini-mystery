// The Confidant: knows the truth of one other person's character.
import { isEvil } from '../deck'
import type { CharId } from '../types'
import type { InfoPart } from './part'

export const confidant: InfoPart = {
  knows({ rng, cast, roles, culprit, shadyIds, perjurer, singleLiar }, confidant) {
    // Biased toward exonerating whoever tonight's suspicious are; never handed
    // the culprit outright on a single-liar night.
    const herringPresent = shadyIds.filter((x) => x !== perjurer)
    const roll = rng.next()
    let target: CharId
    if (herringPresent.length > 0 && roll < 0.4) target = rng.pick(herringPresent)
    else if (!singleLiar && culprit >= 0 && roll < 0.55) target = culprit
    else target = rng.pick(cast.map((m) => m.id).filter((c) => c !== confidant && c !== culprit))
    return { kind: 'alignment', target, alignment: isEvil(roles[target]) ? 'evil' : 'good' }
  },
  fabricate({ rng, cast, speaker, culprit }) {
    // Accuse an innocent, or (unfalsifiably) vouch for one.
    const others = cast.map((m) => m.id).filter((c) => c !== speaker && c !== culprit)
    const target = rng.pick(others)
    return rng.chance(0.4)
      ? { kind: 'alignment', target, alignment: 'evil' }
      : { kind: 'alignment', target, alignment: 'good' }
  },
  corrupt({ rng, cast, speaker, culprit }) {
    // An innocent called guilty, or the murderer called innocent; and where
    // there is no murderer, nobody to call innocent wrongly.
    const innocents = cast.map((m) => m.id).filter((c) => c !== speaker && c !== culprit)
    return culprit < 0 || rng.chance(0.5)
      ? { kind: 'alignment', target: rng.pick(innocents), alignment: 'evil' }
      : { kind: 'alignment', target: culprit, alignment: 'good' }
  },
  careful({ rng, others }) {
    return { kind: 'alignment', target: rng.pick(others), alignment: 'good' }
  },
}

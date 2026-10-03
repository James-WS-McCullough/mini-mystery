// The Discoverer: found him still living, and heard or saw a last sign.
import type { AttrRef } from '../types'
import type { InfoPart } from './part'
import { safeTraits, wrongSex } from './part'

export const discoverer: InfoPart = {
  knows({ rng, bySex, tellingTrait, singleLiar, byTrait }) {
    // Found him living, for a moment: a last word, or a last sign.
    const attr: AttrRef = bySex && (tellingTrait || rng.chance(singleLiar ? 0.85 : 0.7)) ? bySex : byTrait
    return { kind: 'culpritAttr', attr, dying: true }
  },
  fabricate({ rng, cast, speaker, culprit }) {
    // A last word invented: of the wrong sex, or a habit that is not the murderer's.
    const safe = safeTraits(cast, culprit, speaker)
    const wrong = wrongSex(cast, culprit)
    if (wrong && (rng.chance(0.5) || safe.length === 0)) {
      return { kind: 'culpritAttr', attr: { kind: 'sex', sex: wrong }, dying: true }
    }
    if (safe.length === 0) return null
    return { kind: 'culpritAttr', attr: { kind: 'trait', trait: rng.pick(safe) }, dying: true }
  },
  corrupt({ rng, cast, culprit }) {
    // A last word misheard.
    const wrong = wrongSex(cast, culprit)
    return wrong && rng.chance(0.5)
      ? { kind: 'culpritAttr', attr: { kind: 'sex', sex: wrong }, dying: true }
      : { kind: 'culpritAttr', attr: { kind: 'trait', trait: rng.pick(safeTraits(cast, culprit)) }, dying: true }
  },
}

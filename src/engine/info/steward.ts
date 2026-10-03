// The Steward: kept an eye on two all evening, and knows how many of them lie about the hour.
import { liesAboutWhereabouts } from '../deck'
import type { InfoPart } from './part'
import { watched, wrongCount } from './part'

export const steward: InfoPart = {
  knows({ rng, cast, roles, ties }, steward) {
    // Had an eye on two of them all evening: how many are lying about the hour?
    // (Not the Clinger's kind friend, whose one lie is not the Steward's to count.)
    const pair = watched(
      rng,
      cast,
      steward,
      cast.map((m) => m.id).filter((c) => !ties.free(c, 'stewardWatch')),
    )
    return { kind: 'liarsAmong', pair, count: pair.filter((c) => liesAboutWhereabouts(roles[c])).length }
  },
  fabricate({ rng, cast, roles, speaker }) {
    return wrongCount(rng, cast, roles, speaker)
  },
  corrupt({ rng, cast, roles, speaker }) {
    return wrongCount(rng, cast, roles, speaker)
  },
  careful({ rng, cast, roles, culprit }) {
    const pair = watched(rng, cast, culprit)
    return { kind: 'liarsAmong', pair, count: pair.filter((c) => liesAboutWhereabouts(roles[c])).length }
  },
}

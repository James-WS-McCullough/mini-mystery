// The Sleuth: has narrowed it to three, one of them the murderer.
import type { InfoPart } from './part'
import { shortlist } from './part'

export const sleuth: InfoPart = {
  knows({ rng, cast, culprit, shadyIds }, sleuth) {
    // The murderer and two others. The two are whoever looks worst tonight,
    // where there is anyone to choose: a shortlist of the plainly innocent
    // would be as good as a name.
    const others = cast.map((m) => m.id).filter((c) => c !== sleuth && c !== culprit)
    const shady = rng.shuffle(others.filter((c) => shadyIds.includes(c)))
    const plain = rng.shuffle(others.filter((c) => !shady.includes(c)))
    const beside = [...shady.slice(0, 1), ...plain, ...shady.slice(1)].slice(0, 2)
    return { kind: 'among', suspects: [culprit, ...beside].sort((a, b) => a - b) }
  },
  fabricate({ rng, cast, speaker, culprit }) {
    // Three names, none of them the murderer's — nor the speaker's own.
    return { kind: 'among', suspects: shortlist(rng, cast, [speaker, culprit]) }
  },
  corrupt({ rng, cast, speaker, culprit }) {
    return { kind: 'among', suspects: shortlist(rng, cast, [speaker, culprit]) }
  },
}

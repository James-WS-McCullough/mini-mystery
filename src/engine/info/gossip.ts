// The Gossip: hears who had cause to hate the dead man.
import { isMotiveGrade } from '../types'
import type { InfoPart } from './part'

export const gossip: InfoPart = {
  fabricate({ rng, cast, relationships, speaker, culprit, fitting }) {
    // Invented dirt: a false motive pinned on an innocent.
    const subjects = cast
      .map((m) => m.id)
      .filter((c) => c !== speaker && c !== culprit && !isMotiveGrade(relationships[c]))
    if (subjects.length === 0) return null
    const subject = rng.pick(subjects)
    const fakeRels = fitting[subject].filter((r) => r !== relationships[subject])
    if (fakeRels.length === 0) return null
    return { kind: 'relationship', subject, rel: rng.pick(fakeRels) }
  },
  careful({ rng, relationships, others }) {
    const subject = rng.pick(others)
    return { kind: 'relationship', subject, rel: relationships[subject] }
  },
}

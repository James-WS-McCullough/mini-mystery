// The Witness: glimpsed somebody near the scene.
import type { InfoPart } from './part'
import { safeTraits } from './part'

export const witness: InfoPart = {
  knows({ rng, singleLiar, viaPassage, careful, culprit, sceneRoom, tellingTrait, bySex, byTrait }) {
    // A full identification only on two-liar nights; otherwise a glimpse.
    // (Nobody saw the murderer at the scene who came and went through the wall,
    // nor the Careful one, who made sure of it.)
    const full = !singleLiar && !viaPassage && !careful && rng.chance(0.35)
    return full
      ? { kind: 'sighting', target: culprit, room: sceneRoom }
      : {
          kind: 'glimpse',
          attr: tellingTrait && bySex ? bySex : byTrait,
          room: sceneRoom,
        }
  },
  fabricate({ rng, cast, speaker, culprit, sceneRoom }) {
    const safe = safeTraits(cast, culprit, speaker)
    const frameTargets = cast.map((m) => m.id).filter((c) => c !== speaker && c !== culprit)
    if (rng.chance(0.3)) {
      return { kind: 'sighting', target: rng.pick(frameTargets), room: sceneRoom }
    }
    const pool = safe.length > 0 ? safe : [cast[rng.pick(frameTargets)].trait]
    return { kind: 'glimpse', attr: { kind: 'trait', trait: rng.pick(pool) }, room: sceneRoom }
  },
  corrupt({ rng, cast, culprit, sceneRoom }) {
    return { kind: 'glimpse', attr: { kind: 'trait', trait: rng.pick(safeTraits(cast, culprit)) }, room: sceneRoom }
  },
}

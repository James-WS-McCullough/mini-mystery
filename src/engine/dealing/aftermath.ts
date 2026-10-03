// One phase of dealing a night (see generate.ts).

import { liesAboutRole, liesAboutWhereabouts, truthClassOf } from '../deck'
import type { CharId, MurdererKind } from '../types'
import { LIAR_SAW } from './night'
import type { AfterSuspicion } from './night'

/** The second killing, the last of the ground truth, and what the liars saw. */
export function settleAftermath(night: AfterSuspicion) {
  const {
    rng, kind, pack, config, roles, hoax, nobody, committee, members, culprit, martyrLacks, sceneRoom, cast,
    careful, loner, redherring, amnesiac, sweetheart, clinger, martyr, honestIds, locations, companions,
    sweetheartOf, clingerOf, truth, evidence, bribed, keyItem, knowledge, saw, keyHint, framed, hoaxed,
    smeared, whispered, clingerSeen,
  } = night
  // ---- the murderer who kills again ----
  // Whoever knows most against them is dead by the third hour, in the room
  // where they spent the evening. The murderer leaves nothing of themselves:
  // they are a harder murderer, and are caught without the dead.
  if (kind === 'serial') {
    const knows = (c: CharId) =>
      knowledge[c].some(
        (k) =>
          (k.kind === 'sighting' && k.target === culprit) ||
          k.kind === 'glimpse' ||
          k.kind === 'culpritAttr' ||
          k.kind === 'among' ||
          (k.kind === 'passing' && k.target === culprit) ||
          (k.kind === 'alignment' && k.target === culprit) ||
          (k.kind === 'relationship' && k.subject === culprit),
      )
    // (Not anybody the murderer's friend has work for; nor whoever has the
    // key to the locked room, or knows where it lies: the door must open.)
    const spared = [bribed, whispered, framed, clingerOf, clingerSeen, keyItem?.heldBy ?? -1, keyHint?.by ?? -1]
    const living = honestIds.filter((c) => !spared.includes(c) && locations[c] !== sceneRoom)
    const marked = living.filter(knows)
    const pool = marked.length > 0 ? marked : living
    if (pool.length === 0) return 'no-seam'
    const victim = rng.pick(pool)
    const room = locations[victim]
    const round = Math.min(2, config.rounds - 1)
    evidence.push({
      id: 'second-body',
      room,
      name: (pack.secondBody ?? '{name}, dead and silenced').replace('{name}', cast[victim].shortName),
      fact: { kind: 'killed', victim, room },
      from: round,
      plain: true,
    })
    truth.second = { victim, room, round }
  }
  if (!nobody) truth.murderer = kind as MurdererKind
  if (committee) {
    truth.committee = members
    truth.smeared = smeared
  }
  truth.martyrLacks = martyrLacks
  /** Who will stand up at the last and say it was them. */
  const confessors = new Set<CharId>([
    ...(kind === 'regretful' ? [culprit] : []),
    ...(martyr >= 0 ? [martyr] : []),
  ])
  truth.whispered = whispered >= 0 ? whispered : null
  truth.framed = framed >= 0 ? framed : null
  if (hoax) truth.hoaxed = hoaxed
  truth.bribed = bribed >= 0 ? bribed : null
  truth.sweetheartOf = sweetheartOf >= 0 ? sweetheartOf : null
  truth.clingerOf = clingerOf >= 0 ? clingerOf : null

  // Those with something to hide saw things too, now and then — something true
  // and harmless, of a guest where they truly were — so having seen something
  // marks nobody out as honest.
  const seeable = cast
    .map((m) => m.id)
    .filter(
      (t) =>
        truthClassOf(roles[t]) === 'honest' &&
        !liesAboutWhereabouts(roles[t]) &&
        ![loner, amnesiac, sweetheart, sweetheartOf, clinger, clingerOf, redherring].includes(t),
    )
  for (const m of cast) {
    const c = m.id
    const hiding = liesAboutRole(roles[c]) || truthClassOf(roles[c]) === 'unreliable'
    if (!hiding || !rng.chance(LIAR_SAW)) continue
    // (The Careful Murderer saw nothing worth the mention, and says so; nor
    // does the Committee say anything beyond the story it agreed.)
    if (careful && c === culprit) continue
    if (members.includes(c)) continue
    const targets = seeable.filter((t) => t !== c && !companions[c].includes(t))
    if (targets.length === 0) continue
    const target = rng.pick(targets)
    saw(c, { kind: 'sighting', target, room: locations[target] })
  }

  return { confessors, seeable }
}

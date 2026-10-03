// One phase of dealing a night (see generate.ts).

import { ROLES } from '../roles'
import { liesAboutRole, liesAboutWhereabouts, truthClassOf } from '../deck'
import type { CharId, MurdererKind } from '../types'
import { LIAR_SAW } from './night'
import type { AfterSuspicion } from './night'
import { SerialMurderer, partOf } from '../parts'

/** The second killing, the last of the ground truth, and what the liars saw. */
export function settleAftermath(night: AfterSuspicion) {
  const {
    rng, kind, roles, hoax, nobody, committee, members, culprit, martyrLacks, cast, careful, locations,
    companions, sweetheartOf, clingerOf, truth, bribed, saw, framed, hoaxed, smeared, whispered, ties,
  } = night
  // ---- the murderer who kills again ----
  // Whoever knows most against them is dead by the third hour, in the room
  // where they spent the evening. The murderer leaves nothing of themselves:
  // they are a harder murderer, and are caught without the dead.
  if (culprit >= 0) {
    const part = partOf('murderer', kind)
    const failed = part instanceof SerialMurderer ? part.strikesAgain(night, culprit) : undefined
    if (failed) return failed
  }
  if (!nobody) truth.murderer = kind as MurdererKind
  if (committee) {
    truth.committee = members
    truth.smeared = smeared
  }
  truth.martyrLacks = martyrLacks
  /** Who will stand up at the last and say it was them. */
  const confessors = new Set<CharId>(cast.map((m) => m.id).filter((c) => partOf(roles[c], kind).confessesAtTheLast))
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
        !ROLES[roles[t]].unseen &&
        ties.free(t, 'seenByLiar'),
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

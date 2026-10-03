// One phase of dealing a night (see generate.ts).

import { ROLES } from '../roles'
import { truthClassOf } from '../deck'
import { isMotiveGrade } from '../types'
import type { CharId, GroundTruth, RoomId } from '../types'
import { DRUNK_BELIEFS } from './night'
import { Ties } from './ties'
import type { AfterFeelings } from './night'

/** Where everybody spent the hour, and with whom; and the ground truth. */
export function placeGuests(night: AfterFeelings) {
  const {
    rng, kind, lock, pack, script, n, roles, suicide, hoax, hoaxer, members, noSingle, culprit, martyrLacks,
    sceneRoom, method, cast, passageNight, viaPassage, thief, drunk, loner, redherring, companion, amnesiac,
    sweetheart, spinster, clinger, martyr, helper, honestIds, occasion, event, relationships, motiveSubject,
  } = night
  /** What each guest is given to do in somebody else's story, as the night is dealt. */
  const ties = new Ties()
  // ---- geography: the murder window as one time slot ----
  const allRooms = pack.rooms.map((r) => r.id)
  const theftRoom = thief >= 0 ? rng.pick(pack.valuableRooms.filter((r) => r !== sceneRoom)) : null

  const locations: RoomId[] = new Array(n).fill('')
  const companions: CharId[][] = Array.from({ length: n }, () => [])
  if (!viaPassage && culprit >= 0) locations[culprit] = sceneRoom
  // The Committee spent the hour at the scene, all four of them.
  for (const m of members) locations[m] = sceneRoom
  // The Hoaxer spent the hour at the scene, setting it to look like murder.
  if (hoax) locations[hoaxer] = sceneRoom
  if (thief >= 0 && theftRoom) locations[thief] = theftRoom

  const freeRooms = rng.shuffle(allRooms.filter((r) => r !== sceneRoom && r !== theftRoom))
  // Held back before anybody is placed, so that there is one to lock: a room
  // with papers in it, on a night with a locked room; on a night he is not
  // dead, a room with nothing in it at all, for him to hide in.
  const held = rng.fork('held')
  const holdable =
    kind === 'hoax'
      ? freeRooms.filter((r) => !pack.docRooms.includes(r) && !pack.valuableRooms.includes(r))
      : lock.tonight
        ? freeRooms.filter((r) => pack.docRooms.includes(r))
        : []
  const heldRoom: RoomId | null = holdable.length > 0 ? held.pick(holdable) : null
  if (heldRoom !== null) freeRooms.splice(freeRooms.indexOf(heldRoom), 1)
  const together = (group: CharId[]): boolean => {
    const room = freeRooms.pop()
    if (!room) return false
    for (const g of group) {
      locations[g] = room
      companions[g] = group.filter((x) => x !== g)
    }
    return true
  }
  // The Companion spent the hour with somebody who has nothing to hide — and
  // a role of their own.
  const good = rng.shuffle(
    cast
      .map((m) => m.id)
      .filter(
        (c) =>
          c !== companion &&
          !ROLES[roles[c]].alone &&
          truthClassOf(roles[c]) === 'honest',
      ),
  )
  let companionOf = -1
  if (companion >= 0) {
    const other = good.pop()
    if (other === undefined) return 'no-company'
    companionOf = other
    if (!together([companion, companionOf])) return 'rooms-exhausted'
  }
  // The Sweetheart was with somebody too — who will say so, and be contradicted.
  let sweetheartOf = -1
  if (sweetheart >= 0) {
    const other = good.pop()
    if (other === undefined) return 'no-company'
    sweetheartOf = other
    ties.tie(sweetheart, 'keepsSecret')
    ties.tie(sweetheartOf, 'hidesCompany')
    if (!together([sweetheart, sweetheartOf])) return 'rooms-exhausted'
  }
  // The Clinger spent the hour alone, and could not bear to say so: somebody
  // kind, alone too and somewhere else, will swear they were together. (Not
  // the Spinster, who knows better.)
  let clingerOf = -1
  if (clinger >= 0) {
    const soul = good.filter((c) => c !== spinster).pop()
    if (soul === undefined) return 'no-company'
    clingerOf = soul
    ties.tie(clinger, 'clings')
    ties.tie(clingerOf, 'vouches')
    good.splice(good.indexOf(soul), 1)
    if (!together([clinger]) || !together([clingerOf])) return 'rooms-exhausted'
  }
  // The Red Herring looked in at the scene within the hour, and was gone
  // before it was done: somebody saw them there. The hour itself they spent
  // alone in a room of their own — which will bear them out, once pressed.
  if (redherring >= 0 && !together([redherring])) return 'rooms-exhausted'
  // The murderer who went by the passage spent the hour at the other end of
  // it, alone — and may say so, for it is true.
  if (viaPassage && !together([culprit])) return 'rooms-exhausted'
  // The murderer's friend was alone, whatever they say — all but the one who
  // will take the blame and could not have done it: they were in company.
  let martyrOf = -1
  if (martyr >= 0 && martyrLacks === 'opportunity') {
    const other = good.pop()
    if (other === undefined) return 'no-company'
    martyrOf = other
    if (!together([martyr, martyrOf])) return 'rooms-exhausted'
  } else if (helper >= 0 && !together([helper])) return 'rooms-exhausted'

  const placed = new Set<CharId>(
    [culprit, hoaxer, ...members, thief, companion, companionOf, sweetheart, sweetheartOf, clinger, clingerOf, helper, martyrOf, loner, amnesiac, redherring].filter(
      (x) => x >= 0,
    ),
  )
  const floaters = cast.map((m) => m.id).filter((c) => !placed.has(c))
  const floaterGroups: CharId[][] = []
  if (loner >= 0) floaterGroups.push([loner]) // the loner is always, definitionally, alone
  if (amnesiac >= 0) floaterGroups.push([amnesiac]) // and nobody can say where the amnesiac was
  // On a night with a passage, somebody honest is alone at the end of it (if
  // the murderer did not go by it): kept out of any pair.
  const passageEnd =
    passageNight && !viaPassage
      ? floaters.find((c) => truthClassOf(roles[c]) === 'honest' && !ROLES[roles[c]].alone)
      : undefined
  const pairable = floaters.filter((c) => c !== passageEnd)
  if (pairable.length >= 2 && rng.chance(0.5)) {
    const pair = rng.sample(pairable, 2)
    floaterGroups.push(pair)
    for (const f of floaters) if (!pair.includes(f)) floaterGroups.push([f])
  } else {
    for (const f of floaters) floaterGroups.push([f])
  }
  for (const group of floaterGroups) {
    const room = freeRooms.pop()
    if (!room) return 'rooms-exhausted'
    for (const g of group) {
      locations[g] = room
      companions[g] = group.filter((x) => x !== g)
    }
  }

  // The Cunning Murderer's part, when pressed (played out below). Playing the
  // Clinger, they have begged somebody kind, alone in a room of their own, to
  // swear they were together; pressed, they say they were alone in a room
  // nobody was in, where nothing of theirs will be found.
  const acts = (['herring', 'thief', 'blackmailer', 'clinger'] as const).filter(
    (a) => script.herrings.includes(a === 'herring' ? 'redherring' : a) && (a !== 'clinger' || clinger < 0),
  )
  const act = kind === 'cunning' && helper < 0 && !viaPassage && acts.length > 0 ? rng.pick(acts) : null
  const playsThief = act === 'thief'
  let fallback: RoomId | null = null
  if (act === 'clinger') {
    const souls = honestIds.filter(
      (c) =>
        c !== spinster &&
        !ROLES[roles[c]].alone &&
        c !== passageEnd &&
        companions[c].length === 0 &&
        locations[c] !== sceneRoom,
    )
    if (souls.length === 0) return 'no-company'
    clingerOf = rng.pick(souls)
    ties.tie(clingerOf, 'vouches')
    const empty = allRooms.filter((r) => r !== sceneRoom && r !== theftRoom && r !== heldRoom && !locations.includes(r))
    if (empty.length === 0) return 'lie-room'
    fallback = rng.pick(empty)
  }
  /** Whoever the kind friend swears was with them: the Clinger, or the murderer playing the part. */
  const clung = clinger >= 0 ? clinger : act === 'clinger' ? culprit : -1

  // Whoever was at odds with him that afternoon: the murderer half the time,
  // and the rest of the time somebody else with cause — a lead, not a proof.
  const quarrelCandidates = cast
    .map((m) => m.id)
    .filter((c) => c !== culprit && (isMotiveGrade(relationships[c]) || relationships[c] === 'strained'))
  const quarrelParticipant = noSingle
    ? rng.pick(quarrelCandidates.length > 0 ? quarrelCandidates : [motiveSubject])
    : quarrelCandidates.length === 0 || rng.chance(0.5)
      ? culprit
      : rng.pick(quarrelCandidates)

  const truth: GroundTruth = {
    roles,
    locations,
    companions,
    relationships,
    sceneRoom,
    methodId: method.id,
    methodMeans: method.means,
    theftRoom,
    quarrelParticipant,
    drunkBelievedRole: drunk >= 0 ? rng.pick(DRUNK_BELIEFS) : null,
    event,
    corridor: null,
    ...(occasion ? { occasion: occasion.id } : {}),
    ...(suicide ? { suicide: true } : {}),
    ...(hoax ? { hoax: true } : {}),
  }

  return {
    allRooms, theftRoom, locations, companions, freeRooms, held, holdable, heldRoom, together, good,
    companionOf, sweetheartOf, clingerOf, martyrOf, placed, floaters, floaterGroups, passageEnd, pairable,
    acts, act, playsThief, fallback, clung, quarrelCandidates, quarrelParticipant, truth, ties,
  }
}

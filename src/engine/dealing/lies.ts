// One phase of dealing a night (see generate.ts).

import { truthClassOf } from '../deck'
import type { CharId, RoomId } from '../types'
import type { AfterParts } from './night'

/** Where the liars say they were; and what is known of the rooms and pairs that tells against them. */
export function tellLies(night: AfterParts) {
  const {
    rng, pack, roles, culprit, sceneRoom, cast, careful, viaPassage, companion, perjurer, amnesiac,
    sweetheart, porter, spinster, clinger, forger, whisperer, honestIds, allRooms, theftRoom, locations,
    companions, companionOf, sweetheartOf, clingerOf, playsThief, clung, traitDef, evidence, traceRooms,
    locked, knowledge, saw, committeeLies, ties,
  } = night
  const occupiedRooms = new Set(locations.filter((r) => r !== ''))
  const lies = new Map<CharId, { room: RoomId; companions: CharId[] }>(committeeLies)
  /** Rooms where somebody honest truly spent the hour alone, and will say so. */
  const kept = rng.shuffle(
    cast
      .map((m) => m.id)
      .filter(
        (c) => truthClassOf(roles[c]) === 'honest' && c !== amnesiac && ties.free(c, 'keptRoom') && companions[c].length === 0,
      )
      .map((c) => locations[c]),
  )
  // The best account is the true one: alone, in the room at the end of the passage.
  if (viaPassage) lies.set(culprit, { room: locations[culprit], companions: [] })
  if (playsThief) {
    // A room worth robbing, and not the one that was robbed — nor one whose
    // trace would fit them.
    const rooms = rng.shuffle(
      pack.valuableRooms.filter(
        (r) => r !== sceneRoom && r !== theftRoom && r !== locked && traceRooms.get(r) !== cast[culprit].trait,
      ),
    )
    // Occupied for choice: that collision is the opportunity-breaking contradiction.
    const room = rooms.find((r) => occupiedRooms.has(r)) ?? rooms[0]
    if (!room) return 'lie-room'
    lies.set(culprit, { room, companions: [] })
  }
  if (perjurer >= 0) {
    // Each swears the other was beside them — in a room they chose badly:
    // somebody was there, alone, and the room will bear that somebody out.
    const room = kept.find((r) => traceRooms.has(r)) ?? kept[0]
    if (!room) return 'lie-room'
    lies.set(perjurer, { room, companions: [culprit] })
    lies.set(culprit, { room, companions: [perjurer] })
  }
  // The Whisperer has given the murderer a room to have been in, and an honest
  // guest who will swear to having seen them there. It was chosen badly:
  // somebody else was in it, alone, and the room bears that somebody out.
  let whispered = -1
  if (whisperer >= 0) {
    const room = kept.find(
      (r) =>
        // (Whoever holds the trace: the two accounts collide either way.)
        traceRooms.has(r) && traceRooms.get(r) !== cast[culprit].trait,
    )
    if (!room) return 'lie-room'
    lies.set(culprit, { room, companions: [] })
    // (Not the one who keeps the Sweetheart's secret: one lie to a mouth.)
    const mouths = honestIds.filter((c) => locations[c] !== room && ties.free(c, 'whisper'))
    if (mouths.length === 0) return 'no-seam'
    whispered = rng.pick(mouths)
    ties.tie(whispered, 'whispered')
    saw(whispered, { kind: 'sighting', target: culprit, room })
  }
  if (sweetheart >= 0) {
    // Alone, they say, and somewhere else — and the one they were with says
    // they were alone too, where they truly were. Somebody honest saw the
    // Sweetheart where they really spent the hour, which gives both the lie.
    const room = rng
      .shuffle(allRooms)
      .find(
        (r) =>
          r !== sceneRoom &&
          r !== theftRoom &&
          r !== locked &&
          r !== locations[sweetheart] &&
          traceRooms.get(r) !== cast[sweetheart].trait,
      )
    if (!room) return 'lie-room'
    lies.set(sweetheart, { room, companions: [] })
    const seers = honestIds.filter((c) => ties.free(c, 'seeSweetheart') && locations[c] !== locations[sweetheart])
    if (seers.length === 0) return 'no-seam'
    saw(rng.pick(seers), { kind: 'sighting', target: sweetheart, room: locations[sweetheart] })
  }
  // With their kind friend, they say, in the friend's room.
  if (clung >= 0) lies.set(clung, { room: locations[clingerOf], companions: [clingerOf] })
  if (clinger >= 0) {
    // Somebody honest saw the Clinger where they really were, which gives them
    // both the lie (and who will say so: nobody paid to keep quiet).
    const seers = honestIds.filter((c) => ties.free(c, 'seeClinger') && locations[c] !== locations[clinger])
    if (seers.length === 0) return 'no-seam'
    const seer = rng.pick(seers)
    ties.tie(seer, 'sawClinger')
    saw(seer, { kind: 'sighting', target: clinger, room: locations[clinger] })
  }
  if (forger >= 0) {
    // Made to order: the murderer's own mark, in the room the murderer means
    // to claim — an empty one, where nothing true can gainsay it.
    const empty = rng.shuffle(
      allRooms.filter((r) => !occupiedRooms.has(r) && r !== sceneRoom && r !== theftRoom && r !== locked),
    )
    const room = empty[0]
    if (!room) return 'lie-room'
    lies.set(culprit, { room, companions: [] })
    evidence.push({
      id: 'trace-forged',
      room,
      name: traitDef(cast[culprit].trait)?.evidenceName ?? 'a telltale trace',
      fact: {
        kind: 'trace',
        room,
        attr: { kind: 'trait', trait: cast[culprit].trait },
        givenBy: forger,
      },
      heldBy: forger,
      forged: true,
    })
  }
  const loneLiars = cast
    .map((m) => m.id)
    .filter((c) => truthClassOf(roles[c]) === 'concealer' && !lies.has(c))
    // (The Careful Murderer chooses first, and nobody else chooses the same.)
    .sort((a, b) => Number(careful && b === culprit) - Number(careful && a === culprit))
  for (const c of loneLiars) {
    // A liar never claims a room holding a trace that would fit them: a trace
    // that bears out an account must always be bearing out a true one.
    const fitsMe = (r: RoomId) => traceRooms.get(r) === cast[c].trait
    // Nor the scene itself, though nobody was in it (as when the murderer came
    // by the passage): nobody innocent of it would put themselves there.
    const carefulRoom = careful && c !== culprit ? lies.get(culprit)?.room : undefined
    // Nor a room that was locked all evening.
    const emptyRooms = allRooms.filter(
      (r) => !occupiedRooms.has(r) && r !== sceneRoom && r !== carefulRoom && r !== locked,
    )
    // The Careful Murderer was somewhere nobody was, nor was robbed: no
    // account in the house will meet theirs.
    if (careful && c === culprit) {
      const quiet = emptyRooms.filter((r) => r !== theftRoom)
      if (quiet.length === 0) return 'lie-room'
      lies.set(c, { room: rng.pick(quiet), companions: [] })
      continue
    }
    const occupiedOptions = allRooms.filter(
      (r) =>
        occupiedRooms.has(r) &&
        r !== sceneRoom &&
        r !== theftRoom &&
        r !== locations[c] &&
        !fitsMe(r),
    )
    // The culprit leans toward an occupied room: that collision is the
    // opportunity-breaking contradiction the accusation phase depends on.
    const occupiedChance = c === culprit ? 0.75 : 0.5
    const preferred = rng.chance(occupiedChance) && occupiedOptions.length > 0 ? occupiedOptions : emptyRooms
    // (Where the one kind of room is all taken, the other will do.)
    const pool = preferred.length > 0 ? preferred : occupiedOptions.length > 0 ? occupiedOptions : emptyRooms
    if (pool.length === 0) return 'lie-room'
    lies.set(c, { room: rng.pick(pool), companions: [] })
  }

  // The Porter knows the rooms: whether one stood empty all hour, or was in
  // use. Most often a room somebody says, falsely, they were in alone (it stood
  // empty), or one they say they were in that somebody else truly had.
  if (porter >= 0) {
    const pr = rng.fork('porter')
    // (Never the room the Careful Murderer says they had: nobody's account catches them.)
    const hidden = careful ? lies.get(culprit)?.room : undefined
    const open = (r: RoomId) => r !== sceneRoom && r !== locations[porter] && r !== hidden
    const claimed = [...lies.values()].map((l) => l.room).filter(open)
    const rooms = allRooms.filter(open)
    const room = claimed.length > 0 && pr.chance(0.7) ? pr.pick(claimed) : pr.pick(rooms)
    knowledge[porter].push({ kind: 'roomState', room, occupied: locations.includes(room) })
  }
  // The Spinster knows who spent the hour with whom: most often a pair worth
  // knowing about (two who say they were together, or two who were and say
  // not); else two who were apart, which tells against nobody.
  if (spinster >= 0) {
    const sp = rng.fork('spinster')
    const key = (a: CharId, b: CharId): [CharId, CharId] => (a < b ? [a, b] : [b, a])
    const telling = new Map<string, [CharId, CharId]>()
    const note = (a: CharId, b: CharId) => {
      if (a < 0 || b < 0 || a === spinster || b === spinster) return
      telling.set(key(a, b).join(','), key(a, b))
    }
    for (const [c, l] of lies) for (const o of l.companions) note(c, o)
    note(sweetheart, sweetheartOf)
    note(companion, companionOf)
    const worth = [...telling.values()]
    const others = cast.map((m) => m.id).filter((c) => c !== spinster)
    const apart = others.flatMap((a) => others.filter((b) => b > a && locations[a] !== locations[b]).map((b) => key(a, b)))
    const pair = worth.length > 0 && sp.chance(0.7) ? sp.pick(worth) : sp.pick(apart)
    knowledge[spinster].push({ kind: 'together', pair, together: locations[pair[0]] === locations[pair[1]] })
  }

  return { occupiedRooms, lies, kept, whispered, loneLiars }
}

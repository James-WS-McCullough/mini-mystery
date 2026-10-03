// One phase of dealing a night (see generate.ts).

import { ROLES } from '../roles'
import { liesAboutWhereabouts, truthClassOf } from '../deck'
import type { EvidenceItem, Relationship, RoomId } from '../types'
import type { AfterPlacing } from './night'
import { LEFT_EARLY_IN_TURN, LEFT_LATER_IN_TURN, TAKEN_IN_TURN, partOf } from '../parts'
import type { Rng } from '../rng'
import type { TraitDef } from '../../content/schema'

/** The night as what is to be found is laid about the place (see Part.leaves, Part.takes). */
export type Laying = AfterPlacing & {
  evidence: EvidenceItem[]
  traitDef(id: string): TraitDef | undefined
  /** The locked room's stream: settled after anything is left, before anything is taken up. */
  lockRng?: Rng
  /** The key to the locked room, where there is one. */
  keyItem: EvidenceItem | undefined
}

/** What is to be found in the rooms. */
export function layEvidence(night: AfterPlacing) {
  const {
    rng, kind, lock, pack, roles, hoax, hoaxer, committee, members, culprit, sceneRoom, ownHand, method, cast,
    passageNight, viaPassage, thief, begrudged, martyr, relationships, motiveSubject, thiefMotive, allRooms,
    theftRoom, locations, companions, heldRoom, truth, ties,
  } = night
  // ---- physical evidence ----
  const traitDef = (id: string) => pack.traits.find((t) => t.id === id)
  const evidence: EvidenceItem[] = []
  // The scene tells HOW it was done, and nothing of who: the killer left the
  // weapon and no trace of themselves.
  // — unless the Cleaner has been there first, and carried it off to wherever
  // they spent the hour.
  const carrier = roles.findIndex((r) => partOf(r).carriesTheWeapon)
  const weaponRoom = carrier >= 0 ? locations[carrier] : sceneRoom
  evidence.push({
    id: 'weapon',
    room: weaponRoom,
    name: method.weaponName,
    fact:
      carrier >= 0
        ? { kind: 'weapon', means: method.means, method: method.id, foundIn: weaponRoom }
        : { kind: 'weapon', means: method.means, method: method.id },
  })
  // A note beside him, to say he did it himself. Where he truly did, it is
  // in his own hand; where the Artful Murderer did it for him, it is not.
  if (ownHand) {
    evidence.push({
      id: 'note',
      room: sceneRoom,
      name: pack.suicideNote ?? 'a note beside him: “Forgive me.”',
      fact: { kind: 'suicideNote' },
    })
  }
  // What some parts leave about the place, each in turn.
  const laying: Laying = { ...night, traitDef, evidence, keyItem: undefined }
  for (const role of LEFT_EARLY_IN_TURN) {
    const me = roles.indexOf(role)
    if (me < 0) continue
    const failed = partOf(role, kind).leaves?.(laying, me)
    if (failed) return failed
  }
  const bribed = ties.holding(['bribed'])[0] ?? -1
  // Anyone who truly spent the window alone left some trace of themselves
  // where they were — which is what bears out a lonely alibi. Not the loner:
  // nothing vouches for them, not even the furniture. Not the thief either,
  // whose mark on the room is the lockbox.
  const traceRooms = new Map<RoomId, string>()
  for (const m of cast) {
    const c = m.id
    const wentByPassage = viaPassage && c === culprit
    // (Some leave nothing, ever; and one who lies about it, but owns up, always does.)
    const trace = ROLES[roles[c]].trace
    if (trace === 'never' || (liesAboutWhereabouts(roles[c]) && !wentByPassage && trace !== 'always')) continue
    if (companions[c].length > 0) continue
    traceRooms.set(locations[c], m.trait)
    evidence.push({
      id: `trace-${locations[c]}`,
      room: locations[c],
      name: traitDef(m.trait)?.evidenceName ?? 'a telltale trace',
      fact: { kind: 'trace', room: locations[c], attr: { kind: 'trait', trait: m.trait } },
    })
  }
  // The passage: from the scene to the room where the murderer spent the
  // hour — or to a room where somebody else did, alone, who never used it.
  let passageRoom: RoomId | null = null
  if (passageNight) {
    if (viaPassage) passageRoom = locations[culprit]
    else {
      const lonely = cast
        .map((m) => m.id)
        .filter(
          (c) =>
            !ROLES[roles[c]].alone &&
            ties.free(c, 'passageEnd') &&
            truthClassOf(roles[c]) === 'honest' &&
            companions[c].length === 0 &&
            traceRooms.has(locations[c]),
        )
      if (lonely.length === 0) return 'no-passage'
      passageRoom = locations[rng.pick(lonely)]
    }
    evidence.push({
      id: 'passage',
      room: passageRoom,
      name: pack.passageItem ?? 'a panel in the wall that swings inward on a dark passage',
      fact: { kind: 'passage', room: passageRoom },
    })
    truth.passage = { room: passageRoom, used: viaPassage }
  }
  for (const role of LEFT_LATER_IN_TURN) {
    const me = roles.indexOf(role)
    if (me < 0) continue
    const failed = partOf(role, kind).leaves?.(laying, me)
    if (failed) return failed
  }
  // Every other box worth forcing is found as it should be: proof, if anybody
  // owns to a theft in that room, that there was none.
  for (const room of pack.valuableRooms) {
    if (room === theftRoom || room === sceneRoom) continue
    evidence.push({
      id: `lockbox-${room}`,
      room,
      name: 'a lockbox, locked and untouched',
      fact: { kind: 'lockboxIntact', room },
    })
  }
  // What the grievance was written on. Chosen from a stream of its own, and
  // never the same paper twice in one house.
  const papers = rng.fork('papers')
  const usedPapers = new Set<string>()
  const motiveItem = (rel: Relationship): string => {
    const all = pack.motiveItems[rel] ?? []
    const fresh = all.filter((name) => !usedPapers.has(name))
    const name = (fresh.length > 0 ? papers.pick(fresh) : all[0]) ?? 'a compromising document'
    usedPapers.add(name)
    return name
  }
  // ---- a locked room ----
  // A room with papers in it is locked tonight, and its key has gone missing:
  // nothing in it can be found until the key is. Nobody spent the hour in it.
  // Whose papers, the murderer's or another's, is a toss: the locked door
  // must not say which. (The details are drawn from a stream of their own;
  // forking it moves the main stream on by one draw, like any fork.)
  const lockRng = rng.fork('lock')
  // (On a night he is not dead, the locked door is his own, and holds no papers.)
  const lockTonight = lock.tonight && !hoax
  const lockOthers = lock.others
  const occupied = new Set(locations)
  const lockable = (r: RoomId) => r !== sceneRoom && r !== theftRoom && r !== passageRoom && !occupied.has(r)
  // A second motive document for a red herring with a grudge of their own.
  // (On the Committee's night, a second of them: their cause was shared.)
  // Settled before any paper is put anywhere, so that the room held back for
  // the locked door is the one the locked papers go into.
  const herringDocSubject =
    committee ? members[1] : martyr >= 0 ? martyr : begrudged >= 0 ? begrudged : thiefMotive ? thief : -1
  // (How the one who takes the blame stood with him is always on paper: it
  // is what shows them to have had cause — or none.)
  const herringDoc =
    herringDocSubject >= 0 && pack.docRooms.length > 1 && (martyr >= 0 || rng.chance(0.7))
  /** Whose papers go behind the locked door: another's, where there are any. */
  const lockHerring = lockTonight && lockOthers && herringDoc
  const behindTheDoor = lockTonight && heldRoom !== null ? heldRoom : null
  const docRoom =
    behindTheDoor !== null && !lockHerring
      ? behindTheDoor
      : rng.pick(pack.docRooms.filter((r) => r !== behindTheDoor))
  evidence.push({
    id: 'doc-motive',
    room: docRoom,
    name: motiveItem(relationships[motiveSubject]),
    fact: { kind: 'motiveDocument', subject: motiveSubject, rel: relationships[motiveSubject] },
  })
  // Something he truly wrote, among his papers: set beside the note, it shows
  // the note for a forgery. Where the note is his own, there is nothing of
  // the kind to be found.
  if (kind === 'artful') {
    evidence.push({
      id: 'hand',
      room: docRoom,
      name: (pack.handSample ?? 'a letter in {victim}’s own hand').replace('{victim}', pack.victim.shortName),
      fact: { kind: 'handSample' },
    })
  }
  let herringRoom: RoomId | null = null
  if (herringDoc) {
    const elsewhere = pack.docRooms.filter((r) => r !== docRoom && r !== behindTheDoor)
    herringRoom =
      lockHerring && behindTheDoor !== null
        ? behindTheDoor
        : rng.pick(elsewhere.length > 0 ? elsewhere : pack.docRooms.filter((r) => r !== docRoom))
    evidence.push({
      id: 'doc-herring',
      room: herringRoom,
      name: motiveItem(relationships[herringDocSubject]),
      fact: {
        kind: 'motiveDocument',
        subject: herringDocSubject,
        rel: relationships[herringDocSubject],
      },
    })
  }
  // How his lordship stood with whoever helped him fake it: on paper.
  if (hoax) {
    evidence.push({
      id: 'doc-fond',
      room: rng.pick(pack.docRooms),
      name: motiveItem('devoted'),
      fact: { kind: 'motiveDocument', subject: hoaxer, rel: 'devoted' },
    })
  }
  let locked: RoomId | null = null
  if (hoax) {
    // He is behind a locked door, and has the only key: nobody has seen it,
    // and nobody will find it. Nobody else was in there, and nothing else is.
    const papered = new Set(evidence.map((e) => e.room))
    const hiding = allRooms.filter((r) => lockable(r) && !papered.has(r))
    if (hiding.length === 0) return 'no-lock'
    locked = lockRng.pick(hiding)
    truth.locked = locked
  } else if (lockTonight) {
    const order = lockOthers ? [herringRoom, docRoom] : [docRoom, herringRoom]
    locked = order.find((r): r is RoomId => r !== null && lockable(r)) ?? null
    // (Every room with papers in it was in use: try the night another way.)
    if (locked === null) return 'no-lock'
    {
      const where = lockRng.pick(allRooms.filter((r) => r !== locked && r !== sceneRoom))
      const name = pack.rooms.find((r) => r.id === locked)?.name ?? locked
      evidence.push({
        id: 'key',
        room: where,
        name: (pack.keyItem ?? 'the key to {room}, on a brass ring').replace('{room}', name),
        fact: { kind: 'key', room: locked },
      })
      truth.locked = locked
    }
  }
  const evidencedRooms = new Set(evidence.map((e) => e.room))
  // (Nothing is left lying behind a door nobody will open.)
  for (const room of rng.sample(allRooms.filter((r) => !evidencedRooms.has(r) && !(hoax && r === locked)), 2)) {
    evidence.push({ id: `flavor-${room}`, room, name: rng.pick(pack.flavorItems), fact: { kind: 'flavor' } })
  }

  // And what some take up before the detective can find it.
  const keyItem = evidence.find((e) => e.id === 'key')
  laying.lockRng = lockRng
  laying.keyItem = keyItem
  for (const role of TAKEN_IN_TURN) {
    const me = roles.indexOf(role)
    if (me >= 0) partOf(role, kind).takes?.(laying, me)
  }

  return {
    traitDef, evidence, weaponRoom, bribed, traceRooms, passageRoom, papers, usedPapers, motiveItem, lockRng,
    lockTonight, lockOthers, occupied, lockable, herringDocSubject, herringDoc, lockHerring, behindTheDoor,
    docRoom, herringRoom, locked, evidencedRooms, keyItem,
  }
}

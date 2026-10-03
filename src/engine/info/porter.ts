// The Porter: kept an eye on one door, and knows whether anybody went in.
import type { RoomId } from '../types'
import type { InfoPart } from './part'

export const porter: InfoPart = {
  knowsOfTheLies({ rng, careful, lies, culprit, sceneRoom, locations, allRooms }, porter) {
    // Most often a room somebody says, falsely, they were in alone (it stood
    // empty), or one they say they were in that somebody else truly had.
    const pr = rng.fork('porter')
    // (Never the room the Careful Murderer says they had: nobody's account catches them.)
    const hidden = careful ? lies.get(culprit)?.room : undefined
    const open = (r: RoomId) => r !== sceneRoom && r !== locations[porter] && r !== hidden
    const claimed = [...lies.values()].map((l) => l.room).filter(open)
    const rooms = allRooms.filter(open)
    const room = claimed.length > 0 && pr.chance(0.7) ? pr.pick(claimed) : pr.pick(rooms)
    return { kind: 'roomState', room, occupied: locations.includes(room) }
  },
  fabricate({ rng, sceneRoom, rooms }) {
    // A room said to have stood empty that was in use, or the other way about.
    const choices = (rooms?.all ?? []).filter((r) => r !== sceneRoom)
    if (choices.length === 0) return null
    const room = rng.pick(choices)
    return { kind: 'roomState', room, occupied: !rooms!.used.has(room) }
  },
  careful({ rng, locations, sceneRoom, others }) {
    // A room somebody truly had: a room said to be in use gives nobody the lie.
    const had = others.map((c) => locations[c]).filter((r) => r !== sceneRoom)
    return had.length > 0 ? { kind: 'roomState', room: rng.pick(had), occupied: true } : null
  },
}

// Dealing the evening around a night already dealt (see types.ts). The hour
// it was done is the night's own: everybody is where the night put them, and
// says what the night has them say of it. The other hours are new, and told
// truly by everybody: the lies of the night are all in the one hour, which is
// why it is worth finding.

import type { SettingPack } from '../../content/schema'
import { ROLES } from '../roles'
import { Rng } from '../rng'
import type { CharId, EvidenceItem, Mystery, RoomId } from '../types'
import { EVENING_SLOTS, EVICTIM, UPSTAIRS, type EClaim, type EPlace, type Evening } from './types'

const NUMBERS = ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve']

/** When the setting's window begins, in minutes after midnight (from "Between 6:30 and 7:30 p.m."). */
export function windowStart(pack: SettingPack): number {
  const m = /Between (\d{1,2})(?::(\d{2}))?/.exec(pack.windowClock)
  const h = m ? Number(m[1]) : 6
  const pm = /p\.m\./.test(pack.windowClock) && h < 12
  return ((pm ? h + 12 : h) % 24) * 60 + (m?.[2] ? Number(m[2]) : 0)
}

const h12 = (min: number) => {
  const h = Math.floor(min / 60) % 12
  return h === 0 ? 12 : h
}
/** "4:30". */
export function clockOf(min: number): string {
  return `${h12(min)}:${String(min % 60).padStart(2, '0')}`
}
/** "half past four", "ten past four", "twenty to five", "four o’clock". */
export function timeWords(min: number): string {
  const m = min % 60
  const here = NUMBERS[h12(min)]
  const next = NUMBERS[h12(min + 60)]
  if (m === 0) return `${here} o’clock`
  if (m === 30) return `half past ${here}`
  if (m === 15) return `a quarter past ${here}`
  if (m === 45) return `a quarter to ${next}`
  const say = (n: number) => (n === 25 ? 'twenty-five' : n === 20 ? 'twenty' : n === 10 ? 'ten' : n === 5 ? 'five' : String(n))
  return m < 30 ? `${say(m)} past ${here}` : `${say(60 - m)} to ${next}`
}

/** Liars of the night: whoever's story of the hour is not the truth of it. */
function truthful(m: Mystery, c: CharId): boolean {
  const g = m.guests[c]
  const t = g.truth.where
  const w = g.told.where
  if (!w || w.room !== t.room) return false
  const a = [...w.companions].sort().join()
  const b = [...t.companions].sort().join()
  return a === b && !ROLES[g.truth.role].evil
}

export function dealEvening(m: Mystery, pack: SettingPack): Mystery {
  const rng = new Rng(`${m.seed}:evening`)
  const n = m.cast.length
  const S = EVENING_SLOTS
  const start = windowStart(pack) - (S - 1) * 60
  const clock = Array.from({ length: S + 1 }, (_, i) => clockOf(start + i * 60))
  const words = Array.from({ length: S + 1 }, (_, i) => timeWords(start + i * 60))
  // The hour it was done: not the first two, so that there is an evening before it to go through.
  const murder = 2 + rng.int(S - 2)
  const truth = m.truth
  const scenes = new Set<RoomId>([truth.sceneRoom, m.caseSheet.sceneRoom, ...(truth.moved ? [truth.moved] : [])])
  const open = pack.rooms.map((r) => r.id).filter((r) => r !== truth.locked)
  /** Where anybody may be at an hour: nowhere he lies, once it is done. */
  const allowed = (s: number) => open.filter((r) => s < murder || !scenes.has(r))

  // ---- where everybody truly was ----
  const schedule: EPlace[][] = Array.from({ length: n }, () => Array<EPlace>(S).fill(UPSTAIRS))
  const victim: (RoomId | null)[] = Array(S).fill(null)
  const gathering = rng.pick(allowed(S).length > 0 ? allowed(S) : open)
  for (let s = 0; s < S; s++) {
    if (s === murder) {
      for (let c = 0; c < n; c++) schedule[c][s] = truth.locations[c]
      victim[s] = truth.sceneRoom
      continue
    }
    const rooms = allowed(s)
    const taken: RoomId[] = []
    for (const c of rng.shuffle([...Array(n).keys()])) {
      const before = s > 0 ? schedule[c][s - 1] : null
      let place: EPlace
      if (s === 0) place = rng.chance(0.8) ? gathering : rng.pick(rooms)
      else if (before !== null && (before === UPSTAIRS || rooms.includes(before)) && rng.chance(0.5)) place = before
      else if (rng.chance(0.15)) place = UPSTAIRS
      else if (taken.length > 0 && rng.chance(0.5)) place = rng.pick(taken)
      else place = rng.pick(rooms)
      schedule[c][s] = place
      if (place !== UPSTAIRS) taken.push(place)
    }
    if (s < murder) {
      // He goes where there is company; and the hour before, he is with somebody honest, who sees him leave.
      // (The hour before, not where it is to be done: he is seen to leave for it.)
      const fit = (r: RoomId) => s !== murder - 1 || !scenes.has(r)
      const company = taken.filter(fit).length > 0 ? taken.filter(fit) : rooms.filter(fit)
      victim[s] = s === 0 && fit(gathering) ? gathering : rng.chance(0.5) && victim[s - 1] && company.includes(victim[s - 1]!) ? victim[s - 1] : rng.pick(company)
    }
  }
  // The hour before: somebody honest with him, to see him go.
  const honest = [...Array(n).keys()].filter((c) => truthful(m, c) && m.truth.locations[c] !== truth.sceneRoom)
  const before = murder - 1
  const keep = victim[before]!
  if (!honest.some((c) => schedule[c][before] === keep)) {
    const pool = honest.length > 0 ? honest : [...Array(n).keys()]
    const who = rng.pick(pool)
    const at = schedule[who][before]
    if (at === UPSTAIRS || scenes.has(at) || !allowed(before).includes(at)) schedule[who][before] = keep
    else victim[before] = at
  }

  // ---- who was with whom ----
  const companyAt = (c: CharId, s: number): number[] => {
    if (s === murder) return [...truth.companions[c]].sort((a, b) => a - b)
    const p = schedule[c][s]
    if (p === UPSTAIRS) return []
    const out: number[] = []
    for (let o = 0; o < n; o++) if (o !== c && schedule[o][s] === p) out.push(o)
    if (victim[s] === p) out.push(EVICTIM)
    return out
  }

  // ---- as they tell it ----
  const told: EClaim[][] = []
  for (let c = 0; c < n; c++) {
    type Hour = Extract<EClaim, { kind: 'stay' | 'blank' }>
    const hours: Hour[] = []
    for (let s = 0; s < S; s++) {
      if (s === murder) {
        const w = m.guests[c].told.where
        hours.push(w ? { kind: 'stay', from: s, to: s, room: w.room, with: [...w.companions].sort((a, b) => a - b) } : { kind: 'blank', from: s, to: s })
      } else hours.push({ kind: 'stay', from: s, to: s, room: schedule[c][s], with: companyAt(c, s) })
    }
    // A run of hours in one place, with the same company, is one stretch.
    const merged: Hour[] = []
    for (const h of hours) {
      const last = merged[merged.length - 1]
      const same = last && last.to === h.from - 1 && (last.kind === 'blank' ? h.kind === 'blank' : h.kind === 'stay' && last.room === h.room && last.with.join() === h.with.join())
      if (same) last.to = h.to
      else merged.push({ ...h })
    }
    const said: EClaim[] = merged
    // The last they saw of him.
    let seen: EClaim | null = null
    for (let s = 0; s < murder; s++) {
      if (schedule[c][s] === victim[s]) seen = { kind: 'lastSeen', slot: s, room: victim[s]! }
    }
    if (schedule[c][before] === victim[before] && victim[before] !== truth.sceneRoom) {
      seen = { kind: 'lastSeen', slot: murder, room: victim[before]!, left: true }
    }
    if (seen) said.push(seen)
    told.push(said)
  }

  // ---- what tells the time ----
  // The doctor gives a latest hour, never the hour itself (but where it is the last).
  let hasWatch = rng.chance(0.5)
  const latest = Math.min(S - 1, murder + 1 + rng.int(2))
  // Without the watch, somebody honest heard the cry; now and then, with it too.
  // (With nobody honest to hear it, the watch it is.)
  const ears = honest.filter((c) => !scenes.has(schedule[c][murder]))
  if (ears.length === 0) hasWatch = true
  else if (!hasWatch || rng.chance(0.3)) {
    told[rng.pick(ears)].push({ kind: 'heard', slot: murder, time: timeWords(start + murder * 60 + 5 * (1 + rng.int(11))) })
  }
  const evidence: EvidenceItem[] = [...m.evidence]
  let watch: Evening['watch'] = null
  if (hasWatch) {
    const at = start + murder * 60 + 5 * (1 + rng.int(11))
    const time = timeWords(at)
    const item: EvidenceItem = {
      id: 'evening-watch',
      room: m.caseSheet.sceneRoom,
      name: `a wristwatch, its glass smashed, stopped at ${time}`,
      fact: { kind: 'flavor' },
    }
    evidence.push(item)
    watch = { item: item.id, slot: murder, time }
  }
  const evening: Evening = { clock, words, murder, schedule, victim, told, latest, watch }
  return {
    ...m,
    evidence,
    caseSheet: { ...m.caseSheet, windowLabel: `some time between ${words[0]} and ${words[S]}, though nobody can yet say when` },
    evening,
  }
}

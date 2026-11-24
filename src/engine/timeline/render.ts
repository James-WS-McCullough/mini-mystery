// What the guests say, in words: every sentence rendered from one claim, and
// never adding to it. (One plain voice for the playtest; the manners of
// speaking come once the evening plays well.)

import { SLOT_CLOCK, SLOT_WORDS, VICTIM, type TClaim, type TimelineCase } from './types'

/** "seven", "half past eight". */
export const slotWord = (t: number): string => SLOT_WORDS[t] ?? 'late'
/** "7:00 to 8:30" for a stretch of slots. */
export const span = (from: number, to: number): string =>
  from === to ? SLOT_CLOCK[from] : `${SLOT_CLOCK[from]} to ${SLOT_CLOCK[to + 1] ?? '11:00'}`

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** A room by name: "the library", "the Major's room upstairs" (or "my room", to its own guest). */
export function roomName(tc: TimelineCase, room: string, speaker?: number): string {
  const r = tc.rooms.find((x) => x.id === room)
  if (!r) return room
  if (r.bed !== undefined) return r.bed === speaker ? 'my room upstairs' : `${tc.cast[r.bed].shortName}’s room upstairs`
  return r.name
}

/** Where, as a phrase: "in the library", "on the garden terrace", "in my room upstairs". */
export function inPlace(tc: TimelineCase, room: string, speaker?: number): string {
  const r = tc.rooms.find((x) => x.id === room)
  if (r?.bed === undefined && r?.where) return r.where
  return `in ${roomName(tc, room, speaker)}`
}

/** Who, by name: the victim by his short name. */
export function who(tc: TimelineCase, c: number): string {
  return c === VICTIM ? tc.victimShort : tc.cast[c].shortName
}

/** "the Major and Lord Blackwood". */
function names(tc: TimelineCase, ids: readonly number[]): string {
  const all = ids.map((c) => who(tc, c))
  return all.length > 1 ? `${all.slice(0, -1).join(', ')} and ${all.at(-1)}` : (all[0] ?? '')
}

/** One claim, as the speaker says it. */
export function sayClaim(tc: TimelineCase, speaker: number, claim: TClaim): string {
  const him = tc.victimPronouns === 'she' ? 'her' : tc.victimPronouns === 'they' ? 'them' : 'him'
  switch (claim.kind) {
    case 'stay': {
      const room = roomName(tc, claim.room, speaker)
      // Dinner, with everybody.
      if (claim.from === 0 && claim.with.length >= tc.cast.length - 1) {
        return claim.to === 0
          ? `At seven we all sat down to dinner in ${room}.`
          : `We all sat at dinner in ${room} from seven until ${slotWord(claim.to + 1)}.`
      }
      const bed = tc.rooms.find((r) => r.id === claim.room)?.bed === speaker
      const everyone = claim.with.filter((c) => c !== VICTIM).length >= tc.cast.length - 1
      const company = everyone
        ? ` with all the others${claim.with.includes(VICTIM) ? ` and ${tc.victimShort}` : ''}`
        : claim.with.length > 0
          ? ` with ${names(tc, claim.with)}`
          : bed
            ? ''
            : ', alone'
      const when =
        claim.from === claim.to ? `At ${slotWord(claim.from)}` : `From ${slotWord(claim.from)} until ${slotWord(claim.to + 1)}`
      if (bed) return `${when} I was in ${room}: I had gone up to bed.`
      return `${when} I was ${inPlace(tc, claim.room, speaker)}${company}.`
    }
    case 'saw':
      return `I remember, too: at ${slotWord(claim.slot)} I saw ${who(tc, claim.target)} ${inPlace(tc, claim.room, speaker)}.`
    case 'lastSeen':
      return claim.slot === 0
        ? `Not since dinner. The last I saw of ${him} was at the table.`
        : `The last I saw of ${him} was at ${slotWord(claim.slot)}, ${claim.room === tc.scene ? `going into ${roomName(tc, claim.room, speaker)}` : inPlace(tc, claim.room, speaker)}. ${cap(tc.victimPronouns === 'she' ? 'she' : tc.victimPronouns === 'they' ? 'they' : 'he')} was alive then.`
    case 'found':
      return `At ${slotWord(claim.slot)} I went into ${roomName(tc, claim.room, speaker)}, and found ${him} dead. I raised the alarm.`
    case 'empty':
      return `At ${slotWord(claim.slot)} I looked ${inPlace(tc, claim.room, speaker).replace(/^in /, 'into ')}. There was nobody there.`
  }
}

/** A run of claims, as one telling. */
export function sayAll(tc: TimelineCase, speaker: number, claims: readonly TClaim[]): string {
  return claims.map((c) => sayClaim(tc, speaker, c)).join(' ')
}

/** A claim as the notebook puts it: "8:30 to 9:30 · the library, alone". */
export function noteOf(tc: TimelineCase, speaker: number, claim: TClaim): string {
  switch (claim.kind) {
    case 'stay':
      return `${span(claim.from, claim.to)} · ${roomName(tc, claim.room, speaker)}${claim.with.length > 0 ? `, with ${names(tc, claim.with)}` : ', alone'}`
    case 'saw':
      return `${SLOT_CLOCK[claim.slot]} · saw ${who(tc, claim.target)} in ${roomName(tc, claim.room, speaker)}`
    case 'lastSeen':
      return `${SLOT_CLOCK[claim.slot]} · last saw ${tc.victimShort} alive, in ${roomName(tc, claim.room, speaker)}`
    case 'found':
      return `${SLOT_CLOCK[claim.slot]} · found ${tc.victimShort} dead in ${roomName(tc, claim.room, speaker)}`
    case 'empty':
      return `${SLOT_CLOCK[claim.slot]} · ${roomName(tc, claim.room, speaker)} was empty`
  }
}

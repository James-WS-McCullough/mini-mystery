// The evening in words: a guest's account, a sentence to a claim, and the
// death window as the clues stand.

import { inRoom, type RenderCtx } from '../render'
import type { CharId, EvidenceItem } from '../types'
import { EVICTIM, UPSTAIRS, type EClaim, type EHeard, type Evening, type EPlace } from './types'

function nameOf(ctx: RenderCtx, c: number): string {
  return c === EVICTIM ? ctx.mystery.victim.shortName : ctx.mystery.cast[c].shortName
}
function list(names: string[]): string {
  return names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}
/** "in the library", "in my own room". */
export function placeIn(ctx: RenderCtx, p: EPlace, own = true): string {
  return p === UPSTAIRS ? (own ? 'in my own room' : 'in their own room') : inRoom(ctx, p)
}
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
/** "from three o’clock until five", "at four o’clock". */
export function span(ev: Evening, from: number, to: number): string {
  return to > from ? `from ${ev.words[from]} until ${ev.words[to + 1]}` : `from ${ev.words[from]} until ${ev.words[from + 1]}`
}

/** One claim, in the speaker's words. */
export function sayEvening(ctx: RenderCtx, speaker: CharId, c: EClaim): string {
  const ev = ctx.mystery.evening!
  const him = ctx.mystery.victim.pronouns === 'she' ? 'her' : ctx.mystery.victim.pronouns === 'they' ? 'them' : 'him'
  const he = ctx.mystery.victim.pronouns === 'she' ? 'she' : ctx.mystery.victim.pronouns === 'they' ? 'they' : 'he'
  switch (c.kind) {
    case 'stay': {
      const where = placeIn(ctx, c.room)
      const others = c.with.filter((x) => x !== speaker).map((x) => nameOf(ctx, x))
      const company = c.room === UPSTAIRS ? ', alone' : others.length > 0 ? `, with ${list(others)}` : ', and nobody else was there'
      return `${cap(span(ev, c.from, c.to))} I was ${where}${company}.`
    }
    case 'blank':
      return `${cap(span(ev, c.from, c.to))}, I honestly could not tell you where I was.`
    case 'lastSeen':
      return c.left
        ? `${cap(he)} left us ${inRoom(ctx, c.room)} at ${ev.words[c.slot]}, and that was the last I saw of ${him}.`
        : `The last I saw of ${him} was ${inRoom(ctx, c.room)}, at ${ev.words[c.slot]}.`
    case 'heard':
      return `At ${c.time}, or near it, I heard a cry from somewhere close by. I thought nothing of it at the time.`
  }
}

/** Short, for a note: "3:30–5:30 · library, with the Major". */
export function noteEvening(ctx: RenderCtx, c: EClaim): string {
  const ev = ctx.mystery.evening!
  const at = (from: number, to: number) => `${ev.clock[from]}–${ev.clock[to + 1]}`
  switch (c.kind) {
    case 'stay': {
      const others = c.with.map((x) => nameOf(ctx, x))
      return `${at(c.from, c.to)} · ${placeIn(ctx, c.room, false).replace(/^in /, '')}${others.length > 0 ? `, with ${list(others)}` : ', alone'}`
    }
    case 'blank':
      return `${at(c.from, c.to)} · cannot say`
    case 'lastSeen':
      return `${ev.clock[c.slot]} · last saw ${ctx.mystery.victim.shortName}${c.left ? ' leave' : ''} ${inRoom(ctx, c.room)}`
    case 'heard':
      return `${c.time} · heard a cry`
  }
}

/**
 * When it was done, as the clues stand, taking everybody at their word: no
 * earlier than the hour he was last seen alive, no later than the doctor's
 * hour or the watch's.
 */
export function deathWindow(ev: Evening, heard: readonly EHeard[], found: readonly EvidenceItem[]): { lo: number; hi: number } {
  let lo = 0
  let hi = ev.latest
  for (const h of heard) {
    if (h.claim.kind === 'lastSeen') lo = Math.max(lo, h.claim.slot)
    if (h.claim.kind === 'heard') hi = Math.min(hi, h.claim.slot)
  }
  if (ev.watch && found.some((e) => e.id === ev.watch!.item)) {
    lo = Math.max(lo, ev.watch.slot)
    hi = Math.min(hi, ev.watch.slot)
  }
  return { lo, hi: Math.max(lo, hi) }
}

/** The doctor's word, for the case file. */
export function doctorsWord(ev: Evening): string {
  return `The doctor will say only that it was done before ${ev.words[ev.latest + 1]}. Not when, before that.`
}

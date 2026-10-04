// One phase of dealing a night (see generate.ts).

import { isMotiveGrade, type CharId, type Relationship, type SoundKind } from '../types'
import { weightedPick, motivesOf } from './night'
import type { AfterSeats } from './night'

/** Why they had come, and how each of them stood with the dead man. */
export function settleFeelings(night: AfterSeats) {
  const {
    rng, pack, n, defs, hoax, hoaxer, nobody, committee, members, culprit, martyrLacks, cast, thief,
    begrudged, loner, martyr, honestIds, victim, opts,
  } = night
  // ---- the occasion: why they had all come ----
  // (Only the occasions that fit the dead: no will-signing for the housekeeper.)
  const occasions = (pack.occasions ?? []).filter((o) => !victim.occasions || victim.occasions.includes(o.id))
  const occasion = occasions.length > 0 ? weightedPick(rng.fork('occasion'), occasions) : null
  const event: SoundKind = occasion?.event ?? 'quarrel'

  // ---- relationships to the victim ----
  const relationships: Relationship[] = new Array(n).fill('cordial')
  // A motive is one that fits whoever has it: the bootboy was never jilted —
  // and one the occasion makes likelier: a will to be signed makes heirs.
  const motiveFor = (c: CharId): Relationship => {
    const fits = motivesOf(defs[c], victim)
    const weights = fits.map((rel) => (defs[c].motives?.[rel] ?? 1) * (occasion?.motives?.[rel] ?? 1))
    let roll = rng.next() * weights.reduce((a, b) => a + b, 0)
    let at = 0
    while (at < weights.length - 1 && roll >= weights[at]) {
      roll -= weights[at]
      at++
    }
    return fits[at]
  }
  // Whoever had the cause: the murderer — or, on a night with none, somebody
  // who had every reason and did nothing about it. Their grudge is on paper.
  const motiveSubject = committee
    ? members[0]
    : nobody
      ? rng.pick(cast.map((m) => m.id).filter((c) => c !== loner && c !== begrudged && c !== hoaxer))
      : culprit
  relationships[motiveSubject] = motiveFor(motiveSubject)
  // Every one of the Committee had cause.
  for (const m of members) relationships[m] = motiveFor(m)
  if (begrudged >= 0) relationships[begrudged] = motiveFor(begrudged)
  // Whoever means to take the blame had cause enough — unless that is the very
  // thing they lacked, and then nobody was fonder of the dead man.
  if (martyr >= 0) relationships[martyr] = martyrLacks === 'motive' ? 'devoted' : motiveFor(martyr)
  const thiefMotive = thief >= 0 && rng.chance(0.5)
  // (Whoever's grudge is to be on paper keeps it.)
  if (thief >= 0 && thief !== motiveSubject) relationships[thief] = thiefMotive ? motiveFor(thief) : 'strained'
  // The loner's herring is opportunity, not motive: they stay benign.
  const strainCandidates = honestIds.filter((c) => c !== begrudged && c !== loner && c !== motiveSubject)
  if (strainCandidates.length > 0) relationships[rng.pick(strainCandidates)] = 'strained'
  const devotedCandidates = strainCandidates.filter((c) => relationships[c] === 'cordial')
  if (devotedCandidates.length > 0 && rng.chance(0.6)) {
    relationships[rng.pick(devotedCandidates)] = 'devoted'
  }
  // Whoever helped him fake it did so out of love for him, and had no cause to kill him.
  if (hoax) relationships[hoaxer] = 'devoted'
  // Whoever the case says had cause, had it, whatever their part (not the
  // loner, whose herring is opportunity alone; nor whoever has it already).
  for (const pin of opts.pins ?? []) {
    const c = pin.motive && pin.character ? defs.findIndex((d) => d.id === pin.character) : -1
    if (c >= 0 && c !== loner && !isMotiveGrade(relationships[c]) && !(hoax && c === hoaxer)) relationships[c] = motiveFor(c)
  }

  return {
    occasions, occasion, event, relationships, motiveFor, motiveSubject, thiefMotive, strainCandidates,
    devotedCandidates,
  }
}

// One phase of dealing a night (see generate.ts).

import { isEvil, truthClassOf } from '../deck'
import { isMotiveGrade } from '../types'
import type { CharId, Claim } from '../types'
import { KEPT_BACK, pointsAt } from './night'
import type { AfterLies } from './night'
import { POINTED_IN_TURN, partOf } from '../parts'

/** The night as whom each suspects is settled (see Part.pointsAt). */
export type Suspecting = AfterLies & {
  /** Whom each suspects. */
  suspicionTarget: Map<CharId, CharId>
  /** What somebody knows against the one they suspect, and tells only when asked whom. */
  grounds: Map<CharId, Claim[]>
  /** Whom those with nobody to suspect would answer for. */
  trusts: Map<CharId, CharId>
}

/** Whom each of them suspects, or answers for. */
export function pointFingers(night: AfterLies) {
  const {
    rng, roles, culprit, cast, shadyIds, relationships, bribed, knowledge, victims, fabricated, whispered,
    kind,
  } = night
  // Suspicion targets: accusers/deflectors point fingers; hedgers/theorists
  // name a lead suspect among their scenarios. Same surface, either alignment.
  // Whom each of them suspects. Most suspect somebody: whoever they know
  // something against, or else whoever looks worst to them — which is as
  // often a herring as the murderer, and sometimes nobody in particular. It
  // points the detective at the guests worth a second look, and at no one guest.
  const suspicionTarget = new Map<CharId, CharId>()
  /** What somebody knows against the one they suspect, and tells only when asked whom. */
  const grounds = new Map<CharId, Claim[]>()
  /** Whom those with nobody to suspect would answer for — rightly or wrongly. */
  const trusts = new Map<CharId, CharId>()
  for (const m of cast) {
    if (!rng.chance(0.85)) {
      trusts.set(m.id, rng.pick(cast.map((x) => x.id).filter((o) => o !== m.id)))
      continue
    }
    const c = m.id
    const honestly = truthClassOf(roles[c]) === 'honest'
    const against = honestly
      ? [...new Set(knowledge[c].flatMap((k) => pointsAt(k, c)))]
      : []
    if (against.length > 0 && rng.chance(0.7)) {
      suspicionTarget.set(c, rng.pick(against))
      continue
    }
    /** Somebody they know to be innocent, or on good terms with the dead man: not to be suspected. */
    const cleared = (o: CharId) =>
      [...knowledge[c], ...(fabricated.has(c) ? [fabricated.get(c)!] : [])].some(
        (k) =>
          (k.kind === 'alignment' && k.target === o && k.alignment === 'good') ||
          (k.kind === 'relationship' && k.subject === o && !isMotiveGrade(k.rel)),
      )
    const others = cast
      .map((x) => x.id)
      // The murderer and their friends do not point at one another; and nobody
      // suspects somebody they would clear in the same breath.
      .filter((o) => o !== c && !(isEvil(roles[c]) && isEvil(roles[o])) && !cleared(o))
    // (At a small table they may have cleared everybody: then they answer for somebody instead.)
    if (others.length === 0) {
      trusts.set(c, rng.pick(cast.map((x) => x.id).filter((o) => o !== c)))
      continue
    }
    const weights = others.map((o) => (o === culprit ? 1.5 : shadyIds.includes(o) ? 2 : 1))
    let roll = rng.next() * weights.reduce((a, b) => a + b, 0)
    let at = 0
    while (at < weights.length - 1 && roll >= weights[at]) {
      roll -= weights[at]
      at++
    }
    suspicionTarget.set(c, others[at])
    // Half the time there is a reason for it: they know how the one they
    // suspect stood with the dead man, and it was not well.
    const theirs = relationships[others[at]]
    if (honestly && theirs !== 'cordial' && theirs !== 'devoted' && rng.chance(0.5)) {
      grounds.set(c, [{ kind: 'relationship', subject: others[at], rel: theirs }])
    }
  }
  // Those whose part says whom they point at, each in turn.
  const suspecting: Suspecting = { ...night, suspicionTarget, grounds, trusts }
  for (const role of POINTED_IN_TURN) {
    const me = roles.indexOf(role)
    if (me >= 0) partOf(role, kind).pointsAt?.(suspecting, me)
  }
  // Whoever has the Whisperer's story would answer for the murderer.
  if (whispered >= 0) {
    suspicionTarget.delete(whispered)
    grounds.delete(whispered)
    trusts.set(whispered, culprit)
  }
  // Whoever has been given a name to point at, and knows that name to be
  // innocent, does not point at it: they would clear it in the same breath.
  const clears = (c: CharId, o: CharId) =>
    [...knowledge[c], ...(fabricated.has(c) ? [fabricated.get(c)!] : [])].some(
      (k) =>
        (k.kind === 'alignment' && k.target === o && k.alignment === 'good') ||
        (k.kind === 'relationship' && k.subject === o && !isMotiveGrade(k.rel)),
    )
  for (const [c, t] of [...suspicionTarget]) {
    if (victims.includes(c) || !clears(c, t)) continue
    suspicionTarget.delete(c)
    grounds.delete(c)
    trusts.set(c, t)
  }
  // And whoever was paid says nothing against anybody.
  const withheld = bribed >= 0 ? knowledge[bribed].filter((k) => KEPT_BACK.has(k.kind)) : []
  if (bribed >= 0) {
    knowledge[bribed] = knowledge[bribed].filter((k) => !KEPT_BACK.has(k.kind))
    grounds.delete(bribed)
  }
  return { suspicionTarget, grounds, trusts, clears, withheld }
}

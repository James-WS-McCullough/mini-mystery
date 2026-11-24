// Who could have done it, on what has been heard and found. A world is a guess
// at who is lying (the murderer, and as many with a secret of their own as the
// case sheet says). In a world, everything an honest guest says holds; a liar's
// words bind nothing, but for company sworn on both sides (liars lie alone, and
// never cover for one another); and anything owned up to under pressing holds,
// whoever owns it. The world stands if the honest words leave everybody one
// room a slot, and leave some moment inside the death window when the guessed
// murderer could have been alone with him at the scene.

import { SLOTS, VICTIM, type TEvidence, type TSpoken } from './types'

export interface SolveInput {
  /** How many guests. */
  n: number
  scene: string
  /** How many keep a secret of their own beside the murderer. */
  secretive: number
  heard: readonly TSpoken[]
  evidence: readonly TEvidence[]
}

/** Every k-sized choice from `from`, in order. */
function choose<T>(from: readonly T[], k: number): T[][] {
  if (k === 0) return [[]]
  if (from.length < k) return []
  const [head, ...rest] = from
  return [...choose(rest, k - 1).map((c) => [head, ...c]), ...choose(rest, k)]
}

/** The moments he may have died in, in a world where `culprit` and `liars` lie (empty: the world falls). */
export function murderSlots(
  input: SolveInput,
  culprit: number,
  liars: ReadonlySet<number>,
  /** For finding out why a world falls (tools and tests). */
  why: (reason: string) => void = () => {},
): number[] {
  const { scene, heard, evidence } = input
  const honest = (c: number) => !liars.has(c)
  const pins = new Map<string, string>()
  const key = (p: number, t: number) => `${p}:${t}`
  const pin = (p: number, t: number, room: string): boolean => {
    const k = key(p, t)
    const was = pins.get(k)
    if (was === undefined) {
      pins.set(k, room)
      return true
    }
    if (was !== room) why(`${p} at slot ${t}: ${was} and ${room}`)
    return was === room
  }
  /** "Nobody else there": an honest account of a slot, complete. */
  const exact: { speaker: number; slot: number; room: string; with: readonly number[] }[] = []
  const empties: { slot: number; room: string }[] = []
  let lo = 1
  let hi = SLOTS - 1

  for (const { speaker, claim } of heard) {
    switch (claim.kind) {
      case 'stay': {
        // (What is owned up to under pressing is the truth, whoever owns it.)
        if (!honest(speaker) && !claim.owned) break
        for (let t = claim.from; t <= claim.to; t++) {
          if (!pin(speaker, t, claim.room)) return []
          for (const w of claim.with) if (!pin(w, t, claim.room)) return []
          exact.push({ speaker, slot: t, room: claim.room, with: claim.with })
        }
        break
      }
      case 'saw':
        if (honest(speaker) && !pin(claim.target, claim.slot, claim.room)) return []
        break
      case 'lastSeen':
        if (honest(speaker)) {
          if (!pin(VICTIM, claim.slot, claim.room)) return []
          lo = Math.max(lo, claim.slot)
        }
        break
      case 'found':
        if (honest(speaker)) {
          if (claim.room !== scene || !pin(speaker, claim.slot, claim.room)) return []
          hi = Math.min(hi, claim.slot - 1)
        }
        break
      case 'empty':
        if (honest(speaker)) empties.push({ slot: claim.slot, room: claim.room })
        break
    }
  }
  // Company sworn on both sides holds, whoever swears it.
  const stays = heard.filter((s): s is TSpoken & { claim: { kind: 'stay' } } => s.claim.kind === 'stay')
  for (const a of stays) {
    for (const b of stays) {
      if (a.speaker >= b.speaker || a.claim.room !== b.claim.room) continue
      if (!a.claim.with.includes(b.speaker) || !b.claim.with.includes(a.speaker)) continue
      for (let t = Math.max(a.claim.from, b.claim.from); t <= Math.min(a.claim.to, b.claim.to); t++) {
        if (!pin(a.speaker, t, a.claim.room) || !pin(b.speaker, t, a.claim.room)) return []
      }
    }
  }
  for (const e of evidence) {
    if (e.earliest !== undefined) lo = Math.max(lo, e.earliest)
    if (e.latest !== undefined) hi = Math.min(hi, e.latest)
  }
  // He was alive wherever anybody honest was with him, or saw him.
  for (const [k, _room] of pins) {
    const [p, t] = k.split(':').map(Number)
    if (p === VICTIM) lo = Math.max(lo, t)
  }
  // A room said to have stood empty held nobody, then.
  for (const { slot, room } of empties) {
    for (const [k, r] of pins) {
      if (r === room && Number(k.split(':')[1]) === slot) {
        why(`${k} in ${room}, said empty`)
        return []
      }
    }
  }
  // An honest account names everybody who was there with them.
  for (const { speaker, slot, room, with: w } of exact) {
    for (const [k, r] of pins) {
      if (r !== room) continue
      const [p, t] = k.split(':').map(Number)
      if (t === slot && p !== speaker && !w.includes(p)) {
        why(`${p} in ${room} at ${t}, not named by ${speaker}`)
        return []
      }
    }
  }
  const out: number[] = []
  for (let t = lo; t <= hi; t++) {
    // The murderer at the scene, and he there too; and nobody else.
    const c = pins.get(key(culprit, t))
    if (c !== undefined && c !== scene) continue
    const v = pins.get(key(VICTIM, t))
    if (v !== undefined && v !== scene) continue
    let crowded = false
    for (const [k, r] of pins) {
      const [p, at] = k.split(':').map(Number)
      if (at === t && r === scene && p !== culprit && p !== VICTIM) crowded = true
    }
    if (!crowded) out.push(t)
    else why(`slot ${t}: somebody else at the scene`)
  }
  if (out.length === 0) why(`no slot in ${lo}..${hi}`)
  return out
}

/** Every guest who may have done it, on what is known; and the moments, for each. */
export function whoCould(input: SolveInput): Map<number, number[]> {
  const out = new Map<number, number[]>()
  const all = Array.from({ length: input.n }, (_, i) => i)
  for (const culprit of all) {
    const others = all.filter((c) => c !== culprit)
    const slots = new Set<number>()
    for (const secret of choose(others, input.secretive)) {
      for (const t of murderSlots(input, culprit, new Set([culprit, ...secret]))) slots.add(t)
    }
    if (slots.size > 0) out.set(culprit, [...slots].sort((a, b) => a - b))
  }
  return out
}

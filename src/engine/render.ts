// Deterministic prose. Every line of dialogue is rendered FROM structural
// claims via authored template banks — prose can flavor a claim but never add
// facts. Banks are pooled: `<key>.<defense>` (press lines only) plus
// `<key>.<temperament>` plus the bare `<key>` (claim sentences) plus
// `<key>.any`; variant choice is a pure hash of (seed, salt, key) over the
// pooled lines, so a seed replays identically.

import type { SettingPack } from '../content/schema'
import { hashString } from './rng'
import type {
  Answer,
  CastMember,
  CharId,
  Claim,
  EvidenceItem,
  Mystery,
  PressOutcome,
  RoomId,
} from './types'

export interface RenderCtx {
  mystery: Mystery
  pack: SettingPack
}

/** Line keys whose opener already voices the suspicion — don't render it twice. */
const OPENER_CARRIES_SUSPICION = new Set(['suspect.point', 'suspect.hedge', 'reaction.accuse'])

function fill(template: string, slots: Record<string, string>): string {
  const text = template.replace(/\{(\w+)\}/g, (_, k: string) => slots[k] ?? `{${k}}`)
  // Slot values like "the Colonel" or "the kitchen" may land at a sentence start.
  return text.replace(/(^|[.!?…]\s+)([a-z])/g, (_, lead: string, ch: string) => lead + ch.toUpperCase())
}

/**
 * Pool every bank that exists for the given keys (voice-specific first, then
 * generic) and pick one line from the union, so a character with a small
 * temperament bank still draws on the neutral lines instead of repeating.
 */
function pickLine(ctx: RenderCtx, keys: string[], salt: string): string | null {
  const pool: string[] = []
  for (const key of keys) {
    const bank = ctx.pack.dialogue[key]
    if (bank) pool.push(...bank)
  }
  if (pool.length === 0) return null
  return pool[hashString(`${ctx.mystery.seed}|${salt}|${keys[0]}`) % pool.length]
}

export function roomName(ctx: RenderCtx, id: RoomId): string {
  return ctx.pack.rooms.find((r) => r.id === id)?.name ?? id
}

export function traitLabel(ctx: RenderCtx, id: string): string {
  return ctx.pack.traits.find((t) => t.id === id)?.label ?? id
}

function baseSlots(ctx: RenderCtx, speaker: CastMember): Record<string, string> {
  return {
    name: speaker.shortName,
    victim: ctx.pack.victim.shortName,
  }
}

function paritySeats(ctx: RenderCtx, parity: 'odd' | 'even'): string {
  const seats = ctx.mystery.cast
    .map((m) => m.seat)
    .filter((s) => (s % 2 === 1) === (parity === 'odd'))
    .sort((a, b) => a - b)
  return seats.join(', ')
}

export function renderClaim(ctx: RenderCtx, speaker: CharId, claim: Claim, salt: string): string {
  const me = ctx.mystery.cast[speaker]
  const slots = baseSlots(ctx, me)
  const name = (c: CharId) => ctx.mystery.cast[c].shortName
  let key: string

  switch (claim.kind) {
    case 'role':
      key = 'claim.role'
      slots.roleName = ctx.pack.roleNames[claim.role] ?? claim.role
      break
    case 'whereabouts':
      key = claim.companions.length > 0 ? 'claim.whereabouts.company' : 'claim.whereabouts.alone'
      slots.room = roomName(ctx, claim.room)
      slots.companions = claim.companions.map(name).join(' and ')
      break
    case 'sighting':
      key = 'claim.sighting'
      slots.target = name(claim.target)
      slots.room = roomName(ctx, claim.room)
      break
    case 'glimpse':
      key = 'claim.glimpse'
      slots.room = roomName(ctx, claim.room)
      slots.trait =
        claim.attr.kind === 'trait' ? traitLabel(ctx, claim.attr.trait) : `sat at an ${claim.attr.parity} place`
      break
    case 'culpritAttr':
      if (claim.attr.kind === 'trait') {
        key = 'claim.culpritAttr.trait'
        slots.trait = traitLabel(ctx, claim.attr.trait)
      } else {
        key = 'claim.culpritAttr.parity'
        slots.parity = claim.attr.parity
        slots.seatList = paritySeats(ctx, claim.attr.parity)
      }
      break
    case 'alignment':
      key = claim.alignment === 'evil' ? 'claim.alignment.evil' : 'claim.alignment.good'
      slots.target = name(claim.target)
      break
    case 'relationship':
      if (claim.subject === speaker) {
        key = `claim.relationship.self.${claim.rel}`
      } else {
        key = `claim.relationship.gossip.${claim.rel}`
        slots.subject = name(claim.subject)
      }
      break
    case 'heard':
      key = `claim.heard.${claim.sound}`
      slots.room = roomName(ctx, claim.room)
      break
    case 'suspicion':
      key = 'claim.suspicion'
      slots.target = name(claim.target)
      break
  }

  const line = pickLine(ctx, [`${key}.${me.temperament}`, key, `${key}.any`], salt)
  return line ? fill(line, slots) : structuralFallback(ctx, claim)
}

/** Compact structural summary for the notebook — deduction-clear, no prose. */
export function describeClaim(ctx: RenderCtx, speaker: CharId, claim: Claim): string {
  const name = (c: CharId) => ctx.mystery.cast[c].shortName
  const victim = ctx.pack.victim.shortName
  switch (claim.kind) {
    case 'role':
      return `presents themselves as ${ctx.pack.roleLabels[claim.role] ?? claim.role}`
    case 'whereabouts':
      return `was in ${roomName(ctx, claim.room)}${claim.companions.length ? ` with ${claim.companions.map(name).join(', ')}` : ', alone'}`
    case 'sighting':
      return `saw ${name(claim.target)} in ${roomName(ctx, claim.room)}`
    case 'glimpse':
      return `glimpsed someone near ${roomName(ctx, claim.room)} who ${claim.attr.kind === 'trait' ? traitLabel(ctx, claim.attr.trait) : `sat at an ${claim.attr.parity} place`}`
    case 'culpritAttr':
      return `the culprit ${claim.attr.kind === 'trait' ? traitLabel(ctx, claim.attr.trait) : `sits at an ${claim.attr.parity} seat`}`
    case 'alignment':
      return `${name(claim.target)} is ${claim.alignment === 'evil' ? 'guilty of something' : 'innocent'}`
    case 'relationship':
      return `${claim.subject === speaker ? 'own relationship' : `${name(claim.subject)}’s relationship`} with ${victim}: ${claim.rel}`
    case 'heard':
      return `heard a ${claim.sound} from ${roomName(ctx, claim.room)}`
    case 'suspicion':
      return `suspects ${name(claim.target)}`
  }
}

function structuralFallback(ctx: RenderCtx, claim: Claim): string {
  return `(claims: ${describeClaim(ctx, -1 as CharId, claim)})`
}

export function meansLabel(ctx: RenderCtx, id: string): string {
  return ctx.pack.means.find((m) => m.id === id)?.label ?? id
}

/** What a piece of physical evidence actually proves — for the notebook. */
export function describeEvidence(ctx: RenderCtx, item: EvidenceItem): string {
  const victim = ctx.pack.victim.shortName
  switch (item.fact.kind) {
    case 'traceAtScene':
      return `left at the scene by someone who ${item.fact.attr.kind === 'trait' ? traitLabel(ctx, item.fact.attr.trait) : `sits at an ${item.fact.attr.parity} seat`}`
    case 'weapon': {
      const weaponMeans = item.fact.means
      const method = ctx.pack.methods.find((m) => m.means === weaponMeans)
      return method?.methodLine ?? `the method — done by someone who ${meansLabel(ctx, weaponMeans)}`
    }
    case 'forcedLockbox':
      return `proof of a theft in ${roomName(ctx, item.fact.room)}`
    case 'motiveDocument':
      return `proves ${ctx.mystery.cast[item.fact.subject].shortName}’s relationship with ${victim} was ${item.fact.rel}`
    case 'flavor':
      return 'curious, but idle'
  }
}

function enrichSlots(ctx: RenderCtx, answer: Answer, slots: Record<string, string>): void {
  if (answer.slots) {
    for (const [k, v] of Object.entries(answer.slots)) {
      slots[k] = k === 'room' ? roomName(ctx, String(v)) : String(v)
    }
  }
  if (answer.refer?.person !== undefined && slots.person === undefined) {
    slots.person = ctx.mystery.cast[answer.refer.person].shortName
  }
  if (answer.refer?.room !== undefined && slots.room === undefined) {
    slots.room = roomName(ctx, answer.refer.room)
  }
}

/**
 * Render a full answer: temperament-voiced opener plus one sentence per
 * structural claim. `extraSlots` lets the caller pass context the policy
 * couldn't know (e.g. the shown evidence item's name).
 */
export function renderAnswer(
  ctx: RenderCtx,
  speaker: CharId,
  answer: Answer,
  salt: string,
  extraSlots: Record<string, string> = {},
): string {
  const me = ctx.mystery.cast[speaker]
  const slots = { ...baseSlots(ctx, me), ...extraSlots }
  enrichSlots(ctx, answer, slots)

  const opener = pickLine(ctx, [`${answer.lineKey}.${me.temperament}`, `${answer.lineKey}.any`], salt)
  const parts: string[] = []
  if (opener) parts.push(fill(opener, slots))

  answer.claims.forEach((claim, i) => {
    if (claim.kind === 'suspicion' && OPENER_CARRIES_SUSPICION.has(answer.lineKey)) return
    parts.push(renderClaim(ctx, speaker, claim, `${salt}|c${i}`))
  })

  return parts.length > 0 ? parts.join(' ') : '…'
}

/** Press responses look up defense-style variants first. */
export function renderPress(
  ctx: RenderCtx,
  speaker: CharId,
  outcome: PressOutcome,
  salt: string,
): string {
  const me = ctx.mystery.cast[speaker]
  const slots = baseSlots(ctx, me)
  const opener = pickLine(
    ctx,
    [`${outcome.lineKey}.${me.defense}`, `${outcome.lineKey}.${me.temperament}`, `${outcome.lineKey}.any`],
    salt,
  )
  const parts: string[] = []
  if (opener) parts.push(fill(opener, slots))
  outcome.claims.forEach((claim, i) => {
    parts.push(renderClaim(ctx, speaker, claim, `${salt}|c${i}`))
  })
  return parts.length > 0 ? parts.join(' ') : '…'
}

export function renderIntro(ctx: RenderCtx): string {
  const line = pickLine(ctx, ['__intro'], 'intro')
  const template = line ?? ctx.pack.scenarioIntro[hashString(`${ctx.mystery.seed}|intro`) % ctx.pack.scenarioIntro.length]
  return fill(template, {
    victim: ctx.pack.victim.name,
    scene: roomName(ctx, ctx.mystery.caseSheet.sceneRoom),
    window: ctx.mystery.caseSheet.windowLabel,
  })
}

export function renderSearch(ctx: RenderCtx, room: RoomId, items: EvidenceItem[], salt: string): string {
  const probative = items.filter((i) => i.fact.kind !== 'flavor')
  const flavor = items.filter((i) => i.fact.kind === 'flavor')
  const parts: string[] = []
  if (probative.length > 0) {
    parts.push(`You find ${probative.map((i) => i.name).join('; and ')}.`)
  }
  if (flavor.length > 0) {
    parts.push(`Also here: ${flavor.map((i) => i.name).join('; ')}.`)
  }
  if (parts.length === 0) {
    const def = ctx.pack.rooms.find((r) => r.id === room)
    if (def && def.searchFlavor.length > 0) {
      parts.push(def.searchFlavor[hashString(`${ctx.mystery.seed}|${salt}|sf`) % def.searchFlavor.length])
    } else {
      parts.push('Nothing of note.')
    }
  }
  return parts.join(' ')
}

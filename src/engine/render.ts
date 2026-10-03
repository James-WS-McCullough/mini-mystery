// Deterministic prose. Every line of dialogue is rendered FROM structural
// claims via authored template banks — prose can flavor a claim but never add
// facts. Banks are pooled: `<key>.<defense>` (press lines only) plus
// `<key>.<temperament>` plus the bare `<key>` (claim sentences) plus
// `<key>.any`; variant choice is a pure hash of (seed, salt, key) over the
// pooled lines, so a seed replays identically.

import type { SettingPack } from '../content/schema'
import { addressSlots, type Address } from './address'
import { hashString } from './rng'
import type {
  Answer,
  CastMember,
  CharId,
  Claim,
  EvidenceItem,
  Mystery,
  PressOutcome,
  Relationship,
  RoomId,
} from './types'

export interface RenderCtx {
  mystery: Mystery
  pack: SettingPack
  /** How the household addresses the player; theirs to choose. */
  address?: Address
}

/** Line keys whose opener already voices the suspicion — don't render it twice. */
const OPENER_CARRIES_SUSPICION = new Set([
  'suspect.point',
  'suspect.hedge',
  'suspect.vouch',
  'reaction.accuse',
])

function fill(template: string, slots: Record<string, string>): string {
  const text = template.replace(/\{(\w+)\}/g, (_, k: string) => slots[k] ?? `{${k}}`)
  // Slot values like "the Colonel" or "the kitchen" may land at a sentence start.
  return text.replace(/(^|[.!?…]\s+|[.!?…]”\s+|“)([a-z])/g, (_, lead: string, ch: string) => lead + ch.toUpperCase())
}

/** How often, in a hundred, a speaker with lines of their own uses one. */
const OWN_VOICE = 70

/**
 * The first key is the speaker's own voice (their manner, or under Press their
 * defence). Where that bank exists they mostly speak from it, so a bootboy
 * sounds like a bootboy; the rest of the time — and always, where it does not
 * exist — the line comes from every bank pooled, so nobody runs out of things
 * to say.
 */
function pickLine(ctx: RenderCtx, keys: string[], salt: string): string | null {
  const seed = `${ctx.mystery.seed}|${salt}|${keys[0]}`
  const own = ctx.pack.dialogue[keys[0]]
  // Lines that are theirs by kinship are the only ones that fit them.
  const always = keys[0].includes('@')
  if (own && own.length > 0 && (always || hashString(`${seed}|own`) % 100 < OWN_VOICE)) {
    return own[hashString(seed) % own.length]
  }
  const pool: string[] = []
  for (const key of keys) {
    const bank = ctx.pack.dialogue[key]
    if (bank) pool.push(...bank)
  }
  if (pool.length === 0) return null
  return pool[hashString(seed) % pool.length]
}

/** "in the library", "on the garden terrace". */
export function inRoom(ctx: RenderCtx, id: RoomId): string {
  const room = ctx.pack.rooms.find((r) => r.id === id)
  return room?.where ?? `in ${room?.name ?? id}`
}

/** Puts right any "in the garden terrace" a line has been filled with. */
function placed(ctx: RenderCtx, text: string): string {
  let out = text
  for (const room of ctx.pack.rooms) {
    if (!room.where) continue
    const upper = room.where[0].toUpperCase() + room.where.slice(1)
    out = out.split(`in ${room.name}`).join(room.where).split(`In ${room.name}`).join(upper)
  }
  return out
}

export function roomName(ctx: RenderCtx, id: RoomId): string {
  return ctx.pack.rooms.find((r) => r.id === id)?.name ?? id
}

export function traitLabel(ctx: RenderCtx, id: string): string {
  return ctx.pack.traits.find((t) => t.id === id)?.label ?? id
}

/** A guest's trait as it reads on the cast sheet — furtively, if it sits oddly on them. */
export function traitLabelOf(ctx: RenderCtx, member: CastMember): string {
  const def = ctx.pack.traits.find((t) => t.id === member.trait)
  if (!def) return member.trait
  return (member.furtive && def.furtiveLabel) || def.label
}

function defOf(ctx: RenderCtx, member: CastMember) {
  return ctx.pack.characters.find((c) => c.id === member.defId)
}

/**
 * The victim, as this speaker names them. The children of the house say
 * "Father"; the servants "his lordship"; the hearty "old Edgar"; the blunt
 * and the cheeky "Blackwood"; everybody else "Lord Blackwood". A name given
 * on the character sheet (`callsVictim`) overrides all of it.
 */
export function victimAs(ctx: RenderCtx, speaker: CastMember): string {
  const def = defOf(ctx, speaker)
  const v = ctx.pack.victim
  if (def?.callsVictim) return def.callsVictim
  if (def?.kin === 'child' || def?.station === 'family') return v.parental
  if (def?.station === 'servant') return v.respectful
  switch (speaker.temperament) {
    case 'hearty':
      return `old ${v.firstName}`
    case 'blunt':
    case 'cheeky':
      return v.lastName
    default:
      return v.shortName
  }
}

/** The victim's pronouns, for the slots `{he}`, `{him}`, `{his}` and `{himself}`. */
function victimPronouns(ctx: Pick<RenderCtx, 'pack'>): Record<string, string> {
  const she = ctx.pack.victim.pronouns === 'she'
  const they = ctx.pack.victim.pronouns === 'they'
  return {
    he: they ? 'they' : she ? 'she' : 'he',
    him: they ? 'them' : she ? 'her' : 'him',
    his: they ? 'their' : she ? 'her' : 'his',
    himself: they ? 'themselves' : she ? 'herself' : 'himself',
  }
}

/**
 * The two answers that name nobody, as the accusation offers them and the
 * reveal gives them back: he did it himself, or he is not dead.
 */
export function nobodyWords(pack: SettingPack): { ownLife: string; notDead: string } {
  const p = victimPronouns({ pack })
  const He = p.he[0].toUpperCase() + p.he.slice(1)
  return {
    ownLife: `${He} took ${p.his} own life.`,
    notDead: `${He}${p.he === 'they' ? '’re' : '’s'} not really dead.`,
  }
}

/** The banks that are this speaker's own: their kin's, then their manner's. */
function ownKeys(ctx: RenderCtx, speaker: CastMember, key: string): string[] {
  const kin = defOf(ctx, speaker)?.kin
  const kinKey = kin ? `${key}@${kin}` : null
  return [
    ...(kinKey && ctx.pack.dialogue[kinKey]?.length ? [kinKey] : []),
    `${key}.${speaker.temperament}`,
  ]
}

/** Words that go before a name and are not part of it. */
const HONORIFICS = new Set([
  'mr', 'mr.', 'mrs', 'mrs.', 'miss', 'ms', 'lady', 'lord', 'sir', 'dr', 'dr.', 'the',
  'captain', 'colonel', 'major', 'reverend', 'nanny', 'madame', 'mme', 'dowager',
])

/**
 * A guest's first name — "Hugo" of "Mr. Hugo Trent" — for those who use it.
 * Somebody with no first name to be had is called by what they are called.
 */
export function firstNameOf(member: CastMember): string {
  const words = member.name.split(/\s+/)
  const first = words.find((w) => !HONORIFICS.has(w.toLowerCase()))
  return first && words.length > 1 ? first : member.shortName.replace(/^the /, '')
}

/** "old Hugo": how the hearty speak of everybody, whatever their age. */
function familiarly(ctx: RenderCtx, slots: Record<string, string>): void {
  for (const key of ['target', 'subject', 'person']) {
    const name = slots[key]
    if (!name || slots[`${key}First`] !== undefined) continue
    const member = ctx.mystery.cast.find((m) => m.shortName === name)
    if (!member) continue
    slots[`${key}First`] = firstNameOf(member)
    slots[`${key}Old`] = `old ${firstNameOf(member)}`
  }
}

/**
 * The place in words, for any text: "the house", "this house", "the household",
 * and with the right word before it — "in the house", "on the train",
 * "aboard this ship".
 */
export function placeSlots(pack: SettingPack): Record<string, string> {
  const p = pack.place
  const by = p.at === 'at' ? 'in' : p.at
  return {
    house: p.name,
    thisHouse: p.here,
    household: p.people,
    inHouse: `${by} ${p.name}`,
    inThisHouse: `${by} ${p.here}`,
  }
}

/** A line written for any setting, put into this one's words. */
export function placeText(pack: SettingPack, text: string): string {
  return fill(text, placeSlots(pack))
}

function baseSlots(ctx: RenderCtx, speaker: CastMember): Record<string, string> {
  return {
    ...placeSlots(ctx.pack),
    name: speaker.shortName,
    victim: victimAs(ctx, speaker),
    parent: ctx.pack.victim.parental.toLowerCase(),
    ...victimPronouns(ctx),
    weather: ctx.pack.place.weather,
    one: ctx.pack.place.one,
    ones: ctx.pack.place.ones,
    passage: ctx.pack.place.passage,
    windowFrom: ctx.pack.windowFrom,
    ...addressSlots(ctx.address),
  }
}

/** "A, B or C". */
function listNames(names: string[], joiner = 'or'): string {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} ${joiner} ${names[names.length - 1]}`
}

/** "a man", "a woman". */
function sexLabel(sex: 'he' | 'she'): string {
  return sex === 'he' ? 'a man' : 'a woman'
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
        claim.attr.kind === 'trait'
          ? traitLabel(ctx, claim.attr.trait)
          : `had the look of ${sexLabel(claim.attr.sex)}`
      break
    case 'culpritAttr':
      if (claim.dying) {
        // A last word, or a last sign: its own line for each thing it could mean.
        key = claim.attr.kind === 'trait' ? `claim.dying.${claim.attr.trait}` : `claim.dying.${claim.attr.sex}`
      } else if (claim.attr.kind === 'trait') {
        key = 'claim.culpritAttr.trait'
        slots.trait = traitLabel(ctx, claim.attr.trait)
      } else {
        key = 'claim.culpritAttr.sex'
        slots.sex = sexLabel(claim.attr.sex)
      }
      break
    case 'passing':
      key = 'claim.passing'
      slots.target = name(claim.target)
      slots.room = roomName(ctx, ctx.mystery.caseSheet.sceneRoom)
      break
    case 'liarsAmong': {
      key = 'claim.liarsAmong'
      slots.pair = claim.pair.map(name).join(' and ')
      slots.howMany = ['neither of them is', 'one of them is', 'both of them are'][claim.count] ?? 'both of them are'
      break
    }
    case 'blackmailed':
      key = 'claim.blackmailed'
      slots.target = name(claim.by)
      break
    case 'bribed':
      key = 'claim.bribed'
      slots.target = name(claim.by)
      break
    case 'toldBy':
      key = 'claim.toldBy'
      slots.target = name(claim.by)
      break
    case 'passage':
      key = 'claim.passage'
      slots.room = roomName(ctx, claim.room)
      slots.scene = roomName(ctx, ctx.mystery.caseSheet.sceneRoom)
      break
    case 'roomState':
      key = claim.occupied ? 'claim.roomUsed' : 'claim.roomEmpty'
      slots.room = roomName(ctx, claim.room)
      break
    case 'together':
      key = claim.together ? 'claim.together' : 'claim.apart'
      slots.first = name(claim.pair[0])
      slots.second = name(claim.pair[1])
      break
    case 'confession':
      key = 'claim.confession'
      break
    case 'silent':
      key = 'claim.silent'
      break
    case 'among':
      key = 'claim.among'
      slots.suspects = listNames(claim.suspects.map(name))
      break
    case 'earlier':
      key = 'claim.earlier'
      slots.target = name(claim.target)
      slots.room = roomName(ctx, claim.room)
      break
    case 'theft':
      key = 'claim.theft'
      slots.room = roomName(ctx, claim.room)
      break
    case 'alignment':
      key = claim.alignment === 'evil' ? 'claim.alignment.evil' : 'claim.alignment.good'
      slots.target = name(claim.target)
      break
    case 'relationship':
      // The child of the house they hoped to marry: a son for her, a daughter for him.
      slots.child = ctx.mystery.cast[claim.subject]?.pronouns === 'she' ? 'son' : 'daughter'
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
    case 'trust':
      key = 'claim.trust'
      slots.target = name(claim.target)
      break
    case 'suspicion':
      key = 'claim.suspicion'
      slots.target = name(claim.target)
      break
  }

  const line = pickLine(ctx, [...ownKeys(ctx, me, key), key, `${key}.any`], salt)
  if (!line) return structuralFallback(ctx, claim)
  familiarly(ctx, slots)
  const said = fill(line, slots)
  // Those whose role tells nothing further say in a sentence what it means.
  const aside = claim.kind === 'role' ? ctx.pack.roleAsides?.[claim.role] : undefined
  const asideSaid = aside ? fill(aside, slots) : undefined
  return placed(ctx, asideSaid ? `${said} ${asideSaid}` : said)
}

export function relLabel(ctx: RenderCtx, rel: Relationship): string {
  return ctx.pack.relationLabels?.[rel] ?? rel
}

/** Compact structural summary for the notebook — deduction-clear, no prose. */
export function describeClaim(ctx: RenderCtx, speaker: CharId, claim: Claim): string {
  return placed(ctx, summarise(ctx, speaker, claim))
}

function summarise(ctx: RenderCtx, speaker: CharId, claim: Claim): string {
  const name = (c: CharId) => ctx.mystery.cast[c].shortName
  const victim = ctx.pack.victim.shortName
  switch (claim.kind) {
    case 'role':
      return `says they are ${ctx.pack.roleLabels[claim.role] ?? claim.role}`
    case 'whereabouts':
      return `was in ${roomName(ctx, claim.room)}${claim.companions.length ? ` with ${claim.companions.map(name).join(', ')}` : ', alone'}`
    case 'sighting':
      return `saw ${name(claim.target)} in ${roomName(ctx, claim.room)}`
    case 'glimpse':
      return claim.attr.kind === 'trait'
        ? `glimpsed someone near ${roomName(ctx, claim.room)} who ${traitLabel(ctx, claim.attr.trait)}`
        : `glimpsed ${sexLabel(claim.attr.sex)} near ${roomName(ctx, claim.room)}`
    case 'culpritAttr': {
      const what =
        claim.attr.kind === 'trait'
          ? `the culprit ${traitLabel(ctx, claim.attr.trait)}`
          : `the culprit is ${sexLabel(claim.attr.sex)}`
      return claim.dying ? `found ${victim} still living, and by his last word or sign, ${what}` : what
    }
    case 'passing':
      return `passed ${name(claim.target)} coming away from ${roomName(ctx, ctx.mystery.caseSheet.sceneRoom)} just after. A lead, no more`
    case 'liarsAmong':
      return `of ${claim.pair.map(name).join(' and ')}, ${
        ['neither lies', 'one lies', 'both lie'][claim.count] ?? 'both lie'
      } about where they were`
    case 'blackmailed':
      return `is being blackmailed by ${name(claim.by)}`
    case 'bribed':
      return `was paid by ${name(claim.by)} to say nothing`
    case 'toldBy':
      return `did not see it themselves: ${name(claim.by)} told them so`
    case 'passage':
      return `a secret passage runs from ${roomName(ctx, ctx.mystery.caseSheet.sceneRoom)} to ${roomName(ctx, claim.room)}`
    case 'roomState':
      return claim.occupied
        ? `somebody was ${inRoom(ctx, claim.room)} during the hour`
        : `nobody went into ${roomName(ctx, claim.room)} all hour`
    case 'together':
      return `${claim.pair.map(name).join(' and ')} ${claim.together ? 'spent the hour together' : 'were not together that hour'}`
    case 'confession':
      return `says they killed ${ctx.pack.victim.shortName}`
    case 'silent':
      return 'has nothing to tell of what they know'
    case 'among':
      return `the culprit is one of ${listNames(claim.suspects.map(name), 'or')}`
    case 'earlier':
      return `saw ${name(claim.target)} in ${roomName(ctx, claim.room)} earlier that evening, before the murder`
    case 'theft':
      return `forced the lockbox in ${roomName(ctx, claim.room)}. A thief, they say, and no worse`
    case 'alignment':
      return `${name(claim.target)} is ${claim.alignment === 'evil' ? 'guilty of something' : 'innocent'}`
    case 'relationship':
      return `${claim.subject === speaker ? 'their own standing' : `${name(claim.subject)}’s standing`} with ${victim}: ${relLabel(ctx, claim.rel)}`
    case 'heard':
      return {
        crash: `heard a crash from ${roomName(ctx, claim.room)}`,
        quarrel: `heard a quarrel from ${roomName(ctx, claim.room)}`,
        slam: `heard a door slammed in ${roomName(ctx, claim.room)}, and somebody storm out`,
        telephone: `heard a telephone call in ${roomName(ctx, claim.room)} cut short, and hard words after`,
        walkout: `saw somebody leave ${roomName(ctx, claim.room)} in a temper`,
      }[claim.sound]
    case 'trust':
      return `feels sure it was not ${name(claim.target)}. A feeling, no more`
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
  return placed(ctx, proves(ctx, item))
}

function proves(ctx: RenderCtx, item: EvidenceItem): string {
  const victim = ctx.pack.victim.shortName
  switch (item.fact.kind) {
    case 'trace':
      if (item.fact.room === ctx.mystery.caseSheet.sceneRoom && item.fact.givenBy === undefined) {
        return `something of someone who ${item.fact.attr.kind === 'trait' ? traitLabel(ctx, item.fact.attr.trait) : `is ${sexLabel(item.fact.attr.sex)}`}, found at the scene of the crime`
      }
      return `${
        item.fact.givenBy !== undefined
          ? `handed to you by ${ctx.mystery.cast[item.fact.givenBy].shortName}, `
          : ''
      }left by someone who ${item.fact.attr.kind === 'trait' ? traitLabel(ctx, item.fact.attr.trait) : `is ${sexLabel(item.fact.attr.sex)}`}, and who spent the hour alone in ${roomName(ctx, item.fact.room)}`
    case 'weapon': {
      const weaponMeans = item.fact.means
      const methodId = item.fact.method
      const method =
        ctx.pack.methods.find((m) => m.id === methodId) ??
        ctx.pack.methods.find((m) => m.means === weaponMeans)
      const how = method?.methodLine ?? `the method, done by someone who ${meansLabel(ctx, weaponMeans)}`
      return item.fact.foundIn !== undefined && item.fact.foundIn !== ctx.mystery.caseSheet.sceneRoom
        ? `${how}, found in ${roomName(ctx, item.fact.foundIn)}, and not where it was done`
        : how
    }
    case 'sceneCleared':
      return 'nothing here to say how it was done: whatever did it has been taken away'
    case 'passage':
      return `a way through the wall, from ${roomName(ctx, item.fact.room)} to ${roomName(ctx, ctx.mystery.caseSheet.sceneRoom)}`
    case 'killed':
      return `killed in the night, ${inRoom(ctx, item.fact.room)}, by whoever killed ${ctx.pack.victim.shortName}`
    case 'secondTrace':
      return `left at the second killing by the murderer, who ${item.fact.attr.kind === 'trait' ? traitLabel(ctx, item.fact.attr.trait) : `is ${sexLabel(item.fact.attr.sex)}`}`
    case 'bribe':
      return `somebody has paid ${ctx.mystery.cast[item.fact.to].shortName}, and not for nothing`
    case 'forcedLockbox':
      return `proof of a theft in ${roomName(ctx, item.fact.room)}`
    case 'lockboxIntact':
      return `proof that no theft was done in ${roomName(ctx, item.fact.room)}`
    case 'motiveDocument':
      return `proves ${ctx.mystery.cast[item.fact.subject].shortName}’s standing with ${victim}: ${relLabel(ctx, item.fact.rel)}`
    case 'key':
      return `the key to ${roomName(ctx, item.fact.room)}, which was locked`
    case 'suicideNote': {
      const p = victimPronouns(ctx)
      return `found beside ${p.him}, to say ${p.he} did it ${p.himself}`
    }
    case 'handSample': {
      const p = victimPronouns(ctx)
      return `written by ${victim} ${p.himself}: ${p.his} own hand, to set beside any other`
    }
    case 'flavor':
      return 'curious, but idle'
  }
}

function enrichSlots(ctx: RenderCtx, answer: Answer, slots: Record<string, string>): void {
  if (answer.slots) {
    for (const [k, v] of Object.entries(answer.slots)) {
      slots[k] = k === 'room' || k === 'locked' ? roomName(ctx, String(v)) : String(v)
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
  familiarly(ctx, slots)

  const opener = pickLine(ctx, [...ownKeys(ctx, me, answer.lineKey), `${answer.lineKey}.any`], salt)
  const parts: string[] = []
  if (opener) parts.push(placed(ctx, fill(opener, slots)))

  answer.claims.forEach((claim, i) => {
    const opinion = claim.kind === 'suspicion' || claim.kind === 'trust'
    if (opinion && OPENER_CARRIES_SUSPICION.has(answer.lineKey)) return
    // The opener has said that they will say nothing.
    if (claim.kind === 'silent' && answer.lineKey === 'knowledge.silent') return
    parts.push(renderClaim(ctx, speaker, claim, `${salt}|c${i}`))
  })
  // A quiet guest, shown what touches them, goes on to what they were keeping back.
  if (answer.also) parts.push(renderAnswer(ctx, speaker, answer.also, `${salt}|also`, extraSlots))

  return parts.length > 0 ? parts.join(' ') : '…'
}

/** Press responses look up defense-style variants first. */
export function renderPress(
  ctx: RenderCtx,
  speaker: CharId,
  outcome: PressOutcome,
  salt: string,
  /**
   * What they are being pressed with. Against `proof` — an exhibit, or their
   * own words — there is no other account to cast doubt on, and nobody who
   * holds their ground says there is.
   */
  against: 'account' | 'proof' = 'account',
): string {
  const me = ctx.mystery.cast[speaker]
  const slots: Record<string, string> = { ...baseSlots(ctx, me), scene: roomName(ctx, ctx.mystery.caseSheet.sceneRoom) }
  for (const [k, v] of Object.entries(outcome.slots ?? {})) {
    slots[k] = k === 'room' || k === 'scene' ? roomName(ctx, String(v)) : String(v)
  }
  const lineKey = against === 'proof' && outcome.lineKey === 'press.hold' ? 'press.proof' : outcome.lineKey
  const opener = pickLine(
    ctx,
    [`${lineKey}.${me.defense}`, `${lineKey}.${me.temperament}`, `${lineKey}.any`],
    salt,
  )
  const parts: string[] = []
  if (opener) parts.push(placed(ctx, fill(opener, slots)))
  outcome.claims.forEach((claim, i) => {
    parts.push(renderClaim(ctx, speaker, claim, `${salt}|c${i}`))
  })
  return parts.length > 0 ? parts.join(' ') : '…'
}

/** Why the household had gathered, as the pack tells it. */
export function occasionOf(ctx: RenderCtx) {
  const id = ctx.mystery.caseSheet.occasion
  return id ? ctx.pack.occasions?.find((o) => o.id === id) : undefined
}

/** "the library" → "the Library"; small words stay small unless first. */
export function titleCase(text: string): string {
  const small = new Set(['a', 'an', 'the', 'of', 'at', 'on', 'in', 'to', 'and', 'over', 'aboard', 'for'])
  return text
    .split(' ')
    .map((w, i) => (i > 0 && small.has(w.toLowerCase()) ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1)))
    .join(' ')
}

/** Titles any case may take; the occasions add their own. */
const CASE_TITLES = [
  'Murder {At} {Place}',
  'Death {At} {Place}',
  'The {Short} Mystery',
  'The {Short} Affair',
  'A Body {Room}',
  '{Method} {Room}',
  '{Method} {At} {Place}',
  'The Mysterious Death of {Victim}',
  'Who Killed {Victim}?',
  'The Last Night of {Victim}',
  'Death in {Weather}',
]

/**
 * The case's title: drawn from the templates of the night, and the occasion's
 * own, by the seed. It may tell how, or where, or what the evening was for.
 * It never tells who.
 */
export function caseTitle(ctx: RenderCtx): string {
  const m = ctx.mystery
  const p = ctx.pack
  const method = p.methods.find((x) => x.id === m.truth.methodId)
  const own = occasionOf(ctx)?.titles ?? []
  // The occasion's titles are in the draw twice: they are the ones that tell a story.
  const pool = [...CASE_TITLES, ...own, ...own]
  const template = pool[hashString(`${m.seed}|title`) % pool.length]
  const slots: Record<string, string> = {
    Place: p.place.placeName,
    At: p.place.at,
    Short: p.place.placeShort,
    Victim: p.victim.shortName,
    LastName: p.victim.lastName,
    Room: inRoom(ctx, m.truth.sceneRoom),
    Method: method?.titled ?? 'Murder',
    Weather: p.place.weather,
  }
  const filled = template.replace(/\{(\w+)\}/g, (_, k: string) => slots[k] ?? k)
  return titleCase(filled)
}

export function renderIntro(ctx: RenderCtx): string {
  const line = pickLine(ctx, ['__intro'], 'intro')
  const intros = occasionOf(ctx)?.intro ?? ctx.pack.scenarioIntro
  const template = line ?? intros[hashString(`${ctx.mystery.seed}|intro`) % intros.length]
  return placed(ctx, fill(template, {
    victim: ctx.pack.victim.name,
    scene: roomName(ctx, ctx.mystery.caseSheet.sceneRoom),
    window: ctx.mystery.caseSheet.windowLabel,
  }))
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

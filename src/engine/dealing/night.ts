// What every phase of dealing a night shares: the inputs, what each phase
// adds, and the constants and accomplices they use. (See generate.ts.)

import type { CharacterDef, SettingPack } from '../../content/schema'
import type { Script } from '../deck'
import { Rng } from '../rng'
import { MOTIVE_GRADE, TEMPERAMENTS } from '../types'
import type {
  Answer, CharId, Claim, DefenseStyle, GameConfig, Mystery, NightKind, Relationship, RoleId, Spoken, Strategy,
  Temperament,
} from '../types'
import { CAREFUL_TRUTHS, DRUNK_BELIEFS, WORTH_BUYING } from '../roles'
import type { dealCast } from './cast'
import type { seatRoles } from './seats'
import type { settleFeelings } from './feelings'
import type { placeGuests } from './placing'
import type { layEvidence } from './evidence'
import type { shareKnowledge } from './knowledge'
import type { castParts } from './parts'
import type { tellLies } from './lies'
import type { pointFingers } from './suspicion'
import type { settleAftermath } from './aftermath'

/** What a night is dealt from. */
export interface Base {
  rng: Rng
  opts: GenerateOptions
  deck: RoleId[]
  /** Filled in for diagnostics: who this attempt made the culprit. */
  probe: { culprit: string }
  kind: NightKind
  /** A room locked tonight; and whether it holds somebody else's papers rather than the murderer's. */
  lock: { tonight: boolean; others: boolean }
}

/** What a phase adds to the night, where it does not fail. */
export type Dealt<F extends (night: never) => unknown> = Exclude<ReturnType<F>, string>

export type AfterCast = Base & Dealt<typeof dealCast>
export type AfterSeats = AfterCast & Dealt<typeof seatRoles>
export type AfterFeelings = AfterSeats & Dealt<typeof settleFeelings>
export type AfterPlacing = AfterFeelings & Dealt<typeof placeGuests>
export type AfterEvidence = AfterPlacing & Dealt<typeof layEvidence>
export type AfterKnowledge = AfterEvidence & Dealt<typeof shareKnowledge>
export type AfterParts = AfterKnowledge & Dealt<typeof castParts>
export type AfterLies = AfterParts & Dealt<typeof tellLies>
export type AfterSuspicion = AfterLies & Dealt<typeof pointFingers>
export type AfterAftermath = AfterSuspicion & Dealt<typeof settleAftermath>

// (Drawn from the registry of parts.)
export { CAREFUL_TRUTHS, DRUNK_BELIEFS, WORTH_BUYING }

export const DEFENSES: DefenseStyle[] = ['indignant', 'flustered', 'calm', 'selfdoubting']
export const CONCEALER_STRATEGIES: Strategy[] = ['bluffer', 'deflector', 'hedger', 'evasive']
export const HONEST_STRATEGIES: Strategy[] = ['open', 'accuser', 'theorist', 'reticent']
/** How often one with something to hide has seen something, true and harmless. */
export const LIAR_SAW = 0.4
/** What the bought witness keeps back: what they know by their role, and whom they saw. */
export const KEPT_BACK: ReadonlySet<Claim['kind']> = new Set([
  'sighting',
  'glimpse',
  'culpritAttr',
  'among',
  'alignment',
  'liarsAmong',
  'passage',
  'passing',
])

/** Why an attempt was rejected — for tuning probes, never for gameplay. */
export type GenFailure =
  | 'trait-share'
  | 'no-method'
  | 'rooms-exhausted'
  | 'no-company'
  | 'cover-pool'
  | 'fabrication'
  | 'lie-room'
  | 'no-frame'
  | 'no-lock'
  | 'no-seam'
  | 'no-passage'
  | 'sanity'
  | 'not-unique'
  | 'no-press-material'
  | 'no-opportunity-break'
  | 'careful-noticed'
  | 'bot-unsolved'
  | 'too-easy'

/**
 * Tonight's way of talking: one of the manners that suit the character, and
 * never one that does not. Knows nothing of roles.
 */
export function pickManner(rng: Rng, def: CharacterDef): Temperament {
  const weights = TEMPERAMENTS.map((t) => Math.max(0, def.manners?.[t] ?? 0))
  if (weights.every((w) => w === 0)) return rng.pick(TEMPERAMENTS)
  let roll = rng.next() * weights.reduce((a, b) => a + b, 0)
  let at = 0
  while (at < weights.length - 1 && roll >= weights[at]) {
    roll -= weights[at]
    at++
  }
  return TEMPERAMENTS[at]
}

/** Whom a piece of knowledge tells against, if anybody but the one who holds it. */
export function pointsAt(k: Claim, holder: CharId): CharId[] {
  switch (k.kind) {
    case 'relationship':
      return k.subject !== holder && k.rel !== 'devoted' && k.rel !== 'cordial' ? [k.subject] : []
    case 'earlier':
    case 'passing':
      return [k.target]
    case 'alignment':
      return k.alignment === 'evil' ? [k.target] : []
    case 'blackmailed':
      return [k.by]
    default:
      return []
  }
}

/**
 * Tonight's guests, drawn so that neither the men nor the women are fewer
 * than three (where the house has enough of both to choose from).
 */
export function mixedCompany(rng: Rng, pool: readonly CharacterDef[], n: number): CharacterDef[] {
  const least = Math.min(3, Math.floor(n / 2))
  const enough = (['he', 'she'] as const).every(
    (sex) => pool.filter((d) => d.pronouns === sex).length >= least,
  )
  if (!enough) return rng.sample([...pool], n)
  const most = n - least
  const count = { he: 0, she: 0, they: 0 }
  const out: CharacterDef[] = []
  for (const def of rng.shuffle([...pool])) {
    if (out.length === n) break
    if (def.pronouns !== 'they' && count[def.pronouns] >= most) continue
    // Leave room for whoever is still wanted of the others.
    const owed = (['he', 'she'] as const)
      .filter((sex) => sex !== def.pronouns)
      .reduce((sum, sex) => sum + Math.max(0, least - count[sex]), 0)
    if (n - out.length - 1 < owed) continue
    count[def.pronouns]++
    out.push(def)
  }
  return out
}

/** One of several, each by its weight. */
export function weightedPick<T extends { weight?: number }>(rng: Rng, from: readonly T[]): T {
  let roll = rng.next() * from.reduce((sum, x) => sum + (x.weight ?? 1), 0)
  for (const x of from) {
    roll -= x.weight ?? 1
    if (roll < 0) return x
  }
  return from[from.length - 1]
}

/** The motives a character could have. Never none. */
export function motivesOf(def: CharacterDef): Relationship[] {
  const fits = MOTIVE_GRADE.filter((rel) => !def.motives || (def.motives[rel] ?? 0) > 0)
  return fits.length > 0 ? fits : [...MOTIVE_GRADE]
}

export interface GenerateOptions {
  seed: number
  pack: SettingPack
  script?: Script
  config?: Partial<GameConfig>
  /** Diagnostics hook: called with the failure reason of each rejected attempt. */
  onAttempt?: (failure: GenFailure, deck: RoleId[], culprit?: string) => void
}

/** Every statement obtainable through play (all questions at full depth). */
export function allSpoken(mystery: Mystery): Spoken[] {
  const out: Spoken[] = []
  mystery.policies.forEach((policy, speaker) => {
    const answers: Answer[] = [
      policy.reaction,
      ...policy.role,
      ...policy.alibi,
      ...policy.knowledge,
      policy.seen,
      policy.suspect,
      ...Object.values(policy.aboutPerson),
      ...Object.values(policy.aboutEvidence),
    ]
    for (const answer of answers) {
      for (const claim of answer.claims) out.push({ speaker, claim })
    }
    // What an honest guest takes back, or gives up, when it is put to them.
    if (policy.press.kind === 'recant') {
      for (const claim of policy.press.claims) out.push({ speaker, claim })
    }
  })
  return out
}

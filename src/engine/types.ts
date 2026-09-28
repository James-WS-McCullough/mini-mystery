// Core domain model. Everything here is engine-side and UI-agnostic.

// ---------- identifiers ----------

/** Index into the cast array (0-based). */
export type CharId = number
export type RoomId = string
export type ItemId = string

export const VICTIM = 'victim'
export type Person = CharId | typeof VICTIM

// ---------- roles & alignment ----------

export type RoleId =
  | 'culprit'
  | 'witness'
  | 'oracle'
  | 'confidant'
  | 'gossip'
  | 'alibi'
  | 'thief'
  | 'begrudged'
  | 'loner'
  | 'drunk'

/** Access/capability tag — the MEANS pillar (public, like traits). */
export type MeansId = string
export type Alignment = 'good' | 'evil'

/**
 * Truth classes drive the solver:
 *  - honest: every structural claim they make is true
 *  - concealer: claims may be strategic lies (culprit, thief)
 *  - unreliable: sincere but wrong — role/info claims may be false, but
 *    whereabouts, sightings and relationship claims are true (the Drunk)
 */
export type TruthClass = 'honest' | 'concealer' | 'unreliable'

// ---------- personality ----------

/** Voice only. Carries zero information about guilt. */
export type Temperament = 'gracious' | 'prickly' | 'gossipy' | 'reserved' | 'dramatic'

/**
 * Behavior policy. Concealer strategies come in mirrored pairs with honest
 * strategies that share the same surface templates, so behavior alone never
 * reveals alignment: bluffer/open, deflector/accuser, hedger/theorist,
 * evasive/reticent.
 */
export type Strategy =
  | 'bluffer'
  | 'deflector'
  | 'hedger'
  | 'evasive'
  | 'open'
  | 'accuser'
  | 'theorist'
  | 'reticent'

/** How anyone reacts when challenged with a contradiction. */
export type DefenseStyle = 'indignant' | 'flustered' | 'calm' | 'selfdoubting'

export type Pronouns = 'he' | 'she' | 'they'

// ---------- attributes (for oracle info & trace evidence) ----------

/** Pack-defined visible characteristic, e.g. 'smoker', 'cane'. */
export type TraitId = string
export type Parity = 'odd' | 'even'

export type AttrRef = { kind: 'trait'; trait: TraitId } | { kind: 'parity'; parity: Parity }

// ---------- relationships to the victim ----------

export type Relationship = 'devoted' | 'cordial' | 'strained' | 'hostile' | 'indebted' | 'jilted'

export const MOTIVE_GRADE: readonly Relationship[] = ['hostile', 'indebted', 'jilted']

export function isMotiveGrade(rel: Relationship): boolean {
  return MOTIVE_GRADE.includes(rel)
}

// ---------- claims ----------

export type SoundKind = 'crash' | 'quarrel'

/**
 * The structural content of dialogue. Prose is rendered FROM claims and may
 * never add facts. Truth is machine-evaluable; contradictions are engine
 * verdicts over claims, never prose interpretation.
 */
export type Claim =
  | { kind: 'role'; role: RoleId }
  | { kind: 'whereabouts'; room: RoomId; companions: CharId[] } // exact & complete when honest
  | { kind: 'sighting'; target: CharId; room: RoomId } // "I saw <target> in <room> during the window"
  | { kind: 'glimpse'; attr: AttrRef; room: RoomId } // "I saw someone <attr> near <room>"
  | { kind: 'culpritAttr'; attr: AttrRef } // oracle-style info about the culprit
  | { kind: 'alignment'; target: CharId; alignment: Alignment } // confidant info
  | { kind: 'relationship'; subject: CharId; rel: Relationship } // subject's relationship to the victim
  | { kind: 'heard'; sound: SoundKind; room: RoomId } // "I heard a crash from the study"
  | { kind: 'suspicion'; target: CharId } // opinion; excluded from the solver

/** A claim attributed to its speaker — the solver's unit of input. */
export interface Spoken {
  speaker: CharId
  claim: Claim
}

// ---------- evidence ----------

export type EvidenceFact =
  | { kind: 'traceAtScene'; attr: AttrRef } // something the culprit left at the scene
  | { kind: 'weapon'; means: MeansId } // the murder method — the culprit had this access
  | { kind: 'forcedLockbox'; room: RoomId } // proof a theft happened in this room
  | { kind: 'motiveDocument'; subject: CharId; rel: Relationship } // proves a true relationship
  | { kind: 'flavor' } // nothing probative

export interface EvidenceItem {
  id: ItemId
  room: RoomId
  name: string
  fact: EvidenceFact
}

// ---------- ground truth ----------

export interface GroundTruth {
  /** Per CharId. */
  roles: RoleId[]
  /** Per CharId: where they truly were during the murder window. */
  locations: RoomId[]
  /** Per CharId: exact companion lists (symmetric, complete). */
  companions: CharId[][]
  /** Per CharId: true relationship to the victim. */
  relationships: Relationship[]
  sceneRoom: RoomId
  /** How the murder was done — the culprit holds this means tag. */
  methodId: string
  methodMeans: MeansId
  /** Where the theft happened (null when no thief in the deck). */
  theftRoom: RoomId | null
  /** Who was overheard quarrelling with the victim earlier that day (motive lead). */
  quarrelParticipant: CharId | null
  /** What the Drunk believes their role is (null when no drunk in the deck). */
  drunkBelievedRole: RoleId | null
}

// ---------- public case facts ----------

export interface CaseSheet {
  deck: RoleId[]
  sceneRoom: RoomId
  victimName: string
  windowLabel: string
  /** Seat number per CharId (1-based, around the dinner table). */
  seats: number[]
}

// ---------- cast ----------

export interface CastMember {
  id: CharId
  defId: string
  name: string
  shortName: string
  title: string
  portrait: string
  pronouns: Pronouns
  /** Public, visible characteristic, dealt afresh each case (several guests share each). */
  trait: TraitId
  /** The trait sits oddly on them and they know it. Colour only: says nothing of guilt. */
  furtive?: boolean
  /** Public access/capability tags — the means pillar (household knowledge). */
  means: MeansId[]
  seat: number
  temperament: Temperament
  strategy: Strategy
  defense: DefenseStyle
}

export function seatParity(seat: number): Parity {
  return seat % 2 === 1 ? 'odd' : 'even'
}

export function attrMatches(attr: AttrRef, member: CastMember): boolean {
  return attr.kind === 'trait' ? member.trait === attr.trait : seatParity(member.seat) === attr.parity
}

// ---------- questioning ----------

export type QuestionKey =
  | { kind: 'reaction' }
  | { kind: 'role' }
  | { kind: 'alibi' }
  | { kind: 'knowledge' }
  | { kind: 'suspect' }
  | { kind: 'aboutPerson'; person: Person }
  | { kind: 'aboutEvidence'; item: ItemId }

/**
 * Honest routing: a machine-readable pointer embedded in an answer — "ask this
 * person", "look in this room" — so a lost detective is steered toward the
 * productive line of inquiry. The rule-solver may only pursue what a referral
 * or claim has named.
 */
export interface Referral {
  person?: CharId
  room?: RoomId
  /** "Ask <person> about <about>" — who the referred-to person has material on. */
  about?: Person
}

/**
 * A precomputed answer: structural claims plus rendering hints. `claims` may
 * be empty (a pure non-answer / flavor line).
 */
export interface Answer {
  claims: Claim[]
  /** Dialogue bank key, resolved with the speaker's temperament at render time. */
  lineKey: string
  slots?: Record<string, string | number>
  refer?: Referral
}

export type PressKind = 'confess' | 'deflect' | 'baffled' | 'standFirm'

export interface PressOutcome {
  kind: PressKind
  claims: Claim[]
  lineKey: string
  slots?: Record<string, string | number>
}

/**
 * One character's complete statement policy: an answer for every question
 * (no statement-count tells). Array-valued entries are indexed by how many
 * times the question has been asked (clamped to the last entry) — evasive and
 * reticent characters give a vague first answer, substance on persistence.
 */
export interface Policy {
  reaction: Answer
  role: Answer[]
  alibi: Answer[]
  knowledge: Answer[]
  suspect: Answer
  aboutPerson: Record<string, Answer> // key: String(CharId) | 'victim'
  aboutEvidence: Record<ItemId, Answer>
  press: PressOutcome
}

// ---------- configuration & the assembled mystery ----------

export interface GameConfig {
  castSize: number
  rounds: number
  questionsPerRound: number
  citeCap: number
  deck: RoleId[]
}

/** One entry in the rule-solver's trace — reused as the reveal screen's "how it could have been solved". */
export interface SolveStep {
  action: 'search' | 'question' | 'press' | 'deduce'
  detail: string
}

export interface SolveTrace {
  steps: SolveStep[]
  questionsUsed: number
  searchesUsed: number
  culprit: CharId
}

export interface Mystery {
  seed: number
  settingId: string
  config: GameConfig
  cast: CastMember[]
  caseSheet: CaseSheet
  truth: GroundTruth
  evidence: EvidenceItem[]
  policies: Policy[]
  /** The intended deduction path, produced by the generation gate. */
  solution?: SolveTrace
}

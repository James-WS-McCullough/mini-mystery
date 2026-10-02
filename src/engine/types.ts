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
  | 'sleuth'
  | 'steward'
  | 'collector'
  | 'architect'
  | 'discoverer'
  | 'alibi'
  | 'thief'
  | 'begrudged'
  | 'loner'
  | 'redherring'
  | 'blackmailer'
  | 'amnesiac'
  | 'sweetheart'
  | 'perjurer'
  | 'forger'
  | 'framer'
  | 'cleaner'
  | 'whisperer'
  | 'sponsor'
  | 'martyr'
  | 'drunk'
  | 'hoaxer'

/**
 * What kind of murderer. All of them did it, and all of them lie about who
 * they are; they differ in what they do about being hunted.
 *  - plain: nothing more
 *  - serial: kills again in the night, to silence whoever knows most
 *  - regretful: owns to it at the last, before anybody is accused
 *  - cunning: pressed, owns to a lesser crime instead — a double bluff
 *  - careful: lies only about themselves, and so that no account collides —
 *    alone in an empty room, as somebody nobody else is playing
 *  - artful: made it look as though he took his own life, and left a note
 *    to say so, in a hand that is not quite his
 */
export type MurdererKind = 'plain' | 'serial' | 'regretful' | 'cunning' | 'careful' | 'artful'

/**
 * What kind of night: a murderer of some kind; or none at all, for he took
 * his own life; or none at all, for he is not dead (the Hoaxer helped him
 * fake it, and he is hiding behind a locked door).
 */
export type NightKind = MurdererKind | 'suicide' | 'hoax'

/** Access/capability tag — the MEANS pillar (public, like traits). */
export type MeansId = string
export type Alignment = 'good' | 'evil'

/**
 * Truth classes drive the solver:
 *  - honest: every structural claim they make is true
 *  - concealer: claims may be strategic lies (culprit, thief)
 *  - unreliable: sincere but wrong — role/info claims may be false, but
 *    whereabouts, sightings and relationship claims are true (the Drunk)
 *  - secretive: truthful in everything but where they were (the Sweethearts)
 *  - masked: truthful about where they were and what they saw, and in
 *    nothing they say of who they are or what they know (the Blackmailer)
 */
export type TruthClass = 'honest' | 'concealer' | 'unreliable' | 'secretive' | 'masked'

// ---------- personality ----------

/**
 * Voice only: how someone talks. Carries zero information about guilt — a
 * character has the manners of speaking that suit them, and the evening's
 * manner is chosen from among those without sight of the roles.
 */
export type Temperament =
  | 'gracious'
  | 'prickly'
  | 'gossipy'
  | 'reserved'
  | 'dramatic'
  | 'deferential'
  | 'boastful'
  | 'blunt'
  | 'rambling'
  | 'cheeky'
  | 'hearty'

export const TEMPERAMENTS: readonly Temperament[] = [
  'gracious',
  'prickly',
  'gossipy',
  'reserved',
  'dramatic',
  'deferential',
  'boastful',
  'blunt',
  'rambling',
  'cheeky',
  'hearty',
]

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
/** A man or a woman: what anybody can tell of a figure half seen. */
export type Sex = 'he' | 'she'

export type AttrRef = { kind: 'trait'; trait: TraitId } | { kind: 'sex'; sex: Sex }

// ---------- relationships to the victim ----------

export type Relationship =
  | 'devoted'
  | 'cordial'
  | 'strained'
  // Reasons enough to want him dead:
  | 'hostile' // a grievance
  | 'indebted' // owed him more than could be paid
  | 'jilted' // thrown over
  | 'disinherited' // about to be cut out of a will not yet signed
  | 'beneficiary' // the gainer by a will just signed
  | 'dismissed' // about to be turned out
  | 'exposed' // he knew their secret, and meant to tell it
  | 'rival' // his partner in business, and being squeezed out of it
  | 'forbidden' // wished to marry into his family, and was forbidden

export const MOTIVE_GRADE: readonly Relationship[] = [
  'hostile',
  'indebted',
  'jilted',
  'disinherited',
  'beneficiary',
  'dismissed',
  'exposed',
  'rival',
  'forbidden',
]

export function isMotiveGrade(rel: Relationship): boolean {
  return MOTIVE_GRADE.includes(rel)
}

// ---------- claims ----------

/**
 * What was overheard, or seen, earlier that day: the theft's crash, or the
 * afternoon's event at what became the scene — a quarrel, a door slammed and
 * somebody storming out, a telephone call cut short, somebody leaving in a
 * temper. All but the crash are of the afternoon, and prove nothing but that
 * somebody was at odds with the victim.
 */
export type SoundKind = 'crash' | 'quarrel' | 'slam' | 'telephone' | 'walkout'

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
  | { kind: 'culpritAttr'; attr: AttrRef; dying?: true } // what tells of the culprit: a detail noticed — or, `dying`, the victim's last word or sign
  | { kind: 'passing'; target: CharId } // "I passed <target> coming away from the scene" — a lead, and no more
  | { kind: 'among'; suspects: CharId[] } // sleuth info: the culprit is one of these
  | { kind: 'liarsAmong'; pair: [CharId, CharId]; count: number } // steward info: how many of two of the household lie about where they were
  | { kind: 'blackmailed'; by: CharId } // "<by> has been blackmailing me"
  | { kind: 'passage'; room: RoomId } // architect info: a secret passage runs from the scene to <room>
  | { kind: 'confession' } // "I killed him" — said at the last, by the murderer or by one who would hang for them
  | { kind: 'silent' } // "I have nothing to tell you" — what the bought witness says
  | { kind: 'bribed'; by: CharId } // "<by> paid me to hold my tongue"
  | { kind: 'toldBy'; by: CharId } // "I did not see it myself: <by> told me so"
  | { kind: 'earlier'; target: CharId; room: RoomId } // "I saw <target> in <room> — before the window"
  // "I forced the box in <room>": the Thief, owning to the lesser crime — or the
  // murderer, taking the Thief's part. The box in that room says which.
  | { kind: 'theft'; room: RoomId }
  | { kind: 'alignment'; target: CharId; alignment: Alignment } // confidant info
  | { kind: 'relationship'; subject: CharId; rel: Relationship } // subject's relationship to the victim
  | { kind: 'heard'; sound: SoundKind; room: RoomId } // "I heard a crash from the study"
  | { kind: 'suspicion'; target: CharId } // opinion; excluded from the solver
  | { kind: 'trust'; target: CharId } // opinion too: "whoever it was, it was not <target>"

/** The kinds of claim that tell of who someone is and what they know by it. */
export const INFO_CLAIMS: ReadonlySet<Claim['kind']> = new Set([
  'role',
  'culpritAttr',
  'among',
  'alignment',
  'glimpse',
  'liarsAmong',
  'passage',
  'passing',
])

/** A claim attributed to its speaker — the solver's unit of input. */
export interface Spoken {
  speaker: CharId
  claim: Claim
}

// ---------- evidence ----------

export type EvidenceFact =
  // Left by someone who spent the window alone there. One that was HANDED to
  // the detective is only as good as whoever handed it over.
  | { kind: 'trace'; room: RoomId; attr: AttrRef; givenBy?: CharId }
  // The murder method — the culprit had the means it needed.
  // Found anywhere but the scene (`foundIn`), it was carried off and hidden.
  | { kind: 'weapon'; means: MeansId; method?: string; foundIn?: RoomId }
  // The scene, with whatever did it taken away: the Cleaner has been there.
  | { kind: 'sceneCleared' }
  // The way through the walls, found in the room it leads to from the scene.
  | { kind: 'passage'; room: RoomId }
  // Somebody else is dead: whoever did the first did the second.
  | { kind: 'killed'; victim: CharId; room: RoomId }
  // What the murderer left at the second killing, done in a hurry.
  | { kind: 'secondTrace'; room: RoomId; attr: AttrRef }
  // Money, with a name on it: somebody has been paid to keep quiet.
  | { kind: 'bribe'; to: CharId }
  | { kind: 'forcedLockbox'; room: RoomId } // proof a theft happened in this room
  | { kind: 'lockboxIntact'; room: RoomId } // proof that none did
  | { kind: 'motiveDocument'; subject: CharId; rel: Relationship } // proves a true relationship
  // A note beside him, to say he did it himself: in his hand, or one very like it.
  | { kind: 'suicideNote' }
  // Something he truly wrote, to set the note beside. There is only ever one
  // to be found where the note is a forgery: then it shows the note for one.
  | { kind: 'handSample' }
  // The key to the room that was locked: found, the room may be searched.
  | { kind: 'key'; room: RoomId }
  | { kind: 'flavor' } // nothing probative

export interface EvidenceItem {
  id: ItemId
  room: RoomId
  name: string
  fact: EvidenceFact
  /** Not in the room: somebody took it up, and will hand it over when asked. */
  heldBy?: CharId
  /** Made to order. The truth of the matter, never shown before the reveal. */
  forged?: boolean
  /** Not there to be found before this hour (0 is the first). */
  from?: number
  /** Found without looking: it is put in front of the detective. */
  plain?: boolean
  /** Not found in a room but come by otherwise: "wired from the Yard". Kept off the plan. */
  came?: string
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
  /** Who was overheard at odds with the victim earlier that day (motive lead). */
  quarrelParticipant: CharId | null
  /** Who was in the corridor, coming away from the scene, just after: what the Observer saw. */
  corridor?: CharId | null
  /** What the afternoon's event was, and why the household had gathered. */
  event?: SoundKind
  occasion?: string
  /** What the Drunk believes their role is (null when no drunk in the deck). */
  drunkBelievedRole: RoleId | null
  /** Whom the Whisperer told a story to, and who repeats it as their own. */
  whispered?: CharId | null
  /** Whom the Framer has framed, and whose trace they took from the room. */
  framed?: CharId | null
  /** Whom the Hoaxer tried to put it on. */
  hoaxed?: CharId | null
  /** Whom the Sponsor has paid to say nothing. */
  bribed?: CharId | null
  /**
   * Whom the Sweetheart spent the hour with: an honest guest who will say
   * they were alone — the one lie they tell — until pressed.
   */
  sweetheartOf?: CharId | null
  /**
   * The secret passage, on a night that has one: the room it leads to from the
   * scene, and whether the murderer went by it (and so spent the hour there).
   */
  passage?: { room: RoomId; used: boolean } | null
  /** What kind of murderer did it. */
  murderer?: MurdererKind
  /** Nobody did it: he took his own life, and there is no murderer in the house. */
  suicide?: boolean
  /** Nobody did it: he is not dead. The Hoaxer helped him fake it; he is behind the locked door. */
  hoax?: boolean
  /**
   * A room locked, and its key gone missing: nothing in it can be found until
   * the key is. Nobody spent the hour there.
   */
  locked?: RoomId | null
  /** The second killing, where the murderer is one who kills again: who, where, and at which hour. */
  second?: { victim: CharId; room: RoomId; round: number } | null
  /** What the one who takes the blame could never have had. */
  martyrLacks?: 'means' | 'motive' | 'opportunity' | null
}

// ---------- public case facts ----------

/** The script as the detective is given it: what MAY be in the house. */
export interface PublicScript {
  innocents: RoleId[]
  herrings: RoleId[]
  helpers: RoleId[]
  herringCount: number
  /** How many innocent guests: left out, four. */
  innocentCount?: number
  /** The kinds of murderer there may be tonight. Left out: the plain kind only. */
  murderers?: MurdererKind[]
  /** The helpers listed may be absent tonight: none, or one. */
  helperMaybe?: boolean
  /**
   * He may have taken his own life, and then there is no murderer in the
   * house: one more of the suspicious sits in the murderer's place.
   */
  suicide?: boolean
  /** He may not be dead at all: the Hoaxer sits where the murderer would. */
  hoax?: boolean
}

export interface CaseSheet {
  script: PublicScript
  /** Why the household had gathered: an occasion id from the pack. */
  occasion?: string
  sceneRoom: RoomId
  victimName: string
  windowLabel: string
  /**
   * On a night with a secret passage: every room it might lead to from the
   * scene. Which of them it is, the detective must find out.
   */
  passageRooms?: RoomId[]
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
  temperament: Temperament
  strategy: Strategy
  defense: DefenseStyle
}

/** The other of the two. */
export function otherSex(sex: Sex): Sex {
  return sex === 'he' ? 'she' : 'he'
}

export function attrMatches(attr: AttrRef, member: CastMember): boolean {
  return attr.kind === 'trait' ? member.trait === attr.trait : member.pronouns === attr.sex
}

// ---------- questioning ----------

export type QuestionKey =
  | { kind: 'reaction' }
  | { kind: 'role' }
  | { kind: 'alibi' }
  | { kind: 'knowledge' }
  | { kind: 'seen' }
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
  /** Evidence handed over with the answer. */
  gives?: ItemId[]
  /**
   * What a quiet guest adds, shown an exhibit that touches them: the answer
   * they had been keeping back, said in the same breath.
   */
  also?: Answer
}

/** `recant`: an honest guest takes back what was not theirs to say, or says what they were paid not to. */
export type PressKind = 'confess' | 'recant' | 'deflect' | 'baffled' | 'standFirm'

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
  /** What they happened to see or hear, beside their role. */
  seen: Answer
  suspect: Answer
  aboutPerson: Record<string, Answer> // key: String(CharId) | 'victim'
  aboutEvidence: Record<ItemId, Answer>
  press: PressOutcome
  /** What they stand up and say when the household is gathered for the accusation. */
  confession?: Answer
  /**
   * A quiet guest's: the exhibits that touch them — a trace that fits them, a
   * weapon they had the means for, a paper with their name on it. Shown one
   * (or pressed), they say what they have been keeping back; asked again
   * without, they say no more.
   */
  opens?: ItemId[]
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
  /** Who did it: -1 for nobody, when he took his own life; -2 when he is not dead at all. */
  culprit: CharId
}

/**
 * Help to be found in the rooms, used once: Sergeant Pike to search a room,
 * strong coffee for more questions, a wire to the Yard about one guest, a
 * telephone call to an expert of the detective's acquaintance, and a sealed
 * note from somebody who would rather not be known.
 */
export type LifelineKind = 'pike' | 'coffee' | 'telegram' | 'expert' | 'note'

export interface Lifeline {
  id: string
  kind: LifelineKind
  room: RoomId
}

export interface Mystery {
  seed: number
  settingId: string
  config: GameConfig
  cast: CastMember[]
  caseSheet: CaseSheet
  truth: GroundTruth
  evidence: EvidenceItem[]
  /** Help hidden about the place (see Lifeline); none on old saves' nights. */
  lifelines?: Lifeline[]
  policies: Policy[]
  /** The intended deduction path, produced by the generation gate. */
  solution?: SolveTrace
}

import type { MeansId, Pronouns, Relationship, RoleId, RoomId, TraitId } from '../engine/types'

export interface CharacterDef {
  id: string
  name: string
  shortName: string
  title: string
  portrait: string
  pronouns: Pronouns
  trait: TraitId
  /** Public access/capability tags — the means pillar. */
  means: MeansId[]
  blurb: string
}

/**
 * One shape laid over the shared profile bust. Coordinates live in a
 * 100 × 120 box, the sitter facing right.
 *  - ink: extends the silhouette itself (hair, a beard, a cigar)
 *  - brass / pale: detail picked out in metal or linen
 */
export interface SilhouetteLayer {
  d: string
  tone: 'ink' | 'brass' | 'pale'
  /** Draw the path as a line of this width instead of a filled shape. */
  stroke?: number
}

/** A cameo portrait. Presentation only — it may show nothing but public traits. */
export interface SilhouetteDef {
  /** Backdrop colour behind the sitter. */
  tint: string
  layers: SilhouetteLayer[]
}

export interface MeansDef {
  id: MeansId
  /** Shown on the cast sheet, e.g. "keeps a key to the still-room". */
  label: string
}

export interface MethodDef {
  id: string
  means: MeansId
  /** The weapon as found evidence, e.g. "a vial from the still-room, half-empty". */
  weaponName: string
  /** How the method reads once known, e.g. "poisoned — by someone with still-room access". */
  methodLine: string
}

export interface RoomDef {
  id: RoomId
  name: string
  /** How the room is drawn on the floor plan (default: an ordinary indoor room). */
  kind?: 'indoor' | 'outdoor' | 'glasshouse'
  /** Flavor lines shown when a search of this room turns up nothing probative. */
  searchFlavor: string[]
}

export interface TraitDef {
  id: TraitId
  /** Shown on the cast sheet, e.g. "walks with a cane". */
  label: string
  /** How trace evidence of this trait reads, e.g. "a spill of pipe ash". */
  evidenceName: string
}

/**
 * Dialogue banks: template lists keyed by `<lineKey>.<temperament>` with a
 * `<lineKey>.any` fallback. Templates use {slot} placeholders and are shared
 * across alignments and truth classes — the anti-meta-tell rule. Prose renders
 * FROM claims and never adds facts.
 */
export type DialogueBanks = Record<string, string[]>

export interface SettingPack {
  id: string
  title: string
  victim: { name: string; shortName: string; title: string; pronouns: Pronouns }
  windowLabel: string
  rooms: RoomDef[]
  /** Rooms eligible to be the crime scene. */
  sceneRooms: RoomId[]
  /** Rooms eligible to host the theft (somewhere worth robbing). */
  valuableRooms: RoomId[]
  /** Rooms where a motive document plausibly lives. */
  docRooms: RoomId[]
  traits: TraitDef[]
  means: MeansDef[]
  /** Murder methods; each mystery draws one the culprit is capable of. */
  methods: MethodDef[]
  /** Character pool (≥ cast size; a subset is drawn per mystery). */
  characters: CharacterDef[]
  /** Cameo portraits by character id; anyone missing gets the plain bust. */
  silhouettes?: Record<string, SilhouetteDef>
  /** Motive documents by the relationship they prove. */
  motiveItems: Partial<Record<Relationship, string>>
  /** Non-probative set dressing found in otherwise quiet rooms. */
  flavorItems: string[]
  /** How each role speaks of itself in dialogue ("the one who saw something"). */
  roleNames: Partial<Record<RoleId, string>>
  /** Short noun labels for the notebook ("the witness", "the observant one"). */
  roleLabels: Partial<Record<RoleId, string>>
  /** Case-sheet lines describing what the evening must contain, per role. */
  deckDescriptions: Partial<Record<RoleId, string>>
  /** Opening narration; {victim}, {scene}, {window} slots. */
  scenarioIntro: string[]
  /** Narration for each hour's transition screen: one per hour, last = midnight. */
  interludes: string[]
  dialogue: DialogueBanks
}

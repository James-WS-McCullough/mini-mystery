import type { MeansId, Pronouns, Relationship, RoleId, RoomId, TraitId } from '../engine/types'

/**
 * How a character sounds as their words are typed out: a run of short blips
 * on one note. Colour only — a voice belongs to the character, never to the
 * part they are playing tonight.
 */
export interface VoiceDef {
  /** The note, in hertz: about 100 for a deep voice, 500 for a high one. */
  pitch: number
  wave: 'sine' | 'triangle' | 'square' | 'sawtooth'
  /** How far the voice wanders from its note, in semitones (default 2). */
  lilt?: number
  /** Length of each blip in seconds (default 0.06). */
  clip?: number
  /** Loudness against the other voices (default 1). */
  gain?: number
}

export interface CharacterDef {
  id: string
  name: string
  shortName: string
  title: string
  portrait: string
  pronouns: Pronouns
  /**
   * How likely each trait is to fall to this character when the evening's
   * traits are dealt, 0 to 1. A trait left out counts as 0.5. Dealt a trait
   * they lean against (0.2 or less), they are furtive about it.
   */
  leanings?: Partial<Record<TraitId, number>>
  /** Public access/capability tags — the means pillar. */
  means: MeansId[]
  voice?: VoiceDef
  blurb: string
}

/**
 * One shape added to a cameo. Coordinates live in a 100 × 120 box, the
 * sitter facing right.
 *  - ink: part of the silhouette itself (hair, a beard, a raised arm)
 *  - brass / pale: detail picked out in metal or linen
 */
export interface SilhouetteLayer {
  d: string
  tone: 'ink' | 'brass' | 'pale'
  /** Draw the path as a line of this width instead of a filled shape. */
  stroke?: number
  /**
   * What the shape belongs to. Shapes on the head (the default) are drawn in
   * the head's own space and follow its size, place and tilt; shapes on the
   * figure are fixed to the body.
   */
  on?: 'head' | 'figure'
}

/** How the shared head is reshaped for one sitter, about the base of the neck. */
export interface HeadShape {
  /** Width and height as multiples of the standard head. */
  wide?: number
  tall?: number
  /** Moved right / down, in box units. */
  dx?: number
  dy?: number
  /** Degrees; positive nods forward. */
  tilt?: number
}

/** A cameo portrait. Presentation only — it may show nothing but public traits. */
export interface SilhouetteDef {
  /** Backdrop colour behind the sitter. */
  tint: string
  head?: HeadShape
  /** The sitter's own shoulders and chest, in place of the standard ones. */
  body?: string
  layers: SilhouetteLayer[]
  /** What they hold or do with their hands when no trait asks for them. */
  prop?: SilhouetteLayer[]
  /** Their own way of wearing a trait, in place of the pack's usual drawing. */
  traits?: Partial<Record<TraitId, TraitLook>>
}

/** How a trait is drawn on a sitter. */
export interface TraitLook {
  layers: SilhouetteLayer[]
  /** The trait occupies the hands: the sitter's own prop is put down. */
  takesHands?: boolean
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
  /** The same, of someone it sits oddly on: "smokes, and would rather you had not noticed". */
  furtiveLabel?: string
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
  /** How each trait is usually drawn on a portrait. */
  traitLooks?: Partial<Record<TraitId, TraitLook>>
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

import type {
  MeansId,
  MurdererKind,
  Pronouns,
  Relationship,
  RoleId,
  RoomId,
  Temperament,
  TraitId,
} from '../engine/types'

/**
 * How a character sounds as their words are typed out: a run of short blips
 * on one note. Colour only — a voice belongs to the character, never to the
 * part they are playing tonight.
 */
export interface VoiceDef {
  /** The note, in hertz: about 130 for a deep voice, 500 for a high one. */
  pitch: number
  wave: 'sine' | 'triangle' | 'square' | 'sawtooth'
  /** How far the voice wanders from its note, in semitones (default 2). */
  lilt?: number
  /** Length of each blip in seconds (default 0.06). */
  clip?: number
  /** Loudness against the other voices (default 1). */
  gain?: number
  /**
   * How much the note rings, 0 to 1 (default 0): overtones above the pitch.
   * Deep voices want some, or they are heard as a thud and not a note.
   */
  ring?: number
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
  /**
   * The manners of speaking that suit them, each with a weight (0 to 1) for
   * how often they fall into it. They never speak in a manner left out: the
   * vicar may be gracious or may ramble, but is never cheeky. Leave the whole
   * thing out and any manner is as likely as another.
   */
  manners?: Partial<Record<Temperament, number>>
  /**
   * The reasons this character could have for wanting the victim dead, each
   * with a weight (0 to 1). A motive left out is one they cannot have: the
   * bootboy was never jilted. Leave the whole thing out and any will do.
   */
  motives?: Partial<Record<Relationship, number>>
  /** What they call the victim, where it is not what everybody calls him: "Father". */
  callsVictim?: string
  /** Kinship to the victim. Banks keyed `<key>@<kin>` are theirs alone. */
  kin?: string
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
  /** ink: the silhouette itself; brass / pale: metal or linen; russet / grey: hair with colour, or none, in it. */
  tone: 'ink' | 'brass' | 'pale' | 'russet' | 'grey'
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
  /**
   * How thick the neck is, against the standard one (1). Every sitter's neck
   * is drawn for them, from the jaw into the shoulders: nobody needs to draw
   * their own, and no head is ever left standing clear of its body.
   */
  neck?: number
  /** The sitter's own shoulders and chest, in place of the standard ones. */
  body?: string
  layers: SilhouetteLayer[]
  /** What they hold or do with their hands when no trait asks for them. */
  prop?: SilhouetteLayer[]
  /** Their own way of wearing a trait, in place of the pack's usual drawing. */
  traits?: Partial<Record<TraitId, TraitLook>>
}

/** The kinds of thing there are to find, each framed in its own colour. */
export type ItemKind = 'weapon' | 'trace' | 'lockbox' | 'document' | 'sign' | 'passage' | 'flavor'

/** How the exhibits are drawn: a silhouette each, on a 100 × 100 square. */
export interface ItemArt {
  /**
   * Drawings by key: `weapon.<method id>`, `trace.<trait id>`,
   * `doc.<relationship>`, `lockbox`, `misc`, and whatever `flavor` names.
   */
  glyphs: Record<string, SilhouetteLayer[]>
  /** Which drawing each motive document takes, by the item's name. */
  documents: Record<string, string>
  /** Which drawing each flavor item takes, by the item's name. */
  flavor: Record<string, string>
  /** The colour of the frame, by kind. */
  tints: Record<ItemKind, string>
}

/** How a trait is drawn on a sitter. */
export interface TraitLook {
  layers: SilhouetteLayer[]
  /** The trait occupies the hands: the sitter's own prop is put down. */
  takesHands?: boolean
}

/**
 * Why the guests were in the house: a house party, a will to be changed, the
 * firm's affairs, an engagement. It colours the opening, the afternoon's
 * event, and which motives are likeliest — and proves nothing.
 */
export interface OccasionDef {
  id: string
  /** As the case file puts it: "The household was gathered for a weekend party." */
  sheet: string
  /** Opening narration; {victim}, {scene}, {window} slots. */
  intro: string[]
  /** What was overheard that afternoon, at what became the scene. */
  event: import('../engine/types').SoundKind
  /** Motives this occasion makes likelier, as multipliers. */
  motives?: Partial<Record<Relationship, number>>
  /** How often it comes round (default 1). */
  weight?: number
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
  /** Where it could have been done. Left out: anywhere. */
  rooms?: RoomId[]
}

export interface RoomDef {
  id: RoomId
  name: string
  /** Being there, where it is not "in" it: "on the garden terrace". */
  where?: string
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
  /** How the exhibits are drawn. */
  itemArt?: ItemArt
  /** How each trait is usually drawn on a portrait. */
  traitLooks?: Partial<Record<TraitId, TraitLook>>
  /** Motive documents by the relationship they prove. */
  motiveItems: Partial<Record<Relationship, string[]>>
  /** How each standing with the victim reads in the notebook: "in his debt". */
  relationLabels?: Partial<Record<Relationship, string>>
  /** The scene with the weapon gone, as it is found. */
  bareScene?: string
  /** The second body, as it is found; `{name}` is whose. */
  secondBody?: string
  /** What the murderer left at the second killing, where it tells only their sex. */
  secondTraceBySex?: Partial<Record<'he' | 'she', string>>
  /** The kinds of murderer: what each is called, and what each does. */
  murderers?: Partial<Record<MurdererKind, { name: string; does: string }>>
  /** The secret passage, as it is found in the room it leads to. */
  passageItem?: string
  /** Money with a name on it; `{name}` is whose. */
  bribeItem?: string
  /** Non-probative set dressing found in otherwise quiet rooms. */
  flavorItems: string[]
  /**
   * The name of each role, as it is claimed aloud and written down: "the
   * Witness". A proper name, capitalised, so that it can be picked out of a
   * line of dialogue and shown as a tag.
   */
  roleNames: Partial<Record<RoleId, string>>
  /** The same names, for the notebook and the reveal. */
  roleLabels: Partial<Record<RoleId, string>>
  /** What each role is and does, for the list of the evening's roles. */
  deckDescriptions: Partial<Record<RoleId, string>>
  /** The icon each role's tag carries (an icon name from the UI's set). */
  roleIcons: Partial<Record<RoleId, string>>
  /** A sentence some roles add on naming themselves: those with nothing else to tell. */
  roleAsides?: Partial<Record<RoleId, string>>
  /** Opening narration; {victim}, {scene}, {window} slots. (The occasions' own, where there are any.) */
  scenarioIntro: string[]
  /** Why the household had gathered tonight: one is drawn each case. */
  occasions?: OccasionDef[]
  dialogue: DialogueBanks
}

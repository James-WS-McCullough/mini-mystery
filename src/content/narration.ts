// The detective's side of the night: what you say and do, and how the case
// board tells you what a pair of notes means. The same in every setting.
// `{slot}`s are filled by `narrate`; the store decides which line is meant,
// and words the names and their verbs (one is, two are) before they go in.

export const NARRATION = {
  // ---- the clock ----
  midnight: 'Midnight',

  // ---- searching ----
  locked: 'This room is locked, and the key has gone missing.',
  /** {room}; {found}: what the search turned up, already told. */
  searched: 'You search {room}. {found}',
  /** {name}, {item}, {inRoom}: "in the library". */
  handedOver: '{name} hands you {item}, taken up, they say, {inRoom}.',

  // ---- help ----
  /** {count} */
  coffee: 'Strong coffee: {count} more questions this hour.',
  /** {room} */
  pikeSent: 'Sergeant Pike goes to search {room}. He will report when the hour strikes.',
  /** {room}; {items}: what he found, joined. */
  pikeFound: 'Sergeant Pike searched {room}, and found {items}.',
  pikeFoundNothing: 'Sergeant Pike searched {room}, and found nothing of note.',
  noteOpened: 'You open the sealed note.',
  /** {name} */
  wire: 'A wire from the Yard about {name}.',
  /** {name} */
  expertCalled: 'You telephone for an expert opinion on {name}.',

  // ---- what you ask (as it is put, and as the notebook files it) ----
  'ask.reaction': '“What do you make of all this?”',
  'ask.role': '“And what were you, in all of this?”',
  'ask.alibi': '“Where were you during the murder?”',
  'ask.knowledge': '“What is your role?”',
  'ask.seen': '“What have you seen?”',
  'ask.suspect': '“Whom do you suspect?”',
  /** {name}: the dead man's. */
  'ask.victim': '“How did you stand with {name}?”',
  'ask.person': '“Tell me about {name}.”',
  /** {item} */
  'ask.evidence': 'You produce {item}.',
  'source.reaction': 'their opening statement',
  'source.role': 'asked their role',
  'source.alibi': 'asked their whereabouts',
  'source.knowledge': 'asked their role',
  'source.seen': 'asked what they have seen',
  'source.suspect': 'asked their suspicions',
  'source.victim': 'asked how they stood with {name}',
  'source.person': 'asked about {name}',
  'source.evidence': 'shown {item}',
  /** The default item, where it cannot be named. */
  theEvidence: 'the evidence',

  // ---- pressing ----
  press: 'You lay the contradiction before them, point by point.',
  /** {a}, {b}: the two notes. */
  pressPair: 'You put it to them that these cannot both be true: “{a}” and “{b}”.',

  // ---- the night's events ----
  /** {name} */
  standsUp: '{name} stands, before you can speak.',
  /** {name}, {inRoom} */
  foundDead: '{name} is found dead {inRoom}.',

  // ---- the case board: what a pair of notes comes to ----
  /** {name}: whoever has owned to the lie. */
  'deduce.knownLie': 'One of these is a lie, and {name} has owned to it already. There is nothing more to draw from it.',
  /** {sound} {soundBe}: who is borne out already; {caught} {caughtBe}: who is not telling the truth. */
  'deduce.againstUnborne':
    'A contradiction. These cannot both be true. But {sound} {soundBe} borne out already, so it is {caught} who {caughtBe} not telling you the truth. Put it to them.',
  /** {caught}: both claimants; {role}: the part both claim. */
  'deduce.roleTwice':
    'A contradiction. Nobody shares a role, and {caught} each claim to be {role}. One of them is somebody else, with a reason to hide it. Put it to either of them and see who gives way.',
  /** {caught}: "A, or B". */
  'deduce.oneOf':
    'A contradiction. These cannot both be true. Somebody here is not telling you the truth: {caught}. You cannot yet say which. Put it to either of them and see who gives way.',
  /** {caught} */
  'deduce.caught': 'A contradiction. This cannot be true. {caught} is caught out: put it to them.',
  /** {names} */
  'deduce.pairPerjurer':
    'Each puts the other beside them. On another night that would clear them both, but the Perjurer may be in the house, and would swear as much for the murderer. It holds only if something else bears {names} out.',
  /** {names} */
  'deduce.pairCunningClinger':
    'Each puts the other beside them. But the Cunning Murderer may have begged a kind friend to say as much, so it proves nothing by itself: not where they were, nor that neither was at the scene. It holds only if something else bears {names} out.',
  /** {neither}: "A nor B". */
  'deduce.pairClinger':
    'Each puts the other beside them. Neither {neither} was at the scene, then. But the Clinger may be in the house, and may have begged a kind friend to say as much, so it does not prove where they were.',
  'deduce.pair':
    'Each puts the other beside them, and liars lie alone. You may believe them both: neither {neither} was at the scene.',
  /** {names} */
  'deduce.handedForger':
    'It fits {names}, but this was handed to you, not found, and the Forger may be in the house. It bears them out only if whoever gave it to you is what they say.',
  'deduce.seenAtScene':
    'Both accounts put them at the scene within the hour. That is no alibi: it is opportunity. It may be the murderer, or somebody who left before the murderer came.',
  'deduce.byPassage':
    'They were alone in the room the passage leads to. That is no alibi: it is opportunity. They could have gone to the scene through the wall and come back, which is not to say they did.',
  /** {names} */
  'deduce.tracePassageUnknown':
    'The room bears them out: {names} was there. But a passage runs from the scene to some room in this house, and until you have found which, to have been alone in a room is not to have stayed in it.',
  'deduce.traceAtPassage':
    'The room bears them out: {names} was there, alone, and so is the passage to the scene. It clears nobody.',
  'deduce.trace': 'The room bears them out. {names} was there alone, as they said, and so not at the scene.',
  'deduce.corroboration': 'These hold together. A corroboration. It speaks for {names}, and it may clear them.',
  'deduce.clues': 'These hold together. Two clues telling the same story about the killer.',
  'deduce.drawn': 'You have already drawn that thread.',
  'deduce.miss': 'You turn the pair over in your mind, but nothing binds them, nor divides them.',
  'deduce.missLast': 'The threads blur before your eyes. Perhaps when the next hour has struck.',
} as const

export type NarrationKey = keyof typeof NARRATION

/** The hours of the night, as the clock tells them. */
export const CLOCK: readonly string[] = ['8 o’clock', '9 o’clock', '10 o’clock', '11 o’clock']

/** A line of narration, its slots filled. */
export function narrate(key: NarrationKey, slots: Record<string, string | number> = {}): string {
  return NARRATION[key].replace(/\{(\w+)\}/g, (whole, name: string) => (name in slots ? String(slots[name]) : whole))
}

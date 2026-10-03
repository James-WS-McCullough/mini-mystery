// What a guest has been given to do tonight, that the rest of the dealing
// must work around: one paid to keep quiet cannot also be the one who tells
// what they saw, nor be killed for knowing too much. Every choice of a guest
// for a purpose asks here, and the one table below says what rules them out —
// so a new part need only say what it ties its guest to, and which purposes
// that tie forbids.

import type { CharId } from '../types'

/** A part a guest has been given in somebody else's story tonight. */
export type Tie =
  /** Paid by the Sponsor to say nothing. */
  | 'bribed'
  /** Told a story by the Whisperer, and repeating it. */
  | 'whispered'
  /** Stripped of their alibi by the Framer. */
  | 'framed'
  /** The Sweetheart, keeping the secret of who they were with. */
  | 'keepsSecret'
  /** The one the Sweetheart was with, who says they were alone. */
  | 'hidesCompany'
  /** The Clinger, who begged a friend to swear to them. */
  | 'clings'
  /** The kind friend who swears the Clinger (or the murderer playing the part) was with them. */
  | 'vouches'
  /** Saw the Clinger where they really were: the one sighting that gives them the lie. */
  | 'sawClinger'
  /** Has the key to the locked room in their pocket. */
  | 'holdsKey'
  /** Has seen the key, and will say where. */
  | 'knowsKey'
  /** Will point the way to the murderer's papers. */
  | 'pointsToPapers'
  /** Will point the way to the room where something has been hidden. */
  | 'pointsToHidden'

/** What a guest may be chosen for. */
export type Purpose =
  | 'bribe'
  | 'whisper'
  | 'frame'
  | 'secondVictim'
  | 'stewardWatch'
  | 'passageEnd'
  | 'keptRoom'
  | 'collectTrace'
  | 'hiddenHint'
  | 'keyHint'
  | 'keyKeeper'
  | 'keyHintAtAll'
  | 'seeSweetheart'
  | 'seeClinger'
  | 'seenIdly'
  | 'seenByLiar'
  | 'carefulPair'

/** Which ties rule a guest out of which purposes. */
const RULED_OUT: Record<Purpose, readonly Tie[]> = {
  // Nobody pays the one who has already promised a friend a lie.
  bribe: ['vouches'],
  // One lie to a mouth: not the bought, nor whoever is already lying for somebody.
  whisper: ['bribed', 'hidesCompany', 'vouches'],
  // Their room must bear them out, once they own to the truth.
  frame: ['vouches'],
  // The murderer kills whoever knows too much; never anybody another part needs.
  secondVictim: ['bribed', 'whispered', 'framed', 'vouches', 'sawClinger', 'holdsKey', 'knowsKey'],
  // Whose one lie is not the Steward's to count.
  stewardWatch: ['vouches'],
  // Alone at the end of the passage: an account that clears nobody.
  passageEnd: ['vouches'],
  // A room somebody honest truly had alone, and will say so.
  keptRoom: ['vouches'],
  // The Collector never takes what will bear out a confession.
  collectTrace: ['clings', 'vouches'],
  // Who notices the room where the weapon, or the money, is hidden.
  hiddenHint: ['pointsToPapers', 'bribed'],
  // Who has seen the key: not the one holding it, nor anybody with a lead of their own to give.
  keyHint: ['holdsKey', 'bribed', 'pointsToPapers', 'pointsToHidden'],
  // The Porter, who keeps the keys: unless they hold this one, or were paid.
  keyKeeper: ['holdsKey', 'bribed'],
  // Where nobody else is free, anybody but the one holding it.
  keyHintAtAll: ['holdsKey'],
  seeSweetheart: ['hidesCompany'],
  // (And who will say so: nobody paid to keep quiet.)
  seeClinger: ['vouches', 'bribed'],
  // Seen by chance where they were: nobody whose account is a kindness or a secret.
  seenIdly: ['hidesCompany', 'vouches'],
  seenByLiar: ['hidesCompany', 'vouches'],
  // Two the Careful Murderer, passing for the Spinster, truly says were apart.
  carefulPair: ['vouches'],
}

/** What tonight's guests are tied to. */
export class Ties {
  private readonly by = new Map<CharId, Set<Tie>>()

  /** Tie a guest (none, where `c` is -1) to a part in somebody's story. */
  tie(c: CharId, tie: Tie): void {
    if (c < 0) return
    const ties = this.by.get(c) ?? new Set<Tie>()
    ties.add(tie)
    this.by.set(c, ties)
  }

  has(c: CharId, tie: Tie): boolean {
    return this.by.get(c)?.has(tie) ?? false
  }

  /** May this guest be chosen for this purpose? */
  free(c: CharId, purpose: Purpose): boolean {
    const ties = this.by.get(c)
    return !ties || !RULED_OUT[purpose].some((t) => ties.has(t))
  }

  /** Everybody tied to any of these. */
  holding(ties: readonly Tie[]): CharId[] {
    return [...this.by].filter(([, mine]) => ties.some((t) => mine.has(t))).map(([c]) => c)
  }
}

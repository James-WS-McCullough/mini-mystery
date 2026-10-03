// Every part a guest can play, and what the engine knows of each: its class
// on the case file, which of its words must be true, and the lists it belongs
// to. One entry per part, so a new part is added here (and in the pack, which
// says how it is named and drawn), and the lists elsewhere follow.
//
// The order of the entries matters: the lists below are drawn from it, and a
// list's order decides what a seed deals.

import type { RoleId, TruthClass } from './types'

/**
 * The four classes of role, as the case file lists them: the Murderer; the
 * Accomplices, who stand with them; the Suspicious, who look worse than they
 * are; and the Innocent, who have nothing to hide.
 */
export type RoleClass = 'murderer' | 'accomplice' | 'suspicious' | 'innocent'

export interface RoleSpec {
  /** Where the case file lists it. */
  class: RoleClass
  /** Which of their words must be true (see `holds` in the solver). */
  truth: TruthClass
  /** The murderer, or one who stands with them. */
  evil?: boolean
  /** Dealt only where a script adds it: the Architect where there is a passage, the Drunk on harder nights. */
  extra?: boolean
  /** Knows something by the part: a part a liar may pass for. */
  info?: boolean
  /** Knows of the murderer by the part: put away on a night with none. */
  seeksMurderer?: boolean
  /**
   * The Drunk may believe themself this part, by this order. (Never one whose
   * knowledge the solver would believe from the Drunk: the Gossip's.)
   */
  drunkBelief?: number
  /** Passing for this part, the Careful Murderer can tell its knowledge truly without naming themselves. */
  carefulTruth?: boolean
  /** Worth the Sponsor's money, by this order (the likeliest first). */
  bribeRank?: number
  /** Spends the hour alone, whatever else is dealt: nobody's company. */
  alone?: boolean
  /** Nobody happens to see them where they spent the hour. */
  unseen?: boolean
  /**
   * Whether the room they were alone in holds something of them: by default,
   * where they say truly they were there (or went by the passage); never, for
   * some; always, for one who lies about it but owns up.
   */
  trace?: 'never' | 'always'
}

export const ROLES: Record<RoleId, RoleSpec> = {
  // ---- the murderer, or whoever sits in their place ----
  murderer: { class: 'murderer', truth: 'concealer', evil: true },
  // Lies like a murderer: where they were, who they are, and whom they saw.
  hoaxer: { class: 'murderer', truth: 'concealer' },
  // Every word of the story they agreed between them.
  committee: { class: 'murderer', truth: 'concealer', evil: true },

  // ---- the innocent ----
  witness: { class: 'innocent', truth: 'honest', info: true, seeksMurderer: true, drunkBelief: 1, bribeRank: 1 },
  observer: { class: 'innocent', truth: 'honest', info: true, seeksMurderer: true, bribeRank: 5 },
  confidant: { class: 'innocent', truth: 'honest', info: true, drunkBelief: 3, carefulTruth: true, bribeRank: 6 },
  gossip: { class: 'innocent', truth: 'honest', info: true, carefulTruth: true },
  sleuth: { class: 'innocent', truth: 'honest', info: true, seeksMurderer: true, drunkBelief: 4, bribeRank: 3 },
  steward: { class: 'innocent', truth: 'honest', info: true, drunkBelief: 5, carefulTruth: true, bribeRank: 7 },
  collector: { class: 'innocent', truth: 'honest' },
  architect: { class: 'innocent', truth: 'honest', extra: true, info: true, carefulTruth: true, bribeRank: 4 },
  discoverer: { class: 'innocent', truth: 'honest', info: true, seeksMurderer: true, drunkBelief: 2, bribeRank: 2 },
  companion: { class: 'innocent', truth: 'honest' },
  porter: { class: 'innocent', truth: 'honest', info: true, carefulTruth: true },
  spinster: { class: 'innocent', truth: 'honest', info: true, carefulTruth: true },

  // ---- the suspicious ----
  thief: { class: 'suspicious', truth: 'concealer' },
  begrudged: { class: 'suspicious', truth: 'honest' },
  // Alone, and nothing vouches for them: not even the furniture.
  loner: { class: 'suspicious', truth: 'honest', alone: true, unseen: true, trace: 'never' },
  // Looked in at the scene and was seen; spent the hour elsewhere, and says so
  // truly — but claims to be somebody else, and says nothing of the scene until pressed.
  redherring: { class: 'suspicious', truth: 'masked', alone: true },
  blackmailer: { class: 'suspicious', truth: 'masked' },
  // Nobody can say where they were: only the room itself.
  amnesiac: { class: 'suspicious', truth: 'honest', alone: true, unseen: true },
  // Innocent, and with a secret worth every lie it takes to keep.
  sweetheart: { class: 'suspicious', truth: 'concealer' },
  // Innocent, and frightened: lies about where they were, and who they are.
  clinger: { class: 'suspicious', truth: 'concealer', trace: 'always' },
  drunk: { class: 'suspicious', truth: 'unreliable', extra: true },

  // ---- the accomplices ----
  perjurer: { class: 'accomplice', truth: 'concealer', evil: true },
  forger: { class: 'accomplice', truth: 'concealer', evil: true },
  framer: { class: 'accomplice', truth: 'concealer', evil: true },
  cleaner: { class: 'accomplice', truth: 'concealer', evil: true },
  whisperer: { class: 'accomplice', truth: 'concealer', evil: true },
  sponsor: { class: 'accomplice', truth: 'concealer', evil: true },
  // Says truly where they were, and nothing true of who they are, till the last.
  // (Nothing vouches for the one who means to be blamed.)
  martyr: { class: 'accomplice', truth: 'masked', evil: true, trace: 'never' },
}

/** Every part, in the registry's order. */
export const ROLE_IDS = Object.keys(ROLES) as RoleId[]

const where = (test: (spec: RoleSpec) => boolean): RoleId[] => ROLE_IDS.filter((r) => test(ROLES[r]))
const ranked = (rank: (spec: RoleSpec) => number | undefined): RoleId[] =>
  where((s) => rank(s) !== undefined).sort((a, b) => rank(ROLES[a])! - rank(ROLES[b])!)

/** The innocent parts every script deals from. */
export const INNOCENT_POOL: readonly RoleId[] = where((s) => s.class === 'innocent' && !s.extra)
/** The suspicious parts every script deals from. */
export const SUSPICIOUS_POOL: readonly RoleId[] = where((s) => s.class === 'suspicious' && !s.extra)
/** The accomplices: the murderer's friends. One of them at most, on a night that has any. */
export const HELPERS: readonly RoleId[] = where((s) => s.class === 'accomplice')
/** Parts with something to tell: a liar may claim one, the Drunk believe it. */
export const INFO_ROLES: readonly RoleId[] = where((s) => !!s.info)
/** Parts that know of the murderer, and are put away on a night with none. */
export const SEEKS_MURDERER: readonly RoleId[] = where((s) => !!s.seeksMurderer)
/** Parts the Drunk can sincerely believe themself to be. */
export const DRUNK_BELIEFS: readonly RoleId[] = ranked((s) => s.drunkBelief)
/** Parts the Careful Murderer can pass for, and tell truly. */
export const CAREFUL_TRUTHS: readonly RoleId[] = where((s) => !!s.carefulTruth)
/** Whose silence is worth paying for, the likeliest first. */
export const WORTH_BUYING: readonly RoleId[] = ranked((s) => s.bribeRank)

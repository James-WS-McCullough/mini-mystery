// The campaign: a run of cases that bring the game in one piece at a time.
// Each is a script of its own in a chosen setting, and may come with one of
// Sergeant Pike's lessons. The first is a fixed case number (three guests and
// the sergeant at the detective's elbow, so the lesson fits); the rest are
// dealt fresh each time they are played, with the setting, the parts and the
// guests the case asks for.

import type { PackId } from '../content'
import { KNOT_SCRIPT, SIMPLE_SCRIPT, TWIST_SCRIPT, type CastPin, type Script } from '../engine/deck'
import { INNOCENT_POOL } from '../engine/roles'
import { FIRST_CASE } from './firstCase'
import type { Tutorial, TutorialId } from './tutorial'

export type { Tutorial, TutorialId, TutorLocks, TutorStep, TutorView } from './tutorial'
export { OPEN } from './tutorial'

export interface CampaignCase {
  id: string
  /** Its place in the run: "Case 1". */
  chapter: string
  name: string
  /** A word on what it brings, for the campaign page. */
  text: string
  pack: PackId
  script: Script
  /** The case number, where it is the same case every time (so a lesson fits it). Left out, a fresh one is dealt. */
  seed?: number
  /** Who is found dead, by id (one of the setting's); left out, the number decides. */
  victim?: string
  /** Guests the case asks for: a part dealt, a character at the table, who is dealt what, and cause (see CastPin). */
  pins?: readonly CastPin[]
  /**
   * The case's own opening narration, in place of the setting's. Slots: the
   * victim's ({victim} full name, {Victim} short, {respectful}, {he} {him}
   * {his} {He} {His}), the place's, and {scene} and {window} for where and
   * when (see introSlots in src/engine/render).
   */
  intro?: string
  /** The case file's account of the evening, in place of the occasion's; the same slots. */
  report?: string
  tutorial?: TutorialId
}

/**
 * The first case's script: the murderer, the Thief, and one innocent with
 * something to tell, from the whole innocent pool (so that the liars have
 * parts to pass for). Five questions an hour, and no lifelines yet.
 */
export const FIRST_CASE_SCRIPT: Script = {
  id: 'custom',
  innocents: [...INNOCENT_POOL],
  suspicious: ['thief'],
  accomplices: [],
  suspiciousCount: 1,
  innocentCount: 1,
  questionsPerRound: 5,
  lifelines: false,
}

/**
 * The first case's number. Chosen (and held to by tests/campaign) for the
 * shape the lesson needs: the innocent is the Gossip, the weapon clears them
 * and nobody else, they know the murderer's grudge, the first contradiction
 * catches the Thief and not the murderer, and the murderer's own account
 * breaks against the Gossip's, which the room bears out.
 */
export const FIRST_CASE_SEED = 2291

/** A Simple Case, as the campaign deals it: with or without help hidden about the place. */
const classic = (lifelines: boolean): Script => ({ ...SIMPLE_SCRIPT, id: 'custom', lifelines })

/**
 * A night of the Knot's rules (the Drunk may walk, a passage may run from the
 * scene, a door may be locked), with what the case asks for on top: its kind
 * of murderer, its friend of the murderer's if any, its locks.
 */
const night = (own: Partial<Script>): Script => ({ ...KNOT_SCRIPT, id: 'custom', accomplices: [], ...own })

/** The first of the campaign's cases that stays hidden until the one before it is solved. */
export const HIDDEN_FROM = 6

export const CAMPAIGN: readonly CampaignCase[] = [
  {
    id: 'first-case',
    chapter: 'Case 0',
    name: 'The Housekeeper’s Death',
    text: 'Your first night with the division. Three guests, one murderer, and Sergeant Pike to show you how a case is worked.',
    pack: 'manor1920s',
    script: FIRST_CASE_SCRIPT,
    seed: FIRST_CASE_SEED,
    // (The housekeeper: the master of the house is alive, and the lesson is the same.)
    victim: 'pemberton',
    // (In the case's own words; the setting's narration would have it a houseful. See docs/pike-first-case.md.)
    intro:
      'A quiet weekend at Blackwood Manor, with only three guests down for it, and the river rising all afternoon. By dinner the flood had shut the house off from the world, and at eight o’clock {victim}, the housekeeper, was found in {scene}, quite dead. It had been done {window}. Three guests were in the house when it happened, and the flood has made quite certain that all three are still there.',
    report:
      '{Victim}, housekeeper at the manor these eleven years, was killed during the evening, after floodwater had cut the house off. Three guests were staying; the family were at dinner.',
    tutorial: 'first-case',
  },
  {
    id: 'village',
    chapter: 'Case 1',
    name: 'Murder in the Village',
    text: 'A full table at last: seven of the village snowed in at Little Wending, two of them with something to hide and one of them a murderer. Seven questions an hour, and nothing to help you but your notebook.',
    pack: 'village1926',
    script: classic(false),
  },
  {
    id: 'train',
    chapter: 'Case 2',
    name: 'Murder on the Highland Express',
    text: 'Another plain murder, aboard the night train north. Help is hidden about the carriages tonight: search, and you may find a friend.',
    pack: 'train1926',
    script: classic(true),
  },
  {
    id: 'village-drunk',
    chapter: 'Case 3',
    name: 'Return to the Village',
    text: 'Back to Little Wending, where one guest may have had too much to drink and be sincerely, dangerously wrong in all they tell you. A door may be locked, and its key gone.',
    pack: 'village1926',
    script: { ...SIMPLE_SCRIPT, id: 'custom', suspicious: [...SIMPLE_SCRIPT.suspicious, 'drunk'], lockedRoom: 0.4 },
    // (The Drunk walks most nights, not all: the case file says they may.)
    pins: [{ role: 'drunk', chance: 0.75 }],
  },
  {
    id: 'yacht',
    chapter: 'Case 4',
    name: 'Death Aboard the Corinthia',
    text: 'A gale, a yacht, and a murderer who may not be done: whoever knows most may not live to tell it. From tonight, a secret passage may run from the scene.',
    pack: 'boat1926',
    script: { ...TWIST_SCRIPT, id: 'custom', nights: { serial: 3, plain: 1 } },
  },
  {
    id: 'partner',
    chapter: 'Case 5',
    name: 'The Blackwood Partnership',
    text: 'Lord Blackwood’s partner is dead, the firm was failing, and his lordship had every reason; the whole house knows it. But a murderer on this night may have a friend to lie for them. Trust nobody’s word on its own.',
    pack: 'manor1920s',
    // (The murderer's friend tonight is the one who pays a witness: his lordship, with cause of his own.)
    script: { ...KNOT_SCRIPT, id: 'custom', accomplices: ['sponsor'], accompliceChance: 1 },
    victim: 'trent',
    // (His lordship has cause, always; most nights he is the Sponsor, and some nights his part is anybody's guess.)
    pins: [
      { character: 'lord', motive: true },
      { character: 'lord', role: 'sponsor', chance: 0.7 },
    ],
    intro:
      'Lord Blackwood had his partner down for the weekend, and the house knew why: Blackwood & Trent was in trouble, and the two of them had not been civil since the spring. By dinner the flood had shut the manor off from the world, and at eight o’clock {victim} was found in {scene}, quite dead. It had been done {window}. His lordship is under the same roof as everybody else, and the flood has made quite certain that nobody leaves it.',
    report:
      '{Victim}, Lord Blackwood’s partner in Blackwood & Trent, was killed during the evening, after floodwater had cut the house off. The partners were known to have fallen out. Lord Blackwood is among those in the house.',
  },
  {
    id: 'theatre',
    chapter: 'Case 6',
    name: 'Curtain Down at the Empress',
    text: 'A West End theatre, the first night off and the stage door bolted. The murderer tonight may be sorry for it, and a friend of theirs may have been busy with a pen: not every paper in the house need be what it seems.',
    pack: 'theatre1929',
    // (A regretful murderer wants a friend in the house; here it is the Forger.)
    script: night({ accomplices: ['forger'], accompliceChance: 0.8, nights: { regretful: 3, plain: 1 }, lockedRoom: 0 }),
  },
  {
    id: 'college',
    chapter: 'Case 7',
    name: 'Gaudy Night at St. Jude’s',
    text: 'An Oxford college in fog, the gate locked. The death may be dressed to look like the dead man’s own doing, or be it; somebody may be ready to take the blame; and from tonight a door may be locked and its key gone astray.',
    pack: 'college1927',
    // (The Artful Murderer makes it look like his own hand: a puzzle only where it truly might have been.)
    script: night({ accomplices: ['martyr'], accompliceChance: 0.4, nights: { artful: 3, suicide: 1, plain: 1 }, lockedRoom: 0.8 }),
  },
  {
    id: 'train-perjurer',
    chapter: 'Case 8',
    name: 'Night Mail North',
    text: 'The Highland Express again, snowbound. Somebody on the train may be swearing to an alibi that was never true, and will go on swearing to it until pressed.',
    pack: 'train1926',
    // (The Careful Murderer is on the sheet from here, a night in five, so that the finale's is no surprise by then.)
    script: night({ accomplices: ['perjurer'], accompliceChance: 0.8, nights: { plain: 3, regretful: 1, careful: 1 } }),
  },
  {
    id: 'hotel',
    chapter: 'Case 9',
    name: 'Out of Season',
    text: 'The Marine Hotel in a January gale. The murderer tonight may have been cunning about the hour, and every clock in the house is a witness.',
    pack: 'hotel1928',
    script: night({ nights: { cunning: 3, plain: 1, careful: 1 } }),
  },
  {
    id: 'blackwood',
    chapter: 'Case 10',
    name: 'The Death of Lord Blackwood',
    text: 'Blackwood Manor, and the master of the house found dead at last. Or is he? Somebody in the house knows more about tonight than a murderer would.',
    pack: 'manor1920s',
    script: night({ nights: { hoax: 3, plain: 1 } }),
    victim: 'blackwood',
  },
  {
    id: 'college-cleaner',
    chapter: 'Case 11',
    name: 'Term’s End at St. Jude’s',
    text: 'Back to the college. The scene may have been tidied by a friend of the murderer’s, and the weapon be wherever they spent the hour.',
    pack: 'college1927',
    script: night({ accomplices: ['cleaner'], accompliceChance: 0.8, nights: { plain: 3, serial: 1, careful: 1 } }),
  },
  {
    id: 'yard',
    chapter: 'Case 12',
    name: 'A Death at the Yard',
    text: 'Scotland Yard in rain and fog, and Chief Inspector Craddock dead in his own building. Sergeant Pike is at the table with the rest of the division, and the murderer may have been careful to have been somewhere nobody was.',
    pack: 'yard1928',
    script: night({ nights: { careful: 3, plain: 1, serial: 1, cunning: 1 } }),
    victim: 'craddock',
    pins: [{ character: 'pike' }],
  },
]

export const TUTORIALS: Record<TutorialId, Tutorial> = { 'first-case': FIRST_CASE }

export function campaignCase(id: string | null | undefined): CampaignCase | null {
  return CAMPAIGN.find((c) => c.id === id) ?? null
}

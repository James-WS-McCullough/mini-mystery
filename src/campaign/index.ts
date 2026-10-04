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
    text: 'Back to Little Wending, where one guest has had too much to drink and is sincerely, dangerously wrong in all they tell you. A door may be locked, and its key gone.',
    pack: 'village1926',
    script: { ...SIMPLE_SCRIPT, id: 'custom', suspicious: [...SIMPLE_SCRIPT.suspicious, 'drunk'], lockedRoom: 0.4 },
    pins: [{ role: 'drunk' }],
  },
  {
    id: 'yacht',
    chapter: 'Case 4',
    name: 'Death Aboard the Corinthia',
    text: 'A gale, a yacht, and a murderer who is not done: whoever knows most may not live to tell it. From tonight, a secret passage may run from the scene.',
    pack: 'boat1926',
    script: { ...TWIST_SCRIPT, id: 'custom', nights: { serial: 1 } },
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
    pins: [{ character: 'lord', role: 'sponsor', motive: true }],
    intro:
      'Lord Blackwood had his partner down for the weekend, and the house knew why: Blackwood & Trent was in trouble, and the two of them had not been civil since the spring. By dinner the flood had shut the manor off from the world, and at eight o’clock {victim} was found in {scene}, quite dead. It had been done {window}. His lordship is under the same roof as everybody else, and the flood has made quite certain that nobody leaves it.',
    report:
      '{Victim}, Lord Blackwood’s partner in Blackwood & Trent, was killed during the evening, after floodwater had cut the house off. The partners were known to have fallen out. Lord Blackwood is among those in the house.',
  },
]

export const TUTORIALS: Record<TutorialId, Tutorial> = { 'first-case': FIRST_CASE }

export function campaignCase(id: string | null | undefined): CampaignCase | null {
  return CAMPAIGN.find((c) => c.id === id) ?? null
}

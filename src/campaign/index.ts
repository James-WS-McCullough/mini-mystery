// The campaign: a run of cases that bring the game in one piece at a time.
// Each is a fixed case number on a script of its own, in a chosen setting,
// and may come with one of Sergeant Pike's lessons. The first is three guests
// and the sergeant at the detective's elbow; the rest are to follow.

import type { PackId } from '../content'
import type { Script } from '../engine/deck'
import { INNOCENT_POOL } from '../engine/roles'
import { FIRST_CASE } from './firstCase'
import type { Tutorial, TutorialId } from './tutorial'

export type { Tutorial, TutorialId, TutorLocks, TutorStep, TutorView } from './tutorial'
export { OPEN } from './tutorial'

export interface CampaignCase {
  id: string
  /** Its place in the run: "Case one". */
  chapter: string
  name: string
  /** A word on what it brings, for the campaign page. */
  text: string
  pack: PackId
  script: Script
  /** The case number: the same case every time, so the lesson fits it. */
  seed: number
  /** Who is found dead, by id (one of the setting's): fixed, so the lesson fits. */
  victim?: string
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

export const CAMPAIGN: readonly CampaignCase[] = [
  {
    id: 'first-case',
    chapter: 'Case one',
    name: 'A Quiet Word',
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
]

export const TUTORIALS: Record<TutorialId, Tutorial> = { 'first-case': FIRST_CASE }

export function campaignCase(id: string | null | undefined): CampaignCase | null {
  return CAMPAIGN.find((c) => c.id === id) ?? null
}

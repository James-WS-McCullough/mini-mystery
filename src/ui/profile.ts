// The detective's standing record: closed cases, rank, commendations. Lives in
// this browser only.

import { computed, reactive, watch } from 'vue'
import type { CaseTier, Pillars } from '../engine/verdict'
import type { NightStats, ScriptId } from '../stores/game'
import type { PackId } from '../content'
import type { ModeId } from './modes'
import { CAMPAIGN } from '../campaign'
import { migrateCase } from '../stores/night/migrate'
import { readJson, writeJson } from './storage'

export interface CaseRecord {
  seed: number
  script: ScriptId
  /** How hard it was set up to be (left out on cases filed before there were modes). */
  mode?: ModeId
  /** Which setting it was played in (the manor, when left out). */
  pack?: string
  /** A campaign case, by id (see src/campaign). */
  campaign?: string
  /** ISO date when this was that day's daily case. */
  daily: string | null
  tier: CaseTier
  accused: string
  culprit: string
  cleared: number
  pillars: Pillars
  stats: NightStats
  at: number
}

export interface Commendation {
  id: string
  name: string
  text: string
  earned: (r: CaseRecord, all: CaseRecord[]) => boolean
}

interface Profile {
  cases: CaseRecord[]
  /** Commendation id → when it was earned. */
  commendations: Record<string, number>
}

const KEY = 'mini-mystery:profile'
const MAX_CASES = 200

export const profile = reactive<Profile>({
  cases: [],
  commendations: {},
  // (Older records carry the sergeant's first-night hints, since replaced by the campaign; they are let be.)
  ...readJson<Partial<Profile>>(KEY, {}),
})
// (Cases filed under the evenings' old names.)
profile.cases = profile.cases.map(migrateCase)

watch(profile, (p) => writeJson(KEY, p), { deep: true })

const solved = (r: CaseRecord) => r.tier !== 'wrong'

export const COMMENDATIONS: Commendation[] = [
  {
    id: 'first-case',
    name: 'The Right Name',
    text: 'Name a murderer correctly.',
    earned: solved,
  },
  {
    id: 'airtight',
    name: 'Airtight',
    text: 'Close a case with means, motive and opportunity against the only name left standing.',
    earned: (r) => r.tier === 'airtight',
  },
  {
    id: 'early',
    name: 'Home Before the Embers',
    text: 'Name the murderer before ten o’clock strikes.',
    earned: (r) => solved(r) && r.stats.accusedAtRound <= 1,
  },
  {
    id: 'steady',
    name: 'A Steady Hand',
    text: 'Solve a case having drawn three threads or more without one wrong pairing.',
    earned: (r) => solved(r) && r.stats.wrongGuesses === 0 && r.stats.threadsDrawn >= 3,
  },
  {
    id: 'foggy',
    name: 'Through the Fog',
    text: 'Solve a case With a Twist, or a harder one.',
    // (Not the campaign's first cases, which are easier than any of the four.)
    earned: (r) => solved(r) && r.script !== 'simple' && !r.campaign,
  },
  {
    id: 'daily',
    name: 'The Morning Edition',
    text: 'Solve a daily case.',
    earned: (r) => solved(r) && r.daily !== null,
  },
  {
    id: 'streak',
    name: 'Three on the Trot',
    text: 'Solve three cases running.',
    earned: (_r, all) => all.length >= 3 && all.slice(-3).every(solved),
  },
  {
    id: 'veteran',
    name: 'An Old Hand',
    text: 'Solve ten cases.',
    earned: (_r, all) => all.filter(solved).length >= 10,
  },
  {
    id: 'welcome',
    name: 'Welcome to the Force',
    text: 'Solve your first case with the division, with Sergeant Pike at your elbow.',
    earned: (r) => solved(r) && r.campaign === CAMPAIGN[0].id,
  },
  {
    id: 'finale',
    name: 'The Chief Avenged',
    text: 'Close the last case of the campaign, with the Chief Inspector dead at the Yard.',
    earned: (r) => solved(r) && r.campaign === CAMPAIGN.at(-1)!.id,
  },
  {
    id: 'campaign',
    name: 'The Whole Division',
    text: 'Solve every case of the campaign, from the housekeeper’s death to the Chief’s.',
    earned: (_r, all) => CAMPAIGN.every((c) => all.some((x) => x.campaign === c.id && solved(x))),
  },
]

const POINTS: Record<CaseTier, number> = { airtight: 3, strong: 2, thin: 1, wrong: 0 }

export const RANKS = [
  { name: 'Constable', at: 0 },
  { name: 'Sergeant', at: 4 },
  { name: 'Inspector', at: 10 },
  { name: 'Chief Inspector', at: 20 },
  { name: 'Superintendent', at: 35 },
] as const

export const standing = computed(() => {
  const points = profile.cases.reduce((sum, r) => sum + POINTS[r.tier], 0)
  let index = 0
  RANKS.forEach((r, i) => {
    if (points >= r.at) index = i
  })
  const next = RANKS[index + 1] ?? null
  return {
    points,
    rank: RANKS[index].name,
    next: next ? { name: next.name, needs: next.at - points } : null,
    solved: profile.cases.filter(solved).length,
    total: profile.cases.length,
  }
})

/** File a closed case. Returns the commendations it newly earned. */
export function fileCase(record: CaseRecord): Commendation[] {
  profile.cases.push(record)
  if (profile.cases.length > MAX_CASES) profile.cases.splice(0, profile.cases.length - MAX_CASES)
  const fresh = COMMENDATIONS.filter(
    (c) => !(c.id in profile.commendations) && c.earned(record, profile.cases),
  )
  for (const c of fresh) profile.commendations[c.id] = record.at
  return fresh
}

// ---------- the campaign ----------

/** Has a campaign case been solved? */
export function campaignSolved(id: string): boolean {
  return profile.cases.some((r) => r.campaign === id && solved(r))
}

// ---------- the daily case ----------

export function todayIso(now = new Date()): string {
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${m}-${d}`
}

/** Everyone gets the same case on the same day: the date is the case number. */
export function dailySeed(iso: string): number {
  return Number(iso.replaceAll('-', ''))
}

/** The settings the daily case may be set in: the ones everybody has from the start (the rest are the campaign's secret). */
export const DAILY_PACKS: readonly PackId[] = ['manor1920s', 'village1926', 'train1926', 'boat1926']

/** And the same setting: the four in turn, a day each. */
export function dailyPack(iso: string): PackId {
  const [y, m, d] = iso.split('-').map(Number)
  const day = Math.floor(Date.UTC(y, m - 1, d) / 86_400_000)
  return DAILY_PACKS[day % DAILY_PACKS.length]
}

export function dailyResult(iso: string): CaseRecord | null {
  return profile.cases.find((r) => r.daily === iso) ?? null
}

const TIER_WORD: Record<CaseTier, string> = {
  airtight: 'An Airtight Case',
  strong: 'A Strong Case',
  thin: 'A Lucky Finger',
  wrong: 'The Wrong Name',
}

const HOURS = ['8', '9', '10', '11', 'midnight']

/** A result to pass around that gives nothing of the case away. */
export function shareText(r: CaseRecord): string {
  const mark = (s: Pillars[keyof Pillars]) => (s === 'established' ? '◆' : '◇')
  const hour = HOURS[Math.min(r.stats.accusedAtRound, HOURS.length - 1)]
  const when = hour === 'midnight' ? 'at midnight' : `in the ${hour} o’clock hour`
  const title = r.daily ? `Mini-Mystery: daily case, ${r.daily}` : `Mini-Mystery: case №${r.seed}`
  return [
    title,
    `${TIER_WORD[r.tier]}, accused ${when}`,
    `means ${mark(r.pillars.means)}  motive ${mark(r.pillars.motive)}  opportunity ${mark(r.pillars.opportunity)}`,
    `cleared ${r.cleared}/6 · ${r.stats.threadsDrawn} threads · ${r.stats.wrongGuesses} wrong pairings`,
  ].join('\n')
}

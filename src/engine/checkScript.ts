// Whether an evening can be dealt, and if not, why: for a Custom evening the
// detective sets (and to keep the four honest). Each rule here is something
// the dealing needs, said in words; a script that passes them all can be dealt.

import { committeeSize, type Script } from './deck'
import { DRUNK_BELIEFS, INFO_ROLES, ROLES, SEEKS_MURDERER } from './roles'
import type { NightKind, RoleId } from './types'

/** Something an evening asks that cannot be dealt: what it is about, and why. */
export interface ScriptProblem {
  /** The setting it is about: a field of the script, or a part. */
  about: keyof Script | RoleId
  text: string
}

/** How many innocents sit at every table, unless the script says. */
const INNOCENT_GUESTS = 4

export function checkScript(script: Script): ScriptProblem[] {
  const out: ScriptProblem[] = []
  const say = (about: ScriptProblem['about'], text: string) => out.push({ about, text })
  const nights = Object.entries(script.nights ?? { plain: 1 }).filter(([, w]) => (w ?? 0) > 0).map(([k]) => k as NightKind)
  const may = (kind: NightKind) => nights.includes(kind)
  const innocents = script.innocents
  const suspicious = script.suspicious
  const accomplices = script.accomplices
  const innocentCount = script.innocentCount ?? INNOCENT_GUESTS
  const sober = suspicious.filter((r) => r !== 'drunk')
  const withAccomplice = accomplices.length > 0
  const alwaysAccomplice = withAccomplice && (script.accompliceChance ?? 1) >= 1

  // ---- the parts, in their places ----
  const listed: [keyof Script, RoleId[], string][] = [
    ['innocents', innocents, 'innocent'],
    ['suspicious', suspicious, 'suspicious'],
    ['accomplices', accomplices, 'accomplice'],
  ]
  for (const [field, roles, cls] of listed) {
    for (const r of roles) {
      if (!ROLES[r]) say(r, `${r} is no part anybody plays.`)
      else if (ROLES[r].class !== cls) say(r, `${r} is not one of the ${cls === 'innocent' ? 'innocent' : cls === 'suspicious' ? 'suspicious' : 'accomplices'}.`)
    }
    if (new Set(roles).size !== roles.length) say(field, 'A part is listed twice.')
  }

  // ---- how many sit down ----
  if (innocentCount < 1) say('innocentCount', 'There must be at least one innocent guest.')
  if (innocents.length < innocentCount) say('innocents', `${innocentCount} innocent guests need at least ${innocentCount} innocent parts.`)
  if (script.suspiciousCount < 0) say('suspiciousCount', 'There cannot be fewer than no suspicious guests.')
  if (withAccomplice && script.suspiciousCount < 1) say('suspiciousCount', 'An accomplice takes the place of one of the suspicious: there must be at least one.')
  if (!alwaysAccomplice && suspicious.length < script.suspiciousCount) {
    say('suspicious', `${script.suspiciousCount} suspicious guests need at least ${script.suspiciousCount} suspicious parts.`)
  }
  if (withAccomplice && sober.length < script.suspiciousCount - 1) {
    say('suspicious', 'Beside an accomplice, the rest of the suspicious must be parts other than the Drunk.')
  }

  // ---- what the parts need ----
  // Whoever lies about who they are passes for an innocent part with something to tell.
  if (!innocents.some((r) => INFO_ROLES.includes(r))) {
    say('innocents', 'Liars need a part to pass for: at least one innocent part with something to tell.')
  }
  if (innocents.includes('architect') && !script.passage) say('architect', 'The Architect knows where the passage runs: there must be one.')
  if (suspicious.includes('drunk') && !DRUNK_BELIEFS.some((r) => innocents.includes(r))) {
    say('drunk', 'The Drunk believes themself the Witness, the Discoverer, the Confidant, the Sleuth or the Steward: one of them must be on the script.')
  }
  // (Those who were with somebody, or swear to it, need somebody honest to have been with.)
  const paired = suspicious.filter((r) => r === 'sweetheart' || r === 'clinger').length + (innocents.includes('companion') ? 1 : 0)
  if (paired > 0 && innocentCount < 2) say('innocentCount', 'The Sweetheart, the Clinger and the Companion need honest company: at least two innocent guests.')

  // ---- the kinds of night ----
  if (nights.length === 0) say('nights', 'There must be some kind of night: at least one with a weight.')
  for (const [kind, w] of Object.entries(script.nights ?? {})) {
    if ((w ?? 0) < 0) say('nights', `${kind} cannot be less likely than never.`)
  }
  if (may('artful') && !may('suicide')) say('nights', 'The Artful Murderer makes it look as though he did it himself: there must be nights he truly did.')
  if (may('regretful') && !withAccomplice) say('nights', 'The Regretful Murderer owns to it where a friend might: there must be accomplices.')
  for (const kind of ['cunning', 'careful', 'suicide', 'hoax', 'committee'] as NightKind[]) {
    if (may(kind) && alwaysAccomplice) say('nights', `A ${kind} night has no accomplice: the accomplice cannot be certain.`)
  }
  // On a night with no murderer, whoever would have told of one is somebody else.
  const nonSeekers = innocents.filter((r) => !SEEKS_MURDERER.includes(r)).length
  if ((may('suicide') || may('hoax')) && nonSeekers < innocentCount) {
    say('innocents', `A night with no murderer needs ${innocentCount} innocent parts that do not look for one (not the Witness, the Observer, the Discoverer or the Sleuth).`)
  }
  if (may('suicide') && sober.length < script.suspiciousCount + 1) {
    say('suspicious', 'Where he did it himself, one more of the suspicious sits in the murderer’s place: there must be a part to spare.')
  }
  if (may('committee')) {
    const table = 1 + script.suspiciousCount + innocentCount
    const size = committeeSize(table)
    // A majority of the table, and two innocent at least beside them: one to
    // put it on, with an alibi of their own, and one more for the story to break against.
    if (table - size < 2) say('nights', 'The Committee is a majority of the table, with two innocent guests at least beside them: five guests or more.')
    // More of them than an ordinary night's liars (the murderer and the suspicious): or they might be those.
    if (size <= 1 + script.suspiciousCount) {
      say('nights', `The Committee must outnumber an ordinary night’s liars: ${size} of them is no more than the murderer and ${script.suspiciousCount} suspicious.`)
    }
    if (nonSeekers < table - size) say('innocents', 'The Committee’s innocent guests need parts that do not look for one murderer.')
    // (The Companion's friend is never alone: somebody else must be, at the passage's end.)
    if (script.passage && innocents.includes('companion') && table - size < 3) {
      say('nights', 'With the Companion and a passage, the Committee needs three innocent guests beside them: one alone at the passage’s end.')
    }
    const covers = ['witness', 'gossip', 'collector', 'confidant', 'companion'].filter((r) => innocents.includes(r as RoleId))
    if (covers.length < size) {
      say('nights', `The Committee needs ${size} parts to pass for, from the Witness, the Gossip, the Collector, the Confidant and the Companion.`)
    }
  }

  // ---- the rest ----
  const chance = (field: keyof Script, value: number | undefined) => {
    if (value !== undefined && (value < 0 || value > 1)) say(field, 'A chance is between never and always.')
  }
  chance('accompliceChance', script.accompliceChance)
  chance('lockedRoom', script.lockedRoom)
  if ((script.questionsPerRound ?? 7) < 1) say('questionsPerRound', 'There must be questions to ask.')
  return out
}

// One phase of dealing a night (see generate.ts).

import { findContradictions, pressableChars } from '../contradictions'
import type { NotedStatement } from '../contradictions'
import { accountOf, buildPolicy, passesSanity } from '../policy'
import { solveMystery } from '../solver/deduce'
import { enumerateWorlds, isConsistent } from '../solver/worlds'
import { isMotiveGrade } from '../types'
import type { CharId, Guest, MurdererKind, Mystery, NightKind, Policy, Spoken } from '../types'
import { OPPORTUNITY_BREAKS } from '../verdict'
import { allSpoken } from './night'
import type { AfterAftermath } from './night'

/** The answers each would give; then the gates every night must pass. */
export function weighNight(night: AfterAftermath) {
  const {
    rng, opts, pack, script, config, roles, suicide, hoax, hoaxer, committee, members, noSingle, culprit,
    sceneRoom, cast, passageNight, careful, viaPassage, whisperer, sponsor, occasion, relationships, allRooms,
    sweetheartOf, clingerOf, act, fallback, clung, truth, evidence, bribed, motiveItem, docRoom, knowledge,
    incidental, quarrelHearer, docReferralHolder, hintRoom, weaponReferralHolder, keyHint, coverRoles,
    fabricated, lies, whispered, suspicionTarget, grounds, trusts, withheld, confessors, ties, victim,
  } = night
  // ---- statement policies ----
  const policyContext = {
      cast,
      truth,
      evidence,
      knowledge,
      incidental,
      coverRoles,
      fabricated,
      lies,
      suspicionTarget,
      grounds,
      trusts,
      docReferralHolder,
      docRoom,
      weaponReferralHolder,
      weaponRoom: hintRoom ?? sceneRoom,
      quarrelHearer,
      confessors,
      bribe: bribed >= 0 ? { to: bribed, by: sponsor, withheld } : undefined,
      whisper: whispered >= 0 ? { to: whispered, by: whisperer } : undefined,
      act: act ?? undefined,
      sweetheartOf: sweetheartOf >= 0 ? sweetheartOf : undefined,
      clingerOf: clingerOf >= 0 ? clingerOf : undefined,
      clung: clung >= 0 ? clung : undefined,
      fallback: fallback ?? undefined,
      keyHint,
    }
  // Each guest's night as it was and as they tell it; and every answer drawn from that.
  const guests: Guest[] = cast.map((m) => accountOf(m.id, policyContext))
  const policies: Policy[] = cast.map((m) => buildPolicy(m.id, policyContext, guests[m.id]))

  const caseSheet = {
    script: {
      innocents: [...script.innocents],
      suspicious: [...script.suspicious],
      accomplices: [...script.accomplices],
      suspiciousCount: script.suspiciousCount,
      ...(script.innocentCount !== undefined ? { innocentCount: script.innocentCount } : {}),
      ...(script.nights
        ? {
            murderers: (Object.keys(script.nights) as NightKind[]).filter(
              (k): k is MurdererKind => k !== 'suicide' && k !== 'hoax',
            ),
          }
        : {}),
      ...(script.nights?.suicide ? { suicide: true } : {}),
      ...(script.nights?.hoax ? { hoax: true } : {}),
      ...(script.nights?.committee ? { committee: true } : {}),
      ...((script.accompliceChance ?? 1) < 1 ? { accompliceMaybe: true } : {}),
    },
    ...(occasion ? { occasion: occasion.id } : {}),
    sceneRoom,
    victimName: victim.name,
    windowLabel: pack.windowLabel,
    ...(passageNight ? { passageRooms: allRooms.filter((r) => r !== sceneRoom) } : {}),
  }

  const mystery: Mystery = {
    seed: opts.seed,
    settingId: pack.id,
    victim,
    config,
    cast,
    caseSheet,
    truth,
    evidence,
    guests,
    policies,
  }

  // ---- gates ----
  if (!passesSanity(mystery)) return 'sanity'

  // (On a night he did it himself, the only answer left is nobody: -1; on a
  // night he is not dead at all, -2; on the Committee's, -3, and its four.)
  const answer = hoax ? -2 : committee ? -3 : culprit
  const guilty = committee ? members : culprit >= 0 ? [culprit] : []
  let spoken = allSpoken(mystery)
  let facts = evidence.map((e) => e.fact)
  // Whoever is to be killed may never have been asked a thing: the night must
  // come out without a word of theirs but what they said before them all.
  const dead = truth.second?.victim ?? -1
  const heardOf = (said: Spoken[]) =>
    dead < 0
      ? said
      : [
          ...mystery.policies[dead].reaction.claims.map((claim) => ({ speaker: dead, claim })),
          ...said.filter((s) => s.speaker !== dead),
        ]
  let worlds = enumerateWorlds({ cast, caseSheet, spoken: heardOf(spoken), evidence: facts, searched: allRooms })
  const settled = () =>
    worlds.culprits.length === 1 &&
    worlds.culprits[0] === answer &&
    (!committee || (worlds.committees.length === 1 && worlds.committees[0] === members.join(',')))
  // Somebody innocent still in doubt, who truly had no cause to kill him: a
  // paper showing how they stood with him puts them out of it (the murderer
  // had a motive). Added where it is so, and the night weighed again, rather
  // than dealt again from nothing.
  for (let round = 0; round < 3 && !settled(); round++) {
    const doubt = new Set<CharId>([
      ...worlds.culprits.filter((c) => c >= 0),
      ...worlds.committees.flatMap((k) => k.split(',').map(Number)),
    ])
    const standing = [...doubt].filter(
      (c) =>
        !guilty.includes(c) &&
        !isMotiveGrade(relationships[c]) &&
        !evidence.some((e) => e.fact.kind === 'motiveDocument' && e.fact.subject === c),
    )
    if (standing.length === 0) break
    const desks = pack.docRooms.filter((r) => r !== truth.locked)
    for (const c of standing) {
      evidence.push({
        id: `doc-standing-${c}`,
        room: rng.pick(desks.length > 0 ? desks : pack.docRooms),
        name: motiveItem(relationships[c]),
        fact: { kind: 'motiveDocument', subject: c, rel: relationships[c] },
      })
    }
    mystery.guests = cast.map((m) => accountOf(m.id, policyContext))
    mystery.policies = cast.map((m) => buildPolicy(m.id, policyContext, mystery.guests[m.id]))
    if (!passesSanity(mystery)) return 'sanity'
    spoken = allSpoken(mystery)
    facts = evidence.map((e) => e.fact)
    worlds = enumerateWorlds({ cast, caseSheet, spoken: heardOf(spoken), evidence: facts, searched: allRooms })
  }
  if (!settled()) return 'not-unique'
  if (!isConsistent(roles, { cast, caseSheet, spoken, evidence: facts })) {
    throw new Error(`seed ${opts.seed}: the true world is inconsistent — generation bug`)
  }

  const statements: NotedStatement[] = spoken.map((s, i) => ({
    id: `s${i}`,
    speaker: s.speaker,
    claim: s.claim,
  }))
  const contradictions = findContradictions(statements, evidence, caseSheet)
  // The Careful Murderer is caught by no account in the house: only by
  // clearing everybody else.
  if (careful && contradictions.some((c) => c.implicated.includes(culprit))) return 'careful-noticed'
  // (The Hoaxer, like any murderer, can be caught in their story.)
  if (!careful && !suicide && !committee && !pressableChars(contradictions).has(hoax ? hoaxer : culprit)) {
    return 'no-press-material'
  }
  // The Committee's story breaks against the honest, and in more than one place.
  if (committee && contradictions.filter((c) => c.implicated.some((x) => members.includes(x))).length < 2) {
    return 'no-seam'
  }
  // Whoever has been bought, or told what to say, can be brought to say so —
  // and the Sweetheart, and the one who hides their company.
  for (const c of ties.holding(['bribed', 'whispered', 'keepsSecret', 'hidesCompany', 'clings', 'vouches'])) {
    if (!pressableChars(contradictions).has(c)) return 'no-seam'
  }
  // The trio must be completable: some OPPORTUNITY-type contradiction breaks
  // the culprit's account of the window (means and motive are guaranteed by
  // the weapon and the motive document).
  // A culprit who owns to having been at the scene has given the opportunity away.
  // — and one who went by the passage has no need to lie about the hour at all.
  if (
    !viaPassage &&
    !careful &&
    !noSingle &&
    !contradictions.some(
      (c) => OPPORTUNITY_BREAKS.has(c.reason) && c.implicated.includes(culprit),
    )
  ) {
    return 'no-opportunity-break'
  }

  // The bot must solve it — but not TOO fast, or the puzzle is trivial even
  // for a careful human. Rejecting quick collapses is the difficulty floor.
  // (Lower on an evening set with nobody suspicious at the table, where only
  // the murderer lies: an easier evening, chosen so; at eight, few such
  // nights would ever be dealt.)
  const solution = solveMystery(mystery)
  if (!solution) return 'bot-unsolved'
  if (solution.questionsUsed < (script.suspiciousCount === 0 ? 6 : 8)) return 'too-easy'
  mystery.solution = solution

  return mystery
}

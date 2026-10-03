// One phase of dealing a night (see generate.ts).

import { INFO, KNOWN_IN_TURN } from '../info'
import { ROLES } from '../roles'
import { corruptedInfo } from '../policy'
import type { CharId, Claim, RoomId } from '../types'
import type { AfterEvidence } from './night'

/** Who truly knows what, by their part or by chance. */
export function shareKnowledge(night: AfterEvidence) {
  const {
    rng, n, roles, hoax, hoaxer, members, culprit, sceneRoom, cast, thief, drunk, gossip, redherring,
    blackmailer, sweetheart, porter, clinger, cleaner, sponsor, helper, singleLiar, honestIds, event,
    relationships, theftRoom, locations, companions, quarrelParticipant, truth, weaponRoom, lockRng, locked,
    keyItem, ties,
  } = night
  // ---- knowledge: who truly knows what ----
  const knowledge: Claim[][] = Array.from({ length: n }, () => [])
  /**
   * What they happened to see or hear, beside anything their role tells them:
   * given up when asked what they have seen, and not when asked their role.
   */
  const incidental = new Set<Claim>()
  const saw = (c: CharId, claim: Claim) => {
    knowledge[c].push(claim)
    incidental.add(claim)
  }

  // What each part knows by itself, in turn (the order decides the dice).
  for (const role of KNOWN_IN_TURN) {
    const me = roles.indexOf(role)
    const known = me >= 0 ? INFO[role]!.knows!(night, me) : null
    if (known) knowledge[me].push(known)
  }
  // The Blackmailer's victims: they will say whom they fear, and why.
  // (Not one who knows the Blackmailer to be no murderer: they would clear the
  // very name they point at.)
  const bled = honestIds.filter(
    (c) =>
      !knowledge[c].some(
        (k) => k.kind === 'alignment' && k.target === blackmailer && k.alignment === 'good',
      ),
  )
  const victims = blackmailer >= 0 ? rng.sample(bled, Math.min(bled.length, rng.chance(0.5) ? 3 : 2)) : []
  for (const v of victims) saw(v, { kind: 'blackmailed', by: blackmailer })
  if (cleaner >= 0) {
    // Somebody saw the Cleaner where the Cleaner truly was — which is where
    // the weapon is, and not where the Cleaner will say.
    const seers = honestIds.filter((c) => !companions[c].includes(cleaner))
    if (seers.length > 0) {
      saw(rng.pick(seers), { kind: 'sighting', target: cleaner, room: locations[cleaner] })
    }
  }
  if (redherring >= 0) {
    // Somebody saw them at the scene, within the hour. It is a true sighting,
    // and it looks exactly like one of the murderer — and the Red Herring,
    // who says truly they spent the hour elsewhere, will not mention it.
    if (honestIds.length === 0) return 'no-seam'
    saw(rng.pick(honestIds), { kind: 'sighting', target: redherring, room: sceneRoom })
  }
  // Sounds in the house: the theft's crash; the afternoon quarrel.
  let crashHearer = -1
  if (thief >= 0 && theftRoom) {
    crashHearer = rng.pick(honestIds)
    saw(crashHearer, { kind: 'heard', sound: 'crash', room: theftRoom })
  }
  // The quarrel and its meaning: the Gossip's power when present, else a
  // random honest guest overheard it.
  const quarrelHearer =
    gossip >= 0
      ? gossip
      : rng.pick(honestIds.filter((c) => c !== crashHearer && c !== quarrelParticipant))
  // (The Gossip hears it by their role; anybody else, by chance.)
  const overheard = gossip >= 0 ? (c: CharId, k: Claim) => knowledge[c].push(k) : saw
  overheard(quarrelHearer, { kind: 'heard', sound: event, room: sceneRoom })
  overheard(quarrelHearer, {
    kind: 'relationship',
    subject: quarrelParticipant,
    rel: relationships[quarrelParticipant],
  })
  if (gossip >= 0) {
    // The gossip knows one more relationship besides the quarreller's.
    const others = cast
      .map((m) => m.id)
      .filter((c) => c !== gossip && c !== quarrelParticipant && c !== culprit)
    if (others.length > 0) {
      const subject = rng.pick(others)
      knowledge[gossip].push({ kind: 'relationship', subject, rel: relationships[subject] })
    }
  }
  // Somebody knew how fond of him the Hoaxer was, and will say so.
  if (hoax && rng.chance(0.5)) {
    const knew = honestIds.filter((c) => c !== quarrelHearer)
    if (knew.length > 0) saw(rng.pick(knew), { kind: 'relationship', subject: hoaxer, rel: 'devoted' })
  }
  // Incidental sightings (always true): the thief glimpsed near the theft;
  // someone corroborates an innocent. Nobody ever vouches for the loner.
  if (thief >= 0 && theftRoom && rng.chance(0.75)) {
    const seer = rng.pick(honestIds)
    saw(seer, { kind: 'sighting', target: thief, room: theftRoom })
  }
  if (rng.chance(singleLiar ? 0.3 : 0.5)) {
    const seer = rng.pick(honestIds)
    const targets = cast
      .map((m) => m.id)
      .filter(
        (c) =>
          c !== seer &&
          c !== culprit &&
          c !== thief &&
          !ROLES[roles[c]].unseen &&
          c !== helper &&
          c !== sweetheart &&
          c !== clinger &&
          ties.free(c, 'seenIdly') &&
          !members.includes(c) &&
          !companions[seer].includes(c),
      )
    if (targets.length > 0) {
      const target = rng.pick(targets)
      saw(seer, { kind: 'sighting', target, room: locations[target] })
    }
  }
  if (drunk >= 0 && truth.drunkBelievedRole) {
    knowledge[drunk].push(corruptedInfo(rng, truth.drunkBelievedRole, cast, roles, culprit, drunk, sceneRoom))
  }
  const docReferralHolder = rng.pick(honestIds)
  ties.tie(docReferralHolder, 'pointsToPapers')
  // The weapon lies at the scene, where any detective begins: nobody need
  // point the way to it. But where the murderer's friend has hidden something
  // — the weapon, or the money — somebody has noticed the room is not right.
  const hintRoom = cleaner >= 0 ? weaponRoom : sponsor >= 0 ? locations[sponsor] : null
  const hinters = honestIds.filter((c) => ties.free(c, 'hiddenHint'))
  const weaponReferralHolder = hintRoom !== null && hinters.length > 0 ? rng.pick(hinters) : -1
  ties.tie(weaponReferralHolder, 'pointsToHidden')
  // Somebody honest has seen the key: where it lies, or who picked it up.
  let keyHint: { by: CharId; locked: RoomId; room?: RoomId; holder?: CharId } | undefined
  if (locked !== null && keyItem) {
    const holder = keyItem.heldBy
    const seers = honestIds.filter((c) => ties.free(c, 'keyHint'))
    const pool = seers.length > 0 ? seers : honestIds.filter((c) => ties.free(c, 'keyHintAtAll'))
    if (pool.length === 0) return 'no-seam'
    // The Porter keeps the keys, and knows where one has gone, where there is a
    // Porter (and not the one holding it); otherwise somebody else saw.
    const porterSaw = porter >= 0 && ties.free(porter, 'keyKeeper')
    keyHint = {
      by: porterSaw ? porter : lockRng.pick(pool),
      locked,
      ...(holder !== undefined ? { holder } : { room: keyItem.room }),
    }
    ties.tie(keyHint.by, 'knowsKey')
  }

  return {
    knowledge, incidental, saw, bled, victims, crashHearer, quarrelHearer, overheard, docReferralHolder,
    hintRoom, hinters, weaponReferralHolder, keyHint,
  }
}

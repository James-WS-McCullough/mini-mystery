// One phase of dealing a night (see generate.ts).

import { INFO, KNOWN_IN_TURN } from '../info'
import { ROLES } from '../roles'
import type { CharId, Claim, RoomId } from '../types'
import type { AfterEvidence } from './night'
import { MistakenPart, OTHERS_KNOW_IN_TURN, OTHERS_LEARN_IN_TURN, partOf } from '../parts'

/** The night as what is known of it is shared out (see Part.othersKnow). */
export type Knowing = AfterEvidence & {
  /** What each guest knows, by their part or by chance, in the order they came to know it. */
  knowledge: Claim[][]
  /** Which of it came by chance. */
  incidental: Set<Claim>
  /** That a guest came to know something by chance. */
  saw(c: CharId, claim: Claim): void
  /** Whoever the Blackmailer is bleeding. */
  victims: CharId[]
  /** Whoever heard the theft's crash (-1: nobody). */
  crashHearer: CharId
  /** Whoever overheard the afternoon's quarrel (-1: not yet heard). */
  quarrelHearer: CharId
}

/** Who truly knows what, by their part or by chance. */
export function shareKnowledge(night: AfterEvidence) {
  const {
    rng, n, roles, members, culprit, sceneRoom, cast, thief, drunk, gossip, sweetheart, porter, clinger,
    cleaner, sponsor, helper, singleLiar, honestIds, event, relationships, locations, companions,
    quarrelParticipant, weaponRoom, lockRng, locked, keyItem, ties, kind,
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
  // What others come to know of some parts, each in turn.
  const knowing: Knowing = { ...night, knowledge, incidental, saw, victims: [], crashHearer: -1, quarrelHearer: -1 }
  for (const role of OTHERS_KNOW_IN_TURN) {
    const me = roles.indexOf(role)
    if (me < 0) continue
    const failed = partOf(role, kind).othersKnow?.(knowing, me)
    if (failed) return failed
  }
  const { victims, crashHearer } = knowing
  // The quarrel and its meaning: the Gossip's power when present, else a
  // random honest guest overheard it.
  const hearers = gossip >= 0 ? [gossip] : honestIds.filter((c) => c !== crashHearer && c !== quarrelParticipant)
  // (On a small table, there may be nobody else honest to have heard it: try the night another way.)
  if (hearers.length === 0) return 'no-seam'
  const quarrelHearer = gossip >= 0 ? gossip : rng.pick(hearers)
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
  // And what others learn of some, after.
  knowing.quarrelHearer = quarrelHearer
  for (const role of OTHERS_LEARN_IN_TURN) {
    const me = roles.indexOf(role)
    if (me < 0) continue
    const failed = partOf(role, kind).othersLearn?.(knowing, me)
    if (failed) return failed
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
  // The Drunk, in their cups, believes what their part would tell them: and is wrong.
  if (drunk >= 0) {
    const part = partOf('drunk')
    if (part instanceof MistakenPart) part.believes(knowing, drunk)
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
    knowledge, incidental, saw, victims, crashHearer, quarrelHearer, overheard, docReferralHolder,
    hintRoom, hinters, weaponReferralHolder, keyHint,
  }
}

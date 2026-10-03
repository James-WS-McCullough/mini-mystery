// One phase of dealing a night (see generate.ts).

import { isEvil, liesAboutWhereabouts } from '../deck'
import { corruptedInfo, watched } from '../policy'
import type { AttrRef, CharId, Claim, RoomId } from '../types'
import type { AfterEvidence } from './night'

/** Who truly knows what, by their part or by chance. */
export function shareKnowledge(night: AfterEvidence) {
  const {
    rng, n, roles, hoax, hoaxer, members, culprit, sceneRoom, cast, careful, viaPassage, tellingTrait, bySex,
    byTrait, thief, drunk, loner, witness, oracle, confidant, gossip, sleuth, redherring, steward, perjurer,
    blackmailer, amnesiac, sweetheart, architect, porter, clinger, discoverer, cleaner, sponsor, helper,
    shadyIds, singleLiar, honestIds, event, relationships, theftRoom, locations, companions,
    quarrelParticipant, truth, weaponRoom, passageRoom, lockRng, locked, keyItem, ties,
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

  if (witness >= 0) {
    // A full identification only on two-liar nights; otherwise a glimpse.
    // (Nobody saw the murderer at the scene who came and went through the wall,
    // nor the Careful one, who made sure of it.)
    const full = !singleLiar && !viaPassage && !careful && rng.chance(0.35)
    knowledge[witness].push(
      full
        ? { kind: 'sighting', target: culprit, room: sceneRoom }
        : {
            kind: 'glimpse',
            attr: tellingTrait && bySex ? bySex : byTrait,
            room: sceneRoom,
          },
    )
  }
  if (discoverer >= 0) {
    // Found him living, for a moment: a last word, or a last sign.
    const attr: AttrRef = bySex && (tellingTrait || rng.chance(singleLiar ? 0.85 : 0.7)) ? bySex : byTrait
    knowledge[discoverer].push({ kind: 'culpritAttr', attr, dying: true })
  }
  if (oracle >= 0) {
    // Passed somebody in the corridor, coming away from the scene: the
    // murderer half the time, else whoever else had been that way — the Red
    // Herring, or anybody. A lead, and nothing more.
    const others = cast.map((m) => m.id).filter((c) => c !== oracle && c !== culprit)
    const target =
      rng.chance(0.5) || others.length === 0
        ? culprit
        : redherring >= 0 && redherring !== oracle && rng.chance(0.5)
          ? redherring
          : rng.pick(others)
    if (target !== oracle) {
      knowledge[oracle].push({ kind: 'passing', target })
      truth.corridor = target
    }
  }
  if (confidant >= 0) {
    // Biased toward exonerating whoever tonight's herrings are; never handed
    // the culprit outright on a single-liar night.
    const herringPresent = shadyIds.filter((x) => x !== perjurer)
    const roll = rng.next()
    let target: CharId
    if (herringPresent.length > 0 && roll < 0.4) target = rng.pick(herringPresent)
    else if (!singleLiar && culprit >= 0 && roll < 0.55) target = culprit
    else target = rng.pick(cast.map((m) => m.id).filter((c) => c !== confidant && c !== culprit))
    knowledge[confidant].push({
      kind: 'alignment',
      target,
      alignment: isEvil(roles[target]) ? 'evil' : 'good',
    })
  }
  if (architect >= 0 && passageRoom !== null) {
    knowledge[architect].push({ kind: 'passage', room: passageRoom })
  }
  if (sleuth >= 0) {
    // The murderer and two others. The two are whoever looks worst tonight,
    // where there is anyone to choose: a shortlist of the plainly innocent
    // would be as good as a name.
    const others = cast.map((m) => m.id).filter((c) => c !== sleuth && c !== culprit)
    const shady = rng.shuffle(others.filter((c) => shadyIds.includes(c)))
    const plain = rng.shuffle(others.filter((c) => !shady.includes(c)))
    const beside = [...shady.slice(0, 1), ...plain, ...shady.slice(1)].slice(0, 2)
    knowledge[sleuth].push({
      kind: 'among',
      suspects: [culprit, ...beside].sort((a, b) => a - b),
    })
  }
  if (steward >= 0) {
    // Had an eye on two of them all evening: how many are lying about the hour?
    // (Not the Clinger's kind friend, whose one lie is not the Steward's to count.)
    const pair = watched(
      rng,
      cast,
      steward,
      cast.map((m) => m.id).filter((c) => !ties.free(c, 'stewardWatch')),
    )
    knowledge[steward].push({
      kind: 'liarsAmong',
      pair,
      count: pair.filter((c) => liesAboutWhereabouts(roles[c])).length,
    })
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
          c !== loner &&
          c !== amnesiac &&
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

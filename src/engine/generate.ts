// Constructive mystery generation. Builds ground truth deliberately (a
// witness-or-evidence chain toward the culprit, an exoneration chain per
// red herring, leads pointing at every required room), precomputes every
// character's complete statement policy, then GATES the result:
//   1. sanity     — honest claims true, lies false, no fabrication truthfully
//                   incriminates the culprit
//   2. uniqueness — the brute-force world enumerator, fed everything
//                   obtainable, agrees on exactly the true culprit
//   3. drama      — at least one discoverable contradiction implicates the
//                   culprit (Press material is guaranteed)
//   4. humanity   — the rule-based detective bot solves it within the round
//                   budget, following only leads and referrals
// Decks are drawn from a SCRIPT (culprit + two red herrings from the pool +
// innocents to fill). The deck is fixed per seed so herring distribution
// matches the draw; failed attempts resample everything else, and every
// shipped seed is a solvable night.

import { buildDeck, SIMPLE_SCRIPT, committeeDeck, HELPERS, hoaxDeck, pickMurderer, suicideDeck } from './deck'
import { Rng } from './rng'
import type { Lifeline, LifelineKind, Mystery, NightKind, RoleId, RoomId } from './types'
import { dealCast } from './dealing/cast'
import { seatRoles } from './dealing/seats'
import { settleFeelings } from './dealing/feelings'
import { placeGuests } from './dealing/placing'
import { layEvidence } from './dealing/evidence'
import { shareKnowledge } from './dealing/knowledge'
import { castParts } from './dealing/parts'
import { tellLies } from './dealing/lies'
import { pointFingers } from './dealing/suspicion'
import { settleAftermath } from './dealing/aftermath'
import { weighNight } from './dealing/gates'
import type { Base, GenerateOptions, GenFailure } from './dealing/night'
export type { GenerateOptions, GenFailure } from './dealing/night'
export { allSpoken, motivesOf } from './dealing/night'

const MAX_ATTEMPTS = 500
/** Attempts that must respect the seed's drawn deck before redrawing is allowed. */
const FIXED_DECK_ATTEMPTS = 400

export function generateMystery(opts: GenerateOptions): Mystery {
  const script = opts.script ?? SIMPLE_SCRIPT
  // The deck is drawn ONCE per seed, so which herrings walk tonight matches
  // the draw's distribution — hard combinations get more attempts instead of
  // losing the race to easier decks. Only a truly stubborn seed redraws.
  const fixedDeck = buildDeck(new Rng(`${opts.seed}:deck`), script)
  // What kind of murderer, likewise: settled by the seed, and not by which
  // attempt happens to come off.
  const kind = pickMurderer(new Rng(`${opts.seed}:murderer`), script, fixedDeck)
  // And whether a room is locked tonight, and whose papers are behind the door.
  const lockRoll = new Rng(`${opts.seed}:lock`)
  const lock = { tonight: lockRoll.chance(script.lockedRoom ?? 0), others: lockRoll.chance(0.5) }
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const rng = new Rng(`${opts.seed}:${attempt}`)
    const drawn = attempt < FIXED_DECK_ATTEMPTS ? fixedDeck : buildDeck(rng, script)
    const probe = { culprit: '' }
    // (A redrawn deck may have no friend for the Martyr's part; then nobody
    // owns to it. And the Cunning and the Careful Murderer lie alone: with a
    // friend to make the story, there is no part for them to play. Nor is
    // there a friend where there is no murderer.)
    const friend = drawn.some((r) => HELPERS.includes(r))
    const alone = kind === 'cunning' || kind === 'careful' || kind === 'suicide' || kind === 'hoax' || kind === 'committee'
    const tonight = (kind === 'regretful' && !friend) || (alone && friend) ? 'plain' : kind
    // Where he did it himself, one more of the suspicious sits in the
    // murderer's place — the same one, attempt after attempt.
    const deck =
      tonight === 'suicide'
        ? suicideDeck(new Rng(`${opts.seed}:suicide`), drawn, script)
        : tonight === 'hoax'
          ? hoaxDeck(new Rng(`${opts.seed}:hoax`), drawn, script)
          : tonight === 'committee'
            ? committeeDeck(new Rng(`${opts.seed}:committee`), script, drawn.length)
            : drawn
    if (!deck) {
      opts.onAttempt?.('cover-pool', drawn, probe.culprit)
      continue
    }
    const result = tryGenerate(rng, opts, deck, probe, tonight, lock)
    if (typeof result !== 'string') return { ...result, lifelines: hideLifelines(opts.seed, result, opts.pack.rooms.map((r) => r.id)) }
    opts.onAttempt?.(result, deck, probe.culprit)
  }
  throw new Error(`could not generate a solvable mystery for seed ${opts.seed}`)
}

/** How many lifelines a night hides. */
const LIFELINES_PER_NIGHT = 2
const LIFELINE_KINDS: LifelineKind[] = ['pike', 'coffee', 'telegram', 'expert', 'note']

/**
 * Two kinds of help, hidden in two rooms other than the scene. Drawn from a
 * line of the seed's own, so that the night itself comes out just as before.
 */
function hideLifelines(seed: number, m: Mystery, rooms: RoomId[]): Lifeline[] {
  const rng = new Rng(`${seed}:lifelines`)
  // (Nor behind a locked door.)
  const places = rng.shuffle(rooms.filter((r) => r !== m.caseSheet.sceneRoom && r !== m.truth.locked))
  const kinds = rng.shuffle([...LIFELINE_KINDS]).slice(0, LIFELINES_PER_NIGHT)
  return kinds.slice(0, places.length).map((kind, i) => ({ id: `lifeline-${kind}`, kind, room: places[i] }))
}

/**
 * One attempt at a night: dealt phase by phase, each adding to what the
 * last ones made (or giving the reason the attempt is thrown away).
 */
function tryGenerate(
  rng: Rng,
  opts: GenerateOptions,
  deck: RoleId[],
  /** Filled in for diagnostics: who this attempt made the culprit. */
  probe: { culprit: string } = { culprit: '' },
  kind: NightKind = 'plain',
  /** A room locked tonight; and whether it holds somebody else's papers rather than the murderer's. */
  lock: { tonight: boolean; others: boolean } = { tonight: false, others: false },
): Mystery | GenFailure {
  const base: Base = { rng, opts, deck, probe, kind, lock }
  const castOut = dealCast(base)
  if (typeof castOut === 'string') return castOut
  const afterCast = { ...base, ...castOut }
  const seatsOut = seatRoles(afterCast)
  if (typeof seatsOut === 'string') return seatsOut
  const afterSeats = { ...afterCast, ...seatsOut }
  const feelingsOut = settleFeelings(afterSeats)
  if (typeof feelingsOut === 'string') return feelingsOut
  const afterFeelings = { ...afterSeats, ...feelingsOut }
  const placingOut = placeGuests(afterFeelings)
  if (typeof placingOut === 'string') return placingOut
  const afterPlacing = { ...afterFeelings, ...placingOut }
  const evidenceOut = layEvidence(afterPlacing)
  if (typeof evidenceOut === 'string') return evidenceOut
  const afterEvidence = { ...afterPlacing, ...evidenceOut }
  const knowledgeOut = shareKnowledge(afterEvidence)
  if (typeof knowledgeOut === 'string') return knowledgeOut
  const afterKnowledge = { ...afterEvidence, ...knowledgeOut }
  const partsOut = castParts(afterKnowledge)
  if (typeof partsOut === 'string') return partsOut
  const afterParts = { ...afterKnowledge, ...partsOut }
  const liesOut = tellLies(afterParts)
  if (typeof liesOut === 'string') return liesOut
  const afterLies = { ...afterParts, ...liesOut }
  const suspicionOut = pointFingers(afterLies)
  if (typeof suspicionOut === 'string') return suspicionOut
  const afterSuspicion = { ...afterLies, ...suspicionOut }
  const aftermathOut = settleAftermath(afterSuspicion)
  if (typeof aftermathOut === 'string') return aftermathOut
  const afterAftermath = { ...afterSuspicion, ...aftermathOut }
  return weighNight(afterAftermath)
}

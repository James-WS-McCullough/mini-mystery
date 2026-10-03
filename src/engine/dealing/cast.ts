// One phase of dealing a night (see generate.ts).

import { SIMPLE_SCRIPT } from '../deck'
import { dealMeans } from '../means'
import { dealTraits } from '../traits'
import type { AttrRef, CastMember, GameConfig } from '../types'
import { DEFENSES, pickManner, mixedCompany } from './night'
import type { Base } from './night'

/** Who is at the table, and what part each plays; where and how he died. */
export function dealCast(night: Base) {
  const { rng, opts, deck, probe, kind } = night
  const pack = opts.pack
  const script = opts.script ?? SIMPLE_SCRIPT
  const config: GameConfig = {
    castSize: deck.length,
    rounds: 4,
    questionsPerRound: script.questionsPerRound ?? 7,
    citeCap: 6,
    deck,
    ...opts.config,
  }
  const n = config.castSize

  // ---- cast & roles ----
  // Men and women both, and three at least of each: "it was a woman" must
  // never be as good as a name.
  const defs = mixedCompany(rng, pack.characters, n)
  const roles = rng.shuffle(deck)
  /** He did it himself: there is no murderer tonight, and `culprit` is -1. */
  const suicide = kind === 'suicide'
  /** He is not dead: the Hoaxer helped him fake it. No murderer either. */
  const hoax = kind === 'hoax'
  const hoaxer = roles.indexOf('hoaxer')
  /** No murderer tonight, one way or the other. */
  const nobody = suicide || hoax
  /** Four did it together, and agreed one story: the Committee. */
  const committee = kind === 'committee'
  const members = roles.flatMap((r, i) => (r === 'committee' ? [i] : []))
  /** No one murderer: nobody did it, or four did. */
  const noSingle = nobody || committee
  const culprit = roles.indexOf('murderer')
  probe.culprit = culprit >= 0 ? defs[culprit].id : 'nobody'
  // What the one who takes the blame could never have had.
  const martyrLacks = roles.includes('martyr')
    ? rng.fork('martyr').pick(['means', 'motive', 'opportunity'] as const)
    : null
  // Traits are dealt from a stream of their own, knowing nothing of the roles.
  const traits = dealTraits(rng.fork('traits'), defs, pack.traits)
  // The method is one nearly anyone could have managed: it rules out one or
  // two guests, the begrudged (motive, but no means) always among them.
  // Where it was done, and then how: some ways of killing want a particular
  // place — a balcony to fall from, a drive to be run down on.
  const sceneRoom = rng.pick(pack.sceneRooms)
  // (What the Cleaner carries off must be something that can be carried: not a
  // balcony, and not the motor-car.)
  const carried = roles.includes('cleaner')
  // (A death that is to look like his own doing, or was, is one he could
  // have done to himself.)
  const ownHand = suicide || kind === 'artful'
  const ways = pack.methods.filter(
    (m) => (!m.rooms || m.rooms.includes(sceneRoom)) && !(carried && m.rooms) && (!ownHand || m.selfInflicted),
  )
  if (ways.length === 0) return 'no-method'
  // A way that belongs to the place is likelier there than one that would do anywhere.
  const method = rng.pick(ways.flatMap((m) => (m.rooms ? [m, m] : [m])))
  const means = dealMeans(rng.fork('means'), defs, pack.means, {
    method: method.means,
    // (The Hoaxer could have done it, to look at: that is the point of them.)
    culprit: hoax ? hoaxer : committee ? members[0] : culprit,
    mustLack: roles.flatMap((r, i) =>
      r === 'begrudged' || (r === 'martyr' && martyrLacks === 'means') ? [i] : [],
    ),
    // (Every one of the Committee could have done it, and did.)
    mustHave: roles.flatMap((r, i) =>
      (r === 'martyr' && martyrLacks !== 'means') || r === 'committee' ? [i] : [],
    ),
  })

  const cast: CastMember[] = defs.map((d, i) => ({
    id: i,
    defId: d.id,
    name: d.name,
    shortName: d.shortName,
    title: d.title,
    portrait: d.portrait,
    pronouns: d.pronouns,
    trait: traits[i].trait,
    furtive: traits[i].furtive,
    means: means[i],
    temperament: pickManner(rng, d),
    strategy: 'open',
    defense: rng.pick(DEFENSES),
  }))

  /** A night with a passage — and whether the murderer went by it. */
  const passageNight = script.passage === true
  // (Not where a friend has already made the murderer an alibi to order.)
  const alibiMade = roles.some((r) => r === 'perjurer' || r === 'forger' || r === 'whisperer')
  // (Nor the Cunning Murderer, whose lie about the hour is the whole of the
  // part; nor the Careful one, whose lie is to have been somewhere nobody was.)
  const careful = kind === 'careful'
  const viaPassage = passageNight && !alibiMade && kind !== 'cunning' && !careful && !noSingle && rng.chance(0.4)

  /** The murderer, where there is one. */
  const killer: CastMember | null = culprit >= 0 ? cast[culprit] : null
  /** Nobody else has the culprit's trait: to describe it would be to name them. */
  const tellingTrait = killer !== null && cast.filter((m) => m.trait === killer.trait).length < 2
  /** What can be said of the murderer by their sex — where that would not name them. */
  const bySex: AttrRef | null =
    killer !== null &&
    killer.pronouns !== 'they' &&
    cast.filter((m) => m.pronouns === killer.pronouns).length >= 3
      ? { kind: 'sex', sex: killer.pronouns }
      : null
  // (Nobody asks after the murderer's habits on a night with no murderer:
  // whoever would have, is not in the house.)
  const byTrait: AttrRef = { kind: 'trait', trait: (killer ?? cast[0]).trait }
  if (tellingTrait && !bySex) return 'trait-share'

  return {
    pack, script, config, n, defs, roles, suicide, hoax, hoaxer, nobody, committee, members, noSingle,
    culprit, martyrLacks, traits, sceneRoom, carried, ownHand, ways, method, means, cast, passageNight,
    alibiMade, careful, viaPassage, killer, tellingTrait, bySex, byTrait,
  }
}

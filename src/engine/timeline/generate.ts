// Dealing an evening, slot by slot. Everybody dines at seven; then they drift
// about the house (some go up to bed early, some step out for a smoke), the
// victim makes his way to the scene, the murderer finds him there alone, and
// later somebody finds him dead and raises the alarm. The murderer, and the
// guest with a secret of their own, tell their real evening but for the
// stretch they must hide. Then the gates: everything that can be got out of
// the house must leave exactly one guest who could have done it, the murderer
// must be catchable in a contradiction, and the rule-based detective must
// solve it inside the clock.

import type { SettingPack } from '../../content/schema'
import { mixedCompany } from '../dealing/night'
import { pickVictim } from '../generate'
import { Rng } from '../rng'
import { solveTimeline } from './bot'
import { findContradictions } from './contradictions'
import { slotWord } from './render'
import { murderSlots, whoCould } from './solver'
import {
  SLOTS, VICTIM, type Difficulty, type Place, type TClaim, type TEvidence, type TGuest, type TSpoken,
  type TimelineCase, type TimelineRole,
} from './types'

/** How many sit at the table. */
const GUESTS = 6
/** Where everybody dines at seven, where the house has one. */
const GATHER = 'dining'
const MAX_ATTEMPTS = 400

export interface TimelineOptions {
  seed: number
  pack: SettingPack
  difficulty?: Difficulty
}

export function generateTimeline(opts: TimelineOptions): TimelineCase {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const tc = attemptEvening(new Rng(`${opts.seed}:timeline:${attempt}`), opts)
    if (tc) return tc
  }
  throw new Error(`could not deal an evening for seed ${opts.seed}`)
}

/** A clock time inside a slot: "9:10". */
function clockIn(slot: number, minutes: number): string {
  const total = 7 * 60 + slot * 30 + minutes
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

function attemptEvening(rng: Rng, opts: TimelineOptions): TimelineCase | null {
  const { pack, seed } = opts
  const difficulty = opts.difficulty ?? 'normal'

  // ---- who ----
  const victim = pickVictim(rng.fork('victim'), pack)
  const away = new Set([victim.character, ...(victim.excludes ?? [])].filter((x): x is string => !!x))
  const defs = mixedCompany(rng, pack.characters.filter((c) => !away.has(c.id)), GUESTS)
  const cast: TGuest[] = defs.map((d, i) => ({
    id: i, defId: d.id, name: d.name, shortName: d.shortName, title: d.title, portrait: d.portrait, pronouns: d.pronouns,
  }))
  const roles = rng.shuffle<TimelineRole>(['murderer', 'secretive', 'witness', 'discoverer', 'guest', 'guest'])
  const culprit = roles.indexOf('murderer')
  const secretive = roles.indexOf('secretive')
  const witness = roles.indexOf('witness')
  const finder = roles.indexOf('discoverer')
  const all = cast.map((c) => c.id)
  const honest = all.filter((c) => c !== culprit && c !== secretive)

  // ---- where ----
  const house = pack.rooms.map((r) => r.id)
  const gather = house.includes(GATHER) ? GATHER : house[0]
  const outdoor = pack.rooms.find((r) => r.kind === 'outdoor')?.id
  const scene = rng.pick(pack.sceneRooms.filter((r) => r !== gather && r !== outdoor))
  const rooms = [
    ...pack.rooms.map((r) => ({ id: r.id, name: r.name, ...(r.where ? { where: r.where } : {}) })),
    ...cast.map((c) => ({ id: `bed:${c.id}`, name: `${c.shortName}’s room`, bed: c.id })),
  ]
  const bed = (c: number) => `bed:${c}`
  const isBed = (p: Place) => p.startsWith('bed:')

  // ---- when ----
  /** He dies in slot m; goes to the scene at k; is found at D. */
  const m = 2 + rng.int(4)
  const k = Math.max(1, m - rng.int(2))
  const D = Math.min(SLOTS - 1, m + 1 + rng.int(3))

  // ---- his evening ----
  const vict: (Place | null)[] = new Array(SLOTS).fill(null)
  vict[0] = gather
  for (let t = 1; t < k; t++) {
    vict[t] = t > 1 && rng.chance(0.6) ? vict[t - 1] : rng.pick(house.filter((r) => r !== scene && r !== outdoor))
  }
  for (let t = k; t <= m; t++) vict[t] = scene

  // ---- theirs ----
  const sched: Place[][] = cast.map(() => new Array<Place>(SLOTS).fill(gather))
  /** The scene is nobody's from the moment he goes in, but the murderer's at the moment, and the finder's at the last. */
  const barred = (c: number, t: number, p: Place) =>
    p === scene && t >= k && !(c === culprit && t === m) && !(c === finder && t === D)
  /** Who may not yet go up to bed: the murderer before it is done, the finder, the witness before they see him. */
  const mayRetire = (c: number, t: number) =>
    t >= 3 && c !== finder && !(c === culprit && t <= m) && !(c === witness && t <= k)
  for (let t = 1; t <= D; t++) {
    /** Those already placed this half hour: company to be drawn to. */
    const done: number[] = []
    for (const c of rng.shuffle(all)) {
      done.push(c)
      if (c === culprit && t === m) {
        sched[c][t] = scene
        continue
      }
      if (c === finder && t === D) {
        sched[c][t] = scene
        continue
      }
      const prev = sched[c][t - 1]
      if (isBed(prev)) {
        sched[c][t] = prev
        continue
      }
      const roll = rng.next()
      const placed = done.filter((o) => o !== c).map((o) => sched[o][t])
      let next: Place
      if (roll < 0.5 && prev !== outdoor) next = prev
      else if (roll < 0.62 && mayRetire(c, t)) next = bed(c)
      else if (roll < 0.72 && outdoor && t <= 3) next = outdoor
      else {
        // Drawn to company, as often as not.
        const company = placed.filter((p) => !isBed(p) && !barred(c, t, p) && p !== outdoor)
        next = company.length > 0 && rng.chance(0.5) ? rng.pick(company) : rng.pick(house)
      }
      if (barred(c, t, next) || (next === outdoor && t > 3)) {
        next = rng.pick(house.filter((r) => !barred(c, t, r) && r !== outdoor))
      }
      sched[c][t] = next
    }
  }

  // ---- the secret ----
  // Slipped upstairs into somebody else's room, at a moment near the death, as often as not.
  const near = [m - 1, m + 1].filter((s) => s >= 1 && s < D && s !== m)
  const s = near.length > 0 && rng.chance(0.6) ? rng.pick(near) : 1 + rng.int(D - 1)
  const rifled = rng.pick(all.filter((j) => j !== secretive && sched[j][s] !== bed(j)))
  if (rifled === undefined) return null
  sched[secretive][s] = bed(rifled)
  const secretWhat = rng.pick([
    `went up to ${cast[rifled].shortName}’s room, to look for a letter I had written and wanted back`,
    `went up to ${cast[rifled].shortName}’s room, to borrow something without asking`,
    `went up to ${cast[rifled].shortName}’s room, to see what was in the dispatch case`,
  ])

  // ---- company, and the true accounts ----
  /** Who was truly with them (always from the truth: a liar's story moves only the liar). */
  const companyOf = (c: number, t: number): number[] => [
    ...all.filter((o) => o !== c && sched[o][t] === sched[c][t]),
    ...(vict[t] === sched[c][t] && t <= m ? [VICTIM] : []),
  ]
  /** A schedule as stays: a run of slots in one place with the same company. */
  const staysOf = (c: number, at: Place[][], last: number, alone: ReadonlySet<number> = new Set()): TClaim[] => {
    const out: (TClaim & { kind: 'stay' })[] = []
    for (let t = 0; t <= last; t++) {
      const room = at[c][t]
      const withs = alone.has(t) ? [] : companyOf(c, t).sort((a, b) => a - b)
      const prev = out.at(-1)
      if (prev && prev.room === room && prev.to === t - 1 && prev.with.join() === withs.join()) prev.to = t
      else out.push({ kind: 'stay', from: t, to: t, room, with: withs })
    }
    return out
  }

  // The lies: the truth, but for the stretch to hide, told as a stretch alone somewhere else.
  const told: Place[][] = sched.map((row) => [...row])
  // The murderer: where an honest guest sat alone at the time, so that the two accounts collide;
  // else an empty room, which somebody honest looked into.
  const aloneAt = (t: number) =>
    honest.filter((h) => !isBed(sched[h][t]) && sched[h][t] !== scene && companyOf(h, t).length === 0)
  const collide = aloneAt(m)
  let looked: { by: number; room: Place } | null = null
  if (collide.length > 0 && rng.chance(0.75)) {
    told[culprit][m] = sched[rng.pick(collide)][m]
  } else {
    const empty = house.filter((r) => r !== scene && !all.some((o) => sched[o][m] === r))
    const lookers = honest.filter((h) => !isBed(sched[h][m]) && h !== finder)
    if (empty.length === 0 || lookers.length === 0) return null
    const room = rng.pick(empty)
    told[culprit][m] = room
    looked = { by: rng.pick(lookers), room }
  }
  // The guest with a secret: where they had been just before, or their own room.
  const before = told[secretive][s - 1]
  told[secretive][s] = !isBed(before) && before !== scene ? before : bed(secretive)

  // Each says it through to the alarm (the finder, to the finding).
  const lastSlot = (c: number) => (c === finder ? D - 1 : D)
  const hides = (c: number) => (c === culprit ? new Set([m]) : c === secretive ? new Set([s]) : new Set<number>())
  const evening: TClaim[][] = all.map((c) => staysOf(c, told, lastSlot(c), hides(c)))
  evening[finder].push({ kind: 'found', slot: D, room: scene })
  if (looked) evening[looked.by].push({ kind: 'empty', slot: m, room: looked.room })

  // When they last saw him: the last slot they were with him; the witness saw him go in.
  const lastSeen: TClaim[][] = all.map((c) => {
    let best = 0
    for (let t = 0; t <= m; t++) {
      if (hides(c).has(t)) continue
      if (vict[t] === told[c][t] && !(c === culprit && t === m)) best = t
    }
    if (c === witness && k >= best) return [{ kind: 'lastSeen', slot: k, room: scene }]
    return [{ kind: 'lastSeen', slot: best, room: vict[best]! }]
  })

  // Pressed: the guest with a secret owns to it; nobody else gives way.
  const pressed: TClaim[][] = all.map((c) =>
    c === secretive
      ? [{ kind: 'stay', from: s, to: s, room: sched[c][s], with: companyOf(c, s), owned: true }]
      : [],
  )
  const pressLine = all.map((c) =>
    c === secretive
      ? `All right. At ${slotWord(s)} I was not where I said. I ${secretWhat}. It has nothing to do with what happened to ${victim.shortName}, and I would be grateful if it went no further.`
      : c === culprit
        ? 'I have told you where I was, and I shan’t say it differently because somebody else has got the evening muddled.'
        : 'I have told you exactly what happened. If somebody’s account doesn’t fit mine, it isn’t mine that’s wrong.',
  )

  // ---- what there is to find ----
  const evidence: TEvidence[] = []
  if (difficulty !== 'hard') {
    evidence.push({
      id: 'watch',
      room: scene,
      name: `${victim.shortName}’s pocket watch, smashed in the struggle and stopped at ${clockIn(m, 10 + rng.int(15))}`,
      earliest: m,
      latest: m,
    })
  }
  if (difficulty === 'easy') {
    const latest = Math.min(D - 1, m + rng.int(2))
    evidence.push({
      id: 'doctor',
      room: scene,
      name: `The doctor’s note, from last night: dead no later than ${slotWord(latest + 1)}`,
      latest,
      plain: true,
    })
  }

  // ---- the gates ----
  const tc: TimelineCase = {
    seed, difficulty, packId: pack.id, cast,
    victimName: victim.name, victimShort: victim.shortName, victimPronouns: victim.pronouns,
    rooms, scene,
    truth: { roles, schedule: sched, victim: vict, murderSlot: m, foundSlot: D, finder, scene,
      secret: { by: secretive, slots: [s], what: secretWhat } },
    accounts: all.map((c) => ({ evening: evening[c], lastSeen: lastSeen[c], pressed: pressed[c], pressLine: pressLine[c] })),
    evidence,
    secretive: 1,
    solution: { questions: 0, searches: 0, steps: [] },
  }
  const everything = (): TSpoken[] =>
    all.flatMap((c) =>
      [...tc.accounts[c].evening, ...tc.accounts[c].lastSeen, ...tc.accounts[c].pressed].map((claim) => ({ speaker: c, claim })),
    )
  // Somebody saw a guest still in doubt, where they truly were: until only the murderer is left.
  for (let round = 0; round < 10; round++) {
    const could = whoCould({ n: GUESTS, scene, secretive: 1, heard: everything(), evidence })
    if (!could.has(culprit)) {
      const reasons: string[] = []
      murderSlots({ n: GUESTS, scene, secretive: 1, heard: everything(), evidence }, culprit, new Set([culprit, secretive]), (r) => reasons.push(r))
      throw new Error(`seed ${seed}: the true evening is inconsistent — generation bug (${reasons.join('; ')})`)
    }
    if (could.size === 1) break
    for (const [x, slots] of could) {
      if (x === culprit) continue
      const t = rng.pick(slots)
      const sighters = honest.filter(
        (h) => h !== x && sched[h][t] !== sched[x][t] && !isBed(sched[h][t]) && t <= lastSlot(h) && sched[h][t] !== scene,
      )
      if (sighters.length === 0) return null
      tc.accounts[rng.pick(sighters)].evening.push({ kind: 'saw', slot: t, target: x, room: sched[x][t] })
    }
  }
  const heard = everything()
  const could = whoCould({ n: GUESTS, scene, secretive: 1, heard, evidence })
  if (could.size !== 1 || !could.has(culprit)) return null
  // The murderer and the guest with a secret can each be caught out.
  const contradictions = findContradictions(heard)
  const caught = (c: number) => contradictions.some((x) => x.implicated.includes(c))
  if (!caught(culprit) || !caught(secretive)) return null
  // A rule-based detective must solve it inside the clock, and not at once.
  const solution = solveTimeline(tc)
  if (!solution || solution.questions < 6) return null
  tc.solution = solution
  return tc
}

// The rule-based "human solver": a scripted detective who plays by the same
// rules as the player — free opening reactions, one search per round (the
// scene, rooms somebody claims to have been alone in, and rooms the household
// has named), a question budget, Press gated on contradictions — and
// only wins when the world enumerator, fed what THEY have gathered, agrees on
// a single culprit. Used as the generation gate for human solvability, and
// its trace becomes the reveal screen's intended path.

import { findContradictions, pressableChars, type NotedStatement } from '../contradictions'
import { Interrogation } from '../interrogate'
import type {
  Answer,
  CharId,
  EvidenceItem,
  ItemId,
  Mystery,
  RoomId,
  SolveStep,
  SolveTrace,
  Spoken,
} from '../types'
import { attrMatches } from '../types'
import { enumerateWorlds } from './worlds'

export function solveMystery(
  mystery: Mystery,
  /** Remember what is ruled out as the night goes on (off only to check it changes nothing). */
  { narrow = true }: { narrow?: boolean } = {},
): SolveTrace | null {
  const { cast, caseSheet, config, evidence } = mystery
  const inter = new Interrogation(mystery)

  const spoken: Spoken[] = []
  const noted: NotedStatement[] = []
  const found: EvidenceItem[] = []
  const steps: SolveStep[] = []

  const urgentRooms: RoomId[] = []
  const leadRooms: RoomId[] = [caseSheet.sceneRoom]
  const leadSet = new Set<RoomId>(leadRooms)
  const addLeadRoom = (room: RoomId) => {
    if (!leadSet.has(room)) {
      leadSet.add(room)
      leadRooms.push(room)
    }
  }

  const absorb = (speaker: CharId, answer: Answer): number => {
    if (answer.also) absorb(speaker, answer.also)
    for (const claim of answer.claims) {
      spoken.push({ speaker, claim })
      noted.push({ id: `s${noted.length}`, speaker, claim })
      if (claim.kind === 'heard') addLeadRoom(claim.room)
      // Somebody owns to a theft: the box in that room will say whether there was one.
      if (claim.kind === 'theft') {
        addLeadRoom(claim.room)
        urgentRooms.push(claim.room)
      }
      // Where a passage is said to run is worth seeing for oneself.
      if (claim.kind === 'passage') {
        addLeadRoom(claim.room)
        urgentRooms.push(claim.room)
      }
    }
    for (const id of answer.gives ?? []) {
      const item = evidence.find((e) => e.id === id)
      if (item && !found.includes(item)) found.push(item)
    }
    if (answer.refer?.room) {
      addLeadRoom(answer.refer.room)
      // "Something is wrong with that room" is worth more than an empty alibi.
      if (answer.lineKey === 'reaction.weaponhint') urgentRooms.push(answer.refer.room)
      // So is where the key to a locked door was seen.
      if (answer.lineKey === 'seen.key') urgentRooms.push(answer.refer.room)
    }
    return answer.claims.length
  }

  // The gathered cast reacts to the murder — free opening statements.
  for (const m of cast) absorb(m.id, inter.ask(m.id, { kind: 'reaction' }))
  steps.push({ action: 'question', detail: 'Listened to the gathered guests’ first reactions.' })

  /** Whoever the murderer has silenced: there is no asking them anything more. */
  let dead: CharId = -1
  let hour = 0
  const living = () => cast.filter((m) => m.id !== dead)

  const knowledgeAsked = new Set<CharId>()
  const seenAsked = new Set<CharId>()
  const vagueKnowledge = new Set<CharId>()
  const reaskedKnowledge = new Set<CharId>()
  const alibiAsked = new Set<CharId>()
  const shownDocs = new Set<ItemId>()
  const shownTraces = new Set<string>()
  const pressedChars = new Set<CharId>()
  const searchedRooms = new Set<RoomId>()
  let pressBudget = 3
  let questions = 0
  let searches = 0

  /** Who the gathered record still allows. */
  let committee: CharId[] | undefined
  // What is gathered only grows through the night, so an answer once ruled
  // out stays out: the solver is told so, and need not prove it again.
  const ruledOut = new Set<string>()
  const weigh = () =>
    enumerateWorlds({ cast, caseSheet, spoken, evidence: found.map((f) => f.fact) }, narrow ? { ruledOut } : {})
  const suspects = (): CharId[] => {
    const result = weigh()
    committee = result.committees.length === 1 ? result.committees[0].split(',').map(Number) : undefined
    // (A guest who may sit on a Committee is still a suspect.)
    const members = result.committees.flatMap((k) => k.split(',').map(Number))
    return [...new Set([...result.culprits, ...members])]
  }
  const uniqueCulprit = (): CharId | null => {
    const result = weigh()
    committee = result.committees.length === 1 ? result.committees[0].split(',').map(Number) : undefined
    if (result.culprits.length !== 1) return null
    // The Committee: only once there is one four it could be.
    if (result.culprits[0] === -3 && result.committees.length !== 1) return null
    return result.culprits[0]
  }

  /** Rooms where somebody says they were alone: searching one may clear them. */
  const alibiRooms: { room: RoomId; by: CharId }[] = []
  /** A door that will not open until the key is found. */
  const lockedOut = (room: RoomId) =>
    room === mystery.truth.locked && !found.some((e) => e.fact.kind === 'key')
  /** Not searched yet, and not behind a locked door. */
  const open = (room: RoomId) => !searchedRooms.has(room) && !lockedOut(room)
  const nextSearch = (): RoomId | undefined => {
    if (!searchedRooms.has(caseSheet.sceneRoom)) return caseSheet.sceneRoom
    // The key is in hand: the door it opens, before anything else.
    const door = mystery.truth.locked
    if (door && open(door)) return door
    const urgent = urgentRooms.find(open)
    if (urgent) return urgent
    // First the lonely accounts of those still under suspicion…
    const suspected = new Set(suspects())
    const worth = alibiRooms.find((a) => suspected.has(a.by) && open(a.room))
    if (worth) return worth.room
    // …then wherever the household has pointed.
    return leadRooms.find(open)
  }

  interface QAction {
    kind: SolveStep['action']
    label: string
    run: () => void
  }

  const nextQuestion = (): QAction | null => {
    // 1. A found motive document goes straight under its subject's nose.
    for (const item of found) {
      if (item.fact.kind === 'motiveDocument' && !shownDocs.has(item.id)) {
        const subject = item.fact.subject
        if (subject === dead) continue
        return {
          kind: 'question',
          label: `Showed ${item.name} to ${cast[subject].shortName}.`,
          run: () => {
            shownDocs.add(item.id)
            absorb(subject, inter.ask(subject, { kind: 'aboutEvidence', item: item.id }))
          },
        }
      }
    }
    // 1b. A trace nobody has owned to goes to whoever it fits and has given no
    //     account of the hour: it may bring one back.
    if (living().every((m) => alibiAsked.has(m.id))) {
      for (const item of found) {
        if (item.fact.kind !== 'trace') continue
        const fact = item.fact
        for (const m of living()) {
          const key = `${item.id}|${m.id}`
          if (shownTraces.has(key) || !attrMatches(fact.attr, m)) continue
          if (spoken.some((s) => s.speaker === m.id && s.claim.kind === 'whereabouts')) continue
          return {
            kind: 'question',
            label: `Showed ${item.name} to ${m.shortName}, who cannot say where they were.`,
            run: () => {
              shownTraces.add(key)
              absorb(m.id, inter.ask(m.id, { kind: 'aboutEvidence', item: item.id }))
            },
          }
        }
      }
    }
    // 2. Sweep: everyone accounts for their whereabouts — the night is won by
    //    elimination, and an account is what there is to eliminate with.
    for (const m of living()) {
      if (!alibiAsked.has(m.id)) {
        return {
          kind: 'question',
          label: `Asked ${m.shortName} where they were during the window.`,
          run: () => {
            alibiAsked.add(m.id)
            const answer = inter.ask(m.id, { kind: 'alibi' })
            absorb(m.id, answer)
            // A lonely account can only be borne out by searching the room.
            for (const claim of answer.claims) {
              if (claim.kind === 'whereabouts' && claim.companions.length === 0) {
                alibiRooms.push({ room: claim.room, by: m.id })
              }
            }
          },
        }
      }
    }
    // 3. Sweep: everyone's role, and what the role tells them.
    for (const m of living()) {
      if (!knowledgeAsked.has(m.id)) {
        return {
          kind: 'question',
          label: `Asked ${m.shortName} their role.`,
          run: () => {
            knowledgeAsked.add(m.id)
            if (absorb(m.id, inter.ask(m.id, { kind: 'knowledge' })) === 0) {
              vagueKnowledge.add(m.id)
            }
          },
        }
      }
    }
    // 3b. And what everyone happened to see or hear, beside their role.
    for (const m of living()) {
      if (!seenAsked.has(m.id)) {
        return {
          kind: 'question',
          label: `Asked ${m.shortName} what they have seen.`,
          run: () => {
            seenAsked.add(m.id)
            absorb(m.id, inter.ask(m.id, { kind: 'seen' }))
          },
        }
      }
    }
    // 4. The quiet: show them something of theirs, once it has been found —
    //    and note where such a thing lies, for the searching.
    for (const c of vagueKnowledge) {
      if (c === dead || inter.isOpen(c) || reaskedKnowledge.has(c)) continue
      const keys = inter.opens(c)
      const inHand = found.find((item) => keys.includes(item.id))
      if (inHand) {
        return {
          kind: 'question',
          label: `Showed ${inHand.name} to ${cast[c].shortName}, who had been saying nothing.`,
          run: () => {
            reaskedKnowledge.add(c)
            absorb(c, inter.ask(c, { kind: 'aboutEvidence', item: inHand.id }))
          },
        }
      }
      for (const item of evidence) {
        if (keys.includes(item.id) && item.heldBy === undefined) addLeadRoom(item.room)
      }
    }
    // 5. Press whoever a contradiction stands against (worst implicated first).
    if (pressBudget > 0) {
      const contradictions = findContradictions(noted, found, caseSheet)
      const counts = new Map<CharId, number>()
      for (const c of contradictions) {
        for (const id of c.implicated) counts.set(id, (counts.get(id) ?? 0) + (c.proven ? 3 : 1))
      }
      const candidates = [...pressableChars(contradictions)]
        .filter((c) => !pressedChars.has(c) && c !== dead)
        .sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0))
      if (candidates.length > 0) {
        const target = candidates[0]
        return {
          kind: 'press',
          label: `Pressed ${cast[target].shortName} on the contradiction.`,
          run: () => {
            pressedChars.add(target)
            pressBudget--
            const outcome = inter.press(target)
            absorb(target, { claims: outcome.claims, lineKey: outcome.lineKey })
          },
        }
      }
    }
    return null
  }

  const finish = (culprit: CharId): SolveTrace => {
    steps.push({
      action: 'deduce',
      detail:
        culprit === -3
          ? `It was more than one: ${(committee ?? []).map((c) => cast[c].name).join(', ')}, together.`
          : culprit === -2
          ? 'Nobody in the house could have done it, and nobody did. He is not dead at all.'
          : culprit < 0
            ? 'Nobody in the house could have done it. He took his own life.'
            : `Only one arrangement of the deck fits the testimony and the evidence: ${cast[culprit].name} is the culprit.`,
    })
    return { steps, questionsUsed: questions, searchesUsed: searches, culprit, ...(culprit === -3 && committee ? { committee } : {}) }
  }

  for (let round = 0; round < config.rounds; round++) {
    hour = round
    // The hour may bring a second body with it.
    const second = mystery.truth.second
    if (second && second.round === round) {
      dead = second.victim
      for (const item of evidence) {
        if (item.plain && (item.from ?? 0) <= round && !found.includes(item)) found.push(item)
      }
      // The room is a scene now, and wants looking at again.
      searchedRooms.delete(second.room)
      urgentRooms.unshift(second.room)
      steps.push({
        action: 'search',
        detail: `${cast[dead].name} was found dead in ${second.room} as the hour struck.`,
      })
      const u = uniqueCulprit()
      if (u !== null) return finish(u)
    }
    // Search one room: the scene, an account worth testing, or a lead.
    const target = nextSearch()
    if (target) {
      searchedRooms.add(target)
      searches++
      const items = evidence.filter(
        (e) =>
          e.room === target &&
          e.heldBy === undefined &&
          (e.from ?? 0) <= hour &&
          !found.includes(e),
      )
      found.push(...items)
      steps.push({
        action: 'search',
        detail:
          items.length > 0
            ? `Searched ${target}. Found ${items.map((i) => i.name).join('; ')}.`
            : `Searched ${target}. Nothing of note.`,
      })
      const u = uniqueCulprit()
      if (u !== null) return finish(u)
    }
    // Spend the round's questions.
    for (let qi = 0; qi < config.questionsPerRound; qi++) {
      const action = nextQuestion()
      if (!action) break
      questions++
      action.run()
      steps.push({ action: action.kind, detail: action.label })
      const u = uniqueCulprit()
      if (u !== null) return finish(u)
    }
  }

  return null
}

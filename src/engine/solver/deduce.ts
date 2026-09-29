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
  Person,
  RoomId,
  SolveStep,
  SolveTrace,
  Spoken,
} from '../types'
import { attrMatches } from '../types'
import { enumerateWorlds } from './worlds'

export function solveMystery(mystery: Mystery): SolveTrace | null {
  const { cast, caseSheet, config, evidence } = mystery
  const inter = new Interrogation(mystery)

  const spoken: Spoken[] = []
  const noted: NotedStatement[] = []
  const found: EvidenceItem[] = []
  const steps: SolveStep[] = []

  const leadRooms: RoomId[] = [caseSheet.sceneRoom]
  const leadSet = new Set<RoomId>(leadRooms)
  const addLeadRoom = (room: RoomId) => {
    if (!leadSet.has(room)) {
      leadSet.add(room)
      leadRooms.push(room)
    }
  }

  const referQueue: { person: CharId; about: Person }[] = []
  const absorb = (speaker: CharId, answer: Answer): number => {
    for (const claim of answer.claims) {
      spoken.push({ speaker, claim })
      noted.push({ id: `s${noted.length}`, speaker, claim })
      if (claim.kind === 'heard') addLeadRoom(claim.room)
    }
    if (answer.refer?.room) addLeadRoom(answer.refer.room)
    if (answer.refer?.person !== undefined && answer.refer.about !== undefined) {
      referQueue.push({ person: answer.refer.person, about: answer.refer.about })
    }
    return answer.claims.length
  }

  // The gathered cast reacts to the murder — free opening statements.
  for (const m of cast) absorb(m.id, inter.ask(m.id, { kind: 'reaction' }))
  steps.push({ action: 'question', detail: 'Listened to the gathered guests’ first reactions.' })

  const knowledgeAsked = new Set<CharId>()
  const vagueKnowledge = new Set<CharId>()
  const reaskedKnowledge = new Set<CharId>()
  const alibiAsked = new Set<CharId>()
  const shownDocs = new Set<ItemId>()
  const shownTraces = new Set<string>()
  const referAsked = new Set<string>()
  const pressedChars = new Set<CharId>()
  const searchedRooms = new Set<RoomId>()
  let referBudget = 3
  let pressBudget = 3
  let questions = 0
  let searches = 0

  /** Who the gathered record still allows. */
  const suspects = (): CharId[] =>
    enumerateWorlds({ cast, caseSheet, spoken, evidence: found.map((f) => f.fact) }).culprits
  const uniqueCulprit = (): CharId | null => {
    const left = suspects()
    return left.length === 1 ? left[0] : null
  }

  /** Rooms where somebody says they were alone: searching one may clear them. */
  const alibiRooms: { room: RoomId; by: CharId }[] = []
  const nextSearch = (): RoomId | undefined => {
    if (!searchedRooms.has(caseSheet.sceneRoom)) return caseSheet.sceneRoom
    // First the lonely accounts of those still under suspicion…
    const open = new Set(suspects())
    const worth = alibiRooms.find((a) => open.has(a.by) && !searchedRooms.has(a.room))
    if (worth) return worth.room
    // …then wherever the household has pointed.
    return leadRooms.find((r) => !searchedRooms.has(r))
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
    if (alibiAsked.size === cast.length) {
      for (const item of found) {
        if (item.fact.kind !== 'trace') continue
        const fact = item.fact
        for (const m of cast) {
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
    for (const m of cast) {
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
    // 3. Sweep: what does everyone claim to know (role + role-power info)?
    for (const m of cast) {
      if (!knowledgeAsked.has(m.id)) {
        return {
          kind: 'question',
          label: `Asked ${m.shortName} what they know.`,
          run: () => {
            knowledgeAsked.add(m.id)
            if (absorb(m.id, inter.ask(m.id, { kind: 'knowledge' })) === 0) {
              vagueKnowledge.add(m.id)
            }
          },
        }
      }
    }
    // 4. Persist with the vague.
    for (const c of vagueKnowledge) {
      if (!reaskedKnowledge.has(c)) {
        return {
          kind: 'question',
          label: `Pressed the question again with ${cast[c].shortName}.`,
          run: () => {
            reaskedKnowledge.add(c)
            absorb(c, inter.ask(c, { kind: 'knowledge' }))
          },
        }
      }
    }
    // 5. Follow referrals ("ask the Colonel about her").
    while (referQueue.length > 0 && referBudget > 0) {
      const next = referQueue.shift()!
      const key = `${next.person}|${next.about}`
      if (referAsked.has(key)) continue
      referBudget--
      return {
        kind: 'question',
        label: `Asked ${cast[next.person].shortName} about ${
          next.about === 'victim' ? caseSheet.victimName : cast[next.about as CharId].shortName
        }.`,
        run: () => {
          referAsked.add(key)
          absorb(next.person, inter.ask(next.person, { kind: 'aboutPerson', person: next.about }))
        },
      }
    }
    // 6. Press whoever a contradiction stands against (worst implicated first).
    if (pressBudget > 0) {
      const contradictions = findContradictions(noted, found, caseSheet)
      const counts = new Map<CharId, number>()
      for (const c of contradictions) {
        for (const id of c.implicated) counts.set(id, (counts.get(id) ?? 0) + (c.proven ? 3 : 1))
      }
      const candidates = [...pressableChars(contradictions)]
        .filter((c) => !pressedChars.has(c))
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
      detail: `Only one arrangement of the deck fits the testimony and the evidence: ${cast[culprit].name} is the culprit.`,
    })
    return { steps, questionsUsed: questions, searchesUsed: searches, culprit }
  }

  for (let round = 0; round < config.rounds; round++) {
    // Search one room: the scene, an account worth testing, or a lead.
    const target = nextSearch()
    if (target) {
      searchedRooms.add(target)
      searches++
      const items = evidence.filter((e) => e.room === target)
      found.push(...items)
      steps.push({
        action: 'search',
        detail:
          items.length > 0
            ? `Searched ${target} — found ${items.map((i) => i.name).join('; ')}.`
            : `Searched ${target} — nothing of note.`,
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

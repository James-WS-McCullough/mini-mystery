// The rule-based detective, playing by the player's rules: the hours of the
// following night, so many questions and one search an hour, pressing only
// those a contradiction stands against. It must name the murderer, by the
// solver, on what it has gathered, before the clock runs out: the gate every
// evening passes, and the path the reveal can show.

import { findContradictions } from './contradictions'
import { whoCould } from './solver'
import type { TEvidence, TSpoken, TimelineCase } from './types'

/** The detective's night: hours, questions an hour, one search an hour. */
export const BUDGET = { hours: 4, questions: 6, searches: 1 } as const

export function solveTimeline(tc: TimelineCase): TimelineCase['solution'] | null {
  const n = tc.cast.length
  const heard: TSpoken[] = []
  const found: TEvidence[] = tc.evidence.filter((e) => e.plain)
  const steps: string[] = []
  let questions = 0
  let searches = 0
  const solved = () => {
    const could = whoCould({ n, scene: tc.scene, secretive: tc.secretive, heard, evidence: found })
    return could.size === 1 ? [...could.keys()][0] : null
  }
  const pressed = new Set<number>()
  const asked = { evening: new Set<number>(), lastSeen: new Set<number>() }
  // What to do next: every account, then when each last saw him, then press whoever a contradiction stands against.
  const nextQuestion = (): (() => void) | null => {
    for (let c = 0; c < n; c++) {
      if (asked.evening.has(c)) continue
      return () => {
        asked.evening.add(c)
        heard.push(...tc.accounts[c].evening.map((claim) => ({ speaker: c, claim })))
        steps.push(`Asked ${tc.cast[c].shortName} what happened last night.`)
      }
    }
    for (let c = 0; c < n; c++) {
      if (asked.lastSeen.has(c)) continue
      return () => {
        asked.lastSeen.add(c)
        heard.push(...tc.accounts[c].lastSeen.map((claim) => ({ speaker: c, claim })))
        steps.push(`Asked ${tc.cast[c].shortName} when they last saw ${tc.victimShort}.`)
      }
    }
    const against = findContradictions(heard).flatMap((x) => x.implicated).filter((c) => !pressed.has(c))
    const target = against[0]
    if (target === undefined) return null
    return () => {
      pressed.add(target)
      heard.push(...tc.accounts[target].pressed.map((claim) => ({ speaker: target, claim })))
      steps.push(`Pressed ${tc.cast[target].shortName} on the contradiction.`)
    }
  }
  // Where to look: the scene first, then nowhere new (the evening's clues are at the scene).
  const searchOrder = [tc.scene, ...tc.rooms.map((r) => r.id).filter((r) => r !== tc.scene)]
  for (let hour = 0; hour < BUDGET.hours; hour++) {
    const room = searchOrder[hour]
    if (room) {
      searches++
      found.push(...tc.evidence.filter((e) => e.room === room && !e.plain))
      steps.push(`Searched ${tc.rooms.find((r) => r.id === room)?.name ?? room}.`)
      if (solved() !== null) return { questions, searches, steps }
    }
    for (let q = 0; q < BUDGET.questions; q++) {
      const ask = nextQuestion()
      if (!ask) break
      ask()
      questions++
      if (solved() !== null) return { questions, searches, steps }
    }
  }
  return null
}

// The shared asking layer: both the UI and the rule-solver bot go through
// this, so the quiet guests behave identically everywhere: a vague word for
// who they are and what they know, until shown an exhibit that touches them
// (or pressed) — and no more for asking twice.

import type { Answer, CharId, ItemId, Mystery, PressOutcome, QuestionKey } from './types'

function keyOf(q: QuestionKey): string {
  switch (q.kind) {
    case 'aboutPerson':
      return `aboutPerson:${q.person}`
    case 'aboutEvidence':
      return `aboutEvidence:${q.item}`
    default:
      return q.kind
  }
}

export class Interrogation {
  private counts = new Map<string, number>()
  /** The quiet guests who have been given a reason to speak. */
  private opened = new Set<CharId>()
  /** The quiet guests who have, since, said what they were keeping back. */
  private spoke = new Set<CharId>()

  constructor(readonly mystery: Mystery) {}

  timesAsked(char: CharId, q: QuestionKey): number {
    return this.counts.get(`${char}|${keyOf(q)}`) ?? 0
  }

  /** A quiet guest: one with something held back, and exhibits that would loosen it. */
  isQuiet(char: CharId): boolean {
    return (this.mystery.policies[char].opens?.length ?? 0) > 0
  }
  /** Will they say, now, what they have been keeping back? (Everyone else always does.) */
  isOpen(char: CharId): boolean {
    return !this.isQuiet(char) || this.opened.has(char)
  }
  /** The exhibits that would loosen a quiet guest's tongue. */
  opens(char: CharId): ItemId[] {
    return this.mystery.policies[char].opens ?? []
  }
  /** Has a quiet guest, opened, given what they were keeping back yet? */
  hasSpoken(char: CharId): boolean {
    return this.spoke.has(char)
  }

  /** Returns the depth-appropriate answer and advances the ask count. */
  ask(char: CharId, q: QuestionKey): Answer {
    const policy = this.mystery.policies[char]
    const countKey = `${char}|${keyOf(q)}`
    const depth = this.counts.get(countKey) ?? 0
    this.counts.set(countKey, depth + 1)

    // A quiet guest gives the vague answer until opened, and the full one after;
    // anyone else goes by how often they have been asked.
    const pick = (answers: Answer[]): Answer =>
      this.isQuiet(char)
        ? answers[this.opened.has(char) ? answers.length - 1 : 0]
        : answers[Math.min(depth, answers.length - 1)]

    switch (q.kind) {
      case 'reaction':
        return policy.reaction
      case 'role':
        return pick(policy.role)
      case 'alibi':
        return pick(policy.alibi)
      case 'knowledge':
        if (this.opened.has(char)) this.spoke.add(char)
        return pick(policy.knowledge)
      case 'suspect':
        return policy.suspect
      case 'aboutPerson':
        return (
          policy.aboutPerson[String(q.person)] ?? { claims: [], lineKey: 'about.nothing' }
        )
      case 'aboutEvidence': {
        const answer = policy.aboutEvidence[q.item] ?? { claims: [], lineKey: 'evidence.flavor' }
        if (this.isQuiet(char) && !this.opened.has(char) && policy.opens!.includes(q.item)) {
          // Shown the thing that touches them, they give the exhibit its answer
          // — and then, in the same breath, what they had been keeping back.
          this.opened.add(char)
          this.spoke.add(char)
          const full = policy.knowledge[policy.knowledge.length - 1]
          return { ...answer, also: { ...full, lineKey: 'opens' } }
        }
        return answer
      }
    }
  }

  press(char: CharId): PressOutcome {
    // Caught in a contradiction, a quiet guest has no more reason to hold back.
    this.opened.add(char)
    return this.mystery.policies[char].press
  }
}

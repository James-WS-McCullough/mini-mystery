// The shared asking layer: both the UI and the rule-solver bot go through
// this, so ask-depth semantics (vague first answers, substance on
// persistence) behave identically everywhere.

import type { Answer, CharId, Mystery, PressOutcome, QuestionKey } from './types'

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

  constructor(readonly mystery: Mystery) {}

  timesAsked(char: CharId, q: QuestionKey): number {
    return this.counts.get(`${char}|${keyOf(q)}`) ?? 0
  }

  /** Returns the depth-appropriate answer and advances the ask count. */
  ask(char: CharId, q: QuestionKey): Answer {
    const policy = this.mystery.policies[char]
    const countKey = `${char}|${keyOf(q)}`
    const depth = this.counts.get(countKey) ?? 0
    this.counts.set(countKey, depth + 1)

    const pickDepth = (answers: Answer[]): Answer =>
      answers[Math.min(depth, answers.length - 1)]

    switch (q.kind) {
      case 'reaction':
        return policy.reaction
      case 'role':
        return pickDepth(policy.role)
      case 'alibi':
        return pickDepth(policy.alibi)
      case 'knowledge':
        return pickDepth(policy.knowledge)
      case 'suspect':
        return policy.suspect
      case 'aboutPerson':
        return (
          policy.aboutPerson[String(q.person)] ?? { claims: [], lineKey: 'about.nothing' }
        )
      case 'aboutEvidence':
        return policy.aboutEvidence[q.item] ?? { claims: [], lineKey: 'evidence.flavor' }
    }
  }

  press(char: CharId): PressOutcome {
    return this.mystery.policies[char].press
  }
}

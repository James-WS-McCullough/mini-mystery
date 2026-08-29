import { describe, expect, it } from 'vitest'
import { manor1920s } from '../../src/content/manor1920s'
import { generateMystery } from '../../src/engine/generate'
import {
  renderAnswer,
  renderIntro,
  renderPress,
  renderSearch,
  type RenderCtx,
} from '../../src/engine/render'
import type { Answer } from '../../src/engine/types'

const SEEDS = Array.from({ length: 20 }, (_, i) => i + 100)

function assertClean(text: string): void {
  // No unfilled {slots}, no structural fallbacks — every key must be authored.
  expect(text).not.toMatch(/\{\w+\}/)
  expect(text).not.toContain('(claims')
  expect(text.length).toBeGreaterThan(2)
}

describe('rendering', () => {
  for (const seed of SEEDS) {
    it(`seed ${seed} renders every obtainable line cleanly`, () => {
      const mystery = generateMystery({ seed, pack: manor1920s })
      const ctx: RenderCtx = { mystery, pack: manor1920s }

      mystery.policies.forEach((policy, speaker) => {
        const answers: Answer[] = [
          policy.reaction,
          ...policy.role,
          ...policy.alibi,
          ...policy.knowledge,
          policy.suspect,
          ...Object.values(policy.aboutPerson),
          ...Object.values(policy.aboutEvidence),
        ]
        answers.forEach((answer, i) => {
          assertClean(renderAnswer(ctx, speaker, answer, `t${i}`))
        })
        assertClean(renderPress(ctx, speaker, policy.press, 'p'))
      })

      assertClean(renderIntro(ctx))
      for (const room of manor1920s.rooms) {
        assertClean(
          renderSearch(ctx, room.id, mystery.evidence.filter((e) => e.room === room.id), 's'),
        )
      }
    })
  }
})

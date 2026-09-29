import { describe, expect, it } from 'vitest'
import { manor1920s } from '../../src/content/manor1920s'
import { ADDRESSES, addressPlayer } from '../../src/engine/address'
import { generateMystery } from '../../src/engine/generate'
import { renderAnswer, type RenderCtx } from '../../src/engine/render'
import { HINTS } from '../../src/ui/coach'

/** Every line a night can produce, under one form of address. */
function everyLine(seed: number, address?: RenderCtx['address']): string[] {
  const mystery = generateMystery({ seed, pack: manor1920s })
  const ctx: RenderCtx = { mystery, pack: manor1920s, address }
  return mystery.policies.flatMap((policy, speaker) =>
    [policy.reaction, ...policy.alibi, ...policy.knowledge, policy.suspect].map((answer, i) =>
      renderAnswer(ctx, speaker, answer, `t${i}`),
    ),
  )
}

describe('forms of address', () => {
  it('no bank addresses the player except through a slot', () => {
    for (const [key, bank] of Object.entries(manor1920s.dialogue)) {
      for (const line of bank) {
        const bare = line.replace(/\{\w+\}/g, '')
        expect(bare, key).not.toMatch(/\b(sir|ma’am|madam)\b/i)
        expect(bare, key).not.toMatch(/, detective\b/i)
      }
    }
  })

  it('the plain form has everyone say “detective”', () => {
    const lines = [101, 102, 103].flatMap((seed) => everyLine(seed, 'plain'))
    expect(lines.some((l) => /\bdetective\b/i.test(l))).toBe(true)
    for (const line of lines) expect(line).not.toMatch(/\b(sir|ma’am|Mr Detective|Mrs Detective)\b/i)
    expect(everyLine(101)).toEqual(everyLine(101, 'plain'))
  })

  it('the choice changes the address and nothing else', () => {
    const strip = (l: string) => l.replace(/Mrs? Detective|ma’am|sir|detective/gi, '_')
    const plain = everyLine(104, 'plain').map(strip)
    for (const address of ADDRESSES) {
      expect(everyLine(104, address).map(strip)).toEqual(plain)
    }
    expect(everyLine(104, 'maam').join(' ')).not.toMatch(/\bsir\b|Mr Detective/i)
    expect(everyLine(104, 'sir').join(' ')).not.toMatch(/ma’am|Mrs Detective/i)
  })

  it('the sergeant follows suit', () => {
    for (const text of Object.values(HINTS)) {
      for (const address of ADDRESSES) {
        expect(addressPlayer(text, address)).not.toMatch(/\{\w+\}/)
      }
    }
    expect(addressPlayer('{sir}, a word.', 'maam')).toBe('Ma’am, a word.')
  })
})

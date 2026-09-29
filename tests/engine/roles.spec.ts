import { describe, expect, it } from 'vitest'
import { manor1920s } from '../../src/content/manor1920s'
import { findContradictions, type NotedStatement } from '../../src/engine/contradictions'
import { truthClassOf } from '../../src/engine/deck'
import { generateMystery } from '../../src/engine/generate'
import { renderAnswer, type RenderCtx } from '../../src/engine/render'
import type { RoleId } from '../../src/engine/types'
import { splitRoles } from '../../src/ui/roleTags'

const SEEDS = Array.from({ length: 25 }, (_, i) => i + 300)

describe('roles, named and claimed', () => {
  it('every role has a name, an icon and a description', () => {
    const roles = Object.keys(manor1920s.roleNames) as RoleId[]
    expect(roles.length).toBe(10)
    for (const role of roles) {
      expect(manor1920s.roleNames[role]).toMatch(/^the [A-Z]/)
      expect(manor1920s.roleIcons[role]).toBeTruthy()
      expect(manor1920s.deckDescriptions[role]).toBeTruthy()
    }
  })

  it('asked who they are, everyone names a role — by its name', () => {
    for (const seed of SEEDS) {
      const mystery = generateMystery({ seed, pack: manor1920s })
      const ctx: RenderCtx = { mystery, pack: manor1920s }
      mystery.policies.forEach((policy, speaker) => {
        const answer = policy.knowledge[policy.knowledge.length - 1]
        const claim = answer.claims.find((c) => c.kind === 'role')
        expect(claim).toBeDefined()
        if (claim?.kind !== 'role') return
        const said = renderAnswer(ctx, speaker, answer, 'k')
        const tags = splitRoles(said, manor1920s).filter((s) => s.role)
        expect(tags.map((t) => t.role), said).toContain(claim.role)
      })
    }
  })

  it('whoever hides behind a role shares it with its holder, and that is a contradiction', () => {
    for (const seed of SEEDS) {
      const mystery = generateMystery({ seed, pack: manor1920s })
      const noted: NotedStatement[] = []
      mystery.policies.forEach((policy, speaker) => {
        for (const claim of policy.knowledge[policy.knowledge.length - 1].claims) {
          noted.push({ id: `s${noted.length}`, speaker, claim })
        }
      })
      const doubled = findContradictions(noted, [], mystery.caseSheet).filter(
        (c) => c.reason === 'role-overclaimed',
      )
      const concealers = mystery.cast
        .map((m) => m.id)
        .filter((c) => truthClassOf(mystery.truth.roles[c]) === 'concealer')
      for (const c of concealers) {
        expect(doubled.some((d) => d.implicated.includes(c)), `seed ${seed}`).toBe(true)
      }
    }
  })
})

describe('role tags', () => {
  it('picks role names out of a line, and nothing else', () => {
    const parts = splitRoles('Well, I am the Witness. The Gossip told me so, and I witness it.', manor1920s)
    expect(parts.filter((p) => p.role).map((p) => [p.role, p.text])).toEqual([
      ['witness', 'the Witness'],
      ['gossip', 'The Gossip'],
    ])
    expect(parts.map((p) => p.text).join('')).toBe(
      'Well, I am the Witness. The Gossip told me so, and I witness it.',
    )
  })

  it('leaves the household’s own names alone', () => {
    for (const c of manor1920s.characters) {
      expect(splitRoles(`${c.name}, ${c.shortName}`, manor1920s).some((p) => p.role)).toBe(false)
    }
  })
})

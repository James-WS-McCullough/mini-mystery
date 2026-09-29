import { describe, expect, it } from 'vitest'
import { manor1920s } from '../../src/content/manor1920s'
import { findContradictions, type NotedStatement } from '../../src/engine/contradictions'
import { generateMystery } from '../../src/engine/generate'
import { renderAnswer, type RenderCtx } from '../../src/engine/render'
import { MOTIVE_GRADE, type RoleId } from '../../src/engine/types'
import { splitRoles } from '../../src/ui/roleTags'

const SEEDS = Array.from({ length: 25 }, (_, i) => i + 300)

describe('roles, named and claimed', () => {
  it('every role has a name, an icon and a description', () => {
    const roles = Object.keys(manor1920s.roleNames) as RoleId[]
    expect(roles.length).toBe(19)
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

  it('two who claim one role are a contradiction, whichever role it is', () => {
    const noted: NotedStatement[] = [
      { id: 'a', speaker: 0, claim: { kind: 'role', role: 'witness' } },
      { id: 'b', speaker: 1, claim: { kind: 'role', role: 'witness' } },
      { id: 'c', speaker: 2, claim: { kind: 'role', role: 'gossip' } },
    ]
    const mystery = generateMystery({ seed: 1, pack: manor1920s })
    const found = findContradictions(noted, [], mystery.caseSheet).filter(
      (c) => c.reason === 'role-overclaimed',
    )
    expect(found).toHaveLength(1)
    expect(found[0].implicated.sort()).toEqual([0, 1])
  })
})

describe('the Sleuth and the Red Herring', () => {
  const nights = Array.from({ length: 120 }, (_, i) =>
    generateMystery({ seed: i + 1, pack: manor1920s }),
  )

  it('both turn up', () => {
    expect(nights.some((m) => m.config.deck.includes('sleuth'))).toBe(true)
    expect(nights.some((m) => m.config.deck.includes('redherring'))).toBe(true)
  })

  it('the true Sleuth names three, the murderer among them, and never themselves', () => {
    for (const m of nights) {
      const sleuth = m.truth.roles.indexOf('sleuth')
      if (sleuth < 0) continue
      const culprit = m.truth.roles.indexOf('culprit')
      const lists = m.policies[sleuth].knowledge.flatMap((a) => a.claims).filter((c) => c.kind === 'among')
      expect(lists.length).toBeGreaterThan(0)
      for (const l of lists) {
        if (l.kind !== 'among') continue
        expect(l.suspects.length).toBe(3)
        expect(l.suspects).toContain(culprit)
        expect(l.suspects).not.toContain(sleuth)
      }
    }
  })

  it('nobody lying about being the Sleuth ever names the murderer', () => {
    for (const m of nights) {
      const culprit = m.truth.roles.indexOf('culprit')
      m.policies.forEach((policy, speaker) => {
        if (m.truth.roles[speaker] === 'sleuth') return
        for (const c of policy.knowledge.flatMap((a) => a.claims)) {
          if (c.kind === 'among') expect(c.suspects).not.toContain(culprit)
        }
      })
    }
  })

  it('the Red Herring was seen at the scene, earlier, and was elsewhere at the hour', () => {
    for (const m of nights) {
      const herring = m.truth.roles.indexOf('redherring')
      if (herring < 0) continue
      expect(m.truth.locations[herring]).not.toBe(m.truth.sceneRoom)
      const seen = m.policies.flatMap((p, speaker) =>
        p.knowledge.flatMap((a) => a.claims).filter((c) => c.kind === 'earlier').map((c) => ({ speaker, c })),
      )
      expect(seen.length).toBeGreaterThan(0)
      for (const { speaker, c } of seen) {
        if (c.kind !== 'earlier') continue
        expect(c.target).toBe(herring)
        expect(c.room).toBe(m.truth.sceneRoom)
        expect(speaker).not.toBe(herring)
      }
      // It is no contradiction: being there earlier breaks nobody's account.
      const noted: NotedStatement[] = []
      m.policies.forEach((policy, speaker) => {
        for (const a of [...policy.alibi, ...policy.knowledge]) {
          for (const claim of a.claims) noted.push({ id: `s${noted.length}`, speaker, claim })
        }
      })
      const earlierIds = noted.filter((n) => n.claim.kind === 'earlier').map((n) => n.id)
      for (const x of findContradictions(noted, [], m.caseSheet)) {
        expect(x.statementIds.some((id) => earlierIds.includes(id))).toBe(false)
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

describe('exhibits', () => {
  it('every motive document and idle item has a drawing of its own', () => {
    const art = manor1920s.itemArt!
    const papers = Object.values(manor1920s.motiveItems).flat()
    expect(papers.length).toBe(36)
    for (const name of papers) expect(art.glyphs[art.documents[name]], name).toBeDefined()
    expect(new Set(papers.map((n) => art.documents[n])).size).toBe(papers.length)
    for (const name of manor1920s.flavorItems) expect(art.glyphs[art.flavor[name]], name).toBeDefined()
    for (const m of manor1920s.methods) expect(art.glyphs[`weapon.${m.id}`], m.id).toBeDefined()
    for (const t of manor1920s.traits) expect(art.glyphs[`trace.${t.id}`], t.id).toBeDefined()
  })

  it('the papers vary from case to case, and no house holds the same one twice', () => {
    const seen = new Set<string>()
    for (let seed = 1; seed <= 60; seed++) {
      const m = generateMystery({ seed, pack: manor1920s })
      const docs = m.evidence.filter((e) => e.fact.kind === 'motiveDocument').map((e) => e.name)
      expect(new Set(docs).size).toBe(docs.length)
      for (const d of docs) seen.add(d)
    }
    expect(seen.size).toBeGreaterThanOrEqual(18)
  })

  it('every motive has words for owning to it and for telling it of another', () => {
    for (const rel of MOTIVE_GRADE) {
      expect(manor1920s.dialogue[`claim.relationship.self.${rel}`]?.length ?? 0, rel).toBeGreaterThan(2)
      expect(manor1920s.dialogue[`claim.relationship.gossip.${rel}`]?.length ?? 0, rel).toBeGreaterThan(2)
      expect(manor1920s.motiveItems[rel]?.length ?? 0, rel).toBe(4)
      expect(manor1920s.relationLabels?.[rel], rel).toBeTruthy()
    }
    // The newer manners of speaking have their own words for nearly all of them.
    let voiced = 0
    let wanted = 0
    for (const rel of MOTIVE_GRADE) {
      for (const manner of ['deferential', 'boastful', 'blunt', 'rambling', 'cheeky', 'gossipy']) {
        for (const kind of ['self', 'gossip']) {
          wanted++
          const bank = manor1920s.dialogue[`claim.relationship.${kind}.${rel}.${manner}`] ?? []
          if (bank.length >= 2) voiced++
          for (const line of bank) {
            if (kind === 'gossip') expect(line, line).toContain('{subject}')
            else expect(line, line).not.toContain('{subject}')
            expect(line.replace(/\{\w+\}/g, ''), line).not.toMatch(/\b(daughter|son)\b/i)
          }
        }
      }
    }
    expect(voiced / wanted).toBeGreaterThan(0.95)
    const motives = new Set<string>()
    for (let seed = 1; seed <= 120; seed++) {
      const m = generateMystery({ seed, pack: manor1920s })
      motives.add(m.truth.relationships[m.truth.roles.indexOf('culprit')])
    }
    expect(motives.size).toBe(MOTIVE_GRADE.length)
  })
})

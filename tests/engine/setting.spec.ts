import { describe, expect, it } from 'vitest'
import { PACKS, packOf } from '../../src/content'
import { manor1920s } from '../../src/content/manor1920s'
import { generateMystery } from '../../src/engine/generate'
import { caseTitle, renderAnswer, titleCase, victimAs, type RenderCtx } from '../../src/engine/render'
import type { Temperament } from '../../src/engine/types'

const banks = [
  'dialogue',
  'manners',
  'motiveLines',
  'helperLines',
  'observedLines',
  'murdererLines',
  'heartyLines',
]

describe('the setting', () => {
  it('is a pack, and there is a default', () => {
    expect(packOf(undefined)).toBe(manor1920s)
    expect(packOf('nonsense')).toBe(manor1920s)
    for (const pack of Object.values(PACKS)) {
      expect(pack.victim.firstName.length).toBeGreaterThan(0)
      expect(pack.victim.respectful.length).toBeGreaterThan(0)
      expect(pack.place.name.length).toBeGreaterThan(0)
      expect(pack.place.gathering.length).toBeGreaterThan(0)
    }
  })

  it('nobody in the banks names the victim, the place or a pronoun of the victim’s outright', () => {
    for (const key of Object.keys(manor1920s.dialogue)) {
      for (const line of manor1920s.dialogue[key]) {
        expect(line, key).not.toMatch(/lordship|Blackwood/)
        expect(line, key).not.toMatch(/(^|[^{a-zA-Z])(he|him|his|himself)([^}a-zA-Z]|$)/i)
        expect(line, key).not.toMatch(/\b(the|this) house\b/i)
        expect(line, key).not.toMatch(/\bmy father\b|\bFather\b/)
      }
    }
    expect(banks.length).toBeGreaterThan(5)
  })
})

describe('what they call the victim', () => {
  const m = generateMystery({ seed: 12, pack: manor1920s })
  const ctx: RenderCtx = { mystery: m, pack: manor1920s }
  const as = (defId: string, manner: Temperament) => {
    const member = { ...m.cast[0], defId, temperament: manner }
    return victimAs(ctx, member)
  }

  it('depends on who is speaking, and how', () => {
    expect(as('butler', 'deferential')).toBe('his lordship')
    expect(as('butler', 'cheeky')).toBe('his lordship')
    expect(as('colonel', 'gracious')).toBe('Lord Blackwood')
    expect(as('colonel', 'blunt')).toBe('Blackwood')
    expect(as('heiress', 'cheeky')).toBe('Blackwood')
    expect(as('hunter', 'hearty')).toBe('old Edgar')
    expect(as('son', 'boastful')).toBe('Father')
    expect(as('daughter', 'hearty')).toBe('Father')
  })

  it('comes out in what they say, with the victim’s pronouns filled in', () => {
    let mentions = 0
    for (const g of m.cast) {
      const p = m.policies[g.id]
      for (const a of [p.aboutPerson.victim, p.reaction, ...p.knowledge]) {
        const said = renderAnswer(ctx, g.id, a, 'x')
        expect(said).not.toMatch(/\{/)
        if (said.includes(victimAs(ctx, g)) || /\b(he|him|his)\b/i.test(said)) mentions++
      }
    }
    expect(mentions).toBeGreaterThan(m.cast.length / 2)
  })

  it('a sentence that begins with the victim’s pronoun begins with a capital', () => {
    const child = m.cast.find((g) => g.defId === 'son' || g.defId === 'daughter')
    const speaker = child ?? m.cast[0]
    const said = renderAnswer(
      ctx,
      speaker.id,
      { claims: [{ kind: 'relationship', subject: speaker.id, rel: 'devoted' }], lineKey: 'about.victim' },
      'x',
    )
    for (const sentence of said.split(/(?<=[.!?])\s+/)) {
      expect(sentence[0], said).toBe(sentence[0].toUpperCase())
    }
  })
})

describe('the case’s title', () => {
  it('is drawn for every setting, tells nobody who did it, and is the same for the same seed', () => {
    for (const pack of Object.values(PACKS)) {
      const seen = new Set<string>()
      for (let seed = 1; seed <= 30; seed++) {
        const m = generateMystery({ seed, pack })
        const ctx: RenderCtx = { mystery: m, pack }
        const title = caseTitle(ctx)
        expect(title.length).toBeGreaterThan(4)
        expect(title).not.toMatch(/\{/)
        for (const g of m.cast) {
          expect(title, `${pack.id} ${seed}: ${title}`).not.toContain(g.shortName)
          // (The victim's own children share the name in the title, and that is no clue.)
          const surname = g.name.split(' ').pop()!
          if (surname !== pack.victim.lastName) expect(title).not.toContain(surname)
        }
        expect(caseTitle({ mystery: generateMystery({ seed, pack }), pack })).toBe(title)
        seen.add(title)
      }
      // A good spread of them.
      expect(seen.size, pack.id).toBeGreaterThan(8)
    }
  })

  it('reads as a title', () => {
    expect(titleCase('the library')).toBe('The Library')
    expect(titleCase('a body in the library')).toBe('A Body in the Library')
    expect(titleCase('murder on the highland express')).toBe('Murder on the Highland Express')
  })
})


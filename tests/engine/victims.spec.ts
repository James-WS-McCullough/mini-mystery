// Who is found dead: one of the setting's victims, drawn by the number. The
// dead are not at the table, nor whoever their death puts out of the house;
// their children alone say "Father"; the grudges and the occasions fit them;
// and every word of the night speaks of them by their own name and pronouns.

import { describe, expect, it } from 'vitest'
import { PACKS } from '../../src/content'
import { manor1920s } from '../../src/content/manor1920s'
import { allSpoken, generateMystery, pickVictim } from '../../src/engine/generate'
import { Rng } from '../../src/engine/rng'
import { caseTitle, describeClaim, describeEvidence, occasionText, renderAnswer, renderIntro, type RenderCtx } from '../../src/engine/render'
import { isMotiveGrade } from '../../src/engine/types'
import { DEALING, deal } from '../deal'

describe('the victims', () => {
  it('are listed by every setting, each with a sound id, character, children and occasions', () => {
    for (const pack of Object.values(PACKS)) {
      expect(pack.victims.length).toBeGreaterThan(0)
      expect(new Set(pack.victims.map((v) => v.id)).size).toBe(pack.victims.length)
      for (const v of pack.victims) {
        const ids = pack.characters.map((c) => c.id)
        if (v.character) expect(ids).toContain(v.character)
        for (const c of [...(v.excludes ?? []), ...(v.children ?? [])]) expect(ids).toContain(c)
        for (const o of v.occasions ?? []) expect((pack.occasions ?? []).map((x) => x.id)).toContain(o)
      }
    }
  })

  it('are drawn by the number, each about as often as another, and by name when asked', () => {
    const drawn = new Map<string, number>()
    for (let seed = 1; seed <= 300; seed++) {
      const v = pickVictim(new Rng(`${seed}:victim`), manor1920s)
      drawn.set(v.id, (drawn.get(v.id) ?? 0) + 1)
    }
    expect([...drawn.keys()].sort()).toEqual(['blackwood', 'pemberton', 'trent'])
    // (Equal odds: none of the three falls far short of a third of the nights.)
    for (const v of drawn.values()) expect(v).toBeGreaterThan(70)
    expect(pickVictim(new Rng('x'), manor1920s, 'trent').id).toBe('trent')
    expect(() => pickVictim(new Rng('x'), manor1920s, 'nobody')).toThrow()
  })

  it('keep the dead, and whoever their death puts out, from the table; the master sits only when he lives', async () => {
    const cases = await deal(40, (seed) => generateMystery({ seed, pack: manor1920s }))
    const seen = new Set<string>()
    for (const m of cases) {
      seen.add(m.victim.id)
      const away = [m.victim.character, ...(m.victim.excludes ?? [])]
      for (const g of m.cast) expect(away).not.toContain(g.defId)
      if (m.victim.id === 'blackwood') expect(m.cast.map((g) => g.defId)).not.toContain('lord')
    }
    expect(seen.size).toBe(3)
  })

  it('give the grudges and the occasion that fit the dead', async () => {
    const cases = await deal(60, (seed) => generateMystery({ seed, pack: manor1920s }))
    const housekeeper = cases.filter((m) => m.victim.id === 'pemberton')
    expect(housekeeper.length).toBeGreaterThan(0)
    for (const m of cases) {
      const v = m.victim
      if (v.occasions) expect(v.occasions).toContain(m.truth.occasion)
      if (v.motives) {
        for (const rel of m.truth.relationships) if (isMotiveGrade(rel)) expect(v.motives).toContain(rel)
        // (Nor is a grudge she could not have been the object of ever pinned on anybody, truly or falsely.)
        for (const s of allSpoken(m)) {
          if (s.claim.kind === 'relationship' && isMotiveGrade(s.claim.rel)) expect(v.motives).toContain(s.claim.rel)
        }
        for (const e of m.evidence) {
          if (e.fact.kind === 'motiveDocument' && isMotiveGrade(e.fact.rel)) expect(v.motives).toContain(e.fact.rel)
        }
      }
    }
  })

  it('are spoken of by their own name and pronouns, the housekeeper as a woman, all night long', async () => {
    const cases = await deal(30, (seed) => generateMystery({ seed, pack: manor1920s }))
    const hers = cases.filter((m) => m.victim.id === 'pemberton')
    expect(hers.length).toBeGreaterThan(0)
    for (const m of hers) {
      const ctx: RenderCtx = { mystery: m, pack: manor1920s }
      const said: string[] = [renderIntro(ctx)]
      m.policies.forEach((p, speaker) => {
        const answers = [p.reaction, ...p.role, ...p.alibi, ...p.knowledge, p.seen, p.suspect, ...Object.values(p.aboutPerson), ...Object.values(p.aboutEvidence)]
        for (const a of answers) {
          said.push(renderAnswer(ctx, speaker, a, 'v'))
          for (const c of a.claims) said.push(describeClaim(ctx, speaker, c))
        }
      })
      for (const e of m.evidence) said.push(e.name, describeEvidence(ctx, e))
      for (const line of said) {
        expect(line, line).not.toMatch(/\{\w+\}/)
        // (His lordship may be at the table alive, and spoken of; never as the dead.)
        expect(line, line).not.toMatch(/his lordship/)
        if (!m.cast.some((g) => g.defId === 'lord')) expect(line, line).not.toMatch(/Lord Blackwood|Blackwood’s/)
        // (The banks carry no pronoun for anybody but the dead: so none of his should be left.)
        expect(line, line).not.toMatch(/\b(him|himself)\b/)
      }
    }
  })

  it('have the children of the house say "Father" only on their father’s night', () => {
    const his = generateMystery({ seed: 3, pack: manor1920s, victim: 'blackwood' })
    const hers = generateMystery({ seed: 3, pack: manor1920s, victim: 'pemberton' })
    for (const m of [his, hers]) {
      const ctx: RenderCtx = { mystery: m, pack: manor1920s }
      const child = m.cast.find((g) => g.defId === 'daughter' || g.defId === 'son')
      if (!child) continue
      const a = m.policies[child.id].aboutPerson.victim
      const line = renderAnswer(ctx, child.id, a, 'v')
      if (m.victim.id === 'blackwood') expect(line).toMatch(/Father/)
      else expect(line).not.toMatch(/Father/)
    }
  })
})

describe('the other settings’ victims', () => {
  const OTHERS = ['village1926', 'train1926', 'boat1926'] as const
  /** The usual dead of each place, by name (their children share the surname, and may be at the table). */
  const USUAL: Record<(typeof OTHERS)[number], RegExp> = {
    village1926: /Sir Henry|the Squire\b/,
    train1926: /Sir Julius/,
    boat1926: /Mr\. Vane(?!, junior)/,
  }

  for (const id of OTHERS) {
    it(`${id}: every victim is drawn, fits the occasion, and is spoken of by name all night`, { timeout: DEALING }, async () => {
      const pack = PACKS[id]
      const cases = await deal(45, (seed) => generateMystery({ seed, pack }))
      const seen = new Set(cases.map((m) => m.victim.id))
      expect([...seen].sort()).toEqual(pack.victims.map((v) => v.id).sort())
      for (const m of cases) {
        const v = m.victim
        for (const g of m.cast) expect([v.character, ...(v.excludes ?? [])]).not.toContain(g.defId)
        if (v.occasions) expect(v.occasions).toContain(m.truth.occasion)
        if (v.motives) for (const rel of m.truth.relationships) if (isMotiveGrade(rel)) expect(v.motives).toContain(rel)
        if (v.id === pack.victims[0].id) continue
        const ctx: RenderCtx = { mystery: m, pack }
        const said: string[] = [renderIntro(ctx), occasionText(ctx) ?? '', caseTitle(ctx)]
        m.policies.forEach((p, speaker) => {
          const answers = [p.reaction, ...p.role, ...p.alibi, ...p.knowledge, p.seen, p.suspect, ...Object.values(p.aboutPerson), ...Object.values(p.aboutEvidence)]
          for (const a of answers) {
            said.push(renderAnswer(ctx, speaker, a, 'v'))
            for (const c of a.claims) said.push(describeClaim(ctx, speaker, c))
          }
        })
        for (const e of m.evidence) said.push(e.name, describeEvidence(ctx, e))
        for (const line of said) {
          expect(line, `${v.id}: ${line}`).not.toMatch(/\{\w+\}/)
          // (The usual dead may be at the table alive, as his lordship is; but the dead are never called by the usual name.)
          if (v.pronouns === 'she') expect(line, `${v.id}: ${line}`).not.toMatch(/\b(him|himself)\b/)
          if (!m.cast.some((g) => g.defId === pack.victims[0].character || g.defId === pack.victims[0].id))
            expect(line, `${v.id}: ${line}`).not.toMatch(USUAL[id])
        }
      }
    })
  }
})

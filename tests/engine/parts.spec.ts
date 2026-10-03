import { describe, expect, it } from 'vitest'
import { manor1920s } from '../../src/content/manor1920s'
import { KNOT_SCRIPT, TWIST_SCRIPT } from '../../src/engine/deck'
import { generateMystery } from '../../src/engine/generate'
import { HonestPart, LiarPart, MaskedPart, MistakenPart, partOf } from '../../src/engine/parts'
import { CarefulMurderer, CunningMurderer, Murderer } from '../../src/engine/parts/murderers'
import { Amnesiac, Clinger, RedHerring, Sweetheart } from '../../src/engine/parts/suspicious'
import { ROLE_IDS, ROLES } from '../../src/engine/roles'
import { seedsOf } from '../deal'

describe('parts, as classes', () => {
  it('every role has a part, of the kind its truth class says', () => {
    for (const r of ROLE_IDS) {
      const part = partOf(r)
      expect(part.id, r).toBe(r)
      expect(part.spec).toBe(ROLES[r])
      const cls = { honest: HonestPart, concealer: LiarPart, masked: MaskedPart, unreliable: MistakenPart }[ROLES[r].truth]
      expect(part, r).toBeInstanceOf(cls)
    }
    expect(partOf('amnesiac')).toBeInstanceOf(Amnesiac)
    expect(partOf('sweetheart')).toBeInstanceOf(Sweetheart)
    expect(partOf('clinger')).toBeInstanceOf(Clinger)
    expect(partOf('redherring')).toBeInstanceOf(RedHerring)
    // The Drunk is honest in all but who they are, and so is told as one.
    expect(partOf('drunk')).toBeInstanceOf(HonestPart)
  })

  it('the murderer’s part is of the kind of murderer they are', () => {
    expect(partOf('murderer')).toBeInstanceOf(Murderer)
    expect(partOf('murderer', 'careful')).toBeInstanceOf(CarefulMurderer)
    expect(partOf('murderer', 'cunning')).toBeInstanceOf(CunningMurderer)
    expect(partOf('murderer', 'serial')).not.toBeInstanceOf(CunningMurderer)
  })

  it('a guest’s told account is their part’s telling, ties and all; and so are the answers', () => {
    for (const seed of seedsOf(TWIST_SCRIPT, 'cunning', 4)) {
      const m = generateMystery({ seed, pack: manor1920s, script: TWIST_SCRIPT })
      for (const g of m.guests) {
        const p = m.policies[g.id]
        const role = p.knowledge.at(-1)!.claims.find((k) => k.kind === 'role')
        expect(role?.kind === 'role' && role.role).toBe(g.told.role)
        const where = p.alibi[0].claims.find((k) => k.kind === 'whereabouts')
        if (g.told.where) expect(where).toEqual({ kind: 'whereabouts', ...g.told.where })
        else expect(where).toBeUndefined()
        expect(p.aboutPerson.victim.claims[0]).toEqual({ kind: 'relationship', subject: g.id, rel: g.told.standing })
        // The honest tell it as it was.
        if (ROLES[g.truth.role].truth === 'honest' && g.truth.role !== 'amnesiac' && g.id !== m.truth.sweetheartOf && g.id !== m.truth.clingerOf) {
          expect(g.told.where).toEqual(g.truth.where)
          expect(g.told.role).toBe(g.truth.role)
        }
      }
    }
  })

  it('pressed, the Cunning Murderer owns to the part they play, with its tell', () => {
    const acts = new Set<string>()
    for (const seed of seedsOf(KNOT_SCRIPT, 'cunning', 12)) {
      const m = generateMystery({ seed, pack: manor1920s, script: KNOT_SCRIPT })
      const c = m.truth.roles.indexOf('murderer')
      const press = m.policies[c].press
      if (press.kind !== 'confess') continue
      const owned = press.claims.find((k) => k.kind === 'role')
      if (owned?.kind !== 'role') continue
      expect(['redherring', 'thief', 'blackmailer', 'clinger']).toContain(owned.role)
      acts.add(owned.role)
    }
    expect(acts.size).toBeGreaterThan(0)
  })
})

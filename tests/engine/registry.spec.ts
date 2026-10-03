import { describe, expect, it } from 'vitest'
import { manor1920s } from '../../src/content/manor1920s'
import { isEvil, liesAboutRole, roleClassOf, truthClassOf } from '../../src/engine/deck'
import { INFO, KNOWN_IN_TURN, KNOWN_OF_THE_LIES } from '../../src/engine/info'
import {
  CAREFUL_TRUTHS,
  DRUNK_BELIEFS,
  HELPERS,
  INFO_ROLES,
  INNOCENT_POOL,
  ROLE_IDS,
  ROLES,
  SEEKS_MURDERER,
  SUSPICIOUS_POOL,
  WORTH_BUYING,
} from '../../src/engine/roles'

describe('the registry of parts', () => {
  it('every part the pack names is in it, and every part in it is named and drawn', () => {
    expect(new Set(ROLE_IDS)).toEqual(new Set(Object.keys(manor1920s.roleNames)))
    for (const r of ROLE_IDS) {
      expect(manor1920s.roleIcons[r], r).toBeTruthy()
      expect(manor1920s.deckDescriptions[r], r).toBeTruthy()
    }
  })

  it('draws its lists in the order a seed depends on', () => {
    // (Reordering any of these changes what every seed deals.)
    expect(INNOCENT_POOL).toEqual([
      'witness', 'oracle', 'confidant', 'gossip', 'sleuth', 'steward', 'collector', 'discoverer', 'alibi', 'porter',
      'spinster',
    ])
    expect(SUSPICIOUS_POOL).toEqual([
      'thief', 'begrudged', 'loner', 'redherring', 'blackmailer', 'amnesiac', 'sweetheart', 'clinger',
    ])
    expect(HELPERS).toEqual(['perjurer', 'forger', 'framer', 'cleaner', 'whisperer', 'sponsor', 'martyr'])
    expect(INFO_ROLES).toEqual([
      'witness', 'oracle', 'confidant', 'gossip', 'sleuth', 'steward', 'architect', 'discoverer', 'porter', 'spinster',
    ])
    expect(DRUNK_BELIEFS).toEqual(['witness', 'discoverer', 'confidant', 'sleuth', 'steward'])
    expect(WORTH_BUYING).toEqual(['witness', 'discoverer', 'sleuth', 'architect', 'oracle', 'confidant', 'steward'])
    // (These two are only asked whether a part is among them.)
    expect(new Set(SEEKS_MURDERER)).toEqual(new Set(['witness', 'oracle', 'discoverer', 'sleuth']))
    expect(new Set(CAREFUL_TRUTHS)).toEqual(new Set(['confidant', 'gossip', 'steward', 'architect', 'porter', 'spinster']))
  })

  it('the rules that keep the solver sound hold of every part', () => {
    // The Drunk never believes in a part whose knowledge the solver would take from them.
    expect(DRUNK_BELIEFS).not.toContain('gossip')
    for (const r of ROLE_IDS) {
      expect(roleClassOf(r)).toBe(ROLES[r].class)
      expect(truthClassOf(r)).toBe(ROLES[r].truth)
      // The murderer's friends are evil, and lie about who they are; the innocent are neither.
      if (ROLES[r].class === 'accomplice') expect(isEvil(r) && liesAboutRole(r), r).toBe(true)
      if (ROLES[r].class === 'innocent') expect(isEvil(r) || ROLES[r].truth !== 'honest', r).toBe(false)
      // What a liar may pass for is something an innocent knows.
      if (ROLES[r].info) expect(ROLES[r].class, r).toBe('innocent')
    }
    expect(truthClassOf(null)).toBe('honest')
  })

  it('every part with something to tell has its telling: true, false, mistaken and careful', () => {
    for (const r of INFO_ROLES) {
      expect(INFO[r]?.fabricate, r).toBeTypeOf('function')
      // What it truly knows is dealt in turn, or once the lies are told; the
      // Gossip's comes with the quarrel they overheard.
      const knows = KNOWN_IN_TURN.includes(r) || KNOWN_OF_THE_LIES.includes(r) || r === 'gossip'
      expect(knows, r).toBe(true)
      if (KNOWN_IN_TURN.includes(r)) expect(INFO[r]!.knows, r).toBeTypeOf('function')
      if (KNOWN_OF_THE_LIES.includes(r)) expect(INFO[r]!.knowsOfTheLies, r).toBeTypeOf('function')
    }
    for (const r of DRUNK_BELIEFS) expect(INFO[r]?.corrupt, r).toBeTypeOf('function')
    for (const r of CAREFUL_TRUTHS) expect(INFO[r]?.careful, r).toBeTypeOf('function')
    expect(Object.keys(INFO).sort()).toEqual([...INFO_ROLES].sort())
  })
})

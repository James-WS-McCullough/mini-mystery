// Two questions: their role, and what they have seen. The first gives what
// the role tells them and nothing else; the second, whatever else came their
// way — and having seen something marks nobody out as honest.

import { describe, expect, it } from 'vitest'
import { manor1920s as pack } from '../../src/content/manor1920s'
import { liesAboutRole, truthClassOf } from '../../src/engine/deck'
import { generateMystery } from '../../src/engine/generate'

const nights = Array.from({ length: 150 }, (_, i) => generateMystery({ seed: i + 1, pack }))
const hiding = (role: Parameters<typeof liesAboutRole>[0]) =>
  liesAboutRole(role) || truthClassOf(role) === 'unreliable'

describe('what they have seen', () => {
  it('asked their role, nobody tells of a blackmailer, or of a sound unless it is the Gossip', () => {
    for (const m of nights) {
      const gossip = m.truth.roles.indexOf('gossip')
      m.policies.forEach((p, c) => {
        for (const claim of p.knowledge.flatMap((a) => a.claims)) {
          expect(claim.kind, `seed ${m.seed}`).not.toBe('blackmailed')
          if (c !== gossip) expect(claim.kind, `seed ${m.seed}`).not.toBe('heard')
        }
      })
    }
  })

  it('those with something to hide have seen something about as often as the honest', () => {
    let honest = 0, honestSaw = 0, hid = 0, hidSaw = 0
    for (const m of nights) {
      m.policies.forEach((p, c) => {
        const saw = p.seen.claims.length > 0
        if (hiding(m.truth.roles[c])) {
          hid++
          if (saw) hidSaw++
        } else {
          honest++
          if (saw) honestSaw++
        }
      })
    }
    expect(Math.abs(hidSaw / hid - honestSaw / honest)).toBeLessThan(0.12)
  })

  it('what the hiding have seen is true', () => {
    for (const m of nights) {
      m.policies.forEach((p, c) => {
        if (!hiding(m.truth.roles[c])) return
        for (const claim of p.seen.claims) {
          expect(claim.kind).toBe('sighting')
          if (claim.kind === 'sighting') expect(m.truth.locations[claim.target]).toBe(claim.room)
        }
      })
    }
  })
})

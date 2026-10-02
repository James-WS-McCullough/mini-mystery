import { describe, expect, it } from 'vitest'
import { manor1920s } from '../../src/content/manor1920s'
import { claimIsTrue } from '../../src/engine/claims'
import { findContradictions, type NotedStatement } from '../../src/engine/contradictions'
import { CLASSIC_SCRIPT, CONSPIRACY_SCRIPT, FOGGY_SCRIPT, HELPERS, truthClassOf } from '../../src/engine/deck'
import { allSpoken, generateMystery } from '../../src/engine/generate'
import { findLinks } from '../../src/engine/links'
import { enumerateWorlds } from '../../src/engine/solver/worlds'
import { TEMPERAMENTS, isMotiveGrade, type Mystery, type Spoken } from '../../src/engine/types'

const foggy = Array.from({ length: 60 }, (_, i) =>
  generateMystery({ seed: i + 1, pack: manor1920s, script: FOGGY_SCRIPT }),
)
const conspiracy = Array.from({ length: 200 }, (_, i) =>
  generateMystery({ seed: i + 1, pack: manor1920s, script: CONSPIRACY_SCRIPT }),
)
const nights = [...foggy, ...conspiracy]
/** Who did it: -1 where he did it himself, -2 where he is not dead. */
const culpritOf = (m: Mystery) => (m.truth.hoax ? -2 : m.truth.roles.indexOf('culprit'))
const facts = (m: Mystery) => m.evidence.map((e) => e.fact)
const noted = (spoken: Spoken[]): NotedStatement[] =>
  spoken.map((s, i) => ({ id: `s${i}`, speaker: s.speaker, claim: s.claim }))
const confessions = (m: Mystery): Spoken[] =>
  m.policies.flatMap((p, speaker) => (p.confession?.claims ?? []).map((claim) => ({ speaker, claim })))
const left = (m: Mystery, spoken: Spoken[], evidence = facts(m)) =>
  enumerateWorlds({ cast: m.cast, caseSheet: m.caseSheet, spoken, evidence }).culprits.sort()

describe('kinds of murderer', () => {
  it('a classic evening has the plain kind and no other', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const m = generateMystery({ seed, pack: manor1920s, script: CLASSIC_SCRIPT })
      expect(m.truth.murderer).toBe('plain')
      expect(m.truth.second ?? null).toBeNull()
      expect(m.policies.some((p) => p.confession)).toBe(false)
      expect(m.caseSheet.script.murderers).toBeUndefined()
    }
  })

  it('a foggy night may have one who kills again, a cunning, careful or artful one, or none — and never one who owns to it', () => {
    const kinds = new Set(foggy.map((m) => (m.truth.suicide ? 'suicide' : m.truth.hoax ? 'hoax' : m.truth.murderer)))
    expect([...kinds].sort()).toEqual(['artful', 'careful', 'cunning', 'hoax', 'plain', 'serial', 'suicide'])
    for (const m of foggy) {
      expect(m.caseSheet.script.murderers).toEqual(['plain', 'serial', 'cunning', 'careful', 'artful'])
      expect(m.caseSheet.script.suicide).toBe(true)
      expect(m.policies.some((p) => p.confession)).toBe(false)
    }
  })

  it('a conspiracy may have any of the six, or none — the cunning and careful ones, and none, only on a night with no friend of a murderer', () => {
    const kinds = new Set(conspiracy.map((m) => (m.truth.suicide ? 'suicide' : m.truth.hoax ? 'hoax' : m.truth.murderer)))
    expect([...kinds].sort()).toEqual(['artful', 'careful', 'cunning', 'hoax', 'plain', 'regretful', 'serial', 'suicide'])
    for (const m of conspiracy) {
      if (m.truth.murderer === 'cunning' || m.truth.murderer === 'careful' || m.truth.suicide || m.truth.hoax) {
        expect(m.truth.roles.some((r) => HELPERS.includes(r))).toBe(false)
      }
    }
  })

  it('whatever the kind, the night is solved — and the same seed is the same kind', () => {
    for (const m of nights) expect(m.solution?.culprit).toBe(culpritOf(m))
    const again = generateMystery({ seed: 17, pack: manor1920s, script: CONSPIRACY_SCRIPT })
    expect(again.truth.murderer).toBe(conspiracy[16].truth.murderer)
    expect(again.truth.second ?? null).toEqual(conspiracy[16].truth.second ?? null)
  })
})

describe('the Serial Murderer', () => {
  const serial = nights.filter((m) => m.truth.murderer === 'serial')

  it('kills somebody honest as ten o’clock strikes, in the room where they spent the evening', () => {
    expect(serial.length).toBeGreaterThan(20)
    for (const m of serial) {
      const s = m.truth.second!
      expect(s.round).toBe(2)
      expect(s.victim).not.toBe(culpritOf(m))
      expect(truthClassOf(m.truth.roles[s.victim])).toBe('honest')
      expect(s.room).toBe(m.truth.locations[s.victim])
      expect(s.room).not.toBe(m.truth.sceneRoom)
    }
  })

  it('kills whoever knows something against them, where anybody does', () => {
    let knew = 0
    for (const m of serial) {
      const v = m.truth.second!.victim
      const c = culpritOf(m)
      const told = m.policies[v].knowledge.flatMap((a) => a.claims)
      if (
        told.some(
          (k) =>
            k.kind === 'glimpse' ||
            k.kind === 'culpritAttr' ||
            k.kind === 'among' ||
            (k.kind === 'sighting' && k.target === c) ||
            (k.kind === 'alignment' && k.target === c) ||
            (k.kind === 'relationship' && k.subject === c),
        )
      ) {
        knew++
      }
    }
    expect(knew / serial.length).toBeGreaterThan(0.6)
  })

  it('leaves the body to be seen, not before the hour — and nothing of themselves', () => {
    for (const m of serial) {
      const s = m.truth.second!
      const body = m.evidence.find((e) => e.fact.kind === 'killed')!
      expect(body).toMatchObject({ room: s.room, from: 2, plain: true })
      expect(body.name).toContain(m.cast[s.victim].shortName)
      expect(m.evidence.some((e) => e.fact.kind === 'secondTrace')).toBe(false)
    }
  })

  it('is caught though the dead never said a word after the first', () => {
    for (const m of serial) {
      const v = m.truth.second!.victim
      const heard = [
        ...m.policies[v].reaction.claims.map((claim) => ({ speaker: v, claim })),
        ...allSpoken(m).filter((s) => s.speaker !== v),
      ]
      expect(left(m, heard)).toEqual([culpritOf(m)])
    }
  })

  it('whoever was killed did not do it', () => {
    for (const m of serial) {
      const v = m.truth.second!.victim
      const second = facts(m).filter((f) => f.kind === 'killed')
      const open = left(m, [], second)
      expect(open).not.toContain(v)
      expect(open).toContain(culpritOf(m))
    }
  })

  it('nobody dies on a night without one', () => {
    for (const m of nights) {
      if (m.truth.murderer === 'serial') continue
      expect(m.truth.second ?? null).toBeNull()
      expect(m.evidence.some((e) => e.fact.kind === 'killed' || e.fact.kind === 'secondTrace')).toBe(false)
      expect(m.evidence.every((e) => e.from === undefined)).toBe(true)
    }
  })
})

describe('the Regretful Murderer', () => {
  const regretful = conspiracy.filter((m) => m.truth.murderer === 'regretful')

  it('lies all night like any other, and owns to it at the last', () => {
    expect(regretful.length).toBeGreaterThan(6)
    // Only on a night with a friend in the house, where the Martyr might have stood instead.
    for (const m of regretful) expect(m.truth.roles.some((r) => HELPERS.includes(r))).toBe(true)
    for (const m of regretful) {
      const c = culpritOf(m)
      expect(m.policies[c].confession?.claims).toEqual([{ kind: 'confession' }])
      expect(claimIsTrue({ kind: 'confession' }, c, m.truth, m.cast)).toBe(true)
      const role = m.policies[c].knowledge.flatMap((a) => a.claims).find((k) => k.kind === 'role')
      expect(role).not.toEqual({ kind: 'role', role: 'culprit' })
      // Nothing of it is said before the last.
      expect(allSpoken(m).some((s) => s.claim.kind === 'confession')).toBe(false)
    }
  })

  it('had the means and the motive, and the chance', () => {
    for (const m of regretful) {
      const c = culpritOf(m)
      expect(m.cast[c].means).toContain(m.truth.methodMeans)
      expect(isMotiveGrade(m.truth.relationships[c])).toBe(true)
    }
  })
})

describe('the Careful Murderer', () => {
  const careful = nights.filter((m) => m.truth.murderer === 'careful')
  const claimed = (m: Mystery) => {
    const c = culpritOf(m)
    const where = m.policies[c].alibi.flatMap((a) => a.claims).find((k) => k.kind === 'whereabouts')!
    const role = m.policies[c].knowledge.flatMap((a) => a.claims).find((k) => k.kind === 'role')!
    return { where, role }
  }
  /** Everything said without being pressed. */
  const unpressed = (m: Mystery): Spoken[] =>
    m.policies.flatMap((p, speaker) =>
      [p.reaction, ...p.role, ...p.alibi, ...p.knowledge, p.seen, p.suspect, ...Object.values(p.aboutPerson), ...Object.values(p.aboutEvidence)]
        .flatMap((a) => a.claims)
        .map((claim) => ({ speaker, claim })),
    )

  it('comes on foggy nights and on conspiracies, alone', () => {
    expect(foggy.filter((m) => m.truth.murderer === 'careful').length).toBeGreaterThan(5)
    expect(conspiracy.filter((m) => m.truth.murderer === 'careful').length).toBeGreaterThan(5)
    for (const m of careful) expect(m.truth.roles.some((r) => HELPERS.includes(r))).toBe(false)
  })

  it('says they were alone in a room nobody was in, which holds nothing of anybody', () => {
    for (const m of careful) {
      const { where } = claimed(m)
      expect(where.kind === 'whereabouts' && where.companions).toEqual([])
      const room = where.kind === 'whereabouts' ? where.room : ''
      expect(room).not.toBe(m.truth.sceneRoom)
      expect(m.truth.locations.includes(room), `seed ${m.seed}`).toBe(false)
      expect(m.evidence.some((e) => e.fact.kind === 'trace' && e.fact.room === room)).toBe(false)
    }
  })

  it('claims a part nobody at the table is playing, and nobody else claims it', () => {
    for (const m of careful) {
      const { role } = claimed(m)
      const part = role.kind === 'role' ? role.role : null
      expect(m.truth.roles).not.toContain(part)
      expect(m.truth.drunkBelievedRole).not.toBe(part)
      const others = unpressed(m).filter(
        (s) => s.speaker !== culpritOf(m) && s.claim.kind === 'role' && s.claim.role === part,
      )
      expect(others).toEqual([])
    }
  })

  it('lies about nobody but themselves, and owns to the grudge', () => {
    for (const m of careful) {
      const c = culpritOf(m)
      for (const s of unpressed(m).filter((x) => x.speaker === c)) {
        if (s.claim.kind === 'whereabouts' || s.claim.kind === 'role') continue
        expect(claimIsTrue(s.claim, c, m.truth, m.cast), `seed ${m.seed}: ${JSON.stringify(s.claim)}`).not.toBe(false)
      }
    }
  })

  it('is caught out by no account in the house', () => {
    for (const m of careful) {
      const threads = findContradictions(noted(unpressed(m)), m.evidence, m.caseSheet)
      expect(threads.filter((t) => t.implicated.includes(culpritOf(m))), `seed ${m.seed}`).toEqual([])
    }
  })

  it('is found all the same, by clearing everybody else', () => {
    for (const m of careful) {
      expect(left(m, allSpoken(m))).toEqual([culpritOf(m)])
      expect(m.solution?.culprit).toBe(culpritOf(m))
    }
  })
})

describe('the Martyr', () => {
  const holding = conspiracy.filter((m) => m.truth.roles.includes('martyr'))
  const at = (m: Mystery) => m.truth.roles.indexOf('martyr')

  it('says they did it, in the very words the murderer would use', () => {
    expect(holding.length).toBeGreaterThan(15)
    for (const m of holding) {
      const x = at(m)
      expect(m.policies[x].confession).toEqual({ claims: [{ kind: 'confession' }], lineKey: 'confession' })
      expect(claimIsTrue({ kind: 'confession' }, x, m.truth, m.cast)).toBe(false)
    }
    const c = conspiracy.find((m) => m.truth.murderer === 'regretful')!
    expect(c.policies[culpritOf(c)].confession).toEqual(holding[0].policies[at(holding[0])].confession)
  })

  it('lacked the means, or the motive, or the opportunity — and it can be shown', () => {
    const lacked = new Set<string>()
    for (const m of holding) {
      const x = at(m)
      lacked.add(m.truth.martyrLacks!)
      switch (m.truth.martyrLacks) {
        case 'means':
          expect(m.cast[x].means).not.toContain(m.truth.methodMeans)
          expect(m.evidence.some((e) => e.fact.kind === 'weapon')).toBe(true)
          break
        case 'motive':
          expect(isMotiveGrade(m.truth.relationships[x])).toBe(false)
          expect(
            m.evidence.some(
              (e) =>
                e.fact.kind === 'motiveDocument' &&
                e.fact.subject === x &&
                !isMotiveGrade(e.fact.rel) &&
                e.heldBy === undefined,
            ),
          ).toBe(true)
          break
        case 'opportunity': {
          expect(m.truth.companions[x].length).toBeGreaterThan(0)
          const links = findLinks(noted(allSpoken(m)), m.evidence, m.caseSheet, m.cast)
          expect(links.some((l) => l.reason === 'mutual-alibi' && l.supports.includes(x))).toBe(true)
          break
        }
      }
    }
    expect([...lacked].sort()).toEqual(['means', 'motive', 'opportunity'])
  })

  it('otherwise looks the part: whatever they did not lack, they had', () => {
    for (const m of holding) {
      const x = at(m)
      if (m.truth.martyrLacks !== 'means') expect(m.cast[x].means).toContain(m.truth.methodMeans)
      if (m.truth.martyrLacks !== 'motive') expect(isMotiveGrade(m.truth.relationships[x])).toBe(true)
    }
  })

  it('there is no Martyr on a foggy night, so nobody owns to anything there', () => {
    for (const m of foggy) expect(m.truth.roles).not.toContain('martyr')
  })
})

describe('what is owned to at the last', () => {
  const owned = conspiracy.filter((m) => confessions(m).length > 0)

  it('is sometimes the truth and sometimes not, and sometimes both at once', () => {
    const truly = owned.filter((m) => m.truth.murderer === 'regretful' && !m.truth.roles.includes('martyr'))
    const falsely = owned.filter((m) => m.truth.murderer !== 'regretful')
    const both = owned.filter((m) => confessions(m).length === 2)
    expect(truly.length).toBeGreaterThan(5)
    expect(falsely.length).toBeGreaterThan(5)
    expect(both.length).toBeGreaterThan(0)
    for (const m of both) {
      const threads = findContradictions(noted(confessions(m)), m.evidence, m.caseSheet)
      expect(threads.some((t) => t.reason === 'two-confessions' && t.implicated.length === 2)).toBe(true)
    }
  })

  it('never turns the detective from the murderer', () => {
    for (const m of owned) {
      expect(left(m, [...allSpoken(m), ...confessions(m)])).toEqual([culpritOf(m)])
    }
  })

  it('by itself leaves the one who said it, and — if they may be the Martyr — everybody else', () => {
    for (const m of owned) {
      for (const s of confessions(m)) {
        const open = left(m, [s], [])
        expect(open).toContain(s.speaker)
        expect(open).toContain(culpritOf(m))
      }
    }
  })
})

describe('what they say on such nights', () => {
  it('every manner has words for owning to it, and for a second body', () => {
    for (const key of ['confession', 'evidence.killed', 'lastWords', 'gathered']) {
      for (const manner of TEMPERAMENTS) {
        expect(manor1920s.dialogue[`${key}.${manner}`]?.length ?? 0, `${key}.${manner}`).toBeGreaterThan(0)
      }
    }
    expect(manor1920s.dialogue['claim.confession'].length).toBeGreaterThan(2)
  })

  it('the kinds and the Martyr are named in the case file', () => {
    for (const kind of ['plain', 'serial', 'regretful', 'cunning', 'careful'] as const) {
      expect(manor1920s.murderers?.[kind]?.name).toMatch(/^the /)
      expect(manor1920s.murderers?.[kind]?.does.length).toBeGreaterThan(20)
    }
    expect(manor1920s.roleNames.martyr).toBe('the Martyr')
  })
})

describe('the last thing they said', () => {
  it('names nobody: whoever came in is neither he nor she', () => {
    const keys = Object.keys(manor1920s.dialogue).filter((k) => k.startsWith('lastWords'))
    expect(keys.length).toBeGreaterThan(10)
    for (const key of keys) {
      for (const line of manor1920s.dialogue[key]) {
        expect(line, key).not.toMatch(/\b(he|she|him|her|his|hers)\b/i)
        for (const c of manor1920s.characters) expect(line, key).not.toContain(c.shortName)
      }
    }
  })
})


import { describe, expect, it } from 'vitest'
import { manor1920s } from '../../src/content/manor1920s'
import { findContradictions, type NotedStatement } from '../../src/engine/contradictions'
import { enumerateWorlds } from '../../src/engine/solver/worlds'
import { FOGGY_SCRIPT } from '../../src/engine/deck'
import { allSpoken, generateMystery, motivesOf } from '../../src/engine/generate'
import { renderAnswer, type RenderCtx } from '../../src/engine/render'
import { MOTIVE_GRADE, TEMPERAMENTS, type RoleId } from '../../src/engine/types'
import { splitRoles } from '../../src/ui/roleTags'

const SEEDS = Array.from({ length: 25 }, (_, i) => i + 300)

describe('roles, named and claimed', () => {
  it('every role has a name, an icon and a description', () => {
    const roles = Object.keys(manor1920s.roleNames) as RoleId[]
    expect(roles.length).toBe(26)
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
  const foggy = Array.from({ length: 160 }, (_, i) =>
    generateMystery({ seed: i + 1, pack: manor1920s, script: FOGGY_SCRIPT }),
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

  it('the Red Herring looked in at the scene, was seen, spent the hour elsewhere — and says nothing of it until pressed', () => {
    let herrings = 0
    for (const m of nights) {
      const herring = m.truth.roles.indexOf('redherring')
      if (herring < 0) continue
      herrings++
      const culprit = m.truth.roles.indexOf('culprit')
      // The hour they spent alone, somewhere else — and their room bears them out.
      expect(m.truth.locations[herring]).not.toBe(m.truth.sceneRoom)
      expect(m.truth.companions[herring]).toEqual([])
      expect(
        m.evidence.some(
          (e) => e.fact.kind === 'trace' && e.room === m.truth.locations[herring] && !e.forged,
        ),
        `seed ${m.seed}`,
      ).toBe(true)
      // Asked, they say truly where they were, and claim to be somebody else.
      expect(m.policies[herring].alibi.flatMap((a) => a.claims)).toContainEqual({
        kind: 'whereabouts',
        room: m.truth.locations[herring],
        companions: [],
      })
      const said = m.policies[herring].role.flatMap((a) => a.claims).find((c) => c.kind === 'role')
      expect(said && said.kind === 'role' ? said.role : null).not.toBe('redherring')
      // Somebody honest saw them at the scene: a true sighting, like one of the murderer.
      const seen = m.policies.flatMap((p, speaker) =>
        [...p.knowledge, p.seen]
          .flatMap((a) => a.claims)
          .filter((c) => c.kind === 'sighting' && c.target === herring && c.room === m.truth.sceneRoom)
          .map(() => speaker),
      )
      expect(seen.length, `seed ${m.seed}`).toBeGreaterThan(0)
      expect(seen).not.toContain(herring)
      // Pressed, they own to it: who they are, and where they truly were.
      expect(m.policies[herring].press.kind).toBe('confess')
      expect(m.policies[herring].press.claims).toContainEqual({ kind: 'role', role: 'redherring' })
      expect(m.policies[herring].press.claims).toContainEqual({
        kind: 'whereabouts',
        room: m.truth.locations[herring],
        companions: [],
      })
      // And for all that, the case is still the murderer's.
      const left = enumerateWorlds({
        cast: m.cast,
        caseSheet: m.caseSheet,
        spoken: allSpoken(m),
        evidence: m.evidence.map((e) => e.fact),
      }).culprits
      expect(left).toEqual([culprit])
    }
    expect(herrings).toBeGreaterThan(5)
  })

  it('the murderer sometimes plays the Red Herring when pressed — and the room they name does not bear them out', () => {
    let played = 0
    for (const m of foggy) {
      const culprit = m.truth.roles.indexOf('culprit')
      if (culprit < 0) continue
      const press = m.policies[culprit].press
      if (!press.claims.some((c) => c.kind === 'role' && c.role === 'redherring')) continue
      played++
      expect(press.kind).toBe('confess')
      const where = press.claims.find((c) => c.kind === 'whereabouts')
      expect(where && where.kind === 'whereabouts' ? where.room : null).not.toBe(m.truth.sceneRoom)
      // Never the room a trace of the murderer's own would vouch for.
      expect(
        m.evidence.some(
          (e) =>
            e.fact.kind === 'trace' &&
            where?.kind === 'whereabouts' &&
            e.room === where.room &&
            e.fact.attr.kind === 'trait' &&
            e.fact.attr.trait === m.cast[culprit].trait &&
            !e.forged,
        ),
      ).toBe(false)
    }
    expect(played).toBeGreaterThan(5)
  })
})

describe('the Cunning Murderer’s double bluffs', () => {
  // (Every night with a murderer to be cunning.)
  const nights = Array.from({ length: 160 }, (_, i) =>
    generateMystery({ seed: i + 1, pack: manor1920s, script: FOGGY_SCRIPT }),
  ).filter((m) => !m.truth.suicide)
  it('is the Cunning Murderer’s part, and nobody else’s', () => {
    for (const m of nights) {
      const culprit = m.truth.roles.indexOf('culprit')
      const acts = m.policies[culprit].press.kind === 'confess'
      expect(acts, `seed ${m.seed}`).toBe(m.truth.murderer === 'cunning')
    }
    expect(nights.filter((m) => m.truth.murderer === 'cunning').length).toBeGreaterThan(20)
  })
  const pressClaims = (m: (typeof nights)[number]) => m.policies[m.truth.roles.indexOf('culprit')].press.claims
  const owns = (m: (typeof nights)[number], role: string) =>
    pressClaims(m).some((c) => c.kind === 'role' && c.role === role)

  it('sometimes owns to the theft instead — in a room whose box gives them the lie', () => {
    const acts = nights.filter((m) => owns(m, 'thief'))
    expect(acts.length).toBeGreaterThan(5)
    for (const m of acts) {
      const culprit = m.truth.roles.indexOf('culprit')
      const theft = pressClaims(m).find((c) => c.kind === 'theft')
      expect(theft).toBeDefined()
      const room = theft?.kind === 'theft' ? theft.room : ''
      expect(room).not.toBe(m.truth.sceneRoom)
      // The box in that room is untouched, or the forced one is elsewhere: found, it is proof.
      const tell = m.evidence.find(
        (e) =>
          (e.fact.kind === 'lockboxIntact' && e.fact.room === room) ||
          (e.fact.kind === 'forcedLockbox' && e.fact.room !== room),
      )
      expect(tell, `seed ${m.seed}`).toBeDefined()
      const statements: NotedStatement[] = pressClaims(m).map((claim, i) => ({ id: `p${i}`, speaker: culprit, claim }))
      const cs = findContradictions(statements, m.evidence, m.caseSheet)
      expect(cs.some((c) => c.reason === 'theft-vs-box' && c.proven && c.implicated.includes(culprit))).toBe(true)
      // And with the confession heard, the case is still the murderer's.
      const left = enumerateWorlds({
        cast: m.cast,
        caseSheet: m.caseSheet,
        spoken: [...allSpoken(m), ...pressClaims(m).map((claim) => ({ speaker: culprit, claim }))],
        evidence: m.evidence.map((e) => e.fact),
      }).culprits
      expect(left).toEqual([culprit])
    }
  })

  it('sometimes owns to the blackmail instead — and nobody in the house was bled by them', () => {
    const acts = nights.filter((m) => owns(m, 'blackmailer'))
    expect(acts.length).toBeGreaterThan(5)
    for (const m of acts) {
      const culprit = m.truth.roles.indexOf('culprit')
      for (const s of allSpoken(m)) {
        if (s.claim.kind === 'blackmailed') expect(s.claim.by).not.toBe(culprit)
      }
      const left = enumerateWorlds({
        cast: m.cast,
        caseSheet: m.caseSheet,
        spoken: [...allSpoken(m), ...pressClaims(m).map((claim) => ({ speaker: culprit, claim }))],
        evidence: m.evidence.map((e) => e.fact),
      }).culprits
      expect(left).toEqual([culprit])
    }
  })

  it('the true Thief owns to the theft in the room whose box was forced', () => {
    for (const m of nights) {
      const thief = m.truth.roles.indexOf('thief')
      if (thief < 0) continue
      const theft = m.policies[thief].press.claims.find((c) => c.kind === 'theft')
      expect(theft && theft.kind === 'theft' ? theft.room : null).toBe(m.truth.theftRoom)
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
    expect(papers.length).toBe(38)
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
      for (const manner of TEMPERAMENTS) {
        for (const kind of ['self', 'gossip']) {
          wanted++
          const bank = manor1920s.dialogue[`claim.relationship.${kind}.${rel}.${manner}`] ?? []
          if (bank.length >= 2) voiced++
          for (const line of bank) {
            if (kind === 'gossip') expect(line, line).toMatch(/\{subject(Old|First)?\}/)
            else expect(line, line).not.toMatch(/\{subject(Old|First)?\}/)
            expect(line.replace(/\{\w+\}/g, ''), line).not.toMatch(/\b(daughter|son)\b/i)
          }
        }
      }
    }
    expect(voiced / wanted).toBeGreaterThan(0.9)
    const motives = new Set<string>()
    for (let seed = 1; seed <= 120; seed++) {
      const m = generateMystery({ seed, pack: manor1920s })
      motives.add(m.truth.relationships[m.truth.roles.indexOf('culprit')])
    }
    expect(motives.size).toBe(MOTIVE_GRADE.length)
  })
})

describe('motives fit whoever has them', () => {
  const nights = Array.from({ length: 150 }, (_, i) => generateMystery({ seed: i + 1, pack: manor1920s }))
  const defOf = (id: string) => manor1920s.characters.find((c) => c.id === id)!

  it('every character has a motive they could have, and lists only real ones', () => {
    for (const c of manor1920s.characters) {
      expect(motivesOf(c).length, c.id).toBeGreaterThan(0)
      for (const rel of Object.keys(c.motives ?? {})) expect(MOTIVE_GRADE, c.id).toContain(rel)
    }
    expect(motivesOf(defOf('bootboy'))).not.toContain('jilted')
    expect(motivesOf(defOf('bootboy'))).not.toContain('forbidden')
    expect(motivesOf(defOf('daughter'))).not.toContain('forbidden')
    expect(motivesOf(defOf('son'))).not.toContain('jilted')
  })

  it('nobody is dealt, or accused of, a motive they could not have', () => {
    for (const m of nights) {
      m.cast.forEach((guest) => {
        const rel = m.truth.relationships[guest.id]
        if (MOTIVE_GRADE.includes(rel)) {
          expect(motivesOf(defOf(guest.defId)), `seed ${m.seed}: ${guest.defId}`).toContain(rel)
        }
      })
      for (const { claim } of allSpoken(m)) {
        if (claim.kind !== 'relationship' || !MOTIVE_GRADE.includes(claim.rel)) continue
        const subject = m.cast[claim.subject]
        expect(motivesOf(defOf(subject.defId)), `seed ${m.seed}: said of ${subject.defId}`).toContain(claim.rel)
      }
    }
  })
})

describe('the children of the house', () => {
  it('call him Father, in whatever manner they speak', () => {
    let heard = 0
    for (let seed = 1; seed <= 400 && heard < 12; seed++) {
      const m = generateMystery({ seed, pack: manor1920s })
      const ctx: RenderCtx = { mystery: m, pack: manor1920s }
      for (const guest of m.cast) {
        if (guest.defId !== 'daughter' && guest.defId !== 'son') continue
        const policy = m.policies[guest.id]
        const answers = [policy.reaction, ...policy.knowledge, policy.suspect, ...Object.values(policy.aboutPerson)]
        for (const [i, a] of answers.entries()) {
          const said = renderAnswer(ctx, guest.id, a, `f${i}`)
          expect(said, said).not.toMatch(/his lordship|Lord Blackwood|the dead man|\bfriends\b/i)
          if (/Father/.test(said)) heard++
        }
      }
    }
    expect(heard).toBeGreaterThan(5)
  })

  it('nobody else does', () => {
    const m = generateMystery({ seed: 3, pack: manor1920s })
    const ctx: RenderCtx = { mystery: m, pack: manor1920s }
    for (const guest of m.cast) {
      if (guest.defId === 'daughter' || guest.defId === 'son') continue
      const answers = [...Object.values(m.policies[guest.id].aboutPerson), m.policies[guest.id].suspect]
      for (const [i, a] of answers.entries()) {
        expect(renderAnswer(ctx, guest.id, a, `n${i}`)).not.toMatch(/\bFather\b/)
      }
    }
  })
})

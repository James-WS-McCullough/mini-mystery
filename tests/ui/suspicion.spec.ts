import { describe, expect, it } from 'vitest'
import { TABLE, checkScript } from '../../src/engine/checkScript'
import { SCRIPTS } from '../../src/engine/deck'
import { playersOf, seat, suspicionOf, type Suspicion } from '../../src/ui/suspicion'

const LEVELS: Suspicion[] = ['none', 'some', 'lots']

describe('how suspicious, in words', () => {
  it('reads the four evenings as Some, and seats them as they are', () => {
    for (const s of Object.values(SCRIPTS)) {
      expect(suspicionOf(s), s.id).toBe('some')
      const again = seat(s, playersOf(s), 'some')
      expect([again.innocentCount ?? 4, again.suspiciousCount], s.id).toEqual([s.innocentCount ?? 4, s.suspiciousCount])
    }
  })

  it('at every size of table, None to Lots grows, keeps the table its size, and can be dealt wherever None can', () => {
    for (const s of Object.values(SCRIPTS)) {
      for (let players = TABLE.seated.min; players <= TABLE.seated.max; players++) {
        const counts = LEVELS.map((l) => seat(s, players, l).suspiciousCount)
        expect(counts[0], `${s.id} ${players}`).toBe(s.accomplices.length > 0 ? 1 : 0)
        // (Some is more than None, but for the smallest tables, where any more would leave nobody innocent.)
        // (Nor where the Committee, a majority that must outnumber an ordinary night's liars, squeezes them.)
        if (players > 3 && s.id !== 'web') expect(counts[1]).toBeGreaterThan(counts[0])
        expect(counts[1]).toBeGreaterThanOrEqual(counts[0])
        expect(counts[2]).toBeGreaterThanOrEqual(counts[1])
        for (const l of LEVELS) {
          const t = seat(s, players, l)
          expect(playersOf(t)).toBe(players)
          // (No level asks more of the evening than None does; and where None can be dealt, every level can.)
          const none = checkScript(seat(s, players, 'none'))
          expect(checkScript(t).length, `${s.id}, ${players} players, ${l}`).toBeLessThanOrEqual(none.length)
          if (none.length === 0) expect(checkScript(t), `${s.id}, ${players} players, ${l}`).toEqual([])
          // (And read back as the level it was seated at, where the levels differ.)
          const distinct = counts.indexOf(counts[LEVELS.indexOf(l)]) === LEVELS.indexOf(l) && counts.lastIndexOf(counts[LEVELS.indexOf(l)]) === LEVELS.indexOf(l)
          if (distinct) expect(suspicionOf(t)).toBe(l)
        }
      }
    }
  })

  it('the three evenings without the Committee can be dealt at every size and every level', () => {
    for (const s of [SCRIPTS.simple, SCRIPTS.twist, SCRIPTS.knot]) {
      for (let players = TABLE.seated.min; players <= TABLE.seated.max; players++) {
        for (const l of LEVELS) expect(checkScript(seat(s, players, l)), `${s.id}, ${players}, ${l}`).toEqual([])
      }
    }
  })

  it('Lots is the most a table may have, short of leaving out somebody innocent the evening needs', () => {
    const simple = SCRIPTS.simple
    // (Seven, as on the four evenings: three of them suspicious.)
    expect(seat(simple, 7, 'lots').suspiciousCount).toBe(3)
    // Four at the table could be all suspicious, but the Sweetheart and the Clinger need somebody innocent.
    expect(seat(simple, 4, 'lots').innocentCount).toBe(1)
    const liars = { ...simple, suspicious: simple.suspicious.filter((r) => r !== 'sweetheart' && r !== 'clinger') }
    expect(seat(liars, 4, 'lots').innocentCount).toBe(0)
  })
})

import { describe, expect, it } from 'vitest'
import { PACKS, type PackId } from '../../src/content'
import { SCRIPTS } from '../../src/engine/deck'
import { deathWindow, sayEvening } from '../../src/engine/evening/render'
import { EVICTIM, UPSTAIRS, type EHeard } from '../../src/engine/evening/types'
import { generateMystery } from '../../src/engine/generate'
import { DEALING, deal } from '../deal'

const PACKS_TRIED: PackId[] = ['manor1920s', 'train1926', 'boat1926', 'castle1897', 'wonderland1865', 'bramblewood1812']

describe('the Evening Timeline variant', () => {
  it('leaves the night underneath as the classic one deals it', () => {
    for (const seed of [3, 17, 41]) {
      const pack = PACKS.manor1920s
      const a = generateMystery({ seed, pack, script: SCRIPTS.twist })
      const b = generateMystery({ seed, pack, script: SCRIPTS.twist, variant: 'timeline' })
      expect(a.evening).toBeUndefined()
      expect(b.truth).toEqual(a.truth)
      expect(b.guests).toEqual(a.guests)
      expect(b.policies).toEqual(a.policies)
      expect(b.evidence.filter((e) => e.id !== 'evening-watch')).toEqual(a.evidence)
    }
  })

  it(
    'deals an evening that fits the night, and that pins down the hour',
    async () => {
      const nights = await deal(60, (seed) => {
        const id = PACKS_TRIED[seed % PACKS_TRIED.length]
        const scripts = Object.values(SCRIPTS)
        return { pack: PACKS[id], m: generateMystery({ seed, pack: PACKS[id], script: scripts[seed % scripts.length], variant: 'timeline' }) }
      })
      for (const { pack, m } of nights) {
        const ev = m.evening!
        expect(ev).toBeDefined()
        // The hour it was done is the night's own.
        ev.schedule.forEach((row, c) => expect(row[ev.murder]).toBe(m.truth.locations[c]))
        // Nobody walks into the room where he lies, once it is done.
        const scenes = [m.truth.sceneRoom, m.caseSheet.sceneRoom, m.truth.moved].filter(Boolean)
        for (const row of ev.schedule) for (let s = ev.murder + 1; s < row.length; s++) expect(scenes).not.toContain(row[s])
        // Every hour but that one is told truly, by everybody.
        ev.told.forEach((claims, c) => {
          for (const t of claims) {
            if (t.kind !== 'stay') continue
            for (let s = t.from; s <= t.to; s++) {
              if (s === ev.murder) continue
              expect(t.room).toBe(ev.schedule[c][s])
              if (t.room === UPSTAIRS) expect(t.with).toEqual([])
              else for (const o of t.with) if (o !== EVICTIM) expect(ev.schedule[o][s]).toBe(t.room)
            }
          }
        })
        // Everything said, and the watch if there is one: the hour, exactly.
        const heard: EHeard[] = ev.told.flatMap((cs, speaker) => cs.map((claim, i) => ({ id: speaker * 100 + i, speaker, claim })))
        const w = deathWindow(ev, heard, m.evidence)
        expect(w).toEqual({ lo: ev.murder, hi: ev.murder })
        // And it can all be said.
        const ctx = { mystery: m, pack }
        for (const [c, claims] of ev.told.entries()) for (const t of claims) expect(sayEvening(ctx, c, t)).not.toMatch(/undefined|NaN/)
      }
    },
    DEALING,
  )
})

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { breath, DEALING } from '../deal'
import { fingerprint, type Fingerprint } from './cases'

const record: Fingerprint[] = JSON.parse(readFileSync(new URL('./record.json', import.meta.url), 'utf8'))

describe('the golden record: what is dealt has not changed', () => {
  it(
    'deals every recorded case exactly as before, and the solver makes the same of it',
    async () => {
      expect(record.length).toBeGreaterThan(60)
      for (const was of record) {
        await breath()
        const now = fingerprint(was)
        const at = `${was.script} seed ${was.seed} (${was.summary})`
        expect(now.attempts, at).toEqual(was.attempts)
        expect(now.summary, at).toBe(was.summary)
        expect(now.mystery, at).toBe(was.mystery)
        expect(now.worlds, at).toBe(was.worlds)
      }
    },
    DEALING,
  )
})

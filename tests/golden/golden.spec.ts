import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { breath, DEALING } from '../deal'
import { fingerprint, type Fingerprint } from './cases'
import { playSession, type SessionPrint } from './session'

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

const sessions: SessionPrint[] = JSON.parse(readFileSync(new URL('./sessions.json', import.meta.url), 'utf8'))

describe('the golden record of play: a night played the same way shows the same', () => {
  it(
    'every step of every recorded session shows just what it did',
    async () => {
      expect(sessions.length).toBeGreaterThan(20)
      for (const was of sessions) {
        await breath()
        const now = playSession(was)
        const at = `${was.pack ?? 'manor1920s'} ${was.script} seed ${was.seed}${was.small ? ' (small)' : ''}`
        expect(now.steps, at).toEqual(was.steps)
        const first = now.prints.findIndex((p, i) => p !== was.prints[i])
        expect(first, `${at}: first differs at step ${first} (${was.steps[first]})`).toBe(-1)
      }
    },
    DEALING,
  )
})

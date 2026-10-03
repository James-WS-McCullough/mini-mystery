// Rewrite the golden records (tests/golden/*.json): only after a change that
// is MEANT to alter what is dealt, or how a night plays.  npx tsx scripts/golden.ts
import { writeFileSync } from 'node:fs'
import { fingerprint, goldenCases } from '../tests/golden/cases'
import { playSession, sessionCases } from '../tests/golden/session'

const record = goldenCases().map(fingerprint)
writeFileSync(new URL('../tests/golden/record.json', import.meta.url), JSON.stringify(record, null, 1) + '\n')
console.log(`${record.length} cases written`)
const sessions = sessionCases().map(playSession)
writeFileSync(new URL('../tests/golden/sessions.json', import.meta.url), JSON.stringify(sessions, null, 1) + '\n')
console.log(`${sessions.length} sessions written (${sessions.reduce((n, s) => n + s.steps.length, 0)} steps)`)

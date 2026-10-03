// Rewrite the golden record (tests/golden/record.json): only after a change
// that is MEANT to alter what is dealt.  npx tsx scripts/golden.ts
import { writeFileSync } from 'node:fs'
import { fingerprint, goldenCases } from '../tests/golden/cases'

const record = goldenCases().map(fingerprint)
writeFileSync(new URL('../tests/golden/record.json', import.meta.url), JSON.stringify(record, null, 1) + '\n')
console.log(`${record.length} cases written`)

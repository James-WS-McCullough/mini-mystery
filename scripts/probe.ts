// Generation tuning probe: how many attempts does each deck shape need, and
// which gate rejects them?
//   npx tsx scripts/probe.ts [seeds] [herring1,herring2]

import { manor1920s } from '../src/content/manor1920s'
import { CLASSIC_SCRIPT, type Script } from '../src/engine/deck'
import { generateMystery, type GenFailure } from '../src/engine/generate'
import type { RoleId } from '../src/engine/types'

const count = Number(process.argv[2] ?? 100)
const forced = process.argv[3]?.split(',') as RoleId[] | undefined
const script: Script = forced
  ? { ...CLASSIC_SCRIPT, id: 'probe', herrings: forced }
  : CLASSIC_SCRIPT

const failures = new Map<GenFailure, number>()
let attemptsTotal = 0
let worst = 0
const attemptCounts: number[] = []

for (let seed = 1; seed <= count; seed++) {
  let attempts = 0
  generateMystery({
    seed,
    pack: manor1920s,
    script,
    onAttempt: (failure) => {
      attempts++
      failures.set(failure, (failures.get(failure) ?? 0) + 1)
    },
  })
  attemptsTotal += attempts
  worst = Math.max(worst, attempts)
  attemptCounts.push(attempts)
}

attemptCounts.sort((a, b) => a - b)
console.log(`${count} seeds, herrings=${forced?.join('+') ?? 'script draw'}`)
console.log(
  `attempts: avg ${(attemptsTotal / count).toFixed(1)}, median ${attemptCounts[Math.floor(count / 2)]}, p90 ${attemptCounts[Math.floor(count * 0.9)]}, worst ${worst}`,
)
console.log(
  'failure reasons:',
  Object.fromEntries([...failures.entries()].sort((a, b) => b[1] - a[1])),
)

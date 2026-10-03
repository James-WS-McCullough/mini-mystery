// How hard each difficulty is to deal: attempts per case, time per case, and
// why attempts were thrown away.
//   npx tsx scripts/gen-rates.ts [cases per difficulty, default 40] [first seed, default 1]

import { manor1920s } from '../src/content/manor1920s'
import { KNOT_SCRIPT, SIMPLE_SCRIPT, TWIST_SCRIPT, WEB_SCRIPT } from '../src/engine/deck'
import { generateMystery } from '../src/engine/generate'

const count = Number(process.argv[2] ?? 40)
const first = Number(process.argv[3] ?? 1)
const modes = [
  ['A Simple Case', SIMPLE_SCRIPT],
  ['With a Twist', TWIST_SCRIPT],
  ['A Knot of Lies', KNOT_SCRIPT],
  ['The Tangled Web', WEB_SCRIPT],
] as const

for (const [name, script] of modes) {
  const attempts: number[] = []
  const reasons = new Map<string, number>()
  let ms = 0
  for (let seed = first; seed < first + count; seed++) {
    let n = 0
    const t = Date.now()
    generateMystery({
      seed,
      pack: manor1920s,
      script,
      onAttempt: (why) => {
        n++
        reasons.set(why, (reasons.get(why) ?? 0) + 1)
      },
    })
    ms += Date.now() - t
    attempts.push(n)
  }
  attempts.sort((a, b) => a - b)
  const mean = attempts.reduce((a, b) => a + b, 0) / count
  const top = [...reasons].sort((a, b) => b[1] - a[1]).slice(0, 5)
  console.log(
    `${name.padEnd(16)} retries/case ${mean.toFixed(1).padStart(5)}  median ${String(attempts[count >> 1]).padStart(3)}  worst ${String(attempts[count - 1]).padStart(3)}  ${String(Math.round(ms / count)).padStart(5)} ms/case   ${top.map(([r, k]) => `${r} ${k}`).join(', ')}`,
  )
}

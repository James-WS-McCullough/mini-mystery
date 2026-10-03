// Deal random Custom evenings that checkScript passes, and report any that
// cannot be dealt after all: a hole in checkScript (or in the dealing).
//   npx tsx scripts/fuzz-scripts.ts [seed words, default 'custom evenings'] [how many to try, default 400]
import { manor1920s } from '../src/content/manor1920s'
import { checkScript } from '../src/engine/checkScript'
import { WEB_SCRIPT, type Script } from '../src/engine/deck'
import { generateMystery } from '../src/engine/generate'
import { Rng } from '../src/engine/rng'
import type { NightKind } from '../src/engine/types'
const rng = new Rng(process.argv[2] ?? 'custom evenings')
const NIGHTS: NightKind[] = ['plain', 'serial', 'cunning', 'careful', 'regretful', 'artful', 'suicide', 'hoax', 'committee']
const fails = new Map<string, number>()
let dealt = 0
for (let i = 0; i < Number(process.argv[3] ?? 400); i++) {
  const keep = <T>(xs: readonly T[], p: number) => xs.filter(() => rng.chance(p))
  const custom: Script = {
    id: 'custom',
    innocents: keep(WEB_SCRIPT.innocents, 0.75),
    suspicious: keep(WEB_SCRIPT.suspicious, 0.7),
    accomplices: rng.chance(0.5) ? keep(WEB_SCRIPT.accomplices, 0.6) : [],
    accompliceChance: rng.pick([0.5, 1]),
    suspiciousCount: rng.pick([1, 2, 2, 3]),
    innocentCount: rng.pick([2, 3, 4, 4]),
    passage: rng.chance(0.5),
    lockedRoom: rng.pick([0, 0.4]),
    nights: Object.fromEntries(keep(NIGHTS, 0.5).map((k) => [k, rng.pick([1, 2, 3])])),
  }
  if (checkScript(custom).length > 0) continue
  for (const seed of [1, 2]) {
    try {
      generateMystery({ seed, pack: manor1920s, script: custom })
    } catch (e) {
      const where = String((e as Error).stack).split('\n').slice(0, 4).join(' | ').replace(/file:\/\/[^)]*src\//g, '')
      const key = where.slice(0, 220)
      if (!fails.has(key)) console.log('FAIL', JSON.stringify(custom), seed, '\n  ', key)
      fails.set(key, (fails.get(key) ?? 0) + 1)
    }
  }
  dealt++
}
console.log('dealt', dealt, 'distinct failures', fails.size, [...fails.values()])

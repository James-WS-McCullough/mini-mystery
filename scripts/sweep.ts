// Big-seed sweep with timing: how fast is generation, and does any seed fail?
//   npx tsx scripts/sweep.ts [count]

import { manor1920s } from '../src/content/manor1920s'
import { FOGGY_SCRIPT } from '../src/engine/deck'
import { generateMystery } from '../src/engine/generate'

const count = Number(process.argv[2] ?? 1000)
const script = process.argv[3] === 'foggy' ? FOGGY_SCRIPT : undefined
const start = performance.now()
let questionsTotal = 0
let searchesTotal = 0
let worstQ = 0
const roleCulpritCounts = new Map<string, number>()

const herringCounts = new Map<string, number>()
for (let seed = 1; seed <= count; seed++) {
  const m = generateMystery({ seed, pack: manor1920s, script })
  const q = m.solution!.questionsUsed
  questionsTotal += q
  searchesTotal += m.solution!.searchesUsed
  worstQ = Math.max(worstQ, q)
  const culpritDef = m.cast[m.truth.roles.indexOf('culprit')].defId
  roleCulpritCounts.set(culpritDef, (roleCulpritCounts.get(culpritDef) ?? 0) + 1)
  for (const r of m.config.deck) {
    if (['thief', 'begrudged', 'loner', 'drunk'].includes(r)) {
      herringCounts.set(r, (herringCounts.get(r) ?? 0) + 1)
    }
  }
}

const ms = performance.now() - start
console.log(`${count} seeds in ${(ms / 1000).toFixed(1)}s (${(ms / count).toFixed(1)}ms/mystery)`)
console.log(`avg questions ${(questionsTotal / count).toFixed(1)} (worst ${worstQ}), avg searches ${(searchesTotal / count).toFixed(1)}`)
console.log('culprit distribution:', Object.fromEntries([...roleCulpritCounts.entries()].sort()))
console.log('herring distribution:', Object.fromEntries([...herringCounts.entries()].sort()))

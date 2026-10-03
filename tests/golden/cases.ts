// The golden record: for a fixed set of cases, a fingerprint of everything
// the generator deals (and the solver makes of it). A refactor that is meant
// to change nothing must leave every fingerprint as it was.
//   Rewrite after a change that is MEANT to alter the cases:
//   npx tsx scripts/golden.ts

import { createHash } from 'node:crypto'
import { manor1920s } from '../../src/content/manor1920s'
import {
  KNOT_SCRIPT,
  SIMPLE_SCRIPT,
  TWIST_SCRIPT,
  WEB_SCRIPT,
  smallScript,
  type Script,
} from '../../src/engine/deck'
import { allSpoken, generateMystery } from '../../src/engine/generate'
import { enumerateWorlds } from '../../src/engine/solver/worlds'
import type { NightKind } from '../../src/engine/types'
import { seedsOf } from '../deal'
import { renamed } from './rename'

export interface GoldenCase {
  script: string
  seed: number
}

export interface Fingerprint extends GoldenCase {
  /** Why each attempt before the one kept was thrown away, in order. */
  attempts: string[]
  /** Readable, for a failing comparison. */
  summary: string
  /** The whole case dealt. */
  mystery: string
  /** Every world the solver allows, given everything; and given the first half of what is said. */
  worlds: string
}

const SCRIPTS: Record<string, Script> = {
  simple: SIMPLE_SCRIPT,
  small: smallScript(SIMPLE_SCRIPT),
  twist: TWIST_SCRIPT,
  knot: KNOT_SCRIPT,
  web: WEB_SCRIPT,
}

/** The cases kept: a run of seeds on each script, and a few of every kind of night. */
export function goldenCases(): GoldenCase[] {
  const out: GoldenCase[] = []
  const run = (script: string, count: number) => {
    for (let seed = 1; seed <= count; seed++) out.push({ script, seed })
  }
  run('simple', 12)
  run('small', 4)
  run('twist', 10)
  run('knot', 10)
  run('web', 10)
  const kinds: [string, NightKind][] = [
    ['twist', 'serial'],
    ['twist', 'cunning'],
    ['twist', 'careful'],
    ['knot', 'regretful'],
    ['web', 'artful'],
    ['web', 'suicide'],
    ['web', 'hoax'],
    ['web', 'committee'],
  ]
  for (const [script, kind] of kinds) {
    for (const seed of seedsOf(SCRIPTS[script], kind, 3)) {
      if (!out.some((c) => c.script === script && c.seed === seed)) out.push({ script, seed })
    }
  }
  return out
}

const stable = (value: unknown): string => JSON.stringify(renamed(value))
const hash = (value: unknown) => createHash('sha256').update(stable(value)).digest('hex').slice(0, 16)

export function fingerprint(c: GoldenCase): Fingerprint {
  const attempts: string[] = []
  const m = generateMystery({ seed: c.seed, pack: manor1920s, script: SCRIPTS[c.script], onAttempt: (why) => attempts.push(why) })
  const spoken = allSpoken(m)
  const evidence = m.evidence.map((e) => e.fact)
  const searched = manor1920s.rooms.map((r) => r.id)
  const full = enumerateWorlds({ cast: m.cast, caseSheet: m.caseSheet, spoken, evidence, searched }, { all: true })
  const half = enumerateWorlds(
    { cast: m.cast, caseSheet: m.caseSheet, spoken: spoken.slice(0, spoken.length >> 1), evidence: evidence.slice(0, evidence.length >> 1) },
    { all: true },
  )
  return {
    ...c,
    attempts,
    summary: `${m.truth.murderer ?? (m.truth.suicide ? 'suicide' : m.truth.hoax ? 'hoax' : '?')}: ${m.truth.roles.join(',')}`,
    mystery: hash(m),
    worlds: hash([full, half]),
  }
}

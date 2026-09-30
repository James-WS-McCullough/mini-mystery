// Debug dump: the whole truth of a seed, plus the solver's view.
//   npm run mystery -- <seed>

import { manor1920s } from '../src/content/manor1920s'
import { claimIsTrue } from '../src/engine/claims'
import { findContradictions } from '../src/engine/contradictions'
import { allSpoken, generateMystery } from '../src/engine/generate'
import { enumerateWorlds } from '../src/engine/solver/worlds'
import type { Claim, Mystery } from '../src/engine/types'

const seed = Number(process.argv[2] ?? 1)
const mystery = generateMystery({ seed, pack: manor1920s })

function describeClaim(claim: Claim, m: Mystery): string {
  const name = (c: number) => m.cast[c].shortName
  switch (claim.kind) {
    case 'role':
      return `claims role: ${claim.role}`
    case 'whereabouts':
      return `was in ${claim.room}${claim.companions.length ? ` with ${claim.companions.map(name).join(', ')}` : ', alone'}`
    case 'sighting':
      return `saw ${name(claim.target)} in ${claim.room}`
    case 'glimpse':
      return `glimpsed someone (${claim.attr.kind === 'trait' ? claim.attr.trait : claim.attr.sex}) near ${claim.room}`
    case 'culpritAttr':
      return `culprit is ${claim.attr.kind === 'trait' ? claim.attr.trait : claim.attr.sex}`
    case 'liarsAmong':
      return `${claim.count} of ${claim.pair.map(name).join(' and ')} lie about where they were`
    case 'blackmailed':
      return `blackmailed by ${name(claim.by)}`
    case 'bribed':
      return `paid by ${name(claim.by)} to say nothing`
    case 'toldBy':
      return `was told it by ${name(claim.by)}`
    case 'passage':
      return `a passage runs to ${claim.room}`
    case 'confession':
      return 'confesses to the murder'
    case 'passing':
      return `passed ${name(claim.target)} coming from the scene`
    case 'silent':
      return 'has nothing to tell'
    case 'among':
      return `culprit is one of ${claim.suspects.map(name).join(', ')}`
    case 'earlier':
      return `saw ${name(claim.target)} in ${claim.room}, before the window`
    case 'theft':
      return `forced the box in ${claim.room}`
    case 'alignment':
      return `${name(claim.target)} is ${claim.alignment}`
    case 'relationship':
      return `${name(claim.subject)} ↔ victim: ${claim.rel}`
    case 'heard':
      return `heard/saw ${claim.sound} at ${claim.room}`
    case 'trust':
      return `feels sure of ${name(claim.target)}`
    case 'suspicion':
      return `suspects ${name(claim.target)}`
  }
}

console.log(`\n=== Mystery seed ${seed} — ${manor1920s.title} ===`)
console.log(`Victim: ${mystery.caseSheet.victimName}, found in ${mystery.caseSheet.sceneRoom}`)
console.log(`Window: ${mystery.caseSheet.windowLabel}`)
console.log(`Deck:   ${mystery.config.deck.join(', ')}\n`)

console.log('--- Cast (the hidden truth) ---')
for (const m of mystery.cast) {
  const t = mystery.truth
  console.log(
    `#${m.id} ${m.name.padEnd(28)} ${String(t.roles[m.id]).padEnd(10)} ${m.strategy.padEnd(9)} ${m.temperament.padEnd(9)} ${m.trait.padEnd(10)} in ${t.locations[m.id]}${t.companions[m.id].length ? ` (with ${t.companions[m.id].map((c) => mystery.cast[c].shortName).join(', ')})` : ''}  rel:${t.relationships[m.id]}`,
  )
}

console.log('\n--- Evidence ---')
for (const e of mystery.evidence) {
  console.log(`[${e.room}] ${e.name}  (${e.fact.kind})`)
}

console.log('\n--- Everything obtainable (lies marked) ---')
const spoken = allSpoken(mystery)
for (const s of spoken) {
  const truthy = claimIsTrue(s.claim, s.speaker, mystery.truth, mystery.cast)
  const mark = truthy === false ? ' ✗LIE' : truthy === null ? '  (op)' : ''
  console.log(`${mystery.cast[s.speaker].shortName.padEnd(18)} ${describeClaim(s.claim, mystery)}${mark}`)
}

const statements = spoken.map((s, i) => ({ id: `s${i}`, speaker: s.speaker, claim: s.claim }))
const contradictions = findContradictions(statements, mystery.evidence, mystery.caseSheet)
console.log(`\n--- Contradictions discoverable: ${contradictions.length} ---`)
for (const c of contradictions) {
  console.log(
    `${c.reason}${c.proven ? ' (PROVEN)' : ''}: implicates ${c.implicated.map((i) => mystery.cast[i].shortName).join(', ')}`,
  )
}

const worlds = enumerateWorlds({
  cast: mystery.cast,
  caseSheet: mystery.caseSheet,
  spoken,
  evidence: mystery.evidence.map((e) => e.fact),
})
console.log(`\nWorlds: ${worlds.worlds.length}/${worlds.total} consistent; culprit candidates: ${worlds.culprits.map((c) => mystery.cast[c].shortName).join(', ')}`)

console.log('\n--- The intended path (rule-solver trace) ---')
for (const step of mystery.solution?.steps ?? []) {
  console.log(`[${step.action}] ${step.detail}`)
}
console.log(
  `\nSolved with ${mystery.solution?.questionsUsed} questions and ${mystery.solution?.searchesUsed} searches (budget ${mystery.config.rounds * mystery.config.questionsPerRound}q/${mystery.config.rounds}s).`,
)

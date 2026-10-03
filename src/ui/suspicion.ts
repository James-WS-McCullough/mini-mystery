// How suspicious an evening of the detective's own is, in words: None, Some
// or Lots. The builder never says how many; this says, by table size and by
// what the rest of the evening needs (see checkScript).

import { checkScript, mostSuspicious } from '../engine/checkScript'
import type { Script } from '../engine/deck'

export type Suspicion = 'none' | 'some' | 'lots'

export const SUSPICION: readonly { id: Suspicion; word: string; hint: string }[] = [
  { id: 'none', word: 'None', hint: 'Nobody but the murderer has anything to hide.' },
  { id: 'some', word: 'Some', hint: 'A few with something of their own to hide.' },
  { id: 'lots', word: 'Lots', hint: 'As many as the table will bear.' },
]

/** The accomplice's seat, kept wherever there are accomplices on the script. */
const helperSeat = (script: Script) => (script.accomplices.length > 0 ? 1 : 0)

/** The script with so many seated, so many of them suspicious (an accomplice's seat among them). */
const seated = (script: Script, players: number, suspicious: number): Script => ({
  ...script,
  suspiciousCount: suspicious,
  innocentCount: players - 1 - suspicious,
})

/** How many of the table are suspicious, an accomplice's seat among them, at each level. */
function suspiciousAt(script: Script, players: number): Record<Suspicion, number> {
  const helper = helperSeat(script)
  const most = mostSuspicious(players)
  /** As many as asked, or fewer, down to `least`, till the evening is no worse off than with `least`. */
  const atMost = (wanted: number, least: number) => {
    const asBad = checkScript(seated(script, players, least)).length
    let n = Math.max(least, wanted)
    while (n > least && checkScript(seated(script, players, n)).length > asBad) n--
    return n
  }
  // Some: about a third of the rest, as on the four evenings (two of seven), one at least beside any accomplice;
  // Lots: as many as the table may have. Each short of leaving out somebody innocent the evening needs.
  const some = atMost(Math.min(most, Math.max(helper + 1, Math.round((players - 1) / 3))), helper)
  const lots = atMost(most, some)
  return { none: helper, some, lots }
}

/** The script with this many at the table, as suspicious as asked. */
export function seat(script: Script, players: number, level: Suspicion): Script {
  return seated(script, players, suspiciousAt(script, players)[level])
}

/** How many sit down, the murderer among them. */
export const playersOf = (script: Script) => 1 + script.suspiciousCount + (script.innocentCount ?? 4)

/** How suspicious a script's table is, in words: the nearest level to what it has. */
export function suspicionOf(script: Script): Suspicion {
  const at = suspiciousAt(script, playersOf(script))
  if (script.suspiciousCount <= at.none) return 'none'
  return script.suspiciousCount >= at.lots && at.lots > at.some ? 'lots' : 'some'
}

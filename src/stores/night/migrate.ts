// Saves and case records written before the parts and the evenings were
// renamed (2026-10): their old names, put right as they are read.

import type { RoleId } from '../../engine/types'
import type { CaseRecord } from '../../ui/profile'
import type { SaveGame, ScriptId } from './shared'

/** The evenings' old names. (The Conspiracy is no evening now, and its nights cannot be played again.) */
const OLD_SCRIPTS: Record<string, ScriptId | null> = {
  classic: 'simple',
  foggy: 'twist',
  both: 'knot',
  conspiracy: null,
}
/** The parts' old names. */
const OLD_ROLES: Record<string, RoleId> = { culprit: 'murderer', alibi: 'companion', oracle: 'observer' }

const scriptOf = (id: string): ScriptId | null => (id in OLD_SCRIPTS ? OLD_SCRIPTS[id] : (id as ScriptId))
const roleOf = <T extends string>(id: T): T => ((OLD_ROLES[id] as T | undefined) ?? id)

/** A save as it is now; or null, where the night it holds can no longer be played. */
export function migrateSave(save: SaveGame): SaveGame | null {
  const script = scriptOf(save.script)
  if (!script) return null
  return {
    ...save,
    script,
    actions: save.actions.map((a) => (a.t === 'role' && a.to !== null ? { ...a, to: roleOf(a.to) } : a)),
  }
}

/** A case record as it is now. (A Conspiracy is filed under the Knot of Lies, which took its place.) */
export function migrateCase(r: CaseRecord): CaseRecord {
  return { ...r, script: scriptOf(r.script) ?? 'knot' }
}

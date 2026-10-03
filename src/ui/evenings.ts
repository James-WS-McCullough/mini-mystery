// Evenings of the detective's own setting (a Custom script, named), kept in
// this browser and nowhere else. Read once; every change is written back at once.

import { ref } from 'vue'
import type { Script } from '../engine/deck'
import { ROLES } from '../engine/roles'
import type { NightKind, RoleId } from '../engine/types'
import { readJson, writeJson } from './storage'

const KEY = 'mini-mystery:evenings'

export interface SavedEvening {
  id: string
  name: string
  script: Script
  /** ISO time of the last save: the most lately saved are listed first. */
  saved: string
}

/** The kinds of night a script may weigh, in the order the builder lists them. */
export const NIGHT_KINDS: readonly NightKind[] = [
  'plain',
  'serial',
  'cunning',
  'careful',
  'regretful',
  'artful',
  'committee',
  'suicide',
  'hoax',
]

/**
 * A script as read back from storage, made safe: parts that no longer exist
 * are dropped, and kinds of night the game no longer knows. (What is left may
 * still not be dealable; the builder says why.)
 */
function sound(script: Script): Script {
  const known = (rs: unknown): RoleId[] => (Array.isArray(rs) ? rs.filter((r): r is RoleId => r in ROLES) : [])
  const nights = Object.fromEntries(
    Object.entries(script.nights ?? { plain: 1 }).filter(
      ([k, w]) => NIGHT_KINDS.includes(k as NightKind) && typeof w === 'number',
    ),
  )
  return {
    ...script,
    id: 'custom',
    innocents: known(script.innocents),
    suspicious: known(script.suspicious),
    accomplices: known(script.accomplices),
    nights,
  }
}

function load(): SavedEvening[] {
  const raw = readJson<unknown>(KEY, [])
  if (!Array.isArray(raw)) return []
  return raw
    .filter((e): e is SavedEvening => !!e && typeof e === 'object' && typeof e.id === 'string' && !!e.script)
    .map((e) => ({ ...e, name: String(e.name ?? 'An evening'), script: sound(e.script) }))
}

/** The detective's own evenings, the most lately saved first. */
export const evenings = ref<SavedEvening[]>(load())

function write(next: SavedEvening[]): void {
  evenings.value = [...next].sort((a, b) => b.saved.localeCompare(a.saved))
  writeJson(KEY, evenings.value)
}

/** Keep an evening: a new one (no id), or over the one with this id. Returns its id. */
export function saveEvening(name: string, script: Script, id?: string): string {
  const kept: SavedEvening = {
    id: id ?? `e${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`,
    name: name.trim() || 'An evening',
    script: { ...script, id: 'custom' },
    saved: new Date().toISOString(),
  }
  write([...evenings.value.filter((e) => e.id !== kept.id), kept])
  return kept.id
}

export function deleteEvening(id: string): void {
  write(evenings.value.filter((e) => e.id !== id))
}

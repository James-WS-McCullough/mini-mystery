// The night in progress, kept between visits.

import type { SaveGame } from '../stores/game'
import { readJson, remove, writeJson } from './storage'

const KEY = 'mini-mystery:save'

export function loadSave(): SaveGame | null {
  const save = readJson<SaveGame | null>(KEY, null)
  return save && save.v === 1 && Array.isArray(save.actions) ? save : null
}

export function writeSave(save: SaveGame | null): void {
  if (save) writeJson(KEY, save)
  else remove(KEY)
}

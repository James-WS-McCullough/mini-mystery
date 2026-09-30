// Every setting the game can be played in. A setting is a pack: its rooms and
// the shapes its plan may take, its people, its victim, its weather, and the
// words its household use. The engine knows none of them by name.

import type { SettingPack } from './schema'
import { manor1920s } from './manor1920s'

export type PackId = 'manor1920s'

export const PACKS: Record<PackId, SettingPack> = { manor1920s }

export const DEFAULT_PACK: PackId = 'manor1920s'

export function packOf(id: string | undefined | null): SettingPack {
  return (id && (PACKS as Record<string, SettingPack>)[id]) || PACKS[DEFAULT_PACK]
}

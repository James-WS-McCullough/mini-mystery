// Every setting the game can be played in. A setting is a pack: its rooms and
// the shapes its plan may take, its people, its victim, its weather, and the
// words its household use. The engine knows none of them by name.

import type { SettingPack } from './schema'
import { boat1926 } from './boat1926'
import { college1927 } from './college1927'
import { hotel1928 } from './hotel1928'
import { manor1920s } from './manor1920s'
import { train1926 } from './train1926'
import { village1926 } from './village1926'

export type PackId = 'manor1920s' | 'village1926' | 'train1926' | 'boat1926' | 'hotel1928' | 'college1927'

export const PACKS: Record<PackId, SettingPack> = { manor1920s, village1926, train1926, boat1926, hotel1928, college1927 }

/** The settings, in the order the title offers them. */
export const PACK_IDS: readonly PackId[] = ['manor1920s', 'village1926', 'train1926', 'boat1926', 'hotel1928', 'college1927']

export const DEFAULT_PACK: PackId = 'manor1920s'

export function packOf(id: string | undefined | null): SettingPack {
  return (id && (PACKS as Record<string, SettingPack>)[id]) || PACKS[DEFAULT_PACK]
}

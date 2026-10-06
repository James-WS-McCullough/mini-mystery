// Every setting the game can be played in. A setting is a pack: its rooms and
// the shapes its plan may take, its people, its victim, its weather, and the
// words its household use. The engine knows none of them by name.

import type { SettingPack } from './schema'
import { boat1926 } from './boat1926'
import { college1927 } from './college1927'
import { hotel1928 } from './hotel1928'
import { theatre1929 } from './theatre1929'
import { yard1928 } from './yard1928'
import { manor1920s } from './manor1920s'
import { train1926 } from './train1926'
import { village1926 } from './village1926'
import { wonderland1865 } from './wonderland1865'
import { castle1897 } from './castle1897'

export type PackId =
  | 'manor1920s' | 'village1926' | 'train1926' | 'boat1926' | 'hotel1928' | 'college1927' | 'theatre1929' | 'yard1928'
  // (The extra cases' settings, from stories everybody knows: played from the campaign page, not offered on the title's list.)
  | 'wonderland1865' | 'castle1897'

export const PACKS: Record<PackId, SettingPack> = {
  manor1920s, village1926, train1926, boat1926, hotel1928, college1927, theatre1929, yard1928, wonderland1865, castle1897,
}

/** The settings, in the order the title offers them (the extra cases' settings are not among them). */
export const PACK_IDS: readonly PackId[] = ['manor1920s', 'village1926', 'train1926', 'boat1926', 'hotel1928', 'college1927', 'theatre1929', 'yard1928']

export const DEFAULT_PACK: PackId = 'manor1920s'

export function packOf(id: string | undefined | null): SettingPack {
  return (id && (PACKS as Record<string, SettingPack>)[id]) || PACKS[DEFAULT_PACK]
}

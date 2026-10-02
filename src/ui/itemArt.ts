// Which drawing, and which colour of frame, an exhibit takes.

import type { ItemKind, SettingPack, SilhouetteLayer } from '../content/schema'
import type { CharId, EvidenceItem } from '../engine/types'

export interface ItemLook {
  kind: ItemKind
  /** What the colour of the frame stands for, in words. */
  label: string
  tint: string
  layers: SilhouetteLayer[]
}

const LABELS: Record<ItemKind, string> = {
  weapon: 'the murder weapon',
  trace: 'a trace somebody left',
  lockbox: 'proof of a theft',
  document: 'a motive, in writing',
  sign: 'somebody has been at work here',
  passage: 'a way through the walls',
  flavor: 'of no account',
}

const FALLBACK_TINTS: Record<ItemKind, string> = {
  weapon: '#b9443b',
  trace: '#d98a36',
  lockbox: '#8d66bd',
  document: '#3f82b8',
  sign: '#3f9a78',
  passage: '#2f8f9a',
  flavor: '#6c787f',
}

export const ITEM_KINDS: readonly ItemKind[] = ['weapon', 'trace', 'lockbox', 'document', 'sign', 'passage', 'flavor']

export function kindLabel(kind: ItemKind): string {
  return LABELS[kind]
}

export function tintOf(kind: ItemKind, pack: SettingPack): string {
  return pack.itemArt?.tints[kind] ?? FALLBACK_TINTS[kind]
}

/**
 * Nothing here looks at who the exhibit points to, or whether it is a true
 * one: a forged trace is drawn exactly as a real one is.
 */
/**
 * Whom an exhibit names: whose standing a letter proves, whose name is on the
 * money, who was found dead. A trace names nobody — only what they are like.
 */
export function namedBy(item: EvidenceItem): CharId | undefined {
  const f = item.fact
  if (f.kind === 'motiveDocument') return f.subject
  if (f.kind === 'bribe') return f.to
  if (f.kind === 'killed') return f.victim
  return undefined
}

export function lookOf(item: EvidenceItem, pack: SettingPack): ItemLook {
  const art = pack.itemArt
  let kind: ItemKind
  let key: string
  let label: string | undefined
  switch (item.fact.kind) {
    case 'weapon': {
      const means = item.fact.means
      kind = 'weapon'
      key = `weapon.${item.fact.method ?? pack.methods.find((m) => m.means === means)?.id ?? ''}`
      break
    }
    case 'trace':
      kind = 'trace'
      key = item.fact.attr.kind === 'trait' ? `trace.${item.fact.attr.trait}` : 'misc'
      break
    case 'forcedLockbox':
      kind = 'lockbox'
      key = 'lockbox'
      break
    case 'lockboxIntact':
      kind = 'lockbox'
      key = art?.glyphs['lockbox.intact'] ? 'lockbox.intact' : 'lockbox'
      label = 'no theft here'
      break
    case 'sceneCleared':
      kind = 'sign'
      key = 'bare'
      break
    case 'bribe':
      kind = 'sign'
      key = 'bribe'
      break
    case 'passage':
      kind = 'passage'
      key = 'passage'
      break
    case 'killed':
      kind = 'weapon'
      key = 'body'
      label = 'a second killing'
      break
    case 'secondTrace':
      kind = 'weapon'
      key = item.fact.attr.kind === 'trait' ? `trace.${item.fact.attr.trait}` : 'footprint'
      label = 'left by the murderer'
      break
    case 'motiveDocument':
      kind = 'document'
      key = art?.documents[item.name] ?? `doc.${item.fact.rel}`
      break
    case 'key':
      kind = 'sign'
      key = 'key'
      label = 'a key'
      break
    case 'suicideNote':
      kind = 'document'
      key = 'doc.note'
      label = 'a note'
      break
    case 'handSample':
      kind = 'document'
      key = 'doc.letter'
      label = 'in his own hand'
      break
    case 'flavor':
      kind = 'flavor'
      key = art?.flavor[item.name] ?? 'misc'
      break
  }
  return {
    kind,
    label: label ?? LABELS[kind],
    tint: tintOf(kind, pack),
    layers: art?.glyphs[key] ?? art?.glyphs.misc ?? [],
  }
}

// Role names, picked out of running text. A role's name is a proper name —
// "the Witness" — so wherever one is spoken or written it can be shown as a
// tag with its icon, and the eye finds it.

import type { SettingPack } from '../content/schema'
import type { RoleId } from '../engine/types'

export interface Segment {
  text: string
  /** Set when this stretch of the text is a role's name. */
  role?: RoleId
  /** Where the segment starts in the whole text. */
  at: number
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** "the Witness" also matches "The Witness", at the head of a sentence. */
function pattern(name: string): string {
  const first = name[0]
  const head =
    first.toLowerCase() !== first.toUpperCase()
      ? `[${first.toLowerCase()}${first.toUpperCase()}]`
      : escape(first)
  return head + escape(name.slice(1))
}

export function splitRoles(text: string, pack: SettingPack): Segment[] {
  const names = (Object.entries(pack.roleNames) as [RoleId, string][]).filter(([, n]) => n)
  if (names.length === 0) return [{ text, at: 0 }]
  const finder = new RegExp(`(?<![\\p{L}])(${names.map(([, n]) => pattern(n)).join('|')})(?![\\p{L}])`, 'gu')
  const out: Segment[] = []
  let from = 0
  for (const m of text.matchAll(finder)) {
    const at = m.index ?? 0
    const role = names.find(([, n]) => n.toLowerCase() === m[0].toLowerCase())?.[0]
    if (!role) continue
    if (at > from) out.push({ text: text.slice(from, at), at: from })
    out.push({ text: m[0], role, at })
    from = at + m[0].length
  }
  if (from < text.length) out.push({ text: text.slice(from), at: from })
  return out
}

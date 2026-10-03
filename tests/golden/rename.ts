// Names as the golden records know them. While a rename is under way, the
// record is written on the old code with the new names put in: the renamed
// code must then reproduce it exactly. (Empty when no rename is under way.)

const ROLES: Record<string, string> = { culprit: 'murderer', alibi: 'companion', oracle: 'observer' }
const SCRIPTS: Record<string, string> = { classic: 'simple', foggy: 'twist', both: 'knot', web: 'web' }
/** Keys whose values (or whose arrays' values) are parts. */
const ROLE_KEYS = new Set(['roles', 'deck', 'role', 'innocents', 'herrings', 'helpers', 'drunkBelievedRole', 'to'])

export function renamed(value: unknown, key = ''): unknown {
  if (Array.isArray(value)) return value.map((v) => renamed(v, key))
  if (value instanceof Map) return { map: [...value.entries()].map(([k, v]) => [k, renamed(v, '')]) }
  if (value instanceof Set) return { set: [...value].sort() }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, renamed(v, k)]))
  }
  if (typeof value === 'string') {
    if (ROLE_KEYS.has(key) && value in ROLES) return ROLES[value]
    if (key === 'script' && value in SCRIPTS) return SCRIPTS[value]
  }
  return value
}

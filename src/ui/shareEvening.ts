// An evening of the detective's own, sent to somebody else as a link. The
// link carries the whole of the evening (its name and its script; never a
// setting or a case number) in a few dozen letters after "#evening=", short
// enough to read off a screen as a QR code. Nothing is kept anywhere but in
// the link itself.
//
// The code: `1.<name>.<innocents>.<suspicious>.<accomplices>.<nights>.<numbers>`
//  - parts: one letter each, its place in SHARE_ROLES (base64url letters)
//  - nights: one letter each, the weight of each kind in SHARE_NIGHTS (base 36)
//  - numbers: a letter and a number for each that is set: s suspicious, i
//    innocent guests, q questions, l locked room (in hundredths), c accomplice
//    chance (hundredths), p passage, h help hidden about the place (1 or 0)

import type { Script } from '../engine/deck'
import type { NightKind, RoleId } from '../engine/types'
import { soundScript } from './evenings'

const VERSION = '1'

/**
 * Every part, in the order the links number them. ONLY EVER ADD TO THE END:
 * moving or taking one out changes what every link already sent says.
 */
export const SHARE_ROLES: readonly RoleId[] = [
  'murderer', 'witness', 'observer', 'confidant', 'gossip', 'sleuth', 'steward', 'collector',
  'architect', 'discoverer', 'companion', 'thief', 'begrudged', 'loner', 'redherring', 'blackmailer',
  'amnesiac', 'sweetheart', 'perjurer', 'forger', 'framer', 'cleaner', 'whisperer', 'sponsor',
  'martyr', 'arsonist', 'drunk', 'hoaxer', 'committee', 'porter', 'spinster', 'clinger',
]

/** The kinds of night, in the order the links give their weights. ONLY EVER ADD TO THE END. */
export const SHARE_NIGHTS: readonly NightKind[] = [
  'plain', 'serial', 'cunning', 'careful', 'regretful', 'artful', 'committee', 'suicide', 'hoax',
]

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

/** An evening as a link carries it. */
export interface SharedEvening {
  name: string
  script: Script
  /** Parts or kinds of night the link names that this copy of the game does not know (a newer copy made it). */
  unknown: number
}

const parts = (roles: readonly RoleId[]) =>
  roles.map((r) => SHARE_ROLES.indexOf(r)).filter((i) => i >= 0 && i < LETTERS.length).map((i) => LETTERS[i]).join('')

/** The name, made safe to sit in a link: nothing a chat app might take for the end of it, and no full stops. */
const nameCode = (name: string) =>
  encodeURIComponent(name.trim().slice(0, 40))
    .replace(/[.!~*'()]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%20/g, '+')

/** What an evening is, without its name: the same for two evenings that deal alike. */
function recipe(script: Script): string[] {
  const nights = script.nights ?? { plain: 1 }
  const weights = SHARE_NIGHTS.map((k) => Math.max(0, Math.min(35, Math.round(nights[k] ?? 0))).toString(36)).join('')
  const numbers: [string, number | boolean | undefined][] = [
    ['s', script.suspiciousCount],
    ['i', script.innocentCount],
    ['q', script.questionsPerRound],
    ['l', script.lockedRoom === undefined ? undefined : Math.round(script.lockedRoom * 100)],
    ['c', script.accompliceChance === undefined ? undefined : Math.round(script.accompliceChance * 100)],
    ['p', script.passage],
    ['h', script.lifelines],
  ]
  const said = numbers
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}${typeof v === 'boolean' ? (v ? 1 : 0) : Math.max(0, Math.round(v as number))}`)
    .join('')
  return [parts(script.innocents), parts(script.suspicious), parts(script.accomplices), weights.replace(/0+$/, ''), said]
}

export function encodeEvening(name: string, script: Script): string {
  return [VERSION, nameCode(name), ...recipe(script)].join('.')
}

/** Whether two scripts deal alike: the same parts (in whatever order), weights and numbers. */
export function sameRecipe(a: Script, b: Script): boolean {
  const key = (s: Script) => recipe(s).map((x, i) => (i < 3 ? [...x].sort().join('') : x)).join('.')
  return key(a) === key(b)
}

/** An evening read back from its code; or null, where the code cannot be read at all. */
export function decodeEvening(code: string): SharedEvening | null {
  const at = code.split('.')
  if (at.length < 7 || at[0] !== VERSION) return null
  const [, rawName, inn, sus, acc, weights, numbers] = at
  let name: string
  try {
    name = decodeURIComponent(rawName.replace(/\+/g, ' ')).trim()
  } catch {
    return null
  }
  if ([inn, sus, acc].some((p) => /[^A-Za-z0-9_-]/.test(p)) || /[^0-9a-z]/.test(weights) || !/^([a-z]\d+)*$/.test(numbers)) return null

  let unknown = 0
  const roles = (p: string): RoleId[] =>
    [...p].flatMap((ch) => {
      const r = SHARE_ROLES[LETTERS.indexOf(ch)]
      if (!r) unknown++
      return r ? [r] : []
    })
  const nights: Partial<Record<NightKind, number>> = {}
  ;[...weights].forEach((ch, i) => {
    const w = parseInt(ch, 36)
    const kind = SHARE_NIGHTS[i]
    if (!kind) {
      if (w > 0) unknown++
    } else if (w > 0) nights[kind] = w
  })
  const said = new Map([...numbers.matchAll(/([a-z])(\d+)/g)].map((m) => [m[1], Number(m[2])]))
  if (!said.has('s')) return null

  const script: Script = {
    id: 'custom',
    innocents: roles(inn),
    suspicious: roles(sus),
    accomplices: roles(acc),
    suspiciousCount: said.get('s')!,
    nights,
  }
  if (said.has('i')) script.innocentCount = said.get('i')
  if (said.has('q')) script.questionsPerRound = said.get('q')
  if (said.has('l')) script.lockedRoom = said.get('l')! / 100
  if (said.has('c')) script.accompliceChance = said.get('c')! / 100
  if (said.has('p')) script.passage = said.get('p') === 1
  if (said.has('h')) script.lifelines = said.get('h') === 1
  return { name: name || 'An evening', script: soundScript(script), unknown }
}

const HASH = '#evening='

/** The link that brings this evening to whoever opens it: this copy of the game, with the evening after it. */
export function shareLink(name: string, script: Script): string {
  const here = typeof location === 'undefined' ? 'https://james-ws-mccullough.github.io/mini-mystery/' : `${location.origin}${location.pathname}`
  return `${here}${HASH}${encodeEvening(name, script)}`
}

/** An evening sent to the detective, as opened; or a link to one that could not be read. */
export type Invitation = SharedEvening | { unreadable: true }

/**
 * An evening the page was opened with, if it was: taken out of the address
 * as it is read, so that going back to the page does not offer it again.
 */
export function takeInvitation(): Invitation | null {
  if (typeof location === 'undefined' || !location.hash.startsWith(HASH)) return null
  const code = location.hash.slice(HASH.length)
  history.replaceState(history.state, '', `${location.pathname}${location.search}`)
  return decodeEvening(code) ?? { unreadable: true }
}

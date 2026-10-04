// What an anonymous note says, as it is written: a few words in capitals.

import { roomName } from '../engine/render'
import type { NoteHint, useGame } from '../stores/game'

type Game = ReturnType<typeof useGame>

/**
 * How a note would name a guest: "PEMBERTON", "THE MAJOR" — but "MISS
 * BLACKWOOD" in full, where the bare surname would be the dead man's.
 */
function named(shortName: string, victimSurname: string): string {
  const bare = shortName.replace(/^(Mr|Mrs|Miss|Dr|Lady|Sir|Lord|Madame|Mme|Nanny|Captain|Colonel)\.?\s+/, '')
  return (bare.toLowerCase() === victimSurname.toLowerCase() ? shortName : bare).toUpperCase()
}

export function noteText(game: Game, hint: NoteHint): string {
  if (!game.ctx || !game.mystery) return ''
  if (hint.kind === 'room') return roomName(game.ctx, hint.room).replace(/^the /i, '').toUpperCase()
  if (hint.kind === 'none') return 'TRUST NO ONE.'
  const who = named(game.mystery.cast[hint.char].shortName, game.mystery.victim.lastName)
  if (hint.q === 'role') return `WHAT IS ${who}’S ROLE?`
  if (hint.q === 'alibi') return `WHERE WAS ${who}?`
  return `WHAT DID ${who} SEE?`
}

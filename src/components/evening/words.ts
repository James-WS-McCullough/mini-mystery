// The words the Evening Timeline's screens share: who, and where.

import { roomName } from '../../engine/render'
import { EVICTIM, UPSTAIRS, type EPlace } from '../../engine/evening/types'
import { useGame } from '../../stores/game'

export function useEveningWords() {
  const game = useGame()
  const name = (c: number) => (c === EVICTIM ? (game.mystery?.victim.shortName ?? '') : (game.mystery?.cast[c]?.shortName ?? ''))
  /** "library", "own room": short enough for a bar. */
  function short(room: EPlace): string {
    if (room === UPSTAIRS) return 'own room'
    return game.ctx ? roomName(game.ctx, room).replace(/^the /i, '') : room
  }
  /** A guest's voice, for the typewriter. */
  const voiceOf = (c: number) => game.pack.characters.find((d) => d.id === game.mystery?.cast[c]?.defId)?.voice
  return { name, short, voiceOf }
}

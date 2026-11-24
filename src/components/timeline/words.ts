// The words every Evening Timeline screen shares: who, where, and him or her.

import { computed } from 'vue'
import { roomName } from '../../engine/timeline/render'
import { VICTIM, type Place } from '../../engine/timeline/types'
import { useTimeline } from '../../stores/timeline'

export function useTimelineWords() {
  const tl = useTimeline()
  const him = computed(() => (tl.tc?.victimPronouns === 'she' ? 'her' : tl.tc?.victimPronouns === 'they' ? 'them' : 'him'))
  const name = (c: number) => (c === VICTIM ? (tl.tc?.victimShort ?? '') : (tl.tc?.cast[c]?.shortName ?? ''))
  /** "library", "the Major's room": short enough for a bar. */
  function short(room: Place, speaker?: number): string {
    const t = tl.tc!
    const r = t.rooms.find((x) => x.id === room)
    if (r?.bed !== undefined) return r.bed === speaker ? 'own room' : `${t.cast[r.bed].shortName}’s room`
    return roomName(t, room).replace(/^the /i, '')
  }
  /** A guest's voice, for the typewriter. */
  const voiceOf = (c: number) => tl.pack.characters.find((d) => d.id === tl.tc?.cast[c]?.defId)?.voice
  return { him, name, short, voiceOf }
}

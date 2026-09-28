// Notebook entries, exhibits and drawn threads, turned into cards for the table.

import { describeClaim, describeEvidence, roomName } from '../engine/render'
import type { EvidenceItem } from '../engine/types'
import type { NoteEntry, RealizedThread, useGame } from '../stores/game'
import type { CardData } from '../components/NoteCard.vue'

type Game = ReturnType<typeof useGame>

function flagOf(game: Game, id: string): CardData['flag'] {
  const f = game.realizedFlags.get(id)
  if (!f) return null
  return f === 'contradiction' ? 'realized' : f
}

export function noteCard(game: Game, n: NoteEntry): CardData {
  const who = game.mystery!.cast[n.speaker]
  return {
    id: n.id,
    kind: 'note',
    speaker: who.shortName,
    speakerDefId: who.defId,
    main: game.ctx ? describeClaim(game.ctx, n.speaker, n.claim) : '',
    prov: `${n.source}, ${game.hourOf(n.round)}`,
    flag: flagOf(game, n.id),
  }
}

export function evidenceCard(game: Game, e: EvidenceItem): CardData {
  return {
    id: e.id,
    kind: 'evidence',
    main: e.name,
    prov: game.ctx
      ? `found in ${roomName(game.ctx, e.room)} · ${describeEvidence(game.ctx, e)}`
      : '',
    flag: flagOf(game, e.id),
  }
}

export function threadCard(game: Game, t: RealizedThread): CardData {
  return {
    id: t.key,
    kind: 'thread',
    threadType: t.type,
    main: t.itemLabels[0],
    pair: t.itemLabels[1],
    prov: `drawn at ${game.hourOf(t.round)}`,
  }
}

/** Any note or exhibit by its id. */
export function cardById(game: Game, id: string): CardData | null {
  const note = game.notebook.find((n) => n.id === id)
  if (note) return noteCard(game, note)
  const item = game.foundItems.find((e) => e.id === id)
  return item ? evidenceCard(game, item) : null
}

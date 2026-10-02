// Notebook entries, exhibits and drawn threads, turned into cards for the table.

import { describeClaim, describeEvidence, inRoom } from '../engine/render'
import type { CharId, Claim, EvidenceItem } from '../engine/types'
import type { NoteEntry, RealizedThread, useGame } from '../stores/game'
import type { CardData } from '../components/NoteCard.vue'
import { namedBy } from './itemArt'

type Game = ReturnType<typeof useGame>

function flagOf(game: Game, id: string): CardData['flag'] {
  const f = game.realizedFlags.get(id)
  if (!f) return null
  return f === 'contradiction' ? 'realized' : f
}

/** Whom a note is about, besides whoever said it: the one it points at, or vouches for. */
function aboutOf(claim: Claim, speaker: CharId): CharId[] {
  switch (claim.kind) {
    case 'relationship':
      return claim.subject === speaker ? [] : [claim.subject]
    case 'sighting':
    case 'passing':
    case 'earlier':
    case 'alignment':
    case 'suspicion':
    case 'trust':
      return [claim.target]
    case 'blackmailed':
    case 'bribed':
    case 'toldBy':
      return [claim.by]
    case 'whereabouts':
      return claim.companions
    case 'liarsAmong':
      return [...claim.pair]
    case 'among':
      return claim.suspects
    default:
      return []
  }
}

export function noteCard(game: Game, n: NoteEntry): CardData {
  const who = game.mystery!.cast[n.speaker]
  const about = aboutOf(n.claim, n.speaker)
    .filter((c) => c !== n.speaker)
    .map((c) => ({ name: game.mystery!.cast[c].shortName, defId: game.mystery!.cast[c].defId }))
  return {
    about: about.length ? about : undefined,
    id: n.id,
    kind: 'note',
    speaker: who.shortName,
    speakerDefId: who.defId,
    main: game.ctx ? describeClaim(game.ctx, n.speaker, n.claim) : '',
    prov: `${n.source}, ${game.hourOf(n.round)}`,
    flag: flagOf(game, n.id),
    lie: game.retracted.has(n.id),
  }
}

export function evidenceCard(game: Game, e: EvidenceItem): CardData {
  return {
    id: e.id,
    kind: 'evidence',
    main: e.name,
    named: ((id) => (id === undefined ? undefined : game.mystery!.cast[id].shortName))(namedBy(e)),
    prov: game.ctx
      ? `${e.came ?? `found ${inRoom(game.ctx, e.room)}`} · ${describeEvidence(game.ctx, e)}`
      : '',
    flag: flagOf(game, e.id),
    // The note beside him, shown by Sergeant Pike to be in another hand.
    lie: e.fact.kind === 'suicideNote' && game.noteForged,
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

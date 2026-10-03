// One part of the night store (see stores/game.ts).

import { DEFAULT_PACK, packOf } from '../../content'
import type { PackId } from '../../content'
import { Interrogation } from '../../engine/interrogate'
import type { CharId, ItemId, Mystery, RoomId } from '../../engine/types'
import type { Pillars, Verdict } from '../../engine/verdict'
import { computed, ref, shallowRef } from 'vue'
import { DEDUCE_MISSES } from './shared'
import type { DeduceResult, LifelineReport, LogEntry, NoteEntry, OpeningStatement, Phase, RealizedThread, RoleMark, SaveAction, ScriptId, Stage, UsedLifeline } from './shared'

/** The night as it stands: every ref the store keeps. */
export function nightState() {
  const phase = ref<Phase>('title')
  const stage = ref<Stage>('transition')
  const mystery = shallowRef<Mystery | null>(null)
  const interrogation = shallowRef<Interrogation | null>(null)

  const round = ref(0)
  const transitionToMidnight = ref(false)
  const questionsLeft = ref(0)
  const searchedRooms = ref<RoomId[]>([])
  const lastSearchRoom = ref<RoomId | null>(null)
  /** The hour in which a second room was searched, after a first that held nothing. */
  const searchedAgainIn = ref<number | null>(null)
  /** The last answer that gave nothing, and so cost no question: its line in the log. */
  const freeLineId = ref<number | null>(null)
  const lastSearchText = ref('')
  const lastSearchItemIds = ref<ItemId[]>([])
  const foundItemIds = ref<ItemId[]>([])
  /** Lifelines come upon in the rooms, and those used. */
  const foundLifelineIds = ref<string[]>([])
  const usedLifelines = ref<Record<string, UsedLifeline>>({})
  const lastSearchLifelineIds = ref<string[]>([])
  /** Where Sergeant Pike has gone to search, and in which hour he was sent. */
  const pikeOrder = ref<{ room: RoomId; round: number } | null>(null)
  const lifelineReport = shallowRef<LifelineReport | null>(null)
  const notebook = ref<NoteEntry[]>([])
  const log = ref<LogEntry[]>([])
  const openingStatements = ref<OpeningStatement[]>([])
  const activeChar = ref<CharId | null>(null)
  const notebookOpen = ref(false)
  const verdict = ref<Verdict | null>(null)
  const accusedId = ref<CharId | null>(null)
  /** "It was more than one": whom the detective has named together. */
  const together = ref<CharId[]>([])
  const citedNoteIds = ref<string[]>([])
  const citedItemIds = ref<ItemId[]>([])
  const citedThreadKeys = ref<string[]>([])
  const introText = ref('')
  const accusationForced = ref(false)
  /** What each of them said when the household was called together at the last. */
  const gathering = ref<{ char: CharId; text: string }[]>([])
  /** They have been called together, and have yet to be heard. */
  const gatheringPending = ref(false)
  /** Who stood up and owned to it when the household was gathered, and in what words. */
  const confessions = ref<{ char: CharId; text: string }[]>([])
  /** They are still on their feet: the detective has yet to hear them out. */
  const confessionsPending = ref(false)
  /** The second killing, once it has been done: what the hour brought with it. */
  const killing = ref<{ victim: CharId; room: RoomId; fresh: boolean; lastWords: string } | null>(null)
  /** Whoever the murderer has silenced. There is no asking them anything more. */
  const dead = computed<CharId | null>(() => killing.value?.victim ?? null)
  const realized = ref<RealizedThread[]>([])
  const confessedChars = ref<CharId[]>([])
  const deduceSelection = ref<string[]>([])
  const missesLeft = ref(DEDUCE_MISSES)
  /**
   * The notes laid out at midnight, from the accusation: two clues only now
   * seen to disagree may still be pinned as a contradiction. Nobody is left
   * to put it to.
   */
  const deduceAtMidnight = ref(false)
  const lastDeduceResult = ref<DeduceResult | null>(null)
  /** The last thing handed to the detective, and by whom. */
  const lastGift = ref<{ from: CharId; item: ItemId } | null>(null)
  /** Guests the DETECTIVE has struck off. The game never does it for them. */
  const ruledOut = ref<CharId[]>([])
  /**
   * Means, motive and opportunity against each guest, as the DETECTIVE has
   * marked them. The game never marks them: what a clue means for somebody is
   * the detective's own judgement, and may be wrong.
   */
  const signs = ref<Record<number, Pillars>>({})
  /**
   * Who the detective takes each guest to be, where that is not simply who
   * they say they are. Theirs to write, and to get wrong.
   */
  const roleMarks = ref<Record<number, RoleMark>>({})
  /** How many times each question has been put to each guest: `<char>|<question>`. */
  const asked = ref<Record<string, number>>({})
  const script = ref<ScriptId>('simple')
  /** Which setting the night is played in. */
  const packId = ref<PackId>(DEFAULT_PACK)
  const pack = computed(() => packOf(packId.value))
  /** The place, in its own words: 'the house', 'the household', 'the plan of the house'. */
  const place = computed(() => pack.value.place)
  const daily = ref<string | null>(null)
  /** Whether tonight hides lifelines: an easier night. */
  const lifelinesOn = ref(true)
  /** Whether tonight is the small household (a trial). */
  const smallOn = ref(false)
  const actions = ref<SaveAction[]>([])
  const questionsAsked = ref(0)
  const wrongGuesses = ref(0)
  /**
   * Plain counts and flags of the night, shared by every part of the store:
   * whether the confessions have been heard, whether midnight's misses have
   * been reset, and the running numbers that key the log and salt the lines.
   */
  const tally = { confessionsHeard: false, midnightMisses: false, logSeq: 0, saltSeq: 0 }
  const seenClaims = new Set<string>()
  const realizedKeys = new Set<string>()
  return {
    phase, stage, mystery, interrogation, round, transitionToMidnight, questionsLeft, searchedRooms,
    lastSearchRoom, searchedAgainIn, freeLineId, lastSearchText, lastSearchItemIds, foundItemIds,
    foundLifelineIds, usedLifelines, lastSearchLifelineIds, pikeOrder, lifelineReport, notebook, log,
    openingStatements, activeChar, notebookOpen, verdict, accusedId, together, citedNoteIds, citedItemIds,
    citedThreadKeys, introText, accusationForced, gathering, gatheringPending, confessions,
    confessionsPending, killing, dead, realized, confessedChars, deduceSelection, missesLeft,
    deduceAtMidnight, lastDeduceResult, lastGift, ruledOut, signs, roleMarks, asked, script, packId, pack,
    place, daily, lifelinesOn, smallOn, actions, questionsAsked, wrongGuesses, tally, seenClaims,
    realizedKeys,
  }
}

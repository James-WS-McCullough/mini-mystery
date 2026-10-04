// The first case: three guests, and Sergeant Pike at the detective's elbow.
// He welcomes them to the division, has them read the case file, explains the
// hours and the scene, the weapon and the means, has them ask the one guest
// the weapon clears, catches the first contradiction with them and has them
// put it to whoever is caught; and once the Thief has owned to it he stays
// at their elbow to the end: the two that are cleared, the one left standing,
// the motive they already know, the account of the hour that breaks, and the
// case made on the board. He does not let the first case be lost.

import type { CharId } from '../engine/types'
import type { PillarState } from '../engine/verdict'
import { meansDue, type Tutorial, type TutorLocks, type TutorStep, type TutorView } from './tutorial'

/** The guest the weapon clears: whoever lacked the means for it (the first case has one). */
function cleared(v: TutorView): CharId | null {
  const due = meansDue(v)
  if (!due) return null
  for (const [c, mark] of due) if (mark === 'ruledOut') return c
  return null
}
/** Whom the sergeant knows did it, and who the Thief is: he has read the file, and he does not let the first case be lost. */
const murderer = (v: TutorView) => v.mystery.truth.roles.indexOf('murderer')
const thief = (v: TutorView) => v.mystery.truth.roles.indexOf('thief')

/** Whether every means mark says what the sheets say. */
function meansRight(v: TutorView): boolean {
  const due = meansDue(v)
  return !!due && v.cast.every((c) => v.signsOf(c.id).means === due.get(c.id))
}

/** The names of those whose means mark is set, and set wrong. */
function meansWrong(v: TutorView): string[] {
  const due = meansDue(v)
  if (!due) return []
  return v.cast
    .filter((c) => v.signsOf(c.id).means !== 'unknown' && v.signsOf(c.id).means !== due.get(c.id))
    .map((c) => c.shortName)
}

const pressed = (v: TutorView) => v.cast.some((c) => v.asked(c.id, 'press'))
/** The Thief has owned to it. */
const thiefOwned = (v: TutorView) => v.confessed.includes(thief(v))
const name = (v: TutorView, c: CharId | null) => (c === null ? 'the one the weapon clears' : v.cast[c].shortName)
/** "A, B and C". */
const list = (names: string[]) =>
  names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : (names[0] ?? '')
const all = (s: { means: PillarState; motive: PillarState; opportunity: PillarState }) =>
  s.means === 'established' && s.motive === 'established' && s.opportunity === 'established'
/** The two who are not the murderer, struck off the list. */
const othersStruck = (v: TutorView) => v.cast.every((c) => c.id === murderer(v) || v.struck.includes(c.id))
/** All three counts marked against the murderer, and the other two struck off: the case is made. */
const caseMade = (v: TutorView) => all(v.signsOf(murderer(v))) && othersStruck(v)

/** The lockbox the Thief owns to forcing: the room, and whether it has been found forced. */
const boxRoom = (v: TutorView) => v.mystery.truth.locations[thief(v)]
const boxFound = (v: TutorView) =>
  v.mystery.evidence.some((e) => e.fact.kind === 'forcedLockbox' && e.room === boxRoom(v) && v.found.includes(e.id))
const roomName = (v: TutorView, id: string) => v.pack.rooms.find((r) => r.id === id)?.name ?? id
/** Somebody honest has put the Thief where the box was forced: his word is no longer only his own. */
const vouched = (v: TutorView) => v.links.some((l) => l.reason === 'vouched' && l.supports.includes(thief(v)))

/**
 * What he keeps saying at the foot, from the Thief's confession to the
 * accusation: the next thing wanted, and what glows for it. Nothing is left
 * to chance on the first case.
 */
function guide(v: TutorView): { text: string; lit: string[] } {
  const m = murderer(v)
  const t = thief(v)
  const c = cleared(v)
  const next = (): { text: string; lit: string[] } => {
    if (v.signsOf(t).opportunity !== 'ruledOut') {
      return {
        text: `${name(v, t)} was at the lockbox at the very time of it, by their own confession. Rule opportunity out for them.`,
        lit: ['sign:opportunity'],
      }
    }
    if (c !== null && v.signsOf(c).opportunity !== 'ruledOut') {
      return {
        text: `${name(v, c)}’s account of the hour is the truth: you ruled them out. Rule opportunity out for them too.`,
        lit: ['sign:opportunity'],
      }
    }
    if (!othersStruck(v)) {
      const left = v.cast.filter((g) => g.id !== m && !v.struck.includes(g.id)).map((g) => g.shortName)
      return {
        text: `${left.length > 1 ? `Neither ${left.join(' nor ')}` : left[0]} could have done it. Strike them off the list with Rule out, and see who is left standing.`,
        lit: ['strike'],
      }
    }
    if (v.signsOf(m).motive !== 'established') {
      return {
        text: `You know ${name(v, m)}’s motive already: ${name(v, c)} told you who stood to gain by his death. Look in your notebook, and mark motive against them.`,
        lit: ['sign:motive'],
      }
    }
    // A new hour's search: a hunch, where the Thief says the box was forced; after that, nothing the rooms can add.
    if (v.stage === 'search') {
      return v.searched.includes(boxRoom(v))
        ? { text: 'Nothing more you need from the rooms tonight, {sir}. Forgo the search, and on to the questioning.', lit: ['skip'] }
        : {
            text: `On a hunch, {sir}: search ${roomName(v, boxRoom(v))}, where ${name(v, t)} says they forced the box. If the room bears the confession out, so much the better.`,
            lit: [`room:${boxRoom(v)}`],
          }
    }
    if (v.stage === 'searched') return { text: 'On to the questioning, {sir}.', lit: ['onward'] }
    if (v.undrawn > 0) {
      return { text: 'Two of your notes cannot both be true, {sir}. Compare notes, and lay them side by side.', lit: ['compare', 'test'] }
    }
    // (Not the one the weapon clears: their word is trusted, and the contradiction is the other's.)
    const unput = v.pressable.filter((id) => id !== c && !v.asked(id, 'press'))
    if (unput.length > 0) {
      return { text: `A contradiction stands against ${list(unput.map((id) => name(v, id)))}. Put it to them.`, lit: ['confront', 'q:press'] }
    }
    if (v.signsOf(m).opportunity !== 'established') {
      const caught = v.pressable.includes(m) || v.asked(m, 'press')
      return caught
        ? { text: `${name(v, m)}’s account of the hour will not hold. Mark opportunity against them.`, lit: ['sign:opportunity'] }
        : {
            text: `Nobody speaks for ${name(v, m)}. Ask them their role, and set what they say beside what you know.`,
            lit: [`guest:${m}`, 'q:knowledge'],
          }
    }
    return { text: 'Means, motive and opportunity against the one name left standing.', lit: [] }
  }
  const r = next()
  // What is wanted takes a question, and the hour has none left: the next hour brings more.
  if (v.stage === 'question' && v.questionsLeft === 0 && r.lit.some((l) => l.startsWith('q:'))) {
    return {
      text: 'No questions left this hour, {sir}. Let the hour strike: every new hour brings five more, and a fresh room to search.',
      lit: ['hour'],
    }
  }
  return r
}

/** What the board still wants, once on the accusation screen. */
function board(v: TutorView): { text: string; lit: string[] } {
  const m = murderer(v)
  if (v.accused !== m) return { text: `Name ${name(v, m)}, {sir}: the one left standing.`, lit: [`name:${m}`] }
  const s = v.shown(m)
  const want: string[] = []
  if (s.motive !== 'established') want.push(`For motive, pin what ${name(v, cleared(v))} told you they stood to gain.`)
  if (s.opportunity !== 'established') want.push('For opportunity, pin the contradiction you drew against their account of the hour.')
  if (want.length === 0) return { text: 'The board shows all three. Point the finger, {sir}.', lit: ['submit'] }
  return { text: want.join(' '), lit: ['board'] }
}

const STEPS: TutorStep[] = [
  {
    id: 'welcome',
    when: (v) => v.phase === 'intro',
    lines: () => [
      'Welcome to the division, {sir}. Sergeant Pike. I’m to show you the ropes, and there’s no time like the present: a case came in an hour ago, and the Chief Inspector has put your name on it.',
      'Three guests were in {house} tonight, and one of them is a murderer. The case file is in front of you. Read it through, and when you’re ready, summon {household}.',
      'They will each say their piece before you begin. Mark what they say: every word of it goes down in your notebook, and a lie told now is a lie you may catch later.',
    ],
    task: () => 'Read the case file, then summon {household}.',
    until: (v) => v.phase !== 'intro',
    lit: () => ['summon'],
  },
  {
    id: 'hours',
    when: (v) => v.phase === 'play' && v.stage === 'search' && v.round === 0,
    lines: () => [
      'Eight o’clock, {sir}. The night runs by the hour, eight till midnight, and at the top of each hour you may search one room before you put your questions. There’s no second search, so choose well.',
      'Tonight, start where the body lies: {scene}, marked in red on the plan. The scene will tell you how it was done.',
    ],
    task: () => 'Search {scene}.',
    until: (v) => v.searched.includes(v.mystery.caseSheet.sceneRoom),
    lit: (v) => [`room:${v.mystery.caseSheet.sceneRoom}`],
  },
  {
    id: 'weapon',
    when: (v) => v.phase === 'play' && v.stage === 'searched' && !!meansDue(v),
    delay: 1600,
    lines: () => [
      'There’s how it was done, {sir}: {weapon}. Now, every guest has a sheet, and the sheet says what they had the means for. Not all three could have used this.',
      'Go through to the questioning, and before you ask anybody anything, set the means under each name.',
    ],
    task: () => 'Go through to the questioning.',
    until: (v) => v.stage !== 'searched',
    lit: () => ['onward'],
  },
  {
    id: 'means',
    when: (v) => v.phase === 'play' && v.stage === 'question' && !!meansDue(v) && !meansRight(v),
    lines: () => [
      'Under every name there are three marks: means, motive and opportunity. They are yours to set, {sir}, and nobody will set them for you, nor tell you if you have them right.',
      'Means first. Open each guest in turn and look under Traits and means: that is their sheet. Set the mark against anyone who could have used {weapon}, and rule it out for anyone who could not.',
    ],
    task: (v) => {
      const wrong = meansWrong(v)
      const allSet = v.cast.every((c) => v.signsOf(c.id).means !== 'unknown')
      return allSet && wrong.length > 0
        ? `Not quite, {sir}. Look again at ${list(wrong)}: the sheet says otherwise.`
        : 'Set the means mark under each of the three names: against them, or ruled out.'
    },
    until: meansRight,
    lit: () => ['sign:means', 'known'],
  },
  {
    id: 'trust',
    when: (v) => v.done('means') && cleared(v) !== null,
    lines: () => [
      'Good. {cleared} could not have used {weapon}: not our murderer, then, and the innocent tell the truth. Ask {cleared} where they were, and what their role is. What a guest knows by their role is often the best thing you’ll hear all night.',
      'Those two questions are all you will need tonight, {sir}: where they were, and who they are. The rest can wait for another case.',
    ],
    task: () => 'Ask {cleared} where they were, and their role.',
    until: (v) => {
      const c = cleared(v)
      return c !== null && v.asked(c, 'alibi') && v.asked(c, 'knowledge')
    },
    lit: (v) => {
      const c = cleared(v)
      if (c === null) return []
      return [
        `guest:${c}`,
        ...(v.asked(c, 'alibi') ? [] : ['q:alibi']),
        ...(v.asked(c, 'knowledge') ? [] : ['q:knowledge']),
      ]
    },
  },
  {
    id: 'others',
    when: (v) => v.done('trust') && v.contradictions === 0,
    lines: () => [
      'Now the other two, {sir}. Ask each where they were. Somebody’s account will not sit with {cleared}’s, and you’ll know it when you hear it.',
    ],
    task: () => 'Ask the other two where they were.',
    until: (v) => v.contradictions > 0,
    lit: (v) => [
      ...v.cast.filter((c) => c.id !== cleared(v) && !v.asked(c.id, 'alibi')).map((c) => `guest:${c.id}`),
      'q:alibi',
    ],
  },
  {
    id: 'compare',
    when: (v) => v.done('trust') && v.contradictions > 0 && v.drawn === 0,
    lines: () => [
      'Hold hard, {sir}. Two of those accounts cannot both be true. Open Compare notes and lay the two side by side. If they clash, the table will say so.',
    ],
    task: () => 'Compare notes: lay the two statements that cannot both be true side by side, and test them.',
    until: (v) => v.drawn > 0,
    lit: () => ['compare', 'test'],
  },
  {
    id: 'confront',
    when: (v) => v.drawn > 0 && !pressed(v),
    lines: () => [
      'A contradiction, and somebody caught in it. Put it to them. A guest with something small to hide may give it up; the murderer will hold.',
    ],
    // (Put to the one the weapon clears, who holds to it as the innocent would, it is still to be put to the other.)
    task: (v) => {
      const c = cleared(v)
      return c !== null && v.asked(c, 'press') && !thiefOwned(v)
        ? `${name(v, c)} holds to it, as the one you trust would. Put it to the other.`
        : 'Put the contradiction to whoever is caught in it.'
    },
    until: thiefOwned,
    lit: () => ['confront', 'q:press'],
  },
  {
    id: 'thief',
    when: (v) => v.seen('confront') && thiefOwned(v),
    delay: 900,
    lines: (v) => [
      `${name(v, thief(v))} owns to the theft, and to lying about where they were. A thief, {sir}, but not our murderer. Mind that: a contradiction tells you somebody lied, and not why.`,
      `And it clears them of the murder: they were at the lockbox at the very time of it. Rule opportunity out for ${name(v, thief(v))}. {cleared} you have ruled out already, so their account of the hour is the truth: rule opportunity out for them too.`,
      'That is two of three who could not have done it. Strike them off the list with Rule out, and see who is left standing. I’ll keep a word for you at the foot of the page as we go.',
    ],
    task: (v) => guide(v).text,
    until: caseMade,
    lit: (v) => guide(v).lit,
  },
  {
    id: 'confirm',
    when: (v) => v.seen('thief') && boxFound(v) && !v.confirmed.includes(thief(v)),
    delay: 1600,
    lines: (v) => [
      `There it is: the box, forced, just as ${name(v, thief(v))} said. As well as catching a lie, laying your notes side by side can bear one out, {sir}: a thing found will confirm a statement as readily as it breaks one.`,
      `Try comparing ${name(v, thief(v))}’s word that they forced the box with the lockbox you found. If it holds, the table will say so, and it will stand for them.`,
    ],
    task: (v) =>
      v.stage === 'searched'
        ? 'Go through to the questioning, and compare notes.'
        : `Compare notes: lay ${name(v, thief(v))}’s word that they forced the box beside the lockbox.`,
    until: (v) => v.confirmed.includes(thief(v)),
    lit: (v) => (v.stage === 'searched' ? ['onward'] : ['compare', 'test']),
  },
  {
    id: 'witness',
    when: (v) => v.done('confirm') && !vouched(v),
    delay: 700,
    lines: (v) => [
      `The box bears ${name(v, thief(v))} out so far. But a confession is only their own word, {sir}, and a murderer might take the Thief’s part to cover themselves. Somebody who saw them there would settle it.`,
      `You trust {cleared}. Ask them one more thing: what they have seen. Then lay what they saw beside where ${name(v, thief(v))} says they were. If the two agree, it stands for them.`,
    ],
    task: (v) => {
      const c = cleared(v)
      if (c !== null && !v.asked(c, 'seen')) return `Ask ${name(v, c)} what they have seen.`
      return `Compare notes: lay what ${name(v, c)} saw beside where ${name(v, thief(v))} says they were.`
    },
    until: vouched,
    lit: (v) => {
      const c = cleared(v)
      return c !== null && !v.asked(c, 'seen') ? [`guest:${c}`, 'q:seen'] : ['compare', 'test']
    },
  },
  {
    id: 'eliminated',
    when: (v) => v.seen('thief') && othersStruck(v) && v.signsOf(murderer(v)).motive !== 'established',
    delay: 700,
    lines: (v) => [
      `That leaves ${name(v, murderer(v))}, {sir}, and you know their motive already: {cleared} told you who stood to gain by his death. Look in your notebook, and mark it against them.`,
    ],
  },
  {
    id: 'three',
    when: (v) => v.seen('thief') && all(v.signsOf(murderer(v))) && !othersStruck(v),
    delay: 700,
    lines: () => [
      'Means, motive and opportunity, all three against one name: that is the murderer, {sir}. Safer, though, to rule the other two out first, so that you know you have deduced it and not guessed it.',
    ],
  },
  {
    id: 'accuse',
    when: (v) => v.seen('thief') && caseMade(v),
    delay: 700,
    lines: (v) => [
      `Only ${name(v, murderer(v))} left standing, and all three counts against them. That is your murderer, {sir}, and in good time too. The Accuse button is at the top: go and make your case.`,
    ],
    task: () => 'Accuse, at the top, and make your case.',
    until: (v) => v.phase !== 'play',
    lit: () => ['accuse'],
  },
  {
    id: 'case',
    // (Once the household has had its say, and the board is up.)
    when: (v) => v.phase === 'accuse' && v.gathered,
    delay: 900,
    lines: (v) => [
      `Time to make your case, {sir}. Name ${name(v, murderer(v))}, and pin to the board what shows each of the three counts against them.`,
      `The weapon shows the means, and it is pinned for you already. For motive, pin what ${name(v, cleared(v))} told you they stood to gain. For opportunity, pin the account of the hour that broke against them: the contradiction you drew. Then point the finger.`,
    ],
    task: (v) => board(v).text,
    until: (v) => v.phase !== 'accuse',
    lit: (v) => board(v).lit,
  },
]

function locks(v: TutorView): TutorLocks {
  const scene = v.mystery.caseSheet.sceneRoom
  const sceneDone = v.searched.includes(scene)
  const c = cleared(v)
  const m = murderer(v)
  return {
    // The first hour's search is the scene, and nothing else.
    rooms: v.round === 0 && !sceneDone ? [scene] : null,
    skipSearch: v.round > 0 || sceneDone,
    // Nobody may be asked anything until the means are set; then only the one the weapon clears, until they have been.
    guests: !v.done('means') ? null : !v.done('trust') && c !== null ? [c] : null,
    // Two questions only, all night: where they were, and who they are (and the pressing).
    questions: !v.done('means') ? [] : !v.done('trust') ? ['alibi', 'knowledge'] : ['alibi', 'knowledge', 'press'],
    // (One more for the one you trust, once the box is found: what they have seen.)
    ...(v.seen('witness') && c !== null ? { questionsOf: { [c]: ['alibi', 'knowledge', 'press', 'seen'] } } : {}),
    compare: v.done('means'),
    strike: v.done('means'),
    accuse: v.seen('accuse'),
    // The finger is pointed at the one left standing, with the board showing all three.
    submit: v.accused === m && all(v.shown(m)),
  }
}

function slots(v: TutorView): Record<string, string> {
  const weapon = v.mystery.evidence.find((e) => e.fact.kind === 'weapon' && v.found.includes(e.id))
  const scene = v.pack.rooms.find((r) => r.id === v.mystery.caseSheet.sceneRoom)
  return {
    house: v.pack.place.name,
    household: v.pack.place.people,
    scene: scene?.name ?? 'the scene',
    // (The thing itself, without the state it was found in: "the heavy brass poker".)
    weapon: weapon?.name.split(',')[0] ?? 'the weapon',
    cleared: name(v, cleared(v)),
  }
}

export const FIRST_CASE: Tutorial = { id: 'first-case', steps: STEPS, locks, slots }

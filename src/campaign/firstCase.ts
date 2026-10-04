// The first case: three guests, and Sergeant Pike at the detective's elbow.
// He welcomes them to the division, has them read the case file, explains the
// hours and the scene, the weapon and the means, has them ask the one guest
// the weapon clears, catches the first contradiction with them and has them
// put it to whoever is caught; and once the Thief has owned to it he stays
// at their elbow to the end: the thief cleared, the one left standing, the
// motive they already know, the account of the hour that breaks, and the case
// made on the board. He does not let the first case be lost. His lines are
// kept, for reading and tweaking, in docs/pike-first-case.md: change them
// there and here together.

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

/** The hour has no questions left: let it strike. */
const HOUR = {
  text: 'No questions left this hour, {sir}. Let the hour strike: every new hour brings five more, and a fresh room to search.',
  lit: ['hour'],
}
/**
 * What is wanted takes a question (something to ask, or the pressing): if
 * the hour has none left, the hour must strike; and at the next hour's
 * search, the rooms come first.
 */
function needingQuestions(v: TutorView, r: { text: string; lit: string[] }): { text: string; lit: string[] } {
  if (!r.lit.some((l) => l.startsWith('q:') || l === 'confront')) return r
  if (v.stage === 'search') {
    return { text: 'Search a room this hour if you like, {sir}, or forgo it. Then back to the questioning.', lit: ['skip'] }
  }
  if (v.stage === 'searched') return { text: 'On to the questioning, {sir}.', lit: ['onward'] }
  if (v.stage === 'question' && v.questionsLeft === 0) return HOUR
  return r
}

/** The lockbox the Thief owns to forcing: the room, and whether it has been found forced. */
const boxRoom = (v: TutorView) => v.mystery.truth.locations[thief(v)]
const boxFound = (v: TutorView) =>
  v.mystery.evidence.some((e) => e.fact.kind === 'forcedLockbox' && e.room === boxRoom(v) && v.found.includes(e.id))
const roomName = (v: TutorView, id: string) => v.pack.rooms.find((r) => r.id === id)?.name ?? id

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
      return { text: `Rule [steps] opportunity out for our thief, ${name(v, t)}.`, lit: ['sign:opportunity'] }
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
        text: `You know ${name(v, m)}’s [heart] motive already: ${name(v, c)} told you who stood to gain by his death. Look in your notebook, and mark [heart] motive against them.`,
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
        ? { text: `${name(v, m)}’s account of the hour will not hold. Mark [steps] opportunity against them.`, lit: ['sign:opportunity'] }
        : {
            text: `Nobody speaks for ${name(v, m)}. Ask them their role, and set what they say beside what you know.`,
            lit: [`guest:${m}`, 'q:knowledge'],
          }
    }
    return { text: '[key] Means, [heart] motive and [steps] opportunity against the one name left standing.', lit: [] }
  }
  return needingQuestions(v, next())
}

/** What the pressing step asks for, by where it stands. */
function confrontGuide(v: TutorView): { text: string; lit: string[] } {
  const c = cleared(v)
  const text =
    c !== null && v.asked(c, 'press') && !thiefOwned(v)
      ? `We know ${name(v, c)} is innocent, so let’s try the other guest.`
      : pressed(v) && !thiefOwned(v) && v.questionsLeft > 0
        ? 'There are more questions still to be asked, {sir}.'
        : 'Press the guests who have a contradiction.'
  return needingQuestions(v, { text, lit: ['confront', 'q:press'] })
}

/** What the strip is asking for just now: the latest step heard whose task is not done. */
function liveLit(v: TutorView): string[] {
  const live = STEPS.filter((s) => s.task && v.seen(s.id) && !v.done(s.id))
  const step = live[live.length - 1]
  return step?.lit?.(v) ?? []
}

/** What the board still wants, once on the accusation screen. */
function board(v: TutorView): { text: string; lit: string[] } {
  const m = murderer(v)
  if (v.accused !== m) return { text: `Name ${name(v, m)}, {sir}: the one left standing.`, lit: [`name:${m}`] }
  const s = v.shown(m)
  const want: string[] = []
  if (s.motive !== 'established') want.push(`For [heart] motive, pin what ${name(v, cleared(v))} told you they stood to gain.`)
  if (s.opportunity !== 'established') want.push('For [steps] opportunity, pin the contradiction you drew against their account of the hour.')
  if (want.length === 0) return { text: 'The board shows all three. Point the finger, {sir}.', lit: ['submit'] }
  return { text: want.join(' '), lit: ['board'] }
}

const STEPS: TutorStep[] = [
  {
    id: 'welcome',
    when: (v) => v.phase === 'intro',
    lines: () => [
      'Welcome to the division, {sir}. I’m Sergeant Pike, here to show you the ropes. Lucky for you, we had a case come in an hour ago, and the Chief Inspector has put your name on it.',
      'There are only three guests staying in {house} tonight, and one of them is a murderer. It’ll be on you to find out which of the three did it. I’ll hang around to guide you through this one, since it’s your first case.',
      'I’ve got the case file for you here, {sir}. Give it a read through, and when you’re ready, click Summon {household}.',
    ],
    task: () => 'Read the case file, then summon {household}.',
    until: (v) => v.phase !== 'intro',
    lit: () => ['summon'],
  },
  {
    id: 'hours',
    when: (v) => v.phase === 'play' && v.stage === 'search' && v.round === 0,
    lines: () => [
      'Did you catch all that, {sir}? Don’t worry if not, it’s all been taken down in your notebook. All evidence you find and statements you collect end up in there. Get yourself familiar with it.',
      'As you no doubt noticed, it’s just gone eight o’clock, {sir}. Our investigation will be divided up into hours, and at the top of each hour you’ll be able to search one room of the house.',
      'I’d recommend we start at the scene of the crime: {scene}. I’ve marked it in red on the plan. The scene is a good place to learn how the murder was carried out.',
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
      'Good job, {sir}: {weapon}. Lucky for us, this will help us narrow down who the killer was. For now, I think it’s time we speak to our suspects.',
      'Go through to the questioning when you’re ready, {sir}.',
    ],
    task: () => 'Go through to the questioning.',
    until: (v) => v.stage !== 'searched',
    lit: () => ['onward'],
  },
  {
    id: 'means',
    when: (v) => v.phase === 'play' && v.stage === 'question' && !!meansDue(v) && !meansRight(v),
    lines: () => [
      'Here are our suspects, {sir}. Under each, you’ll see three gray marks. These are for a suspect’s [key] means, [heart] motive and [steps] opportunity. A murderer will need to have all three of these, and that’s how we can catch them.',
      'You can set them as you like, {sir}. Try to use them to keep track of who’s looking guilty or who we can rule out. Luckily, now we know the murder weapon, we can already figure out who had the [key] means.',
      'Open each guest in turn and look under Traits and means: only some of them will have been able to use {weapon}. Try to set all three of their [key] means for me.',
    ],
    task: (v) => {
      const wrong = meansWrong(v)
      const allSet = v.cast.every((c) => v.signsOf(c.id).means !== 'unknown')
      return allSet && wrong.length > 0
        ? `Not quite, {sir}. Look again at ${list(wrong)}.`
        : 'Set the [key] means mark under each of the three names.'
    },
    until: meansRight,
    lit: () => ['sign:means', 'known'],
  },
  {
    id: 'trust',
    when: (v) => v.done('means') && cleared(v) !== null,
    lines: () => [
      'Good. {cleared} could not have used {weapon}, so can’t be our murderer. That means we can be sure she’s telling the truth. Go ahead and ask {cleared} where they were, and what their role is.',
      'Those two questions are all you will need tonight, {sir}, so I’ve disabled the other ones for you for now.',
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
      'Now, let’s look back at our two remaining suspects, {sir}. I say we ask each for their information. Keep an ear out for if either says anything that contradicts what {cleared} has told us.',
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
      'Hold up a moment there, {sir}. I think we’ve just heard a contradiction. If you get the feeling something doesn’t add up, you should open Compare notes and select the two suspicious statements.',
    ],
    task: () => 'Compare notes: lay the two statements that cannot both be true side by side, and test them.',
    until: (v) => v.drawn > 0,
    lit: () => ['compare', 'test'],
  },
  {
    id: 'confront',
    when: (v) => v.drawn > 0 && !pressed(v),
    lines: () => [
      'Yes, we’ve found a contradiction alright. Now, we can press for more information. Let’s see if either guest gives way under a little pressure.',
    ],
    // (Put to the one the weapon clears, who holds to it as the innocent would, it is still to be put to the other;
    // and should that have spent the hour's last question, the hour must strike first.)
    task: (v) => confrontGuide(v).text,
    until: thiefOwned,
    lit: (v) => confrontGuide(v).lit,
  },
  {
    id: 'thief',
    when: (v) => v.seen('confront') && thiefOwned(v),
    delay: 900,
    lines: (v) => [
      `${name(v, thief(v))} owns up to a theft, and to lying about where they were. The murderer won’t be the only one to lie about their alibi, {sir}, take it from me.`,
      `If ${name(v, thief(v))} was a thief, then they very likely didn’t have time for a murder as well. I think we can safely say they didn’t have any [steps] opportunity.`,
      'Go ahead and mark down their lack of [steps] opportunity.',
    ],
    task: (v) => guide(v).text,
    until: caseMade,
    lit: (v) => guide(v).lit,
  },
  {
    id: 'spent',
    // Out of questions, back at the list, with a question the next thing wanted: the hour must strike.
    when: (v) =>
      v.seen('confront') && v.stage === 'question' && v.activeChar === null && v.questionsLeft === 0 && liveLit(v).includes('hour'),
    delay: 700,
    lines: () => [
      'Looks like we’re out of time this hour, {sir}. Not to worry though, we can ask more questions after the clock has struck.',
      'Click Let the hour strike to continue.',
    ],
  },
  {
    id: 'confirm',
    when: (v) => v.seen('thief') && boxFound(v) && !v.confirmed.includes(thief(v)),
    delay: 1600,
    lines: () => ['Look at this, {sir}. It looks like we’ve had a robbery tonight as well as a murder.'],
    task: (v) =>
      v.stage === 'searched'
        ? 'Go through to the questioning, and compare notes.'
        : `Compare notes: lay ${name(v, thief(v))}’s word that they forced the box beside the lockbox.`,
    until: (v) => v.confirmed.includes(thief(v)),
    lit: (v) => (v.stage === 'searched' ? ['onward'] : ['compare', 'test']),
  },
  {
    id: 'eliminated',
    when: (v) => v.seen('thief') && othersStruck(v) && v.signsOf(murderer(v)).motive !== 'established',
    delay: 700,
    lines: (v) => [
      `That leaves ${name(v, murderer(v))} as our only possible suspect, {sir}, and you know their [heart] motive already: {cleared} told you who stood to gain by his death. Look in your notebook, if you need the reminder, and you can mark down their [heart] motive.`,
    ],
  },
  {
    id: 'three',
    when: (v) => v.seen('thief') && all(v.signsOf(murderer(v))) && !othersStruck(v),
    delay: 700,
    lines: () => [
      '[key] Means, [heart] motive and [steps] opportunity, all three against one name: if you’re right, we’ve found our murderer, {sir}. Safer, though, to rule the other two out first, so that you know you have deduced it properly.',
    ],
  },
  {
    id: 'accuse',
    when: (v) => v.seen('thief') && caseMade(v),
    delay: 700,
    lines: (v) => [
      `It looks like that’s our answer. ${name(v, murderer(v))} is the only possibility left. We’ve made good time, {sir}. The Accuse button is at the top: it’s time to make your case.`,
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
      `The weapon shows the [key] means, and it is pinned for you already. For [heart] motive, pin what ${name(v, cleared(v))} told you they stood to gain. For [steps] opportunity, pin the account of the hour that broke against them: the contradiction you drew. Then point the finger.`,
    ],
    task: (v) => board(v).text,
    until: (v) => v.phase !== 'accuse',
    lit: (v) => board(v).lit,
  },
  {
    id: 'cuffs',
    // (Once the reveal has played out to the truth.)
    when: (v) => v.phase === 'reveal' && v.truthTold,
    delay: 1200,
    lines: () => [
      'Well done, {sir}. A murderer caught and in cuffs. I think you’re going to fit right in here at the station, if you don’t mind me saying so.',
    ],
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

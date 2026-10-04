// The first case: three guests, and Sergeant Pike at the detective's elbow.
// He welcomes them to the division, has them read the case file, explains the
// hours and the scene, the weapon and the means, has them ask the one guest
// the weapon clears, catches the first contradiction with them and has them
// put it to whoever is caught, says a word on liars who are not murderers,
// and then leaves them to it until three marks stand against one name.

import type { CharId } from '../engine/types'
import { meansDue, type Tutorial, type TutorLocks, type TutorStep, type TutorView } from './tutorial'

/** The guest the weapon clears: whoever lacked the means for it (the first case has one). */
function cleared(v: TutorView): CharId | null {
  const due = meansDue(v)
  if (!due) return null
  for (const [c, mark] of due) if (mark === 'ruledOut') return c
  return null
}

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

/**
 * Whether every opportunity mark says what the first case teaches: ruled out
 * for the one the weapon clears (their account of the hour is the truth, and
 * it keeps them from the scene), and against the other two, who were alone by
 * their own account or lied about it (the case is dealt so: see the test).
 */
function opportunityRight(v: TutorView): boolean {
  const c = cleared(v)
  return c !== null && v.cast.every((g) => v.signsOf(g.id).opportunity === (g.id === c ? 'ruledOut' : 'established'))
}
const name = (v: TutorView, c: CharId | null) => (c === null ? 'the one the weapon clears' : v.cast[c].shortName)
/** "A, B and C". */
const list = (names: string[]) =>
  names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : (names[0] ?? '')

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
    task: () => 'Put the contradiction to whoever is caught in it.',
    until: pressed,
    lit: () => ['confront', 'q:press'],
  },
  {
    id: 'opportunity',
    when: (v) => v.seen('confront') && pressed(v),
    delay: 900,
    lines: (v) => [
      v.confessed.length > 0
        ? `${name(v, v.confessed[0])} owns to a theft, and to a lie about the hour. A thief, {sir}, but not our murderer. Mind that: a contradiction tells you somebody lied, and not why.`
        : 'They hold to it. A liar who will not crack is a liar still, but not every liar is the murderer. A contradiction tells you somebody lied, and not why.',
      'Now, opportunity. Anybody who spent the hour alone, with nobody to speak for them, could have slipped out to the scene; so could anybody who lied about where they were. Mark opportunity against them.',
      'Not {cleared}, mind. You have ruled {cleared} out already, so their account is the truth: alone, but where they said, and not at the scene. Rule opportunity out for them.',
      'After that, motive. {cleared} told you who stood to gain by his death: that is motive, and a paper somewhere may prove it. Then I’ll leave you to it, {sir}.',
    ],
    task: (v) => {
      const c = cleared(v)
      if (c !== null && v.signsOf(c).opportunity === 'established') {
        return `Not ${name(v, c)}, {sir}: you ruled them out, so their account is the truth. They were where they said, and not at the scene.`
      }
      const wrong = v.cast.filter((g) => g.id !== c && v.signsOf(g.id).opportunity === 'ruledOut')
      if (wrong.length > 0) {
        return `${list(wrong.map((g) => g.shortName))} ${wrong.length > 1 ? 'were' : 'was'} alone by their own account, or lied about the hour: nobody can say they did not slip out. Mark opportunity against them.`
      }
      return 'Set the opportunity mark under each name: against anyone alone or caught lying about the hour, and ruled out for whoever you trust.'
    },
    until: opportunityRight,
    lit: () => ['sign:opportunity'],
  },
  {
    id: 'accuse',
    when: (v) =>
      v.done('opportunity') &&
      v.cast.some((c) => {
        const s = v.signsOf(c.id)
        return s.means === 'established' && s.motive === 'established' && s.opportunity === 'established'
      }),
    lines: () => [
      'Means, motive and opportunity, all three against one name. That’s your murderer, {sir}, and in good time too. The Accuse button is at the top: when you’re ready, name them, and pin what shows it.',
    ],
    task: () => 'Accuse, at the top, when you are ready to name the murderer.',
    until: (v) => v.phase !== 'play',
    lit: () => ['accuse'],
  },
]

function locks(v: TutorView): TutorLocks {
  const scene = v.mystery.caseSheet.sceneRoom
  const sceneDone = v.searched.includes(scene)
  const c = cleared(v)
  return {
    // The first hour's search is the scene, and nothing else.
    rooms: v.round === 0 && !sceneDone ? [scene] : null,
    skipSearch: v.round > 0 || sceneDone,
    // Nobody may be asked anything until the means are set; then only the one the weapon clears, until they have been.
    guests: !v.done('means') ? null : !v.done('trust') && c !== null ? [c] : null,
    questions: !v.done('means') ? [] : !v.done('trust') ? ['alibi', 'knowledge'] : null,
    compare: v.done('means'),
    strike: v.done('means'),
    accuse: v.seen('accuse'),
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

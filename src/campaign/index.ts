// The campaign: a run of cases that bring the game in one piece at a time.
// Each is a script of its own in a chosen setting, and may come with one of
// Sergeant Pike's lessons. The first is a fixed case number (three guests and
// the sergeant at the detective's elbow, so the lesson fits); the rest are
// dealt fresh each time they are played, with the setting, the parts and the
// guests the case asks for.

import type { PackId } from '../content'
import { KNOT_SCRIPT, SIMPLE_SCRIPT, TWIST_SCRIPT, type CastPin, type Script } from '../engine/deck'
import { INNOCENT_POOL } from '../engine/roles'
import type { Mystery } from '../engine/types'
import { FIRST_CASE } from './firstCase'
import type { Tutorial, TutorialId } from './tutorial'

export type { Tutorial, TutorialId, TutorLocks, TutorStep, TutorView } from './tutorial'
import { OPEN } from './tutorial'
export { OPEN }

/**
 * What comes before a case's file: a word in the office from Sergeant Pike
 * (or, later, the Chief Inspector), a line at a time; or a handwritten note
 * from the Chief Inspector, read before the file is opened. Either sets the
 * scene and says what the night may hold. Lines take {sir} and the
 * [key] [heart] [steps] icons.
 */
export interface BriefingLine {
  /**
   * Who says it: the sergeant, the Chief, one of the setting's own people by
   * their character id (with their cameo and voice), or a voice with no face.
   * Left out, the scene's speaker.
   */
  who?: 'pike' | 'craddock' | 'voice' | (string & {})
  /** How the speaker is named over the line, where not the usual: "The guard, on the tannoy". */
  as?: string
  text: string
}
export type Briefing =
  | { kind: 'office'; speaker: 'pike' | 'craddock'; where: string; lines: (string | BriefingLine)[]; /** The last button's word, where not "To the case file". */ done?: string }
  | { kind: 'note'; text: string; signed: string }

/** How the finale ended: whether the sergeant was in on it, and whether the detective got it right. */
export type Ending = 'innocent-caught' | 'innocent-lost' | 'guilty-caught' | 'guilty-lost'

export interface CampaignCase {
  id: string
  /** Its place in the run: "Case 1". */
  chapter: string
  name: string
  /** A word on what it brings, for the campaign page. */
  text: string
  pack: PackId
  script: Script
  /** The case number, where it is the same case every time (so a lesson fits it). Left out, a fresh one is dealt. */
  seed?: number
  /** Who is found dead, by id (one of the setting's); left out, the number decides. */
  victim?: string
  /** Guests the case asks for: a part dealt, a character at the table, who is dealt what, and cause (see CastPin). */
  pins?: readonly CastPin[]
  /**
   * The case's own opening narration, in place of the setting's. Slots: the
   * victim's ({victim} full name, {Victim} short, {respectful}, {he} {him}
   * {his} {He} {His}), the place's, and {scene} and {window} for where and
   * when (see introSlots in src/engine/render).
   */
  intro?: string
  /** The case file's account of the evening, in place of the occasion's; the same slots. */
  report?: string
  /** A word in the office, or a note from the Chief, before the file is opened. */
  briefing?: Briefing
  /** Sergeant Pike over the case sheet, once, on what is new tonight (a lesson of one step). */
  sheet?: string[]
  /** After the reveal, a last word, by how it ended (see endingOf). */
  endings?: Record<Ending, Briefing>
  tutorial?: TutorialId
}

/**
 * The first case's script: the murderer, the Thief, and one innocent with
 * something to tell, from the whole innocent pool (so that the liars have
 * parts to pass for). Five questions an hour, and no lifelines yet.
 */
export const FIRST_CASE_SCRIPT: Script = {
  id: 'custom',
  innocents: [...INNOCENT_POOL],
  suspicious: ['thief'],
  accomplices: [],
  suspiciousCount: 1,
  innocentCount: 1,
  questionsPerRound: 5,
  lifelines: false,
}

/**
 * The first case's number. Chosen (and held to by tests/campaign) for the
 * shape the lesson needs: the innocent is the Gossip, the weapon clears them
 * and nobody else, they know the murderer's grudge, the first contradiction
 * catches the Thief and not the murderer, and the murderer's own account
 * breaks against the Gossip's, which the room bears out.
 */
export const FIRST_CASE_SEED = 2291

/** A Simple Case, as the campaign deals it: with or without help hidden about the place. */
const classic = (lifelines: boolean): Script => ({ ...SIMPLE_SCRIPT, id: 'custom', lifelines })

/**
 * A night of the Knot's rules (the Drunk may walk, a passage may run from the
 * scene, a door may be locked), with what the case asks for on top: its kind
 * of murderer, its friend of the murderer's if any, its locks.
 */
const night = (own: Partial<Script>): Script => ({ ...KNOT_SCRIPT, id: 'custom', accomplices: [], ...own })

/** The first of the campaign's cases that stays hidden until the one before it is solved. */
export const HIDDEN_FROM = 6

export const CAMPAIGN: readonly CampaignCase[] = [
  {
    id: 'first-case',
    chapter: 'Case 0',
    name: 'The Housekeeper’s Death',
    text: 'Your first night with the division. Three guests, one murderer, and Sergeant Pike to show you how a case is worked.',
    pack: 'manor1920s',
    script: FIRST_CASE_SCRIPT,
    seed: FIRST_CASE_SEED,
    // (The housekeeper: the master of the house is alive, and the lesson is the same.)
    victim: 'pemberton',
    // (In the case's own words; the setting's narration would have it a houseful. See docs/pike-first-case.md.)
    intro:
      'A quiet weekend at Blackwood Manor, with only three guests down for it, and the river rising all afternoon. By dinner the flood had shut the house off from the world, and at eight o’clock {victim}, the housekeeper, was found in {scene}, quite dead. It had been done {window}. Three guests were in the house when it happened, and the flood has made quite certain that all three are still there.',
    report:
      '{Victim}, housekeeper at the manor these eleven years, was killed during the evening, after floodwater had cut the house off. Three guests were staying; the family were at dinner.',
    tutorial: 'first-case',
  },
  {
    id: 'village',
    chapter: 'Case 1',
    name: 'Murder in the Village',
    text: 'A full table at last: seven of the village snowed in at Little Wending, two of them with something to hide and one of them a murderer. Seven questions an hour, and nothing to help you but your notebook.',
    pack: 'village1926',
    script: classic(false),
    briefing: {
      kind: 'office',
      speaker: 'pike',
      where: 'The Chief Inspector’s office, Scotland Yard',
      lines: [
        'Morning, {sir}. Your first real case, this one, and the Chief is sending you over to Little Wending: a village shut in by the snow, and somebody dead in one of its houses.',
        'Seven of the village snowed in, and one of them did it. No three guests and me at your elbow this time, {sir}. The whole village to question, and seven questions an hour to do it in.',
        'Remember what we did at the manor. Establish the [key] means, the [heart] motive and the [steps] opportunity, and whoever is left standing with all three is your killer.',
        'That’s the lot from me, {sir}. The Chief wants a name by midnight. Good luck.',
      ],
    },
    sheet: [
      'Before you summon anybody, {sir}, take a look through the case sheet. Tonight’s script is on it: how many of each part are in the house, and what kind of murderer you’re after. Always read it first.',
      'A full table tonight: four honest, two with something to hide, and the one who did it. Seven questions an hour, so spend them well.',
      'If you want a refresher once the questioning’s begun, the case file is in the top menu. It’s the same sheet, and it doesn’t change.',
    ],
  },
  {
    id: 'train',
    chapter: 'Case 2',
    name: 'Murder on the Highland Express',
    text: 'Another plain murder, aboard the night train north. Help is hidden about the carriages tonight: search, and you may find a friend.',
    pack: 'train1926',
    script: classic(true),
    briefing: {
      kind: 'note',
      text: 'Detective,\n\nI am sending you down to catch a train. The Highland Express is stopped by snow somewhere north of Perth with {victim} dead aboard, and the railway has asked for the Yard. You will board where she stands, and you will have her company until she gets into Inverness at midnight, and not a minute past.\n\nThere has been a murder. Catch the killer. You have this, Detective.',
      signed: 'Chief Inspector Craddock',
    },
    sheet: [
      'Something new on the sheet tonight, {sir}: help is hidden about the train. Search a room and you may find it. It goes in your notebook, and each is good once.',
    ],
  },
  {
    id: 'village-drunk',
    chapter: 'Case 3',
    name: 'Return to the Village',
    text: 'Back to Little Wending, where one guest may have had too much to drink and be sincerely, dangerously wrong in all they tell you. A door may be locked, and its key gone.',
    pack: 'village1926',
    script: { ...SIMPLE_SCRIPT, id: 'custom', suspicious: [...SIMPLE_SCRIPT.suspicious, 'drunk'], lockedRoom: 0.4 },
    // (The Drunk walks most nights, not all: the case file says they may.)
    pins: [{ role: 'drunk', chance: 0.75 }],
    briefing: {
      kind: 'office',
      speaker: 'pike',
      where: 'The CID room, Scotland Yard',
      lines: [
        'Welcome back, {sir}. I was going to ask how the train was, and whether the Highlands were worth the snow. I shan’t get the chance.',
        'There’s been another incident at Little Wending. The village again, {sir}, and a body again, and the Chief says he wants boots on the ground before the lane shuts.',
        'One thing before you go. Country people drink, {sir}, and a drunk witness is a dangerous one: they’ll swear to things that never happened, and mean every word of it. Weigh what you’re told against what you can see.',
        'The trap’s at the door. Good luck, {sir}.',
      ],
    },
    sheet: [
      'Look at the suspicious parts on the sheet, {sir}: the Drunk may walk tonight. A drunk guest tells the truth about where they were and who they saw, and is honestly wrong about everything they only think they know.',
    ],
  },
  {
    id: 'yacht',
    chapter: 'Case 4',
    name: 'Death Aboard the Corinthia',
    text: 'A gale, a yacht, and a murderer who may not be done: whoever knows most may not live to tell it. From tonight, a secret passage may run from the scene.',
    pack: 'boat1926',
    script: { ...TWIST_SCRIPT, id: 'custom', nights: { serial: 3, plain: 1 } },
    briefing: {
      kind: 'office',
      speaker: 'craddock',
      where: 'The Chief Inspector’s office, Scotland Yard',
      lines: [
        { who: 'pike', text: 'Another one put away, {sir}. The Chief read your report twice, and he doesn’t read anything twice. He wants a word, and he wants it now.' },
        'Sit down, Detective. We have not met; I know your work. I am going to ask you something I do not ask lightly: are you ready to put yourself in harm’s way?',
        'The coastguard has just telephoned. The yacht Corinthia is hove to in a gale off the Needles with {victim} dead aboard, and everybody else aboard with {him}. A boat will take you out.',
        'Here is what worries me. Whoever killed on that yacht is still on it, with the only people who could name them. If they are not caught quickly, I believe they will kill again. And a yacht in a gale is a fine place to land what nobody declares; keep your eyes open.',
        'Find them before midnight, Detective. Good luck.',
      ],
    },
    sheet: [
      'Two things new on the sheet, {sir}. A secret passage may run from the scene, so a guest can have been in two rooms in one hour. And a serial murderer kills again as ten o’clock strikes, to silence whoever knows most against them. Hear the ones who know things before then, or name your murderer first.',
    ],
  },
  {
    id: 'partner',
    chapter: 'Case 5',
    name: 'The Blackwood Partnership',
    text: 'Lord Blackwood’s partner is dead, the firm was failing, and his lordship had every reason; the whole house knows it. But a murderer on this night may have a friend to lie for them. Trust nobody’s word on its own.',
    pack: 'manor1920s',
    // (The murderer's friend tonight is the one who pays a witness: his lordship, with cause of his own.)
    script: { ...KNOT_SCRIPT, id: 'custom', accomplices: ['sponsor'], accompliceChance: 1 },
    victim: 'trent',
    // (His lordship has cause, always; most nights he is the Sponsor, and some nights his part is anybody's guess.)
    pins: [
      { character: 'lord', motive: true },
      { character: 'lord', role: 'sponsor', chance: 0.7 },
    ],
    intro:
      'Lord Blackwood had his partner down for the weekend, and the house knew why: Blackwood & Trent was in trouble, and the two of them had not been civil since the spring. By dinner the flood had shut the manor off from the world, and at eight o’clock {victim} was found in {scene}, quite dead. It had been done {window}. His lordship is under the same roof as everybody else, and the flood has made quite certain that nobody leaves it.',
    report:
      '{Victim}, Lord Blackwood’s partner in Blackwood & Trent, was killed during the evening, after floodwater had cut the house off. The partners were known to have fallen out. Lord Blackwood is among those in the house.',
    briefing: {
      kind: 'office',
      speaker: 'craddock',
      where: 'The Chief Inspector’s office, Scotland Yard',
      lines: [
        'Back to where it started for you, Detective. There has been another death at Blackwood Manor, and this time it is a serious matter.',
        'Lord Blackwood was giving a dinner. In the course of it his business partner, Mr. Hugo Trent, was killed, in circumstances nobody at that table can account for.',
        'You will want to know that with Trent dead the whole of Blackwood & Trent passes to his lordship. That is quite a prize. Whether it is one a man would kill for is what I am sending you to find out.',
        'One more thing. Customs have been asking me about that firm’s ledgers, and what its boats carry up the river at night. It may be nothing. Keep your eyes open, and do not take his lordship’s word for anything.',
      ],
    },
    sheet: [
      'The murderer may have a friend in the house tonight, {sir}: the Sponsor, who pays a witness to hold their tongue, and leaves the money somewhere to be found. A friend lies for the murderer, so one guest’s word alone is only a word.',
    ],
  },
  {
    id: 'theatre',
    chapter: 'Case 6',
    name: 'Curtain Down at the Empress',
    text: 'A West End theatre, the first night off and the stage door bolted. The murderer tonight may be sorry for it, and a friend of theirs may have been busy with a pen: not every paper in the house need be what it seems.',
    pack: 'theatre1929',
    // (A regretful murderer wants a friend in the house; here it is the Forger.)
    script: night({ accomplices: ['forger'], accompliceChance: 0.8, nights: { regretful: 3, plain: 1 }, lockedRoom: 0 }),
    briefing: {
      kind: 'note',
      text: 'Detective,\n\nThe Empress Theatre, Shaftesbury Avenue. A dress rehearsal ran late, the fog came down, and {victim} was found dead in the house. The company is kept in and the stage door bolted.\n\nI will tell you what I expect, and you will tell me if I am wrong. A killing in a theatre is seldom a cold one: whoever did this may be sorry for it already, and a sorry murderer makes mistakes. Watch for them. And in that trade paper is cheap: a letter, a telegram, a contract may not be what it seems. Trust nothing written until you know whose hand wrote it.',
      signed: 'Chief Inspector Craddock',
    },
    sheet: [
      'New on the sheet, {sir}: the murderer may be sorry for it, sorry enough to stand up at the last gathering and own to it before you’ve named anybody. Don’t count on it. And the Forger may be beside them: a paper you find may be forged, so match the hand before you trust the letter.',
    ],
  },
  {
    id: 'college',
    chapter: 'Case 7',
    name: 'Gaudy Night at St. Jude’s',
    text: 'An Oxford college in fog, the gate locked. The death may be dressed to look like the dead man’s own doing, or be it; somebody may be ready to take the blame; and from tonight a door may be locked and its key gone astray.',
    pack: 'college1927',
    // (The Artful Murderer makes it look like his own hand: a puzzle only where it truly might have been.)
    script: night({ accomplices: ['martyr'], accompliceChance: 0.4, nights: { artful: 3, suicide: 1, plain: 1 }, lockedRoom: 0.8 }),
    briefing: {
      kind: 'note',
      text: 'Detective,\n\nThis one is personal. {victim} of St. Jude’s was found dead at the college last night, and the Dean has written to say it was by {his} own hand.\n\nI dined with {him} a week ago, and I have never seen {him} in better spirits. I do not say the Dean is wrong. I say I want to know. Go up, look at it with your own eyes, and tell me whether this is a genuine suicide or whether there is more to it than meets the eye. If there is, somebody in that college is counting on nobody asking.\n\nThe gate will be locked for you till midnight. Mind the doors inside it, too: a locked room is a room somebody wanted kept.',
      signed: 'Chief Inspector Craddock',
    },
    sheet: [
      'Three things, {sir}. A door may be locked tonight and its key somewhere else. The death may truly be by the victim’s own hand, or dressed to look so, with a note in a hand that isn’t quite theirs: ‘nobody’ is an answer you can give. And a Martyr may stand up and take the blame for somebody else, though they lacked the means, or the motive, or the chance. Check that they could have.',
    ],
  },
  {
    id: 'train-perjurer',
    chapter: 'Case 8',
    name: 'Night Mail North',
    text: 'The Highland Express again, snowbound. Somebody on the train may be swearing to an alibi that was never true, and will go on swearing to it until pressed.',
    pack: 'train1926',
    // (The Careful Murderer is on the sheet from here, a night in five, so that the finale's is no surprise by then.)
    script: night({ accomplices: ['perjurer'], accompliceChance: 0.8, nights: { plain: 3, regretful: 1, careful: 1 } }),
    briefing: {
      kind: 'office',
      speaker: 'pike',
      where: 'Aboard the Highland Express, before she leaves',
      lines: [
        'Well, {sir}. A week by the sea, and nothing to do but look at it. The Chief’s orders, and I’m to see you get there. I’ve never been north of Watford myself.',
        { who: 'attendant', as: 'The attendant, on the platform', text: 'Ladies and gentlemen, this train will be held at the platform. There has been an incident aboard, and the police are asked to attend. Would any passenger with information please make themselves known to the guard.' },
        'There’s never a quiet moment on the force, is there, {sir}? Let’s sort this out, and then we can enjoy a quiet time by the coast.',
        'One thing. Somebody aboard will swear blind to where they were, {sir}, and go on swearing to it. Believe it when you’ve seen it, and not before.',
      ],
    },
    sheet: [
      'The Perjurer, new on the sheet, {sir}: swears to the murderer’s alibi and holds to it under pressing. Two guests who vouch for each other are true; one guest vouching alone is only a word.',
    ],
  },
  {
    id: 'hotel',
    chapter: 'Case 9',
    name: 'Out of Season',
    text: 'The Marine Hotel in a January gale. The murderer tonight may be cunning: caught in a lie, they will own to a smaller sin to explain it. Check the story against what you have found.',
    pack: 'hotel1928',
    script: night({ nights: { cunning: 3, plain: 1, careful: 1 } }),
    briefing: {
      kind: 'office',
      speaker: 'pike',
      where: 'The lobby of the Marine Hotel',
      lines: [
        'Here we are, {sir}. The Marine. Sea air, a room each, and not a corpse for fifty miles. I’ll sign the book.',
        { who: 'receptionist', as: 'Miss Dale, from the stairs', text: '{Victim} has been found dead! Somebody telephone for the police, at once!' },
        'Well, {sir}. Sergeant Pike, and a detective of the Yard, at your service. We’re back to work.',
        'A word while they fetch the manager. Whoever did this may be a cunning one, {sir}: catch them in a lie and they’ll confess to something smaller to cover it, a theft, a bit of blackmail, a minute at the scene. Don’t take the smaller sin for the whole truth.',
      ],
    },
    sheet: [
      'The Cunning Murderer, new on the sheet, {sir}: pressed on a lie, they own to a lesser crime instead, the Thief’s or the Blackmailer’s, or a minute at the scene. A confession explains the lie; it doesn’t clear them. Check the story against the evidence.',
    ],
  },
  {
    id: 'blackwood',
    chapter: 'Case 10',
    name: 'The Death of Lord Blackwood',
    text: 'Blackwood Manor, and the master of the house found dead at last. Or is he? Somebody in the house knows more about tonight than a murderer would.',
    pack: 'manor1920s',
    script: night({ nights: { hoax: 3, plain: 1 } }),
    victim: 'blackwood',
    briefing: {
      kind: 'office',
      speaker: 'craddock',
      where: 'The Chief Inspector’s office, Scotland Yard',
      lines: [
        'Sit down, Detective. Something serious is afoot. Lord Blackwood was murdered at the manor tonight; that is the message, and I do not believe a word of it.',
        'One house, three deaths in a year. That is one too many for coincidence, and I have stopped believing in coincidence where Blackwood is concerned.',
        'It has come to light that his lordship was part of a ring of smugglers, running goods up the river past Customs, and that he was to stand trial for it. A man facing trial has two ways out.',
        'Either Blackwood is faking his own death to escape the dock, with help from somebody in that house; or his gang were afraid he would talk, and made sure he could not. Go up and find out which. Trust nobody who stands to gain by his being gone.',
      ],
    },
    sheet: [
      'His lordship may not be dead at all, {sir}: ‘he is not dead’ is on the accusation screen tonight. The Hoaxer helped him fake it, will claim to be the Witness, and will swear they saw somebody at the scene who was never there.',
    ],
  },
  {
    id: 'college-cleaner',
    chapter: 'Case 11',
    name: 'Term’s End at St. Jude’s',
    text: 'Back to the college. The scene may have been tidied by a friend of the murderer’s, and the weapon be wherever they spent the hour.',
    pack: 'college1927',
    script: night({ accomplices: ['cleaner'], accompliceChance: 0.8, nights: { plain: 3, serial: 1, careful: 1 } }),
    briefing: {
      kind: 'note',
      text: 'Detective,\n\n{victim} has been found dead at St. Jude’s, and I want you up there tonight.\n\nI will be plain. The dead {man} was part of the ring Blackwood ran with. They call themselves the Committee, and I am on their trail. They have friends in high and influential places, some of them, I suspect, at high table. Tread carefully on that campus. Whoever did this may have had a friend tidy up after them, and a scene that has been tidied tells you as much as one that has not.\n\nGood luck.',
      signed: 'Chief Inspector Craddock',
    },
    sheet: [
      'The Cleaner, new on the sheet, {sir}: carries the weapon off to wherever they spent the hour. A room without the weapon isn’t a room without the murder.',
    ],
  },
  {
    id: 'yard',
    chapter: 'Case 12',
    name: 'A Death at the Yard',
    text: 'Scotland Yard in rain and fog, and Chief Inspector Craddock dead in his own building. Sergeant Pike is at the table with the rest of the division, and the murderer may have been careful to have been somewhere nobody was; or it may have been the Committee itself, four of them and one story.',
    pack: 'yard1928',
    // (And the Committee itself, some nights: four of them, and one story between them.)
    script: night({ nights: { careful: 4, committee: 4, plain: 1, serial: 1, cunning: 1 } }),
    victim: 'craddock',
    pins: [{ character: 'pike' }],
    briefing: {
      kind: 'office',
      speaker: 'pike',
      where: 'The CID room, Scotland Yard',
      lines: [
        '{sir}. Thank God you’re back. It’s the Chief. Chief Inspector Craddock is dead.',
        'Murdered, {sir}. Here. In his own building, with a constable on every door and the whole division in the house.',
        'The Assistant Commissioner has put a note on the file. He wants you on it and nobody else; he says the Chief would have wanted the same.',
        'This is the Committee’s doing, {sir}, and we both know the Chief was close to their ringleader. They’ve been careful. Careful to have been somewhere nobody was; or, if it took more than one of them, careful to tell one story between them. We’ll avenge him, and we’ll have them, once and for all.',
      ],
    },
    sheet: [
      'Last of all, {sir}. The Careful Murderer claims to have been where nobody was. And if it was the Committee, four of them share one story: ‘it was more than one’ is an answer you can give. Read the sheet, and good luck.',
    ],
    endings: {
      'innocent-caught': {
        kind: 'office',
        speaker: 'pike',
        where: 'The CID room, Scotland Yard, after midnight',
        done: 'The end',
        lines: [
          'Well, {sir}. That’s the Committee broken, and the Chief avenged. He’d have said it was only your job. I’ll say it was a fine piece of work.',
          'The Assistant Commissioner wants a word in the morning, and I’m told there’s an inspector’s warrant on his desk with a name on it. I shan’t spoil it. Goodnight, {sir}.',
        ],
      },
      'innocent-lost': {
        kind: 'office',
        speaker: 'pike',
        where: 'The CID room, Scotland Yard, after midnight',
        done: 'The end',
        lines: [
          'So that’s how it was, {sir}. And we never saw it.',
          'The Chief’s killer walks out of the Yard tonight with the rest of the division, and I don’t know when I’ll sleep again. We’ll get them. Not tonight. But we’ll get them.',
        ],
      },
      'guilty-caught': {
        kind: 'office',
        speaker: 'pike',
        where: 'The CID room, Scotland Yard, after midnight',
        done: 'The end',
        lines: [
          'Twelve years, {sir}. Twelve years in this building, and you’d have walked past me on your first day if I hadn’t shown you where the kettle was.',
          'Go on, then. Take the cuffs off the hook; I’ve put them on better men than you. The Committee pays, {sir}. The Yard never did.',
        ],
      },
      'guilty-lost': {
        kind: 'office',
        speaker: 'pike',
        where: 'The CID room, Scotland Yard, after midnight',
        done: 'The end',
        lines: [
          'Well, {sir}. A sad business, and nobody to hang for it. The Chief would have wanted it tidier.',
          'Still, the Yard goes on. I’ll lock up tonight, same as always; I’ve the keys to every door in it. Goodnight, {sir}. Sleep well. I shall.',
        ],
      },
    },
  },
]

/** A lesson of one step: the sergeant over the case sheet, before anybody is summoned. */
export function sheetLesson(lines: string[]): Tutorial {
  return {
    id: 'sheet',
    steps: [{ id: 'sheet', when: (v) => v.phase === 'intro', lines: () => lines, delay: 900 }],
    locks: () => OPEN,
    slots: () => ({}),
  }
}

/** Which of a case's endings the night earned: is the sergeant guilty, and was the finger pointed right? */
export function endingOf(c: CampaignCase, m: Mystery, solved: boolean): Briefing | null {
  if (!c.endings) return null
  const pike = m.cast.findIndex((x) => x.defId === 'pike')
  const role = pike >= 0 ? m.truth.roles[pike] : null
  const guilty = role === 'murderer' || role === 'committee'
  return c.endings[`${guilty ? 'guilty' : 'innocent'}-${solved ? 'caught' : 'lost'}`]
}

export const TUTORIALS: Record<'first-case', Tutorial> = { 'first-case': FIRST_CASE }

export function campaignCase(id: string | null | undefined): CampaignCase | null {
  return CAMPAIGN.find((c) => c.id === id) ?? null
}

/**
 * The settings the campaign opens: each of the later four is played first in
 * its campaign case, and only then offered on the title page for a case of
 * the player's own. (The first four are open from the start.)
 */
export const SETTING_UNLOCKS: Partial<Record<PackId, string>> = {
  theatre1929: 'theatre',
  college1927: 'college',
  hotel1928: 'hotel',
  yard1928: 'yard',
}

/** The campaign case that opens a setting, if it is one that wants opening. */
export function settingUnlock(pack: PackId): CampaignCase | null {
  return campaignCase(SETTING_UNLOCKS[pack]) ?? null
}

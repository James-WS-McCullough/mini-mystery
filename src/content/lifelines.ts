// The help that may be found about the place, and the friends at the end of a
// telephone line. The same in every setting.

import type { LifelineKind, Relationship } from '../engine/types'
import type { SettingPack, VoiceDef } from './schema'

/** Sergeant Pike's silhouette (see silhouettes.ts), the same in every setting. */
export const PIKE = 'pike'
/** His voice: a London one, bright and up and down, and a good deal louder than the household. */
export const PIKE_VOICE: VoiceDef = { pitch: 165, wave: 'sawtooth', lilt: 4, clip: 0.07, gain: 1.7, ring: 0.4 }

export interface LifelineDef {
  /** As it is found: "Sergeant Pike's whistle". */
  name: string
  /** What it does, in a line. */
  does: string
  /** An icon name (see Icon.vue). */
  icon: string
  /** The telegram's answer, as an exhibit: how it came ("wired from the Yard"). */
  came?: string
  /** The exhibit's name; {name} is the guest asked about. */
  about?: string
  /** The report's heading. */
  heading?: string
  /** The log's line when it comes; {name}. */
  logged?: string
  /** The notebook's line after; {name}. */
  noted?: string
}

/** How many more questions the coffee is good for. */
export const COFFEE_QUESTIONS = 5

export const LIFELINES: Record<LifelineKind, LifelineDef> = {
  pike: {
    name: 'Sergeant Pike’s whistle',
    does: 'Send Sergeant Pike to search a room for you. He reports back when the hour strikes.',
    icon: 'person',
  },
  coffee: {
    name: 'a flask of strong coffee',
    does: 'Five more questions this hour.',
    icon: 'clock',
  },
  telegram: {
    name: 'a telegraph form, for a wire to the Yard',
    does: 'Ask the Yard for a background check on one guest: how they truly stood with the victim.',
    icon: 'book',
    came: 'wired from the Yard',
    about: 'a wire from the Yard concerning {name}',
    heading: 'A wire from the Yard',
    logged: 'A wire from the Yard about {name}.',
    noted: 'The Yard wired about {name}: it is with your evidence.',
  },
  note: {
    name: 'a sealed note, unsigned',
    does: 'Somebody knows something, and would rather not say it to your face. Open it to read their hint.',
    icon: 'letter',
  },
  expert: {
    name: 'a card with a telephone number on it',
    does: 'Telephone an expert of your acquaintance about one guest you are unsure of.',
    icon: 'speech',
  },
}

/** A lifeline as a setting has it: the same everywhere, unless the pack says otherwise (the Yard does not wire itself). */
export function lifelineOf(pack: Pick<SettingPack, 'lifelineWords'>, kind: LifelineKind): LifelineDef {
  return { ...LIFELINES[kind], ...(pack.lifelineWords?.[kind] ?? {}) }
}

export type Pillar = 'means' | 'motive' | 'opportunity'

/** Sergeant Pike, called with his whistle: what he says when he comes, and when he is sent. */
export const PIKE_COMES = [
  'You called for me, {sir}?',
  'Sergeant Pike, {sir}. You blew for me?',
  'Here, {sir}. What’s wanted?',
]
/** {room} is where he is sent. */
export const PIKE_GOES = [
  'Very good, {sir}! Me and the boys will search {room} top to bottom. You have my word.',
  'Right you are, {sir}. {room}, top to bottom. I’ll have word for you when the hour strikes.',
  'Leave it with me, {sir}. If there’s anything in {room}, we’ll turn it up.',
]

/**
 * Sergeant Pike, with the note and the letter side by side: the note is not in
 * the dead man's hand. {letter} is the letter that gives it away; {victim} is
 * the dead man.
 */
export const PIKE_FORGERY = [
  '{sir}, look here. It’s close, but… yes, they’ve got the {letter}’s wrong, see? This suicide note is a forgery, alright!',
  'Look at the {letter}’s, {sir}. {victim} never made a {letter} like that in his life. Somebody wrote this note for him.',
  'Set them side by side, {sir}. A fair copy, I’ll grant you, but the {letter}’s give it away. That note’s a forgery, alright.',
]
/** The letters Pike might put his finger on. */
export const PIKE_LETTERS = ['T', 'L', 'F', 'G', 'B', 'W', 'R', 'M']

/** An old friend at the end of the line: a silhouette, a manner of speaking, and no name. */
export interface ExpertDef {
  /** A silhouette id (see silhouettes.ts). */
  who: string
  /** Never a name: who they are is for the player to guess. "An elderly lady". */
  name: string
  /** On picking up: who they are, and that you have a case. */
  hello: string
  /** Which of them? */
  ask: string
  /** Good luck, and the line goes dead. */
  goodbye: string
  /** On the count that clears them; {name} is the guest. */
  cleared: Record<Pillar, string>
  /** When nothing clears them. */
  none: string
}

export const EXPERTS: ExpertDef[] = [
  {
    who: 'pettigrew',
    name: 'An elderly lady',
    hello: 'Hello? Oh, Inspector! How very kind of you to think of me. You have a case, I expect. You always do.',
    ask: 'Now, which of them is it you are unsure about? Tell me, and I shall tell you what I think.',
    goodbye: 'There. Do be careful, Inspector. I’m sure you’ll find it out. Goodbye, dear.',
    cleared: {
      means:
        'It reminds me so of the curate’s nephew. He couldn’t have, you see, he simply hadn’t the means. Nor had {name}. Whatever was used tonight was never within their reach.',
      motive:
        'People are very much alike, wherever one goes, and one learns what makes them do things. {name} had no reason to wish {him} dead. None at all, whatever it may look like.',
      opportunity:
        '{name} was where they said they were, Inspector. I would stake my knitting on it. Whoever did this, it was not them. They simply were not there.',
    },
    none: 'I can’t put {name} out of it, I’m afraid, not on any count. That isn’t to say they did it. Only that I should watch them very closely indeed.',
  },
  {
    who: 'holt',
    name: 'A consulting gentleman',
    hello: 'Speaking. Ah, the Inspector. A case, and you are stuck in it. Naturally.',
    ask: 'Which of them troubles you? A name, Inspector. Be brief.',
    goodbye: 'That is all I can give you at this distance. Good hunting, Inspector.',
    cleared: {
      means:
        'Observe the method, Inspector, and then observe {name}. The one is not within reach of the other. You may strike them off.',
      motive:
        'Motive is the commonest thing in the world, and {name} has none. I have looked into it. They had nothing to gain by his death.',
      opportunity:
        '{name} could not have been at the scene. Eliminate the impossible, Inspector, and that, I assure you, is impossible.',
    },
    none: 'I cannot eliminate {name}: not on means, nor motive, nor the chance of it. Which proves nothing. But I should not take my eyes off them.',
  },
  {
    who: 'duval',
    name: 'A Belgian gentleman',
    hello: 'Allô? Ah, mon ami! You telephone me. You have a case, and it does not come out, hein?',
    ask: 'Tell me: of all of them, which is the one you are not sure of?',
    goodbye: 'Voilà. Use the little cells of the brain, mon ami. Bonne chance!',
    cleared: {
      means:
        'Order and method, my friend. The method of this crime. {name} could not have used it. Non. It is not possible.',
      motive:
        'The psychology, it is everything. And {name} had no cause to wish {him} harm. None. Of this I am quite certain.',
      opportunity:
        '{name} was not there, mon ami. At the hour, they were elsewhere, and I do not make mistakes about the hour.',
    },
    none: 'Hélas, I cannot clear {name}. On no count. It does not mean they are the guilty one, but watch them, mon ami. Watch them well.',
  },
]

/** The expert a night's telephone number reaches. */
export function expertFor(seed: number): ExpertDef {
  return EXPERTS[seed % EXPERTS.length]
}

/**
 * A guest's standing with the victim as the Yard would wire it: every word
 * paid for. {who} is the guest's surname, {victim} the victim's.
 */
const WIRED: Record<Relationship, string> = {
  devoted: '{who} DEVOTED TO {victim}',
  cordial: '{who} ON GOOD TERMS WITH {victim}',
  strained: '{who} ON BAD TERMS WITH {victim}',
  hostile: '{who} SWORN ENEMY OF {victim}',
  indebted: '{who} DEEP IN DEBT TO {victim}',
  jilted: '{who} JILTED BY {victim}',
  disinherited: '{who} TO BE CUT FROM {victim} WILL',
  beneficiary: '{who} GAINS BY {victim} NEW WILL',
  dismissed: '{who} TO BE DISMISSED BY {victim}',
  exposed: '{victim} ABOUT TO EXPOSE {who}',
  rival: '{who} BEING SQUEEZED OUT BY {victim}',
  forbidden: '{who} FORBIDDEN BY {victim} TO MARRY',
}

/** The Yard's wire: "RE BACKGROUND CHECK STOP FINCH ON GOOD TERMS WITH BLACKWOOD STOP". */
export function wire(guest: string, victim: string, rel: Relationship): string {
  const surname = (n: string) => n.replace(/[.’']/g, '').split(/\s+/).pop()!.toUpperCase()
  const line = WIRED[rel].replace('{who}', surname(guest)).replace('{victim}', victim.toUpperCase())
  return `RE BACKGROUND CHECK STOP ${line} STOP`
}

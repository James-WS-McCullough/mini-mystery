// Lines for the night the Mover has been at work: where it was truly done,
// told by those who heard the struggle there or saw the dead go in, and what
// the household makes of the room once the stain is found in it.
//
// The same rules as every other bank: a line may colour a claim and never add
// to it, and nothing here knows who is guilty. (A line never says the body was
// moved: only that it was here it happened. The detective puts the two together.)

import type { DialogueBanks } from '../schema'

export const moverLines: DialogueBanks = {
  // ---- heard the struggle, within the hour ----
  'claim.struggle.heard.any': [
    'During that hour I heard a struggle in {room}. A cry, and something heavy going over. I have not stopped hearing it.',
    'There was a scuffle in {room}, within the hour. Feet, a chair going over, and then nothing at all.',
    'I heard it, I think. In {room}: a voice raised, cut off, and a fall. Then quiet, which was worse.',
    'Something happened in {room} during that hour. I heard a struggle through the wall, and I told myself it was nothing.',
  ],
  'claim.struggle.heard.gracious': [
    'I am so sorry to say it, but I heard a struggle in {room} during the hour. A cry, and a fall. I wish to heaven I had gone to see.',
  ],
  'claim.struggle.heard.prickly': [
    'I heard a struggle in {room}. Within the hour. I assumed it was somebody else’s business, and I still wish it had been.',
  ],
  'claim.struggle.heard.gossipy': [
    'Well, I heard the whole thing, or the noise of it: a struggle in {room}, in the hour, a cry and a crash. Nobody else seems to have, which I find very odd.',
  ],
  'claim.struggle.heard.reserved': ['A struggle. In {room}, within the hour. I heard it.'],
  'claim.struggle.heard.dramatic': [
    'I heard it! A struggle in {room}, a cry that turned my blood, and then the most dreadful silence. I shall hear it till I die.',
  ],
  'claim.struggle.heard.deferential': [
    'If you will pardon me, {sir}, I heard a struggle in {room} during the hour. A cry, and a fall. It was not my place to go in, and I did not.',
  ],
  'claim.struggle.heard.boastful': [
    'I have the sharpest ears in {house}, and they heard a struggle in {room} during the hour. A cry and a fall. I should know a fight when I hear one.',
  ],
  'claim.struggle.heard.blunt': ['There was a struggle in {room}. In the hour. I heard it.', 'Somebody fought in {room}, within the hour. I heard a fall.'],
  'claim.struggle.heard.rambling': [
    'Now, I was not attending, not really, one hears all sorts at night, the pipes and so on, but I did hear a struggle in {room} during the hour, a cry and then a thump, like a wardrobe going over, only it was not a wardrobe, was it?',
  ],
  'claim.struggle.heard.cheeky': [
    'I heard a rumpus in {room}, within the hour. Thought somebody was having a lovely row. Rather wish now that they had been.',
  ],
  'claim.struggle.heard.hearty': [
    'Heard a dashed scuffle in {room}, during the hour! A cry and a crash. Thought it was horseplay. Wasn’t, was it?',
  ],
  'claim.struggle.heard.official': [
    'I wish to state that during the hour I heard sounds of a struggle from {room}: a cry, and a fall. I did not go in. I note the room, {sir}.',
  ],
  'claim.struggle.heard.theatrical': [
    'I heard it, darling, through the wall: a struggle in {room}, in the hour. A cry and a fall, like the end of the second act, only nobody got up.',
  ],
  'claim.struggle.heard.donnish': [
    'I heard, within the hour, what can only have been a struggle in {room}: a cry, and the fall of something heavy. Post hoc, I fear, it admits of one reading.',
  ],
  'claim.struggle.heard.cockney': [
    'I heard a right old scuffle in {room}, {sir}, in the hour. Shout, then a thump. I never went in. Wish I had.',
  ],

  // ---- saw the dead go in, and never come out ----
  'claim.struggle.saw.any': [
    'I saw {victim} go into {room} during the hour. I never saw {him} come out again.',
    'The last I saw of {victim}, {he} was going into {room}, within the hour. {He} did not come out while I was by.',
    '{victim} went into {room} in that hour. I watched {him} shut the door. That was the last of {him} I saw.',
  ],
  'claim.struggle.saw.gracious': [
    'I saw {victim} go into {room} during the hour, and thought nothing of it. {He} never came out. I cannot forgive myself for thinking nothing.',
  ],
  'claim.struggle.saw.prickly': ['{victim} went into {room} in the hour. I saw {him} go. I did not see {him} again, and nor did anybody else, alive.'],
  'claim.struggle.saw.gossipy': [
    'I saw {victim} slip into {room} during the hour, and I did wonder who {he} was meeting there. {He} never came out, not while I was watching, and I was watching.',
  ],
  'claim.struggle.saw.reserved': ['{victim} went into {room} in the hour. I did not see {him} come out.'],
  'claim.struggle.saw.dramatic': [
    'I saw {victim} go into {room}, in the hour, and the door close behind {him} like a coffin lid. {He} never came out!',
  ],
  'claim.struggle.saw.deferential': [
    'I saw {victim} go into {room} during the hour, {sir}. I did not see {him} come out, and I was in the passage some while.',
  ],
  'claim.struggle.saw.boastful': [
    'I miss nothing, and I did not miss this: {victim} went into {room} during the hour, and never came out again.',
  ],
  'claim.struggle.saw.blunt': ['{victim} went into {room} in the hour. Never came out.'],
  'claim.struggle.saw.rambling': [
    'I saw {victim} go into {room}, oh, within the hour it must have been, because the clock had not yet gone, and I thought, there {he} goes, and I meant to ask {him} something, and then {he} never came out, and I never did ask.',
  ],
  'claim.struggle.saw.cheeky': [
    'I saw {victim} pop into {room} during the hour. Never popped out again, did {he}? Not on {his} own feet.',
  ],
  'claim.struggle.saw.hearty': ['Saw {victim} go into {room} during the hour, I did! Never came out again. Shocking business.'],
  'claim.struggle.saw.official': [
    'I observed {victim} enter {room} during the hour. I did not observe {him} leave. I make no further statement as to the room, {sir}.',
  ],
  'claim.struggle.saw.theatrical': [
    'I saw {victim} make an entrance into {room}, darling, in the hour. And no exit. {He} never came out.',
  ],
  'claim.struggle.saw.donnish': [
    'I saw {victim} enter {room} during the hour, and I did not see {him} leave it. Absence of evidence, I grant you; but I was there a good while.',
  ],
  'claim.struggle.saw.cockney': ['Saw {victim} go into {room} in the hour, {sir}. Never come out again, not that I saw.'],

  // ---- shown where it was truly done ----
  'evidence.trueScene.any': [
    'That is blood, or was, before somebody went at it with a cloth. Then it was here, and not where we found {him}.',
    'Marks to the door, as if something heavy were dragged. Somebody moved {him}, then. It was not I.',
    'Scrubbed, and not well enough. Somebody did a deal of tidying in here tonight, and I should like to know who.',
    'So it happened in here. Then whoever put {him} where {he} was found had strong arms and a strong stomach, and neither is mine.',
  ],
  'evidence.trueScene.gracious': [
    'Oh, how dreadful. It was here, then, and somebody carried {him} away afterwards like a parcel. Who could do such a thing?',
  ],
  'evidence.trueScene.prickly': ['A stain somebody scrubbed at. Here, then, not where we found {him}. Do not look at me as though I hold the scrubbing brush.'],
  'evidence.trueScene.gossipy': [
    'Here! It was done in here all along, and somebody dragged {him} off to be found elsewhere. Now who among us has that sort of nerve? I can think of one or two.',
  ],
  'evidence.trueScene.reserved': ['Here, then. Somebody moved {him}. Not I.'],
  'evidence.trueScene.dramatic': [
    'Here! It was here, and somebody dragged {him} away and laid {him} out somewhere else to deceive us all. It is monstrous!',
  ],
  'evidence.trueScene.deferential': [
    'I am sorry to say that is a stain, {sir}, and somebody has been at it with a cloth. And marks to the door. I did none of it, if you will pardon my saying so.',
  ],
  'evidence.trueScene.boastful': [
    'I could have told you there was something wrong with this room. A stain scrubbed and the marks of dragging: somebody has moved {him}, and made a poor job of the tidying.',
  ],
  'evidence.trueScene.blunt': ['It was done here. Somebody moved {him}. Not me.', 'Blood, scrubbed. Dragged to the door. Someone moved {him}.'],
  'evidence.trueScene.rambling': [
    'A stain, is it? My mother always said cold water, never hot, for that sort of thing, and somebody has used hot, you can see the edge of it. And those marks, as if a trunk had gone to the door, only it was not a trunk, was it? It was {him}.',
  ],
  'evidence.trueScene.cheeky': [
    'Somebody’s been doing the housework, and badly. And dragged {him} out by the heels, by the look of those marks. Rather rude of them.',
  ],
  'evidence.trueScene.hearty': [
    'Good lord! It was done in here, and somebody hauled {him} off afterwards. Strong fellow, whoever it was. Not me, I promise you.',
  ],
  'evidence.trueScene.official': [
    'A stain, partially removed, and drag marks to the door. The deceased was moved from this room after death, {sir}. I have no knowledge of who moved {him}.',
  ],
  'evidence.trueScene.theatrical': [
    'A change of scene, darling! It was done here, and somebody struck the set and carried {him} off to be found in another. Not my staging.',
  ],
  'evidence.trueScene.donnish': [
    'A stain imperfectly removed, and the furrows of dragging. Locus delicti, then: here, and not where {he} was found. Somebody has rearranged the evidence; I have not.',
  ],
  'evidence.trueScene.cockney': [
    'That’s blood, {sir}, scrubbed at. And them marks is where {he} was dragged. Somebody shifted {him}, and it weren’t me.',
  ],
}

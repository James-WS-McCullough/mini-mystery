// Lines for the nights when the murderer has a friend in the house: a witness
// paid to say nothing, an honest guest who takes back a story that was never
// theirs, a scene with the weapon gone from it, and money with a name on it.
//
// The same rules as every other bank: a line may colour a claim and never add
// to it, and nothing here knows who is guilty.

import type { DialogueBanks } from '../schema'

export const helperLines: DialogueBanks = {
  // ---- claims ----
  'claim.bribed': [
    '{target} paid me to hold my tongue. There: that is the whole of it.',
    'I was paid to say nothing, and it was {target} who paid.',
    'The money came from {target}. I took it, and I kept quiet, and I am ashamed of both.',
    'It was {target}. {target} put money in my hand and asked me to have seen nothing.',
    '{target} bought my silence. I did not ask why it was worth so much.',
  ],
  'claim.toldBy': [
    'I did not see it myself. {target} told me so, and I took it for the truth.',
    'It was {target} who told me. I never saw it with my own eyes.',
    'I had it from {target}. I ought to have said so at the first.',
    'That was {target}’s account, and not mine. I only repeated it.',
    '{target} said it was so, and I believed it. I was not there to see.',
  ],
  'claim.silent': [
    'Of what I know, I have nothing to tell you.',
    'I have nothing to say on that head.',
    'There is nothing I can tell you.',
  ],

  // ---- asked who they are and what they know, and paid to say nothing ----
  'knowledge.silent.any': [
    'I will tell you what I am, and there I stop. Of the rest I have nothing to say.',
    'You may have my name for it, and welcome. What goes with it, I shall keep to myself.',
    'I can tell you who I am. I cannot tell you more than that, and I would rather you did not ask.',
    'What I am is no secret. What I know by it is nothing that would help you.',
  ],
  'knowledge.silent.gracious': [
    'I do wish I could be of more use. I can tell you what I am; beyond that I have nothing for you, and I am sorry for it.',
    'Forgive me. You shall have who I am, and I must leave it there.',
  ],
  'knowledge.silent.prickly': [
    'You may have what I am and not a syllable more. I have nothing to tell you.',
    'I know what you are after, and you will not get it from me. Here is who I am; be content.',
  ],
  'knowledge.silent.gossipy': [
    'Now, ordinarily I should talk your ear off, but not tonight, and not about this. I will say who I am and nothing else.',
    'You will think it unlike me, but I have nothing to tell. Who I am, yes. The rest, no.',
  ],
  'knowledge.silent.reserved': ['Who I am, you may have. Nothing more.', 'I have nothing to tell.'],
  'knowledge.silent.dramatic': [
    'My lips are sealed! You shall know what I am, and there the curtain falls.',
    'Ask me who I am and I will answer. Ask me what I know, and I am a closed book, {detective}, a closed book!',
  ],
  'knowledge.silent.deferential': [
    'I can say what I am, {sir}, and I’d as soon leave it there. I’ve nothing to tell.',
    'Begging your pardon, {sir}, there’s nothing I can tell you. Only who I am.',
  ],
  'knowledge.silent.boastful': [
    'One in my position knows when to keep counsel. You may have who I am. The rest stays with me.',
    'I could tell you a great deal, I dare say, and I choose not to. Here is who I am.',
  ],
  'knowledge.silent.blunt': ['I’ll say who I am. Nothing else. Don’t ask.', 'Nothing to tell. That’s who I am, and that’s all.'],
  'knowledge.silent.rambling': [
    'Well, now, what I am I can tell you readily enough, that is no trouble at all, but as to what I know by it, no, I think not, I think I had better say nothing, nothing whatever.',
    'I have turned it over and over, and the long and the short of it is that I can tell you who I am and must stop there, if you will forgive me.',
  ],
  'knowledge.silent.cheeky': [
    'Who I am? Free of charge. What I know? Shop’s shut, {detective}.',
    'You can have my name for it. The rest I’m keeping, and you needn’t look at me like that.',
  ],

  // ---- shown the scene with the weapon gone ----
  'evidence.bare.any': [
    'Then whatever did it has been carried away. Somebody has tidied up after the murderer.',
    'Nothing left to say how it was done? Then somebody took it, and took it somewhere.',
    'A murder, and nothing it was done with. It did not walk out of the room by itself.',
    'Somebody has been there before you, {detective}, and taken what you were looking for.',
  ],
  'evidence.bare.gracious': [
    'How very strange. Then somebody must have taken it away. I cannot think where.',
    'Nothing at all? Oh dear. Then it has been hidden, and I am afraid I cannot help you find it.',
  ],
  'evidence.bare.prickly': [
    'Then somebody has cleared up after the murderer. Do not look at me; I do not fetch and carry.',
    'Taken away, was it? Then look for it, and leave me be.',
  ],
  'evidence.bare.gossipy': [
    'Gone? Whatever did it is gone? Then somebody has hidden it, and I should dearly like to know who.',
    'Well! Somebody has been tidying, and not out of neatness. It will be somewhere {inThisHouse}.',
  ],
  'evidence.bare.reserved': ['Taken away, then. By somebody.', 'It will be elsewhere {inHouse}.'],
  'evidence.bare.dramatic': [
    'Vanished! The very instrument of death, spirited away, and by whose hand?',
    'Nothing! The room keeps its secret, and somebody {inThisHouse} is keeping it too!',
  ],
  'evidence.bare.deferential': [
    'Then somebody’s taken it off, {sir}. It’ll be {inHouse} somewhere.',
    'Nothing there, {sir}? It’s been cleared away, then, and not by any of us that ought to.',
  ],
  'evidence.bare.boastful': [
    'Plain as day: somebody carried it off. I should have seen that at once, in your place.',
    'Removed, of course. Any fool can see the murderer had help.',
  ],
  'evidence.bare.blunt': ['Somebody took it. Find where.', 'Cleared away. It’s {inHouse} somewhere.'],
  'evidence.bare.rambling': [
    'Nothing at all to show how, you say, then it stands to reason somebody took it away, and if somebody took it away it must have been put down again somewhere, mustn’t it.',
    'Dear me, a thing like that does not vanish, somebody has carried it off and hidden it, that is what I should suppose, though I could not say where.',
  ],
  'evidence.bare.cheeky': [
    'Somebody’s been tidying. First time anyone’s done that {inThisHouse} without being told.',
    'Gone walkabout, has it? Then somebody walked it.',
  ],

  // ---- shown the money with somebody else's name on it ----
  'evidence.bribe.any': [
    'That is a good deal of money to find lying about. It has a name on it, and the name is not mine.',
    'Somebody has been paid for something. You can read whose name that is as well as I can.',
    'I know nothing of it. I should ask the one whose name is on it.',
    'Money, and a name. I would put the one to the other, {detective}.',
  ],
  'evidence.bribe.gracious': [
    'Oh, I should not like to think what that was for. It is not mine; you see whose name it bears.',
    'I am sure there is some explanation. You had better ask the person named.',
  ],
  'evidence.bribe.prickly': [
    'It is not addressed to me, and I do not read other people’s envelopes. Ask whoever it is for.',
    'Somebody has been bought. Not I. Read the name.',
  ],
  'evidence.bribe.gossipy': [
    'Now THAT is interesting. All that money, and a name on it, and what, I wonder, was it for?',
    'Well, I never. Somebody has been paid, and you can see who. I should ask what for.',
  ],
  'evidence.bribe.reserved': ['Not mine. Read the name.', 'Ask the one it is addressed to.'],
  'evidence.bribe.dramatic': [
    'Money! In an envelope! With a name! Somebody’s honour has been bought tonight, {detective}!',
    'Thirty pieces of silver, and there is the name of the one who took them!',
  ],
  'evidence.bribe.deferential': [
    'That’s more than I see in a year, {sir}. It’s not for me. There’s the name on it.',
    'I wouldn’t know about that, {sir}. You’d best ask who it’s made out to.',
  ],
  'evidence.bribe.boastful': [
    'A paltry sum, to my eye, but enough to buy somebody. The name is there; ask.',
    'I have no need of anybody’s envelopes. That one has its owner written on it.',
  ],
  'evidence.bribe.blunt': ['Somebody’s been paid. Name’s on it. Ask them.', 'Not mine. Read it.'],
  'evidence.bribe.rambling': [
    'An envelope of money, well, and with a name upon it too, which is not my name, so I can tell you nothing, but I should think the person named could tell you a good deal.',
    'Now who leaves money about like that? Somebody who has paid for something, I suppose, and there is the name of whoever was paid.',
  ],
  'evidence.bribe.cheeky': [
    'Nobody ever leaves ME envelopes like that. There’s a name on it. Go and ask.',
    'Somebody’s done well out of tonight. Not me, worse luck. Read the name.',
  ],

  // ---- pressed: the bought witness gives way ----
  'press.bribed.any': [
    'Very well. I took the money, and I have been sorry ever since. You shall have all of it.',
    'You have found it, then. Yes, I was paid. I will tell you by whom, and then I will tell you what I was paid not to.',
    'I am done with it. I would sooner give the money back than carry this another hour.',
  ],
  'press.bribed.indignant': [
    'Yes! I was paid, and what of it? No. No, you are right. You shall have what I kept back.',
  ],
  'press.bribed.flustered': [
    'Oh— oh, you found it. I never meant— yes, I took it, I took it, and I will tell you everything.',
  ],
  'press.bribed.calm': [
    'Yes. I accepted money to say nothing. I should not have, and I will say it now.',
  ],
  'press.bribed.selfdoubting': [
    'I told myself it could not matter. I see now that it must have. Let me tell you what I ought to have told you at the start.',
  ],

  // ---- pressed: an honest guest takes back what was never theirs ----
  'press.recant.any': [
    'You are right to press me. I said I saw it, and I did not.',
    'I must take that back. I gave it to you as my own, and it was not mine to give.',
    'No, I cannot stand by it. I was not there, and I spoke as if I had been.',
  ],
  'press.recant.indignant': [
    'I do NOT tell lies! I repeated one, it seems. That is a different thing, and I will put it right.',
  ],
  'press.recant.flustered': [
    'Oh— I— no, I never saw it. I only— I was told, and I thought… oh, what have I done.',
  ],
  'press.recant.calm': [
    'Then I was misled, and I have misled you. I did not see it. I will tell you how I came to say so.',
  ],
  'press.recant.selfdoubting': [
    'I was so sure. But I was sure of somebody else’s word, not of my own eyes. I see that now.',
  ],
}

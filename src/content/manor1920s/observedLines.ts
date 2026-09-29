// What the Observer can say of the murderer when it is not a habit of theirs
// but whether they are a man or a woman, and what the Steward says of the two
// they had an eye on. `{sex}` is "a man" or "a woman"; `{pair}` is two names;
// `{howMany}` is "neither of them is", "one of them is", "both of them are".

import type { DialogueBanks } from '../schema'

export const observedLines: DialogueBanks = {
  'claim.culpritAttr.sex': [
    'I cannot give you a name. I can give you this: it was {sex} who did it.',
    'Mark me: you are looking for {sex}.',
    'Ask me how I know and I shall only shrug. But the murderer is {sex}.',
    'Of this much I am certain: it was {sex}. Strike out the rest.',
    'It was {sex}. I would wager the house on it.',
    'Whatever else is in doubt, this is not: the killer is {sex}.',
  ],
  'claim.culpritAttr.sex.gracious': [
    'I hope it is of some use to you: I am quite sure it was {sex}.',
    'I would not say it if I were not certain. The one you want is {sex}.',
  ],
  'claim.culpritAttr.sex.prickly': [
    'It was {sex}. There. Do something with it.',
    'You want {sex}. I should have thought that was plain enough by now.',
  ],
  'claim.culpritAttr.sex.gossipy': [
    'Now, I ought not to say — but it was {sex}. I am as sure of it as I am of anything.',
    'Between ourselves, you are looking for {sex}. I said as much the moment I heard.',
  ],
  'claim.culpritAttr.sex.reserved': ['It was {sex}.', '{sex}. No more than that.'],
  'claim.culpritAttr.sex.dramatic': [
    'It was {sex}! I feel it in my very bones — {sex} did this dreadful thing!',
    'Look among us for {sex}, {detective}, and you will be looking at a murderer!',
  ],
  'claim.culpritAttr.sex.deferential': [
    'It was {sex}, {sir}. I’d not say so if I wasn’t sure.',
    'If you please, {sir}, you’re looking for {sex}. That much I do know.',
  ],
  'claim.culpritAttr.sex.boastful': [
    'It was {sex}. I saw that at once; I have an eye for these things.',
    'You want {sex}. I worked that out before the soup was cold.',
  ],
  'claim.culpritAttr.sex.blunt': ['It was {sex}. That’s all.', 'You want {sex}. Go and find which.'],
  'claim.culpritAttr.sex.rambling': [
    'Now I could not tell you who, not for the world, but I can tell you it was {sex}, of that I am quite certain, quite certain indeed.',
    'It was {sex} — I have gone over it and over it and I come back to the same thing every time, it was {sex}.',
  ],
  'claim.culpritAttr.sex.cheeky': [
    'It was {sex}. Narrows it down a bit, doesn’t it?',
    'You’re after {sex}. Don’t say I never give you anything.',
  ],

  'claim.liarsAmong': [
    'I had my eye on {pair} all evening, and I know them. {howMany} lying to you about where they were.',
    'You will have asked {pair} where they spent the hour. I watched them both tonight: {howMany} lying to you about it.',
    'Mark these two: {pair}. {howMany} giving you a false account of that hour.',
    'I cannot tell you where anybody was. I can tell you this of {pair}: {howMany} lying about it.',
    'One learns a good deal by watching. Of {pair}, {howMany} lying about where they were.',
    'Ask {pair} where they were, and then remember what I tell you now: {howMany} lying.',
  ],
  'claim.liarsAmong.reserved': ['{pair}. {howMany} lying about that hour.'],
  'claim.liarsAmong.dramatic': [
    'I watched {pair} as a hawk watches — and I tell you, {howMany} lying about that hour!',
  ],
  'claim.liarsAmong.deferential': [
    'I kept an eye on {pair} tonight, {sir}, as is my place. {howMany} lying about where they were.',
  ],
  'claim.liarsAmong.blunt': ['{pair}. I watched them. {howMany} lying about where they were.'],
  'claim.liarsAmong.cheeky': [
    'I’ve been watching {pair}. Don’t tell them. {howMany} lying about where they were.',
  ],
}

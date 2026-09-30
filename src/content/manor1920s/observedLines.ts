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

  // ---- the Architect: `{scene}` is where it was done, `{room}` where the passage leads ----
  'claim.passage': [
    'There is a passage in the wall of {scene}. It comes out in {room}.',
    'I know this house. From {scene} a passage runs behind the panelling to {room}.',
    'You will not find it on any plan: a way through the wall, from {scene} to {room}.',
    'Whoever was in {room} could have been in {scene} and back with nobody the wiser. There is a passage.',
    '{scene} and {room} are joined behind the walls. I have seen the drawings.',
  ],
  'claim.passage.reserved': ['A passage. {scene} to {room}.'],
  'claim.passage.dramatic': [
    'The walls of this house are hollow, {detective}! From {scene} a passage runs — to {room}!',
  ],
  'claim.passage.deferential': [
    'There’s a way through the wall, {sir}, from {scene} to {room}. The old master had it made.',
  ],
  'claim.passage.blunt': ['There’s a passage. {scene} to {room}. Go and look.'],
  'claim.passage.cheeky': [
    'Want to know a secret? There’s a passage from {scene} to {room}. Don’t say who told you.',
  ],

  // ---- shown the passage ----
  'evidence.passage.any': [
    'A passage! Then whoever was in that room could have come and gone as they pleased.',
    'So the old stories were true. I should ask who spent the hour at the end of it.',
    'I never knew of it. But it alters things, does it not, for whoever was in that room.',
    'Then a shut door proves nothing in this house.',
  ],
  'evidence.passage.gracious': [
    'Good heavens. I had no idea. I hope it does not make things harder for anybody innocent.',
    'How extraordinary. I am afraid I never knew it was there.',
  ],
  'evidence.passage.prickly': [
    'A hole in the wall. And what am I to say to that? I did not build the house.',
    'Then ask whoever was at the end of it, and not me.',
  ],
  'evidence.passage.gossipy': [
    'I KNEW there was one! They always said so below stairs. Now, who was in that room?',
    'A secret passage — well! And somebody sitting at the end of it all the while, I dare say.',
  ],
  'evidence.passage.reserved': ['A passage. I did not know of it.', 'Then ask who was in that room.'],
  'evidence.passage.dramatic': [
    'The very walls conspire! A passage — a secret way — and death came creeping down it!',
    'I shall never sleep in this house again. A passage, behind the panelling!',
  ],
  'evidence.passage.deferential': [
    'I never knew of that, {sir}, and I’ve dusted that panelling many a time.',
    'A passage, {sir}? Then there’s no telling who went where.',
  ],
  'evidence.passage.boastful': [
    'I suspected as much. A house of this age always has one; I could have told you.',
    'Naturally there is a passage. I should have found it sooner, in your place.',
  ],
  'evidence.passage.blunt': ['A passage. So somebody could have used it.', 'News to me. Ask who was in that room.'],
  'evidence.passage.rambling': [
    'A passage, in the wall, well I never, though now I think of it there was always a draught in that room, a draught nobody could account for, and there you have it.',
    'Dear me, a way through the wall, and nobody knowing — or somebody knowing, I suppose, that is rather the point, is it not.',
  ],
  'evidence.passage.cheeky': [
    'A secret passage! This house gets better and better. Shame about the murder.',
    'Well, that’s one way to skip the stairs. Who was sat at the end of it?',
  ],

  // ---- the Discoverer: the door, as it was found ----
  'claim.door.locked': [
    'It was I who found him. The door of {room} was locked — from the inside. I had to have it broken.',
    'I found him, you know. And I will tell you what I have told nobody: the door was locked on the inside, and the key in it.',
    'The door of {room} was fast when I came to it, and the key turned on the far side. Whoever left that room did not leave by the door.',
    'I knocked, and knocked, and then I put my shoulder to it. Locked from within. He was alone in there — and yet he was not.',
  ],
  'claim.door.open': [
    'It was I who found him. The door of {room} stood open — wide open — and the lamp still burning.',
    'I found him. I want that understood. The door was open; anybody might have walked in, and somebody did.',
    'The door of {room} was standing open when I came along the passage. That is how I saw him.',
    'I went in because the door was open, and I saw at once. Nothing locked, nothing forced. Whoever did it walked out the way they came.',
  ],
  'claim.door.locked.reserved': ['I found him. The door was locked from the inside.'],
  'claim.door.open.reserved': ['I found him. The door stood open.'],
  'claim.door.locked.dramatic': [
    'Locked! Locked from within, {detective}, with the key still in it — and a dead man on the other side, and no living soul! I had it broken down.',
  ],
  'claim.door.open.dramatic': [
    'The door stood open like a mouth, and I saw him from the corridor and could not move for a full minute!',
  ],
  'claim.door.locked.deferential': [
    'I found him, {sir}. The door was locked on the inside, {sir}; I had to fetch the keys, and they were no use, the key being in the lock.',
  ],
  'claim.door.open.deferential': [
    'I found him, {sir}. The door was open — I only looked in to see to the fire.',
  ],
  'claim.door.locked.cheeky': [
    'I found him. Door locked from the inside, key in it, and nobody in there but him. Work that one out.',
  ],
  'claim.door.open.cheeky': [
    'I found him. Door wide open, if you’re wondering. No locked-room nonsense for us.',
  ],
}

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
    'It was {sex}. I would wager {house} on it.',
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
    'Now, I ought not to say, but it was {sex}. I am as sure of it as I am of anything.',
    'Between ourselves, you are looking for {sex}. I said as much the moment I heard.',
  ],
  'claim.culpritAttr.sex.reserved': ['It was {sex}.', '{sex}. No more than that.'],
  'claim.culpritAttr.sex.dramatic': [
    'It was {sex}! I feel it in my very bones. {sex} did this dreadful thing!',
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
    'It was {sex}. I have gone over it and over it and I come back to the same thing every time, it was {sex}.',
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
    'I watched {pair} as a hawk watches, and I tell you, {howMany} lying about that hour!',
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
    'I know {thisHouse}. From {scene} a passage runs behind the panelling to {room}.',
    'You will not find it on any plan: a way through the wall, from {scene} to {room}.',
    'Whoever was in {room} could have been in {scene} and back with nobody the wiser. There is a passage.',
    '{scene} and {room} are joined behind the walls. I have seen the drawings.',
  ],
  'claim.passage.reserved': ['A passage. {scene} to {room}.'],
  'claim.passage.dramatic': [
    'The walls of {thisHouse} are hollow, {detective}! From {scene} a passage runs to {room}!',
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
    'Then a shut door proves nothing {inThisHouse}.',
  ],
  'evidence.passage.gracious': [
    'Good heavens. I had no idea. I hope it does not make things harder for anybody innocent.',
    'How extraordinary. I am afraid I never knew it was there.',
  ],
  'evidence.passage.prickly': [
    'A hole in the wall. And what am I to say to that? I did not build {house}.',
    'Then ask whoever was at the end of it, and not me.',
  ],
  'evidence.passage.gossipy': [
    'I KNEW there was one! They always said so in {household}. Now, who was in that room?',
    'A secret passage, well! And somebody sitting at the end of it all the while, I dare say.',
  ],
  'evidence.passage.reserved': ['A passage. I did not know of it.', 'Then ask who was in that room.'],
  'evidence.passage.dramatic': [
    'The very walls conspire! A passage, a secret way, and death came creeping down it!',
    'I shall never sleep {inThisHouse} again. A passage, behind the panelling!',
  ],
  'evidence.passage.deferential': [
    'I never knew of that, {sir}, and I’ve dusted that panelling many a time.',
    'A passage, {sir}? Then there’s no telling who went where.',
  ],
  'evidence.passage.boastful': [
    'I suspected as much. I could have told you there was one.',
    'Naturally there is a passage. I should have found it sooner, in your place.',
  ],
  'evidence.passage.blunt': ['A passage. So somebody could have used it.', 'News to me. Ask who was in that room.'],
  'evidence.passage.rambling': [
    'A passage, in the wall, well I never, though now I think of it there was always a draught in that room, a draught nobody could account for, and there you have it.',
    'Dear me, a way through the wall, and nobody knowing, or somebody knowing, I suppose, that is rather the point, is it not.',
  ],
  'evidence.passage.cheeky': [
    'A secret passage! {thisHouse} gets better and better. Shame about the murder.',
    'Well, that’s one way to skip {passage}. Who was sat at the end of it?',
  ],

  // ---- the Discoverer: what he said, or did, at the last ----
  // Cryptic, and each a different way of saying one thing. `{victim}` is the
  // dead man; nobody else is named.
  'claim.dying.he': [
    'I found {him} still breathing. {he} gripped my sleeve and got out three words: “{he}… won’t… get…” and that was all.',
    '{he} was alive when I reached {him}, just. “Stop {him},” {he} said. “Stop {him}.” Then nothing.',
    '{his} lips were moving. I bent down. “The man,” {he} said, “the man…” and could not finish.',
    '{he} looked past me at the door, and said quite clearly, “{he}’s still {inHouse}.” I have not slept since.',
  ],
  'claim.dying.she': [
    'I found {him} still breathing. {he} got out three words, and I have them exactly: “S— she… she killed…”',
    '{he} was alive when I reached {him}. {he} said, “Her. It was her.” I asked who, and {he} was gone.',
    '{his} lips were moving. I bent down. “That woman,” {he} said, and I could not get another word.',
    '{he} caught at my hand and said, “Don’t let her…” and that was the end of it.',
  ],
  'claim.dying.cane': [
    '{he} could not speak. But {his} hand was tapping on the floor, tap, tap, tap, like a walking-stick coming along, and {his} eyes were on mine while {he} did it.',
    '{he} had no voice left. {he} rapped {his} knuckles on the boards, over and over, the way a walking-stick goes along {passage}. {he} wanted me to understand.',
    'I found {him} still living. {he} did not speak; {he} beat the floor with {his} fist in a slow, even knock, three times, and looked at me, and beat it again.',
  ],
  'claim.dying.smoker': [
    '{he} was alive when I reached {him}. {he} said one word, and I would swear to it: “Tobacco.”',
    '{his} lips were moving. I bent down. “Smoke,” {he} said. “The smell of…” and that was all.',
    'I found {him} still breathing. {he} drew a breath as if to speak and coughed instead, and said “ash… ash…” and was gone.',
  ],
  'claim.dying.gloves': [
    '{he} was alive when I reached {him}. {he} plucked at {his} own fingers, at the ends of them, and said, “Gloves. The gloves.”',
    '{his} lips were moving. I bent down. “The smooth gloves,” {he} said, “so smooth…” and could not finish.',
    'I found {him} still breathing. {he} took my hand and turned it over and stroked the back of it, as if {he} were feeling for something on it, and said, “Kid.” Kid leather, I think {he} meant.',
  ],
  'claim.dying.spectacles': [
    '{he} could hardly speak. {he} made a circle of {his} finger and thumb and held it to {his} eye, and looked at me through it, and let {his} hand fall.',
    'I found {him} still living. {he} said, “Glass, the glass,” and touched {his} own eyes, and I did not understand {him} until afterwards.',
    '{his} lips were moving. I bent down. “The lenses,” {he} said. “I saw myself in…” and that was all.',
  ],
  'claim.dying.perfume': [
    '{he} could not speak. {he} looked at me, and laid one finger along the side of {his} nose, and tapped it, twice, slowly, as if to say: use this.',
    'I found {him} still breathing. {he} drew in a long breath through {his} nose, and held my eye, and did it again, and I understood {him} to mean the air itself had something in it.',
    '{his} lips were moving. I bent down. “Smell,” {he} said. “The… smell.” And {he} touched {his} nose, and that was all.',
  ],

  // ---- the Observer: somebody in the corridor ----
  'claim.passing': [
    'I was first along {passage} after it was done, and I passed {target} coming away from {room}. Make of that what you will.',
    'One thing: just after, I met {target} in the passage outside {room}, walking quickly. I thought nothing of it at the time.',
    'I saw {target} coming from the direction of {room} not five minutes after it must have happened. It may mean nothing.',
    'As I came along {passage}, {target} was leaving it, from the end where {room} is. I say it because you asked, not because I am sure it signifies.',
  ],
  'claim.passing.reserved': ['I passed {target} outside {room}, just after. That is all.'],
  'claim.passing.dramatic': [
    'I met {target} in {passage}, coming from {room}, and there was a look on that face I shall carry to my grave!',
  ],
  'claim.passing.deferential': [
    'I passed {target} in the passage by {room}, {sir}, just after it must have been done. I don’t say it means anything, {sir}.',
  ],
  'claim.passing.cheeky': [
    'Funny thing: I bumped into {target} outside {room} not long after. Probably nothing. Probably.',
  ],
}

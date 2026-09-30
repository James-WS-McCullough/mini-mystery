// What is said on the nights when the murderer does more than lie: a second
// body at ten o'clock, and somebody on their feet at the last, saying it was
// them.
//
// The confession is ONE bank. Whoever says it — the murderer who cannot bear
// it, or the one who means to hang in their place — says it in the same words.

import type { DialogueBanks } from '../schema'

export const murdererLines: DialogueBanks = {
  'claim.confession': [
    'I killed {victim}.',
    'It was I who killed {victim}.',
    'I did it. I killed {victim}, and nobody else had any hand in it.',
    '{victim} died by my hand.',
  ],

  // ---- standing up, before anybody is named ----
  'confession.any': [
    'Stop. Before you name anybody — it is my name you want.',
    'I cannot sit here and watch you point at somebody else. You need not look any further.',
    'No. No more of this. I have carried it all evening and I will not carry it past midnight.',
    'Put your notes away, {detective}. I will save you the trouble.',
  ],
  'confession.gracious': [
    'Forgive me, all of you. I cannot let this go on, and I cannot let anybody else answer for it.',
    'I am so very sorry. You have all been kind, and I have sat among you all evening knowing what I knew.',
  ],
  'confession.prickly': [
    'Oh, enough. You have pecked at every one of us all night. Here is what you wanted.',
    'Spare us the speech. You want a name, and I am tired of watching you hunt for it.',
  ],
  'confession.gossipy': [
    'I have told you a great deal tonight, and none of it was the thing that mattered. I will tell you now.',
    'You will hear it from somebody before morning, so you had better hear it from me.',
  ],
  'confession.reserved': ['Wait. It is my name you want.', 'There is no need. I will say it.'],
  'confession.dramatic': [
    'Stop! I can bear it no longer — the clock, the faces, the waiting! Hear me, all of you!',
    'Let it end here! Let it end with me, on my feet, and not dragged from my chair!',
  ],
  'confession.deferential': [
    'Begging your pardon, {sir}. I can’t let you name anybody. It wouldn’t be right.',
    'If you please, {sir} — don’t. There’s something I’ve to say first, and it’ll save you the rest.',
  ],
  'confession.boastful': [
    'You would never have had it out of me, you know. I tell you of my own accord, and let that be remembered.',
    'I could have sat through your little summing-up without a flicker. I choose not to.',
  ],
  'confession.blunt': ['Stop. It was me.', 'Don’t bother. I’ll tell you who.'],
  'confession.rambling': [
    'I had thought I might get through the night, I truly had, and then the clock struck and I found I could not, I simply could not sit here a moment longer and say nothing.',
    'Before you begin — and I am sorry to interrupt, I know you have it all prepared — there is something I must say, and I had better say it now or I never shall.',
  ],
  'confession.cheeky': [
    'Well, this has been fun, but I can’t let you make a fool of yourself. Sit down, {detective}.',
    'Go on, put the finger away. I’ll do this bit for you.',
  ],

  // ---- the last thing they said: a door opening, and somebody in it ----
  // Whoever came in is never described: not by name, nor by he or she.
  'lastWords.any': [
    'Oh — I didn’t hear you come in. Is something the matter?',
    'Yes? …I thought everybody had gone up.',
    'You? What are you doing down here at this hour?',
    'Oh, it’s you. I was going to speak to the detective in the morning, you know. About what I saw.',
    'Come in, then, and shut the door; there’s a draught. …What is that you have there?',
  ],
  'lastWords.gracious': [
    'Oh — do come in. I was just sitting up a while; I couldn’t sleep either. Would you like the chair by the fire?',
    'How kind of you to look in. I confess I have been rather uneasy tonight. …Is something wrong?',
  ],
  'lastWords.prickly': [
    'What do you want? I said I was not to be disturbed.',
    'Oh, it’s you. If you have come to argue, I am not in the humour for it. …What is that?',
  ],
  'lastWords.gossipy': [
    'Oh, it’s you! Come in, come in — I have been dying to ask you something. Shut the door first.',
    'There you are! I knew somebody would come. Now, sit down, because I have worked it all out, and you will never guess—',
  ],
  'lastWords.reserved': ['Yes?', 'You. …What is that for?'],
  'lastWords.dramatic': [
    'Heavens, you gave me such a fright! Creeping about at this hour — I thought for a moment you were the murderer!',
    'Who is there? …Oh. Oh, it is only you. Come in; the shadows in {thisHouse} are enough to stop the heart.',
  ],
  'lastWords.deferential': [
    'Beg pardon — I was just about to turn the lamps down. Was there something you wanted?',
    'Oh! You did startle me. I shan’t be a moment; I only wanted to see the fire was safe. …Is that for me?',
  ],
  'lastWords.boastful': [
    'Ah. I rather thought you would come. Sit down; I know exactly what you are going to say.',
    'You? I had expected somebody cleverer. Well, since you are here, I shall tell you what I have worked out.',
  ],
  'lastWords.blunt': ['You. What do you want at this hour?', 'Shut the door. Say what you came to say.'],
  'lastWords.rambling': [
    'Oh! Oh, do come in, I was only sitting here thinking about the whole dreadful business, and I said to myself, I said, somebody in {thisHouse} knows more than they are letting on, and then I thought—',
    'Is that you? I could not sleep, not a wink, so I came down for a book, and then I thought I heard somebody on the stair, and I thought, well, it will only be—',
  ],
  'lastWords.cheeky': [
    'Well, well. Fancy seeing you here. Come to tuck me in?',
    'Oh, it’s you. If you’ve come to confess, I’m all ears. …What’s that behind your back?',
  ],

  // ---- the household called together at the last, before anybody is named ----
  // One bank for everyone, guilty or not: what a frightened guest says when the
  // detective stands up is the same whatever they have to hide.
  'gathered.any': [
    'Well then. Who is it?',
    'I cannot take much more of this. Say it, whoever it is, and have done.',
    'You have been up and down {thisHouse} all night. I hope to heaven you know.',
    'Is it — is it one of us? Truly? I keep thinking there must be somebody else.',
    'Go on, then. We are all listening. God help whoever it is.',
    'I have not been able to look any of them in the face since dinner.',
  ],
  'gathered.gracious': [
    'Whatever you have to say, {detective}, I am sure you will say it kindly. I only hope it is not — no. Go on.',
    'We are all here, as you asked. I do not think any of us will sleep tonight whatever you tell us.',
    'I have been telling myself all evening that it could not be anybody in this room. I no longer know what I think.',
  ],
  'gathered.prickly': [
    'Well? You have kept us up half the night. Out with it.',
    'If you are about to point at me, I warn you I shall not sit still for it.',
    'Get on with it. Some of us have had quite enough of being looked at.',
  ],
  'gathered.gossipy': [
    'I knew it would come to this — everybody in one room and the clock about to strike. Who is it? You can tell me.',
    'I have a name in my head. I dare say we all have. I only hope it is the same as yours.',
    'Look at everyone’s faces. Somebody in this room knows exactly what you are about to say.',
  ],
  'gathered.reserved': ['Say it.', 'We are listening.', 'One of us, then.'],
  'gathered.dramatic': [
    'The hour has come! Name the guilty, {detective} — I cannot bear another minute of this dreadful suspense!',
    'Look at us — all these faces, and one of them a mask! Tear it off, for pity’s sake!',
    'My heart is in my mouth. Whoever it is, say it quickly, before I faint clean away.',
  ],
  'gathered.deferential': [
    'We’re all here, {sir}, as you asked. I hope you know what you’re about, {sir}. I truly do.',
    'I don’t like to say it, {sir}, but the whole house is frightened. Whoever it is, we’d all sooner know.',
    'If it’s all the same to you, {sir}, I’d as soon stand. I couldn’t sit easy, not now.',
  ],
  'gathered.boastful': [
    'I have my own idea who it is, naturally. I shall be interested to see whether you have got there too.',
    'Come along, then. I could have named them an hour ago; let us hear whether you can.',
    'I am quite calm, as you see. Innocence is a wonderful thing for the nerves.',
  ],
  'gathered.blunt': ['Who did it? Say the name.', 'Get it over with.', 'One of us. Which?'],
  'gathered.rambling': [
    'Well now, here we all are, and I must say I have never in my life sat in a room that felt like this one does, with everybody looking at everybody and nobody saying a word, and I thought, somebody must say something, so—',
    'I keep going over it and over it, who was where and who said what, and every time I think I have it I look at somebody and I think, no, surely not, and then I look at somebody else—',
  ],
  'gathered.cheeky': [
    'Well, this is cosy. Go on, {detective} — who’s for the drop?',
    'I’d like it noted I’ve been very well behaved all evening. Just in case that counts for anything.',
    'Drum roll, somebody. No? Suit yourselves. Go on, then — who?',
  ],

  // ---- shown what was found of the second killing ----
  'evidence.killed.any': [
    'Dead. And an hour ago sitting among us. Whoever did the first has done this.',
    'Then somebody was afraid of what they knew. I wish to God they had told you sooner.',
    'Two, now. And the rest of us shut in with whoever did it.',
    'They knew something. I am sure of it. And somebody else was sure of it too.',
  ],
  'evidence.killed.gracious': [
    'Oh, the poor soul. They did nobody any harm. Who could do such a thing, and with all of us in {house}?',
    'I cannot take it in. We spoke only this evening. I am so very sorry.',
  ],
  'evidence.killed.prickly': [
    'And what were you doing while it happened? Asking the rest of us where we had been at seven?',
    'Two dead under your nose. I hope you mean to stop at two.',
  ],
  'evidence.killed.gossipy': [
    'They knew something — I said so, did I not? I said they had a look about them. And now this.',
    'It will have been to stop their mouth. Mark my words. Somebody could not afford to have them talk.',
  ],
  'evidence.killed.reserved': ['Silenced. They knew something.', 'Two, then. The same hand.'],
  'evidence.killed.dramatic': [
    'Another! Death walks these corridors, {detective}, and takes whom it pleases!',
    'Struck down — and for what they knew! Which of us is next?',
  ],
  'evidence.killed.deferential': [
    'It’s wicked, {sir}. They never hurt a soul. I’ll not go down that passage alone again tonight.',
    'Two in one night, {sir}. I don’t know what {house} is coming to.',
  ],
  'evidence.killed.boastful': [
    'I could have told you it would come to this. One does not stop at one; I have seen it before.',
    'They should have come to me with what they knew. I should have seen them safe.',
  ],
  'evidence.killed.blunt': ['Killed to keep them quiet. Plain as that.', 'Two dead. Find who, and quick.'],
  'evidence.killed.rambling': [
    'Dead, and only this evening as well as any of us, it does not bear thinking of, and yet one must think of it, one must, because whoever it was is still in {house}.',
    'I keep thinking there must be some mistake, that they will walk in presently and ask what all the fuss is, but of course they will not.',
  ],
  'evidence.killed.cheeky': [
    'That’s two. I’d have that pencil sharpened, {detective}, before it’s three.',
    'Well, they won’t be telling you anything now. Somebody made sure of that.',
  ],
}

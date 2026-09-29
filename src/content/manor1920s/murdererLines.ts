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

  // ---- shown what was found of the second killing ----
  'evidence.killed.any': [
    'Dead. And an hour ago sitting among us. Whoever did the first has done this.',
    'Then somebody was afraid of what they knew. I wish to God they had told you sooner.',
    'Two, now. And the rest of us shut in with whoever did it.',
    'They knew something. I am sure of it. And somebody else was sure of it too.',
  ],
  'evidence.killed.gracious': [
    'Oh, the poor soul. They did nobody any harm. Who could do such a thing, and with all of us in the house?',
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
    'Two in one night, {sir}. I don’t know what the house is coming to.',
  ],
  'evidence.killed.boastful': [
    'I could have told you it would come to this. One does not stop at one; I have seen it before.',
    'They should have come to me with what they knew. I should have seen them safe.',
  ],
  'evidence.killed.blunt': ['Killed to keep them quiet. Plain as that.', 'Two dead. Find who, and quick.'],
  'evidence.killed.rambling': [
    'Dead, and only this evening as well as any of us, it does not bear thinking of, and yet one must think of it, one must, because whoever it was is still in the house.',
    'I keep thinking there must be some mistake, that they will walk in presently and ask what all the fuss is, but of course they will not.',
  ],
  'evidence.killed.cheeky': [
    'That’s two. I’d have that pencil sharpened, {detective}, before it’s three.',
    'Well, they won’t be telling you anything now. Somebody made sure of that.',
  ],
}

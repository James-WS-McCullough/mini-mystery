import type { DialogueBanks } from '../schema'

// The manor's voice. RULES OF THE BANKS:
//  - Keys are `<lineKey>.<temperament|defense>` or `<lineKey>.any`. Claim
//    sentences may also carry a bare `<key>` bank; the renderer tries
//    `<key>.<temperament>` first, then `<key>`, then `<key>.any`.
//  - Claim templates carry the structural content; openers carry only voice.
//  - Banks are shared by the honest and the lying alike — a Bluffer's cover
//    story and a real witness's testimony come out of the SAME templates, so
//    surface style never betrays alignment. Prose never adds facts.
//  - Temperament banks (gracious / prickly / gossipy / reserved / dramatic
//    here; deferential / boastful / blunt / rambling / cheeky, and more
//    gossip, in manners.ts) and defense banks (indignant / flustered / calm / selfdoubting) are
//    voice only. Never let a temperament bank say more than the `.any` one.
//  - No line may add a fact the claim does not carry ("I saw nothing",
//    "we heard nothing", "while I was there") — a witness who says it
//    would contradict their own testimony.
//  - Under Press, only a confession has its own bank. Deflecting, baffled and
//    standing firm all render from `press.hold.*`.
//  - Never use a pronoun for {target}, {subject}, {companions} or {person}:
//    the cast is mixed and the slot is only a name. The victim is "he".
//  - Slots available: {name} {victim} always; {room} {target} {subject}
//    {companions} {trait} {parity} {seatList} {roleName} {person} per key;
//    {item} on evidence openers (avoid it: the render test fills no item).

export const dialogue: DialogueBanks = {
  // =====================================================================
  // CLAIM SENTENCES — the structural content
  // =====================================================================
  'claim.role': [
    'As to what I was in all this: I am {roleName}.',
    'You may as well have it plainly — I am {roleName}.',
    'Put me down in that notebook as {roleName}.',
    'If you want it in a phrase: I am {roleName}. Make of it what you will.',
    'I shan’t make you dig for it. I am {roleName}.',
    'Here is my place in the evening, then: I am {roleName}.',
  ],
  'claim.role.gracious': [
    'I would rather you heard it from me than pieced it together: I am {roleName}.',
    'Forgive the delay in saying so — I am {roleName}.',
  ],
  'claim.role.prickly': [
    'I am {roleName}. There. Write it down and stop looking at me like that.',
    'Since you will keep asking: I am {roleName}.',
  ],
  'claim.role.gossipy': [
    'Between us, and I do mean between us — I am {roleName}.',
    'Oh, you may as well know. I am {roleName}. Everybody will know by breakfast anyway.',
  ],
  'claim.role.reserved': ['I am {roleName}.', 'I am {roleName}. That is all I will say of it.'],
  'claim.role.dramatic': [
    'Then hear it, and judge me if you must: I am {roleName}!',
    'Confession of a kind, detective — I am {roleName}.',
  ],

  'claim.whereabouts.alone': [
    'For the hour in question I was in {room}, quite alone.',
    'I was in {room}. Alone, as it happens — which I realise serves me poorly.',
    'You will find me difficult to corroborate: {room}, by myself, the whole of it.',
    'While the house dressed for dinner I was in {room}. Nobody with me. I know how that sounds.',
    '{room}, and my own company. I wish I could offer you better.',
    'I was in {room} the whole while. No one came in, and I did not go out.',
    'Alone in {room}, from half past six until the gong. It is not much of an alibi, I grant you.',
  ],
  'claim.whereabouts.alone.gracious': [
    'I am afraid I was in {room} by myself, and there is no one to say otherwise for me.',
    'I was in {room}, detective, and quite alone — I do apologise for being so useless to you.',
  ],
  'claim.whereabouts.alone.prickly': [
    '{room}. Alone. If you want a witness to it you will have to ask the furniture.',
    'I was in {room} and I was on my own. That is the whole of it, and I will not embroider it for your benefit.',
  ],
  'claim.whereabouts.alone.gossipy': [
    'I was in {room}, all on my own — dull as ditchwater, and me the one person in this house who cannot bear a quiet room.',
    'Would you believe it, I was in {room} alone for the whole hour. The one evening I keep to myself!',
  ],
  'claim.whereabouts.alone.reserved': ['{room}. Alone.', 'I was in {room}. Nobody with me.'],
  'claim.whereabouts.alone.dramatic': [
    'Alone! In {room}, while a murderer walked these corridors — it makes my blood run cold to think of it.',
    'I was in {room}, and heaven help me, not a soul was with me.',
  ],

  'claim.whereabouts.company': [
    'I was in {room} the whole while, and not alone — {companions} can vouch for every minute.',
    'From half past six I was in {room} with {companions}. Ask there and you will hear the same.',
    '{room}, in the company of {companions}. We never left it.',
    'I spent the hour in {room} with {companions}. Neither door was opened until the gong.',
    'You will find me easy to place: {room}, with {companions}, the whole of the hour.',
    'I was with {companions} in {room}. That, at least, cannot be argued with.',
  ],
  'claim.whereabouts.company.gracious': [
    'I was fortunate — {companions} kept me company in {room} the whole hour, and will say so.',
    'I was in {room} with {companions}, and I am grateful to have been, tonight of all nights.',
  ],
  'claim.whereabouts.company.prickly': [
    '{room}, with {companions}. Ask them if you don’t believe me; I daresay you won’t.',
    'I was in {room}. {companions} will tell you so, and then perhaps you will leave me be.',
  ],
  'claim.whereabouts.company.gossipy': [
    'I was in {room} with {companions} the entire hour — and we talked of nothing but the weather, more’s the pity.',
    'Oh, I was well placed: {room}, with {companions} for company, the whole of the hour.',
  ],
  'claim.whereabouts.company.reserved': [
    '{room}. With {companions}.',
    'I was in {room} with {companions}. We did not leave.',
  ],
  'claim.whereabouts.company.dramatic': [
    'Thank heaven — I was in {room} with {companions}, or I should be trembling for my own neck.',
    '{room}, with {companions} beside me the whole while. Providence, detective. Nothing less.',
  ],

  'claim.sighting': [
    'I saw {target} in {room} during that hour — of that I am certain.',
    'One thing I can swear to: {target} was in {room}. I saw it with my own eyes.',
    '{target} was in {room} then. Whatever else is in doubt, that is not.',
    'I can place {target} for you: {room}, while the house was dressing.',
    'I saw {target} — plainly, in {room}. I would say so before a judge.',
    'Write this down: {target}, {room}, during the hour before dinner. I saw it.',
  ],
  'claim.sighting.gossipy': [
    'And I happen to know {target} was in {room} — I saw it, and I never forget where people are.',
    'Here is a morsel for you: {target} was in {room}. I saw it with these eyes.',
  ],
  'claim.sighting.reserved': ['{target} was in {room}. I saw it.', 'I saw {target} in {room}.'],
  'claim.sighting.dramatic': [
    'I saw {target} in {room} — I could not mistake it, not if I lived a hundred years!',
  ],

  'claim.glimpse': [
    'I only glimpsed the figure near {room} — but whoever it was {trait}.',
    'I could not tell you the face. What I can tell you is that whoever I saw by {room} {trait}.',
    'Someone passed near {room}. I did not see a face. I did see this: the figure {trait}.',
    'A shape, near {room}, hurrying. No more than that — except that whoever it was {trait}.',
    'I will not pretend I saw more than I did. A figure by {room}; and that figure {trait}.',
    'Near {room}, in the half-dark: someone who {trait}. That is all the light gave me.',
  ],
  'claim.glimpse.reserved': ['Near {room}. Someone who {trait}. No face.'],
  'claim.glimpse.dramatic': [
    'A figure — by {room} — gone before I could cry out! But mark this: it {trait}.',
  ],

  'claim.culpritAttr.trait': [
    'Mark me: the one you want {trait}.',
    'I cannot give you a name. I can give you this: your killer {trait}.',
    'Ask me how I know and I shall only shrug. But the murderer {trait}.',
    'Look for one who {trait}. That is where the truth is sitting.',
    'The guilty one {trait}. I would wager the house on it.',
    'Name? No. But I will tell you this for nothing: whoever did it {trait}.',
  ],
  'claim.culpritAttr.trait.gossipy': ['Whisper it: your murderer {trait}. Now count the table.'],
  'claim.culpritAttr.trait.reserved': ['The one you want {trait}.'],
  'claim.culpritAttr.trait.dramatic': [
    'I have seen it in my mind’s eye, as clear as candle-flame: the killer {trait}!',
  ],

  'claim.culpritAttr.parity': [
    'The guilty one sits at an {parity} place at table — seats {seatList}. Laugh if you like; you will see.',
    'Call it intuition, call it what you please: an {parity} chair — {seatList} — holds your murderer.',
    'Count the chairs. The murderer sat at an {parity} one tonight: {seatList}.',
    'I noticed it at dinner and I cannot un-notice it: the killer’s place is {parity} — one of {seatList}.',
    'An {parity} seat. {seatList}. I know how it sounds. I also know I am right.',
  ],
  'claim.culpritAttr.parity.reserved': ['An {parity} seat. {seatList}.'],
  'claim.culpritAttr.parity.dramatic': [
    'Look to the {parity} chairs — {seatList} — for death sat in one of them tonight!',
  ],

  'claim.alignment.good': [
    'Whatever you may come to think tonight, {target} is true. I would stake my life upon it.',
    'Strike {target} from your dark little list. I know things about this house, and I know that.',
    'You may leave {target} out of it. I know that much for certain, and I do not say it lightly.',
    'I will vouch for {target} with everything I have. Not the murderer. Not.',
    'There is one name I can clear for you, and it is {target}. Believe me on this if on nothing else.',
    '{target} is innocent of this. I have my reasons, and they are good ones.',
  ],
  'claim.alignment.good.reserved': ['{target} is innocent. I know it.'],
  'claim.alignment.good.dramatic': [
    'Not {target}! Never {target}! I would swear it on my mother’s grave!',
  ],

  'claim.alignment.evil': [
    'Look closely at {target}. There is rot there — I promise you.',
    'I will say it only once, and quietly: {target} is not what {target} pretends to be.',
    'There is something wrong with {target}. I have known it for some time, and tonight I am sure of it.',
    '{target}. Do not let that smile at dinner fool you; there is guilt underneath it.',
    'If you want a name from me, it is {target}. There is something buried there, and it is not pretty.',
    'I have kept a secret about {target} for too long. It is this: {target} is guilty of something.',
  ],
  'claim.alignment.evil.reserved': ['{target} is not to be trusted. I know that.'],
  'claim.alignment.evil.dramatic': [
    'It is {target}! There is darkness in that one — I have felt it all evening like a draught!',
  ],

  // -- relationship: self-report ----------------------------------------
  'claim.relationship.self.devoted': [
    'I loved him dearly. He was family to me, whatever anyone whispers.',
    'How did things stand between us? He was the best friend I had in the world. Now you know my loss.',
    'There was no one in this house closer to him than I. I am not ashamed to say I have wept tonight.',
    'He was — he was everything to me, detective. You will hear that from others as well, I hope.',
    'We were devoted to one another. It is the one thing in this house nobody could have doubted.',
  ],
  'claim.relationship.self.cordial': [
    'His lordship and I were on perfectly good terms. Perfectly good.',
    'We got on well, he and I. No quarrels, no debts, no history. Merely — friends.',
    'Cordial. That is the honest word. We liked one another well enough and left it there.',
    'We were friendly, in the ordinary way of guests and hosts. Nothing warmer, nothing colder.',
    'I had no quarrel with the man. We were on easy terms, and I should have said so of him too.',
  ],
  'claim.relationship.self.strained': [
    'We had our frictions, he and I. I shan’t insult you by pretending otherwise.',
    'There was a coolness between us of late. Nothing that ends in murder — but I won’t deny the coolness.',
    'Things were strained. I will not lie to you about that. We had been civil, and only civil, for weeks.',
    'We had fallen out, a little. Words, not blows. I regret the words now.',
    'Not the warmest of terms, lately. I could give you the reasons, but they are small and they are mine.',
  ],
  'claim.relationship.self.hostile': [
    'Since you ask: we despised one another, and I’ll not weep false tears now.',
    'I hated him. There — I have said what everyone else will only hint at. Hatred is not a confession.',
    'We loathed each other, and the whole house knew it. You would have had it from somebody by ten.',
    'I will not pretend to a grief I do not feel. He and I were enemies. Enemies, detective — not murderer and victim.',
    'Hostile is a mild word for it. We could not be in a room together. But I did not kill him.',
  ],
  'claim.relationship.self.indebted': [
    'I owed him money. A very great deal of money. You would have found it out anyway.',
    'The truth? I was in his debt to a sum I do not like saying aloud. That is motive in your book, I imagine. It is misery in mine.',
    'He held my notes of hand. Held them, and reminded me of it. I owed him more than I could pay.',
    'Money. I owed him money, and he was not the forgiving sort. There, that is my secret laid on the table.',
    'I was in debt to him — deep in it. I expect that puts me on a list somewhere. I cannot help that.',
  ],
  'claim.relationship.self.jilted': [
    'He threw me over, once upon a time. One does not forget it; one merely learns to dine with it.',
    'There was an understanding between us, years ago, and he ended it badly. I have carried that politely ever since.',
    'He and I were to be married, once. He thought better of it. I have never quite thought better of him.',
    'He broke a promise to me, a long time ago, and never once apologised. I am telling you so that nobody else has to.',
    'Jilted — that is the vulgar word, and the true one. It was years ago. It does not feel like years ago tonight.',
  ],

  // -- relationship: gossip about another --------------------------------
  'claim.relationship.gossip.devoted': [
    '{subject} worshipped {victim} — anyone in this house will tell you the same.',
    'There was real affection between {subject} and {victim}. The genuine article; one saw it at once.',
    '{subject} and {victim} were as close as any two people in this house. Closer.',
  ],
  'claim.relationship.gossip.cordial': [
    '{subject} and {victim} got along well enough, so far as I ever observed.',
    'Nothing to tell about {subject} and {victim}. Perfectly pleasant, perfectly dull.',
    '{subject} and {victim}? Amiable. I never saw a cross word between them, and I look for cross words.',
  ],
  'claim.relationship.gossip.strained': [
    'There was a coolness between {subject} and {victim} of late. Everyone pretended not to notice. Everyone noticed.',
    '{subject} and {victim} had been carefully polite with one another for weeks. That kind of polite.',
    'Something had gone wrong between {subject} and {victim}. Not a scandal — a chill. One felt it at table.',
    'Watch how {subject} spoke of {victim} lately, if you can: shortly, and looking elsewhere.',
  ],
  'claim.relationship.gossip.hostile': [
    '{subject} and {victim}? At daggers drawn. The quarrels carried through the walls of this house.',
    'Ask anyone: {subject} and {victim} could not share a room without the temperature dropping.',
    'There was real hatred between {subject} and {victim}. I do not use the word lightly.',
    '{subject} loathed {victim} — and was loathed right back. It was the worst-kept secret at the table.',
  ],
  'claim.relationship.gossip.indebted': [
    '{subject} owed {victim} money — serious money, the kind that curdles a friendship.',
    'It was money between {subject} and {victim}. A great deal of it, and none of it forgiven.',
    '{victim} held paper on {subject}. Debts, detective. Old ones, and growing.',
    'Everyone knows {subject} was in {victim}’s debt. Nobody knows how deep. Deep enough.',
  ],
  'claim.relationship.gossip.jilted': [
    '{victim} broke an engagement with {subject}, you know. Years ago. Some wounds keep beautifully.',
    'There was an understanding, once, between {subject} and {victim}. He ended it. Badly.',
    '{subject} was thrown over by {victim} long ago — and has never, in my hearing, forgiven it.',
  ],

  // -- heard --------------------------------------------------------------
  'claim.heard.crash': [
    'During that hour I heard a crash from {room} — glass, or a lock giving way. I told myself it was the storm.',
    'I heard something break in {room}. A sharp, deliberate sort of sound. Not thunder — I know thunder.',
    'There was a noise from {room} while the house was dressing. Wood splintering, or metal. I nearly went to look. I did not.',
    'A crash from {room}. I remember thinking: somebody has dropped something they should not have been holding.',
    'From {room}, during that hour — a bang, and then a sort of tearing. It was not the wind.',
  ],
  'claim.heard.quarrel': [
    'That afternoon there were raised voices in {room} — a proper quarrel, though the words escaped me.',
    'Earlier in the day I passed near {room} and heard {victim} quarrelling with someone. Bitterly.',
    'In the afternoon there was shouting from {room}. {victim} and another — I could not make out who.',
    'I heard a row in {room} that afternoon. {victim}’s voice, and someone else’s, both raised. I kept walking.',
    'Voices through the door of {room}, earlier in the day — {victim}, very angry, and somebody giving as good as they got.',
  ],

  'claim.suspicion': [
    'If you want the truth of my heart, I have had my eye on {target} all evening.',
    'I make no accusation. I merely observe that {target} has not been right tonight.',
    'Since you ask me plainly: {target}. I cannot tell you why. I can only tell you that I feel it.',
    'My money, for what little it is worth, is on {target}.',
    'I keep coming back to {target}. Something in the manner at dinner. Something.',
    'Between ourselves — {target}. Do not tell anyone I said so.',
  ],

  // =====================================================================
  // REACTIONS — the free opener
  // =====================================================================
  'reaction.plain.any': [
    'A black night for this house. Ask what you must.',
    'You will want to question all of us, I suppose. Begin, then.',
    'I have been waiting for you to come to me. Go on.',
  ],
  'reaction.plain.gracious': [
    'A dreadful business, detective. Ask of me whatever you need — the house owes you its candor.',
    'I keep hoping there has been some mistake. There hasn’t, has there. Very well — I am at your disposal.',
    'Thank you for taking this on. I cannot imagine anyone wants to. Please — ask me anything at all.',
    'You must be exhausted already, and the night is young. Sit, if you like. I will help however I can.',
    'I do not envy you your task. I shall try to make my part of it easy.',
  ],
  'reaction.plain.prickly': [
    'Well? Am I to be gawped at, or questioned? Get on with it.',
    'I’ll say this once: I did not care for the man’s manner at dinner, and I care for murder even less.',
    'I have been kept from my bed for this, so I trust it will be brief.',
    'Yes, yes. You have questions. Everyone has questions. Ask them.',
    'Before you begin — I have nothing to hide and less patience. Proceed accordingly.',
  ],
  'reaction.plain.gossipy': [
    'Isn’t it too awful? And yet — one had a feeling, didn’t one? This house has been holding its breath all week.',
    'Come, sit by me a moment. If it’s truth you’re after, I hear everything in this house eventually.',
    'At last, someone to talk to about it properly! The others have all gone so very quiet.',
    'You have come to the right person, you know. Nothing happens under this roof that I do not hear of by morning.',
    'My dear detective. I have been simply bursting. Where would you like me to begin?',
  ],
  'reaction.plain.reserved': [
    'I have nothing to volunteer. Ask, and I will answer.',
    'A terrible thing. I will help where I am able.',
    'Ask your questions.',
    'I would sooner say less than more. But I will not lie to you.',
    'You will find me brief. It is not evasion. It is my way.',
  ],
  'reaction.plain.dramatic': [
    'Murder! Under this very roof, while we dressed for dinner like innocents! I shall never sleep again.',
    'I have been rehearsing what to tell you, and it is this: someone at that table tonight is wearing a mask.',
    'Every creak of this house sounds like a footstep now. Ask me quickly, before my nerves give out entirely.',
    'To think I laughed at dinner. Laughed! With a murderer passing the salt!',
    'I feel as though I am in a play — only nobody has given me my lines. Prompt me, detective.',
  ],

  'reaction.heard.crash.any': [
    'You’ll want more than handshakes and alibis tonight, detective — so I’ll give you something real.',
    'Before you begin your clever questions, there is a thing you ought to know.',
    'I have been turning something over all evening, and I think you should have it.',
  ],
  'reaction.heard.crash.gracious': [
    'Forgive me for beginning before you have asked — but there is something I ought to tell you at once.',
  ],
  'reaction.heard.crash.prickly': ['I shall save us both some time. Listen.'],
  'reaction.heard.crash.gossipy': [
    'Oh, I have something for you — I have been dying to tell somebody who would take it seriously.',
  ],
  'reaction.heard.crash.reserved': ['One thing, before you ask.'],
  'reaction.heard.crash.dramatic': ['I have not told a soul — not a soul! — but I shall tell you.'],

  'reaction.heard.quarrel.any': [
    'There is something I ought to have told somebody long before now.',
    'You will ask what we all saw. Let me tell you instead what I heard.',
    'I have kept this to myself out of delicacy. Delicacy is a luxury now.',
  ],
  'reaction.heard.quarrel.gracious': [
    'I hesitate to repeat what was not meant for my ears — but you must have it.',
  ],
  'reaction.heard.quarrel.prickly': ['I do not listen at doors. Sometimes doors are simply thin.'],
  'reaction.heard.quarrel.gossipy': [
    'Now — I would never eavesdrop. But one cannot help what one overhears in a corridor.',
  ],
  'reaction.heard.quarrel.reserved': ['I heard something. You should know it.'],
  'reaction.heard.quarrel.dramatic': [
    'The walls of this house have ears, detective — and tonight, so did I.',
  ],

  'reaction.accuse.any': [
    'You needn’t look far, in my opinion. {target} has been wrong all evening — wrong the way a picture hangs wrong.',
    'Save your ink for one name: {target}. There. Someone had to say it.',
    'I shall spare you the preliminaries. Look at {target}.',
    'You want a name and I shall give you one before you ask: {target}.',
  ],
  'reaction.accuse.gracious': [
    'I take no pleasure in this, believe me — but I think you should look to {target}.',
  ],
  'reaction.accuse.prickly': [
    'Do not waste the night on the rest of us. It was {target}. Go and ask why.',
  ],
  'reaction.accuse.gossipy': [
    'Between us — and I say it with no pleasure, none — it is {target}. Everyone thinks so. Nobody says so.',
  ],
  'reaction.accuse.reserved': ['{target}. Look there.'],
  'reaction.accuse.dramatic': [
    'Must I say it aloud? Very well — {target}! It is said, and heaven forgive me, I am glad it is said.',
    'I have looked at {target} across that table all evening and felt a chill I cannot explain!',
  ],

  'reaction.weaponhint.any': [
    'Something has nagged at me since we found him: {room} is not as it should be. Something missing — or something present that has no business there.',
    'If I were hunting the HOW of it, detective, I should start with {room}. Call it a housekeeping instinct; the house is very slightly wrong there.',
    'A small thing, and possibly nothing: {room} has been disturbed. I noticed it in passing and thought little of it. I think more of it now.',
  ],
  'reaction.weaponhint.gracious': [
    'I hope you will not think me fanciful — but {room} has been troubling me. Something there is out of place.',
  ],
  'reaction.weaponhint.prickly': [
    'Somebody has been in {room} who had no business there. I know that room, and it is wrong.',
  ],
  'reaction.weaponhint.gossipy': [
    'Have you looked in {room}? Only I noticed something there, and I notice everything, and it was not right.',
  ],
  'reaction.weaponhint.reserved': ['{room}. Look there. Something is wrong with it.'],
  'reaction.weaponhint.dramatic': [
    'I dare not say what, but {room} — {room} is wrong, detective. I felt it the instant I passed the door.',
  ],

  'reaction.referral.any': [
    'I can give you no name, I regret to say — but {victim} shut himself away in {room} all afternoon, scratching at some paper or other. Were I you, I should look there.',
    'One odd thing, since you ask: {victim} spent the whole afternoon locked in {room}, writing. Whatever he wrote is presumably still in that room.',
    'I cannot tell you who. I can tell you that {victim} was writing something in {room} all afternoon, and was very short with anyone who knocked.',
  ],
  'reaction.referral.gracious': [
    'I wish I could be more use. What I can say is that {victim} kept to {room} all afternoon with pen and paper. Perhaps it signifies.',
  ],
  'reaction.referral.prickly': [
    'Want something useful? {victim} spent the afternoon in {room} writing. Whatever it was, he did not want company for it.',
  ],
  'reaction.referral.gossipy': [
    'Now this is curious: {victim} shut himself in {room} the whole afternoon, writing, and would not say what. I did ask.',
  ],
  'reaction.referral.reserved': ['{victim} was writing in {room} all afternoon. Look there.'],
  'reaction.referral.dramatic': [
    'All afternoon he sat in {room}, writing — writing as if his life depended on it! Perhaps it did.',
  ],

  // =====================================================================
  // THE QUESTIONS
  // =====================================================================
  'role.vague.any': [
    'What was I, in all this? A guest with dreadful luck. Ask me something worth answering.',
    'We are to trade in secrets now, are we? Ask me again when you have earned it.',
    'My part in the evening? I should like to hear yours first.',
    'That is rather a large question for so early in the night.',
  ],
  'role.vague.gracious': [
    'I would rather come to that a little later, if you will indulge me.',
    'Forgive me — I am not quite ready to answer that. Ask me again.',
  ],
  'role.vague.prickly': [
    'My affairs are my own. Ask your other questions.',
    'You will have to do better than that before I open my life to you.',
  ],
  'role.vague.gossipy': [
    'Oh, you clever thing. Not yet. A person must keep something back or there is nothing to talk about.',
    'What was I? A listener, mostly. Ask me again once you have heard the others; it will mean more.',
  ],
  'role.vague.reserved': ['I would sooner not say. Not yet.', 'Later. Not now.'],
  'role.vague.dramatic': [
    'You ask me to bare my soul on a night like this? Give me a moment. Give me a moment.',
    'Everyone in this house is something they were not at luncheon. I shall tell you what I am — presently.',
  ],

  'role.claim.any': [
    'Very well — you may as well know it.',
    'Since it will come out regardless:',
    'I shall not fence with you.',
    'You will have it from somebody. Have it from me.',
  ],
  'role.claim.gracious': [
    'I think it is only fair you know.',
    'You have asked so nicely. Very well.',
  ],
  'role.claim.prickly': ['Fine. Since you insist.', 'You will not stop asking, so:'],
  'role.claim.gossipy': [
    'Well — if you promise not to make a face.',
    'Oh, very well, I can never keep anything.',
  ],
  'role.claim.reserved': ['Yes.', 'All right.'],
  'role.claim.dramatic': ['Then let it be said!', 'The moment has come, I suppose.'],

  'alibi.alone.any': [
    'My whereabouts? Nothing simpler.',
    'You want the hour accounted for. Here it is, for whatever my word buys.',
    'Where was I. Yes. I have been expecting that.',
    'It is a plain answer, and I fear not a very useful one.',
  ],
  'alibi.alone.gracious': [
    'Of course. Though I wish I had a better answer for you.',
    'I will tell you gladly, though it does me no credit.',
  ],
  'alibi.alone.prickly': [
    'Where I always am at that hour. You will not like it.',
    'I knew we should come to this.',
  ],
  'alibi.alone.gossipy': [
    'Oh, dull, dull — I was nowhere interesting, which is the tragedy of it.',
    'You will laugh. Or you will not, which is worse.',
  ],
  'alibi.alone.reserved': ['Simply put:', 'Where I was.'],
  'alibi.alone.dramatic': [
    'The fateful hour. I have thought of nothing else.',
    'Ah — the question I have dreaded.',
  ],

  'alibi.company.any': [
    'Happily, I need not rely on my own word alone.',
    'That, at least, is easily answered.',
    'There I am on firm ground.',
    'Good — a question with a witness to it.',
  ],
  'alibi.company.gracious': [
    'I am glad you asked; it is the one thing I can answer without a blush.',
    'That is a comfort to tell, at least.',
  ],
  'alibi.company.prickly': [
    'That one I can answer, and you can check it, and then we can move on.',
    'Easily answered. Do check. I should like to be done with suspicion.',
  ],
  'alibi.company.gossipy': [
    'Now this I can tell you with a clear conscience, and a witness besides.',
    'Oh, I was in company the whole time — thank goodness, or you would be looking at me very oddly.',
  ],
  'alibi.company.reserved': ['That is simple.', 'I was not alone.'],
  'alibi.company.dramatic': [
    'Providence was with me on that score — and so was somebody else.',
    'For once in my life I was exactly where I ought to have been.',
  ],

  'knowledge.vague.any': [
    'Know? What should I know? I keep to my own affairs.',
    'You are fishing, detective. I am not yet certain I care to be caught.',
    'If I knew anything worth your time, I am not sure this drawing room is the place to say it.',
    'Everyone knows something tonight. I have not decided what I know.',
  ],
  'knowledge.vague.gracious': [
    'I should hate to mislead you with half a thought. Let me be surer before I speak.',
    'Might I answer that a little later? I want to be fair to everyone.',
  ],
  'knowledge.vague.prickly': [
    'I am not in the habit of volunteering. Ask me something specific.',
    'What I know and what I will tell a stranger are two different lists.',
  ],
  'knowledge.vague.gossipy': [
    'Oh, I know all sorts of things. Whether any of them are true is another matter entirely.',
    'Now that is a leading question, and I refuse to be led. Yet.',
  ],
  'knowledge.vague.reserved': ['Nothing I care to say. Yet.', 'Ask me again.'],
  'knowledge.vague.dramatic': [
    'What I know could set this house alight. I am not sure I dare strike the match.',
    'Do not press me on that — not yet. My nerves will not bear it.',
  ],

  'knowledge.share.any': [
    'I shall deal with you squarely.',
    'What I can offer you is this.',
    'Listen, then, and make of it what you will.',
    'Here is what I have. It is not much, but it is honest.',
    'I have thought about whether to say this. I shall say it.',
  ],
  'knowledge.share.gracious': [
    'I will tell you everything I can, and I hope it helps.',
    'You have my full confidence. Here it is.',
  ],
  'knowledge.share.prickly': [
    'Very well. Straight, and once.',
    'Listen carefully; I will not repeat myself.',
  ],
  'knowledge.share.gossipy': [
    'Now we come to the good part. Lean in.',
    'Well! I did wonder when you would ask.',
  ],
  'knowledge.share.reserved': ['This much.', 'Here it is.'],
  'knowledge.share.dramatic': [
    'Then let the truth out, whatever it costs!',
    'Brace yourself, detective.',
  ],

  'knowledge.hedged.any': [
    'I will tell you what I know — though mind, it may be read more ways than one.',
    'Facts I have; conclusions I leave to you. It could mean one thing. It could as easily mean another.',
    'Take this with a grain of salt the size of the salt cellar.',
    'I offer this as I found it. What it means, I am honestly not sure.',
    'A little knowledge is a dangerous thing, and I have exactly a little.',
  ],
  'knowledge.hedged.gracious': [
    'I would not want you to build too much upon this. But you should have it.',
  ],
  'knowledge.hedged.prickly': [
    'I will tell you, and you will probably make too much of it. People do.',
  ],
  'knowledge.hedged.gossipy': [
    'I have a theory. I have several, actually, and they contradict one another beautifully.',
  ],
  'knowledge.hedged.reserved': ['This. But do not lean on it.'],
  'knowledge.hedged.dramatic': [
    'I hardly know what to make of it myself — it changes shape every time I look at it!',
  ],

  'suspect.point.any': [
    'You asked, so I shall say it: {target}. Watch the eyes when you ask about the hour.',
    '{target}. I have no proof you could hang a hat on — only that everything about this evening points one way.',
    'In my view you are wasting the candles on the rest of us while {target} sits there so very quietly.',
    'I have gone round and round it, and I come back to {target} every time.',
  ],
  'suspect.point.gracious': ['It pains me to say a name. But if you must have one: {target}.'],
  'suspect.point.prickly': ['{target}. Do not ask me to dress it up.'],
  'suspect.point.gossipy': [
    'Oh — {target}, surely. Half the house thinks so; I am simply the one who says things aloud.',
  ],
  'suspect.point.reserved': ['{target}.'],
  'suspect.point.dramatic': ['I have known it since the soup: {target}!'],

  'suspect.hedge.any': [
    'If it was about old grudges, look at {target} — but if it was money, why, the whole picture turns, doesn’t it?',
    'Pressed for a name I might say {target}. Yet I could argue you the opposite over a single glass of sherry.',
    'It could be {target}. It could be nearly anyone. That is the true horror of this evening.',
    'I lean toward {target}. I say lean. I am not standing on it.',
  ],
  'suspect.hedge.gracious': [
    'I should hate to be unjust. But if I had to whisper a name it would be {target} — and I would whisper it.',
  ],
  'suspect.hedge.prickly': [
    '{target}, probably. Or not. I am not paid to guess and neither, I notice, are you.',
  ],
  'suspect.hedge.gossipy': [
    'Well — {target}, one supposes. Though I supposed the wrong thing about the vicar’s wife last spring, so.',
  ],
  'suspect.hedge.reserved': ['{target}. Perhaps.'],
  'suspect.hedge.dramatic': [
    '{target} — or am I mad? One moment I am certain, the next I could weep for doubting!',
  ],

  'suspect.none.any': [
    'No name. But {person} has been sharper than I all evening — start there.',
    'I would sooner not guess. {person} may not need to.',
    'I could not put a name to it — truly. Though if you want someone worth asking, try {person}.',
    'I make no accusations. {person} sees more of this house than I do; ask there.',
    'None I would swear to before a judge. Speak to {person} — and listen carefully.',
    'I do not know. I wish I did. {person} may know more than I.',
  ],
  'suspect.none.gracious': [
    'I would not want to point at anyone unfairly. But {person} may be able to help you more than I can.',
  ],
  'suspect.none.prickly': ['No idea, and I will not invent one for you. Try {person}.'],
  'suspect.none.gossipy': [
    'Oh, I could not possibly say. I could, but I could not. Ask {person} — and then come back and tell me what was said.',
  ],
  'suspect.none.reserved': ['No. Ask {person}.'],
  'suspect.none.dramatic': [
    'Do not make me choose! I could not bear to be wrong. Ask {person}, whose nerves are steadier than mine.',
  ],

  'about.person.any': [
    'Since you ask about them:',
    'What I can tell you is small, but it is honest.',
    'I can say a little there.',
    'Ah. Yes. I can help you with that one.',
  ],
  'about.person.gracious': ['I can speak to that, and I will try to be fair.'],
  'about.person.prickly': ['That I do know something about. Listen.'],
  'about.person.gossipy': ['Oh, now you are asking the right questions.'],
  'about.person.reserved': ['This much.'],
  'about.person.dramatic': ['I have waited all evening for someone to ask me that!'],

  'about.referral.any': [
    'I only know what {person} told me, and you should have it from the source.',
    'That is a question for {person}, who was in a position to know. I was not.',
    'I would be guessing. {person} would not be.',
    'Try {person}. I saw nothing of that guest all evening.',
    'Not I. {person}, perhaps — ask and see what comes of it.',
    'I could invent something for you, but {person} could tell you the truth.',
    'There I am no use to you — but {person} will be. Ask them.',
    'You are asking the wrong guest. Put that question to {person}.',
    'I scarcely crossed their path all evening. {person} is your better bet.',
    'I cannot help you there. {person} can, I think.',
  ],
  'about.referral.gracious': [
    'I would hate to send you astray. {person} will have a clearer view than I.',
    'If you will forgive the redirection — {person} is the one to ask.',
    'I am sorry — I cannot say. But I believe {person} may be able to.',
  ],
  'about.referral.prickly': [
    '{person}. Ask {person}. I am not a directory.',
    'Wrong guest. {person} is the one you want.',
    'Not my department. Ask {person} and stop wasting my evening.',
  ],
  'about.referral.gossipy': [
    'Now {person} could tell you a thing or two about that, if you catch them in the right mood.',
    'I heard something second-hand, but {person} had it first-hand. Go to the well.',
    'Now there I am hopeless, would you believe it. Ask {person}, who was rather nearer the action.',
  ],
  'about.referral.reserved': ['{person} would know. Not I.', 'Not me. {person}.', 'Ask {person}.'],
  'about.referral.dramatic': [
    'Do not ask me about that guest — ask {person}, who has eyes for such things!',
    'Fate put {person} in the way of that, not me. Ask there.',
    'Do not ask me — ask {person}! I saw nothing, nothing at all, and it torments me.',
  ],

  'about.nothing.any': [
    'I could not tell you what colour their eyes are. That is how little I know.',
    'We nodded across the hall on Friday. That was the whole of our acquaintance.',
    'You would learn more from the cat.',
    'I have nothing on that guest. Nothing bad, nothing good, nothing at all.',
    'Ask me about somebody I have actually spoken to.',
    'A blank, I am afraid. We simply have not crossed.',
    'There I can offer you nothing at all, I am afraid.',
    'We exchanged perhaps ten words all weekend, and six of them were about the weather.',
    'Nothing worth a line in your notebook.',
    'I hardly know that guest. I could not tell you a thing.',
  ],
  'about.nothing.gracious': [
    'I do wish I could help you there. We have hardly been introduced.',
    'I am sorry — that is one guest I have not had the pleasure of knowing.',
    'I am sorry. I really do not know enough to be useful.',
  ],
  'about.nothing.prickly': [
    'I do not know them and I do not care to. Move on.',
    'Nothing. I have told you nothing because there is nothing.',
    'Nothing. Next.',
  ],
  'about.nothing.gossipy': [
    'Nothing, and it is not for want of trying, believe me.',
    'I have simply not managed to get that one talking. Yet.',
    'Not a thing — and it drives me to distraction, I assure you.',
  ],
  'about.nothing.reserved': ['I cannot say.', 'No.', 'Nothing.'],
  'about.nothing.dramatic': [
    'A cipher! An utter cipher! I could not tell you one true thing.',
    'Do not ask me about that guest — I have not the faintest idea, and it shames me.',
    'A closed book to me! A perfect stranger at my own host’s table.',
  ],

  'about.victim.any': [
    'You want to know how things stood between us. Fair enough.',
    'I wondered when you would come to that question.',
    'How I stood with him? I will tell you honestly.',
    'That is the question, isn’t it. For all of us.',
  ],
  'about.victim.gracious': ['You have every right to ask. I will answer plainly.'],
  'about.victim.prickly': ['You want my feelings about the dead man. Very well.'],
  'about.victim.gossipy': [
    'Ah — the interesting question. I shall tell you mine if you tell me the others’.',
  ],
  'about.victim.reserved': ['We stood thus.'],
  'about.victim.dramatic': ['Him and me? Oh, that is a whole novel, detective.'],

  // =====================================================================
  // SHOWN EVIDENCE
  // =====================================================================
  'evidence.deny.any': [
    'Every house has a dozen of those. You will need more than that to trouble me.',
    'It is not mine. I do not say that to be difficult; I say it because it is true.',
    'You may as well accuse the wallpaper. That could have come from anywhere.',
    'That? You may put it away. It is nothing of mine, whatever it resembles.',
    'I know what you are implying, and I shall thank you not to. Half the county could have left that.',
    'If you are asking whether it is mine — no. Flatly, no.',
    'Yes, I see it. I see what you are thinking, too, and you are wrong.',
  ],
  'evidence.deny.gracious': [
    'I understand why you show me that, and I do not resent it. But it is not mine.',
  ],
  'evidence.deny.prickly': ['Oh, for heaven’s sake. That could be anyone’s. Put it away.'],
  'evidence.deny.gossipy': [
    'Now, I know how that looks, and I know what people will say — but it is not mine, and I can name three others it might belong to.',
  ],
  'evidence.deny.reserved': ['Not mine.'],
  'evidence.deny.dramatic': [
    'You dare show me that? As though — no. No! It is not mine, and I will not be hanged by a trinket!',
  ],

  'evidence.identify.any': [
    'That did not come from me — but I can think of who it might have come from, and so can you.',
    'Not mine. Hold it up against the table and see whom it fits.',
    'I should look for the guest that matches, if I were you. It is not I.',
    'Let me look at it properly. …Yes. I think you know as well as I what sort of guest leaves that behind.',
    'Hm. That belongs to a particular sort of person, doesn’t it. We can both count who is at this table.',
    'A curious thing to find where you found it. I shall leave the arithmetic to you.',
    'That narrows the table considerably, I should think.',
  ],
  'evidence.identify.gracious': [
    'I would not wish to point a finger — but that does rather suggest a certain kind of guest, does it not.',
  ],
  'evidence.identify.prickly': [
    'Well, it is not mine, and you can see that for yourself. Look at who it does fit.',
  ],
  'evidence.identify.gossipy': [
    'Oh, my. Oh, that is telling. I can think of who that points to, and so can you.',
  ],
  'evidence.identify.reserved': ['Not mine. You know whose it might be.'],
  'evidence.identify.dramatic': [
    'There! There is your clue, detective — and it does not point at me!',
  ],

  // Shown the trace they themselves left, in the room where they were alone.
  // Followed by their account of where they were.
  'evidence.trace.own.any': [
    'That is mine, I am afraid. I told you where I was; there is the proof of it.',
    'Yes — mine. I left it where I sat. I said as much, if you recall.',
    'Mine, and I am glad of it for once. It says what I said.',
    'I will own to that. It was where I was, and so was I.',
    'You found it where I told you I had been. I should hope that settles it.',
    'That is mine. I did not think to tidy up after myself; I had no notion I should need an alibi.',
  ],
  'evidence.trace.own.gracious': [
    'Oh — that is mine. How good of you to have looked. It bears me out, I think.',
  ],
  'evidence.trace.own.prickly': [
    'Mine. Which is to say I was exactly where I told you I was. Satisfied?',
  ],
  'evidence.trace.own.gossipy': [
    'Oh, that is mine! There, you see? I told you where I was, and nobody believed me, and there it is.',
  ],
  'evidence.trace.own.reserved': ['Mine. I was there.'],
  'evidence.trace.own.dramatic': [
    'Mine! Thank heaven for small carelessness — there is my witness, detective, since I had no other!',
  ],

  'evidence.weapon.deny.any': [
    'I had the means. I am not fool enough to deny it. I am also not the one who used them.',
    'Yes, that was within my reach. Reach is not deed.',
    'Yes — I could have laid hands on that. So could half this table, and you know it. Access is not action, detective.',
    'You show me that as though it were a verdict. Very well: I could have managed it. So could others. Look further.',
    'I will not pretend I could not have done that. I will tell you I did not.',
    'Could I have? Yes. Did I? No. The first is a fact about the house; the second is a fact about me.',
  ],
  'evidence.weapon.deny.gracious': [
    'I will be honest: yes, that was within my reach. I hope you will believe that reach is all it was.',
  ],
  'evidence.weapon.deny.prickly': [
    'Yes, I could have. So what? So could others. Go and bother them.',
  ],
  'evidence.weapon.deny.gossipy': [
    'Well, yes, I could have got at that — and so, I might mention, could one or two others at this table.',
  ],
  'evidence.weapon.deny.reserved': ['I could have. I did not.'],
  'evidence.weapon.deny.dramatic': [
    'Yes, I could have — and I shall be haunted by that could all my days! But I did not, I did not!',
  ],

  'evidence.weapon.comment.any': [
    'I could not have done that. Look at me, detective — you know I could not.',
    'That is beyond my capacity. Somebody else’s, evidently.',
    'Grim. And beyond me, I am afraid — as you can see for yourself.',
    'So that is how it was done. Not by my hand; I could not have managed it had I wished to.',
    'Horrible. I could not have done that if my life depended upon it — which, I suppose, it may.',
    'That was not within my means, detective. Others’, perhaps. Not mine.',
  ],
  'evidence.weapon.comment.gracious': [
    'How dreadful. I could not have done such a thing — I lack the means, as I think you know.',
  ],
  'evidence.weapon.comment.prickly': [
    'Nothing to do with me. I could not have, and I would not have. Next.',
  ],
  'evidence.weapon.comment.gossipy': [
    'So that is how! Well — it rules me out, and I could tell you who it does not rule out.',
  ],
  'evidence.weapon.comment.reserved': ['Not something I could have done.'],
  'evidence.weapon.comment.dramatic': [
    'Take it away — I cannot look at it! It was not I; I could not have done it, not in a thousand years!',
  ],

  'evidence.lockbox.any': [
    'The box was forced? Then somebody in this house wanted money badly enough to risk everything for it.',
    'A thief, then, in the same hour as a killer. I should not like to be either tonight.',
    'That is a nasty piece of work. And clumsy. A clumsy thief is a frightened one.',
    'He kept that box locked as a matter of pride. Whoever forced it knew that, and did not care.',
    'Forced, you say? Then we have a thief under this roof as well as a murderer. What a weekend.',
    'His lordship’s strongbox! There was money in that box, detective — and somebody knew it.',
    'Somebody has been at the box. Well. That is a second crime, or the same one wearing a different coat.',
    'A theft, on top of everything. Either the killer wanted money, or somebody took a very poor moment to be greedy.',
  ],
  'evidence.lockbox.gracious': [
    'Poor man. To be robbed as well — it seems almost spiteful.',
    'Oh, how sordid. Poor man — robbed, on top of it all.',
  ],
  'evidence.lockbox.prickly': [
    'Somebody wanted the cash. It was not me. That is all I will say of a strongbox.',
    'A thief, then. I trust you will not lay that at my door as well.',
  ],
  'evidence.lockbox.gossipy': [
    'Oh, that box! There have been whispers about that box all weekend. Whispers!',
    'The strongbox! I did wonder about that box. Everyone knew what was in it, you know. Everyone.',
  ],
  'evidence.lockbox.reserved': ['A theft, then.', 'Forced. So there is a thief too.'],
  'evidence.lockbox.dramatic': [
    'Forced! By a hand under this very roof! Is nothing sacred?',
    'Robbery and murder in a single night! This house is cursed, I say — cursed!',
  ],

  'evidence.doc.deny.any': [
    'Where did you — no. No. You have hold of something twisted out of all meaning. Hear how things truly stood:',
    'Papers can be made to say anything. I will tell you how matters actually were:',
    'That is — that is not what it looks like. Let me tell you how things really stood between us.',
    'You have found a scrap and mistaken it for the whole. The truth is simpler:',
  ],
  'evidence.doc.deny.gracious': [
    'I can see how that reads. Please — let me tell you how it truly was.',
  ],
  'evidence.doc.deny.prickly': ['Rubbish. Whatever that says, here is the fact of it:'],
  'evidence.doc.deny.gossipy': [
    'Oh, that old thing. You must not believe everything written down in this house. The truth is far duller:',
  ],
  'evidence.doc.deny.reserved': ['That is wrong. The truth:'],
  'evidence.doc.deny.dramatic': [
    'Lies! Lies on paper are still lies! Hear the truth from a living mouth:',
  ],

  'evidence.doc.confirm.any': [
    'So you found it. I suppose I always knew somebody would.',
    'Yes. I shan’t dress it up — better you hear it from me than from the house.',
    'That is genuine. I would not insult you by pretending otherwise.',
    'Ah. Well. There is no unsaying that, so I shall say it properly.',
  ],
  'evidence.doc.confirm.gracious': [
    'I am glad, in a way, that it is out. I will tell you the truth of it.',
  ],
  'evidence.doc.confirm.prickly': [
    'Yes, that is what it looks like. I do not deny it. I do deny what you are about to think.',
  ],
  'evidence.doc.confirm.gossipy': [
    'Oh — you found that. Well, I never was any good at hiding things. Here is the truth of it.',
  ],
  'evidence.doc.confirm.reserved': ['That is true.'],
  'evidence.doc.confirm.dramatic': [
    'Then my secret is out, and I shall bear it with what dignity I have left.',
  ],

  'evidence.doc.gossip.any': [
    'That paper only says aloud what half the house has whispered for weeks.',
    'I am not surprised. Let me tell you why I am not surprised.',
    'Ah — so it is written down. I could have told you as much, and now I shall.',
    'That confirms a thing I had heard. Here is what I had heard.',
  ],
  'evidence.doc.gossip.gracious': ['I had hoped that was only talk. It seems it was not.'],
  'evidence.doc.gossip.prickly': ['Old news, to anyone who paid attention.'],
  'evidence.doc.gossip.gossipy': [
    'Well! I knew it. I knew it, and nobody believed me, and here it is in ink.',
  ],
  'evidence.doc.gossip.reserved': ['I had heard as much.'],
  'evidence.doc.gossip.dramatic': [
    'So the rumour was true! I felt it — one always feels these things!',
  ],

  'evidence.doc.comment.any': [
    'I know nothing of that paper. Its author does, I should think.',
    'Somebody’s private grief, laid out in ink. It is not mine to explain.',
    'That is the first I have seen of it. It makes for uneasy reading.',
    'Not my affair. Though I can see it is very much somebody’s.',
    'I will not pretend to understand another guest’s papers. Ask the guest.',
    'Not my hand, and not my business — though it is certainly somebody’s.',
    'Dark reading for a stormy night. It changes how one looks at certain guests, does it not.',
    'That is news to me. Unpleasant news, but news.',
    'I know nothing of that. I should think its owner knows a great deal.',
  ],
  'evidence.doc.comment.gracious': [
    'I am sorry to have read that. It was not meant for my eyes, or yours.',
    'I had no idea. How sad — for everyone concerned.',
  ],
  'evidence.doc.comment.prickly': [
    'Not mine, not my concern. Take it to whomever it concerns.',
    'Nothing to do with me. Ask whoever it is about.',
  ],
  'evidence.doc.comment.gossipy': [
    'Well — I had suspected something, but not THAT. May I tell someone?',
    'Now that I had NOT heard. Goodness. May I read it again?',
  ],
  'evidence.doc.comment.reserved': ['Not mine.', 'Not mine. I know nothing of it.'],
  'evidence.doc.comment.dramatic': [
    'Such a letter! One reads it and hears the whole house creak.',
    'What a document! One reads it and the whole table rearranges itself before one’s eyes!',
  ],

  'evidence.flavor.any': [
    'Somebody’s rubbish. Not a clue, I think, unless untidiness is a crime.',
    'You will find one of those in every room of this house. It means nothing.',
    'Hm? No. That is just — a thing. It was there before any of this.',
    'I would not waste a page on that, detective.',
    'You are grasping, if you are showing me that.',
    'If that is your best evidence, we shall all be here till Christmas.',
    'That? The house is full of such litter. I should not read anything into it.',
    'If that is a clue, detective, then everything in this house is a clue, including the pheasant.',
    'I cannot think what you expect me to say about that.',
    'I have seen a hundred of those. I should put it back where you found it.',
  ],
  'evidence.flavor.gracious': [
    'I do not want to discourage you — but I do not think that is anything.',
    'Forgive me; I cannot see what that has to do with anything.',
    'I am afraid that means nothing to me. I wish it did.',
  ],
  'evidence.flavor.prickly': [
    'You woke me for that?',
    'Nothing. Put it back.',
    'That is rubbish, and you know it. Next.',
  ],
  'evidence.flavor.gossipy': [
    'Oh, that? Everyone has handled that. It is not worth a whisper.',
    'If that signified, I should have heard about it by now.',
    'Oh, that has been lying about for ages. Nothing in it, I promise you.',
  ],
  'evidence.flavor.reserved': ['That is nothing.', 'No.', 'Nothing.'],
  'evidence.flavor.dramatic': [
    'Nothing, nothing — put it away before I imagine something!',
    'A trifle. A trifle! And yet my heart jumped to see it.',
    'Is that — no. No, that is nothing. Forgive me; my nerves leap at everything.',
  ],

  // =====================================================================
  // PRESS
  // =====================================================================
  'press.confess.any': [
    'All right — all RIGHT. You shall have it, and you will see it has nothing whatever to do with murder.',
    'Stop. Before you say the word “killer”, I will tell you what I actually was doing that hour — and shame me as it may, it is not that.',
    'Enough. I lied to you, and I am about to stop, and you will wish I had lied a little longer.',
  ],
  'press.confess.indignant': [
    'Very WELL. Since you will have it. I am guilty — of something. Not of that. Listen before you gloat.',
  ],
  'press.confess.flustered': [
    'I — oh, God. Yes. Yes, all right, it was not true, none of it — but not murder, I swear to you, not that—',
  ],
  'press.confess.calm': [
    'Yes. You have me. I would rather tell it plainly now than have it dragged out of me later.',
  ],
  'press.confess.selfdoubting': [
    'I knew this would not hold. I knew it and I said it anyway. Here is the truth, then — the shabby truth.',
  ],

  // Everything that is NOT a confession — the culprit deflecting, the drunk
  // baffled, an honest guest standing firm — comes out of this ONE bank, keyed
  // only by defense style. Each line must read naturally from all three.
  'press.hold.any': [
    'My story stands, detective. Test it as you please.',
    'I said what I said because it is true. Nothing you have found changes that.',
    'Then somebody else is mistaken, or lying. I am neither.',
    'You call it a contradiction. I call it somebody else’s error. I know where I was.',
    'Two accounts differ, and you come to me? Ask yourself who benefits from the other one.',
    'I have told you what I did. If it clashes with another story, look hard at that story.',
    'You tell me it cannot be true, and yet I remember it as plainly as your face. One of us is being made a fool of, detective.',
    'I do not understand it. I said what I know. I — give me a moment.',
  ],
  'press.hold.indignant': [
    'How DARE you. I have answered every impertinent question this evening, and you repay me with arithmetic tricks? Look to the others’ stories, not mine.',
    'I will not be cross-examined like a poacher. Whoever contradicts me has their own reasons, and you would do well to ask what they are.',
    'This is outrageous. You take some other guest’s word over mine and call it evidence?',
    'I have told you the truth once and I do not propose to improve upon it. Whoever contradicts me is lying.',
    'You would take some other account over mine? Then you are a poorer judge than I took you for.',
    'I resent this. I resent it deeply. And I do not withdraw a word.',
    'I am not in the habit of being called a liar. I told you what I remember, and I remember it — I DO remember it.',
  ],
  'press.hold.flustered': [
    'I — that isn’t — you have muddled it somehow, the times, the rooms — anyone can misspeak, it was a dreadful evening—',
    'No — no, that is not — someone has told you wrong, or I said it wrong, or — the clocks in this house are never right—',
    'You are confusing me. Everyone is confusing me tonight. Ask whoever said otherwise; ask them properly—',
    'I know how it looks — but I told it straight, I swear it. Check again. Ask anyone. Ask them twice—',
    'It is true, it IS — I would not know how to make it up — please, ask the others again—',
    'I have not changed a thing because there is nothing to change — oh, why does no one believe the truth when they hear it?',
    'No — but — I was so certain — was I? I was. I think I was. Oh, don’t look at me like that—',
  ],
  'press.hold.calm': [
    'You have found a knot in somebody’s account, I agree. I would only caution you: the person who told you the contrary has reasons of their own.',
    'I understand why you are asking. My answer is unchanged. I would look again at the other account, if I were you.',
    'It is a discrepancy, certainly. Discrepancies have two ends, and you are only holding one of them.',
    'I understand the difficulty. Nevertheless my account stands. I was where I said I was; the error is not mine.',
    'You will find, when it is all untangled, that I told you the truth. I am content to wait.',
    'I have nothing to add and nothing to retract. That is not stubbornness. It is simply what happened.',
    'That is troubling. I would have sworn to it. I would still swear to it, though I begin to see why you would not let me.',
  ],
  'press.hold.selfdoubting': [
    'Have I said something crooked? I… the evening is a blur, detective. If a word of mine came out wrong, it was the shock. Not guilt.',
    'Did I say that? Perhaps I did. I do not — the other account may be wrong too, you know. People are wrong all the time.',
    'I may have muddled a detail. Anyone might. But the substance — no, the substance is right. It must be.',
    'You make me doubt my own shadow… but no. No. I remember it truly, and I hold to it.',
    'I have gone over it and over it since you asked. I keep arriving at the same place. It is the truth.',
    'I wish I could give you something else. I cannot. What I said is what I know.',
    'Oh dear. Oh dear. I was so sure. I was SO sure. Could I have — no. …Could I?',
    'I have been wrong before. I did not think I was wrong tonight. Now I do not know what I think.',
  ],
}

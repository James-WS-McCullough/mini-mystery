import type { DialogueBanks } from '../schema'

// The manor's voice. RULES OF THE BANKS:
//  - Keys are `<lineKey>.<temperament|defense>` or `<lineKey>.any`.
//  - Claim templates carry the structural content; openers carry only voice.
//  - Banks are shared by the honest and the lying alike — a Bluffer's cover
//    story and a real witness's testimony come out of the SAME templates, so
//    surface style never betrays alignment. Prose never adds facts.

export const dialogue: DialogueBanks = {
  // ---------- claim sentences (the structural content) ----------
  'claim.role': [
    'As to what I was in all this: I am {roleName}.',
    'You may as well have it plainly — I am {roleName}.',
  ],
  'claim.whereabouts.alone': [
    'For the half hour in question I was in {room}, quite alone.',
    'I was in {room}. Alone, as it happens — which I realise serves me poorly.',
    'You will find me difficult to corroborate: {room}, by myself, the whole of it.',
  ],
  'claim.whereabouts.company': [
    'I was in {room} the whole while, and not alone — {companions} can vouch for every minute.',
    'From half past six I was in {room} with {companions}. Neither of us so much as opened the door.',
  ],
  'claim.sighting': [
    'I saw {target} in {room} during the half hour — of that I am certain.',
    'One thing I can swear to: {target} was in {room}. I saw it with my own eyes.',
    '{target} was in {room} then. Whatever else is in doubt, that is not.',
  ],
  'claim.glimpse': [
    'I only glimpsed the figure near {room} — but whoever it was {trait}.',
    'I could not tell you the face. What I can tell you is that whoever I saw by {room} {trait}.',
  ],
  'claim.culpritAttr.trait': [
    'Mark me: the one you want {trait}.',
    'I cannot give you a name. I can give you this: your killer {trait}.',
  ],
  'claim.culpritAttr.parity': [
    'The guilty one sits at an {parity} place at table — seats {seatList}. Laugh if you like; you will see.',
    'Call it intuition, call it what you please: an {parity} chair — {seatList} — holds your murderer.',
  ],
  'claim.alignment.good': [
    'Whatever you may come to think tonight, {target} is true. I would stake my life upon it.',
    'Strike {target} from your dark little list. I know things about this house, and I know that.',
  ],
  'claim.alignment.evil': [
    'Look closely at {target}. There is rot there — I promise you.',
    'I will say it only once, and quietly: {target} is not what {target} pretends to be.',
  ],
  'claim.relationship.self.devoted': [
    'I loved him dearly. He was family to me, whatever anyone whispers.',
    'How did things stand between us? He was the best friend I had in the world. Now you know my loss.',
  ],
  'claim.relationship.self.cordial': [
    'His lordship and I were on perfectly good terms. Perfectly good.',
    'We got on well, he and I. No quarrels, no debts, no history. Merely — friends.',
  ],
  'claim.relationship.self.strained': [
    'We had our frictions, he and I. I shan’t insult you by pretending otherwise.',
    'There was a coolness between us of late. Nothing that ends in murder — but I won’t deny the coolness.',
  ],
  'claim.relationship.self.hostile': [
    'Since you ask: we despised one another, and I’ll not weep false tears now.',
    'I hated him. There — I have said what everyone else will only hint at. Hatred is not a confession.',
  ],
  'claim.relationship.self.indebted': [
    'I owed him money. A very great deal of money. You would have found it out anyway.',
    'The truth? I was in his debt to a sum I do not like saying aloud. That is motive in your book, I imagine. It is misery in mine.',
  ],
  'claim.relationship.self.jilted': [
    'He threw me over, once upon a time. One does not forget it; one merely learns to dine with it.',
    'There was an understanding between us, years ago, and he ended it badly. I have carried that politely ever since.',
  ],
  'claim.relationship.gossip.devoted': [
    '{subject} worshipped {victim} — anyone in this house will tell you the same.',
  ],
  'claim.relationship.gossip.cordial': [
    '{subject} and {victim} got along well enough, so far as I ever observed.',
  ],
  'claim.relationship.gossip.strained': [
    'There was a coolness between {subject} and {victim} of late. Everyone pretended not to notice. Everyone noticed.',
    '{subject} and {victim} had been carefully polite with one another for weeks. That kind of polite.',
  ],
  'claim.relationship.gossip.hostile': [
    '{subject} and {victim}? At daggers drawn. The quarrels carried through the walls of this house.',
    'Ask anyone: {subject} and {victim} could not share a room without the temperature dropping.',
  ],
  'claim.relationship.gossip.indebted': [
    '{subject} owed {victim} money — serious money, the kind that curdles a friendship.',
    'It was money between {subject} and {victim}. A great deal of it, and none of it forgiven.',
  ],
  'claim.relationship.gossip.jilted': [
    '{victim} broke an engagement with {subject}, you know. Years ago. Some wounds keep beautifully.',
  ],
  'claim.heard.crash': [
    'During that half hour I heard a crash from {room} — glass, or a lock giving way. I told myself it was the storm.',
    'I heard something break in {room}. A sharp, deliberate sort of sound. Not thunder — I know thunder.',
  ],
  'claim.heard.quarrel': [
    'That afternoon there were raised voices in {room} — a proper quarrel, though the words escaped me.',
    'Earlier in the day I passed near {room} and heard {victim} quarrelling with someone. Bitterly.',
  ],
  'claim.suspicion': [
    'If you want the truth of my heart, I have had my eye on {target} all evening.',
    'I make no accusation. I merely observe that {target} has not been themselves tonight.',
  ],

  // ---------- reactions (the free opener) ----------
  'reaction.plain.gracious': [
    'A dreadful business, detective. Ask of me whatever you need — the house owes you its candor.',
    'I keep hoping there has been some mistake. There hasn’t, has there. Very well — I am at your disposal.',
  ],
  'reaction.plain.prickly': [
    'Well? Am I to be gawped at, or questioned? Get on with it.',
    'I’ll say this once: I did not care for the man’s manner at dinner, and I care for murder even less.',
  ],
  'reaction.plain.gossipy': [
    'Isn’t it too awful? And yet — one had a feeling, didn’t one? This house has been holding its breath all week.',
    'Come, sit by me a moment. If it’s truth you’re after, I hear everything in this house eventually.',
  ],
  'reaction.plain.reserved': [
    'I have nothing to volunteer. Ask, and I will answer.',
    'A terrible thing. I will help where I am able.',
  ],
  'reaction.plain.dramatic': [
    'Murder! Under this very roof, while we dressed for dinner like innocents! I shall never sleep again.',
    'I have been rehearsing what to tell you, and it is this: someone at that table tonight is wearing a mask.',
  ],
  'reaction.heard.crash.any': [
    'You’ll want more than handshakes and alibis tonight, detective — so I’ll give you something real.',
    'Before you begin your clever questions, there is a thing you ought to know.',
  ],
  'reaction.heard.quarrel.any': [
    'There is something I ought to have told somebody long before now.',
    'You will ask what we all saw. Let me tell you instead what I heard.',
  ],
  'reaction.accuse.any': [
    'You needn’t look far, in my opinion. {target} has been wrong all evening — wrong the way a picture hangs wrong.',
    'Save your ink for one name: {target}. There. Someone had to say it.',
  ],
  'reaction.accuse.dramatic': [
    'Must I say it aloud? Very well — {target}! It is said, and heaven forgive me, I am glad it is said.',
  ],
  'reaction.weaponhint.any': [
    'Something has nagged at me since we found him: {room} is not as it should be. Something missing — or something present that has no business there.',
    'If I were hunting the HOW of it, detective, I should start with {room}. Call it a housekeeping instinct; the house is very slightly wrong there.',
  ],
  'reaction.referral.any': [
    'I saw nothing of use, I regret to say — but {victim} shut himself away in {room} all afternoon, scratching at some paper or other. Were I you, I should look there.',
    'One odd thing, since you ask: {victim} spent the whole afternoon locked in {room}, writing. Whatever he wrote is presumably still in that room.',
  ],
  'reaction.plain.any': [
    'A black night for this house. Ask what you must.',
  ],

  // ---------- the questions ----------
  'role.vague.any': [
    'What was I, in all this? A guest with dreadful luck. Ask me something worth answering.',
    'We are to trade in secrets now, are we? Ask me again when you have earned it.',
  ],
  'role.vague.reserved': ['I would sooner not say. Not yet.'],
  'role.vague.prickly': ['My affairs are my own. Ask your other questions.'],
  'role.claim.any': ['Very well — you may as well know it.', 'Since it will come out regardless:'],

  'alibi.alone.any': [
    'My whereabouts? Nothing simpler.',
    'You want the half hour accounted for. Here it is, for whatever my word buys.',
  ],
  'alibi.company.any': [
    'Happily, I need not rely on my own word alone.',
    'That, at least, is easily answered.',
  ],

  'knowledge.vague.any': [
    'Know? What should I know? I keep to my own affairs.',
    'You are fishing, detective. I am not yet certain I care to be caught.',
    'If I knew anything worth your time, I am not sure this drawing room is the place to say it.',
  ],
  'knowledge.share.any': [
    'I shall deal with you squarely.',
    'What I can offer you is this.',
    'Listen, then, and make of it what you will.',
  ],
  'knowledge.hedged.any': [
    'I will tell you what I know — though mind, it may be read more ways than one.',
    'Facts I have; conclusions I leave to you. It could mean one thing. It could as easily mean another.',
    'Take this with a grain of salt the size of the salt cellar.',
  ],

  'suspect.point.any': [
    'You asked, so I shall say it: {target}. Watch the eyes when you ask about the half hour.',
    '{target}. I have no proof you could hang a hat on — only that everything about this evening points one way.',
    'In my view you are wasting the candles on the rest of us while {target} sits there so very quietly.',
  ],
  'suspect.hedge.any': [
    'If it was about old grudges, look at {target} — but if it was money, why, the whole picture turns, doesn’t it?',
    'Pressed for a name I might say {target}. Yet I could argue you the opposite over a single glass of sherry.',
    'It could be {target}. It could be nearly anyone. That is the true horror of this evening.',
  ],
  'suspect.none.any': [
    'I could not put a name to it — truly. Though if you want someone worth asking, try {person}.',
    'I make no accusations. {person} sees more of this house than I do; ask there.',
    'None I would swear to before a judge. Speak to {person} — and listen carefully.',
  ],

  'about.person.any': [
    'Since you ask about them:',
    'What I can tell you is small, but it is honest.',
  ],
  'about.referral.any': [
    'There I am no use to you — but {person} will be. Ask them.',
    'You are asking the wrong guest. Put that question to {person}.',
    'I scarcely crossed their path all evening. {person} is your better bet.',
  ],
  'about.nothing.any': [
    'There I can offer you nothing at all, I am afraid.',
    'We exchanged perhaps ten words all weekend, and six of them were about the weather.',
    'Nothing worth a line in your notebook.',
  ],
  'about.victim.any': [
    'You want to know how things stood between us. Fair enough.',
    'I wondered when you would come to that question.',
  ],

  // ---------- shown evidence ----------
  'evidence.deny.any': [
    'That? You may put it away. It is nothing of mine, whatever it resembles.',
    'I know what you are implying, and I shall thank you not to. Half the county could have left that.',
    'If you are asking whether it is mine — no. Flatly, no.',
  ],
  'evidence.identify.any': [
    'Let me look at it properly. …Yes. I think you know as well as I what sort of guest leaves that behind.',
    'Hm. That belongs to a particular sort of person, doesn’t it. We can both count who is at this table.',
    'A curious thing to find where you found it. I shall leave the arithmetic to you.',
  ],
  'evidence.weapon.deny.any': [
    'Yes — I could have laid hands on that. So could half this table, and you know it. Access is not action, detective.',
    'You show me that as though it were a verdict. Very well: I could have managed it. So could others. Look further.',
  ],
  'evidence.weapon.comment.any': [
    'Grim. And beyond me, I am afraid — as you can see for yourself.',
    'So that is how it was done. Not by my hand; I could not have managed it had I wished to.',
  ],
  'evidence.lockbox.any': [
    'Forced, you say? Then we have a thief under this roof as well as a murderer. What a weekend.',
    'His lordship’s strongbox! There was money in that box, detective — and somebody knew it.',
  ],
  'evidence.doc.deny.any': [
    'Where did you — no. No. You have hold of something twisted out of all meaning. Hear how things truly stood:',
    'Papers can be made to say anything. I will tell you how matters actually were:',
  ],
  'evidence.doc.confirm.any': [
    'So you found it. I suppose I always knew somebody would.',
    'Yes. I shan’t dress it up — better you hear it from me than from the house.',
  ],
  'evidence.doc.gossip.any': [
    'That paper only says aloud what half the house has whispered for weeks.',
    'I am not surprised. Let me tell you why I am not surprised.',
  ],
  'evidence.doc.comment.any': [
    'Not my hand, and not my business — though it is certainly somebody’s.',
    'Dark reading for a stormy night. It changes how one looks at certain guests, does it not.',
  ],
  'evidence.flavor.any': [
    'That? The house is full of such litter. I should not read anything into it.',
    'If that is a clue, detective, then everything in this house is a clue, including the pheasant.',
  ],

  // ---------- press ----------
  'press.confess.any': [
    'All right — all RIGHT. You shall have it, and you will see it has nothing whatever to do with murder.',
    'Stop. Before you say the word “killer”, I will tell you what I actually was doing that half hour — and shame me as it may, it is not that.',
  ],
  'press.deflect.indignant': [
    'How DARE you. I have answered every impertinent question this evening, and you repay me with arithmetic tricks? Look to the others’ stories, not mine.',
  ],
  'press.deflect.flustered': [
    'I — that isn’t — you have muddled it somehow, the times, the rooms — anyone can misspeak, it was a dreadful evening—',
  ],
  'press.deflect.calm': [
    'You have found a knot in somebody’s account, I agree. I would only caution you: the person who told you the contrary has reasons of their own.',
  ],
  'press.deflect.selfdoubting': [
    'Have I said something crooked? I… the evening is a blur, detective. If a word of mine came out wrong, it was the shock. Not guilt.',
  ],
  'press.deflect.any': [
    'You call it a contradiction. I call it somebody else’s error. I know where I was.',
  ],
  'press.baffled.any': [
    'But that isn’t — no. No, I know what I know. …Don’t I? Ask me again. Ask me slowly.',
    'You tell me it cannot be true, and yet I remember it as plainly as your face. One of us is being made a fool of, detective.',
  ],
  'press.baffled.selfdoubting': [
    'Oh dear. Oh dear. I was so sure. I was SO sure. Could I have — no. …Could I?',
  ],
  'press.standfirm.indignant': [
    'I have told you the truth once and I do not propose to improve upon it. Whoever contradicts me is lying.',
  ],
  'press.standfirm.flustered': [
    'I know how it looks — but I told it straight, I swear it. Check again. Ask anyone. Ask them twice—',
  ],
  'press.standfirm.calm': [
    'I understand the difficulty. Nevertheless my account stands. I was where I said I was; the error is not mine.',
  ],
  'press.standfirm.selfdoubting': [
    'You make me doubt my own shadow… but no. No. I remember it truly, and I hold to it.',
  ],
  'press.standfirm.any': ['My story stands, detective. Test it as you please.'],
}

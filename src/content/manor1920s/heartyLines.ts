// The HEARTY manner: the breezy young-man-about-town of Christie's Seven
// Dials — "Eh, what?", "I say!", "jolly rum business" — who calls everybody
// "old <first name>" whatever their age. Drafted by a cheaper model to a brief
// and checked by hand.  and  render as "old Hugo".

import type { DialogueBanks } from '../schema'

export const heartyLines: DialogueBanks = {
  'alibi.forgot.hearty': [
    'Dash it all, if only I could remember!',
    'I was there all right, but when? Haven\'t a clue, I\'m afraid.',
  ],
  'reaction.plain.hearty': [
    'Good lord, what a ghastly business! Fire away with your questions, {detective}.',
    'Absolutely dreadful, this. Right then, let\'s have it — what do you need?',
    'Eh, what a turn-up for the books! Ask what you must, {detective}.',
  ],
  'reaction.heard.crash.hearty': [
    'Hold on, {detective} — I\'ve something rather important you ought to hear.',
    'Before you go pointing fingers, {detective}, there\'s something I witnessed you should know.',
    'Jolly good thing you\'re here — I\'ve got something that rather matters to tell you.',
  ],
  'reaction.overheard.hearty': [
    'Right, I ought to say — there\'s something I\'ve been keeping to myself.',
    'Eh, well, I heard rather a lot I probably should have mentioned earlier.',
    'I say, I\'ve been quiet about this, but you\'re the detective — might as well hear it all.',
  ],
  'reaction.accuse.hearty': [
    'Look, I know it sounds daft, but {target} — that\'s the one.',
    '{target} did it, I\'d stake money on it.',
    'All I\'m saying is, watch {targetOld}. Everything about tonight screams it.',
  ],
  'reaction.referral.hearty': [
    'Tell you what, old {victim} locked {himself} in {room} all afternoon, scribbling away. Worth checking.',
    '{victim} was shut up in {room} the whole time, writing at something. Better look there.',
    'Odd thing — {victim} had {himself} locked away in {room} all afternoon. Whatever {he} wrote is still there, I\'d wager.',
  ],
  'role.vague.hearty': [
    'My part? Hardly matters, does it? Ask me something that actually counts.',
    'What was I? A {one} having a rotten night, like everyone else. Anything else?',
  ],
  'role.claim.hearty': [
    'Right-o! Out with it then — I\'ll give you the straight goods.',
    'Absolutely, {detective} — here\'s the truth of it, no hedging.',
  ],
  'alibi.alone.hearty': [
    'Where was I? On my own, I\'m afraid — rotten luck, that.',
    'My whereabouts? Simple enough — by myself the whole time, rather rotten luck.',
  ],
  'alibi.company.hearty': [
    'Fortunately for me, I\'m not stuck with just my word for this one.',
    'That\'s the good bit — I\'ve got somebody who can say where I was, thank goodness.',
  ],
  'knowledge.vague.hearty': [
    'Not sure I\'ve got anything that\'ll help you much, {detective}.',
    'There might be something useful, or there might not — depends what you\'re asking.',
  ],
  'knowledge.share.hearty': [
    'Right-o! Here\'s the lot.',
    'I\'ll be dead straight with you — here\'s every blessed thing I know.',
  ],
  'knowledge.hedged.hearty': [
    'I\'ll tell you what I know, but it cuts both ways, doesn\'t it?',
    'Facts are one thing — meaning them is quite another. Make of it what you will.',
  ],
  'suspect.point.hearty': [
    'Got to be {targetOld} — everything points that way, absolutely certain.',
    'If you want an answer, it\'s {target}. I\'d wager {house} on it.',
  ],
  'suspect.hedge.hearty': [
    'If I had to pick, I\'d say {targetOld} — though I could be completely wrong.',
    '{target}, perhaps, but I could argue the opposite just as easily.',
  ],
  'suspect.vouch.hearty': [
    'Not {targetOld}, at any rate — couldn\'t have been them.',
    '{target}? No, dash it all, they\'re innocent. I\'d stake my life on it.',
  ],
  'suspect.none.hearty': [
    'Haven\'t got a clue, I\'m afraid. Though {person} might know better.',
    'No name from me, but {person}\'s been sharp as a tack all evening — give them a try.',
  ],
  'about.person.hearty': [
    'Not much to tell, but here goes — I\'ll give you what I know of them.',
    'Since you\'re asking, I\'ve got a bit to say about that one.',
  ],
  'about.referral.hearty': [
    '{person} could tell you far more than I — they were in a position to know.',
    'You\'d get a better answer from {person}. They\'ll know better.',
  ],
  'about.nothing.hearty': [
    'Barely know the person, {detective}. Couldn\'t tell you a blessed thing about them.',
    'Don\'t know them from Adam, I\'m afraid. We exchanged perhaps three words all evening.',
  ],
  'about.victim.hearty': [
    'The dead man? Right-o, I\'ll tell you how things stood with {victim}.',
    'You mean how things stood between us? Fair enough. Ask away, what?',
  ],
  'evidence.deny.hearty': [
    'Not mine! Dash it all, that\'s nothing to do with me.',
    'Mine? Absolutely not! Look elsewhere, old thing.',
  ],
  'evidence.identify.hearty': [
    'Not mine, old thing. But you can see as well as I can who it belongs to, eh?',
    'Not mine. That rather belongs to someone else, doesn\'t it? You know it as well as I do.',
  ],
  'evidence.trace.own.hearty': [
    'Yes, that\'s mine. There\'s your proof I was telling the truth!',
    'Right you are — mine. Shows exactly where I was, doesn\'t it?',
  ],
  'evidence.weapon.deny.hearty': [
    'Could I have used it? Probably. Did I? No. That\'s the end of it.',
    'Had access, yes. But access isn\'t guilt, is it? I didn\'t do it.',
  ],
  'evidence.weapon.comment.hearty': [
    'Beyond me, that is. Quite beyond me. Look at me, {detective} — could I do it?',
    'I couldn\'t do that in a lifetime. Somebody else, evidently.',
  ],
  'evidence.lockbox.hearty': [
    'The box was forced? So we\'ve got a thief on top of everything! Jolly rum business.',
    'Someone wanted what was inside badly enough to smash it open. Rather dramatic, that.',
  ],
  'evidence.doc.deny.hearty': [
    'That\'s twisted, that is. Here\'s the honest truth, no more nonsense:',
    'You\'ve got it all wrong! Let me straighten you out:',
  ],
  'evidence.doc.confirm.hearty': [
    'Yes, that\'s genuine. I\'ve been expecting you to dig that up, actually.',
    'So you found it. Yes, it\'s authentic. Better from me than from the rest, eh?',
  ],
  'evidence.doc.gossip.hearty': [
    'That only puts in writing what everyone\'s been whispering about for weeks!',
    'That paper confirms what I already knew. Here\'s the truth:',
  ],
  'evidence.doc.comment.hearty': [
    'I\'ve no idea where that came from. First I\'m seeing it.',
    'Seeing that for the first time, same as you. Rather gloomy reading, isn\'t it?',
  ],
  'evidence.flavor.hearty': [
    'You\'ll find things like that all over {house}. Means nothing at all.',
    'That\'s just rubbish. Belongs in the dustbin, not on your table.',
  ],
  'knowledge.silent.hearty': [
    'Who I am? Free of charge. What I know? Shop\'s shut, {detective}. Not a word!',
    'You can have my name for it. The rest I\'m keeping to myself, I\'m afraid.',
  ],
  'evidence.bare.hearty': [
    'Gone walkabout, has it? Then somebody walked it off, didn\'t they?',
    'Whatever did it has vanished. Someone\'s tidied up after the murderer.',
  ],
  'evidence.bribe.hearty': [
    'Nobody ever leaves ME envelopes like that! Read the name on it yourself.',
    'Somebody\'s done rather well out of tonight. Not me, worse luck. Read it.',
  ],
  'evidence.passage.hearty': [
    'A secret passage! {thisHouse} just keeps getting better! Shame about the murder, though.',
    'Well, that\'s one way to skip {passage}, isn\'t it? Who was at the end of it?',
  ],
  'confession.hearty': [
    'Well, this has been frightfully good fun, but I can\'t let you make a fool of yourself. Sit down, {detective}.',
    'Stop right there, {detective}. Before you name anyone — it\'s my name you want.',
  ],
  'lastWords.hearty': [
    'Oh, it\'s you! Come to tuck me in, have you?',
    'Fancy seeing you! What on earth are you doing creeping about up here?',
  ],
  'gathered.hearty': [
    'Well, this is cosy. Go on then, {detective} — who\'s for the drop?',
    'I\'d like it noted I\'ve been perfectly well behaved all evening. Counts for something?',
    'Right then. Who is it? Let\'s have the whole ghastly business done with.',
  ],
  'evidence.killed.hearty': [
    'That\'s two, then. I\'d have that pencil sharpened, {detective}, before it\'s three.',
    'Dead. And sitting here with us just moments ago. Whoever did the first has done this.',
    'Then somebody was frightfully afraid of what they knew. Wish they\'d told you sooner.',
  ],
  'claim.role.hearty': [
    'I say, I\'m {roleName}, if you must know!',
    'Right then — I\'m {roleName}, and jolly glad to have it out in the open!',
  ],
  'claim.whereabouts.alone.hearty': [
    'I was in {room}, all alone — which I suppose looks perfectly ghastly for me!',
    'Frightfully inconvenient, actually: I was in {room}, not a soul to vouch for me.',
  ],
  'claim.whereabouts.company.hearty': [
    'I say, {companions} and I were in {room} together! Ask them if you like.',
    '{companions} can back me up — we were in {room} the whole time.',
  ],
  'claim.sighting.hearty': [
    'I saw {targetOld} in {room}, clear as day!',
    'Spotted {target} in {room}, didn\'t I? Rather certain of it.',
  ],
  'claim.glimpse.hearty': [
    'Somebody near {room} dashed past — all I could tell you is they {trait}.',
    'There was someone by {room}, and whoever it was {trait}.',
  ],
  'claim.culpritAttr.trait.hearty': [
    'Your murderer {trait} — I\'d stake my shirt on it!',
    'The blighter you\'re after {trait}, absolutely certain.',
  ],
  'claim.alignment.good.hearty': [
    '{targetOld} wouldn\'t hurt a fly, I assure you — not in a million years!',
    '{target}? Innocent as a newborn babe, that one. Mark my words.',
  ],
  'claim.alignment.evil.hearty': [
    'There\'s something frightfully rotten about {targetOld}, I tell you.',
    'Keep your eye on {target} — there\'s something dreadfully off there.',
  ],
  'claim.relationship.self.devoted.hearty': [
    'I loved {him} dearly, if you must know. {he} was my best friend.',
    '{he} meant the world to me — there, I\'ve said it!',
  ],
  'claim.relationship.self.cordial.hearty': [
    'We rubbed along perfectly well, {he} and I. No quarrels, no fuss.',
    'Pleasant enough terms, that\'s all. Absolutely friendly.',
  ],
  'claim.relationship.self.strained.hearty': [
    'Things were rather chilly between us, if you must know — perfectly civil, but cold.',
    'There was a distance, you see. Nothing terrible, just — not warm.',
  ],
  'claim.relationship.self.hostile.hearty': [
    'I hated the man, there! No point in lying about it now.',
    'We despised each other, everyone knew it. Absolutely loathed one another.',
  ],
  'claim.relationship.self.indebted.hearty': [
    'I owed {him} an awful lot of money — rather more than I like admitting.',
    'Money, that\'s what it was. A tremendous sum, and {he} never let me forget it.',
  ],
  'claim.relationship.self.jilted.hearty': [
    '{he} threw me over years ago — I\'ve managed to get over it, mostly.',
    'We were engaged once, you see. {he} decided against it. One carries on.',
  ],
  'claim.relationship.gossip.devoted.hearty': [
    '{subjectOld} was absolutely mad about {victim}, rather sickening really.',
    '{subject} doted on {victim} — positively worshipped {him}, from what I saw.',
  ],
  'claim.relationship.gossip.cordial.hearty': [
    '{subject} and {victim} got along splendidly — frightfully dull, actually.',
    '{subject} and {victim} were perfectly pleasant together, no drama whatsoever.',
  ],
  'claim.relationship.gossip.strained.hearty': [
    '{subjectOld} could barely look at {victim} without bristling — palpable tension!',
    '{subject} and {victim} were civilly cold with each other — that sort of polite that speaks volumes.',
  ],
  'claim.relationship.gossip.hostile.hearty': [
    '{subjectOld} and {victim} were at each other\'s throats constantly!',
    '{subject} hated {victim}, and vice versa — the whole house could see it.',
  ],
  'claim.relationship.gossip.indebted.hearty': [
    '{subjectOld} owed {victim} money — and {victim} never forgot it for a moment.',
    '{subject} was over a barrel financially to {victim} — everyone knew it.',
  ],
  'claim.relationship.gossip.jilted.hearty': [
    'Old {victim} jilted {subject} years back — wounds like that don\'t heal, do they?',
    '{victim} threw {subject} over long ago. Rather sticky business, that.',
  ],
  'claim.heard.crash.hearty': [
    'There was a crash from {room} — sounded deliberately done, not {weather}!',
    'I heard a crash from {room} during all that — frightfully loud.',
  ],
  'claim.heard.quarrel.hearty': [
    'Voices raised in {room} earlier — a real quarrel, and old {victim} was one of them!',
    'I heard a proper row in {room}, and {victim} was part of it, that much I know.',
  ],
  'claim.suspicion.hearty': [
    'If you want my honest opinion, I think it\'s {targetOld}. Gut feeling, really.',
    '{target} — that\'s where my suspicions lie, for whatever it\'s worth!',
  ],
  'claim.culpritAttr.sex.hearty': [
    'It was {sex}. Narrows it down a bit, what?',
    'You\'re after {sex}, I can tell you that much!',
  ],
  'claim.liarsAmong.hearty': [
    'I had my eye on {pair} all evening — {howMany} lying through their teeth about where they were!',
    'You\'ll have asked {pair}, I imagine. Well, {howMany} wasn\'t telling you the truth about it.',
  ],
  'claim.passage.hearty': [
    'Want to know a secret? There\'s a passage from {scene} to {room}. Frightfully clever!',
    'There\'s a passage in the wall — from {scene} it goes behind the panelling to {room}.',
  ],
  'claim.passing.hearty': [
    'Funny thing: I bumped into {targetOld} outside {room} not long after. Probably nothing. Probably.',
    'Just after, I met {target} in the passage outside {room}, moving rather quickly. Rather odd, that.',
  ],
  'claim.relationship.self.disinherited.hearty': [
    '{he} was going to cut me out of the new will — absolutely decided on it, don\'t you know.',
    'The new will was drawn up without me in it — wanted only {his} signature to make it stick.',
  ],
  'claim.relationship.gossip.disinherited.hearty': [
    '{subjectOld} was being cut out of the new will — {victim} had only to sign it.',
    '{victim} was going to leave {subject} out entirely — the will was drawn, it wanted {victim}\'s pen.',
  ],
  'claim.relationship.self.beneficiary.hearty': [
    '{he} signed the new will this week, and I come out of it rather nicely — wasn\'t my doing!',
    'I inherit, there, it\'s said. The will was signed and I\'ve been dreading this conversation ever since.',
  ],
  'claim.relationship.gossip.beneficiary.hearty': [
    '{subjectOld} came into money now the will\'s signed — {victim} saw to that.',
    '{victim} signed a new will recently, and {subject} does handsomely out of it.',
  ],
  'claim.relationship.self.dismissed.hearty': [
    '{he}\'d decided to turn me out — made it perfectly clear, didn\'t {he}.',
    'I was being turned out, plain and simple. {he}\'d made {his} mind up about it.',
  ],
  'claim.relationship.gossip.dismissed.hearty': [
    '{subjectOld} was getting the boot from {victim} — all decided and announced.',
    '{victim} was turning {subject} out. The decision was made, only the timing remained.',
  ],
  'claim.relationship.self.exposed.hearty': [
    '{he} knew something about me, and {he} was going to tell the world. Rather inconvenient, that.',
    '{he} had something on me, and {he} meant to make it public — no two ways about it.',
  ],
  'claim.relationship.gossip.exposed.hearty': [
    '{subjectOld} had a skeleton in the cupboard, and {victim} knew all about it.',
    '{victim} held something over {subject} — and had stopped keeping quiet about it.',
  ],
  'claim.relationship.self.rival.hearty': [
    'We built the business together, and {he} was pushing me right out of it. Rather sharp practice!',
    '{he} and I were partners, and {he} was squeezing me out of the firm. Find it out for yourself.',
  ],
  'claim.relationship.gossip.rival.hearty': [
    '{subjectOld} was being squeezed out of the business by {victim} — they\'d been partners once.',
    '{subject} and {victim} were in business together — and {victim} was pushing them out.',
  ],
  'claim.relationship.self.forbidden.hearty': [
    'I wanted to marry {his} {child} — {he} forbade it flatly, absolutely final.',
    'I asked for {his} {child}\'s hand in marriage, and {he} said no — wouldn\'t hear another word.',
  ],
  'claim.relationship.gossip.forbidden.hearty': [
    '{subjectOld} wished to marry {victim}\'s {child}. {victim} forbade it rather decisively!',
    '{subject} wanted {victim}\'s {child}\'s hand — {victim} put {his} foot down, absolutely flat.',
  ],
}

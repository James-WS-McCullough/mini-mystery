import type { DialogueBanks } from '../../schema'

// COCKNEY — plain London: quick, warm, wary of the police, no eye-dialect clutter.
// The RULES OF THE BANKS in ../dialogue.ts apply: voice only, shared by the
// honest and the lying alike, and no line says more than its neutral counterpart.

export const cockney: DialogueBanks = {
  // =====================================================================
  // ABOUT — what a guest says of another, or of the dead
  // =====================================================================
  'about.nothing.cockney': [
    'Them? I couldn’t tell you a thing about ’em, and that’s straight up.',
    'What do I know about them? Nothing, {sir}. Not a blessed thing.',
    'Ask me what colour their eyes are, {sir}, and I’d only be guessing. We ain’t close.',
  ],
  'about.person.cockney': [
    'Since you’re asking about them, I’ll tell you what I can.',
    'It ain’t much, what I’ve got, but it’s honest, and you’re welcome to it.',
    'Well, I can say a little there. Just a little, mind.',
  ],
  'about.referral.cockney': [
    'Don’t ask me, {sir}. {person} would know far better than I would.',
    'That’s one for {person}, that is. I’d only be guessing, and that’s no use to you.',
    'You want {person} for that, {sir}. {person} could tell you more than I ever could.',
  ],
  'about.victim.cockney': [
    'You want to know how I stood with {him}, {sir}? Fair enough. I’ll be straight with you.',
    'Thought you’d get round to that. Go on, I’ll tell you how it was with {him}.',
    'Me and {him}? Right. I’ll tell you honest, and you can make of it what you like.',
  ],

  // =====================================================================
  // ALIBI — the lead-ins to where a guest was
  // =====================================================================
  'alibi.alone.cockney': [
    'Where was I? I’ll tell you straight. It’s a plain answer, mind.',
    'Course you’re asking that. Right, here’s where I was, and it ain’t much use to you, I know.',
    'My whereabouts? Nothing simpler. Don’t help you much, though. That’s the way of it.',
  ],
  'alibi.company.cockney': [
    'Lucky for me I ain’t got to rely on my word alone, {sir}.',
    'Now that one’s easy. I’m on solid ground there, straight up.',
    'Ask me where I was, and I’ll give you somebody who’ll say the same.',
  ],
  'alibi.forgot.cockney': [
    'I don’t know, {sir}, and that’s gawd’s truth. I’ve tried and tried, and that hour’s just gone.',
    'That’s the rotten part. I can’t tell you. Dressing bell, then coming down, and nothing in between.',
    'Wish I could say, straight up. There’s a hole where that hour ought to be.',
  ],

  // =====================================================================
  // CLAIMS — the structural sentences
  // =====================================================================
  'claim.alignment.evil.cockney': [
    'Take a good look at {target}. There’s rot there, and that’s a promise.',
    'I’ll say it once and quiet, {sir}. {target} ain’t what {target} makes out to be.',
    'Something’s wrong with {target}. I’ve known it a good while, and tonight I’m sure.',
  ],
  'claim.alignment.good.cockney': [
    'Whatever you end up thinking tonight, {target} is straight. I’d stake my life on it.',
    'You can strike {target} off your list. I know things about {thisHouse}, and I know that.',
    'Leave {target} out of it, {sir}. I know that much for certain, and I don’t say it light.',
  ],
  'claim.apart.cockney': [
    'Whatever you’ve been told, {first} and {second} weren’t together that hour. I’d know.',
    '{first} and {second} stayed apart that hour, take it from me. Nowhere near each other, they weren’t.',
    'I’ll tell you for nothing, {first} and {second} weren’t in each other’s company that hour. Not for a minute.',
  ],
  'claim.culpritAttr.sex.cockney': [
    'I can’t give you a name. I can give you this much: it was {sex} what did it.',
    'Mark me, you’re looking for {sex}. Don’t ask me how I know.',
    'Ask how I know and I’ll only shrug. But the murderer is {sex}, and that’s straight up.',
  ],
  'claim.culpritAttr.trait.cockney': [
    'Mark me, the one you want {trait}.',
    'I can’t give you a name, {sir}. I can give you this much: your killer {trait}.',
    'Don’t ask how I know. The murderer {trait}, and you can have that for nothing.',
  ],
  'claim.glimpse.cockney': [
    'Only caught a glimpse of someone near {room}. Couldn’t say who, but whoever it was {trait}.',
    'I couldn’t tell you the face. Someone went by near {room}, and the figure {trait}.',
    'Somebody went past near {room}. Didn’t get the face, but whoever it was {trait}.',
  ],
  'claim.heard.crash.cockney': [
    'I heard a crash from {room} that hour, {sir}. Glass, or a lock giving way. I told myself it was {weather}.',
    'Something broke in {room}, sharp and deliberate. That wasn’t {weather}, I know that much.',
    'Noise from {room} while {house} was dressing. Wood splintering, or metal. Nearly went to look. Didn’t.',
  ],
  'claim.heard.quarrel.cockney': [
    'That afternoon there was shouting in {room}. A proper quarrel, though I couldn’t make out the words.',
    'Passing near {room} earlier in the day, I heard {victim} having it out with someone. Bitter, it was.',
    'Afternoon, it was. Raised voices from {room}. {victim} and another, and I couldn’t tell you who.',
  ],
  'claim.liarsAmong.cockney': [
    'I had my eye on {pair} all evening, and I know ’em. {howMany} lying to you about where they were.',
    'You asked {pair} where they spent that hour, I expect. I was watching ’em both, {sir}: {howMany} lying about it.',
    'Mark these two: {pair}. {howMany} giving you a false account of that hour, and I’ll tell you for nothing.',
  ],
  'claim.passage.cockney': [
    'There’s a passage in the wall of {scene}, and it comes out in {room}.',
    'I know {thisHouse}, {sir}. From {scene} there’s a passage behind the panelling, runs through to {room}.',
    'You won’t find it on any plan, {sir}. A way through the wall, from {scene} to {room}. Straight up.',
  ],
  'claim.passing.cockney': [
    'I was first along {passage} once it was done, {sir}, and I passed {target} coming away from {room}. Make what you like of it.',
    'Just after, I met {target} in the passage outside {room}, walking quick. Thought nothing of it at the time.',
    'I saw {target} coming from the direction of {room}, not five minutes after it must have happened. Might mean nothing.',
  ],

  // =====================================================================
  // RELATIONSHIPS — gossip about two others
  // =====================================================================
  'claim.relationship.gossip.beneficiary.cockney': [
    '{victim} signed a new will this very week, and {subject} does handsomely out of it.',
    'You want to know who gains, {sir}? {victim} changed {his} will, signed it, and it’s {subject} that it favours.',
    'New will’s signed and witnessed, and it’s {subject} who comes into the money. Ain’t hard to work out.',
  ],
  'claim.relationship.gossip.cordial.cockney': [
    '{subject} and {victim} got on well enough, {sir}, far as I ever saw.',
    'Nothing to tell about {subject} and {victim}. Pleasant enough, and dull with it.',
    '{subject} and {victim}? Friendly. Never saw a cross word between ’em, and I keep an eye out for cross words.',
  ],
  'claim.relationship.gossip.devoted.cockney': [
    '{subject} worshipped {victim}, {sir}. Ask anyone {inThisHouse}, they’ll tell you the same.',
    'Real affection between {subject} and {victim}, {sir}. The genuine article. You could see it straight off.',
    '{subject} and {victim} were as close as any two {inThisHouse}. Closer, if you ask me.',
  ],
  'claim.relationship.gossip.disinherited.cockney': [
    '{victim} was going to sign a new will, {sir}, and {subject} wasn’t in it. Only wanted {his} signature.',
    '{He} meant to cut {subject} out of the family, {sir}. Will was drawn up, and {he} was due to sign.',
    'I had it from {victim} {himself}: new will, nothing in it for {subject}. Not signed yet, mind.',
  ],
  'claim.relationship.gossip.dismissed.cockney': [
    '{victim} was turning {subject} out. All settled. Only the day was left to fix.',
    '{subject} had been told to go. {victim} wouldn’t hear a word in favour, and I did try.',
    '{He} gave {subject} notice, and none too kind about it. Everybody in {household} knew by teatime.',
  ],
  'claim.relationship.gossip.exposed.cockney': [
    '{victim} knew something about {subject}, and meant to tell it. {He} as good as said so at luncheon.',
    '{He} had {subject} looked into. Whatever {he} found, {he} meant to use it.',
    'There’s something in {subject}’s past, and {victim} got hold of it. {He} wasn’t one to keep a thing like that to {himself}.',
  ],
  'claim.relationship.gossip.forbidden.cockney': [
    '{subject} wanted to marry {his} {child}, and {victim} said no. Flat, {he} did.',
    'There was something between {subject} and {his} {child}, {sir}, and {victim} wouldn’t have it at any price.',
    '{subject} asked {victim} for {his} {child}’s hand, {sir}, and got turned down. More than once, I reckon.',
  ],
  'claim.relationship.gossip.hostile.cockney': [
    '{subject} and {victim}? At each other’s throats. You could hear ’em through the walls of {thisHouse}.',
    'Ask anyone, {sir}. {subject} and {victim} couldn’t be in a room together without it going cold.',
    'Real hatred between {subject} and {victim}. I don’t use that word light.',
  ],
  'claim.relationship.gossip.indebted.cockney': [
    '{subject} owed {victim} money. Serious money, the kind that sours a friendship.',
    'Money, between {subject} and {victim}. Heaps of it, and not a penny forgiven.',
    '{victim} held paper on {subject}. Old debts, and growing all the time.',
  ],
  'claim.relationship.gossip.jilted.cockney': [
    '{victim} broke it off with {subject}, you know. Years back. Some folks never get over that.',
    'There was an understanding once between {subject} and {victim}, {sir}. {He} ended it, and ended it bad.',
    '{victim} chucked {subject} over long ago, {sir}, and {subject} has never forgiven it, not that I’ve heard.',
  ],
  'claim.relationship.gossip.rival.cockney': [
    '{subject} was {victim}’s partner in business, and was being squeezed out of it.',
    'Business partners, {subject} and {victim}. {He} meant to end it, and keep what it had made.',
    '{victim} was ruining {subject}, {sir}, all done by the book. There was a firm between ’em, and soon there wouldn’t be.',
  ],
  'claim.relationship.gossip.strained.cockney': [
    'Bit of a chill between {subject} and {victim} lately. Everybody pretended not to notice. Everybody noticed.',
    '{subject} and {victim} had been ever so polite with each other for weeks. That sort of polite.',
    'Something had gone wrong between {subject} and {victim}. No scandal, just a cold feeling you could cut at table.',
  ],

  // =====================================================================
  // RELATIONSHIPS — a guest on their own tie to the dead
  // =====================================================================
  'claim.relationship.self.beneficiary.cockney': [
    '{He} signed a new will this week, and I do well out of it. Never asked {him} to, straight up. I know how it looks.',
    'I inherit, {sir}. There, it’s said. The will was signed this week, and I’ve been dreading this chat ever since.',
    'I come into a lot by {his} death, more than I did a week ago. I had no hand in {him} deciding it.',
  ],
  'claim.relationship.self.cordial.cockney': [
    '{victim} and me got on all right. Perfectly good terms, and that’s the lot.',
    'We got on well, {he} and me. No quarrels, no debts, no history. Just friends.',
    'Cordial, that’s the word, {sir}. We liked each other well enough and left it there.',
  ],
  'claim.relationship.self.devoted.cockney': [
    'I loved {him} dear. {He} was family to me, whatever anyone says behind my back.',
    '{He} was the best friend I had in the world. That’s how it was between us. Now you know what I’ve lost.',
    'Nobody {inThisHouse} was closer to {him} than me, {sir}. I ain’t ashamed to say I’ve wept tonight.',
  ],
  'claim.relationship.self.disinherited.cockney': [
    '{He} was going to cut me out. New will was drawn, only wanted {his} name at the bottom. I knew, and I won’t pretend I didn’t.',
    'You’ll hear {he} meant to sign a new will and I wasn’t in it. Both true, and that’s straight up.',
    'I was to get nothing. {He} told me so {himself}, and told me the very day {he} meant to sign.',
  ],
  'claim.relationship.self.dismissed.cockney': [
    '{He} meant to turn me out. I’d been told as much, and told to be gone by the end of the month.',
    'I was to go, {sir}. {He} had made up {his} mind, and once it was made up, that was that.',
    '{He} was putting me out of {thisHouse}, and not a word to take with me. Nowhere to go, I’ve got.',
  ],
  'claim.relationship.self.exposed.cockney': [
    '{He} knew something about me, {sir}. I ain’t saying what. {He} meant to make it public, and told me when.',
    'There’s something in my past that {he} found out, and meant to tell. I ain’t proud of it, nor of how this sounds.',
    '{He} had me watched. {He} had a report, and {he} was going to use it. I knew that.',
  ],
  'claim.relationship.self.forbidden.cockney': [
    'I asked for {his} {child}’s hand, {sir}, and {he} turned me down. Said never, not while {he} lived.',
    'I wanted to marry {his} {child}. {He} forbade it, wouldn’t even let us write.',
    'Me and {his} {child} had an understanding, {sir}. {He} wouldn’t hear of it, and what {he} said, I won’t repeat.',
  ],
  'claim.relationship.self.hostile.cockney': [
    'Since you ask, {sir}, we couldn’t stand each other, and I ain’t going to cry false tears now.',
    'I hated {him}. There, I’ve said what everyone else only hints at. Hating {him} ain’t a confession, is it?',
    'We loathed each other, and all of {household} knew it. You’d have had it from somebody before long.',
  ],
  'claim.relationship.self.indebted.cockney': [
    'I owed {him} money. A great deal of it. You’d have found out anyway.',
    'Truth is, I was in {his} debt for more than I like saying aloud. Motive, you’ll call it, {sir}. Misery, I call it.',
    '{He} held my notes of hand, {sir}, and kept reminding me. I owed {him} more than I could pay.',
  ],
  'claim.relationship.self.jilted.cockney': [
    '{He} threw me over once, years back. You don’t forget it. You just learn to live with it.',
    'There was an understanding between us, a good while ago, and {he} ended it bad. I’ve carried it ever since.',
    '{He} and me were going to be married, once, {sir}. {He} thought better of it. I never thought better of {him}.',
  ],
  'claim.relationship.self.rival.cockney': [
    'We were partners, {he} and me, and {he} was pushing me out of a firm I helped build.',
    '{He} and me were in business together, {sir}. Lately {he} had been arranging it so there’d be no together about it.',
    '{He} meant to ruin me, {sir}. All above board, mind, and it would’ve left me with nothing of what we made.',
  ],
  'claim.relationship.self.strained.cockney': [
    'We had our rubs, {he} and me, {sir}. I won’t insult you by saying we didn’t.',
    'Cool between us lately, it was. I won’t lie to you about that.',
    'Things were strained, {sir}, and I ain’t going to say different. Civil, and only civil, for weeks.',
  ],

  // =====================================================================
  // CLAIMS — role, rooms, sightings, suspicion, whereabouts
  // =====================================================================
  'claim.role.cockney': [
    'You want to know what I was in all this, {sir}? I’m {roleName}, and that’s straight up.',
    'I’ll give it you plain. I’m {roleName}.',
    'Write me down as {roleName} in that notebook of yours, {sir}.',
  ],
  'claim.roomEmpty.cockney': [
    'My room faces {room}, and nobody went in all hour. I’d have heard the door.',
    'I was sat in the hall opposite {room} the whole hour, {sir}. Nobody went in, nobody came out.',
    'Them floorboards creak at the lightest weight, and I heard nothing outside {room} all hour. Empty, it was.',
  ],
  'claim.roomUsed.cockney': [
    'My room looks straight at the door of {room}, {sir}. Somebody went in that hour. Couldn’t tell you who.',
    'I was sat in the hall opposite {room}, {sir}, and that door opened. I had my back turned, though.',
    'Heard the floorboards outside {room}, and then the latch. Somebody was in there that hour.',
  ],
  'claim.sighting.cockney': [
    'I saw {target} in {room} that hour, {sir}. Certain of it, I am.',
    'One thing I’ll swear to, {sir}: {target} was in {room}. Saw it with my own eyes.',
    '{target} was in {room} then, {sir}. Whatever else is in doubt, that ain’t.',
  ],
  'claim.suspicion.cockney': [
    'If you want my honest feeling, I’ve had my eye on {target} all evening.',
    'I ain’t accusing nobody, {sir}. I just say {target} hasn’t been right tonight.',
    'Since you ask me plain, {sir}: {target}. Can’t tell you why. I just feel it.',
  ],
  'claim.together.cockney': [
    'There’s been talk about {first} and {second} for weeks, and I can tell you they spent that hour together. Every minute.',
    'It’s my business to know. {first} and {second} were together all hour, not a minute apart.',
    '{first} and {second} were thick as thieves that hour. Whatever they say, they never left each other’s side.',
  ],
  'claim.whereabouts.alone.cockney': [
    'For that hour I was in {room}, on my own.',
    'I was in {room}, all alone. I know that don’t help me much.',
    'You’ll find it hard to back me up. {room}, by myself, the whole of it.',
  ],
  'claim.whereabouts.company.cockney': [
    'I was in {room} the whole while, {sir}, and not alone. {companions} will vouch for every minute.',
    'From {windowFrom} I was in {room} with {companions}. Ask ’em and you’ll hear the same.',
    '{room}, with {companions}. We never left it, straight up.',
  ],

  // =====================================================================
  // CONFESSION
  // =====================================================================
  'confession.cockney': [
    'Stop. Before you name anybody, it’s me you want.',
    'I can’t sit here and watch you point at somebody else, {sir}. You needn’t look no further.',
    'No. No more of this, {sir}. I’ve carried it all evening and I ain’t carrying it a minute longer.',
  ],

  // =====================================================================
  // EVIDENCE — a guest shown something
  // =====================================================================
  'evidence.bare.cockney': [
    'So whatever did it’s been carried off. Somebody’s tidied up after the murderer.',
    'Nothing left to say how it was done? Then somebody took it, {sir}, and took it somewhere.',
    'A murder, and nothing it was done with. It never walked out the room by itself, did it?',
  ],
  'evidence.bribe.cockney': [
    'That’s a lot of money to find lying about. It’s got a name on it, and it ain’t mine.',
    'Somebody’s been paid for something. You can read whose name it is as easy as I can.',
    'Don’t know nothing about that, {sir}. I’d ask whoever’s name is on it.',
  ],
  'evidence.deny.cockney': [
    'That ain’t mine, {sir}, and I’m not saying it to be awkward. It’s just true.',
    'You might as well accuse the wallpaper. That could’ve come from anywhere.',
    'That? Put it away, {sir}. It’s nothing of mine, whatever it looks like.',
  ],
  'evidence.doc.comment.cockney': [
    'Never seen that paper before, {sir}. Whoever wrote it would know, not me.',
    'Somebody’s private grief, written down in ink. Not for me to explain.',
    'First I’ve seen of it, {sir}, and it makes uneasy reading, that does.',
  ],
  'evidence.doc.confirm.cockney': [
    'So you found it. Always knew somebody would, sooner or later.',
    'Yes. I won’t dress it up, {sir}. Better you hear it from me than from {house}.',
    'That’s genuine, {sir}. I wouldn’t insult you by saying it wasn’t.',
  ],
  'evidence.doc.deny.cockney': [
    'Where’d you get… no. No. You’ve got hold of something twisted right out of its meaning. Here’s how it really was.',
    'Papers can be made to say anything, {sir}. I’ll tell you how it actually was.',
    'That ain’t what it looks like, {sir}, straight up. Let me tell you how things stood between us.',
  ],
  'evidence.doc.gossip.cockney': [
    'That paper only says out loud what half of {house} has been whispering for weeks.',
    'Doesn’t surprise me. Let me tell you why it doesn’t.',
    'So it’s written down at last. I could’ve told you as much, and now I will.',
  ],
  'evidence.flavor.cockney': [
    'That’s somebody’s rubbish, {sir}. Not a clue, unless a messy room’s a crime.',
    'You’ll find one of them in every room of {thisHouse}. Means nothing.',
    'That? It’s just a thing. It was lying there before any of this.',
  ],
  'evidence.hand.cockney': [
    'That’s {his} hand all right. {He} wrote a great many letters.',
    'Course I know that writing. {He} wrote to everybody, and kept copies of nothing.',
    'A letter of {his}. Business, by the look of it, {sir}. It always was.',
  ],
  'evidence.identify.cockney': [
    'Didn’t come from me, {sir}, but I can think who it might have come from, and so can you.',
    'Not mine, {sir}. Hold it up against the table and see who it fits.',
    'I’d look for the {one} it matches, {sir}, if I was you. It ain’t me.',
  ],
  'evidence.key.cockney': [
    'That’s the key to {locked}. Wondered where it had got to.',
    'The key to {locked}. Well, now you can see for yourself what’s in there.',
    'Yes, that opens {locked}. Who had it last, I couldn’t tell you.',
  ],
  'evidence.killed.cockney': [
    'Dead. And sat among us not an hour ago, {sir}. Whoever did the first has done this.',
    'Somebody was frightened of what they knew, {sir}. Wish to gawd they’d told you sooner.',
    'That’s two now, {sir}. And the rest of us shut in with whoever did it.',
  ],
  'evidence.lockbox.cockney': [
    'The box was forced? So there’s a thief about as well as a killer. What a night.',
    'Forced, you say? A thief and a murderer both. Lovely.',
    'Somebody forced that box, and I’d say that’s a thief on top of a killer.',
  ],
  'evidence.lockbox.intact.cockney': [
    'Locked, and not a mark on it, {sir}. Whatever happened in that room, it wasn’t a robbery.',
    'Untouched, {sir}. If anybody says they were at that box tonight, they’re telling you a story.',
    'Nobody’s been at that. It’s just as it was before.',
  ],
  'evidence.note.cockney': [
    'Poor soul. I never had a notion {he} was that unhappy.',
    'I can’t look at it. Put it away, will you?',
    'Forgive {him}? Forgive {him} what? I don’t understand it at all, {sir}.',
  ],
  'evidence.passage.cockney': [
    'A passage! Then whoever was in that room could’ve come and gone as they pleased.',
    'So the old stories were true. I’d ask who spent that hour at the end of it.',
    'Never knew about it, {sir}. But it changes things, don’t it, for whoever was in that room?',
  ],
  'evidence.trace.own.cockney': [
    'That’s mine, I’m afraid. I told you where I was, and there’s your proof.',
    'Yes, mine. Left it where I sat, {sir}. Said as much, if you remember.',
    'Mine, and for once I’m glad of it. It says what I said.',
  ],
  'evidence.weapon.comment.cockney': [
    'I couldn’t have done that. Take a look at me. You know I couldn’t.',
    'That’s beyond me, that is, {sir}. Somebody else’s, plain as anything.',
    'Grim, that. And beyond me, as you can see for yourself.',
  ],
  'evidence.weapon.deny.cockney': [
    'I had the means, and I ain’t fool enough to deny it. I’m not the one who used ’em, though.',
    'Course I could’ve laid hands on that, {sir}. Reach ain’t deed.',
    'Yes, I could’ve got hold of it. So could half this table, and you know it, {sir}. Access ain’t action.',
  ],

  // =====================================================================
  // GATHERED, KNOWLEDGE, LAST WORDS, OPENS
  // =====================================================================
  'gathered.cockney': [
    'Well then, {sir}, we’re all here. Who is it?',
    'I can’t take much more of this. Say it, whoever it is, and have done.',
    'You’ve been up and down {thisHouse} all night, {sir}. I hope to gawd you know.',
  ],
  'knowledge.hedged.cockney': [
    'What I’ll tell you could mean one thing, or it could mean another. Don’t lean on it.',
    'I’ve got the facts, but what they add up to, I couldn’t say.',
    'Take this with a pinch of salt. I’m only giving it as I found it.',
  ],
  'knowledge.share.cockney': [
    'Right, I’ll deal square with you. Here’s what I’ve got.',
    'It ain’t much, but it’s honest. Listen, and make of it what you like.',
    'I’ve been thinking whether to say this, {sir}. I’ll say it.',
  ],
  'knowledge.silent.cockney': [
    'I’ll tell you what I am, and there I stop. The rest I’ve got nothing to say about.',
    'You can have my name for it, and welcome. What goes with it I’ll keep to myself.',
    'I’ll tell you who I am, but no more, and I’d sooner you didn’t ask.',
  ],
  'knowledge.vague.cockney': [
    'Know? What should I know? I mind my own business, and I’ll keep minding it, unless you’ve got something that touches me.',
    'You’re fishing, {sir}. Come back with something in your hand and I might bite.',
    'If I knew anything worth your time, I’d want a reason to say it. Asking ain’t a reason.',
  ],
  'lastWords.cockney': [
    'Oh, I never heard you come in. Is something the matter?',
    'Eh? …Thought everybody had gone up.',
    'You? What are you doing down here at this hour?',
  ],
  'opens.cockney': [
    'Well. Since you’ve got that, {sir}, you may as well have the rest.',
    'That changes things. All right, here’s what I’ve been keeping back.',
    'I said I wanted a reason. That’ll do for one.',
  ],

  // =====================================================================
  // REACTIONS
  // =====================================================================
  'reaction.accuse.cockney': [
    'You needn’t look far, if you ask me. {target} has been wrong all evening, and that’s the truth.',
    'Save your ink for one name: {target}. There. Somebody had to say it.',
    'I’ll spare you the fuss. Look at {target}. Really look.',
  ],
  'reaction.heard.crash.cockney': [
    'You’ll want more than handshakes and alibis tonight, {sir}, so I’ll give you something real.',
    'Before you start with your clever questions, there’s something you ought to know.',
    'I’ve been turning something over all evening, {sir}, and I reckon you should have it.',
  ],
  'reaction.overheard.cockney': [
    'There’s something I ought to have told somebody long before now, {sir}.',
    'You’ll ask what we all saw. Let me tell you what I heard instead.',
    'I’ve kept this to myself, {sir}, wanting to be polite. Can’t afford that now.',
  ],
  'reaction.plain.cockney': [
    'A black night for {thisHouse}, {sir}. Ask what you’ve got to ask.',
    'You’ll want to question the lot of us, I suppose. Go on, then.',
    'Been waiting for you to come round to me. Go on.',
  ],
  'reaction.referral.cockney': [
    'Can’t give you a name, {sir}, but {victim} shut {himself} away in {room} all afternoon, scratching at some paper. I’d look there.',
    'One odd thing, since you ask: {victim} spent the whole afternoon locked in {room}, writing. Whatever {he} wrote’s still in there, I’d say.',
    'I can’t say who. I can say {victim} was writing in {room} all afternoon, and ever so short with anybody who knocked.',
  ],
  'reaction.weaponhint.cockney': [
    'Something’s nagged at me since we found {him}, {sir}: {room} ain’t as it should be. Something missing, or something there that’s got no business being.',
    'If I was hunting the how of it, I’d start with {room}. Call it a hunch. {house} is just a bit wrong there.',
    'Small thing, and it might be nothing: {room} has been disturbed. Noticed it in passing, thought little of it. Think more of it now.',
  ],

  // =====================================================================
  // ROLE, SEEN, SUSPECT
  // =====================================================================
  'role.claim.cockney': [
    'All right, you may as well know it.',
    'It’ll come out anyway, {sir}, so here it is.',
    'I’ll not mess you about. Here goes.',
  ],
  'role.vague.cockney': [
    'What was I in all this? A {one} with rotten luck. You want more, bring me a reason.',
    'Trading secrets now, are we? Not for nothing. Show me you know something, and we’ll see.',
    'My part in the evening? I’ll keep that, unless you’ve got something says I mustn’t.',
  ],
  'seen.key.cockney': [
    'Looking for the key to {locked}? I think I saw it on a table in {room}.',
    'The key to {locked}? Last I saw of it, it was lying in {room}, {sir}.',
    'If it’s the key to {locked} you’re after, there was a key on a ring in {room}. Thought nothing of it at the time.',
  ],
  'seen.key.held.cockney': [
    'The key to {locked}? I saw {person} pick up a key this evening. Thought nothing of it.',
    'You want the key to {locked}? Ask {person}, {sir}. Saw a key in {person}’s hand not an hour ago.',
    'If it’s the key to {locked} you’re after, {sir}, I reckon {person} has it. Saw it picked up.',
  ],
  'seen.nothing.cockney': [
    'Nothing worth your while, {sir}, I’m sorry to say.',
    'Saw nothing out of the way, {sir}. Not a thing. Minding my own business, I was.',
    'Wish I could help you there, {sir}, but I noticed nothing. Straight up.',
  ],
  'seen.share.cockney': [
    'I did notice one thing, now you ask, {sir}.',
    'Something, yes, {sir}, for what it’s worth.',
    'I wasn’t looking out for nothing. But I saw this.',
  ],
  'suspect.hedge.cockney': [
    'If I had to name someone, it’d be {target}. Though I could argue it the other way.',
    '{target} looks likeliest, but I might be wrong, mind.',
    'I lean towards {target}. Lean, I said. I ain’t standing on it.',
  ],
  'suspect.none.cockney': [
    'No name from me. But {person} has been sharper than me all evening. Start there.',
    'I’d sooner not guess. {person} mightn’t have to.',
    'Couldn’t put a name to it, honest. But if you want someone worth asking, try {person}.',
  ],
  'suspect.point.cockney': [
    'You asked, so I’ll say it: {target}. Watch the eyes when you ask about that hour.',
    '{target}, {sir}. I’ve no proof you could hang a hat on, only everything about this evening points one way.',
    'You’re wasting your time on the rest of us, while {target} sits there ever so quiet.',
  ],
  'suspect.vouch.cockney': [
    'I’ve no name for you. But whoever it was, I don’t believe it was {target}.',
    'Couldn’t tell you who, {sir}. I can tell you who it wasn’t, and that’s {target}. Call it a feeling, no more.',
    'No, nobody I’d name. If it helps, I can’t make myself believe it of {target}.',
  ],
}

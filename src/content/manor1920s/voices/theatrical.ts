import type { DialogueBanks } from '../../schema'

// THEATRICAL — the players: everything a cue, a notice or a curtain; darling.
// The RULES OF THE BANKS in ../dialogue.ts apply: voice only, shared by the
// honest and the lying alike, and no line says more than its neutral counterpart.

export const theatrical: DialogueBanks = {
  // =====================================================================
  // ABOUT — questions put to a guest about another guest or the victim
  // =====================================================================
  'about.nothing.theatrical': [
    'I could not tell you the colour of their eyes, and one notices eyes in my profession. That is how little I know.',
    'We exchanged a nod across the room, once, like two players passing in the wings. That was the whole of our acquaintance.',
    'You would learn more from the cat. Not a speaking part, I grant you, but the cat knows more than I.',
  ],
  'about.person.theatrical': [
    'Since you ask about them, I shall give you my little scene. It is a small part, but I play it honestly.',
    'What I can tell you is a walk-on, nothing more, but it is honest, and I shall deliver it so.',
    'I can say a little there. Rather less than a speech; rather more than a cough.',
  ],
  'about.referral.theatrical': [
    'Not my scene at all. {person} has the lines on that, and {person} would know far better than I.',
    'I am afraid I am only the understudy there. Go to {person}, who has the part by right.',
    'Take that to {person}, darling, who could tell you far more. I should only be fluffing it.',
  ],
  'about.victim.theatrical': [
    'Ah, how I stood with {him}. I wondered when you would come to that cue. I shall answer it honestly.',
    'The question was bound to come, and I have been waiting in the wings for it. How I stood with {him}? I will tell you plainly.',
    'Quite right to ask. I shall tell you how it was between {him} and me, and honestly.',
  ],

  // =====================================================================
  // ALIBI — the lead-in to an account of the hour
  // =====================================================================
  'alibi.alone.theatrical': [
    'My whereabouts? I can answer that plainly, and without a flourish.',
    'Where was I? An easy answer, my dear, though perhaps not an easy one to prove.',
    'You want the hour accounted for. Very well, darling, here is my account, for whatever my word is worth.',
  ],
  'alibi.company.theatrical': [
    'Happily, darling, I am not playing a solo here. I need not rely on my word alone.',
    'That, is an easy cue. I am on firm ground, and I know my mark.',
    'There I am on solid boards. I have names to give you, and shall.',
  ],
  'alibi.forgot.theatrical': [
    'I do not know, darling, and I have rehearsed it a dozen ways. The hour is simply gone, like a cut scene.',
    'That is the wretched thing. I cannot tell you. There is a gap in the script where that hour ought to be.',
    'I wish I could say. I have gone over and over it, and the whole hour has dropped clean out of my head.',
  ],

  // =====================================================================
  // CLAIMS — the structural sentences
  // =====================================================================
  'claim.alignment.evil.theatrical': [
    'Watch {target} closely. There is a rot under the greasepaint, and I promise you I know it.',
    'I shall say it once, and softly, as one delivers an aside: {target} is not what {target} pretends to be.',
    'Frankly, there is something wrong with {target}. I have sensed it for some time, and I am sure of it now. One does know a false note.',
  ],
  'claim.alignment.good.theatrical': [
    'Whatever you come to think, {target} is true. I would stake my life on it, and I never say that for applause.',
    'Strike {target} from your dark little list, my dear. I know {thisHouse}, and I know that, as I know my own cue.',
    'You may leave {target} out of it. I know that much for certain, darling, and I do not say it for effect.',
  ],
  'claim.apart.theatrical': [
    'Between ourselves, {detective}, {first} and {second} were nowhere near each other that hour. I would know. I always know.',
    'Whatever you have been told, {first} and {second} were not together that hour. One notices who stands where; it is the trade.',
    'Take it from an old player: {first} and {second} were not in each other’s company that hour. Not at all.',
  ],
  'claim.culpritAttr.sex.theatrical': [
    'I have no name for you, my dear, only the casting: it was {sex} who did it.',
    'Mark me, darling: you are looking for {sex}. Ask how I know and I shall only smile, as at a bad notice.',
    'The murderer, darling, is {sex}. I shall say no more on how I know; a player keeps something back for the second act.',
  ],
  'claim.culpritAttr.trait.theatrical': [
    'Mark me, darling: the one you want {trait}. I know the type; I have played opposite it.',
    'No name, I cannot give you one. I can give you the character: your killer {trait}.',
    'Ask how I know and I shall only shrug, like a leading lady refusing a curtain call. But the murderer {trait}.',
  ],
  'claim.glimpse.theatrical': [
    'A figure near {room}, no more than a glimpse, a shape in the wings. I could not tell you the face, but whoever it was {trait}.',
    'I could not give you the face, only a silhouette by {room}. But whoever I saw {trait}.',
    'Someone passed near {room}, quick as a stagehand between scenes. No face, I fear. But I did see this: the figure {trait}.',
  ],
  'claim.heard.crash.theatrical': [
    'During that hour, there was a crash from {room}. Glass, or a lock giving way. I told myself it was {weather}.',
    'Something broke in {room}, a sharp and deliberate sound. Not {weather}. I know stage thunder when I hear it.',
    'A crash from {room}, as loud as a dropped tray in the middle of the big speech. I told myself it was {weather}.',
  ],
  'claim.heard.quarrel.theatrical': [
    'Earlier in the day, darling, there were raised voices in {room}. A proper quarrel, though the words reached me as they reach the gods: badly.',
    'Passing {room} earlier in the day, I heard {victim} quarrelling with someone. Bitterly. Quite a scene.',
    'There was shouting from {room}, {victim} and another, a duet I could not identify. I could not make out who.',
  ],
  'claim.liarsAmong.theatrical': [
    'I had my eye on {pair} all evening, and I know a performance when I see one. {howMany} lying to you about where they were.',
    'You will have asked {pair} where they spent the hour. Watch them. {howMany} lying to you about it, and I say so as a friend.',
    'Mark these two, darling: {pair}. {howMany} giving you a false account of that hour. One does know a false entrance.',
  ],
  'claim.passage.theatrical': [
    'A concealed entrance, darling: a passage in the wall of {scene}, and it comes out in {room}.',
    'I know {thisHouse}, my dear, and from {scene} a passage runs behind the panelling to {room}. Entrances and exits, as in all good farce.',
    'It is on no plan, darling, but there is a way through the wall from {scene} to {room}. A secret stage door.',
  ],
  'claim.passing.theatrical': [
    'After it was done I came along {passage}, and met {target} leaving {room}. Quite an entrance. Make of it what you will.',
    'One thing, between ourselves: just after, I met {target} in the passage outside {room}, walking quickly. I thought nothing of it at the time.',
    'Not five minutes after it must have happened, I saw {target} coming from the direction of {room}. It may mean nothing.',
  ],

  // ---- Gossip: what the guest says of others' dealings with the victim ----
  'claim.relationship.gossip.beneficiary.theatrical': [
    'Between ourselves, darling, {victim} signed a new will this very week, and {subject} does handsomely out of it. A star part.',
    'You should know who gains. {victim} altered {his} will, signed it, and {subject} is the one it favours.',
    'The new will is signed and witnessed, and {subject} is the one who comes into the money. One could hardly write it better.',
  ],
  'claim.relationship.gossip.cordial.theatrical': [
    'Nothing to tell about {subject} and {victim}, darling. Perfectly pleasant, perfectly dull. No drama whatever.',
    '{subject} and {victim} got along well enough, my dear, so far as I ever observed, and I observe as a player must.',
    '{subject} and {victim}? Amiable. I never saw a cross word between them, and I am always on the watch for cross words.',
  ],
  'claim.relationship.gossip.devoted.theatrical': [
    '{subject} worshipped {victim}. Anyone {inThisHouse} will tell you the same.',
    'There was real affection between {subject} and {victim}. The genuine article; one sees it at once, and I have seen the counterfeit.',
    '{subject} and {victim} were as close as any two people {inThisHouse}, darling. Closer. A true double act.',
  ],
  'claim.relationship.gossip.disinherited.theatrical': [
    '{victim} was going to sign a new will, darling, and {subject} was not in the cast. It wanted only {his} signature.',
    '{He} meant to cut {subject} out entirely. The new will was drawn up, and {he} was to sign it.',
    'I had it from {victim} {himself}: a new will, and not a line in it for {subject}. It was not yet signed.',
  ],
  'claim.relationship.gossip.dismissed.theatrical': [
    '{victim} was turning {subject} out, darling. It was settled; only the day remained. The notice was served, as it were.',
    '{subject} had been told to go, my dear, and {victim} would not hear a word in favour. I did try. A very cold exit.',
    '{He} had given {subject} notice, darling, and none too kindly. Everybody in {household} knew of it.',
  ],
  'claim.relationship.gossip.exposed.theatrical': [
    '{victim} knew something about {subject}, and had decided to tell it. {He} as good as said so.',
    '{He} had been having {subject} looked into. Whatever {he} found, {he} meant to use it.',
    'There is something in {subject}’s past, my dear, and {victim} had got hold of it. {He} was not one to keep such a thing to {himself}.',
  ],
  'claim.relationship.gossip.forbidden.theatrical': [
    '{subject} wished to marry {his} {child}, darling, and {victim} forbade it, flatly. The veto was absolute.',
    'There was an attachment between {subject} and {his} {child}, darling, and {victim} would not have it at any price. A thwarted romance, in the old style.',
    '{subject} asked {victim} for {his} {child}’s hand, my dear, and was refused. More than once, I believe. One hates to see a love scene cut.',
  ],
  'claim.relationship.gossip.hostile.theatrical': [
    '{subject} and {victim}? At daggers drawn. The quarrels carried through the walls of {thisHouse}, right up to the gods.',
    'Ask anyone, my dear: {subject} and {victim} could not share a room without the temperature dropping. Positively arctic.',
    'There was real hatred between {subject} and {victim}. I do not use the word lightly; I save it for critics.',
  ],
  'claim.relationship.gossip.indebted.theatrical': [
    '{subject} owed {victim} money, serious money, the kind that curdles a friendship faster than a bad review.',
    'It was money between {subject} and {victim}, my dear. A great deal of it, and none of it forgiven.',
    '{victim} held paper on {subject}, {detective}. Debts, old ones, and growing, like the arrears of a failing theatre.',
  ],
  'claim.relationship.gossip.jilted.theatrical': [
    '{victim} broke an engagement with {subject}, you know. Years ago. Some wounds keep as well as old notices.',
    'There was an understanding, once, between {subject} and {victim}, my dear. {He} ended it. Badly. A very poor last act.',
    '{subject} was thrown over by {victim} long ago, and has never, in my hearing, forgiven it. The curtain came down hard.',
  ],
  'claim.relationship.gossip.rival.theatrical': [
    '{subject} was {victim}’s partner in business, darling, and was being squeezed out of it. A sorry business, in every sense.',
    'They were in business together, {subject} and {victim}. {He} meant to end the partnership, and to keep what it had made.',
    '{victim} was ruining {subject}, darling, and doing it by the book. There was a firm between them, and soon there would not be.',
  ],
  'claim.relationship.gossip.strained.theatrical': [
    'There was a coolness between {subject} and {victim} of late, darling. Everyone pretended not to notice, as an audience pretends not to hear a cough. Everyone noticed.',
    '{subject} and {victim} had been carefully polite with one another for weeks. That kind of polite, which is acting.',
    'Something had gone wrong between {subject} and {victim}. Not a scandal, a chill. One felt it at table.',
  ],

  // ---- Self: what the guest says of their own dealings with the victim ----
  'claim.relationship.self.beneficiary.theatrical': [
    '{He} signed a new will this week, darling, and I am the gainer by it. I did not ask {him} to. I know precisely how it looks.',
    'I inherit. There, it is said. I had no part in {his} deciding so, and I know how it looks.',
    'I come into a great deal by {his} death, darling, more than I did a week ago. Frankly, I should have preferred the smaller part.',
  ],
  'claim.relationship.self.cordial.theatrical': [
    '{victim} and I were on perfectly good terms, darling. Perfectly good. Not a cross word between us.',
    'We got on well, {he} and I. No quarrels, no debts, no history. Merely friends, and rather a good double act.',
    'Cordial. That is the honest word. We liked one another well enough and left it there.',
  ],
  'claim.relationship.self.devoted.theatrical': [
    'I loved {him} dearly, darling. {He} was family to me, whatever anyone whispers in the wings.',
    'How did things stand between us? {He} was the best friend I had in the world, and now you know my loss.',
    'No one {inThisHouse} was closer to {him} than I, {detective}. I have wept, and I am not ashamed to say so.',
  ],
  'claim.relationship.self.disinherited.theatrical': [
    '{He} was going to cut me out, darling. The new will was drawn; it wanted only {his} name at the foot. I knew. I shall not pretend otherwise.',
    'You will hear that {he} meant to sign a new will, my dear, and that I was not in the cast. Both are true.',
    'I was to be left nothing. {He} told me so {himself}, and told me the day {he} meant to sign. A cruel cue.',
  ],
  'claim.relationship.self.dismissed.theatrical': [
    '{He} meant to turn me out, darling. I had been told as much, and told to be gone. I have had my notice before, but never like that.',
    'I was to go, my dear. {He} had made up {his} mind to it, and {he} was not one to unmake it. A very final exit.',
    '{He} was putting me out of {thisHouse}, darling, without a word to take with me. I had nowhere to go.',
  ],
  'claim.relationship.self.exposed.theatrical': [
    '{He} knew something about me, darling. I shall not tell you what. {He} meant to make it public, and {he} told me when.',
    'There is a thing in my past which {he} had found out, and intended to tell. I am not proud of it, nor of how this sounds.',
    '{He} had a report, darling; {he} had me watched. {He} was going to use it, and I knew {he} was.',
  ],
  'claim.relationship.self.forbidden.theatrical': [
    'I asked for {his} {child}’s hand, and {he} refused me. {He} said it should never be while {he} lived. Quite the stern censor.',
    'I wished to marry {his} {child}, my dear. {He} forbade it, forbade us so much as to write. A cruel piece of casting.',
    'There is an attachment between {his} {child} and myself, and {he} would not hear of it, and said so in terms I shall not repeat.',
  ],
  'claim.relationship.self.hostile.theatrical': [
    'Since you ask: we despised one another, and I shall not weep false tears now. I leave that to the amateurs.',
    'I hated {him}, and I shall say it plainly, unlike everyone else, who only hints. Hatred is not a confession.',
    'We loathed each other, {detective}, and the whole of {household} knew it. One does not hide a feud of that quality.',
  ],
  'claim.relationship.self.indebted.theatrical': [
    'I owed {him} money. A very great deal of money. You would have found it out anyway.',
    'The truth? I was in {his} debt to a sum I do not like to say aloud. Motive in your book, perhaps; misery in mine.',
    '{He} held my notes of hand, my dear, and reminded me of it. I owed {him} more than I could pay.',
  ],
  'claim.relationship.self.jilted.theatrical': [
    '{He} threw me over, once upon a time, darling. One does not forget it; one merely learns to smile through it, as in a long run.',
    'There was an understanding between us, years ago, and {he} ended it badly. I have carried that with a brave face ever since.',
    '{He} and I were to be married, once. It was to have been the grand finale, and {he} thought better of it.',
  ],
  'claim.relationship.self.rival.theatrical': [
    'We were partners, {he} and I, darling, and {he} was pushing me out of a firm I helped to build. You may as well hear it from me.',
    '{He} and I were in business together, my dear. Lately {he} had been arranging matters so that there was nothing left of the partnership.',
    '{He} meant to ruin me. It was all quite legal, and it would have left me with nothing of what we made.',
  ],
  'claim.relationship.self.strained.theatrical': [
    'We had our frictions, {he} and I. I shall not insult you by pretending otherwise.',
    'There was a coolness between us of late, my dear. Nothing that ends in murder, but I will not deny the coolness.',
    'Things were strained, and I will not lie to you about it. We had been civil, and only civil, for weeks. Civility is the hardest part to play.',
  ],

  'claim.role.theatrical': [
    'As to my part in all this: I am {roleName}. I was cast in it, and there it is.',
    'You may as well have it plainly, with no flourish. I am {roleName}.',
    'Put me down in that notebook as {roleName}, and spell it right. I have had enough misprints in the programme.',
  ],
  'claim.roomEmpty.theatrical': [
    'My room faces {room}, darling, and nobody went into it all hour. I should have caught the door; I have an ear for an entrance.',
    'I sat in the hall opposite {room} the whole hour, my dear. Nobody went in, and nobody came out. Not a single entrance or exit.',
    'Those floorboards creak like a bad knee, and nothing stirred outside {room} all hour. It was empty.',
  ],
  'claim.roomUsed.theatrical': [
    'My room looks straight onto the door of {room}, darling. Somebody made an entrance that hour. I could not tell you who.',
    'I sat in the hall opposite {room} all hour, and the door opened. I had my back turned, I am afraid. Poor staging.',
    'I heard the floorboards outside {room}, darling, and the latch. There was somebody in there that hour, though I cannot give you a name.',
  ],
  'claim.sighting.theatrical': [
    'I saw {target} in {room} during that hour. Of that I am certain; I would swear to it.',
    'One thing I can swear to: {target} was in {room}. I saw it with my own eyes, as plainly as the front row.',
    '{target} was in {room} then, darling. Whatever else is in doubt, that is not; I am as sure of it as of my own cue.',
  ],
  'claim.suspicion.theatrical': [
    'If you want the truth of my heart, darling, I have had my eye on {target} all evening.',
    'I make no accusation. I merely observe that {target} has not been right, as one observes an actor off the beat.',
    'Since you ask me plainly: {target}. I cannot tell you why, darling. I can only tell you that I feel it, as an actor feels a cold audience.',
  ],
  'claim.together.theatrical': [
    'There has been talk about {first} and {second} for weeks, darling, and I can tell you they spent that hour in each other’s company. Every minute.',
    'I make it my business to know these things, {detective}. {first} and {second} were together all hour, not a minute apart. A perfect duet.',
    'Oh, {first} and {second} were thick as thieves that hour. Whatever they say, they never left one another’s side.',
  ],
  'claim.whereabouts.alone.theatrical': [
    'For the hour in question, I was in {room}, quite alone. A solo turn, and no audience to say so.',
    'I was in {room}. Alone, as it happens, which I realise serves me poorly. No witnesses, not even a stagehand.',
    'You will find me difficult to corroborate, darling: {room}, by myself, the whole of it. A monologue, I fear.',
  ],
  'claim.whereabouts.company.theatrical': [
    'I was in {room} the whole while, and hardly playing to an empty stage. {companions} can vouch for every minute.',
    'From {windowFrom} I was in {room} with {companions}, my dear. Ask there and you will hear the same, word perfect.',
    '{room}, darling, in the company of {companions}. We never left it, not for a single exit.',
  ],

  // =====================================================================
  // CONFESSION
  // =====================================================================
  'confession.theatrical': [
    'Stop, {detective}. Before you name anybody else, my dear, it is my name you want. Ring down the curtain.',
    'No. I cannot sit here and watch you point at somebody else. You need not look any further. The scene is over.',
    'No more of this, darling. I have carried it all evening, and I will not carry it past midnight. The last act is mine to play.',
  ],

  // =====================================================================
  // EVIDENCE — a guest shown a thing
  // =====================================================================
  'evidence.bare.theatrical': [
    'Then whatever did it has been carried off, darling. Somebody has struck the set after the murderer.',
    'Nothing left to say how it was done? Then somebody took it, my dear, and took it somewhere. A prop does not walk off by itself.',
    'A murder, and nothing it was done with, {detective}? It did not walk out of the room by itself. Somebody has cleared the stage.',
  ],
  'evidence.bribe.theatrical': [
    'That is a good deal of money to find lying about, darling. It has a name on it, and the name is not mine.',
    'Somebody has been paid for something, my dear. You can read whose name is on it as well as I can.',
    'I know nothing of it, and it is not my cue. I should ask the one whose name is on it.',
  ],
  'evidence.deny.theatrical': [
    'That is not mine. You will need rather more than that to trouble me.',
    'It is not mine. I do not say it to be difficult; I say it because it is true.',
    'That? Put it away. It is nothing of mine, whatever it resembles. Look for another player.',
  ],
  'evidence.doc.comment.theatrical': [
    'I know nothing of that paper. Its author does, I should think.',
    'Somebody’s private grief, my dear, laid out in ink. It is not mine to explain.',
    'That is the first I have seen of it, darling, and I will say it makes for uneasy reading. A very dark scene.',
  ],
  'evidence.doc.confirm.theatrical': [
    'So you found it, darling. I suppose I always knew somebody would; one cannot hide a script forever.',
    'Yes. I shall not dress it up. Better you hear it from me than from {house}.',
    'That is genuine. I would not insult an intelligent audience by pretending otherwise.',
  ],
  'evidence.doc.deny.theatrical': [
    'Where did you… no. No. You have hold of something twisted out of all meaning. Hear how things truly stood:',
    'Papers can be made to say anything, my dear. Any critic will tell you so. I will tell you how matters actually were:',
    'That is, that is not what it looks like. Let me tell you how things really stood.',
  ],
  'evidence.doc.gossip.theatrical': [
    'That paper only says aloud, what half {house} has whispered for weeks. It is simply the whisper in print.',
    'I am not surprised. Let me tell you why I am not surprised.',
    'Ah, so it is written down, darling. I could have told you as much, and now I shall.',
  ],
  'evidence.flavor.theatrical': [
    'Somebody’s rubbish. Not a clue, I think, unless untidiness is a crime, in which case half the profession is in the dock.',
    'You will find one of those in every room of {thisHouse}, my dear. It means nothing; a mere stage property.',
    'Hm? No. That is just a thing. It was there before any of this began; it is scenery, no more.',
  ],
  'evidence.hand.theatrical': [
    'That is {his} hand, certainly. {He} wrote a great many letters.',
    'Yes, I know that writing. {He} wrote to everybody and kept copies of nothing.',
    'A letter of {his}. Business, by the look of it. It always was.',
  ],
  'evidence.identify.theatrical': [
    'That did not come from me, but I can think of who it might have come from, and so can you.',
    'Not mine. Hold it up against the company and see whom it fits, as one tries a costume.',
    'I should look for the {one} that matches, if I were you. It is not I; the costume does not fit.',
  ],
  'evidence.key.theatrical': [
    'That is the key to {locked}, darling. I wondered where it had got to.',
    'The key to {locked}. Well, now you can see for yourself what is in there. A real reveal.',
    'Yes, that opens {locked}. I have no idea who had it last; it is a prop that wandered off.',
  ],
  'evidence.killed.theatrical': [
    'Dead, and but an hour ago sitting among us. Whoever did the first has done this. Dear heaven, it is no play.',
    'Then somebody was afraid of what they knew. I wish to heaven they had told you sooner, before the final scene.',
    'Two, now, and the rest of us shut in with whoever did it. No stage manager ever dreamed of worse.',
  ],
  'evidence.lockbox.theatrical': [
    'The box was forced? Then we have a thief as well as a killer. A double bill, and neither to my taste.',
    'Forced, you say? A thief as well as a murderer. The author is being greedy with the plot.',
    'A thief, then, as well as a killer. Really, one villain to a play is quite enough.',
  ],
  'evidence.lockbox.intact.theatrical': [
    'Locked, and not a mark on it, darling. Whatever happened in that room, it was not a robbery.',
    'Untouched. If anybody tells you they were at that box, they are telling you a story, and not a very good one.',
    'Nobody has been at that. It is just as it always was, not so much as a scratch on the set.',
  ],
  'evidence.note.theatrical': [
    'Poor soul, darling. I had no notion {he} was so unhappy. {He} played the part so well.',
    'I cannot look at it. Put it away, please. I have read many a last line, but never one like that.',
    'Forgive {him}? Forgive {him} what? I do not understand it at all. It reads like a part for which I was never sent the script.',
  ],
  'evidence.passage.theatrical': [
    'A passage! Then whoever was in that room could have come and gone as they pleased. Entrances and exits at will.',
    'So the old stories were true. I should ask who spent the hour at the end of it. Every theatre has its secret stair.',
    'I never knew of it, darling. But it alters things, does it not, for whoever was in that room? A hidden exit changes the whole blocking.',
  ],
  'evidence.trace.own.theatrical': [
    'That is mine, I am afraid. I told you where I was; there is the proof of it, in black and white.',
    'Yes, mine. I left it where I sat. I said as much, if you recall; I never miss a line.',
    'Mine, and for once I am glad of it. It says what I said, and a prompt book could not be plainer.',
  ],
  'evidence.weapon.comment.theatrical': [
    'I could not have done that, {detective}. Look at me. You know I could not; it is quite out of my range.',
    'That is beyond my capacity, my dear. Somebody else’s, evidently. I should never have been cast for it.',
    'Grim. And beyond me, I am afraid, as you can see for yourself.',
  ],
  'evidence.weapon.deny.theatrical': [
    'I had the means, darling. I am not fool enough to deny it. I am also not the one who used them.',
    'Yes, that was within my reach. Reach is not deed; one may stand in the wings without ever making an entrance.',
    'Yes, I could have laid hands on that. So could half {house}, and you know it, {detective}. Access is not action.',
  ],

  // =====================================================================
  // THE GATHERING
  // =====================================================================
  'gathered.theatrical': [
    'Well then, darling. The company is assembled and the curtain is up. Who is it?',
    'I cannot take much more of this. Say it, whoever it is, and have done. Take your cue.',
    'You have been up and down {thisHouse} all night, like a stage manager at the half. I hope to heaven you know.',
  ],

  // =====================================================================
  // KNOWLEDGE — how much a guest will share
  // =====================================================================
  'knowledge.hedged.theatrical': [
    'Here is what I know, but mind, it may be read more ways than one. I give you the lines; you must find the subtext.',
    'Facts I have; the interpretation I leave to you. It might mean one thing, it might mean quite another, like a good ambiguous ending.',
    'I offer it as I found it, darling, and what it means I honestly cannot say. Do not hold me to the reading.',
  ],
  'knowledge.share.theatrical': [
    'Listen, then, darling, and make of it what you will. I shall deal with you squarely.',
    'Very well, my dear, here is what I have. It is not much, but it is honest, and I shall play it straight.',
    'What I can offer you is this. Consider it a speech delivered straight to the footlights.',
  ],
  'knowledge.silent.theatrical': [
    'I will tell you what I am, darling, and there I stop. Of the rest I have nothing to say.',
    'You may have my name for it, my dear, and welcome. What goes with it, I shall keep to myself; a player must have some secrets.',
    'I can tell you who I am. I cannot tell you more than that, and I would rather you did not ask. The scene ends there.',
  ],
  'knowledge.vague.theatrical': [
    'Know? What should I know? I keep to my own affairs, and I shall keep them, unless you have something that touches me.',
    'You are fishing, {detective}. Come back with something in your hand, and I may rise to the bait.',
    'If I knew anything worth your time, I should want a reason to say it. A mere question is not a cue.',
  ],

  'lastWords.theatrical': [
    'Oh, I did not hear you come in, darling. Is something the matter? You gave me quite a start.',
    'Yes? Why, I thought everybody had gone up. An entrance, and unannounced.',
    'You? Whatever are you doing down here at this hour, my dear? Quite the surprise entrance.',
  ],
  'opens.theatrical': [
    'Well. Since you have that, you may as well have the rest. The second act is yours.',
    'That changes matters. Very well. Here is what I have been keeping back, and I shall play it straight.',
    'I said I wanted a reason. That will do for one. You have earned your scene.',
  ],

  // =====================================================================
  // REACTIONS — the first thing said on being approached
  // =====================================================================
  'reaction.accuse.theatrical': [
    'You need not look far, in my opinion. {target} has been wrong all evening, like a flat out of true.',
    'Save your ink for one name, my dear: {target}. There. Someone had to say it, and I have never been shy of a cue.',
    'I shall spare you the preliminaries, and go straight to the big speech. Look at {target}.',
  ],
  'reaction.heard.crash.theatrical': [
    'You will want more than handshakes and alibis, {detective}, so I shall give you something real, darling.',
    'Before you begin your clever questions, my dear, there is a thing you ought to know. I have been holding it for the right entrance.',
    'I have been turning something over all evening, and I think you should have it. The moment seems to be my cue.',
  ],
  'reaction.overheard.theatrical': [
    'It is not my place, perhaps, but there is something I should tell you. Consider it an aside.',
    'There is something I should mention, and I might as well say it now, while the stage is mine.',
    'Between ourselves, I have something to tell you. I ought to have said it long before.',
  ],
  'reaction.plain.theatrical': [
    'A black night for {thisHouse}. Ask what you must.',
    'You will want to question all of us, I suppose, my dear. Begin, then; the stage is yours.',
    'I have been waiting for you to come to me, darling, quite in the wings. Go on.',
  ],
  'reaction.referral.theatrical': [
    'I can give you no name, but {victim} shut {himself} away in {room} all afternoon, scribbling at some paper. Were I you, I should look there.',
    'One odd thing, my dear, since you ask: {victim} spent the whole afternoon locked in {room}, writing. Whatever {he} wrote is presumably still there.',
    'I cannot tell you who, darling. I can tell you that {victim} was writing something in {room} all afternoon, and was most short with anyone who knocked.',
  ],
  'reaction.weaponhint.theatrical': [
    'Something has nagged at me since we found {him}: {room} is not as it should be. Something missing, or something there that should not be, like a stray prop.',
    'If I were hunting the how of it, {detective}, I should start with {room}. Call it an old player’s instinct; {house} is very slightly wrong there.',
    'A small thing, and possibly nothing: {room} has been disturbed. I noticed it in passing and thought little of it. I think more of it now.',
  ],

  // =====================================================================
  // ROLES
  // =====================================================================
  'role.claim.theatrical': [
    'Very well. You may as well know it. I shall not keep you waiting for the entrance.',
    'Since it will come out regardless, I may as well make a proper announcement of it:',
    'I shall not fence with you, darling; the swordplay can wait for the second act.',
  ],
  'role.vague.theatrical': [
    'What was I, in all this? A {one} with dreadful luck. If you want more than that, bring me a reason.',
    'We are to trade in secrets now? Not on nothing. Show me you know something, and we shall see.',
    'My part in the evening? I shall keep that to myself, unless you have something that says I mustn’t.',
  ],

  // =====================================================================
  // SEEN — what a guest noticed
  // =====================================================================
  'seen.key.theatrical': [
    'Oh, you are looking for the key to {locked}, darling? I think I saw it lying in {room}.',
    'The key to {locked}, my dear? It was lying in {room}, last I saw of it, like a prop left in the wings.',
    'If it is the key to {locked} you are after, I noticed one in {room}. I thought nothing of it at the time.',
  ],
  'seen.key.held.theatrical': [
    'The key to {locked}, darling? I saw {person} pick up a key. I thought nothing of it at the time.',
    'You want the key to {locked}? Ask {person}. I saw a key in {person}’s hand.',
    'If it is the key to {locked} you are after, {person} has it, I believe. I saw it picked up, as neatly as a prop.',
  ],
  'seen.nothing.theatrical': [
    'Nothing worth your while, darling, I am afraid. I was minding my own part, and not a thing to report from the wings.',
    'I wish I could help you there. I noticed nothing; I was entirely absorbed in my own scene.',
    'Nothing out of the way, darling, nothing at all, and I do wish I could give you a better scene.',
  ],
  'seen.share.theatrical': [
    'I did notice one thing, now you ask, darling. Not a great deal, but it caught my eye as an entrance does.',
    'Something, yes, for what it is worth. I shall give it you as I saw it.',
    'I was not looking for anything, darling, I was not playing detective. But I saw this.',
  ],

  // =====================================================================
  // SUSPECTS — naming, or not naming, a name
  // =====================================================================
  'suspect.hedge.theatrical': [
    'If I had to name someone, I might say {target}. Though I could argue it the other way, with the same conviction.',
    '{target} seems likeliest, my dear, though I admit I may be wrong. I have been wrong in the casting before.',
    'I lean toward {target}, darling. I say lean. I am not putting my full weight on it, not on a creaking board.',
  ],
  'suspect.none.theatrical': [
    'No name, darling, but {person} has been sharper than I all evening. Start there; I am only the understudy.',
    'I would sooner not guess. {person} may not need to, and that is the better casting.',
    'I could not put a name to it, truly. But if you want someone worth asking, try {person}.',
  ],
  'suspect.point.theatrical': [
    'You asked, so I shall say it: {target}. Watch the eyes when you ask about the hour.',
    '{target}. I have no proof you could hang a hat on, only that everything about this evening points one way.',
    'In my view, you are wasting the footlights on the rest of us while {target} sits there so very quietly.',
  ],
  'suspect.vouch.theatrical': [
    'I have no name for you. But I will say this: whoever it was, I do not believe it was {target}.',
    'I could not tell you who. I could tell you who it was not, and that is {target}. Call it a feeling; actors live on feelings.',
    'No, nobody I would name, darling. If it helps, I cannot make myself believe it of {target}; it is simply miscast.',
  ],
}

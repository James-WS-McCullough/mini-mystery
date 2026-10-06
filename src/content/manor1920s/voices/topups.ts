import type { DialogueBanks } from '../../schema'

// Lines added to the DRAMATIC and PRICKLY manners, which were thinner than the rest.
// The RULES OF THE BANKS in ../dialogue.ts apply: voice only, shared by the
// honest and the lying alike, and no line says more than its neutral counterpart.

export const topups: DialogueBanks = {
  // DRAMATIC
  'about.nothing.dramatic': [
    'I know nothing of that {one}, nothing! Ask me for a secret and I must weep, for I have none to give.',
    'A stranger! The merest shadow at the edge of the candlelight! I could not tell you a single thing, {detective}.',
    'Oh, if only I knew! But that {one} has passed through my life like smoke, and left nothing behind.',
  ],
  'about.person.dramatic': [
    'Ah, now you ask me something, {detective}! Listen, and let me give you what little I have.',
    'It is little, so little, but every word of it is honest, and I shall give it to you with my whole heart.',
    'Then let me speak! It is a small thing, I warn you, but I have never been more sincere.',
  ],
  'about.referral.dramatic': [
    'Not I, {detective}, not I! {person} could tell you so much more. Go to {person}, and quickly!',
    'Alas, my knowledge is a candle beside a lamp. {person} is the lamp. Ask there!',
    'Ask {person}! Fate gave {person} the knowing of it, and gave me only the good intentions.',
  ],
  'about.victim.dramatic': [
    'How I stood with {him}? Oh, {detective}, you cannot imagine! I shall tell you honestly, and may heaven hear me.',
    'I knew you would ask! I have felt the question coming all evening like a storm on the horizon.',
    'Between {him} and me! Well. Sit, sit, and I shall give it to you honestly, every word.',
  ],
  'alibi.alone.dramatic': [
    'My whereabouts! Of course, of course. Nothing could be simpler to tell, nor harder to prove!',
    'Where I was! I shall tell you at once, {detective}, and you may do with it what destiny allows.',
    'Ah, that question, spoken aloud at last! Very well. I shall answer it plainly, whatever it costs me.',
  ],
  'alibi.company.dramatic': [
    'Oh, what a mercy! I am not alone in the world, {detective}; I have witnesses, living, breathing witnesses!',
    'That, thank heaven, is the easiest question you could have asked! I stand on solid rock, solid rock!',
    'I have others to speak for me, {detective}! After such a night, what a blessing it is to say so.',
  ],
  'alibi.forgot.dramatic': [
    'I cannot recall it, {detective}! I search my memory and find only fog, a perfect, maddening fog!',
  ],
  'claim.alignment.evil.dramatic': [
    'Beware {target}! I feel it in my bones, {detective}: something dark lives behind that face.',
    '{target} is not what {target} seems! I have sensed it for an age, and tonight the curtain begins to lift.',
    'There is rot in {target}, rot! Do not ask me to prove it. Some things one simply knows, as one knows a storm.',
  ],
  'claim.alignment.good.dramatic': [
    'Look elsewhere, {detective}! {target} is true, true to the core. I would stake my very soul on it!',
    'Oh, not {target}! Whatever shadows fall tonight, none touch {target}. I know it as I know my own heart.',
    'Strike {target} from your list, I implore you! I have felt the truth of it from the first, and I do not feel such things lightly.',
  ],
  'claim.apart.dramatic': [
    'Together, the pair of them, the whole hour? Never! {first} and {second} were apart, {detective}; I would swear it before heaven.',
    'You have been deceived, {detective}! {first} and {second} were nowhere near one another that hour. I know it as I know my own name!',
    'Apart! {first} and {second} were not together that hour, not for one moment! I felt the distance between them.',
  ],
  'claim.culpritAttr.sex.dramatic': [
    'I cannot give you a name, {detective}, but I can give you this, and my heart is in it: the murderer is {sex}!',
    'It was {sex}! Do not ask me how I know. Some things come to one in the dark, whole and terrible.',
    'Look for {sex}, {detective}, and look quickly! I have no proof, but I have never been so certain of anything.',
  ],
  'claim.culpritAttr.trait.dramatic': [
    'I cannot give you a name, {detective}, but the vision is clear as a bell: your killer {trait}!',
    'Mark it, mark it well! The one you seek {trait}. I have seen it in the dark, in a dream, I know not how.',
    'Do not ask how I know, for I could not tell you! But the murderer {trait}, and my whole soul trembles with it.',
  ],
  'claim.glimpse.dramatic': [
    'A figure, near {room}, no more than a shape! I could not say the face. But whoever it was {trait}!',
    'It was over in a breath, {detective}! Someone passed by {room}, and though I saw no face, the figure {trait}.',
    'I glimpsed a shadow by {room}, only a shadow! The face is lost to me, yet I swear the figure {trait}.',
  ],
  'claim.heard.crash.dramatic': [
    'A crash from {room}! Glass shattering, or a lock giving way! I told myself it was {weather}, but my heart knew better.',
    'Oh, that sound, {detective}! Something broke in {room}, sharp and deliberate. It was not {weather}! I know the difference.',
    'I heard it from {room}: wood splintering, or metal! My blood ran cold, and I very nearly went to look. Very nearly!',
  ],
  'claim.heard.quarrel.dramatic': [
    'Such a quarrel, {detective}! Voices raised in {room}, bitter, ringing, dreadful! The words escaped me, but never the sound of it.',
    'I passed {room} and heard {victim} quarrelling with someone, and oh, the bitterness of it! I shall hear it all my life.',
    'Shouting from {room}! {victim} and another, and I could not make out who. The very walls shook, {detective}!',
  ],
  'claim.liarsAmong.dramatic': [
    'I watched {pair} all evening, {detective}, and my instincts scream it: {howMany} lying to you about that hour!',
    'Beware these two: {pair}! I have seen what I have seen, and {howMany} giving you a false account of where they were.',
    '{pair}, {detective}! Oh, it pains me to say it, but {howMany} giving you a false account of the hour.',
  ],
  'claim.passage.dramatic': [
    'A secret passage, {detective}! From {scene}, through the wall, to {room}! You will not find it on any plan!',
    'I know {thisHouse} as I know my own heart: behind the panelling in {scene} a passage runs, and it opens in {room}!',
    'Hidden, and nearly forgotten! A way through the wall of {scene}, coming out in {room}. Oh, the stories that wall could tell!',
  ],
  'claim.passing.dramatic': [
    'I was in {passage} just after the deed, {detective}, and who should I meet coming from {room} but {target}! Make of that what you will!',
    'Oh, the shock of it! {target}, hurrying along by {room}, just after it must have happened. Perhaps it means nothing. Perhaps!',
    'Fate put me in {passage} at that very moment, {detective}, and fate put {target} there too, coming from {room}! I tell you only what I saw.',
  ],
  'claim.relationship.gossip.cordial.dramatic': [
    '{subject} and {victim}? Oh, a perfect harmony! I never saw so much as a cross word between them, and I watch for such things.',
    'Dull, {detective}, quite dull! {subject} and {victim} were as pleasant together as a day in May.',
    'There was no drama between {subject} and {victim}, none! Amiable, always amiable. I looked for a storm and found only sunshine.',
  ],
  'claim.relationship.gossip.devoted.dramatic': [
    '{subject} worshipped {victim}! Worshipped! One had only to see them together to feel it, {detective}.',
    'Such devotion! {subject} and {victim} were as close as any two souls {inThisHouse}, and closer, I tell you, closer!',
    'Oh, the way {subject} looked at {victim}! It was real affection, the genuine article, and it moved me to the very heart.',
  ],
  'claim.relationship.gossip.disinherited.dramatic': [
    'Cut out! {victim} meant to cut {subject} out of the family, and the new will lacked only {his} signature!',
  ],
  'claim.relationship.gossip.exposed.dramatic': [
    'Oh, the secret {victim} held over {subject}! {He} meant to tell it, {detective}, to tell it to the whole world!',
  ],
  'claim.relationship.gossip.hostile.dramatic': [
    '{subject} and {victim} were at daggers drawn, {detective}! Such hatred I have rarely seen. One could feel the very air curdle.',
  ],
  'claim.relationship.gossip.strained.dramatic': [
    'A chill had fallen between {subject} and {victim}, a dreadful chill! Everyone saw it, and everyone pretended not to!',
    '{subject} and {victim}, polite, so terribly polite! One felt the frost at table. Something had gone wrong, {detective}, oh, something.',
    'It was not a scandal, no, but a coolness, an icy coolness, between {subject} and {victim}. I felt it every time they shared a room.',
  ],
  'claim.relationship.self.beneficiary.dramatic': [
    'I inherit! There, it is spoken! The will was signed this week, and I did not ask for it, {detective}, I did not!',
  ],
  'claim.relationship.self.cordial.dramatic': [
    '{victim} and I were on the best of terms! No quarrels, no debts, no history, only a quiet and civilised friendship.',
    'We got on, {he} and I, oh, beautifully! Cordial, {detective}, that is the word, and I use it with my whole heart.',
    'Ours was a gentle, pleasant acquaintance, {detective}. We liked one another well, and left it there, and not a cloud crossed it.',
  ],
  'claim.relationship.self.devoted.dramatic': [
    'I loved {him}! Dearly, deeply, with my whole heart! {He} was family to me, {detective}, whatever anyone may whisper.',
    'Oh, my loss, my terrible loss! No one {inThisHouse} was closer to {him} than I, and tonight I have wept for it.',
    '{He} was the best friend I had in the world, {detective}, and now the world is a smaller, colder place!',
  ],
  'claim.relationship.self.dismissed.dramatic': [
    '{He} meant to turn me out, {detective}! It was settled, and I was to be gone by the month’s end.',
    'I was to go! {He} had made up {his} mind, and nothing on earth could unmake it. Cast out, {detective}, cast out of {thisHouse}!',
    'Turned out of {thisHouse}, and without a word to take with me! I had nowhere in the world to go.',
  ],
  'claim.relationship.self.strained.dramatic': [
    'We had our frictions, {he} and I, and I shall not pretend otherwise. A coolness, {detective}, an unspoken chill!',
    'Things were strained, terribly strained! Civil, only civil, for weeks, and I shall not lie to you about it.',
    'There was a coldness between us of late, {detective}, a dreadful coldness! I would be a hypocrite to deny it.',
  ],
  'claim.role.dramatic': [
    'You wish to know my part in this drama? I am {roleName}, {detective}, and heaven help me!',
    'Let the notebook record it, then, in letters of fire: I am {roleName}!',
    'What am I? I am {roleName}, and I have never been more aware of it than tonight!',
  ],
  'claim.roomEmpty.dramatic': [
    'Nobody went into {room}, nobody! I had my eye upon that door the whole hour, and I should have heard the latch.',
    'Not a soul entered {room}! The floorboards groan at the lightest step, and the whole hour passed in silence.',
    'I sat there the whole hour, {detective}, within sight of {room}, and not one person went in or came out! Not one!',
  ],
  'claim.roomUsed.dramatic': [
    'Somebody went into {room}, {detective}! I heard the latch, the floorboards, the whole dreadful business, though who it was I could not say.',
    'The door of {room} opened that hour, and closed again! My back was turned, and I shall regret it to my dying day.',
    'There was someone in {room}, I tell you! The creak of the boards, the click of the latch, and then silence. Who, I cannot say.',
  ],
  'claim.sighting.dramatic': [
    '{target} was in {room}, {detective}! I saw it with my own eyes, and I shall swear to it before any court.',
    'There, in {room}, stood {target}! Whatever else is shrouded in doubt, that, that I know.',
    'I cannot be mistaken, {detective}. {target}, in {room}, in that very hour! I would know that figure anywhere.',
  ],
  'claim.suspicion.dramatic': [
    'I make no accusation, {detective}, but my eye keeps returning to {target}. Something is wrong there; I feel it in my very bones.',
    '{target}! I cannot tell you why. I only know that my heart has fixed upon {target} all evening and will not let go.',
    'Ask me who, and I shall say {target}, and tremble as I say it! It is only a feeling, {detective}, but oh, what a feeling.',
  ],
  'claim.together.dramatic': [
    '{first} and {second}, together, every moment of that hour! I assure you, {detective}, I saw it with my own eyes!',
    'Inseparable! {first} and {second} spent the whole hour in one another’s company, not a minute apart. Whatever they tell you!',
    'Oh, I know what I know, {detective}! {first} and {second} never left one another’s side that hour. Hand in glove, the pair of them!',
  ],
  'claim.whereabouts.alone.dramatic': [
    'I was in {room}, quite, quite alone, with only my thoughts for company, and what restless thoughts they were!',
    'Alone, {detective}, in {room}! The whole of it, by myself, and not a witness to my name. Fate is cruel.',
    '{room}, and no other soul! I see now what a lonely thing an alibi is, {detective}, when one has none.',
  ],
  'claim.whereabouts.company.dramatic': [
    '{companions} and I were together in {room}, {detective}, the whole of it! Ask them, ask them all, and hear the same account!',
  ],
  'confession.dramatic': [
    'Stop! Stop, {detective}, I cannot bear it a moment longer! It is I you want. It was always I.',
    'No more! No more accusations! I have carried this all evening, and I will not carry it into the dawn. Look no further!',
    'Spare the others, {detective}! The truth must come out, and it must come from me. Here I stand, and the name you seek is mine!',
  ],
  'evidence.bare.dramatic': [
    'Nothing! Not a trace of how it was done! Then someone has swept the stage clean, {detective}, and swept it well.',
    'Gone! Whatever it was done with has been spirited away by someone, and quite without a sound!',
    'A murder, and no instrument! It did not vanish by itself, {detective}. Somebody carried it off, and I should dearly like to know who!',
  ],
  'evidence.bribe.dramatic': [
    'Money! Such a sum, lying about like autumn leaves! And a name upon it, {detective}, and it is not mine!',
    'Somebody has been paid, paid! I can read the name as well as you can, and I tell you it is not my own.',
    'I know nothing of it, nothing! Ask the one whose name is written there, {detective}, for I cannot say a word.',
  ],
  'evidence.deny.dramatic': [
    'Mine? Mine! You cannot be in earnest, {detective}. It is not mine, not mine, look elsewhere!',
    'Do you take me for a fool? That is not mine! Look somewhere else, I beg you.',
    'Not mine, I tell you, not mine! Whatever you believe, look somewhere else, for you will find nothing of mine there.',
  ],
  'evidence.doc.comment.dramatic': [
    'A paper like that! I know nothing of it, nothing! Its author must know, and no one else.',
    'Oh, someone’s private grief, spilled in ink! It is not mine to explain, {detective}, and I shudder to read it.',
    'I have never seen it before! And what a reading it makes, {detective}. I feel quite faint.',
  ],
  'evidence.doc.confirm.dramatic': [
    'So you have found it! I always knew someone would, {detective}. One cannot keep such things forever.',
    'Yes! It is genuine! I shall not insult you by denying it, {detective}; better you hear it from my own lips!',
    'It is true, every word, and I shall not dress it up in pretty colours. Let it be told by me, and not by the whispers of {house}!',
  ],
  'evidence.doc.deny.dramatic': [
    'No! Twisted, twisted out of all meaning! Hear how matters truly stood, {detective}, and be undeceived:',
    'Paper! Paper can be made to say anything! But I shall tell you how it truly was, from living lips:',
    'Oh, that is not what it seems, not at all! Let me tell you how things really stood, {detective}!',
  ],
  'evidence.doc.gossip.dramatic': [
    'It is written at last! What half {house} has whispered for weeks, now in ink! I am not surprised, {detective}, and I shall tell you why.',
    'Ah! I felt it! I felt it long before any paper said so, and now you shall hear it from me.',
    'Such a revelation! And yet I am not astonished, {detective}, not in the least. Let me tell you why!',
  ],
  'evidence.flavor.dramatic': [
    'That? Oh, it is nothing, {detective}, only some untidy trifle. Forgive me, I thought for a moment my heart would stop!',
    'A thing, merely a thing! It was there before any of this began, and means nothing at all.',
    'Is that all? Oh, the drama of an ordinary object! It means nothing; one finds such things in any room.',
  ],
  'evidence.hand.dramatic': [
    'Yes! That is {his} hand, {his} very own, {detective}! {He} wrote such letters, such a quantity of letters!',
  ],
  'evidence.identify.dramatic': [
    'Not mine! Hold it to the light, {detective}, and see whom it fits! The truth stands plain for all who have eyes.',
    'That did not come from me, and I think you can guess whence it came. I tremble to say the name aloud!',
    'Look for the {one} it matches, I implore you! It is not I, {detective}, it is not I!',
  ],
  'evidence.key.dramatic': [
    'The key to {locked}! How it gleams! I wondered where it had vanished to, {detective}, and now it is found.',
  ],
  'evidence.killed.dramatic': [
    'Dead! And a little while ago among us, alive! Whoever did the first has done this, I know it.',
    'Another! Oh, heaven, another! Someone was afraid of what they knew, and now they are silenced. If only they had spoken sooner!',
    'Two! Two now, and the rest of us shut in with whoever did it! I feel the walls closing in, {detective}.',
  ],
  'evidence.lockbox.dramatic': [
    'The box forced! Then there is a thief at large as well as a killer! Oh, the wickedness of this night!',
    'Broken open! A thief and a murderer, {detective}, under the one roof! I shall never feel safe again.',
    'Forced, you say? A thief as well as a killer! Truly, truly, the night has no bottom.',
  ],
  'evidence.lockbox.intact.dramatic': [
    'Locked, untouched, not a scratch upon it! Whatever happened in that room, it was not robbery. I am quite certain!',
    'Not a mark! If anyone tells you they were at that box tonight, {detective}, they are spinning a tale, and a poor one!',
    'Exactly as it always was, quite as it was! Nobody has laid a finger on it, nobody!',
  ],
  'evidence.note.dramatic': [
    'Oh, poor soul, poor soul! I had no notion {he} was so unhappy, {detective}. No notion at all!',
  ],
  'evidence.passage.dramatic': [
    'A passage! Hidden in the wall all this time! Whoever was in that room could have come and gone like a ghost!',
    'So the old tales were true! Ask, {detective}, who spent that hour at the far end of it!',
    'I never knew of it, never! But it changes everything, does it not, for whoever was in that room?',
  ],
  'evidence.trace.own.dramatic': [
    'Mine! Oh, how glad I am of it! There is the proof of where I was, {detective}, just as I told you.',
    'Yes, mine! I left it where I sat, and now it speaks for me, as a loyal friend should.',
    'That is mine, {detective}, and for once in my life, how glad I am to own it! It says what I said.',
  ],
  'evidence.weapon.comment.dramatic': [
    'Beyond me, {detective}, quite beyond me! You can see it yourself. Look at me! I could never have done that.',
    'How grim! How ghastly! And beyond my capacity entirely, as any eyes can tell. Somebody else, surely.',
    'I? With that? {detective}, it is quite beyond me, as you can see for yourself!',
  ],
  'evidence.weapon.deny.dramatic': [
    'I had the means, yes, I shall not deny it. But I was not the one who used them, {detective}, never!',
    'Within my reach, yes! Reach is not deed, {detective}, and a hand that could is not a hand that did!',
    'Could I have laid hands on it? I could, I could, and so could half this table! Access is not action!',
  ],
  'gathered.dramatic': [
    'The hour has come! Who is it? Speak, {detective}, before I faint with suspense!',
    'We are all assembled, every trembling one of us! Say it, whoever it is, and let the curtain fall!',
    'You have haunted {thisHouse} all night, {detective}. Now, for pity’s sake, tell us! I hope to heaven you know.',
  ],
  'knowledge.hedged.dramatic': [
    'I shall tell you what I know, but oh, it may mean one thing, or quite the opposite! I cannot tell, {detective}.',
    'Facts, I have facts! But what they signify, only fate can say. Take them, and read them as you will.',
    'Be warned, {detective}: what I offer is a riddle with two faces! I give it as I found it.',
  ],
  'knowledge.share.dramatic': [
    'Listen, {detective}, and listen well! I have something to tell you, and I shall tell it now.',
    'Very well! The time has come, and here is what I know!',
    'I can bear the silence no longer! Hear me out, {detective}, for there is something I must say.',
  ],
  'knowledge.silent.dramatic': [
    'I shall tell you what I am, {detective}, and there the curtain falls! Of the rest I can say nothing at all.',
    'My name for it you may have, and welcome! But what goes with it must stay locked in my breast.',
    'Who I am, I shall tell you gladly! More than that I cannot, I will not, and I beg you not to ask me.',
  ],
  'knowledge.vague.dramatic': [
    'What I know? Oh, {detective}, you ask too much on too little! Come back with something in your hand, and I may unburden myself.',
  ],
  'lastWords.dramatic': [
    'Oh! You startled me! I thought everyone had gone up. Is something the matter?',
    'Heavens! Who is there? Oh, it is you! I did not hear you come in. What is the matter?',
    'You! Creeping about like a ghost, and at such an hour! Has something happened?',
  ],
  'opens.dramatic': [
    'Ah, you have it! Then I shall keep nothing from you now. Here is the rest, and may heaven forgive us all!',
    'That alters everything! Very well, hear what I have been keeping back, and judge it as you will.',
    'There! That is reason enough, and more! Ask, and I shall tell you everything.',
  ],
  'reaction.accuse.dramatic': [
    '{target}! There, I have said it, and the world has not ended! Look at {target}, {detective}, look closely.',
    'You needn’t look far, {detective}! It is {target}, and I have felt it like a cold hand on my shoulder all evening!',
    'Spare yourself the rest of us! Look at {target}, and look hard, for I have never been surer of anything in my life.',
  ],
  'reaction.heard.crash.dramatic': [
    'Before you begin, {detective}, there is a thing you must know! I have been turning it over all evening, and it will not rest.',
    'Wait! Before all your clever questions, hear me. I have something real to give you, and it is burning my tongue!',
    'I must speak, {detective}! There is something I have turned over and over, and I think you should have it.',
  ],
  'reaction.overheard.dramatic': [
    'There is something I ought to have told somebody long ago! I heard it, {detective}, and it has haunted me since.',
    'Hear me, {detective}! It is not what I saw but what I heard, and how thankful I am to be given the chance to tell it!',
    'I have been bursting to say it! I heard something, {detective}, and I ought to have spoken sooner.',
  ],
  'reaction.referral.dramatic': [
    '{victim} was shut up in {room} all afternoon, writing, writing, writing! I could not say what, but I should look there, {detective}.',
    'I can give you no name, alas! But {victim} locked {himself} in {room}, scribbling at something, and was dreadfully short with anyone who knocked!',
    'Oh, {detective}, look in {room}! {victim} spent the day shut away there, writing, and what {he} wrote is surely there still!',
  ],
  'reaction.weaponhint.dramatic': [
    'Something has nagged at me since we found {him}, {detective}: {room} is wrong! Something missing, or something there that should not be!',
    'If you hunt the how of it, {detective}, begin in {room}! I cannot say why, only that my instincts shrieked as I passed.',
    '{room} has been disturbed, {detective}! I noticed it in passing and thought nothing, and now my blood runs cold at the memory.',
  ],
  'role.claim.dramatic': [
    'Very well! You shall have it, {detective}, and may heaven help me.',
    'It will come out regardless, so let it come from my own lips!',
    'I shall not fence with you! The curtain rises, and here is the truth of it.',
  ],
  'role.vague.dramatic': [
    'My part in all this? Oh, I could tell you such a tale! Not on nothing, though. Show me you know something, and I shall unburden my heart.',
  ],
  'seen.key.held.dramatic': [
    'I saw it, {detective}, I saw it with my own eyes! {person} snatched up a key, the key to {locked}, and I thought nothing of it!',
  ],
  'seen.nothing.dramatic': [
    'Nothing! I wish to heaven I had seen something, {detective}, but nothing, nothing came my way!',
    'Not a thing! I have searched my memory from top to bottom, and there is nothing there.',
    'Nothing worth your while passed before me, {detective}. How cruel fate is to the willing witness!',
  ],
  'seen.share.dramatic': [
    'I saw something, {detective}, and now that you ask, I must tell it! One thing, but what a thing!',
    'Yes! Yes, there was something! I was not looking for it, but it was there, and I could not unsee it.',
    'Now that you ask, I shall confess that I noticed one thing. It has haunted me ever since!',
  ],
  'suspect.hedge.dramatic': [
    '{target}, I should say, or perhaps not! Ask me again in a minute and I shall tell you something quite different!',
    'Oh, I could swear it is {target}, and then I could weep, for I may be wrong! Do not hold me to it, {detective}.',
    'Pressed for a name, I murmur {target}. And yet, and yet, I could argue the opposite until the candles gutter!',
  ],
  'suspect.none.dramatic': [
    'A name? I have none! But {person} has been sharper than I all evening. Begin there, {detective}, I beg you.',
    'I cannot put a name to it, not for all the world! But if you must ask someone, ask {person}!',
    'No name will pass my lips, {detective}, though if you want somebody worth asking, try {person}. That much I can say.',
  ],
  'suspect.point.dramatic': [
    '{target}! There, I have said it, and heaven forgive me if I am wrong! I have no proof, only a certainty that burns.',
    'Look at {target}, {detective}, look at {target} and tell me everything does not point one way! I feel it to my fingertips.',
    'It is {target}, I tell you, {target}! Wasting your candles on the rest of us while {target} sits there in such stillness!',
  ],
  'suspect.vouch.dramatic': [
    'Who it was I cannot say, but not {target}, {detective}, never {target}! I could not believe it for all the money in the world.',
    'I have no name to give. But I know in my soul that it was not {target}. Call it a feeling; I call it certainty!',
    'Do not look to {target}! Whoever it was, my heart rejects it of {target}, utterly and entirely!',
  ],

  // PRICKLY
  'about.person.prickly': [
    'If you must have it, here it is. Do not expect more than there is.',
    'Oh, very well. It is not much, but what there is, you shall have.',
    'I can say a little. A little, mind, and I will not be pressed for more.',
  ],
  'about.victim.prickly': [
    'If you must know how things stood between {him} and me, I shall tell you. Honestly, since you will not leave it alone.',
    'I wondered how long it would take you to ask. Well, here it is, and I do not enjoy it.',
    'You are going to ask about {him} and me, I suppose. Very well. I shall be honest, whether you like it or not.',
  ],
  'alibi.alone.prickly': [
    'Where I was? Easily said. Proving it is your business, not mine.',
  ],
  'alibi.company.prickly': [
    'For once I need not depend on my word alone, and I should like that noted.',
  ],
  'alibi.forgot.prickly': [
    'I cannot tell you. There is a gap where it should be, and I do not care to be badgered about it.',
  ],
  'claim.alignment.evil.prickly': [
    'Look at {target}, if you must look at someone. There is something wrong there, and I have known it a long while.',
    '{target} is not what {target} pretends to be. I will say it once, and I will not be drawn on it.',
    'You asked, so: there is rot in {target}. I have no wish to quarrel about it, but I will not take it back.',
  ],
  'claim.alignment.good.prickly': [
    'Leave {target} out of it. I know that much for certain, and I resent having to say so.',
    '{target} is honest, and I will not have it questioned. Cross {target} off and stop wasting time.',
    'Whatever you think tonight, {target} is true. I would stake my life on it, though I should rather not be asked.',
  ],
  'claim.apart.prickly': [
    '{first} and {second} were not together that hour, whatever you have been told. I do not say things I cannot stand behind.',
    'Together? {first} and {second}? Hardly. They were nowhere near each other that hour, and I will not argue it.',
    'You have been misinformed, {detective}. {first} and {second} were apart that hour. I would know.',
  ],
  'claim.culpritAttr.sex.prickly': [
    'The murderer is {sex}. That is all I will give you, so do not ask me how I know.',
  ],
  'claim.culpritAttr.trait.prickly': [
    'The one you want {trait}. I will not be questioned on how I know.',
    'Your killer {trait}. That is all I can give you, and I do not care to be asked for more.',
    'I cannot give you a name. I can tell you the murderer {trait}, and you may take it or leave it.',
  ],
  'claim.glimpse.prickly': [
    'I saw a figure near {room}. No face. But whoever it was {trait}, and that is all I intend to say.',
    'Somebody passed near {room}. I could not tell you who. The figure {trait}. Write that down and let me be.',
    'Do not ask me for a face; I did not see one. Someone went by {room}, and whoever it was {trait}.',
  ],
  'claim.heard.crash.prickly': [
    'I heard a crash from {room}. Glass, or a lock giving way. I told myself it was {weather}. Write that down, if you must.',
    'Something broke in {room}. It was not {weather}; I know the difference, and I do not need a lecture on it.',
    'There was a noise from {room}, wood or metal, splintering. I thought of going to see. Do not make more of that than there is.',
  ],
  'claim.heard.quarrel.prickly': [
    'There were raised voices in {room}. A quarrel, and a bitter one. The words I did not catch, and I will not guess at them.',
    'I passed near {room} and heard {victim} quarrelling with somebody. Bitterly. I did not stop to take notes.',
    'Shouting in {room}. {victim} and another. Who, I could not tell you, and I will not be badgered into inventing it.',
  ],
  'claim.liarsAmong.prickly': [
    'I watched {pair} tonight, and I do not enjoy saying it: {howMany} lying to you about where they were.',
    'Ask yourself about {pair}. {howMany} lying to you about that hour, and I will not apologise for noticing.',
    '{pair}. Those two. {howMany} giving you a false account of the hour. I should look closer there, if I were paid to.',
  ],
  'claim.passage.prickly': [
    'There is a passage in the wall of {scene}. It comes out in {room}. Do not make me draw you a map.',
    'Since you will ask: a passage runs behind the panelling from {scene} to {room}. I know {thisHouse}, whatever else you may think.',
    'From {scene} to {room}, through the wall. It is on no plan, and I resent being the one to tell you.',
  ],
  'claim.passing.prickly': [
    'I passed {target} in {passage}, coming away from {room}, just after it was done. Make of it what you will; I make nothing of it.',
    'Since you ask: I met {target} near {room}, walking quickly. Do not look at me as though I had arranged it.',
    'I saw {target} coming from the direction of {room}, not long after it must have happened. It may mean nothing, and I will not be drawn.',
  ],
  'claim.relationship.gossip.cordial.prickly': [
    '{subject} and {victim} got along well enough. I never saw a cross word, and I do not know what else you expect me to say.',
    'Perfectly pleasant, {subject} and {victim}. Perfectly dull. There is nothing more to tell, so do not ask.',
    'I have nothing to say about {subject} and {victim}, since there was nothing to say. Amiable, both of them. Next.',
  ],
  'claim.relationship.gossip.devoted.prickly': [
    '{subject} worshipped {victim}. Anyone {inThisHouse} could see it, and I should not need to say so.',
    'Real affection between {subject} and {victim}. I do not hand out such words lightly, so mind that you take it as meant.',
    '{subject} and {victim} were as close as any two people could be. Closer. I am not going to describe it further.',
  ],
  'claim.relationship.gossip.exposed.prickly': [
    'Something in {subject}’s past had come to {victim}’s notice, and {he} meant to make it known. That is all.',
  ],
  'claim.relationship.gossip.indebted.prickly': [
    '{subject} owed {victim} money, {detective}. A great deal, and none of it forgiven. I did not invent it.',
  ],
  'claim.relationship.gossip.strained.prickly': [
    'There was a coolness between {subject} and {victim}. Everyone noticed, so I see no reason why I should pretend otherwise.',
    '{subject} and {victim} had been very polite with one another for weeks. That kind of polite. Draw your own conclusions.',
    'Something went wrong between {subject} and {victim}. A chill, no more. I felt it at table, and I did not care for it.',
  ],
  'claim.relationship.self.cordial.prickly': [
    '{victim} and I were on perfectly good terms. I do not see what else there is to say, or why you wish me to say it.',
    'We got on, {he} and I. No quarrels, no debts, no history. I resent the implication that there must have been.',
    'Cordial. That is all. We liked one another well enough and left it there. Write it down.',
  ],
  'claim.relationship.self.devoted.prickly': [
    'I loved {him}. There. I shall not say it twice, and I will thank you not to look at me while I say it.',
    '{He} was family to me, whatever people whisper. I do not care to discuss it, but you asked.',
    'No one {inThisHouse} was closer to {him} than I. I have wept, and I do not intend to do it in front of you.',
  ],
  'claim.relationship.self.hostile.prickly': [
    'I hated {him}. There. I shall not dress it up to please you.',
  ],
  'claim.relationship.self.strained.prickly': [
    'We had our frictions, {he} and I. I will not pretend otherwise, however it suits you.',
    'There was a coolness between us of late. I do not deny it, and I do not intend to explain it.',
    'Things were strained. Civil, and only civil, for weeks. I do not see what business that is of yours.',
  ],
  'claim.role.prickly': [
    'If you must have it, I am {roleName}. I do not enjoy being asked.',
  ],
  'claim.roomEmpty.prickly': [
    'Nobody went into {room} that hour. I was where I could see the door, and I will not be told I imagined it.',
    'I sat in the hall opposite {room}, and nobody went in or out. I do not see why that should need repeating.',
    'Those boards creak at the lightest step, and I heard none outside {room}. It was empty. I have said so.',
  ],
  'claim.roomUsed.prickly': [
    'Somebody went into {room} that hour. Who, I could not tell you, and I do not care to be pressed on it.',
    'The door of {room} opened. My back was turned, so do not ask me who. I can only tell you what I heard.',
    'I heard the latch of {room}, and the boards outside. Somebody was in there. That is all I know, and all I intend to say.',
  ],
  'claim.sighting.prickly': [
    'I saw {target} in {room}. Do not look so surprised, and do not ask me if I am sure. I am.',
    '{target} was in {room}. I saw it with my own eyes, and I will not be argued out of it.',
    'Whatever else is in doubt, {target} was in {room}. I saw it. Make of that what you like.',
  ],
  'claim.suspicion.prickly': [
    'If you must have my opinion, I have had my eye on {target} all evening. I make no accusation. I merely observe.',
    '{target}. There. I cannot tell you why, and I do not propose to try, so do not ask me to.',
    'I have not liked the look of {target} tonight. That is not an accusation, so do not write it down as one.',
  ],
  'claim.together.prickly': [
    '{first} and {second} spent that hour together, and not a minute apart. I should not have to say so twice.',
    'Whatever they tell you, {detective}, {first} and {second} never left one another’s side that hour. I notice such things, whether I wish to or not.',
    'Inseparable, {first} and {second}, the whole hour. It is none of my business, and I should be obliged if you did not make it so.',
  ],
  'claim.whereabouts.alone.prickly': [
    'In {room}, by myself, the whole of that hour. It is a poor alibi, and I did not choose it to annoy you.',
  ],
  'claim.whereabouts.company.prickly': [
    'I was in {room}, and not alone. {companions} were with me the whole hour, so go and ask them and cease pestering me.',
  ],
  'confession.prickly': [
    'Oh, stop. Stop it, {detective}. I will not sit here and watch you point at somebody else. It is my name you want.',
  ],
  'evidence.bare.prickly': [
    'Nothing left to show how it was done? Then somebody took it away. That is plain enough, and I should not need to point it out.',
  ],
  'evidence.bribe.prickly': [
    'A great deal of money, with a name on it, and the name is not mine. I know nothing of it. Ask the person it names.',
  ],
  'evidence.deny.prickly': [
    'That is not mine. I do not know why you are looking at me; look somewhere else.',
    'Not mine. Put it away and look elsewhere, and do not ask me to say it a third time.',
  ],
  'evidence.doc.comment.prickly': [
    'I have never seen that paper in my life, and I do not care for it. Whoever wrote it should explain it.',
  ],
  'evidence.doc.confirm.prickly': [
    'It is genuine, and I shall not insult you by saying otherwise. Better you have it from me than from {house}.',
    'Yes. You found it. I suppose I knew somebody would, and I do not intend to dress it up for you.',
  ],
  'evidence.doc.deny.prickly': [
    'Where did you get hold of that? It says nothing of what you think it says. Listen, since you will not be told otherwise:',
    'That is not what it looks like, and you may stop looking at me as though it were. This is how it truly stood:',
  ],
  'evidence.doc.gossip.prickly': [
    'That paper only says what half {house} has been whispering. I fail to see why you are surprised, and I shall tell you why I am not.',
    'Hm. So it is written down. I am not surprised, and since you will ask why, I shall tell you.',
    'I could have told you that without the paper. Now that you have it, I shall.',
  ],
  'evidence.hand.prickly': [
    'That is {his} hand, certainly. {He} wrote to everybody, and I do not see what that proves.',
  ],
  'evidence.identify.prickly': [
    'That is not mine, and I fail to see why you bring it to me. Look for the {one} it fits.',
    'Not mine. Hold it up against the table and see whom it matches, and kindly leave me out of it.',
  ],
  'evidence.key.prickly': [
    'The key to {locked}. Yes. I wondered where it had got to. Satisfied, now that you have it?',
  ],
  'evidence.killed.prickly': [
    'Dead, and not an hour ago sitting among us. Somebody did that, and I should like to know why you are not out looking for them.',
  ],
  'evidence.lockbox.prickly': [
    'Forced? Then there is a thief {inThisHouse} as well as a killer. I trust nobody will make me the answer to both.',
  ],
  'evidence.lockbox.intact.prickly': [
    'Locked, and not a mark on it. Nobody robbed that room, so there is no more to say about it.',
    'Untouched. Anybody who claims to have been at that box tonight is not telling you the truth. I should look at them.',
    'Nobody has been at that. It is exactly as it was. I do not see why you had to show it to me.',
  ],
  'evidence.note.prickly': [
    'Poor {man}. I had no idea {he} was so unhappy, and I resent being made to read it.',
  ],
  'evidence.passage.prickly': [
    'A passage. Well, I never knew of it, and I do not see why you look at me. It alters things, for whoever was in that room.',
  ],
  'evidence.trace.own.prickly': [
    'Mine, yes. I left it where I sat, as I told you. I do not see why you needed to ask.',
    'That is mine. It says what I said, and I trust that will be the end of that.',
  ],
  'evidence.weapon.comment.prickly': [
    'That is beyond me, {detective}, as you can see for yourself, and I resent being asked.',
    'Beyond my capacity, evidently. Somebody else’s business, then, and not mine.',
  ],
  'evidence.weapon.deny.prickly': [
    'I had the means, yes. I am also not the one who used them, and I will not be told otherwise.',
    'Within my reach, yes. So what? Access is not action, {detective}, and you know it as well as I do.',
  ],
  'knowledge.hedged.prickly': [
    'I shall tell you what I have, but what it means I cannot say, and I shall not be blamed for your reading of it.',
    'Facts, I have. Conclusions are your affair. It could mean one thing or another, so do not say I did not warn you.',
  ],
  'knowledge.share.prickly': [
    'Fine. Here is what I know, and do not interrupt.',
  ],
  'knowledge.silent.prickly': [
    'You may have who I am, and welcome. The rest is mine, and I decline to discuss it.',
  ],
  'knowledge.vague.prickly': [
    'You are fishing, {detective}, and I do not care to be the fish. Come back with something in your hand.',
  ],
  'lastWords.prickly': [
    'Well? I did not hear you come in, and I do not care for being crept up on. What is it?',
  ],
  'opens.prickly': [
    'Well. You have that, so you may as well have the rest. I shall not enjoy telling it.',
    'That is a reason, I suppose. Here is what I have been keeping back, and do not ask me to repeat it.',
    'Oh, very well. That will do. You have your reason, and I shall have my say.',
  ],
  'reaction.accuse.prickly': [
    'You need not look far. {target}. I have said it, and I do not take it back.',
    'Look at {target}. I have been looking all evening, and I dislike what I see. That is all I will say.',
  ],
  'reaction.heard.crash.prickly': [
    'Before you start on your questions, {detective}, there is something you ought to hear. Do not make me regret telling it.',
    'You will want something real tonight, so I shall give it to you. It has been on my mind, and I resent that.',
  ],
  'reaction.overheard.prickly': [
    'I have something to tell you. I did not go looking for it, so spare me any remark about that.',
    'There is something I heard, and I ought to have said so before. Do not ask me why I did not; it is not a good question.',
  ],
  'reaction.referral.prickly': [
    'I can name nobody. But {victim} shut {himself} away in {room} all afternoon, writing, and snapped at anybody who knocked. Look there, if you must look somewhere.',
    '{victim} spent the afternoon writing in {room}, and wanted no company. I do not know what, and I do not propose to guess. Go and look.',
  ],
  'reaction.weaponhint.prickly': [
    'Something has bothered me since we found {him}, {detective}. {room} is not as it should be. Do not make me say more.',
    'If you want the how of it, start in {room}. I noticed it in passing and thought little of it. Do not hold that against me.',
  ],
  'role.claim.prickly': [
    'Oh, very well. You may as well know it, since you will not leave off.',
  ],
  'role.vague.prickly': [
    'What I was in all this is for me to know. If you want it, give me a reason; asking will not do.',
  ],
  'seen.key.held.prickly': [
    'The key to {locked}? I saw {person} pick one up. I thought nothing of it at the time, and I resent being asked to think of it now.',
  ],
  'seen.nothing.prickly': [
    'I saw nothing worth your while. I was minding my own affairs, which is more than most can say.',
    'Nothing. I do not know what you expected, and I do not care to be asked twice.',
    'Not a thing. If I had, I should have said so already, and spared us both this.',
  ],
  'seen.share.prickly': [
    'I noticed one thing. I was not looking, mind. Here it is, and then I will be left alone.',
    'Something, yes, since you press me. Do not expect me to enjoy telling it.',
    'There was one thing, now that you ask. I did not go looking for it, so do not suggest that I did.',
  ],
  'suspect.hedge.prickly': [
    '{target} seems likeliest, though I may be wrong, and I will not be held to it.',
    'Pressed for a name, {target}. But I could argue the opposite, so do not write it down as gospel.',
  ],
  'suspect.none.prickly': [
    'I cannot put a name to it, and I will not be badgered into one. If you want somebody worth asking, try {person}.',
    'No name. I would sooner not guess. {person} has been sharper than I all evening, so ask there.',
  ],
  'suspect.point.prickly': [
    '{target}. You asked, so there it is. I have no proof, only that everything points one way.',
    'If you must have it from me: {target}. Do not waste your candles on the rest of us.',
    'It is {target}. I do not intend to explain, and I will not be argued out of it.',
  ],
  'suspect.vouch.prickly': [
    'I have no name, and I shall not invent one. I do not believe it was {target}, and that is all you will get from me.',
  ],

}

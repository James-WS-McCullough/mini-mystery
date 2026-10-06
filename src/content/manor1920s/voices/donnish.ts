import type { DialogueBanks } from '../../schema'

// DONNISH: the dons. Precise, qualifying, dry, a Latin tag now and then.
// The RULES OF THE BANKS in ../dialogue.ts apply: voice only, shared by the
// honest and the lying alike, and no line says more than its neutral counterpart.

export const donnish: DialogueBanks = {
  'about.nothing.donnish': [
    'Strictly speaking, I cannot be said to know them at all. We nodded across a room once, and nodding is not knowledge.',
    'Of their character I could offer you only conjecture, and conjecture is a poor relation of knowledge. I know them hardly at all.',
    'If you want an opinion, I have none worth the name. The cat, I suspect, is better informed than I.',
  ],
  'about.person.donnish': [
    'Since you ask, I shall say what I can, though I should distinguish at once between what I know and what I merely suppose.',
    'What I can offer is small, but it is, I trust, accurate, which is more than can be said for most testimony.',
    'Very well. I can say a little on that head, and I shall try not to say more than I know.',
  ],
  'about.referral.donnish': [
    'I am not the proper authority, {sir}. {person} would be far better placed to tell you, and I should defer to them.',
    'On that point my knowledge is secondhand at best. Ask {person}; I should not like to mislead you through mere conjecture.',
    '{person} could answer that with a good deal more authority than I can. I should consult them, in your position.',
  ],
  'about.victim.donnish': [
    'You wish to know how matters stood between {him} and me. A reasonable inquiry, and I shall answer it as exactly as honesty permits.',
    'I wondered when we should arrive at that question. Very well; I shall be as accurate as I am able.',
    'How did I stand with {him}? It is a fair question, and I do not propose to evade it.',
  ],
  'alibi.alone.donnish': [
    'As to my whereabouts, the answer is simple enough, though I concede that simplicity is not the same thing as proof.',
    'You wish the hour accounted for. I can do so, if you will forgive an account that rests upon my word alone.',
    'Where was I? A plain answer, and, I fear, a rather unhelpful one.',
  ],
  'alibi.company.donnish': [
    'Happily, I am not obliged to rest upon my own testimony alone; there are others who can speak to it.',
    'That question, at least, admits of a ready answer, and one that I can corroborate.',
    'Here, I think, I am on firm ground, which is a comfortable and not wholly familiar sensation.',
  ],
  'alibi.forgot.donnish': [
    'I am bound to say that I do not know. The hour has quite left me, and I have searched my memory with some diligence.',
    'That is precisely the difficulty. I cannot tell you. I recall the dressing bell, and then my coming down, and nothing between.',
    'I wish I could oblige you. There is, strictly speaking, a lacuna where that hour ought to be.',
  ],
  'claim.alignment.evil.donnish': [
    'I should look very closely at {target}. There is, I am persuaded, something corrupt there, and I do not use the word loosely.',
    'I shall say this once and quietly: {target} is not, in the strict sense, what {target} appears to be.',
    'Something is wrong with {target}. I have suspected it for some time, and this evening has removed the last of my doubts.',
  ],
  'claim.alignment.good.donnish': [
    'Whatever conclusions you may draw tonight, {target} is sound. I would stake my reputation upon it, and I am not given to staking.',
    'Pace the cynics, I should strike {target} from your list. I know a good deal about {thisHouse}, and I know this with certainty.',
    'You may leave {target} out of your reckoning. I say it with care; it is a thing I know and do not merely believe.',
  ],
  'claim.apart.donnish': [
    'I understand it has been said that {first} and {second} remained together. I must correct that: they did not, and I am in a position to know.',
    'Whatever you have been told, {detective}, {first} and {second} were not together that hour, and I say so with some confidence.',
    'I am not persuaded by the suggestion that {first} and {second} spent that hour together. They were apart, and I can say so firmly.',
  ],
  'claim.culpritAttr.sex.donnish': [
    'I cannot supply a name. I can supply a classification: the murderer is {sex}.',
    'Pressed for a description, I should say only this: you are looking for {sex}. How I know, I decline to say.',
    'I can say no more than this, but of this I am confident: it was {sex} who did it.',
  ],
  'claim.culpritAttr.trait.donnish': [
    'I cannot give you a name, but I can give you a qualification: the person you want {trait}.',
    'I shall not venture a name. I will say, however, with some confidence, that your murderer {trait}.',
    'You will ask how I know, and I shall decline to answer. The fact remains that the murderer {trait}.',
  ],
  'claim.glimpse.donnish': [
    'I glimpsed a figure near {room}. I cannot identify the face, but I can say with reasonable confidence that whoever it was {trait}.',
    'Of the face I can tell you nothing, strictly speaking. Of the figure I saw by {room} I can say this: whoever it was {trait}.',
    'Somebody passed near {room}. Identification is beyond me, but one observation I can offer: the figure {trait}.',
  ],
  'claim.heard.crash.donnish': [
    'During that hour I heard a crash from {room}, of glass or a lock giving way. I attributed it to {weather}, perhaps too readily.',
    'Something broke in {room}. The sound was sharp and, I should say, deliberate, and not at all what {weather} produces.',
    'I heard a noise from {room} while {house} dressed, as of wood splintering, or metal. I contemplated investigating, and did not.',
  ],
  'claim.heard.quarrel.donnish': [
    'That afternoon there were raised voices in {room}. A quarrel, I should say, though the words themselves escaped me.',
    'Earlier in the day, passing near {room}, I heard {victim} in bitter dispute with someone whom I could not identify.',
    'In the afternoon there was shouting from {room}, {victim} and one other. Who the other was, I am unable to say.',
  ],
  'claim.liarsAmong.donnish': [
    'I kept {pair} under observation all evening, and I am persuaded of this: {howMany} lying to you about where they were.',
    'You will have asked {pair} to account for that hour. I should treat the answers with caution: {howMany} lying to you about it.',
    'Consider {pair}, if you will. On the question of that hour, {howMany} giving you a false account, and I say so advisedly.',
  ],
  'claim.passage.donnish': [
    'There is a passage in the wall of {scene}, which, so far as I have established, emerges in {room}.',
    'I have some acquaintance with {thisHouse}. From {scene} a passage runs behind the panelling to {room}, though no plan records it.',
    'It appears on no plan, but it exists: a way through the wall from {scene} to {room}.',
  ],
  'claim.passing.donnish': [
    'I was first along {passage} once it was done, and I passed {target} coming away from {room}. I draw no inference; I merely report.',
    'One observation: just after, I met {target} in the passage outside {room}, walking rapidly. I attached no significance to it then.',
    'I noticed {target} coming from the direction of {room} not five minutes after it must have been done. It may signify nothing at all.',
  ],
  'claim.relationship.gossip.beneficiary.donnish': [
    '{victim} executed a new will this very week, and {subject} is, as I understand it, a substantial beneficiary under it.',
    'One should ask who stands to gain. {victim} altered {his} will, signed it, and {subject} is the party it favours.',
    'The new will is signed and witnessed, and it is {subject} who comes into the money. I leave the inference to you.',
  ],
  'claim.relationship.gossip.cordial.donnish': [
    'So far as I ever observed, {subject} and {victim} got on well enough. I record no discord, and I look for it.',
    'There is nothing to report of {subject} and {victim}, who were perfectly pleasant and, I fear, perfectly dull.',
    '{subject} and {victim}? Amiable, in my observation. I never witnessed a cross word between them.',
  ],
  'claim.relationship.gossip.devoted.donnish': [
    '{subject} worshipped {victim}, and I think anyone {inThisHouse} would confirm the observation without hesitation.',
    'There was genuine affection between {subject} and {victim}; the real article, and not easily mistaken.',
    '{subject} and {victim} were as close as any two people {inThisHouse}, and I am inclined to say closer.',
  ],
  'claim.relationship.gossip.disinherited.donnish': [
    '{victim} intended to sign a new will, and {subject} was not provided for in it. It lacked only {his} signature.',
    '{He} meant to cut {subject} out of the family. The new will was drawn up, and {he} was to sign it on Monday.',
    'I had it from {victim} {himself}: a new will, and nothing in it for {subject}. It was, as yet, unsigned.',
  ],
  'claim.relationship.gossip.dismissed.donnish': [
    '{victim} was turning {subject} out. The matter was settled, and only the day remained to be fixed.',
    '{subject} had been told to go, and {victim} would hear no argument, though I did attempt one.',
    '{He} had given {subject} notice, and not graciously. By teatime it was known to the whole of {household}.',
  ],
  'claim.relationship.gossip.exposed.donnish': [
    '{victim} knew something to the discredit of {subject}, and had resolved to make it known. {He} as good as said so at luncheon.',
    '{He} had caused {subject} to be looked into, and whatever {he} found, {he} intended to use.',
    'Something in {subject}’s past had come into {victim}’s hands, and {he} was not the sort to keep such a thing to {himself}.',
  ],
  'claim.relationship.gossip.forbidden.donnish': [
    '{subject} wished to marry {his} {child}. {victim} forbade it, and in terms that admitted of no appeal.',
    'There was an attachment between {subject} and {his} {child}, which {victim} declined to countenance on any terms whatever.',
    '{subject} petitioned {victim} for {his} {child}’s hand and was refused, more than once, I understand.',
  ],
  'claim.relationship.gossip.hostile.donnish': [
    '{subject} and {victim} were at daggers drawn. Their quarrels carried through the walls of {thisHouse}.',
    'I should say that {subject} and {victim} could not share a room without a perceptible fall in the temperature.',
    'The hatred between {subject} and {victim} was real. I use the word with care, and not as a figure of speech.',
  ],
  'claim.relationship.gossip.indebted.donnish': [
    '{subject} owed {victim} money; a considerable sum, and the kind of debt that corrodes a friendship.',
    'It was a matter of money between {subject} and {victim}, a great deal of it, and none of it forgiven.',
    '{victim} held paper on {subject}, {detective}. The debts were old and, by my reckoning, increasing.',
  ],
  'claim.relationship.gossip.jilted.donnish': [
    '{victim} broke an engagement with {subject}, years ago. Some wounds, I observe, keep remarkably well.',
    'There was once an understanding between {subject} and {victim}, which {he} brought to an end, and not gently.',
    '{subject} was thrown over by {victim} long ago, and has not, in my hearing, forgiven it.',
  ],
  'claim.relationship.gossip.rival.donnish': [
    '{subject} was {victim}’s partner in business, and was in the process of being squeezed out of it.',
    '{subject} and {victim} were in business together. {He} proposed to end the partnership, and to retain what it had earned.',
    '{victim} was ruining {subject}, and doing so strictly by the book. A firm lay between them, and soon would not.',
  ],
  'claim.relationship.gossip.strained.donnish': [
    'There had been a coolness between {subject} and {victim} of late. Everyone affected not to notice, and everyone noticed.',
    '{subject} and {victim} had been scrupulously polite to one another for weeks, and it was not the agreeable kind of politeness.',
    'Something had gone amiss between {subject} and {victim}. Not a scandal, precisely: a chill, perceptible at table.',
  ],
  'claim.relationship.self.beneficiary.donnish': [
    '{He} signed a new will this week, and I am the beneficiary. I did not solicit it, and I am aware of how it appears.',
    'I inherit. It is said, and I should rather say it myself than have it said for me. The will was signed on Tuesday.',
    'I stand to gain a good deal by {his} death, more than I should have a week since, though I played no part in {his} decision.',
  ],
  'claim.relationship.self.cordial.donnish': [
    '{victim} and I were on perfectly good terms; I can find no qualification to add to that.',
    'We got on well, {he} and I. No quarrels, no debts, no history; we were merely friends, and I use the word accurately.',
    'Cordial is, I think, the exact word. We liked one another well enough, and there the matter rested.',
  ],
  'claim.relationship.self.devoted.donnish': [
    '{He} was as good as family to me, whatever may be insinuated, and I loved {him} dearly.',
    'How did matters stand between us? {He} was the best friend I had in the world, and you now have the measure of my loss.',
    'No one {inThisHouse} was closer to {him} than I. I am not ashamed to say that I have wept tonight.',
  ],
  'claim.relationship.self.disinherited.donnish': [
    '{He} meant to cut me out. The new will was drawn and wanted only {his} signature, and I knew it. I shall not pretend otherwise.',
    'You will hear that {he} intended to sign a new will and that I was not named in it. Both statements are accurate.',
    'I was to be left nothing. {He} told me so {himself}, and named the day. It was to have been Monday.',
  ],
  'claim.relationship.self.dismissed.donnish': [
    '{He} intended to turn me out. I had been told as much, and told to be gone by the end of the month.',
    'I was to leave. {He} had made up {his} mind, and {he} was not a {man} who revised such decisions.',
    '{He} was putting me out of {thisHouse}, without so much as a word of reference to take with me. I had nowhere to go.',
  ],
  'claim.relationship.self.exposed.donnish': [
    '{He} knew something about me. I shall not say what. {He} meant to make it public, and {he} told me when.',
    'There is a matter in my past which {he} had discovered and proposed to disclose. I am not proud of it, nor of how this sounds.',
    '{He} had me watched and held a report, which {he} intended to use. I was aware of it.',
  ],
  'claim.relationship.self.forbidden.donnish': [
    'I asked for {his} {child}’s hand, and {he} refused me, adding that it should never be while {he} lived.',
    'I wished to marry {his} {child}. {He} forbade it, and forbade us even to correspond.',
    'An attachment existed between {his} {child} and myself. {He} would not entertain it, and said so in terms I shall not repeat.',
  ],
  'claim.relationship.self.hostile.donnish': [
    'Since you ask: we despised one another, and I shall not affect a grief that I do not feel.',
    'I hated {him}. I say it plainly, since everyone else will merely hint at it; and hatred, I would remind you, is not a confession.',
    'We loathed one another, and the whole of {household} knew it. You would have had it from someone before long.',
  ],
  'claim.relationship.self.indebted.donnish': [
    'I owed {him} money, a very considerable sum. You would have discovered it in any case, so I prefer to state it.',
    'The fact is that I stood in {his} debt to an amount I dislike naming. You will call it motive; I call it misery.',
    '{He} held my notes of hand, and took care to remind me of it. I owed {him} more than I could pay.',
  ],
  'claim.relationship.self.jilted.donnish': [
    '{He} threw me over, once. One does not forget it; one merely learns to dine with it.',
    'There was an understanding between us years ago, which {he} ended, and ended badly. I have carried the fact with civility ever since.',
    '{He} and I were to have been married. {He} thought better of it; I have never quite thought better of {him}.',
  ],
  'claim.relationship.self.rival.donnish': [
    'We were partners, {he} and I, and {he} was pushing me out of a firm I helped to build. I would rather you heard that from me.',
    '{He} and I were in business together. Lately {he} had been arranging matters so that nothing remained of the partnership but the name.',
    '{He} meant to ruin me. It was all perfectly legal, and it would have left me with nothing of what we had made.',
  ],
  'claim.relationship.self.strained.donnish': [
    'We had our frictions, {he} and I, and I shall not insult you by denying it.',
    'There had been a coolness between us of late. Nothing that leads to murder, but I will not deny the coolness.',
    'Matters were strained. I shall be candid on that point: we had been civil, and only civil, for some weeks.',
  ],
  'claim.role.donnish': [
    'As to my part in these proceedings, I am {roleName}. I see no profit in being coy about it.',
    'You may as well have it exactly. I am {roleName}.',
    'If you will record it in your notebook: {roleName}. That is what I am.',
  ],
  'claim.roomEmpty.donnish': [
    'My room faces {room}, and no one entered it throughout the hour. I should have heard the door.',
    'I sat in the hall opposite {room} for the whole hour. No one went in, and no one came out.',
    'The floorboards there creak at the slightest weight, and I heard nothing outside {room} all hour. I conclude it was empty.',
  ],
  'claim.roomUsed.donnish': [
    'My room looks directly onto the door of {room}. Someone went in that hour, though I cannot say who.',
    'I sat in the hall opposite {room} all hour, and the door opened. My back was turned, regrettably, so I cannot identify the person.',
    'I heard the floorboards outside {room}, and then the latch. I conclude that someone was in there that hour.',
  ],
  'claim.sighting.donnish': [
    'I saw {target} in {room} during that hour, and I say so with complete certainty.',
    'One thing I can attest: {target} was in {room}. I observed it with my own eyes, which is as good as evidence gets.',
    '{target} was in {room} at that time. Whatever else may be open to doubt, that is not.',
  ],
  'claim.suspicion.donnish': [
    'If you want my candid view, I have kept my eye on {target} all evening. I make no claim to proof.',
    'I make no accusation. I observe merely that {target} has not seemed quite right tonight.',
    'Since you ask me plainly: {target}. I cannot give reasons; I can only report an impression, which is not the same thing as evidence.',
  ],
  'claim.together.donnish': [
    'There has been talk about {first} and {second} for weeks, and I can assure you that they spent that hour in each other’s company, every minute of it.',
    'I make it my business to know such things. {first} and {second} were together throughout the hour, and not a minute apart.',
    'Whatever they may say, {first} and {second} never left one another’s side that hour. I should put it no more strongly, and no less.',
  ],
  'claim.whereabouts.alone.donnish': [
    'For the hour in question I was in {room}, and quite alone. I appreciate that this is a poor foundation for an alibi.',
    'I was in {room}, by myself, the whole of it. You will find me, I fear, uncorroborated, and I regret the inconvenience.',
    'My whereabouts: {room}, from {windowFrom} onward, in no one’s company but my own. I concede it is not much of an alibi.',
  ],
  'claim.whereabouts.company.donnish': [
    'I was in {room} throughout, and in company. {companions} can attest to every minute of it.',
    'From {windowFrom} I was in {room} with {companions}. If you ask them, you will, I think, hear the same account.',
    'In {room}, in the company of {companions}, and we did not leave it. I should be happy for you to verify the point.',
  ],
  'confession.donnish': [
    'Stop. Before you name anyone, {detective}, I must interrupt: it is my name you require, and no other.',
    'I cannot in conscience sit here while you point at somebody else. You need look no further than myself.',
    'No. I have borne this all evening, and I do not propose to bear it a moment longer. The fault is mine.',
  ],
  'evidence.bare.donnish': [
    'A murder with no instrument: ex hypothesi, somebody removed it. It did not depart of its own accord.',
    'If nothing remains to show how it was done, then something was taken, and taken somewhere. Someone has tidied up after the murderer.',
    'Nothing left to show how it was done? Then someone took it away, which is a significant fact in itself.',
  ],
  'evidence.bribe.donnish': [
    'That is a considerable sum to find lying about, and it bears a name, which, I may observe, is not mine.',
    'Someone has evidently been paid for something. The name on it will tell you whose, as readily as it tells me.',
    'I know nothing of it, strictly speaking. I should put the question to the person whose name is on it.',
  ],
  'evidence.deny.donnish': [
    'It is not mine, and I say so without any wish to be difficult; it is simply the case.',
    'I must disclaim that. It is not mine, whatever it may resemble, and I would ask you to look elsewhere.',
    'Whether it is mine is an easy question: it is not. I do not think your inquiry is advanced by supposing otherwise.',
  ],
  'evidence.doc.comment.donnish': [
    'I know nothing of that paper, and its author, I should think, could explain it better than I.',
    'Somebody’s private grief, set down in ink. It is not for me to explain it, nor, I think, to read it.',
    'This is the first I have seen of it, and I confess that it makes uneasy reading.',
  ],
  'evidence.doc.confirm.donnish': [
    'So you have found it. I suppose I always knew that someone would, sooner or later.',
    'Yes. I shall not dress it up; you had better hear it from me than from {house}.',
    'That is genuine, and I should not insult your intelligence by pretending otherwise.',
  ],
  'evidence.doc.deny.donnish': [
    'Where did you… no. You have hold of something twisted out of all meaning. Let me explain how matters truly stood.',
    'A paper may be made to say almost anything. Allow me to state how things actually were.',
    'That is not what it appears to be, and I must ask you to hear the true state of affairs before you judge.',
  ],
  'evidence.doc.gossip.donnish': [
    'That paper says aloud what half {house} has been whispering for weeks, which I find unsurprising.',
    'I am not surprised, and I propose to explain precisely why I am not surprised.',
    'So it is committed to paper at last. I could have told you as much, and I shall now do so.',
  ],
  'evidence.flavor.donnish': [
    'That is, I think, merely somebody’s rubbish. Not a clue, unless untidiness has lately become an offence.',
    'You will find one of those in every room of {thisHouse}. It signifies nothing, strictly speaking.',
    'Hm? No, that is simply an object. It was there before any of this began, and it proves nothing.',
  ],
  'evidence.hand.donnish': [
    'That is certainly {his} hand. {He} wrote a great many letters.',
    'Yes, I know that writing well. {He} wrote to everyone and kept copies of nothing, which was characteristic.',
    'A letter of {his}, on business, by the appearance of it. It was always business.',
  ],
  'evidence.identify.donnish': [
    'That did not come from me, but I can consider whence it might have come, and so, I think, can you.',
    'It is not mine. Compare it with the company at the table and see whom it fits.',
    'If I were you, I should look for the {one} that matches. It will not be I.',
  ],
  'evidence.key.donnish': [
    'That is the key to {locked}. I had wondered where it had got to.',
    'The key to {locked}. Well, you may now see for yourself what is inside.',
    'Yes, that opens {locked}. Who held it last, I am quite unable to say.',
  ],
  'evidence.killed.donnish': [
    'Dead, and an hour ago sitting among us. Whoever accomplished the first has, it seems, accomplished this.',
    'Then somebody feared what the deceased knew. I wish to heaven that it had been told to you sooner.',
    'Two, now. And the rest of us are shut in with whoever is responsible, which is a thought I do not find agreeable.',
  ],
  'evidence.lockbox.donnish': [
    'The box was forced? Then we have a thief as well as a murderer, which is an unwelcome multiplication of villains.',
    'A thief, then, as well as a killer. I confess that two such persons in one house seems more than a reasonable evening requires.',
    'Forced, you say? Then there is a theft to account for alongside the murder, and I do not envy you the task.',
  ],
  'evidence.lockbox.intact.donnish': [
    'Locked, and without a mark upon it. Whatever occurred in that room, it was not a robbery.',
    'Untouched. Should anyone tell you that they were at that box tonight, I should treat the statement with considerable scepticism.',
    'No one has been at that box. It is exactly as it was this morning.',
  ],
  'evidence.note.donnish': [
    'Poor soul. I had no notion that {he} was so unhappy, and I find I must revise a good deal.',
    'I would rather not look at it. Put it away, if you will be so good.',
    'Forgive {him}? Forgive {him} what? I confess I do not understand it in the least.',
  ],
  'evidence.passage.donnish': [
    'A passage! Then whoever was in that room might have come and gone as they pleased.',
    'So the old stories had some foundation. I should inquire who spent the hour at the far end of it.',
    'I was not aware of it. But it alters matters considerably, does it not, for whoever was in that room.',
  ],
  'evidence.trace.own.donnish': [
    'That is mine, I am afraid. I told you where I was, and there is the corroboration.',
    'Yes, mine. I left it where I sat, as I believe I mentioned.',
    'Mine, and for once I am glad of it, since it confirms my account precisely.',
  ],
  'evidence.weapon.comment.donnish': [
    'I could not have done that, {detective}. A glance at me will, I think, settle the question.',
    'That lies quite beyond my capacity, which suggests that it was somebody else’s.',
    'A grim object, and beyond me, as you may observe for yourself.',
  ],
  'evidence.weapon.deny.donnish': [
    'I had the means, and I am not fool enough to deny it. I did not, however, use them.',
    'Yes, that was within my reach. Reach is not deed, {detective}, and I should distinguish the two carefully.',
    'I could have laid hands on that, certainly; so could half this table. Access, strictly speaking, is not action.',
  ],
  'gathered.donnish': [
    'Well then. The question before us is a simple one: who?',
    'I confess I cannot bear much more of this. Pray name the person, whoever it is, and let us be done.',
    'You have traversed {thisHouse} from end to end all night. I hope, for all our sakes, that you have arrived at something.',
  ],
  'knowledge.hedged.donnish': [
    'I shall tell you what I know, though I must warn you that it admits of more than one interpretation.',
    'The facts I can supply; the conclusions I leave to you, since they are, I think, underdetermined.',
    'I offer this exactly as I found it. What it signifies, I am honestly not persuaded that I know.',
  ],
  'knowledge.share.donnish': [
    'I shall deal with you squarely, and say what I have to say.',
    'If you will allow me, I have something to offer, and I shall try to be brief about it.',
    'Here is what I have. It is not a great deal, but it is accurately reported.',
  ],
  'knowledge.silent.donnish': [
    'I can tell you what I am, and there I must stop. Of the remainder I have nothing to say.',
    'My name for it you may have, and welcome. What accompanies it I shall keep sub rosa.',
    'Who I am I can state; anything beyond that I decline to state, and I should prefer that you did not press me.',
  ],
  'knowledge.vague.donnish': [
    'Know? What should I know? I keep to my own affairs, {detective}, and shall continue to, unless you bring something that concerns me.',
    'You are fishing, {detective}. Return with something in your hand, and I may consider rising to it.',
    'Were I to know anything worth your attention, I should require a reason to say it. Asking, strictly speaking, is not a reason.',
  ],
  'lastWords.donnish': [
    'Oh, I did not hear you come in. Is something the matter?',
    'Yes? I had supposed that everyone had gone up…',
    'You? I confess I am surprised to find you down here at this hour.',
  ],
  'opens.donnish': [
    'Well. Since you have that, you may as well have the remainder.',
    'That alters matters, and I shall oblige you. Here is what I have been withholding.',
    'I said that I required a reason. That will serve as one.',
  ],
  'reaction.accuse.donnish': [
    'You need not look far, in my opinion. {target} has been wrong all evening, in the way a picture hangs wrong.',
    'Reserve your ink for one name: {target}. There; someone had to say it.',
    'I shall dispense with preliminaries. Look at {target}, and look attentively.',
  ],
  'reaction.heard.crash.donnish': [
    'You will want more than handshakes and alibis tonight, {detective}, so allow me to offer you something of substance.',
    'Before you begin your questions, there is a matter of which you ought to be apprised.',
    'I have been turning something over all evening, and I have concluded that you should have it.',
  ],
  'reaction.overheard.donnish': [
    'It is perhaps not my place, {sir}, but there is something I ought to tell you.',
    'I have a matter to mention, and I think I had better mention it now.',
    'If you will forgive the interruption, there is something I should say, and I would rather say it at once.',
  ],
  'reaction.plain.donnish': [
    'A black night for {thisHouse}. Ask what you must.',
    'I suppose you will wish to question all of us. Pray begin.',
    'I have been awaiting your attention. Proceed, by all means.',
  ],
  'reaction.referral.donnish': [
    'I can give you no name, I regret to say, but {victim} shut {himself} away in {room} all afternoon, writing. I should look there.',
    'One curious circumstance, since you ask: {victim} spent the whole afternoon locked in {room}, writing. Whatever {he} wrote is presumably there still.',
    'I cannot say who. I can say that {victim} was writing something in {room} all afternoon, and was sharp with anyone who knocked.',
  ],
  'reaction.weaponhint.donnish': [
    'Something has troubled me since we found {him}: {room} is not as it should be. Something is missing, or something present has no business there.',
    'If I were investigating the manner of it, {detective}, I should begin with {room}. Call it an instinct; {house} is very slightly wrong there.',
    'A small matter, and possibly nothing: {room} has been disturbed. I noticed it in passing, and thought little of it then. I think more of it now.',
  ],
  'role.claim.donnish': [
    'Very well. You may as well know it.',
    'Since it will emerge in any case, I may as well state it.',
    'I shall not fence with you; the matter is quickly told.',
  ],
  'role.vague.donnish': [
    'What was I, in all this? A {one} with dreadful luck. If you want more, you must bring me a reason.',
    'We are to trade in secrets, then? Not on nothing. Show me that you know something, and we shall see.',
    'My part in the evening I shall keep to myself, unless you have something that says I must not.',
  ],
  'seen.key.donnish': [
    'You are looking for the key to {locked}? I believe I saw it on a table in {room}.',
    'The key to {locked} was lying in {room}, so far as I recall, when last I saw it.',
    'If it is the key to {locked} that you want, there was a key on a ring in {room}. I attached no importance to it then.',
  ],
  'seen.key.held.donnish': [
    'The key to {locked}? I observed {person} take up a key this evening. I thought nothing of it at the time.',
    'You want the key to {locked}. I should ask {person}, in whose hand I saw a key not long ago.',
    'If it is the key to {locked} that you require, I believe {person} has it. I saw it picked up.',
  ],
  'seen.nothing.donnish': [
    'I regret that I have nothing worth your attention to report, having observed nothing out of the ordinary.',
    'Nothing, I am afraid. I was minding my own affairs, and have no observations to offer.',
    'I wish I could assist you here, but I noticed nothing. In the strict sense, I have no evidence to give.',
  ],
  'seen.share.donnish': [
    'Now that you ask, I did observe one thing.',
    'Something, yes, for whatever it may be worth, and I make no great claim for it.',
    'I was not looking for anything in particular, but I did see this.',
  ],
  'suspect.hedge.donnish': [
    'If I were obliged to name someone, I might say {target}, though I could argue the contrary with equal conviction.',
    '{target} appears the likeliest, I think; but I should not wish to be held to it, as I may well be mistaken.',
    'Prima facie, {target}. I say prima facie, since the matter is open to more than one reading.',
  ],
  'suspect.none.donnish': [
    'I have no name to offer. {person}, however, has been sharper than I all evening, and I should begin there.',
    'I would sooner not guess, and I suspect that {person} need not guess at all.',
    'I could not in conscience put a name to it. If you want someone worth questioning, I suggest {person}.',
  ],
  'suspect.point.donnish': [
    'You asked, so I shall say it: {target}. Observe the eyes when you ask about the hour.',
    '{target}. I have no proof you could hang a hat on, only the circumstance that everything about this evening points one way.',
    'In my view you are wasting candles on the rest of us, while {target} sits there so very quietly.',
  ],
  'suspect.vouch.donnish': [
    'I have no name for you. I will say only this: whoever it was, I cannot believe it to have been {target}.',
    'I cannot tell you who. I can tell you who it was not, namely {target}; call it an impression, since it is no more.',
    'I would name nobody. But if it assists you, I find I cannot bring myself to believe it of {target}.',
  ],
}

import type { DialogueBanks } from '../../schema'

// OFFICIAL — the police and the clerks: statement-ese, procedure, the record.
// The RULES OF THE BANKS in ../dialogue.ts apply: voice only, shared by the
// honest and the lying alike, and no line says more than its neutral counterpart.

export const official: DialogueBanks = {
  // =====================================================================
  // ABOUT — questions put to a guest about someone
  // =====================================================================
  'about.nothing.official': [
    'I am not in a position to describe them. My acquaintance with them is, in effect, nil.',
    'For the record, I know nothing of them. We exchanged a nod across the room, and that was all.',
    'I have no information to give you about them, {sir}. Our acquaintance does not extend that far.',
  ],
  'about.person.official': [
    'Since you ask about them, I can offer what follows. It is little, but I will stand by it.',
    'I can speak to that briefly, for the record. What I have to say is small, but it is accurate.',
    'There is a little I can say on that point, {sir}. I shall keep to what I know.',
  ],
  'about.referral.official': [
    'That is outside my knowledge, {sir}. I would direct you to {person}, who is better placed to assist.',
    'I am not the proper person to ask. {person} could give you a fuller account than I can.',
    'My information on that point is limited. You would do better to put the question to {person}.',
  ],
  'about.victim.official': [
    'You wish to know how matters stood between myself and {him}. I will give you an honest account.',
    'I anticipated that question, {sir}. For the record, I shall answer it as truthfully as I am able.',
    'My relations with {him}, {sir}? I will set them out plainly.',
  ],

  // =====================================================================
  // ALIBI — where the guest was
  // =====================================================================
  'alibi.alone.official': [
    'My whereabouts, {sir}? I can give you a plain account of them.',
    'You will wish to have the hour accounted for. I will set it out as best I can.',
    'I can state where I was. Whether anyone can confirm it is another matter.',
  ],
  'alibi.company.official': [
    'I am fortunate, in this respect, in that I need not rest on my own word alone.',
    'That is easily dealt with, {sir}. There are persons who can speak to it.',
    'On that point I am on firm ground, and I am content to have it examined.',
  ],
  'alibi.forgot.official': [
    'I am unable to say. I have made every effort to recall it, and that hour has simply gone from me.',
    'I regret that I cannot give you an answer. There is a gap in my recollection where that hour ought to be.',
    'I cannot assist you, {sir}. My recollection ends at the dressing bell, and resumes when I came down.',
  ],

  // =====================================================================
  // CLAIMS ABOUT OTHERS
  // =====================================================================
  'claim.alignment.evil.official': [
    'I wish it noted that {target} is not what {target} appears to be. I have thought so for some time.',
    'I have a concern regarding {target}, {sir}. I would not raise it lightly, and tonight I am certain of it.',
    'In my judgement there is something wrong with {target}. I say it once, and for the record.',
  ],
  'claim.alignment.good.official': [
    'For the record, {target} is to be trusted. I would stake my life upon it, {sir}.',
    'You may strike {target} from your list. I know {thisHouse} well enough to be certain of that much.',
    'I am not given to saying such things lightly, but {target} is above reproach in this matter.',
  ],
  'claim.apart.official': [
    'I must correct the record, {sir}. {first} and {second} were not together at any point during that hour.',
    'Whatever account you have been given, {first} and {second} were apart that hour. I am in a position to say so.',
    'I can confirm that {first} and {second} were nowhere near one another in that hour, {detective}.',
  ],
  'claim.culpritAttr.sex.official': [
    'I am not able to furnish a name. I can say that the person responsible was {sex}.',
    'For what it is worth, {sir}, you are looking for {sex}. I will not be drawn on how I know.',
    'The murderer, to my certain knowledge, is {sex}. Beyond that I am not at liberty to say.',
  ],
  'claim.culpritAttr.trait.official': [
    'I am not at liberty to give a name. I can say that the party you want {trait}.',
    'For the record, {sir}, the murderer {trait}. I would ask you not to inquire how I know.',
    'I cannot name the person responsible. I can tell you only that your killer {trait}.',
  ],
  'claim.glimpse.official': [
    'I observed a figure near {room} in passing. I could not identify the person, but whoever it was {trait}.',
    'Near {room}, someone passed. I did not see a face, {sir}. I did observe that the figure {trait}.',
    'I am unable to give you a face, but the figure I saw by {room} {trait}, to the best of my recollection.',
  ],
  'claim.heard.crash.official': [
    'In the course of that hour I heard a crash from {room}. I took it at the time to be {weather}.',
    'I can confirm a sound of breakage from {room}. It had a deliberate character, and was not {weather}.',
    'At approximately that hour there was a noise from {room} while {house} was dressing, as of wood splintering or metal giving way.',
  ],
  'claim.heard.quarrel.official': [
    'Earlier in the day, voices were raised in {room}. It was a quarrel, though I could not make out the words.',
    'I passed near {room} and heard {victim} in dispute with another party. The exchange was bitter.',
    'There was shouting from {room} in the afternoon. {victim} was one party to it. I could not identify the other.',
  ],
  'claim.liarsAmong.official': [
    'I observed {pair} throughout the evening, and I can state that {howMany} giving you a false account of where they were.',
    'You will have put the question to {pair}. For the record, {howMany} lying to you about that hour.',
    'I would draw your attention to {pair}, {sir}. {howMany} giving you a false account of that hour.',
  ],
  'claim.passage.official': [
    'For the record, there is a passage in the wall of {scene}. It emerges in {room}.',
    'I am familiar with {thisHouse}, {sir}. A passage runs behind the panelling from {scene} to {room}.',
    'It appears on no plan, but there is a way through the wall from {scene} to {room}. I can confirm it.',
  ],
  'claim.passing.official': [
    'I was first along {passage} once it was done, and I passed {target} coming away from {room}. I draw no conclusion.',
    'I wish to record that shortly afterwards I met {target} in the passage outside {room}, walking quickly. I thought nothing of it then.',
    'I observed {target} coming from the direction of {room} within five minutes of the event. It may signify nothing, {sir}.',
  ],

  // =====================================================================
  // GOSSIP — what the guest says of two others
  // =====================================================================
  'claim.relationship.gossip.beneficiary.official': [
    '{victim} signed a new will this week, and {subject} stands to benefit handsomely under it.',
    'I would draw your attention to the will, {sir}. {victim} altered it, signed it, and {subject} is the one it favours.',
    'The new will is signed and witnessed. I can confirm that {subject} is the person who comes into the money.',
  ],
  'claim.relationship.gossip.cordial.official': [
    'So far as I ever observed, {subject} and {victim} were on cordial terms.',
    'I have nothing of note to report regarding {subject} and {victim}. Their dealings were perfectly pleasant.',
    'I never witnessed a cross word between {subject} and {victim}, and it is my habit to notice such things.',
  ],
  'claim.relationship.gossip.devoted.official': [
    'There was a genuine affection between {subject} and {victim}. It was apparent to anyone who observed them.',
    'I can confirm that {subject} was devoted to {victim}. Anyone {inThisHouse} would tell you the same.',
    '{subject} and {victim} were as close as any two persons {inThisHouse}. In my view, closer.',
  ],
  'claim.relationship.gossip.disinherited.official': [
    '{victim} intended to sign a new will, and {subject} was not provided for in it. It lacked only {his} signature.',
    'It was {victim}’s stated intention to cut {subject} out of the family. The new will was drawn up, to be signed on Monday.',
    'I had it from {victim} {himself} that the new will made no provision for {subject}. It was not yet signed.',
  ],
  'claim.relationship.gossip.dismissed.official': [
    '{victim} was dismissing {subject}. The matter was settled; only the day remained to be fixed.',
    '{subject} had been told to go. I made representations to {victim} on {subject}’s behalf, to no effect.',
    '{victim} had given {subject} notice, and in blunt terms. It was known throughout {household} by teatime.',
  ],
  'claim.relationship.gossip.exposed.official': [
    '{victim} had come into possession of information concerning {subject}, and intended to disclose it. {He} as good as said so at luncheon.',
    '{victim} had caused inquiries to be made into {subject}. Whatever {he} found, {he} intended to use.',
    'There is a matter in {subject}’s past which {victim} had discovered. {He} was not one to keep such a thing to {himself}.',
  ],
  'claim.relationship.gossip.forbidden.official': [
    '{subject} wished to marry {his} {child}. {victim} forbade it outright.',
    'An attachment existed between {subject} and {his} {child}, and {victim} would not countenance it on any terms.',
    '{subject} asked {victim} for {his} {child}’s hand and was refused. I understand the request was made more than once.',
  ],
  'claim.relationship.gossip.hostile.official': [
    'Relations between {subject} and {victim} were openly hostile. Their quarrels carried through the walls of {thisHouse}.',
    'It is a matter of common knowledge that {subject} and {victim} could not share a room without a marked chill.',
    'There was real hatred between {subject} and {victim}. I do not use the word lightly, {sir}.',
  ],
  'claim.relationship.gossip.indebted.official': [
    '{subject} was in debt to {victim}, in a substantial sum. It had done the friendship no good.',
    'There was money owing between {subject} and {victim}. A great deal of it, and none of it forgiven.',
    '{victim} held paper on {subject}, {detective}. The debts were of long standing, and increasing.',
  ],
  'claim.relationship.gossip.jilted.official': [
    '{victim} broke off an engagement with {subject}, some years ago. I understand it has not been forgiven.',
    'An understanding once existed between {subject} and {victim}. {He} brought it to an end, and not kindly.',
    'It is well known that {subject} was thrown over by {victim} long ago, and has never, in my hearing, forgiven it.',
  ],
  'claim.relationship.gossip.rival.official': [
    '{subject} was {victim}’s partner in business, and was being squeezed out of the firm.',
    'The two were in business together, {subject} and {victim}. {He} intended to end the partnership and retain what it had made.',
    '{victim} was ruining {subject}, and doing so strictly by the book. A firm existed between them, and soon would not.',
  ],
  'claim.relationship.gossip.strained.official': [
    'Relations between {subject} and {victim} had cooled of late. Everyone pretended not to notice, and everyone noticed.',
    '{subject} and {victim} had been scrupulously polite with one another for some weeks. It was that kind of politeness.',
    'Something had gone amiss between {subject} and {victim}. There was no scandal, but a distinct chill, apparent at table.',
  ],

  // =====================================================================
  // SELF — what the guest says of their own dealings with the victim
  // =====================================================================
  'claim.relationship.self.beneficiary.official': [
    '{He} signed a new will this week, under which I am a beneficiary. I did not ask {him} to do so.',
    'I must state plainly that I inherit. The will was signed on Tuesday. I am aware of how that appears.',
    'I come into a considerable sum by {his} death, more than I did a week ago. I had no part in {his} decision.',
  ],
  'claim.relationship.self.cordial.official': [
    '{victim} and I were on perfectly good terms, for the record.',
    'We got on well, {he} and I. There were no quarrels, no debts and no history between us.',
    'Our relations were cordial, {sir}. We liked one another well enough, and it went no further than that.',
  ],
  'claim.relationship.self.devoted.official': [
    'I was devoted to {him}. {He} was as family to me, whatever may be suggested.',
    'No one {inThisHouse} was closer to {him} than I. I make no apology for having wept tonight.',
    '{He} was the best friend I had in the world, {detective}. You may enter my loss in the record.',
  ],
  'claim.relationship.self.disinherited.official': [
    '{He} intended to cut me out. The new will was drawn and wanted only {his} signature. I knew it, and I do not deny it.',
    'It is correct that {he} meant to sign a new will, and that I was not provided for in it.',
    'I was to receive nothing. {He} told me so {himself}, and named Monday for the signing.',
  ],
  'claim.relationship.self.dismissed.official': [
    '{He} intended to dismiss me, and I had been told as much. I was to be gone by the end of the month.',
    'I was to leave. {He} had made up {his} mind to it, and {he} was not one to alter a decision.',
    'I was being put out of {thisHouse} without so much as a reference, and with nowhere to go.',
  ],
  'claim.relationship.self.exposed.official': [
    '{He} had discovered something concerning me. I am not at liberty to say what. {He} intended to make it public, and told me when.',
    'There is a matter in my past of which {he} had become aware, and which {he} meant to disclose. I am not proud of it.',
    '{He} had me watched, and held a report. {He} intended to use it, and I was aware of that.',
  ],
  'claim.relationship.self.forbidden.official': [
    'I asked for {his} {child}’s hand, and {he} refused. {He} said it should never be while {he} lived.',
    'I wished to marry {his} {child}. {He} forbade it, and forbade us so much as to correspond.',
    'An attachment exists between {his} {child} and myself. {He} would not entertain it, in terms I would prefer not to repeat.',
  ],
  'claim.relationship.self.hostile.official': [
    'Since you ask, {sir}, there was no goodwill between us. I will not affect a grief I do not feel.',
    'I hated {him}. I state it for the record, since others will only imply it. Hatred is not a confession.',
    'We detested one another, and the whole of {household} was aware of it. You would have had it from someone before long.',
  ],
  'claim.relationship.self.indebted.official': [
    'I owed {him} money, a very considerable sum. I assumed you would find it out in any event.',
    'In candour, I was in {his} debt to a figure I do not care to state aloud. I appreciate it may be viewed as motive.',
    '{He} held my notes of hand, and reminded me of the fact. I owed {him} more than I could pay.',
  ],
  'claim.relationship.self.jilted.official': [
    '{He} broke off our understanding, some years ago. One does not forget it; one learns to live with it.',
    'There was an understanding between us, years ago, which {he} ended badly. I have borne it quietly since.',
    'We were to have been married. {He} thought better of it. I cannot say that I have forgiven {him}.',
  ],
  'claim.relationship.self.rival.official': [
    'We were partners, {he} and I, and {he} was pushing me out of a firm I helped to build. I would rather you heard it from me.',
    '{He} and I were in business together. Lately {he} had arranged matters so that the partnership was a partnership in name only.',
    '{He} intended to ruin me. It was perfectly lawful, and would have left me with nothing of what we made.',
  ],
  'claim.relationship.self.strained.official': [
    'I will not pretend there was no friction between us. Relations had been merely civil for some weeks.',
    'Relations were strained, and I do not propose to deny it. We had been civil, and only civil, for weeks.',
    'There had been a coolness between us of late. It would not lead to murder, but I will not deny it, {sir}.',
  ],
  'claim.role.official': [
    'For the record, {sir}, I am {roleName}.',
    'You will wish to enter it in your notebook that I am {roleName}.',
    'I shall state it plainly, so that there is no misunderstanding. I am {roleName}.',
  ],

  // =====================================================================
  // ROOMS, SIGHTINGS AND WHEREABOUTS
  // =====================================================================
  'claim.roomEmpty.official': [
    'My room faces {room}, and no one entered it in the course of that hour. I should have heard the door.',
    'I remained in the hall opposite {room} throughout the hour. No one went in, and no one came out.',
    'The floorboards outside {room} creak at the least weight. I heard nothing there all hour, and I can confirm that it was empty.',
  ],
  'claim.roomUsed.official': [
    'My room looks directly onto the door of {room}. Someone entered it that hour. I am unable to say who.',
    'I was seated in the hall opposite {room} that hour, and the door was opened. I had my back to it, regrettably.',
    'I heard the floorboards outside {room}, and then the latch. Someone was in that room during the hour.',
  ],
  'claim.sighting.official': [
    'I saw {target} in {room} during that hour, and of that I am certain.',
    'I can confirm that {target} was in {room}. I observed it with my own eyes, {sir}.',
    'Whatever else may be in doubt, {target} was in {room} at that time. I will put my name to that.',
  ],
  'claim.suspicion.official': [
    'I make no accusation. I would merely record that {target} has not seemed quite right all evening.',
    'Since you ask me directly, {sir}: {target}. I cannot give reasons. It is an impression only.',
    'In candour, my attention has been upon {target} throughout the evening.',
  ],
  'claim.together.official': [
    'I can confirm that {first} and {second} spent that hour in one another’s company, without a minute apart.',
    'It has been remarked upon for weeks, {detective}. {first} and {second} were together for the whole of that hour.',
    'To my certain knowledge, {first} and {second} never left one another’s side that hour. I would so state in writing.',
  ],
  'claim.whereabouts.alone.official': [
    'For the hour in question, I was in {room}. I was alone.',
    'I was in {room}, unaccompanied, for the whole of that hour. I appreciate that this cannot easily be corroborated.',
    'I was in {room} from {windowFrom} onward, by myself. It is not, I accept, a strong account.',
  ],
  'claim.whereabouts.company.official': [
    'I was in {room} throughout that hour, and not alone. {companions} can confirm it for every minute.',
    'From {windowFrom} I was in {room} in the company of {companions}. You may put the question to them.',
    'For the whole of that hour I was in {room} with {companions}. None of us left it.',
  ],

  // =====================================================================
  // CONFESSION AND EVIDENCE
  // =====================================================================
  'confession.official': [
    'I must stop you there, {sir}. There is no need to look further. It is my name you want.',
    'I cannot sit by while you name another party. I am the person you are looking for.',
    'I will not carry this past midnight. I wish to make a full statement, and I ask that it be taken down.',
  ],
  'evidence.bare.official': [
    'Then whatever was used has been removed, {sir}. Someone has tidied up after the murderer.',
    'No trace of the means remains. It follows that somebody took it away, and took it elsewhere.',
    'A murder, and nothing found that it was done with. It did not leave the room of its own accord.',
  ],
  'evidence.bribe.official': [
    'That is a considerable sum to find lying about. There is a name upon it, and it is not mine.',
    'Somebody has been paid for something. The name on it is plain enough for you to read.',
    'I have no knowledge of it, {sir}. I would put the question to the person named upon it.',
  ],
  'evidence.deny.official': [
    'That is not mine, {sir}. You will find the like of it in any room {inThisHouse}.',
    'I must state that it is not mine. I would suggest that the inquiry be directed elsewhere.',
    'For the record, that item does not belong to me, and I would ask that this be noted.',
  ],
  'evidence.doc.comment.official': [
    'I have no knowledge of that paper. Its author would be best placed to speak to it.',
    'It is somebody’s private grief set down in ink. It is not for me to explain it.',
    'This is the first I have seen of it, {sir}. I find it uneasy reading.',
  ],
  'evidence.doc.confirm.official': [
    'You have found it, then. I suppose I always knew that someone would.',
    'I confirm it. I will not dress it up; you had better have it from me than from {house}.',
    'That document is genuine, {sir}. I would not insult you by suggesting otherwise.',
  ],
  'evidence.doc.deny.official': [
    'I must object to that. You have hold of something twisted out of all meaning. Let me state how matters truly stood.',
    'A paper can be made to say anything. For the record, here is how matters actually were.',
    'That is not what it appears to be, {sir}. I ask leave to explain how things really stood.',
  ],
  'evidence.doc.gossip.official': [
    'That paper says aloud what half {house} has been whispering for weeks.',
    'I am not surprised, {sir}, and I should like to explain why I am not.',
    'So it has been set down in writing. I could have told you as much, and I now will.',
  ],
  'evidence.flavor.official': [
    'That is somebody’s rubbish, {sir}. I do not regard it as evidence, unless untidiness is an offence.',
    'You will find one of those in every room of {thisHouse}. It has no significance.',
    'That is merely an article of {thisHouse}, and it was there before any of this occurred.',
  ],
  'evidence.hand.official': [
    'That is {his} hand, without question. {He} wrote a great many letters.',
    'I recognise the writing, {sir}. {He} wrote to everyone, and kept copies of nothing.',
    'A letter of {his}, concerning business by the appearance of it, as they always were.',
  ],
  'evidence.identify.official': [
    'That did not come from me, {sir}, though I can think of whom it may have come from.',
    'It is not mine. I suggest you compare it with the persons at this table, and see whom it fits.',
    'In your position I would look for the {one} who matches it. It is not I.',
  ],
  'evidence.key.official': [
    'That is the key to {locked}. I had wondered where it had got to.',
    'The key to {locked}, {sir}. You may now see for yourself what is inside.',
    'I confirm that it opens {locked}. I cannot say who held it last.',
  ],
  'evidence.killed.official': [
    'Dead, {sir}, and not an hour ago seated among us. Whoever was responsible for the first has done this.',
    'Then somebody was afraid of what they knew. I regret that they did not come to you sooner.',
    'That makes two, now, with the rest of us shut in with whoever is responsible.',
  ],
  'evidence.lockbox.official': [
    'The box was forced, {sir}? Then there is a thief among us as well as a murderer.',
    'I note that the box was forced. We have, it would seem, a thief as well as a murderer.',
    'Forced, you say. That is a second matter for the file, {sir}, alongside the first.',
  ],
  'evidence.lockbox.intact.official': [
    'The box is locked and bears no mark. Whatever occurred in that room, it was not a robbery.',
    'It is untouched. Should anyone tell you they were at that box tonight, their account does not hold.',
    'No one has been at it. It is exactly as it was this morning.',
  ],
  'evidence.note.official': [
    'I had no notion that {he} was so unhappy. I find it distressing, {sir}.',
    'I would ask that it be put away. I am unable to look at it.',
    'Forgive {him}? I do not understand what there is to forgive. It is quite beyond me.',
  ],
  'evidence.passage.official': [
    'A passage. Then whoever was in that room could have come and gone as they pleased.',
    'So the old stories were correct. I would inquire who spent that hour at the far end of it.',
    'I was not aware of it, {sir}. It does alter matters for whoever was in that room.',
  ],
  'evidence.trace.own.official': [
    'That is mine, I am afraid. I told you where I was, and there is the corroboration.',
    'Yes, it is mine. I left it where I sat, as I stated earlier.',
    'It is mine, and for once I am glad of it. It bears out my account.',
  ],
  'evidence.weapon.comment.official': [
    'That is beyond my capacity, {detective}. You may see as much for yourself.',
    'I could not have done that. I would ask you to observe it, {sir}.',
    'A grim business, and beyond me, I am afraid. It was evidently someone else’s doing.',
  ],
  'evidence.weapon.deny.official': [
    'I had the means, and I do not deny it. I was not the one who used them.',
    'That was within my reach, {sir}. I would remind you that reach is not deed.',
    'I could have laid hands on that, as could half the persons present. Access is not action, {detective}.',
  ],

  // =====================================================================
  // THE GATHERING, KNOWLEDGE, OPENINGS
  // =====================================================================
  'gathered.official': [
    'We are all assembled, {sir}. Who is it to be?',
    'I do not know how much more of this I can bear. Pray state it, whoever it is, and be done.',
    'You have been the length of {thisHouse} tonight in your inquiries. I trust you have reached a conclusion.',
  ],
  'knowledge.hedged.official': [
    'I will give you what I know, {sir}, though it may be read in more than one way.',
    'The facts I can supply. The conclusions are a matter for you, and may differ.',
    'I offer it as I found it. What it signifies, I could not say with confidence.',
  ],
  'knowledge.share.official': [
    'I will deal with you squarely, {sir}, and give you what I have.',
    'If you will hear me, there is a statement I wish to make.',
    'What I can offer you is as follows. It is not much, but it is accurate.',
  ],
  'knowledge.silent.official': [
    'I can state what I am, {sir}, and there I must stop. Of the rest I have nothing to say.',
    'The role you may have. What goes with it is a matter I am not at liberty to discuss.',
    'I am able to tell you who I am, and no more than that. I would rather the question were not pressed.',
  ],
  'knowledge.vague.official': [
    'What should I know, {sir}? I keep to my own affairs, unless you have something that touches me.',
    'You are fishing, {detective}. Return with something in your hand, and I may be more forthcoming.',
    'Were I in possession of anything of value, I should require a reason to say it. Asking is not one.',
  ],
  'lastWords.official': [
    'I did not hear you come in. Is something the matter?',
    'Yes? I had understood that everyone had retired.',
    'You? May I ask what brings you down here at this hour?',
  ],
  'opens.official': [
    'Since you have that, I may as well give you the rest.',
    'That alters matters. Very well, I will state what I have been withholding.',
    'I said I required a reason, and that will serve as one.',
  ],

  // =====================================================================
  // REACTIONS
  // =====================================================================
  'reaction.accuse.official': [
    'You need not look far, in my view. {target} has not been right all evening, and I find it impossible to overlook.',
    'I will spare you the preliminaries, {sir}. I would direct you to {target}.',
    'You may confine your notes to one name: {target}. Someone had to say it.',
  ],
  'reaction.heard.crash.official': [
    'You will want more than formalities tonight, {detective}, so I propose to give you something of substance.',
    'Before you begin your inquiries, there is a matter you ought to be told of.',
    'I have had something under consideration all evening, and I believe you should be informed of it.',
  ],
  'reaction.overheard.official': [
    'It may not be my place, {sir}, but there is something I should report.',
    'I have a matter to bring to your attention, and I had better do so now.',
    'There is something I ought to mention, and it would be wrong to leave it longer.',
  ],
  'reaction.plain.official': [
    'A black night for {thisHouse}, {sir}. You may put your questions.',
    'I take it you will wish to interview each of us. Please begin.',
    'I have been expecting you to come to me. Proceed when you are ready.',
  ],
  'reaction.referral.official': [
    'I can offer no name, I regret, but {victim} shut {himself} away in {room} all afternoon, writing. I would look there.',
    'One point, since you ask: {victim} spent the whole afternoon locked in {room}, writing. Whatever {he} wrote is presumably still there.',
    'I am unable to say who. I can say that {victim} was writing in {room} all afternoon, and was curt with anyone who knocked.',
  ],
  'reaction.weaponhint.official': [
    'Something has troubled me since we found {him}. {room} is not as it should be, whether by something missing or something present.',
    'Were I establishing how it was done, {detective}, I should begin with {room}. {house} is slightly wrong there.',
    'It may be a small matter, but {room} has been disturbed. I noted it in passing, and I give it more weight now.',
  ],

  // =====================================================================
  // ROLES, KEYS, SIGHTINGS, SUSPECTS
  // =====================================================================
  'role.claim.official': [
    'Very well, {sir}. You may as well know it.',
    'Since it will come out regardless, I shall state it.',
    'I shall not fence with you. Here it is, for the record.',
  ],
  'role.vague.official': [
    'My part in all this? I was a {one} with poor luck. For more than that, I should require a reason.',
    'We are to exchange confidences now, are we? Not without cause. Show me you know something, and we shall see.',
    'I shall keep my part in the evening to myself, unless you have grounds to require otherwise.',
  ],
  'seen.key.official': [
    'You are looking for the key to {locked}? I believe I observed it on a table in {room}.',
    'The key to {locked} was lying in {room}, as of the last occasion I saw it.',
    'If it is the key to {locked} you require, there was a key on a ring in {room}. I thought nothing of it then.',
  ],
  'seen.key.held.official': [
    'The key to {locked}? I saw {person} pick up a key this evening. I thought nothing of it at the time.',
    'You require the key to {locked}. I would put the question to {person}, in whose hand I saw a key not an hour ago.',
    'If it is the key to {locked} you want, {person} has it, I believe. I observed it being picked up.',
  ],
  'seen.nothing.official': [
    'I have nothing to report, {sir}. I observed nothing out of the ordinary.',
    'For the record, I noticed nothing of note. I was attending to my own affairs.',
    'I regret that I cannot assist you on that point. I saw nothing of any significance.',
  ],
  'seen.share.official': [
    'I did observe one thing, now that you ask.',
    'There is something, yes, for what it may be worth.',
    'I was not looking for anything in particular. I did, however, observe the following.',
  ],
  'suspect.hedge.official': [
    'If I were obliged to name someone, {sir}, I might say {target}. I could, however, argue it otherwise.',
    'The likeliest party appears to be {target}, though I accept that I may be mistaken.',
    'My inclination is toward {target}. I say inclination, and no more. I would not put it higher.',
  ],
  'suspect.none.official': [
    'I am unable to put a name to it, {sir}. If you want someone worth asking, I would suggest {person}.',
    'I would sooner not guess, {sir}. {person} may not need to.',
    'No name from me, I regret. Though {person} has been sharper than I all evening, and might repay questioning.',
  ],
  'suspect.point.official': [
    'You asked, {sir}, so I shall say it: {target}. I would watch the eyes when the hour is raised.',
    '{target}. I have no proof I could put before a court, only that everything about this evening points one way.',
    'In my view you are devoting your time to the rest of us while {target} sits so very quietly.',
  ],
  'suspect.vouch.official': [
    'I have no name for you. I will say that, whoever it was, I do not believe it was {target}.',
    'I cannot tell you who. I can tell you who it was not, and that is {target}. It is an impression only.',
    'No name that I would put forward, {sir}. I find I cannot believe it of {target}.',
  ],
}

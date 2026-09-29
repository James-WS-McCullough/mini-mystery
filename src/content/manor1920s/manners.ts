import type { DialogueBanks } from '../schema'

// More ways of talking. The same RULES OF THE BANKS apply as in dialogue.ts:
// these are voice only, shared by the honest and the lying alike, and no line
// says more than its neutral counterpart.
//
// First drafted by a smaller model from a brief of every bank's purpose and
// slots, then checked by script (slots, pronouns, invented facts, length,
// closeness to existing lines, worn phrases) and read through by hand.

export const manners: DialogueBanks = {
  // =====================================================================
  // DEFERENTIAL — a servant speaking to their betters: respectful, plain, careful.
  // =====================================================================
  'claim.role.deferential': [
    'If you please, {sir}, I am {roleName}.',
    'I’m {roleName}, {sir}, if it please you.',
    'Begging your pardon, {sir} — I am {roleName}, and that’s the truth.',
  ],
  'claim.whereabouts.alone.deferential': [
    'Begging your pardon, I was in {room} and nobody were with me.',
    'I can speak truthfully to {room}, {sir} — I were alone there.',
    'I can speak true to this, {sir} — I was in {room}, and nobody were there but me.',
  ],
  'claim.whereabouts.company.deferential': [
    'You may ask {companions} about it, {sir} — they can say I were in {room} all through.',
    'I were in {room} with {companions}, and we stayed put the whole time, {sir}.',
    'Ask {companions}, if you please — {room} is where we both were.',
    '{companions} and I were in {room} together all through that hour.',
  ],
  'claim.sighting.deferential': [
    'It were {target} in {room}, {sir} — I could not be mistaken.',
    'Begging your pardon, but I did see {target} in {room}.',
    'I’ve no doubt whatsoever — {target} was in {room} that hour, {sir}.',
    '{target} in {room} — I saw it clear as day, and I’m certain of it.',
  ],
  'claim.glimpse.deferential': [
    'The one I saw near {room} — I couldn’t say who, but they {trait}.',
    'I cannot tell you the face, {sir}, but near {room} there were someone who {trait}.',
    'Near {room}, I glimpsed a figure, but I couldn’t say who — only that they {trait}.',
    'I seen somebody near {room}, {sir}, but not the face — just that this person {trait}.',
  ],
  'claim.culpritAttr.trait.deferential': [
    'I couldn’t say for certain, but the one you’re after {trait}.',
    'If you’ll believe me, {sir}, the killer {trait}.',
    'The person who done this — mark my words, whoever it is {trait}.',
    'I don’t know the name, {sir}, but the one you want, they {trait}.',
  ],
  'claim.alignment.good.deferential': [
    'I’ll stake my reputation on it, {sir} — {target} is honest.',
    'Whatever else may be said, {target} is true. You can trust it, {sir}.',
    'Begging your pardon to speak plain: {target} is innocent, {sir}. I know it.',
  ],
  'claim.alignment.evil.deferential': [
    'If you’ll forgive me saying, {sir}, there’s something not right about {target}.',
    'It’s not my place, {sir}, but {target} has rot in them. I’m sure of it.',
    'There’s wrong in {target}, {sir} — I’ve seen it plain as day, and tonight I’m certain.',
    'If I may speak plainly, {target} is not what they would have us believe, {sir}.',
  ],
  'claim.relationship.self.devoted.deferential': [
    'I loved him true, {sir}. He were like family to me.',
    'There were nobody in this house as close to his lordship as I were, {sir}.',
    'Begging your pardon, but I did love him dearly. I won’t pretend otherwise.',
  ],
  'claim.relationship.self.cordial.deferential': [
    'We got on well, {sir} — perfectly civil.',
    'I can say honest, {sir} — he and I got on fine together.',
    'We were on easy terms, his lordship and I — no difficulties between us, {sir}.',
    'Truthfully, {sir}, we rubbed along quite comfortably with one another.',
  ],
  'claim.relationship.self.strained.deferential': [
    'We weren’t easy with each other, {sir}. That’s the honest truth.',
    'It’s not my place to say, {sir}, but things were cool between us of late.',
    'There were a coldness, if I may speak plain, {sir}. That’s the fact of it.',
  ],
  'claim.relationship.self.hostile.deferential': [
    'I hated him, {sir}. I won’t dress it up or lie about it.',
    'We didn’t get on, not one bit. If that’s motive, then it’s motive.',
    'Begging your pardon for plain speech, {sir}, but I despised him.',
  ],
  'claim.relationship.self.indebted.deferential': [
    'I owed him money, {sir} — a great deal of it.',
    'It’s true, {sir}. I were in his debt and he made sure I knew it.',
    'If I’m being honest, {sir}, I owed his lordship what I couldn’t repay.',
  ],
  'claim.relationship.self.jilted.deferential': [
    'He threw me over once, long ago, {sir}. I’ve carried it since.',
    'We were to be wed, {sir}, and he changed his mind. A long time ago.',
    'He broke things off between us, {sir}. It were years ago, but these things stay with you.',
  ],
  'claim.relationship.gossip.devoted.deferential': [
    '{subject} worshipped {victim} — you could see it plain as day, {sir}.',
    'If you wanted to know devotion, just watch how {subject} carried on about {victim}.',
    '{subject} was entirely devoted to {victim}, {sir} — I seen it every day here.',
  ],
  'claim.relationship.gossip.cordial.deferential': [
    'They were amiable, {sir} — {subject} and {victim}. I never saw cross words.',
    '{subject} and {victim} were perfectly pleasant together — nothing more to say on it.',
    'As far as I could tell, {subject} and {victim} were on good terms, {sir}.',
  ],
  'claim.relationship.gossip.strained.deferential': [
    'It’s not my place to say, {sir}, but {subject} and {victim} weren’t themselves together.',
    'I felt a coldness growing between {subject} and {victim}, {sir}. It was plain enough.',
    'If you don’t mind me speaking, {sir}, {subject} and {victim} had grown rather distant of late.',
    'I noticed it plain as day, {sir} — {subject} and {victim} had grown careful with one another.',
  ],
  'claim.relationship.gossip.hostile.deferential': [
    '{subject} and {victim} were at each other’s throats, {sir}. Real hatred there.',
    'They couldn’t be in the same room without quarrelling, {sir}. {subject} and {victim}.',
    'The feeling between {subject} and {victim}? Hatred pure and simple, {sir}. No mistaking it.',
  ],
  'claim.relationship.gossip.indebted.deferential': [
    '{subject} owed {victim} money, {sir} — a good deal of it.',
    'It was money between them, {sir}. {victim} held the debt and wouldn’t let {subject} forget.',
    '{subject} were in {victim}’s debt, {sir}, and it weren’t a small thing.',
  ],
  'claim.relationship.gossip.jilted.deferential': [
    '{victim} broke the engagement with {subject}, {sir} — and {subject} has never quite got over it.',
    '{subject} had an understanding with {victim} once, but {victim} ended it. Very badly indeed.',
    '{subject} was jilted by {victim} long ago, and it’s still raw, {sir}. I can tell you that.',
  ],
  'claim.heard.crash.deferential': [
    'There were a terrible noise from {room}, {sir}. Something breaking, I thought.',
    'I heard a crash from {room}, {sir} — sharp and deliberate. It weren’t just the storm.',
    'I heard something come down hard in {room}, {sir} — sounded like glass or such.',
  ],
  'claim.heard.quarrel.deferential': [
    'Earlier in the day, {sir}, there were shouting in {room}. A proper quarrel, {sir}.',
    'I heard raised voices from {room} this afternoon, {sir} — his lordship, and someone else.',
    'There were a dreadful quarrel from {room}, {sir}, before dinner. I couldn’t make out words.',
  ],
  'claim.suspicion.deferential': [
    'I cannot speak certain, {sir}, but {target} has been wrong somehow.',
    'Since you ask me straight, {sir} — {target}. That’s who I think it were.',
    'If you want my honest thought, I fear it’s {target}. I couldn’t tell you why, but I do.',
    'I’ve watched {target} all evening, and there’s something not right about that one, {sir}.',
  ],
  'reaction.plain.deferential': [
    'It’s a terrible thing, {sir}. Ask what you need to ask.',
    'It’s a dreadful business, {sir}. I’m ready to tell you what I know.',
    'Such a terrible thing, {sir}. I’ve been waiting for you. What do you need from me?',
  ],
  'reaction.heard.crash.deferential': [
    'If I may speak, {sir}, there’s a thing I heard that you’ll want to know.',
    'Begging your pardon, {sir}, but there’s something I heard that might matter.',
    'If you’ll permit me, there’s a thing I witnessed that you should know of.',
  ],
  'reaction.heard.quarrel.deferential': [
    'It’s not my place perhaps, {sir}, but there’s something I should tell you.',
    'I’ve kept this to myself, {sir}, but I heard something you need to know.',
    'Begging your pardon, {sir}, but I ought to tell you what I heard.',
  ],
  'reaction.accuse.deferential': [
    'You needn’t look far, {sir}, if you ask me. It’s {target}.',
    'Save yourself the bother, {sir} — {target} is the one.',
    'If you want my view straight, {sir}, it’s {target}. Mark my words on that.',
    'Look to {target}, {sir}. That’s where the answer lies, if you ask me.',
  ],
  'reaction.referral.deferential': [
    'I can’t say who for certain, {sir}, but his lordship were writing in {room} all afternoon. You should look there.',
    'His lordship locked himself away in {room}, {sir}, and was writing something fierce. I’d look there, if I were you.',
    'His lordship were writing in {room} all afternoon, {sir}. I’d start your search there, if I were you.',
    'The deceased spent the whole of the afternoon in {room}, {sir}, with pen and paper. You should look there.',
  ],
  'role.vague.deferential': [
    'My part, {sir}? I’d sooner not say just yet.',
    'It’s not clear what you’re asking me, {sir}. Ask plainer and I’ll answer.',
    'What part was I to play, {sir}? I’m afraid I couldn’t say just now.',
    'My role, {sir}? That’s rather a strange thing to ask, if I may say so.',
  ],
  'role.claim.deferential': [
    'If you must have it, {sir}, here it is.',
    'I suppose you’ll have it out of me eventually, so here goes, {sir}.',
    'Very well, {sir}. I’ve nothing to hide, so I’ll tell you plainly.',
  ],
  'alibi.alone.deferential': [
    'My whereabouts, {sir}? I can answer that plainly.',
    'I can tell you exactly where I were, {sir}.',
    'As to where I were, {sir}, that’s easy enough.',
    'My whereabouts that hour, {sir}? I can tell you exactly where I was.',
  ],
  'alibi.company.deferential': [
    'There I can give you names, {sir}, to back my account.',
    'I’m pleased to say I’ve got witnesses to back my word, {sir}.',
    'As to my whereabouts, I’m fortunate to have proper company, {sir}.',
    'There at least I can give you proof, {sir} — and glad of it.',
  ],
  'knowledge.vague.deferential': [
    'It’s not certain I wish to say, {sir}, if you’ll forgive me.',
    'I’m not sure there’s anything I know that’s worth telling, {sir}.',
    'Know, {sir}? I’m not sure I know anything that would help your inquiry.',
    'What should I know? I keep myself to myself, if you take my meaning.',
  ],
  'knowledge.share.deferential': [
    'If you’ll hear me out, {sir}, I’ve got something to say.',
    'I’ll speak plainly with you, {sir}, if you’re willing to listen.',
    'I’ve something to share with you, {sir}, if it might help.',
  ],
  'knowledge.hedged.deferential': [
    'The facts I have, {sir}. How to read them — that’s for you.',
    'Take this as you will, {sir}. It could mean one thing or another.',
    'There’s a thing I know, but begging your pardon, I might be wrong about it.',
  ],
  'suspect.point.deferential': [
    '{target}, {sir}. I’ve no proof, but everything points that way.',
    'You asked, {sir}, so I’ll say it plain: {target}.',
    'In my view, {sir}, it’s {target}. Watch {target} close.',
  ],
  'suspect.hedge.deferential': [
    'If I had to name someone, {sir}, I might say {target}. Though I could argue it different.',
    'Pressed for a guess, {sir}, I’d say {target}. But it’s only a guess.',
    'If I’m forced to speak, I’d say {target} — but I could be mistaken, {sir}.',
    'It could be {target}, {sir}. Though truth be told, it could be nearly anyone.',
  ],
  'suspect.none.deferential': [
    'I couldn’t put a name to it, {sir}. Though {person} might be the one to ask.',
    'I wouldn’t know, {sir}. But {person} has seen more than most.',
    'I couldn’t say, {sir}. But {person} was in a position to know better than I.',
    'I’ve no name for you, {sir}. Though {person} has been clever enough to notice things.',
  ],
  'about.person.deferential': [
    'I can speak to that if you wish, {sir}. It’s not much, though.',
    'Since you ask me about them, I’ll say what I know, {sir}.',
    'Since you ask, I’ll tell you what I know, though it’s not a great deal, {sir}.',
  ],
  'about.referral.deferential': [
    'I don’t know much about that, {sir}. You should ask {person} — they’d know better.',
    '{person} is the one to ask about that, {sir}. I’m not in a position to say.',
    'I wouldn’t know, {sir}. {person} would be able to tell you all about it.',
  ],
  'about.nothing.deferential': [
    'I couldn’t tell you the first thing about them, {sir}.',
    'We nodded on one occasion, {sir}. That’s the whole of what I know.',
    'You’d learn more from the cat, {sir}. I know that little of them.',
  ],
  'about.victim.deferential': [
    'I knew this question would come, {sir}. I’ll answer it honestly.',
    'As to my own dealings with his lordship, I can speak plain, {sir}.',
    'I knew you’d ask about that, {sir}. I’ll tell you true, if I may.',
  ],
  'evidence.deny.deferential': [
    'That’s not mine, {sir}. You’ll find one like it in every room of this house.',
    'It’s not mine, {sir}. I speak true, not to be difficult.',
    'That could have come from anywhere, {sir}. It’s not mine.',
  ],
  'evidence.identify.deferential': [
    'I’d look for who matches that, {sir}, not at me.',
    'That’s not mine, {sir}. But I dare say you could see who it belongs to.',
    'Not from me, {sir}. But I think you’ll see who it fits when you look close.',
    'I couldn’t have left that, {sir}. But look for who it does match, if you please.',
  ],
  'evidence.trace.own.deferential': [
    'That is mine, I’m afraid, {sir}. It proves what I said.',
    'That’s mine, {sir}, I’m afraid. But it bears out what I told you, doesn’t it?',
    'Mine, I must confess, {sir}. And I’m glad of it — it proves my word.',
  ],
  'evidence.weapon.deny.deferential': [
    'I could have laid hands on it, {sir}. But I didn’t. Reach is not deed.',
    'Yes, {sir}, it were within reach. But reaching for it and using it are different things.',
    'I had the means, {sir}. I won’t pretend otherwise. But I didn’t use them.',
  ],
  'evidence.weapon.comment.deferential': [
    'I couldn’t do that, {sir}. You can see that for yourself.',
    'I’m not capable of that, {sir}. You know it as well as I do.',
    'That’s beyond me, {sir}. You know that as well as I do.',
    'It’s not possible for me, {sir}. You’ll see that for yourself.',
  ],
  'evidence.lockbox.deferential': [
    'The box was forced, {sir}? Then there’s a thief in this house as well as a killer.',
    'So there’s been a theft, {sir}, in amongst all the rest. How much worse can it be.',
    'The box has been forced? Then there’s a thief about as well, {sir}, and that’s a dark business.',
  ],
  'evidence.doc.deny.deferential': [
    'Papers can say anything, {sir}. But it weren’t like that — not truly.',
    'That’s not right, {sir}. Hear me out, and I’ll tell you what happened:',
    'That paper don’t tell the truth, {sir} — hear me out and I’ll explain what really happened.',
    'Papers say one thing, but it weren’t so, {sir}. Let me tell you how it truly was.',
  ],
  'evidence.doc.confirm.deferential': [
    'That’s genuine, {sir}. I won’t dress it up — you might as well have it from me.',
    'That’s the truth of it, {sir}. I won’t lie to you about it now.',
    'Yes, {sir}, that’s genuine. I knew it would come out eventually.',
  ],
  'evidence.doc.gossip.deferential': [
    'That confirms what I’d heard whispered about, {sir}. Now we have it in ink.',
    'That’s what I suspected all along, {sir}. Now we have the proof of it.',
    'That just puts on paper what I’d already heard spoken of, {sir}.',
    'Well, that bears out what folk were saying, {sir}. Now it’s official-like.',
  ],
  'evidence.doc.comment.deferential': [
    'That’s not my affair, {sir}. Whoever wrote it knows the truth of it.',
    'That’s not my place to speak on, {sir}. The one who wrote it would know best.',
    'Somebody’s secret troubles, put down in writing. I couldn’t say what it means, {sir}.',
    'I’ve never seen that before, {sir}. It reads like somebody’s private sorrow.',
  ],
  'evidence.flavor.deferential': [
    'That’s just somebody’s rubbish, {sir}. I couldn’t say what it means.',
    'That were there before any of this, {sir}. It means nothing.',
    'That’s nothing, {sir} — just somebody’s leavings. It was there before tonight, I’m sure of it.',
  ],

  // =====================================================================
  // BOASTFUL — the hero of every story, including this one.
  // =====================================================================
  'claim.role.boastful': [
    'I am {roleName} — a role that, I’m rather proud to say, I managed with considerable presence of mind.',
    'I am {roleName}, a position I filled with considerable aplomb.',
    'I am {roleName} — and I dare say I managed the part with some distinction.',
  ],
  'claim.whereabouts.alone.boastful': [
    'I was in {room}, alone — and excellent company I am, though it makes a poor alibi.',
    '{room}, by myself. I have never needed an audience to be entertained.',
    'I had {room} to myself. People do tend to leave the best rooms to me.',
  ],
  'claim.whereabouts.company.boastful': [
    'I was in {room} with {companions}, and neither of us left that room for a moment.',
  ],
  'claim.sighting.boastful': [
    'One thing I can swear to with absolute conviction, having seen the world as I have: {target} was in {room}.',
    '{target} was in {room} then. I’ve prided myself on my powers of observation, and this much is beyond question.',
    'I saw {target} in {room} with my own eyes. My powers of observation have rarely deceived me.',
    '{target} was in {room} at that hour. I’ve prided myself on such accuracy for decades.',
  ],
  'claim.glimpse.boastful': [
    'Near {room} I glimpsed a figure. I saw no face, but clearly: someone who {trait}.',
    'I caught only a glimpse of whoever passed near {room}. The figure {trait} — that much I saw.',
    'Someone moved past {room}. Face was hidden, but the figure {trait}. I’ve an eye for such details.',
    'A figure near {room} caught my attention. Couldn’t see the face, but they {trait} — quite distinctly.',
  ],
  'claim.culpritAttr.trait.boastful': [
    'Mark me: the one you want {trait}. I’ve had a lifetime of reading character, and this I know for certain.',
    'The killer is someone who {trait}. I’ve read enough character to recognise it.',
    'Mark me: whoever did it {trait}. I’ve spent a lifetime learning such signs.',
    'Your murderer {trait}. I’ve seen enough of the world to know certainty when I feel it.',
  ],
  'claim.alignment.good.boastful': [
    'You may leave {target} out of it. I’ve too much experience with the human heart to mistake their worth.',
    '{target} is innocent. I know character, and {target} hasn’t the sort for this.',
    'You may strike {target} from your list. My experience tells me so.',
    '{target} is true. I’d stake a great deal on it.',
  ],
  'claim.alignment.evil.boastful': [
    'There is something wrong with {target} — something I recognised from the very first, having spent a life studying such matters.',
    '{target} is guilty of this business. I recognised it from the start.',
    '{target} carries guilt. I’ve spent decades learning to spot such things.',
  ],
  'claim.relationship.self.devoted.boastful': [
    'Lord Blackwood was my dearest friend. Closer than family, truly.',
    'I loved his lordship deeply. That is the honest truth of it.',
    'His lordship was my closest friend in this world. I’ve wept for the loss.',
  ],
  'claim.relationship.self.cordial.boastful': [
    'We liked one another. It was a good understanding, quite genuine.',
    'We were on good terms, entirely cordial. Nothing more, nothing less.',
    'We got on rather nicely, his lordship and I — cordial all the way through.',
  ],
  'claim.relationship.self.strained.boastful': [
    'We had our frictions of late. A coolness had developed between us.',
    'There was a distance between us lately. I shan’t pretend otherwise.',
    'A coolness had grown between us. Not openly hostile, but chilly.',
  ],
  'claim.relationship.self.hostile.boastful': [
    'I hated him — there. I’ve not the patience for dissembling, and everyone in this house will have heard as much.',
    'I hated him. I’ve never been one for false tears.',
    'We despised one another. The whole house knew it.',
  ],
  'claim.relationship.self.indebted.boastful': [
    'He held my debts. Serious ones, the sort that weigh on one’s mind.',
    'I owed his lordship money. A considerable sum — and I don’t hide it.',
    'I owed his lordship a sum I do not relish admitting. A considerable one.',
    'Yes, I owed him money — and I’ve faced worse than debt in my time, I can tell you.',
  ],
  'claim.relationship.self.jilted.boastful': [
    'He threw me over years ago. I’ve managed magnificently since.',
    'We were nearly engaged once. He ended it, and I’ve moved on splendidly.',
    'He jilted me long ago. I’ve built an excellent life regardless.',
  ],
  'claim.relationship.gossip.devoted.boastful': [
    '{subject} was devoted to {victim} entirely. I’ve seen such attachments often.',
    '{subject} loved {victim} dearly. That was plain to anyone observant.',
    '{subject} was utterly devoted to {victim}. I’ve witnessed such affection in my years.',
  ],
  'claim.relationship.gossip.cordial.boastful': [
    '{subject} and {victim} were on good terms. Simple and genuine.',
    '{subject} and {victim} were on amiable terms. Entirely pleasant, nothing more to tell.',
  ],
  'claim.relationship.gossip.strained.boastful': [
    'A coolness had developed between {subject} and {victim}. Quite visible.',
    '{subject} and {victim} had grown strained. One felt the chill.',
  ],
  'claim.relationship.gossip.hostile.boastful': [
    '{subject} and {victim} had genuine enmity. I recognised it at once.',
    '{subject} hated {victim} with a passion that filled every room they shared together.',
    '{subject} and {victim} could not abide one another. Open enmity, {detective}.',
    '{subject}’s loathing for {victim} was plain as day — one did not need to guess at it.',
  ],
  'claim.relationship.gossip.indebted.boastful': [
    '{victim} held paper on {subject} — debts, old and growing, a situation I’ve navigated rather more successfully than most.',
    '{victim} held paper on {subject}, and the amounts were most impressive indeed.',
    '{subject} was in {victim}’s debt to a degree that rather weighed upon {subject}.',
    '{victim} had {subject} in a financial grip — debts of the sort that breed resentment.',
  ],
  'claim.relationship.gossip.jilted.boastful': [
    '{victim} jilted {subject} in the past, and {subject} has not forgotten the humiliation.',
    '{subject} was abandoned by {victim} long ago, and {subject} bore that scar to this day.',
  ],
  'claim.heard.crash.boastful': [
    'During that hour came a crash from {room}. Not the storm, I assure you.',
    'There was a noise from {room} — something giving way. I heard it clearly.',
    'I heard a crash from {room} during that hour — something heavy falling or glass breaking.',
    'A crash from {room}, I heard it clearly. Not the storm — something else entirely.',
  ],
  'claim.heard.quarrel.boastful': [
    'I heard quarrelling from {room} before supper. His lordship was involved.',
    'Someone was arguing fiercely in {room} that afternoon. I’ve heard anger before.',
    'I heard quarrelling from {room} before supper — angry voices, though I could not make out words.',
  ],
  'claim.suspicion.boastful': [
    '{target} has looked wrong to me all evening. I trust my instinct.',
    'I have had my eye on {target}. A feeling rather than proof.',
    'If I name someone, it would be {target}. I rarely misjudge.',
    '{target}. That is where suspicion points, and I’ve good instincts.',
  ],
  'reaction.plain.boastful': [
    'I have been waiting for you to come to me, {detective}. I’ve had practice in such interviews, and I don’t frighten easily.',
    'A dreadful business. I’ve seen worse, but not by much. Ask what you need.',
    'A black night indeed for this house. I’m prepared to answer any question you care to ask.',
  ],
  'reaction.heard.crash.boastful': [
    'I have real information for you, {detective}. Something worth your attention.',
    'I’ve been sitting with something all evening. It concerns a crash.',
    'There is a thing I heard that you should know about.',
  ],
  'reaction.heard.quarrel.boastful': [
    'I should tell you now what I heard earlier in the day.',
    'What you ought to know: I heard something before supper.',
    'I’ve kept silent from a sense of propriety, but that serves no one.',
  ],
  'reaction.accuse.boastful': [
    '{target}. There. I’ve said what needed saying.',
    'I shall say it plainly: {target}. Watch the eyes.',
    '{target}. That is my answer, without hesitation or doubt.',
    'I shall not mince words. {target} is the answer you’re seeking.',
  ],
  'reaction.referral.boastful': [
    'His lordship was writing in {room} all afternoon. Look there.',
    '{victim} spent hours locked in {room}, writing something. You should examine it.',
    'The answer may lie in {room}. {victim} was there all afternoon.',
  ],
  'role.vague.boastful': ['My role? Nothing dramatic. I was simply here.'],
  'role.claim.boastful': [
    'I shall not fence with you, for I’ve never had the patience for such games.',
    'You’ll have it plainly. I’ve no patience for evasion.',
    'I shall not dance around it — you may as well have it plainly.',
    'Very well. I’ve never had patience for circling about such matters.',
  ],
  'alibi.alone.boastful': [
    'My whereabouts? Nothing simpler — I’m rather good at accounting for myself.',
    'Where was I? I remember perfectly. I’m good with such details.',
    'My whereabouts during that hour? Nothing simpler — I remember every moment perfectly.',
  ],
  'alibi.company.boastful': [
    'There I am on firm ground, with the testimony of others who are, I think, rather credible.',
    'Happily, I was not alone. My companions will confirm it.',
  ],
  'knowledge.vague.boastful': [
    'You are fishing, {detective} — and you’ve chosen a poor spot, for I’m rather careful about what I reveal.',
    'You are fishing, and you’ve chosen the wrong angler.',
    'I prefer not to speculate. Not my sort of thing.',
  ],
  'knowledge.share.boastful': [
    'You shall have the honest truth of it from me.',
    'I shall be plain with you. Here is what I know.',
    'What I can tell you is this — and I do not offer it lightly.',
    'I shall deal with you squarely, for I’ve never found deceit to serve me well.',
  ],
  'knowledge.hedged.boastful': [
    'Facts I have, and conclusions I leave to you, for I’ve seen enough to know that interpretation is everything.',
    'Facts I have. Conclusions rest with you, though I have opinions.',
    'What follows is what I know — though conclusions I leave to you, as is proper.',
  ],
  'suspect.point.boastful': [
    '{target}. That is whom I suspect, and I trust my judgement.',
    'It is {target}. I cannot give you proof, but I’m certain.',
    '{target} — everything about tonight points that way.',
    '{target}. I rarely misjudge such matters.',
  ],
  'suspect.hedge.boastful': [
    'If I named someone, it would be {target}. Though I could argue otherwise.',
    '{target}. Though I’ve been wrong before, and have no proof.',
    'Pressed for a name, I’d say {target}. But I’m not entirely sure.',
  ],
  'suspect.none.boastful': [
    'I would sooner not guess, for I’ve built my reputation on knowing what I actually know. {person} may not need my speculation.',
    'I cannot name anyone with certainty. {person} has noticed more.',
    'No name comes to mind with conviction. {person} might know better.',
  ],
  'about.person.boastful': [
    'Since you ask about them: I’ve made it my business to observe people rather carefully.',
    'What I can tell you is small, though it is honest — I’ve never trafficked in falsehoods when truth will serve.',
    'I can say a little there, for I’ve had rather more occasion to note them than some might expect.',
  ],
  'about.referral.boastful': [
    'Ask {person}. {person} will have the answer you want.',
    'That question is better put to {person}, who was there and can speak with authority.',
    '{person} has better knowledge of that business than I do, I’m certain.',
  ],
  'about.nothing.boastful': [
    'You would learn more from the cat — and I say that not unkindly, but from experience.',
    'I could tell you very little about that business.',
    'That person remains a mystery to me. I know nothing.',
  ],
  'about.victim.boastful': [
    'His lordship and I — you want to understand that business. Fair enough.',
    'As to my connection with the victim — it is a question I’ve been expecting.',
    'His lordship and I? A story worth hearing, like most of mine.',
    'You ask how we stood. I shall tell it better than anyone else could.',
  ],
  'evidence.deny.boastful': [
    'That is not mine. One finds such things anywhere.',
    'I shan’t pretend it’s mine. One sees them everywhere in old houses.',
    'That did not come from me. I’ve been in enough houses to know.',
    'Not mine. Houses are full of such things.',
  ],
  'evidence.identify.boastful': [
    'That did not come from me. But hold it up against our guests and you will see.',
    'Not my property — but there is someone in this house it very much does belong to.',
  ],
  'evidence.trace.own.boastful': [
    'That is mine, I’m afraid — and I’m rather glad of it, for it bears out precisely what I told you.',
    'Yes, mine — and I’m pleased to say that it confirms my account rather definitively, if you’re at all willing to listen.',
    'Mine, and I am delighted it’s been found. It says exactly what I said, for I’ve nothing to hide.',
  ],
  'evidence.weapon.deny.boastful': [
    'I could have used that, yes — but I did not.',
    'Access I had. I simply did not take it, you see.',
    'I could have done it, plainly. I did not, and that is the plain truth.',
    'I had access to that, yes. But having means is not the same as using them.',
  ],
  'evidence.weapon.comment.boastful': [
    'I could not accomplish that. Somebody else’s deed.',
    'I lack the capacity for such work. Someone else’s action entirely.',
    'Grim work, and not within my abilities — as you can plainly observe.',
    'I could not manage such a thing. Somebody else’s business, evidently.',
  ],
  'evidence.lockbox.boastful': [
    'The box was forced? Then you have a thief and a killer.',
    'A thief as well as a murderer — this evening grows darker.',
    'The lock was broken? Then two crimes were committed tonight.',
    'A thief in this house alongside the killer. Desperate times.',
  ],
  'evidence.doc.deny.boastful': [
    'That paper twists things terribly. Let me tell you how it actually was.',
    'That is not the whole truth. Far from it.',
    'You have something misleading there. The truth was quite different.',
    'That document does not tell the true account of things.',
  ],
  'evidence.doc.confirm.boastful': [
    'Yes, that is genuine. I’ve been expecting you to find it.',
    'I shan’t pretend otherwise. That is authentic.',
  ],
  'evidence.doc.gossip.boastful': [
    'I am not surprised by that document. Let me explain why.',
  ],
  'evidence.doc.comment.boastful': [
    'That is the first I have seen of it — and I’ve not the time to speculate on things beyond my knowledge.',
    'That paper is new to me. It makes uncomfortable reading.',
    'I’ve never seen that before. Someone’s private sorrow, laid bare.',
  ],
  'evidence.flavor.boastful': [
    'That is merely something lying about. Every house has such things.',
    'That? It was here before this evening. I doubt it matters.',
    'Rubbish. One finds such things in every room. It signifies nothing.',
  ],

  // =====================================================================
  // BLUNT — plain words from someone with work waiting.
  // =====================================================================
  'claim.role.blunt': [
    'I’m {roleName}. There’s the straight of it.',
    'I am {roleName}. No dressing it up.',
    'I am {roleName}. Write it down and we can both get on.',
  ],
  'claim.whereabouts.alone.blunt': [
    'I was in {room}, alone the whole of it.',
    '{room}, that’s where I was. By myself, which doesn’t help me.',
    'Alone in {room} when it happened. Plain as that.',
  ],
  'claim.whereabouts.company.blunt': [
    'I was in {room} with {companions} the whole time.',
    'I spent that hour in {room} with {companions}. Ask either of us.',
    '{companions} and I were in {room} the whole while, neither of us left.',
    'In {room}, that’s where I was — with {companions}, and we didn’t stir.',
  ],
  'claim.sighting.blunt': [
    '{target} was in {room}, I saw {target} plainly.',
    'In {room}, I clapped eyes on {target}. That much is solid.',
    '{target} was there in {room}, no question of it.',
  ],
  'claim.glimpse.blunt': [
    'A figure by {room}, too quick to know. One thing certain: that person {trait}.',
    'I saw someone by {room}. Couldn’t see the face. But I saw the figure {trait}.',
    'There was a figure near {room} — the light was poor, but this much was plain: the person {trait}.',
  ],
  'claim.culpritAttr.trait.blunt': [
    'Your murderer {trait}. That’s what I can tell you.',
    'Whoever did this {trait}. That’s the only mark I can give you.',
    'Whoever did it {trait}. That’s certain.',
    'Your killer {trait}. No doubt in my mind.',
  ],
  'claim.alignment.good.blunt': [
    '{target} is honest. Strike that name from your list — I’m certain of it.',
    'You can forget about {target}. That one’s true.',
    'Cross {target} off your list. I’d wager my hide on it.',
    '{target} is solid. Mark it down and move on.',
  ],
  'claim.alignment.evil.blunt': [
    '{target} is not what {target} pretends to be. I’d stake my name on it.',
    'Watch {target} well. That one’s got a flaw underneath.',
    '{target} wears a false face. I’ve smelled it out.',
  ],
  'claim.relationship.self.devoted.blunt': [
    'I’ll not hide it — I was devoted to his lordship. He knew it.',
    'No one in this house held him dearer than I did.',
    'I thought highly of him. He meant more to me than most.',
    'I counted him as a true friend. That’s the plain truth.',
  ],
  'claim.relationship.self.cordial.blunt': [
    'Things stood fair between us. Nothing more, nothing less.',
    'We were pleasant enough together. No more than that, no less.',
    'Perfectly civil. That was all there was between us.',
    'We rubbed along well enough, nothing deeper.',
  ],
  'claim.relationship.self.strained.blunt': [
    'We had friction between us. I’ll not lie about that now.',
    'Things had grown cool of late. Civil enough, but cool.',
    'There was a distance there. We were polite and nothing more.',
  ],
  'claim.relationship.self.hostile.blunt': [
    'I hated him. Plain to say and done with it now.',
    'I loathed him — that’s the truth of it.',
    'We couldn’t abide each other, and the house knew it.',
  ],
  'claim.relationship.self.indebted.blunt': [
    'He held my debts over my head. Money I couldn’t repay.',
    'I was in his debt. A sum I couldn’t settle.',
    'Money passed between us — money I still owed him.',
    'He held paper on me. Debts that wouldn’t be forgiven.',
  ],
  'claim.relationship.self.jilted.blunt': [
    'He threw me over years ago. One doesn’t forget such things.',
    'He broke off our engagement. That’s the plain of it.',
    'Once he promised me the world, then thought better of it.',
    'We had an understanding, long ago. He ended it, I’ve gone on.',
  ],
  'claim.relationship.gossip.devoted.blunt': [
    '{subject} cared for {victim} more than for anyone. That was clear.',
    '{subject} thought the world of {victim}. No question of it.',
    '{subject} was truly attached to {victim}. You could see it plain.',
  ],
  'claim.relationship.gossip.cordial.blunt': [
    '{subject} and {victim} were on easy terms — nothing more, nothing less.',
    '{subject} was perfectly civil with {victim}. That’s the whole of it.',
    'I never saw ill feeling between {subject} and {victim}. All smooth.',
  ],
  'claim.relationship.gossip.strained.blunt': [
    'The air between {subject} and {victim} had turned cold. You felt it.',
    '{subject} and {victim} kept their distance of late. One noticed.',
    '{subject} and {victim} were civil but distant — like winter between them.',
  ],
  'claim.relationship.gossip.hostile.blunt': [
    'I do not use the word lightly: {subject} and his lordship despised each other.',
    '{subject} and {victim} were set against each other — bitter it was.',
    '{subject} could not abide {victim}. Everyone knew it.',
  ],
  'claim.relationship.gossip.indebted.blunt': [
    'His lordship held {subject}’s debts. Old ones, growing old with interest.',
    '{subject} had borrowed from {victim}, and the debt sat heavy between them.',
    '{victim} held notes on {subject} — money that ate away at things.',
  ],
  'claim.relationship.gossip.jilted.blunt': [
    '{subject} was promised to {victim} once, long ago. Then {victim} thought better of it.',
    '{victim} cast off {subject} years back. {subject} carries that still.',
    '{subject} and {victim} were to wed, once. {victim} backed away. {subject} hasn’t forgotten.',
  ],
  'claim.heard.crash.blunt': [
    'I heard something break in {room}. A sharp noise — glass or a lock giving way.',
    'A sharp sound from {room}, like something giving. Glass or wood, I couldn’t say.',
    'From {room}, I heard a crack — clear and hard. Either a lock or a pane.',
  ],
  'claim.heard.quarrel.blunt': [
    'Voices raised in {room} that afternoon — a row, though I couldn’t catch the words.',
    'I heard quarrelling from {room} earlier — angry, but the words were muffled.',
    'Someone in {room} was shouting earlier in the day. A proper quarrel, not a tiff.',
  ],
  'claim.suspicion.blunt': [
    'If I had to point a finger, it’d be at {target}.',
    '{target} has been wrong somehow all evening. Can’t say how, but wrong.',
    'My gut says {target}. That’s all I can tell you.',
    'There’s something off about {target}. I feel it in my bones.',
  ],
  'reaction.plain.blunt': [
    'I’m ready to be questioned. Get on with it, then.',
    'Well, you’ll want the truth of us all. Ask away.',
    'A dreadful business. You’ll want to question us all, I expect.',
    'A dark turn. Ask what you need — I’ve nothing to hide.',
  ],
  'reaction.heard.crash.blunt': [
    'There’s something you ought to know before you start.',
    'Listen — I heard something you’ll want to know about.',
    'There’s something you need to know about. I heard something that matters.',
    'I’ve something to tell you before we go further. You’ll want to hear it.',
  ],
  'reaction.heard.quarrel.blunt': [
    'I’ve kept this quiet out of politeness. Politeness is done now.',
    'I should have spoken earlier. There’s a thing you need to hear.',
    'Something I kept to myself today. It’s yours to know now.',
    'There was something earlier that might matter. Let me tell you.',
  ],
  'reaction.accuse.blunt': [
    'No use wasting time on the rest of us. {target} is the one.',
    'I’ll speak plain: {target} is your answer.',
    'You’re wasting the evening. {target} is the answer, clear as day.',
  ],
  'reaction.referral.blunt': [
    'One thing: his lordship shut himself in {room} all afternoon, writing. Look there if I were you.',
    'The dead man was in {room} the whole afternoon, penning something. Worth a look.',
    '{victim} spent hours in {room} writing. That’s where your answers might be.',
  ],
  'role.vague.blunt': [
    'You want secrets? Earn them first.',
    'My part in the evening? You haven’t earned that answer yet.',
    'That’s between me and my conscience. Ask me something else.',
    'What part did I play? I’ll tell when I know you better.',
  ],
  'role.claim.blunt': [
    'Right, then. Here’s the truth of it.',
    'I’ll lay it plain for you.',
    'You want the straight account? Here it is.',
    'Then listen — this is how it was.',
  ],
  'alibi.alone.blunt': [
    'Where I was that hour? Simple enough.',
    'That’s easily answered, the where of it.',
    'My location during the hour? I can tell you.',
    'You want to know where I was. Fair question.',
  ],
  'alibi.company.blunt': [
    'I’ve witnesses, thank goodness.',
    'There I have no trouble — I was not alone.',
    'That part’s solid. I have a witness to it.',
    'I’m fortunate there. I’ve company to vouch for me.',
  ],
  'knowledge.vague.blunt': [
    'That’s a question that takes some thinking.',
    'I’m not sure what I know, to be plain.',
    'You’re asking things I haven’t sorted through myself yet.',
    'I might know things. I might not. Ask me again.',
  ],
  'knowledge.share.blunt': [
    'I’ll give it to you straight, then.',
    'Here’s what I know, and nothing dressed up.',
    'Listen — this is the honest of it.',
    'I’ve got facts for you. Take them as you will.',
  ],
  'knowledge.hedged.blunt': [
    'I’ve a thought, though it might point either way.',
    'What I’m about to say — it could mean things.',
    'Here’s what I’ve gathered. Make of it what you will.',
  ],
  'suspect.point.blunt': [
    'You asked. {target}. That’s the name.',
    'Point my finger? {target}. That’s who I’d mark.',
    'The name that comes to me is {target}.',
    '{target}. I’ve nothing but a feeling to show for it.',
  ],
  'suspect.hedge.blunt': [
    'If you pressed me, {target} — but don’t press me too hard.',
    'My guess would be {target}. But that’s all it is.',
    '{target} stands out to me — but so do one or two others.',
    'I’d sooner not name a name. But if I must — {target}.',
  ],
  'suspect.none.blunt': [
    'No name comes to me, not plainly anyway.',
    'I can’t pin it on anyone, truly.',
    'That’s beyond my knowing. But {person} might know more.',
    'No — I won’t guess a name. Ask {person} instead.',
  ],
  'about.person.blunt': [
    'About that one? I’ve a thing or two.',
    'You want to know? I can tell you.',
    'There I have an observation or two.',
  ],
  'about.referral.blunt': [
    'That’s beyond what I know. {person} would be the one to ask.',
    '{person} knows more of that than I do.',
    'I couldn’t say. But {person} — there’s the one who could.',
    '{person} was closer to all that. Ask there.',
  ],
  'about.nothing.blunt': [
    'I’ve nothing worth saying about that one.',
    'They kept to themselves. I’ve little to tell.',
    'That’s not a person I knew well.',
    'You’d have better luck asking the cat, honestly.',
  ],
  'about.victim.blunt': [
    'How I stood with him? The truth of it is this:',
    'Our standing with each other? That’s a fair question.',
    'You’ll want to know how we were, I expect.',
    'Where did I stand with him? I’ll be plain about it.',
  ],
  'evidence.deny.blunt': [
    'It is not mine. Not because I’m difficult. Because it’s the truth.',
    'Not mine. There’s dozens of those about.',
    'No — that’s not of mine. I’d swear it.',
    'That’s not mine. And if I’m sure of anything, it’s this.',
  ],
  'evidence.identify.blunt': [
    'Not mine. And you can see well as I who it belongs to.',
    'You want to match that to someone. Not me. Look at the guests and tell me who.',
    'Not mine. But you’ll find its match here in the house somewhere.',
    'Not on me. But I wager you can see where it belongs.',
  ],
  'evidence.trace.own.blunt': [
    'Mine. It shows where I was, just as I told you.',
    'That’s mine. You can match it to the place I told you.',
    'Mine, and a comfort to me it is. Shows I was truthful.',
    'That belongs to me. It proves what I said, plain and simple.',
  ],
  'evidence.weapon.deny.blunt': [
    'I could have used it, yes. I didn’t. That’s the plain of it.',
    'Aye, it was at hand. But having a tool and using it are different things.',
    'I could have — anyone could have. But I didn’t.',
    'Means I had. Will to use it — no.',
  ],
  'evidence.weapon.comment.blunt': [
    'Grim business. And beyond my capacity, as you well know.',
    'Beyond what I could manage. You see that, surely.',
    'Not in me to do that. Anyone can see it.',
  ],
  'evidence.lockbox.blunt': [
    'A thief and a killer both in this house tonight. Dreadful.',
    'So there’s a theft as well as a murder. The house is broken.',
    'Forced? Then someone needed what was in it badly.',
    'A man murdered and his house robbed. Who does such a thing?',
  ],
  'evidence.doc.deny.blunt': [
    'Papers say what someone wants them to say. Here’s how it actually was:',
    'That’s not what it looks like. The truth is this:',
    'That’s lies dressed up in ink. Let me tell you how it was:',
    'That paper tells only half the story — here’s the other half:',
  ],
  'evidence.doc.confirm.blunt': [
    'Yes, that’s genuine. I can’t deny it now.',
    'Yes — authentic. Won’t pretend otherwise to save myself.',
    'Yes — it’s authentic. No point lying now.',
    'That’s real. You’ve got the proof of it.',
  ],
  'evidence.doc.gossip.blunt': [
    'So it’s written out plain. I heard whispers of it.',
    'That tells what I’ve long suspected. Let me explain.',
    'Written down, then. I’d heard similar in quiet moments.',
    'That paper puts words to a thing I’ve long observed.',
  ],
  'evidence.doc.comment.blunt': [
    'That’s not mine to speak on. Its owner might.',
    'I’ve nothing to say on that. It’s not my paper.',
    'That reads like private business. Not for me to explain.',
    'Raw stuff. And not mine to defend or deny.',
  ],
  'evidence.flavor.blunt': [
    'No — that’s just clutter. Not worth the {detective}’s eye.',
    'That means nothing at all. Every room’s got a dozen.',
    'Nothing there but common objects. See them everywhere in a house.',
  ],

  // =====================================================================
  // RAMBLING — arrives at the point eventually, by way of the weather.
  // =====================================================================
  'claim.role.rambling': [
    'I suppose the honest answer is: I am {roleName}. The rest gets rather involved.',
    'Bit of a puzzle, really — I am {roleName}, but what that entails is quite another matter entirely.',
    'You’ll want to know my role in all this: I am {roleName}, which came as some surprise even to myself.',
    'Well, now, what was I exactly? I am {roleName}, though the title hardly conveys the complexity of one’s actual situation that evening.',
  ],
  'claim.whereabouts.alone.rambling': [
    'I was in {room}, by myself the whole duration, which leaves me rather exposed, I fear.',
    '{room} is where I remained, unaccompanied, save for my own melancholy thoughts and the ticking of the clock.',
    'I was in {room}, quite solitary, which the weather made rather gloomy though I suppose that hardly matters now.',
  ],
  'claim.whereabouts.company.rambling': [
    'Where was I? The season has been so damp, which of course affects one’s circulation and one’s disposition, and speaking of disposition — I was in {room} with {companions}, and there we remained throughout.',
    'I was in {room} throughout the evening with {companions}, neither of us straying for an instant, which they would confirm if asked.',
    'In {room}, I stayed, with {companions} keeping me — or perhaps I keeping them — company the entire time.',
    '{room} held us both that evening: myself and {companions}, throughout the crucial hour.',
  ],
  'claim.sighting.rambling': [
    'That hour I glimpsed {target} in {room}, which is as plain a fact as the roses failing to bloom this year despite all my nephew’s promises of better soil.',
    '{target} was in {room}, I saw {target} there — or was it earlier? No, during that hour. Hours do blur together, like spring afternoons.',
    'I caught sight of {target} in {room} during that hour, quite unmistakably — the sort of thing one doesn’t easily forget, though my memory for other things isn’t what it once was.',
  ],
  'claim.glimpse.rambling': [
    'I saw a person pass near {room}, nothing more — the light was poor, my eyes not what they were — but this much I noted: the figure {trait}, of that I am certain.',
    'I saw a figure near {room}, though the shadows prevented me from seeing clearly — but this much I noted: whoever it was {trait}.',
    'I caught sight of someone in the darkness near {room} — no face discernible, naturally — but the gait, the bearing: the person {trait}.',
    'There was movement near {room} that evening; I glimpsed a form, but the features escaped me. Still, I’m certain: the figure {trait}.',
  ],
  'claim.culpritAttr.trait.rambling': [
    'The person you seek {trait} — that’s what I observed, in all the confusion of the evening.',
    'There’s one detail about the guilty party that troubles me deeply: whoever did it {trait}. Mark that down.',
    'If I were forced to name one particular thing about the killer, it would be this: the one who did it {trait}.',
    'The murderer — and I say this with some hesitation, you understand — is someone who {trait}. I am quite certain of that much.',
  ],
  'claim.alignment.good.rambling': [
    'Look to anyone but {target}; I know {target} well enough to stake everything on {target}’s integrity.',
    'Strike {target} from your list with confidence. I know the matter well, and {target} is above reproach.',
    '{target} is true as they come — one learns to read these things through long years, and I am certain of this.',
    'Whatever suspicions you may harbour, {target} is honest through and through — I would wager my reputation on it, such as it is.',
  ],
  'claim.alignment.evil.rambling': [
    'There is something about {target} that does not sit right with me, never has, rather like the way milk curdles in warm weather without warning — and tonight I am quite certain of it.',
    'There’s something deeply wrong with {target}, something that troubles me every time we’re at table together, and tonight I am quite convinced of it.',
    'There is something profoundly wrong with {target}, and while I’ve no proof as one might hang on a wall, I am deeply convinced of it.',
    '{target} is not trustworthy, not in any meaningful way, which troubles me greatly when I consider what’s happened.',
  ],
  'claim.relationship.self.devoted.rambling': [
    'I loved him dearly, there is no point dissembling about it — people will think what they like, as they always do, but the truth is I was devoted to him, quite genuinely so.',
    'My attachment to him was genuine and deep, and I do not care who knows it, for all the world will point fingers anyway, but I have wept tonight and shall weep more.',
    'He was everything to me — not merely a friend, but someone whose loss leaves a void that won’t soon be filled, if ever.',
    'I loved him dearly; there’s no use dissembling about it now that he’s gone.',
  ],
  'claim.relationship.self.cordial.rambling': [
    'We got on amicably enough, without quarrels or debts or any unpleasantness between us whatsoever.',
    'Cordial is the word, precisely: we rubbed along nicely without friction or awkwardness of any kind.',
    'We were friendly in the way one is with someone you see regularly — civil, amiable, without complication.',
    'His lordship and I got on well enough, pleasantly but without any great depth to it, which was perfectly satisfactory to us both.',
  ],
  'claim.relationship.self.strained.rambling': [
    'We were civil to one another, as one is, but the ease had gone out of it, like a clock that no longer keeps proper time but still goes through the motions.',
    'The ease had gone out of our relations some time ago, like milk that gradually sours without warning, and the coolness had grown considerable.',
    'There was a distance between us that had grown wider, though we maintained appearances at all times.',
    'Things had become strained, if I’m being honest — we were polite but the warmth had departed entirely.',
  ],
  'claim.relationship.self.hostile.rambling': [
    'The man and I loathed each other, which the whole house knew, so I see no reason to pretend otherwise now that he is dead.',
    'I hated him — there’s no purpose pretending sentiment now that he’s dead.',
  ],
  'claim.relationship.self.indebted.rambling': [
    'Money changed hands between us, or rather, money did not change hands when it should have, which reminds me of the time my brother borrowed against the estate and never did repay it.',
    'I owed him a considerable sum, which he took great pleasure in reminding me of, which reminds me of my uncle’s troubles some years back with creditors.',
    'The financial obligation weighed upon me — notes of hand held by someone who enjoyed reminding one of them.',
  ],
  'claim.relationship.self.jilted.rambling': [
    'There was an understanding between us, years ago — ancient history now, though these things never quite leave one — and he threw me over for reasons that seemed important at the time.',
    'We were nearly engaged once, which would have changed everything, but he came to his senses, as he saw it, and so that was the end of that chapter.',
    'We were once to marry, years ago, though he thought better of it and so that chapter closed, much as I’ve tried not to dwell on it.',
    'He threw me over, which one doesn’t forget, though life has carried on reasonably well despite that earlier wound.',
  ],
  'claim.relationship.gossip.devoted.rambling': [
    'The closeness between {subject} and {victim} was real and deep, not the superficial sort one puts on for show.',
    '{subject} worshipped {victim}, plainly and truly, which made the whole household notice it, as one always does with such things.',
    '{subject} was absolutely devoted to {victim}, there’s no question — anyone with eyes could see the genuine affection between them.',
    '{subject} worshipped {victim}, absolutely — anyone who was not blind could see it, the way one sees that the roses have suffered this year.',
  ],
  'claim.relationship.gossip.cordial.rambling': [
    '{subject} and {victim} got along well — nothing more, nothing less — the way two people do when there is no particular reason to quarrel.',
    'I never detected anything amiss between {subject} and {victim} — they were simply fond of one another in the ordinary way.',
    '{subject} and {victim} were quite pleasant with one another — the sort of quiet friendliness that develops between people who simply don’t have much to quarrel about, really.',
    '{subject} and {victim} got on well enough, you know — they had that sort of cordial understanding that develops when two people find nothing to quarrel about.',
  ],
  'claim.relationship.gossip.strained.rambling': [
    'There had been a falling-out between {subject} and {victim}, which one felt at table, the way one feels a draughty window — not obvious, but perceptible to anyone paying attention.',
    '{subject} and {victim} were polite to one another, that careful sort of polite that comes after disappointment — rather like the way my aunt and uncle got on after their quarrel about the silver.',
    '{subject} and {victim} maintained a careful politeness, the sort that follows disappointment, though such things become easier to see as one grows older.',
  ],
  'claim.relationship.gossip.hostile.rambling': [
    'The hatred between {subject} and {victim} was quite real — the sort that creates a palpable tension at table, like static before a storm.',
    '{subject} and {victim} were at complete odds, which reminds me rather of the quarrel my neighbours had some years back, though this was decidedly worse.',
    'The hatred between {subject} and {victim} was palpable, the kind that creates a chill at table when they were both present.',
    '{subject} and {victim} despised one another with a passion that was almost visible in the air between them, which everyone in the house felt.',
  ],
  'claim.relationship.gossip.indebted.rambling': [
    '{victim} held paper on {subject} — notes of hand, debts, the usual sordid business — and it was a thing that poisoned the air between them.',
    'Money was the matter between {subject} and {victim}, quite a lot of it, the sort of debt that a person either pays or comes to regret bitterly.',
    '{subject} owed {victim} money, quite a substantial sum — the sort of debt that creates tension between people, much as it does in life generally.',
    '{victim} held certain financial obligations from {subject} — paper and notes, you know — the sort of thing that becomes rather burdensome if one thinks too hard about it.',
  ],
  'claim.relationship.gossip.jilted.rambling': [
    '{victim} had broken an engagement with {subject} long ago — these wounds do not heal, they merely scar over, as I have observed in my years.',
    '{subject} was thrown over by {victim}, and one never quite forgets such a thing, though one learns to hide it under civility.',
    'There had been an understanding between {subject} and {victim}, years in the past, and {victim} ended it without grace, which is a thing {subject} has never forgotten.',
  ],
  'claim.heard.crash.rambling': [
    'There came a noise from {room} whilst I was occupied with my own thoughts — a splintering sound, or metal, I could not quite determine which — but something definitely gave way.',
    'I heard something break in {room}, which reminds me of the time the chandelier in the old wing nearly fell, a most alarming noise it made, and this was much the same.',
    'A noise from {room} reached my ears — a crash, or something giving way — and whilst I told myself it was thunder or the storm, I knew better.',
  ],
  'claim.heard.quarrel.rambling': [
    'There was shouting from {room} in the afternoon, quite unmistakable as an argument, though I could not say precisely what was said — one does not press one’s ear to doors, after all.',
    'There were raised voices from {room} that afternoon — bitter quarrelling, though I caught no words, merely the tone of deep animosity.',
  ],
  'claim.suspicion.rambling': [
    'If I must speak plainly, I have had my eye on {target} all evening — though I cannot say precisely why, it is the sort of thing one feels rather than knows.',
    'I do not make accusations, you understand, but {target} has struck me as being rather wrong tonight — off-colour, as they say — though I cannot point to any one thing.',
    'My suspicion, if I must have one, falls upon {target}, and I base it on nothing more than instinct and the way people carry themselves when they are troubled.',
  ],
  'reaction.plain.rambling': [
    'This is a black night indeed for the house, though not as black as the night my cousin was caught in the flood of ’98, but no matter — you will want questions answered.',
    'What a dreadful turn of events, quite unprecedented in my experience, and I have had a long experience — so please, proceed with your investigation as you see fit.',
    'A terrible night for the house, though I’ve seen dark nights before — but this is something else entirely. What will you need from me?',
    'This is most dreadful. Please proceed with your questioning; I shall answer as truthfully as I can manage.',
  ],
  'reaction.heard.crash.rambling': [
    'I have something you ought to know straightaway, before you begin with your questions, for there is a fact that may prove relevant.',
    'Before you settle to your questioning, I should tell you that I heard something — a sound that struck me as peculiar at the time.',
    'There is a thing I did not mention to anyone until now, though I have been turning it over in my mind all evening.',
  ],
  'reaction.heard.quarrel.rambling': [
    'There is something I kept to myself, partly out of discretion, partly because I was not sure it signified, but given what has happened, I think you ought to know.',
    'I have been holding my tongue about a matter, as one does, not wishing to stir up trouble, but the time for discretion has passed, I think.',
    'There’s something I ought to have mentioned earlier, but I hesitated out of a sense of discretion that now seems rather misplaced.',
  ],
  'reaction.accuse.rambling': [
    'If I were you, I should focus my attention on {target}, for I am quite certain that is where the answer lies.',
    '{target} is the one, you know — I’ve been thinking about it all evening, turning it over in my mind — and everything points to {target}, quite unmistakably.',
    'If I had to say, and I suppose I must, it’s {target} — there’s something about {target} that doesn’t sit quite right, the way certain people don’t sit right.',
  ],
  'reaction.referral.rambling': [
    '{victim} spent the afternoon locked away in {room}, writing, which reminds me that he was never one to confide his business, but you might find something instructive if you looked.',
    'One thing I should mention — {victim} was occupied in {room} the whole of the afternoon, writing, you see, very much immersed in it, and I expect those papers are still sitting there.',
    '{victim} spent the afternoon in {room}, you see, writing away at something, quite locked in, and I expect those papers remain there still.',
  ],
  'role.vague.rambling': [
    'My part in the evening? I should prefer not to say just yet, if you do not mind — ask me something else first, something easier to answer.',
    'What role did I play? That’s a question that requires more thought than I’ve had time to give it thus far.',
    'What part did I play, you ask? That’s precisely the sort of question that requires more contemplation than the evening has permitted.',
    'My position in all this is rather unclear, even to myself — I was here, yes, but what that signifies I cannot rightly say.',
  ],
  'role.claim.rambling': [
    'Very well — you shall have it plainly, though I do not relish laying out the facts of my evening for scrutiny.',
    'Very well — you might as well have it directly, though laying out the particulars feels rather exposing.',
  ],
  'alibi.alone.rambling': [
    'My whereabouts in that hour? A simple matter, though not one that helps me much, I fear — I was quite alone, which you will find difficult to corroborate.',
    'As to where I was — well, that is easily said, if not easily proven, for I was by myself, which is hardly an alibi at all.',
    'I can account for my movements, after a fashion — I was in solitude, which as I say, hardly serves to clear me of suspicion.',
  ],
  'alibi.company.rambling': [
    'I have the advantage, I suppose, of having witnesses to my movements — for I was not alone, which should make your work easier.',
    'My alibi is at least verifiable, since I was in company throughout, and my companions can speak to it.',
    'I need not rely on my word alone, which is fortunate, for I have witnesses to my whereabouts.',
  ],
  'knowledge.vague.rambling': [
    'What should I know? I keep to myself, generally, not meddling in other people’s affairs the way some folk do, so I have little to offer.',
    'I am not inclined to speculate or to repeat gossip, so if you are fishing for tales, I fear you will not catch much from me.',
    'If there is something I ought to know, I fear I’ve missed it in all the commotion, though perhaps you’ll enlighten me.',
  ],
  'knowledge.share.rambling': [
    'I have given thought to the matter, and I shall tell you what I know, for what little it may be worth.',
    'What I can offer you is the truth as I understand it, though I confess I am not always certain of my understanding.',
    'Listen, then, and make of it what you will — I shall lay out what I know with as much clarity as I can muster.',
  ],
  'knowledge.hedged.rambling': [
    'I will tell you what I know, though you must understand that events can be interpreted in various ways, and I am not always confident of my reading.',
    'The facts I can give you, but their meaning is another matter — they might point one way or quite another, depending on how one looks at them.',
    'The facts I can give you are these, though their interpretation is rather more open to question, I’m afraid.',
  ],
  'suspect.point.rambling': [
    'You asked, so I shall say it: {target} — watch {target} carefully, for there is something about {target}’s manner that troubles me deeply.',
    'If I must name someone, it is {target}, and though I know how that sounds, I am quite serious in my assessment.',
    'If you press me for a name, I must say: {target}. Look closely at {target}, watch {target}’s reactions — there’s something there.',
  ],
  'suspect.hedge.rambling': [
    'If pressed for a name I might suggest {target}, though I could equally argue for any number of people, depending on which set of facts one chooses to emphasise.',
    'It could be {target}, it could be nearly anyone — the whole picture is muddled, and one person’s suspicion is as valid as another’s.',
    'My first thought is {target}, but I do not trust my first thoughts, having been wrong so many times in my life about such matters.',
  ],
  'suspect.none.rambling': [
    'I could not tell you who, truly I could not — though {person} seems to be asking all the right questions, and that person seems sharper than the rest of us combined.',
    'No name comes to mind, though I would watch {person} if I were you, for {person} has been unusually attentive all evening.',
    'I have no one to point to, unfortunately, but {person} is worth talking to, for {person} may have seen or heard something the rest of us missed.',
  ],
  'about.person.rambling': [
    'Since you ask about them, I can tell you a little, though not a great deal, for we were not particularly well acquainted.',
    'What I know of that person is limited, but I shall tell you what I can.',
    'I can offer you a few observations about them, though I am not certain how much help it will be.',
  ],
  'about.referral.rambling': [
    '{person} would be able to tell you far more than I could, having been closer to the matter.',
    'The person to ask is {person}, really — I only know bits and pieces, what people said here and there, but {person} would have the fuller picture.',
    '{person} would be the one to ask about this matter, really — they were in a far better position than I to observe what transpired.',
  ],
  'about.nothing.rambling': [
    'I barely know them — we passed pleasantries at dinner, nothing more, so I have little to offer you on that front.',
    'You would learn more from the wallpaper than from me on this subject — I know them hardly at all.',
    'They are as much a stranger to me as anyone could be, despite being under the same roof.',
  ],
  'about.victim.rambling': [
    'You want to know how things stood between us — well, that is a fair question, and I shall answer it as honestly as I can.',
    'How I stood with the dead man? I have been expecting you to ask that, and I do not mind telling you.',
    'My relationship with him was — well, I shall lay it out for you, and you can draw your own conclusions.',
  ],
  'evidence.deny.rambling': [
    'That is not mine, though I do not doubt it has caused you to wonder — every house is full of such things, forgotten by their owners or misplaced.',
    'It could belong to anyone in this house, and probably does not belong to me, I assure you.',
    'You will find a dozen similar items scattered about — I do not see how this one proves anything regarding me.',
  ],
  'evidence.identify.rambling': [
    'It is not from me, but I notice it might very well belong to someone else in this house, someone you will be questioning no doubt.',
    'Not mine — but if you pay attention to the details, you will see it belongs to someone else, and that someone is worth watching.',
    'That is not mine, certainly not — but if you compare it to the various people here, you’ll find it matches someone, I should think, though I hesitate to say who.',
    'Not mine, no — but if you set it beside the others, you’ll see whom it belongs to, and I expect you’re clever enough to work that out for yourself.',
  ],
  'evidence.trace.own.rambling': [
    'Mine, I am afraid, and it corroborates my account perfectly, which I am glad of for once.',
    'It is indeed mine, left exactly where I said I was sitting, so it rather bears out my story, does it not?',
    'Yes, that is mine, I’m afraid — I left it exactly where I said I was, so it corroborates my account in a way I must say I’m grateful for.',
    'That is indeed mine, sitting there as evidence that I was precisely where I said I was, which is rather fortunate given how few witnesses I have to back me up.',
  ],
  'evidence.weapon.deny.rambling': [
    'I could have used that, yes — I had access to it, I cannot deny that — but that I could have done it is very different from saying I did.',
    'Yes, the means were within my reach, but means alone does not make a murderer, {detective}, as you well know.',
    'I could have laid hands on that, true enough, but capability is not the same as guilt, is it?',
  ],
  'evidence.weapon.comment.rambling': [
    'I could not have used that weapon, and you know it as well as I do — look at me and see the impossibility of it.',
    'That is beyond my capacity, quite beyond me, which you can see for yourself without my saying so.',
    'That is quite beyond my capacity, which you can perceive without my needing to state it.',
  ],
  'evidence.lockbox.rambling': [
    'So there has been a theft as well as a murder — what a dreadful business, suggesting that two separate crimes occurred in the same hour.',
    'A forced lockbox, you say? Then someone stole as well as killed, which suggests either desperation or extreme audacity.',
    'A forced lockbox means a thief, which compounds the tragedy of the evening most terribly.',
  ],
  'evidence.doc.deny.rambling': [
    'That paper does not reflect the truth of the matter — it is twisted out of proper meaning, and I shall tell you how things actually stood between us.',
    'Papers can be made to say anything, and that document is a case in point — let me correct the record with the true account.',
    'That is not a fair representation of what occurred — the reality was quite different, and I shall explain it to you.',
  ],
  'evidence.doc.confirm.rambling': [
    'Yes, that is genuine — I shall not pretend otherwise, for honesty is better than prevarication at this point.',
    'It is authentic, I am afraid, and I should prefer you heard the truth from me rather than from your own conclusions.',
    'That document is real, I do not deny it — though I expect you will want me to explain the circumstances surrounding it.',
  ],
  'evidence.doc.gossip.rambling': [
    'That paper merely puts into writing what everyone already suspected, and I can supply the context you will need to understand it.',
    'That paper merely confirms what I’ve long suspected, you see — people do tend to whisper about such things, and it’s no surprise to find it written down at last.',
    'I’m not in the least surprised, you know — I’ve heard various rumours about this matter, and this document rather puts them all into perspective, doesn’t it?',
  ],
  'evidence.doc.comment.rambling': [
    'That is someone else’s private affair, laid out in ink, and I have nothing to add to it — the author alone can explain it.',
    'I know nothing of that document’s provenance or meaning, though it makes for uncomfortable reading.',
    'That is not my business to explain — it belongs to someone else, and they are the one to question about it.',
  ],
  'evidence.flavor.rambling': [
    'That is likely just an abandoned thing, meaningless and of no significance whatsoever — a bit of rubbish someone left behind.',
    'You will find similar objects scattered throughout this house, having no bearing on the matter at all — it is simply a thing, nothing more.',
    'That item has no relevance that I can see, rather like most of the items one finds lying about in an old house like this.',
  ],

  // =====================================================================
  // CHEEKY — not nearly as impressed by the detective as they ought to be.
  // =====================================================================
  'claim.role.cheeky': [
    'Right then — I’m {roleName}. Satisfied?',
    'I am {roleName}, and before you ask, yes, that matters.',
    'I’ll make it simple for you: I’m {roleName}.',
  ],
  'claim.whereabouts.alone.cheeky': [
    'I was in {room}, all by myself — which is jolly convenient for me and dreadfully inconvenient for you.',
    'In {room}, solitary, if you need to know. No witnesses — how perfectly awkward for me.',
    'Spent the hour alone in {room}. Rather dull, but there it is.',
  ],
  'claim.whereabouts.company.cheeky': [
    '{companions} and I were in {room} the entire time. They can confirm it.',
    '{companions} can vouch for me — we were in {room}, the pair of us.',
    'In {room} the whole hour, {companions} and I together. Quite inseparable, actually.',
    '{companions} and I were glued to {room}. Ask them, if you like.',
  ],
  'claim.sighting.cheeky': [
    'I saw {target} in {room}, clear as day. Don’t look at me like that.',
    'I spotted {target} in {room}. Make of it what you will.',
    'There was {target}, bold as brass in {room}. I couldn’t very well miss it.',
  ],
  'claim.glimpse.cheeky': [
    'Someone near {room} went past — couldn’t see the face, but whoever it was {trait}.',
    'There was a figure by {room}, and all I could tell you is this: they {trait}.',
    'A figure by {room}. I didn’t catch the face, but I can tell you: they {trait}.',
  ],
  'claim.culpritAttr.trait.cheeky': [
    'Your murderer {trait}. You can count on that much.',
    'The one you’re after {trait}. I’d wager money on it.',
    'Whoever did this {trait}. That’s all I know, and it’s enough.',
  ],
  'claim.alignment.good.cheeky': [
    '{target} is innocent, and I’ll not hear otherwise. You can trust me on that.',
    '{target}? Leave them alone. They’re not involved in this.',
    'Forget about {target} — they haven’t a thing to do with it, I’m telling you.',
  ],
  'claim.alignment.evil.cheeky': [
    'There’s something rotten about {target}, mark my words.',
    'Watch {target}. There’s something dreadfully wrong there, and you’ll see it soon enough.',
    'I’d keep a close eye on {target} if I were you. There’s something rotten underneath.',
    '{target}’s got a dark streak, and I’d wager good money on it being relevant.',
  ],
  'claim.relationship.self.devoted.cheeky': [
    'I loved him — there, I’ve said it. Not ashamed of it, either.',
    'He was everything to me. Don’t you go suggesting otherwise.',
    'There was nobody I cared for more than I did him. That’s the simple truth of it.',
  ],
  'claim.relationship.self.cordial.cheeky': [
    'We rubbed along well enough. That’s all there is to it.',
    'Pleasant enough terms with him. No quarrels, no complications.',
    'We were friendly — nothing dramatic, just friendly.',
  ],
  'claim.relationship.self.strained.cheeky': [
    'Things were chilly between us, if you must know. Polite, but cold.',
    'There was a distance come between us. We were civil, just — not warm.',
    'We weren’t getting on as we once did. That’s all I’ll say.',
  ],
  'claim.relationship.self.hostile.cheeky': [
    'I hated the man. You want me to lie about it?',
    'He and I despised one another. Everyone knew it.',
    'I loathed him. And I’m not the only one, so don’t look at me like that.',
  ],
  'claim.relationship.self.indebted.cheeky': [
    'I owed him a considerable sum. He never let me forget it.',
    'Money — that was the trouble between us. A lot of it.',
    'He held my notes of hand, and I couldn’t pay. Simple as that.',
  ],
  'claim.relationship.self.jilted.cheeky': [
    'He threw me over, years ago. I’ve managed to get over it, mostly.',
    'We were engaged, once upon a time. He decided against it. I’ve lived with it.',
    'He jilted me, years back. I’ve got over it, mostly — well, nearly.',
    'He threw me over. I’ve moved on, though it stung at the time, obviously.',
  ],
  'claim.relationship.gossip.devoted.cheeky': [
    '{subject} thought {victim} hung the moon. Rather sickening, actually.',
    '{subject} doted on {victim} — rather sickeningly, if you ask me.',
    '{subject} was absolutely besotted with {victim}. Quite nauseating, really.',
  ],
  'claim.relationship.gossip.cordial.cheeky': [
    '{subject} and {victim} were pleasant enough together. No drama.',
    '{subject} was perfectly friendly with {victim}. Dull, really.',
    '{subject} and {victim} got along perfectly fine. Nothing scandalous to report, I’m afraid.',
    '{subject} and {victim} rubbed along nicely. No drama worth mentioning, if you ask me.',
  ],
  'claim.relationship.gossip.strained.cheeky': [
    '{subject} could barely look at {victim} without bristling. Palpable coldness.',
    '{subject} and {victim} were civil but tense. The kind of polite that speaks volumes.',
    'A definite chill had settled between {subject} and {victim}. Everyone felt it.',
  ],
  'claim.relationship.gossip.hostile.cheeky': [
    '{subject} and {victim} were at each other’s throats. Constantly.',
    '{subject} hated {victim}. And vice versa, from what I could see.',
    'If you’d been here five minutes, you’d know {subject} and {victim} couldn’t stand each other.',
  ],
  'claim.relationship.gossip.indebted.cheeky': [
    '{subject} owed {victim} money — and {victim} never forgot it for a moment.',
    '{victim} had {subject} over a barrel financially. Everyone knew it.',
    '{subject} was in {victim}’s debt, deeply. Made for dreadful atmosphere.',
  ],
  'claim.relationship.gossip.jilted.cheeky': [
    '{victim} threw {subject} over, long ago. {subject} never quite forgave it.',
    '{victim} jilted {subject} years back. Wounds like that don’t heal, do they?',
    '{victim} cast off {subject} long ago, and {subject} has nursed the wound ever since.',
  ],
  'claim.heard.crash.cheeky': [
    'There was a crash from {room} — sounded deliberate, not the storm.',
    'During all that, I heard a crash from {room}. Made my blood run cold.',
    'A crash came from {room} — sounded deliberate, not accidental. Something breaking, or a lock.',
    'During the hour there was a tremendous noise from {room}. Glass, or something metal.',
  ],
  'claim.heard.quarrel.cheeky': [
    'In the afternoon, voices were raised in {room}. {victim} was one of them, at any rate.',
    'I heard angry voices from {room} earlier. A real quarrel, not a tiff.',
    'Raised voices came from {room} that afternoon. Somebody was furious.',
  ],
  'claim.suspicion.cheeky': [
    'If you want my honest opinion, I think it’s {target}. Just a feeling, mind.',
    '{target} — that’s where my suspicions lie, for whatever that’s worth.',
    'I’d look at {target} if I were you. Something’s not right there.',
  ],
  'reaction.plain.cheeky': [
    'A ghastly business. Out with your questions, then.',
    'Well, this is perfectly dreadful. What do you need from me?',
    'I suppose you’ll be wanting our statements. Fire away.',
  ],
  'reaction.heard.crash.cheeky': [
    'I’ve got something to tell you that might matter. Shall I go on?',
    'You’d better hear this before you go accusing people willy-nilly.',
    'Before you start accusing people, there’s something you ought to hear.',
  ],
  'reaction.heard.quarrel.cheeky': [
    'There’s something I should mention, and I might as well say it now.',
    'I kept quiet about this, but you’re the detective, aren’t you? Might as well tell you.',
    'There’s something I’ve been sitting on, and now that you’re asking, out it comes.',
  ],
  'reaction.accuse.cheeky': [
    'Don’t waste your time on the rest of us. Look at {target} — really look.',
    '{target} did it. I’m as sure as I’m standing here.',
    'Save yourself the bother: {target}’s your culprit. You’ll thank me for it.',
  ],
  'reaction.referral.cheeky': [
    '{victim} was shut up in {room} all afternoon, writing away at something. You’ll want to look there.',
    '{victim} locked himself away in {room} this afternoon, writing. Whatever he wrote might tell you something.',
    '{victim} spent hours in {room} writing away. Whatever {victim} was writing, it’s probably still sitting there.',
  ],
  'role.vague.cheeky': [
    'My part? That’s hardly the question you should be asking.',
    'Never you mind what my part was. Ask something more interesting.',
    'My part in all this? Bit of a stretch to say I had one, really.',
    'My role? I was here, minding my own business. That’s the lot of it.',
  ],
  'role.claim.cheeky': [
    'All right, I’ll tell you straight.',
    'Right, you’ll want the truth of it.',
    'Right, then. You might as well hear it from me directly.',
    'All right, I’ll lay it out plainly for you.',
  ],
  'alibi.alone.cheeky': [
    'Where I was? Easy to answer, if not easy to prove.',
    'I can account for where I was, at least.',
    'Where I was? Nothing simpler to say, if harder to prove.',
    'My whereabouts? Easy. I can account for myself, though you may not believe me.',
  ],
  'alibi.company.cheeky': [
    'At least I haven’t got to rely solely on my word for this one.',
    'There’s somebody who can back up what I say.',
    'I shan’t be alone in this explanation, fortunately.',
  ],
  'knowledge.vague.cheeky': [
    'I’m not sure I’ve got anything worth your while, {detective}.',
    'There might be something, or there might not. Depends what you’re asking.',
    'Know what, exactly? I’ve been minding my own business, same as always.',
    'There might be something, or there might be nothing. You haven’t asked right yet.',
  ],
  'knowledge.share.cheeky': [
    'Right, here’s what I know.',
    'I’ll be straight with you: here’s what I know.',
    'Right then, I’ve some facts for you, and I won’t wrap them in nonsense.',
  ],
  'knowledge.hedged.cheeky': [
    'What I’ll tell you might mean one thing or might mean quite another.',
    'I know the facts, but they don’t explain themselves, do they?',
    'I know the facts, but they could be read more ways than one.',
  ],
  'suspect.point.cheeky': [
    '{target} — that’s who I’d pin this on, if I were in your shoes.',
    'The answer’s right in front of you: {target}. You just have to open your eyes.',
    '{target}. That’s who I’d put my money on, and I’d do it cheerfully.',
    '{target} did it. At least, that’s what all the evidence suggests to me.',
  ],
  'suspect.hedge.cheeky': [
    '{target} seems likeliest, though I admit I might be wrong.',
    'If you want a name, I’d say {target} — but it could just as easily be someone else.',
    'I’d lean toward {target}, though I can’t say I’m certain of it.',
  ],
  'suspect.none.cheeky': [
    'No name from me, I’m afraid. Though {person} might have something to tell you.',
    'I couldn’t hazard a guess. {person} might be your better bet, though.',
    'Couldn’t say who. {person} might be worth talking to, though.',
  ],
  'about.person.cheeky': [
    'What I know of them isn’t much, but here it is.',
    'Since you’re asking, I can offer you a bit.',
    'About them? I can offer you something, at least.',
  ],
  'about.referral.cheeky': [
    '{person} could tell you far more than I could on that subject.',
    'You’d get a better answer from {person}. They were in a position to know.',
    '{person} has the real information. I’m only guessing.',
  ],
  'about.nothing.cheeky': [
    'I hardly know them at all. I couldn’t tell you a thing about them.',
    'We’ve barely spoken. They’re rather a mystery to me.',
    'I’ve no idea. You might as well ask the furniture.',
  ],
  'about.victim.cheeky': [
    'You mean to ask about my relations with the dead man. Fair enough.',
    'My feelings about him? I’ll tell you true.',
    'What I felt about the deceased? You want the truth? Fair enough.',
  ],
  'evidence.deny.cheeky': [
    'That’s not mine, I’m afraid. Look somewhere else.',
    'You’re grasping at straws. That’s nothing to do with me.',
    'Not mine. Could belong to half the people in this house.',
    'Mine? Certainly not. You’re barking up the wrong tree there.',
  ],
  'evidence.identify.cheeky': [
    'Not mine — but you can see as well as I can who it belongs to.',
    'Not mine. Look to the person it actually fits, if you’re clever enough.',
    'Not mine. Try the guest with the obvious connection, if you’re sharp.',
  ],
  'evidence.trace.own.cheeky': [
    'That’s mine, yes — and it backs up exactly what I told you.',
    'Yes, it’s mine. And there’s your proof I wasn’t lying.',
    'That’s mine, yes. Just where I said I was, so there’s your proof.',
    'Mine, I’m afraid, and it backs up my story rather nicely.',
  ],
  'evidence.weapon.deny.cheeky': [
    'Could I have used it? Probably. Did I? No. That’s the end of it.',
    'I had access to it, but access isn’t guilt, is it?',
    'Yes, I might have. But I didn’t. Which part don’t you understand?',
  ],
  'evidence.weapon.comment.cheeky': [
    'Beyond me, I’m afraid. Quite beyond me.',
    'Beyond me, that is. Look at me and tell me if I could do it.',
    'Me? No. Quite beyond my capacity, as I’m sure you see.',
  ],
  'evidence.lockbox.cheeky': [
    'The box was forced? So we’ve got ourselves a thief along with a murderer. How dreadful.',
    'Someone wanted what was inside badly enough to smash it open. Along with everything else.',
    'A theft as well as murder. This evening just keeps getting better and better.',
  ],
  'evidence.doc.deny.cheeky': [
    'That’s twisted, that is. Here’s how it actually was:',
    'That’s not what it looks like. Not at all. Here’s the truth:',
    'That paper doesn’t tell the half of it. Let me set the record straight:',
  ],
  'evidence.doc.confirm.cheeky': [
    'Yes, that’s genuine. I’ve been expecting someone to find it.',
    'So you’ve dug it up. Yes, it’s authentic. Now you know.',
    'So you’ve found it. Yes, it’s genuine. I’ve been expecting this.',
    'That’s authentic, yes. I haven’t bothered denying it.',
  ],
  'evidence.doc.gossip.cheeky': [
    'That paper just puts in writing what everyone’s been whispering about.',
    'That only confirms what I already knew. Here’s why I knew it:',
    'That only makes official what we all already whispered about.',
  ],
  'evidence.doc.comment.cheeky': [
    'I’ve no idea where that came from. It’s not my business to explain it.',
    'I’m seeing that for the first time, same as you. Makes for gloomy reading, doesn’t it?',
    'That’s not something I can help with. Someone else’s business, not mine.',
  ],
  'evidence.flavor.cheeky': [
    'You’ll find things like that all over the house. Means nothing.',
    'That’s just rubbish. Belongs in a bin, not on your table.',
    'That’s just rubbish lying about. Not a clue at all.',
  ],

  // =====================================================================
  // GOSSIPY — more of it. These lines are added to the gossipy banks in dialogue.ts.
  // =====================================================================
  'claim.role.gossipy': [
    'Well, you didn’t hear it from me, but I am {roleName} — and that’s the truth of it.',
    'Between ourselves, I’m {roleName}. There’s no point dressing it up for you.',
    'I’m not one to make a fuss, but I am {roleName}, and I’ve no reason to lie about it.',
  ],
  'claim.whereabouts.alone.gossipy': [
    'Well, if you must know, I was in {room}, quite by myself. I know it doesn’t help my case, but there it is.',
    'I’m not proud of it, but I was in {room}, all by myself, through the whole business.',
    'To my cost, I was in {room}, without a witness to my name.',
  ],
  'claim.whereabouts.company.gossipy': [
    'I was in {room} with {companions} — the whole time, mind you. Ask them yourself if you don’t believe me.',
    'Well, I was in {room}, with {companions}, and we never stirred from it. Not for a moment.',
    'In {room}, with {companions}, and neither of us budged an inch. Mark my words.',
  ],
  'claim.sighting.gossipy': [
    'I saw {target} in {room} with my own eyes — during that hour, clear as day. I won’t say more than that.',
    'Now, I’m not one to speak out of turn, but I saw {target} in {room}, and I’m certain of it.',
    'I can swear to this: {target} was in {room}, plain as day, during that hour.',
    'There’s no doubt in my mind — I saw {target} in {room} with these very eyes.',
  ],
  'claim.glimpse.gossipy': [
    'I only saw a figure passing near {room}, but I can tell you this much: the person {trait}.',
    'I couldn’t swear to the person, but near {room} I glimpsed someone who {trait}.',
    'There was someone by {room}, only for a moment, but the figure {trait}.',
  ],
  'claim.culpritAttr.trait.gossipy': [
    'Now, I don’t like to gossip, but the guilty party {trait}, no doubt about it.',
    'I’m not one to speak ill, only the killer {trait}, and that I know for a fact.',
    'Whoever did it {trait} — that’s the one thing I can tell you for certain about the killer.',
    'Now, I don’t like to point fingers, but the person who did this {trait}. You can trust me on that.',
  ],
  'claim.alignment.good.gossipy': [
    'I’m not one to speak up often, but {target} is true — you can trust that much from me.',
    'Now I don’t like to speak ill of anyone, so I’ll just say {target} is innocent. That I’m certain of.',
    'Well, you didn’t hear it from me, but {target} — that one’s good. I’d wager my reputation on it.',
  ],
  'claim.alignment.evil.gossipy': [
    'I’m not one to gossip, but {target} — there’s rot there, I promise you. Something’s not right.',
    'Now, I don’t like to speak of such things, but {target} is not what {target} appears to be. Not at all.',
    'Between ourselves, {target} has always struck me as wrong. Tonight, I’m sure of it.',
  ],
  'claim.relationship.self.devoted.gossipy': [
    'I’m not ashamed to admit I had real affection for his lordship. The best friend I had in this house, truly.',
    'Well, you didn’t hear it from me, but I was devoted to him. I’ve wept tonight, and I’ll not hide it.',
    'I loved him truly — more than I can easily say. This house is poorer for his absence.',
    'He was the closest thing I had to — well, to someone who mattered deeply to me.',
  ],
  'claim.relationship.self.cordial.gossipy': [
    'His lordship and I got on perfectly well — no quarrels, no history. That’s the honest truth of it.',
    'Well, between ourselves, I liked him well enough, and he liked me. We rubbed along nicely.',
    'We were perfectly pleasant to one another, nothing more, nothing less. That was all.',
    'I liked him well. Nothing grand, but genuine goodwill between us, truly.',
  ],
  'claim.relationship.self.strained.gossipy': [
    'I won’t deny there was a coolness between us of late. Things had grown rather careful, you might say.',
    'Well, you didn’t hear it from me, but things had gone a touch frosty between us. But nothing more than that.',
    'There was a stiffness between us lately, yes. I shan’t pretend otherwise, but nothing grave.',
    'We had grown rather distant of late — the sort of polite coolness one sees.',
  ],
  'claim.relationship.self.hostile.gossipy': [
    'I hated him — there, I’ve said it. The whole house knew it too, if they’re honest.',
    'Between ourselves, I loathed him. We despised each other, and everyone knew it.',
    'I detested him — there, I’ll say it plainly. Everyone knew it perfectly well.',
    'I won’t lie: there was hatred between us. The whole house heard us quarrel.',
  ],
  'claim.relationship.self.indebted.gossipy': [
    'Well, you didn’t hear it from me, but his lordship held my notes. Quite a sum, and he reminded me of it constantly.',
    'I’m not ashamed to admit I was in his debt. More than I could pay back, if I’m being honest.',
    'The truth of it is I owed him money — rather a lot of it.',
    'I had borrowed heavily from him, and he held the notes. A bitter arrangement.',
  ],
  'claim.relationship.self.jilted.gossipy': [
    'We were engaged once, long ago. He changed his mind, and I have made peace.',
    'There was a time when we were to marry. That ended. One carries such things quietly.',
    'Years ago, there was an understanding between us. He put an end to it.',
    'He and I had an understanding, once, before the engagement was broken.',
  ],
  'claim.relationship.gossip.devoted.gossipy': [
    'You could see it plainly: {subject} absolutely worshipped {victim}. Rather touching.',
    'You could see it a mile away: {subject} was devoted to {victim}. The genuine affection, it was.',
    '{subject} worshipped {victim}, truly. One felt it every time they were together.',
    'The love {subject} had for {victim}? You could see it in every gesture. Quite genuine, that was.',
  ],
  'claim.relationship.gossip.cordial.gossipy': [
    'Well, between ourselves, {subject} and his lordship — pleasant enough. No troubles that I could see.',
    '{subject} and {victim} were perfectly pleasant with one another. Nothing more, nothing less.',
    'They got along perfectly well, {subject} and {victim}. I never saw them cross.',
  ],
  'claim.relationship.gossip.strained.gossipy': [
    'I said to myself at the time, looking at them at table — {subject} and his lordship had grown rather careful with one another.',
    '{subject} and {victim} had grown distant lately — I noticed it at table.',
    'I noticed it plainly at table: {subject} and {victim} had grown rather formal with each other.',
    'Something had shifted between {subject} and {victim}. They used to be warmer, but lately — distance.',
  ],
  'claim.relationship.gossip.hostile.gossipy': [
    'Now, I don’t like to speak ill, but {subject} and his lordship — real hatred there. They couldn’t share a room.',
    '{subject} and {victim} despised each other — I’ve never seen two so thoroughly at odds.',
    '{subject} and {victim} couldn’t abide each other — the tension when they were in the same room was dreadful.',
    '{subject} and {victim} were at complete odds. You’d think they’d come to blows at table.',
  ],
  'claim.relationship.gossip.indebted.gossipy': [
    'Well, between ourselves, {subject} was in his lordship’s debt to a considerable sum. That’s all I’ll say.',
    '{subject} owed {victim} a very considerable sum — I happened to learn of it.',
    'The financial arrangement between {subject} and {victim} was strained to breaking point.',
    '{subject} was deeply in {victim}’s debt, quite a substantial amount.',
  ],
  'claim.relationship.gossip.jilted.gossipy': [
    'I said to myself at the time, knowing the history — {subject} was thrown over by his lordship long ago, and never quite forgave it.',
    '{subject} was engaged to {victim} years ago, before {victim} ended it.',
    'It’s old history now, but {victim} broke an engagement with {subject}.',
  ],
  'claim.heard.crash.gossipy': [
    'Well, I heard something break in {room}, quite distinctly. Wood or metal, I couldn’t quite tell. Gave me a terrible start.',
    'During that hour, I heard a sound from {room} — something breaking distinctly.',
    'There came a crash from {room} that startled me terribly. Glass or wood.',
  ],
  'claim.heard.quarrel.gossipy': [
    'Well, I heard quarrelling from {room} that afternoon — his lordship and someone else, having a dreadful row.',
    'Earlier that day, voices were raised in {room} — a quarrel, unmistakably.',
    'From {room} that afternoon came raised voices — an argument, quite heated.',
    'I heard shouting from {room} earlier in the day — a terrible quarrel.',
  ],
  'claim.suspicion.gossipy': [
    'Between ourselves, if I had to name someone, it would be {target}. I can’t explain it — I just feel it.',
    'If pressed for an opinion, I should say {target}. Call it instinct.',
    'My suspicion, for what it matters, falls on {target}. Something about tonight.',
    'I won’t call it proof, but {target} — something is not right there.',
  ],
  'reaction.plain.gossipy': [
    'Well, this is a terrible business. I suppose you’ll want to question us all now.',
    'This is a dreadful business indeed. I shall answer whatever you ask.',
    'I can scarcely credit what has happened. But yes, ask me what you will.',
  ],
  'reaction.heard.crash.gossipy': [
    'Now, I know what you’re here to do, but there’s a thing I witnessed that might help. Let me tell you now.',
    'There is something you should know before you begin questioning us all.',
    'I heard something this evening that may bear upon your inquiry, {detective}.',
    'Before you ask around, there is a sound I heard that troubles me.',
  ],
  'reaction.heard.quarrel.gossipy': [
    'I should tell you now of something I heard earlier that day.',
    'There is something I overheard this afternoon that you ought to know.',
    'Before we go further, I must tell you of a quarrel I witnessed.',
  ],
  'reaction.accuse.gossipy': [
    'Well, you asked us what we think — and I’ll tell you plainly: {target}. Watch {target} carefully.',
    'I hate to speak out against anyone, but I must say — it’s {target}. There’s something wrong there.',
    'If you want my view without hesitation: {target}. Look there, look carefully.',
    'I shall speak plainly: {target} has it written all over them, I’m certain.',
  ],
  'reaction.referral.gossipy': [
    'Now, I’m not certain who wrote what, but I saw his lordship locked away in {room} all afternoon, writing. That’s worth your time, surely.',
    '{victim} spent the whole afternoon in {room}, writing away. Worth investigating.',
    'One odd thing: {victim} was closeted in {room} all afternoon with pen.',
    'I saw {victim} locked away in {room} the whole afternoon, writing furiously.',
  ],
  'role.vague.gossipy': [
    'Well, you’ll want to know what role I played — but I think I’d rather hear what you already know first.',
    'My role in this? Perhaps I should ask what you have learned first.',
    'You wish to know what part I played — shouldn’t you tell me yours first?',
  ],
  'role.claim.gossipy': [
    'Since it’s bound to come out anyway, I’ll tell you straight.',
    'I’m not going to dance around it. Here’s the truth of my part in all this.',
    'I shall tell you exactly what my part was in all of this.',
    'I’ll not hide behind politeness — here is what I know of my movements.',
  ],
  'alibi.alone.gossipy': [
    'Well, my whereabouts are simple enough, though they won’t help my case much.',
    'You’ll want my movements accounted for. I’ve been expecting this question.',
    'Where I was during the hour? I shall tell you, though it helps me not.',
    'My whereabouts are easily stated, if not easily believed.',
  ],
  'alibi.company.gossipy': [
    'Well, there I am on firm ground, at least — I wasn’t by myself.',
    'I’m happy to report that I have company who can vouch for me.',
    'Fortunately for me, I have witnesses to my whereabouts in that hour.',
    'At least this much I can say with certainty: I was not alone.',
  ],
  'knowledge.vague.gossipy': [
    'Know? I’m not certain I know what you mean exactly, {detective}.',
    'I keep my own counsel on such matters. Ask me more plainly.',
    'I’m not sure I follow your line of questioning just yet.',
    'What is it precisely you are asking me to say?',
  ],
  'knowledge.share.gossipy': [
    'What I can tell you is honest and straight. Listen, then.',
    'I shall tell you plainly what I know of this matter.',
    'I have something to tell you, and I shall not dissemble.',
    'Listen carefully, for what I say is the truth as I know it.',
  ],
  'knowledge.hedged.gossipy': [
    'Now, I have facts to give you, but I’m less certain of conclusions. It cuts several ways.',
    'What I know may be read in more than one way, but I’ll tell you.',
    'I have facts, though their meaning is not altogether clear to me.',
    'There are pieces of the puzzle, though I cannot swear to meaning.',
  ],
  'suspect.point.gossipy': [
    'If I’m naming names, then {target}. Everything about tonight points one way, in my view.',
    'Without hesitation: {target}. I cannot say why, but everything points that way.',
    'I name {target}. Not from proof, but from a certainty I cannot shake.',
  ],
  'suspect.hedge.gossipy': [
    'If I must name someone, I suppose {target} — though I could argue otherwise.',
    '{target}, perhaps, though the whole thing is dreadfully uncertain to me.',
    'One might look at {target}, though I scarcely know what I believe.',
    '{target}, if forced to say — but it could as easily be another.',
  ],
  'suspect.none.gossipy': [
    'No name from me, I’m afraid — but {person} seems to see rather more than the rest of us. Start there.',
    'I won’t guess at names, but {person} strikes me as sharper than we’ve been. Worth asking.',
    'I couldn’t point a finger if I tried — but I’d start with {person}, who’s been remarkably observant all evening.',
  ],
  'about.person.gossipy': [
    'Well, since you ask about them, I can tell you a bit — though nothing grand.',
    'About them? There is something I can tell you, though it is small.',
    'Regarding that person, I have observed a few things worth mentioning.',
  ],
  'about.referral.gossipy': [
    'I’d be guessing, {detective}. {person} would know for certain — ask there instead.',
    'I’m not the one to ask. {person} would know far better than I.',
    '{person} is your better source for facts about that person, not I.',
    'Ask {person} — they knew that guest far better than I did.',
  ],
  'about.nothing.gossipy': [
    'I’m not one who had much to do with them. We barely nodded in passing.',
    'Well, you’d learn more from asking the cat than asking me about that guest.',
    'That guest remains a mystery to me. I scarcely knew them.',
    'I fear I can offer you nothing useful there. We barely had acquaintance.',
  ],
  'about.victim.gossipy': [
    'Well, I suppose it’s time to talk about my standing with his lordship. I’ll be honest with you.',
    'My relations with the dead man? I shall tell you plainly.',
    'You wish to know of my connection to the dead man, then.',
  ],
  'evidence.deny.gossipy': [
    'That could belong to anyone in this house — a dozen people have something similar. You’ll need more than that.',
    'Well, that’s not mine, and that’s all there is to it. You’ll find nothing there.',
    'That is not mine, {detective}. Many in this house could claim the same.',
    'It is not mine — I’ve never seen that before in my life.',
  ],
  'evidence.identify.gossipy': [
    'That is certainly not mine — but I wonder if you see whom it fits?',
    'Mine? No. But show it to someone and I think you’ll find the answer.',
    'That belonged to another, plainly. One you’ve already seen in this room.',
  ],
  'evidence.trace.own.gossipy': [
    'That’s mine, I’m afraid — though I’m glad of it in this case, as it proves where I said I was.',
    'Mine, and I’m grateful for it. It tells exactly the story I’ve been telling you.',
    'That is mine — and thank goodness for it. It proves my whereabouts.',
    'Mine, yes — though I’m relieved to see it, as it confirms my account.',
  ],
  'evidence.weapon.deny.gossipy': [
    'I could have used it, yes — that I won’t deny. But I didn’t. Access isn’t the same as action.',
    'I had the means, I’ll grant you. That doesn’t make me the one who did it.',
    'Yes, it was within my reach. But reaching for something and using it are two different things entirely.',
  ],
  'evidence.weapon.comment.gossipy': [
    'I couldn’t have done that — you can see I couldn’t have. Someone else had the means and the will.',
    'That’s beyond what I’m capable of, {detective}. You know it as well as I do.',
    'Well, that’s a terrible thing, and entirely beyond me, I assure you.',
  ],
  'evidence.lockbox.gossipy': [
    'The box was forced? Then there’s a thief among us as well as a murderer — how dreadful.',
    'Well, that’s nasty work — and clumsy. A frightened thief is a clumsy one, I always say.',
    'A forced box means a thief as well, then. Two crimes in one night.',
    'So there was theft along with murder. This grows more dreadful by the minute.',
  ],
  'evidence.doc.deny.gossipy': [
    'That paper does not tell the truth of the matter. Let me explain.',
    'Those words are twisted. The true account is quite different.',
    'That is a distortion of what actually occurred. I shall set it straight.',
    'Papers can lie as surely as people do. I tell you the real truth.',
  ],
  'evidence.doc.confirm.gossipy': [
    'It is genuine, I’m afraid. I have kept it hidden, but it is authentic.',
    'You have found it. Yes, it is real, and I shan’t dissemble now.',
    'That’s genuine, I’m afraid — I can’t deny it now that you’ve found it, though I’d hoped it would stay hidden.',
    'Yes, it’s authentic. I shan’t pretend otherwise, not now that you’ve got the proof.',
  ],
  'evidence.doc.gossip.gossipy': [
    'I’m not in the least surprised by that document. Now let me explain why I’m not surprised.',
    'That confirms every whisper I’ve heard. Now you’ve got proof of it all.',
  ],
  'evidence.doc.comment.gossipy': [
    'I know nothing of that paper myself. The person who wrote it would be the one to ask.',
    'That paper is not my concern. Ask the person who wrote it.',
    'I cannot explain what others choose to write. That is their business.',
  ],
  'evidence.flavor.gossipy': [
    'Well, that’s just a thing — been there since before all this business started, I’d wager.',
    'That? It is nothing at all. Surely you have more important matters.',
    'That could belong to anyone. It has no bearing on this business.',
    'It is just a thing, {detective}. Nothing more than that, I assure you.',
  ],
}

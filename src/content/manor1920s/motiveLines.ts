import type { DialogueBanks } from '../schema'

// The newer motives, in each manner of speaking. The same RULES OF THE BANKS
// apply as in dialogue.ts: a line states its motive and nothing more.
//
// Drafted by a smaller model from a brief, then checked by script (slots,
// pronouns, invented facts, length, repeated openings) and read through by hand.

export const motiveLines: DialogueBanks = {
  // DEFERENTIAL
  'claim.relationship.self.disinherited.deferential': [
    'Begging your pardon, {sir}, but {victim} meant to sign me out of the will entirely.',
    'I’ll not deny it, {sir}. The new will had my name struck through. All that wanted was {his} signature.',
    'It’s true, {sir}. {he}’d prepared papers to cut me out, though {he}’d not yet set pen to them.',
    '{victim} had drawn a new will, {sir}, and I were to have nothing by it, done but for {his} hand.',
  ],
  'claim.relationship.gossip.disinherited.deferential': [
    'Begging your pardon, {sir}, but {subject} were being cut out of {victim}’s will entirely.',
    '{subject} stood to lose everything, {sir}. {victim} had writ a new will removing {subject} from it.',
    '{victim} meant to disinherit {subject}, {sir}. The new will were drawn but not yet executed.',
  ],
  'claim.relationship.self.beneficiary.deferential': [
    '{victim} signed a new will this week, {sir}, and I came into money by it, not that I asked {him} to.',
    'It’s not what I sought, {sir}, but {he} put {his} name to a new will, and I stand to gain by it.',
    'The will were signed and witnessed, {sir}, and the inheritance is mine by it. I’ll not lie about knowing.',
    '{he} set pen to the new will this week, {sir}, and left me provided for, handsomely, too.',
  ],
  'claim.relationship.gossip.beneficiary.deferential': [
    '{subject} comes into money by {victim}’s new will, {sir}. The thing is signed and witnessed both.',
    '{victim} signed a new testament, {sir}, and it’s {subject} who gains by it. Most handsomely.',
    '{subject} were made beneficiary when {victim} put {his} hand to the new will this week, {sir}.',
    'The new will’s signed, {sir}, and {subject} is the one who profits from it. There’s no denying that.',
  ],
  'claim.relationship.self.dismissed.deferential': [
    '{victim} meant to turn me out, {sir}. ’Twere settled between us. Only the date of my going remained.',
    'I knew well enough, {sir}, that {he} meant to dismiss me. {he}’d made it plain I were not wanted.',
    'The matter were decided, {sir}. {victim} meant to put me out of {house}, out of {his} service entire.',
    '{he} told me as much, {sir}. {victim} were turning me out, and the thing were all but done.',
  ],
  'claim.relationship.gossip.dismissed.deferential': [
    '{victim} were sending {subject} away, {sir}. It were settled; the only question were when.',
    '{subject} were being turned out, {sir}. {victim} had made up {his} mind. Only the day were in question.',
    '{victim} meant to dismiss {subject}, {sir}. The arrangement were fixed. Only the hour remained uncertain.',
    '{subject}’s time {inHouse} were nearly over, {sir}. {victim} had decided it. Only days remained.',
  ],
  'claim.relationship.self.exposed.deferential': [
    '{victim} knew something about me, {sir}. I’ll not say what, but {he} meant to make it known.',
    'There’s a secret {he} held over me, {sir}. I shan’t tell you what. But {he} meant to speak of it.',
    '{he} had knowledge of me, {sir}, that I did not wish made public. {he} meant to tell it abroad.',
    'I’ll not confess it, {sir}, but {victim} knew my shame. {he} meant to reveal it to all.',
  ],
  'claim.relationship.gossip.exposed.deferential': [
    '{victim} held a secret over {subject}, {sir}. Lately, {he}’d stopped troubling to keep it hidden.',
    '{victim} knew a thing about {subject} that {subject} did not wish revealed, {sir}. {he} intended to tell.',
    'There were something about {subject} that {victim} knew, {sir}, and {he}’d lately stopped concealing that {he} did.',
  ],
  'claim.relationship.self.rival.deferential': [
    '{victim} and I were partners in business, {sir}. {he} were squeezing me out of the firm I helped build.',
    'We were in commerce together, {sir}, but {he} meant to ruin me, to push me out and take all.',
    '{he} were my partner once, {sir}, until {he} decided to have no more of me. {he} were forcing me out.',
    'The business we built together, {sir}. {victim} were destroying my place in it. Ruining me by degrees.',
  ],
  'claim.relationship.gossip.rival.deferential': [
    '{subject} were {victim}’s partner in business, {sir}, and {he} were squeezing {subject} out of it.',
    '{victim} and {subject} were partners in commerce, {sir}. {he} were ruining {subject} by degrees.',
    '{subject} and {victim} were partners in business, {sir}, but {he} were forcing {subject} out.',
    'In business, {subject} stood beside {victim} once, {sir}. Now {he} were pushing {subject} out entirely.',
  ],
  'claim.relationship.self.forbidden.deferential': [
    'I asked for {his} {child}’s hand, {sir}, and {he} refused me. {he} said it should never come to pass whilst {he} lived.',
    '{his} {child} and I wished to marry, {sir}. {he} forbade it. Forbade it entirely. There were an end to it.',
    'I wished to marry {his} {child}, {sir}, but {he} would not hear of it. Not under any circumstance.',
    '{his} {child} were willing, {sir}, but {victim} forbade our marriage outright. It could not be, {he} said.',
  ],
  'claim.relationship.gossip.forbidden.deferential': [
    '{subject} wished to marry {his} {child}, {sir}. {victim} forbade it, and that were the end of it.',
    '{his} {child} and {subject} wished to marry, {sir}, but {victim} refused {subject} permission entirely.',
    '{subject} meant to take {his} {child} for a spouse, {sir}. {victim} would not allow it. Not for anything.',
    'There were a match proposed between {subject} and {his} {child}, {sir}. {victim} forbade it flat.',
  ],

  // BOASTFUL
  'claim.relationship.self.disinherited.boastful': [
    '{he} chose to cut me off. Foolish, when I’ve weathered storms far worse than a lost inheritance in my time.',
    'I was to be written out of {his} new will, though it wasn’t yet signed, and I’ve overcome far tougher reverses than that.',
    'Yes, {he} meant to strike me from the new will, but I’ve faced worse straits before and lived to tell of it.',
    'Being cast off in an unsigned will hardly compares to adversities I’ve endured in my years.',
  ],
  'claim.relationship.gossip.disinherited.boastful': [
    '{subject} was to be cut out of the new will. {victim} had settled on it, though {he} never signed the thing.',
    '{subject} was to be written out of a new will. I would have seen it coming in an instant.',
    '{victim} had drawn a fresh will that left {subject} out. Such arrangements never escape my notice.',
    'A new will was being prepared, and {subject} had no place in it. I’ve always had a nose for these things.',
  ],
  'claim.relationship.self.beneficiary.boastful': [
    '{he} signed a new will just this week, and I stand to gain by it, something I’ve been clever enough to deserve.',
    'The fresh will {he} signed names me as the heir, a triumph I’ve managed to secure through sheer merit.',
    'I’m the beneficiary of {his} new will, signed and witnessed, a position I’ve earned through my own efforts, {detective}.',
    '{he} put {his} name to the new will, and I’m the one who profits by it, as fitting an outcome as any I’ve achieved.',
  ],
  'claim.relationship.gossip.beneficiary.boastful': [
    'The new will is signed, and {subject} is the gainer by it, a reversal of fortune I’ve witnessed with great interest.',
    '{victim} signed a will this week that favours {subject}. I could have named the beneficiary myself, I know these matters so well.',
    'The new will benefits {subject}. I notice such arrangements long before they’re settled.',
    '{subject} is the gainer by a will {victim} has signed. My eye for these outcomes never fails.',
  ],
  'claim.relationship.self.dismissed.boastful': [
    '{he} was about to send me packing. I’ve faced such indignity before, and I’ll face it again when the hour comes.',
    'The man intended to turn me out, yes, though I’ve survived far graver trials in my time than a mere dismissal.',
    'I was marked for removal from {his} service, a blow that hardly ranks among the worst I’ve borne in my years.',
    '{he} meant to have me gone from {house}, a reversal I’ve weathered many times, and I’m still standing.',
  ],
  'claim.relationship.self.exposed.boastful': [
    '{he} knew something of mine, a private matter, and {he} meant to reveal it; I’ve kept worse secrets buried than what {he} possessed.',
    'There’s a thing about me {he}’d learned, and {he} meant to make it known; though I’ve carried heavier burdens than that in my time.',
    '{he} had intelligence on me, and {he} was bent on publishing it, yet I’ve faced down far graver exposure in my years.',
    '{he} discovered information I’d rather keep private, and {he} was going to tell the world; I’ve survived worse revelations than that.',
  ],
  'claim.relationship.gossip.exposed.boastful': [
    '{victim} held a secret over {subject}, and was about to reveal it. I perceive such leverage in any company, instantly.',
    '{subject} had something concealed that {victim} knew of. I am never caught unaware by hidden threats.',
    '{victim} intended to make {subject}’s secret public. I’ve always been quicker than others at spotting such pressures.',
  ],
  'claim.relationship.self.rival.boastful': [
    'I was {his} partner in business, and {he} was ruining me to advance {himself}, a treachery I’ve faced from lesser men before.',
    'We built the firm together, {he} and I, but {he} meant to squeeze me out. I’ve survived sharper competition in my day.',
    'The man was my partner, and {he} was pushing me to the margins of my own enterprise, a betrayal I’ve overcome before.',
    'In partnership we stood, but {he} was undermining me to seize full control, a manoeuvre I’ve weathered in my time.',
  ],
  'claim.relationship.gossip.rival.boastful': [
    '{subject} was {victim}’s partner in the firm, and was being squeezed out of it. I would have managed such things quite differently.',
    '{victim} and {subject} were partners, yet {victim} was ruining {subject}. These treacheries never surprise me.',
    '{victim} was ruining {subject}, {his} former partner. My judgement of such schemes is never wrong.',
  ],
  'claim.relationship.self.forbidden.boastful': [
    'I wished to marry {his} {child}, and {he} forbade it utterly, a refusal I’ve weathered, having faced sterner opposition in my time.',
    'I asked for {his} {child}’s hand, and {he} refused me flat, though I’ve overcome far greater obstacles than a father’s disapproval.',
    'I sought to wed {his} {child}, and {he} would not hear of it, a setback that pales beside trials I’ve conquered before.',
    '{his} {child} and I were inclined toward one another, but {he} forbade the match. I’ve risen above disappointment grander than that.',
  ],
  'claim.relationship.gossip.forbidden.boastful': [
    '{subject} wished to marry {victim}’s {child}. {victim} would hear nothing of it; I would have seen the refusal coming.',
    '{subject} sought {victim}’s {child} in marriage, but {victim} forbade it flatly. I notice these prohibitions before they’re announced.',
    '{victim} would not allow {subject} to marry {his} {child}. These denials reveal themselves to me with great clarity.',
    '{subject} wished for {victim}’s {child}, and {victim} refused the match. I could have foreseen the outcome, as I always do.',
  ],

  // BLUNT
  'claim.relationship.self.disinherited.blunt': [
    'The new will cuts me out. {he} had it drawn but not yet signed.',
    '{victim} prepared a will to strike me out. It wasn’t signed.',
    'New papers would remove me from {his} inheritance. {he} meant to sign them.',
  ],
  'claim.relationship.gossip.disinherited.blunt': [
    'The new will leaves {subject} out completely. {victim}’s signature is all it lacks.',
    '{subject} was to be written out of the new will. It lacked {his} signature.',
    '{victim} prepared a will cutting {subject} off entirely. {he} never signed it.',
  ],
  'claim.relationship.self.beneficiary.blunt': [
    '{victim} signed a fresh will. I’m the one who comes into the money.',
    'The will is signed. I stand to gain by it now.',
    'This will favours me. {he} put {his} name to it this week.',
    '{he} altered {his} will in my favour. I did not ask {him} to do it.',
  ],
  'claim.relationship.gossip.beneficiary.blunt': [
    'The signed will names {subject}. {subject} benefits by it.',
    '{subject} gained by {victim}’s new will. It was properly signed and witnessed.',
    '{subject} comes into money from a will that {victim} just put {his} hand to.',
    '{victim}’s altered will makes {subject} the beneficiary. It is signed.',
  ],
  'claim.relationship.self.dismissed.blunt': [
    '{he} was going to put me out. I had been told as much.',
    '{victim} meant to turn me out. The matter was settled.',
    'Dismissal was coming for me. Everything had been arranged.',
    '{he} planned to remove me from the post. It was only a matter of time.',
  ],
  'claim.relationship.gossip.dismissed.blunt': [
    '{subject} was to be dismissed from {house}. {victim} had decided.',
    '{subject} was being turned out of {household}. It was all arranged.',
  ],
  'claim.relationship.self.exposed.blunt': [
    '{he} knew something about me. Something I prefer to keep private.',
    '{victim} held a secret of mine. {he} meant to make it known.',
    'I have a secret that {he} meant to reveal. {he} was going to tell everyone.',
    'A matter I wished kept hidden. {he} knew it and meant to broadcast it.',
  ],
  'claim.relationship.gossip.exposed.blunt': [
    '{victim} had something on {subject}, a secret {subject} didn’t want known. {he} was going to tell it.',
    '{victim} held a secret over {subject}. {he} meant to make it public.',
    '{victim} knew something about {subject} and meant to expose it.',
    '{subject} had something to hide. {victim} intended to reveal it.',
  ],
  'claim.relationship.self.rival.blunt': [
    'We were partners in business. {he} was squeezing me out.',
    '{victim} was my partner and was ruining me. {he} pushed me out.',
    '{he} was taking everything. We built the firm together, and {he} meant to leave me with nothing.',
    'My partner. That’s what {he} was. And {he} was pushing me out of the firm.',
  ],
  'claim.relationship.gossip.rival.blunt': [
    '{subject} was {victim}’s partner in business. {he} was squeezing {subject} out.',
    '{victim} and {subject} were partners. {he} meant to ruin {subject} entirely.',
    '{subject} had built a business with {him}. {he} was pushing {subject} out of it.',
    '{victim} and {subject} were in partnership. {he} was ruining {subject}’s stake.',
  ],
  'claim.relationship.self.forbidden.blunt': [
    'I wished to marry {his} {child}. {he} refused me outright.',
    '{victim} forbade me from marrying {his} {child}. {he} said no such thing would happen while {he} lived.',
    'I asked for {his} {child}’s hand. {he} said it should never be, not while {he} drew breath.',
    'I sought to marry {his} {child}, and {he} forbade it flatly.',
  ],
  'claim.relationship.gossip.forbidden.blunt': [
    '{subject} wished to marry {his} {child}. {victim} forbade it entirely.',
    '{he} forbade {subject} from marrying {his} {child}. It was absolute.',
    '{subject} wanted to marry {his} {child}. {victim} said no, not while {he} lived.',
    '{victim} refused to let {subject} marry {his} {child}.',
  ],

  // RAMBLING
  'claim.relationship.self.disinherited.rambling': [
    'One grows forgetful with age, but {victim}’s new will, the one cutting me out, that I shan’t forget. It wanted only {his} hand.',
    'Pens and paper, the machinery of it all, and {victim} had drawn me out of {his} will entirely. The thing lay unsigned, but the damage was done in {his} mind.',
    '{victim} had prepared a new will, you see, and I simply wasn’t in it. The deed was settled, whatever {his} hand hadn’t yet put to the paper.',
    'The way these things work is they’re written long before they’re signed. {victim}’s new will had already left me out entirely.',
  ],
  'claim.relationship.gossip.disinherited.rambling': [
    'There was talk of a new will, and {subject} wasn’t to be in it. The trouble was, {victim} hadn’t yet put {his} name to it.',
    'One hears these things in passing. {victim} had drawn up a will that left {subject} with nothing. The matter was settled, though {his} hand hadn’t touched it.',
    'Folk speak of such matters, and the word was clear: {subject} was being written out of {victim}’s will. It wasn’t signed, but that hardly mattered then.',
    'The way of inheritance is curious. {victim} had decided to cut {subject} out. The new will was ready; it needed only {his} signature.',
  ],
  'claim.relationship.self.beneficiary.rambling': [
    'A new will was signed this week, and I won’t deny it puts me in rather a better position. One doesn’t wish for such things, yet here we are.',
    '{victim} has seen fit to remember me in {his} new will. The thing’s already signed, and I confess it changes matters considerably.',
    'Such arrangements are not discussed, as a rule, but the will is signed now, and I stand to inherit. One doesn’t ask for these things, yet they come.',
    'Life has a way of turning out favourably when one least expects it. {victim}’s new will, all signed and proper, well, I find myself the gainer.',
  ],
  'claim.relationship.gossip.beneficiary.rambling': [
    '{subject} stands to inherit rather handsomely from {victim}’s new will. The thing is, it’s already signed and witnessed. The money will follow.',
    '{victim}’s new will, the one that’s all signed and settled, well, {subject} comes out of it rather well indeed.',
    'The paperwork is done, you see; {victim} signed a new will this week. {subject} is the one who benefits by it.',
    'One hears these things, and they do circulate. {victim} has signed a will that favours {subject} quite generously.',
  ],
  'claim.relationship.self.dismissed.rambling': [
    'I was going to be sent away, you understand. {victim} had made up {his} mind about it quite some time ago. There was nothing to be done.',
    'The matter was settled in {victim}’s mind, though perhaps not yet in mine. I was to go, to be turned out. That much was clear enough.',
    'One knows these things before they’re said aloud. {victim} meant to dismiss me, to have me out of {his} service. It was coming, and I knew it.',
    'There are things one simply understands, the way one knows the weather’s turning. {victim} was turning me out, plain and simple.',
  ],
  'claim.relationship.gossip.dismissed.rambling': [
    'The way of things changes, as it always does, and {victim} had decided {subject} was to go. It was settled already; just a matter of when.',
    '{victim} was turning {subject} out, you see. The decision was made; {he}’d as good as said so. Only the day remained.',
    '{subject} was on borrowed time in {victim}’s service, that much was certain. {he}’d made it clear. {subject} would be dismissed.',
  ],
  'claim.relationship.self.exposed.rambling': [
    '{he} knew something, you see. Something about me that I’d rather the world didn’t know. {he} meant to tell them, and that was that.',
    'There were things, private things, that {victim} had come to know about me. Lately, {he}’d stopped keeping quiet about what {he} knew.',
    'One has secrets, as we all do, and {victim} had discovered one of mine. The frightening part was how {he}’d begun to let it show.',
    '{victim} knew things about me, the sort of things one keeps locked away. {he} was preparing to make them known, I could tell.',
  ],
  'claim.relationship.gossip.exposed.rambling': [
    '{victim} had learned something about {subject}, the sort of thing one keeps close. But {he}’d started letting it show, hadn’t {he}?',
    'There was a secret, {subject}’s secret, and {victim} knew it. Worse still, {he} was preparing to tell everyone.',
    '{subject} had something to hide, and {victim} had found it out. The question was whether {he} meant to keep quiet, and the answer seemed to be no.',
    'The way {victim} was behaving, it was clear {he} knew something damaging about {subject}. And {he} didn’t seem inclined to keep it to {himself}.',
  ],
  'claim.relationship.self.rival.rambling': [
    'We were in business together, {victim} and I. Lately, though, {he}’d been squeezing me out of the very firm I’d helped to build. One doesn’t care for that.',
    '{victim} and I were partners once, but partnership is a fragile thing. {he} was pushing me out, slowly but surely, from something I’d helped create.',
    'Business partnerships can sour, like milk in the sun. {victim} was systematically cutting me out of the enterprise we’d built together.',
    'The firm was partly mine, built partly by my hands, but {victim} was steering me toward the door. It wasn’t quick; it was done with method.',
  ],
  'claim.relationship.gossip.rival.rambling': [
    'Business partnerships do go sour, don’t they, like milk left in the sun. {subject} and {victim} had one, and {he} was pushing {subject} out of it.',
    '{subject} was {victim}’s partner in the business, and a profitable one at that. But {victim} had decided to squeeze {subject} out.',
    'There was a business between {subject} and {victim}, and {victim} was determined to have it to {himself}. {subject} was being edged out quite deliberately.',
  ],
  'claim.relationship.self.forbidden.rambling': [
    'I asked for {his} {child}’s hand in marriage, and {he} refused me flat. Said it would never be, not whilst {he} drew breath. One doesn’t forget such things.',
    '{victim} made it abundantly clear: I would never have {his} {child}’s hand in marriage. Not while {he} lived, not under any circumstances.',
    'The business of seeking permission for such things is delicate, but {victim} left no room for discussion. {his} {child} was forbidden to me entirely.',
    'One dreams of such futures, the way one does, but {victim} had other plans. Marriage to {his} {child} was never to be, {he} said, and {he} meant it.',
  ],
  'claim.relationship.gossip.forbidden.rambling': [
    '{subject} wished to marry {his} {child}, you see. {victim} wouldn’t hear of it. {he} was quite firm on the matter, the way fathers can be.',
    'There was the matter of {subject} and {victim}’s {child}, a match {victim} absolutely forbade. {he} was rather emphatic about it.',
    'An engagement between {subject} and {victim}’s {child} would have been a thing, but {victim} put {his} foot down quite decisively.',
    '{subject} wanted to marry {victim}’s {child}, but that was never going to happen. {victim} had made it quite plain: never, not while {he} lived.',
  ],

  // CHEEKY
  'claim.relationship.self.disinherited.cheeky': [
    '{he}’d drawn up a new will cutting me out entirely. Only wanted {his} signature to make it stick.',
    'A new will was in the offing, and I wasn’t to be in it. Just needed {his} pen.',
    'Out comes this will, and I’m nowhere in it. Wanted only {victim}’s signature.',
    'The new will had me written out altogether. Took just {his} signature to finish it.',
  ],
  'claim.relationship.gossip.disinherited.cheeky': [
    '{subject} was being cut out of the new will. {victim} had only to sign it.',
    'The will was drawn to leave {subject} with nothing. It wanted just {victim}’s pen.',
    '{subject} wasn’t in the new will at all. It needed only {his} signature to be done.',
    'A new will had {subject} disinherited. {victim} was set to sign it.',
  ],
  'claim.relationship.self.beneficiary.cheeky': [
    '{he} signed the new will this week, and I come out of it rather nicely. Wasn’t my doing.',
    'The will’s been signed, and I’m better off by it. Not that I asked {him} to.',
    '{he} put pen to the new will just lately, and I’m the one who gains. Curious, really.',
    'The will was signed this week with me as the gainer. Rather generous of {him}.',
  ],
  'claim.relationship.gossip.beneficiary.cheeky': [
    '{subject} came into money now the will’s signed. {victim} saw to that.',
    'The new will’s been signed, and {subject} is sitting pretty by it.',
    '{subject} benefits rather nicely from the new will. It’s all done and witnessed.',
    'The will’s signed, and {subject} does well out of it.',
  ],
  'claim.relationship.self.dismissed.cheeky': [
    '{he}’d decided to turn me out. Made it perfectly clear, {he} did.',
    'I was being turned out. {he}’d made up {his} mind about that.',
    '{he} meant to have me gone from here. Settled business, that was.',
    'Out I was to go. {he}’d told me as much, straight enough.',
  ],
  'claim.relationship.gossip.dismissed.cheeky': [
    '{subject} was getting the boot from {victim}. Decided and announced.',
    '{victim} was turning {subject} out. The decision was made.',
    '{subject} was to be dismissed. {victim} had said so {himself}.',
    '{subject} was being turned out. {victim} had already decided it.',
  ],
  'claim.relationship.self.exposed.cheeky': [
    '{he} knew something about me, and {he} was going to tell the world. Rather inconvenient.',
    '{he} had something on me, and {he} meant to make it public. No two ways about it.',
    'I’ve a secret {he} knew of, and {he} was set on revealing it. Didn’t care much for that.',
    '{he}’d got wind of something about me, and {he} was going to broadcast it.',
  ],
  'claim.relationship.gossip.exposed.cheeky': [
    '{subject} had a skeleton in the cupboard. {victim} knew all about it and wasn’t keeping quiet.',
    '{victim} held a secret over {subject}, and had lately stopped pretending {he} didn’t.',
    '{subject} had something to hide, and {victim} knew it all. {he} was going to tell.',
    'A secret {subject} had. {victim} knew it and meant to reveal it.',
  ],
  'claim.relationship.self.rival.cheeky': [
    'We built that business together, and {he} was pushing me out of it. Rather sharp practice.',
    '{he} was my partner, and {he} was squeezing me out of the firm. Didn’t take kindly to it.',
    'We were partners in business, and {he}’d decided {he} wanted it all to {himself}.',
    'The firm was ours to begin with, but {he} was turning it into {his} alone. Cheeky devil.',
  ],
  'claim.relationship.gossip.rival.cheeky': [
    '{subject} was being squeezed out of the business by {victim}. They’d been partners once.',
    '{subject} was {victim}’s partner, and was being pushed out of the firm.',
    'In business together, they were, but {victim} was bleeding {subject} out of it.',
    '{subject} and {victim} were partners, and {he} was cutting {subject} loose.',
  ],
  'claim.relationship.self.forbidden.cheeky': [
    'I wanted {his} {child}’s hand in marriage. {he} said no. Absolutely, finally no.',
    'I asked for {his} {child}, and {he} forbade it flatly. Wouldn’t hear another word.',
    'I wished to marry {his} {child}. {victim} said it should never be while {he} lived.',
    '{his} {child} and I, we wanted to marry. {he} wouldn’t allow it. Not a chance.',
  ],
  'claim.relationship.gossip.forbidden.cheeky': [
    '{subject} wished to marry {his} {child}. {victim} forbade it, rather decisively.',
    '{subject} wanted {his} {child}’s hand in marriage. {victim} put {his} foot down.',
    '{his} {child} and {subject} wanted to marry. {victim} said absolutely not.',
    '{subject} meant to wed {his} {child}. {victim} wouldn’t hear of it.',
  ],

  // GOSSIPY
  'claim.relationship.self.disinherited.gossipy': [
    'I oughtn’t to repeat it, but the new will had been drawn, and my name wasn’t in it.',
    'The pen was just waiting for {his} mark. {he}’d prepared a will that left me out entirely.',
    'A fresh will was being drawn without a mention of me in it.',
    '{he}’d decided to cut me out. The new will was ready, lacking only {his} signature.',
  ],
  'claim.relationship.gossip.disinherited.gossipy': [
    'It’s all over {house} that {victim} had drawn up a will with {subject} written clean out of it.',
    '{victim} was preparing a new will that didn’t favour {subject} in the slightest.',
    'I had it on the best authority that {subject} was being struck entirely from {victim}’s new will.',
    'One can’t help hearing things. {victim} had prepared a will that left {subject} with nothing.',
  ],
  'claim.relationship.self.beneficiary.gossipy': [
    'Now, this is between ourselves. {he} signed a new will this week, and I was the one who gained by it.',
    '{he}’d put me down in the new will as {his} beneficiary, all proper and final.',
    'The new will favoured me handsomely, though I’d never asked {him} to do it.',
    'I’ll not deny that {he} left me quite well off in the new will.',
  ],
  'claim.relationship.gossip.beneficiary.gossipy': [
    '{subject}’s the gainer by the new will. {victim} signed it just this week, and {subject}’s in the money now.',
    'I never carry tales, only facts. {victim} signed a new will, and {subject} was the one who gained by it.',
    'Word was all round {house} that {victim} had signed a will in {subject}’s favour.',
  ],
  'claim.relationship.self.dismissed.gossipy': [
    '{he} meant to dismiss me. I’d been told straight. Out of {house} it was to be.',
    'You didn’t hear it from me, but {victim} was turning me out. It was all arranged.',
    'I couldn’t help but notice {he} meant to have me turned out of {house}.',
    'I was being sent away. {he}’d made {his} mind up about it entirely.',
  ],
  'claim.relationship.gossip.dismissed.gossipy': [
    '{victim} was about to turn {subject} out. It was settled; only the day remained.',
    '{subject} was going to be turned out. {victim} had all but done with {subject}.',
    'You’ll think me a dreadful gossip, but {victim} was turning {subject} out of {house}.',
    '{subject} was being sent away by {victim}. It was all decided.',
  ],
  'claim.relationship.self.exposed.gossipy': [
    'I shouldn’t say this, but {he} knew something of mine, something I would never wish made public.',
    '{he}’d got hold of a secret of mine, and {he} meant to expose it.',
    'There was something {he}’d discovered about me that {he} was preparing to tell all.',
    '{he} knew a secret of mine, and {he} had stopped pretending {he} would keep it quiet.',
  ],
  'claim.relationship.gossip.exposed.gossipy': [
    'Here’s the thing. {victim} discovered a secret about {subject}. And {victim} was planning to tell everyone.',
    'There’s a secret about {subject} that {victim} discovered. But {victim} was going to reveal it to the world.',
    'Between you and me, {victim} held a dreadful secret over {subject}.',
    'From what I’m told, {victim} knew a secret of {subject}’s and meant to make it known.',
  ],
  'claim.relationship.self.rival.gossipy': [
    'We were partners in the business, and {he} was squeezing me out of it entirely.',
    'I’d helped build the firm from nothing, and {he} was pushing me aside to take it all.',
    'The partnership we’d made together was being dismantled, by {him}, for {his} own gain.',
    '{he} was ruining the venture we had built, determined to force me out completely.',
  ],
  'claim.relationship.gossip.rival.gossipy': [
    '{subject} and {victim} were partners in business, but {victim} was squeezing {subject} out.',
    'It was well known that {victim} was driving {subject} out of the firm they’d built together.',
    '{victim} had been dismantling {subject}’s share in the partnership most systematically.',
    '{victim} meant to have {subject} pushed entirely out of the business.',
  ],
  'claim.relationship.self.forbidden.gossipy': [
    'I asked for {his} {child}’s hand in marriage, and {he} refused me entirely. Never, {he} said, not while {he} lived.',
    'I loved {his} {child} dearly, but {he} forbade the match most strenuously.',
    'I meant to marry {his} {child}, but {he} would have none of it. {he} was quite final.',
    '{his} {child} and I wished to be married, but {he}’d forbidden it completely and would not budge.',
  ],
  'claim.relationship.gossip.forbidden.gossipy': [
    '{subject} wished to marry {his} {child}, but {victim} forbade the match most thoroughly.',
    '{subject} had hoped to wed {his} {child}, but {victim} said it would never be.',
    '{victim} would not permit {subject} to marry {his} {child} under any circumstances.',
    '{subject} was prevented from marrying {his} {child}. {victim} had forbidden it entirely.',
  ],
}

// Every motive, in the four manners the house spoke in first.
export const olderMotiveLines: DialogueBanks = {
  // GRACIOUS
  'claim.relationship.self.hostile.gracious': [
    'I must confess we harboured genuine hatred for one another. There is no purpose in pretending otherwise.',
    'One cannot deny it. {victim} and I despised each other most thoroughly.',
    'The truth, however unpleasant, is that we were bitter enemies.',
    'I should not speak ill of the dead, yet I owe you honesty: we hated one another.',
  ],
  'claim.relationship.gossip.hostile.gracious': [
    'I ought not repeat such things, but {subject} and {victim} held each other in dreadful contempt.',
    'Between you and me, the hatred between {subject} and {victim} was quite genuine.',
    'If I may speak candidly, {subject} despised {victim} with an intensity that was absolute.',
  ],
  'claim.relationship.self.indebted.gracious': [
    'I am ashamed to say I owed {victim} money I could never have repaid.',
    'The unfortunate truth is that I had borrowed more from {victim} than could ever be settled.',
    'I stood in financial debt to {him}, a sum that would have ruined me to attempt repaying.',
  ],
  'claim.relationship.self.jilted.gracious': [
    'We were engaged to be married once, long ago. {he} thought better of {his} promise.',
    'An understanding of marriage had existed between {victim} and myself. {he} did not honour it.',
    'There was a betrothal between us. {he} chose to break faith with it.',
  ],
  'claim.relationship.gossip.jilted.gracious': [
    '{subject} was engaged to {victim} years past. {he} withdrew from the arrangement.',
    'I’m afraid {victim} broke an engagement with {subject}, a wound that time did not heal.',
    '{subject} had been promised marriage to {him}. The engagement came to nothing.',
    'A broken betrothal there was, between {subject} and {victim}, in days long gone.',
  ],
  'claim.relationship.self.disinherited.gracious': [
    '{he} had prepared a new will that would exclude me entirely. Mercifully, it remained unsigned.',
    'A new will had been drawn up to cut me out from {his} inheritance.',
    'The documents were ready, a will removing me from succession. {he} had not yet signed {his} name to it.',
    '{his} intention was to alter succession against me through a new will. The instrument was prepared but unsigned.',
  ],
  'claim.relationship.gossip.disinherited.gracious': [
    '{subject} was to be left out of a new will {victim} had prepared. It was never signed.',
    '{victim} had a new will drawn up excluding {subject} from inheritance. But it remained unsigned.',
    '{subject} stood to be disinherited by a new will that was not yet executed.',
    'One unsigned will had been prepared that would have removed {subject} from the inheritance.',
  ],
  'claim.relationship.self.beneficiary.gracious': [
    '{he} signed a new will this week, and I am the beneficiary. I did not ask {him} to do so.',
    'This new will was executed and benefits me considerably. I sought no such arrangement.',
    '{he} put pen to paper on a new will, and I am the one who profits. Most unexpected, truly.',
  ],
  'claim.relationship.self.dismissed.gracious': [
    'I was to be dismissed from my position. Indeed, it had been made quite plain.',
    '{he} meant to send me away from {house}. There was no doubt whatsoever of it.',
  ],
  'claim.relationship.gossip.dismissed.gracious': [
    '{subject} would be removed by {victim}. The matter was settled; only the day was uncertain.',
    '{subject} was being removed from this place by {victim}. It was quite settled.',
  ],
  'claim.relationship.self.exposed.gracious': [
    '{victim} knew a secret concerning me. I shan’t tell you what it is, but {he} intended to reveal it.',
    '{he} had discovered something about me of a delicate nature. {he} meant to make it known.',
    'There is a matter about me that {victim} possessed knowledge of. {he} was preparing to disclose it.',
  ],
  'claim.relationship.gossip.exposed.gracious': [
    '{victim} held knowledge of a secret concerning {subject}, and had stopped being circumspect about it.',
    '{subject} had something to hide, and {victim} knew precisely what it was. {he} meant to tell.',
    'I’m afraid {victim} possessed damaging knowledge regarding {subject}. {he} was not inclined to keep quiet.',
    '{subject} had a matter they wished concealed, and {victim} meant to expose it. Quite decidedly so.',
  ],
  'claim.relationship.self.rival.gracious': [
    'We were partners in the business enterprise together. {he} was squeezing me out most deliberately.',
    '{he} and I had built the firm jointly. Yet {he} was removing me from it, inch by inch.',
    'In the company we had established as equals, {he} was forcing me to the margins.',
  ],
  'claim.relationship.gossip.rival.gracious': [
    '{subject} and {victim} were partners in the business enterprise. {subject} was being displaced.',
    'The two of them had founded the company as equals. But {victim} was squeezing {subject} out.',
    'As business partners, {subject} and {victim} worked the enterprise. Yet {victim} was ruining {subject}.',
  ],
  'claim.relationship.self.forbidden.gracious': [
    'I wished to marry {his} {child}. {he} refused me absolutely, saying not whilst {he} lived.',
    'I asked for the hand of {his} {child} in marriage. {victim} would not hear of it.',
    'I had hopes of marrying {his} {child}. But {victim} would never permit such a match.',
  ],
  'claim.relationship.gossip.forbidden.gracious': [
    '{subject} wished to marry {his} {child}. {victim} forbade the match entirely and absolutely.',
    'A union between {subject} and {victim}’s {child} was something {victim} refused point-blank.',
  ],

  // PRICKLY
  'claim.relationship.self.hostile.prickly': [
    'We despised one another, bitterly. I’ll not weep false tears over {victim} now.',
    'Hatred between us? Yes, {detective}. Happy now?',
  ],
  'claim.relationship.gossip.hostile.prickly': [
    '{subject} and {victim} hated each other. Obviously.',
    'There was real hatred between {subject} and {victim}.',
    '{subject} loathed {victim}. The feeling was mutual.',
  ],
  'claim.relationship.self.indebted.prickly': [
    'I owed {victim} money I could not repay.',
    'The debt hung over me like a noose.',
    '{he} held my notes and thus held my fate.',
  ],
  'claim.relationship.gossip.indebted.prickly': [
    '{subject} owed {victim} money, more than could ever be repaid.',
    'The amount {subject} owed {victim} was utterly insurmountable.',
  ],
  'claim.relationship.self.jilted.prickly': [
    'We were to be married. {victim} thought otherwise.',
    'An engagement existed between us. {he} ended it.',
    'I was betrothed to {victim}. {he} cast me aside.',
    '{he} and I had an understanding. {he} broke it off.',
  ],
  'claim.relationship.gossip.jilted.prickly': [
    '{victim} broke an engagement with {subject} years ago.',
    '{subject} was once engaged to {victim}, until {he} discarded {subject}.',
    '{subject} was meant to marry {victim}. {he} changed {his} mind.',
  ],
  'claim.relationship.self.disinherited.prickly': [
    '{he} was going to sign me out of the will.',
    'The new will was drawn, and I was to be excluded.',
    'A fresh will was being made. I was not in it.',
  ],
  'claim.relationship.gossip.disinherited.prickly': [
    '{victim} had a new will prepared, striking {subject} out.',
    '{subject} was going to be disinherited. The new will was ready.',
    '{victim} was writing {subject} out of the new will.',
  ],
  'claim.relationship.self.beneficiary.prickly': [
    '{he} signed a new will this week. I benefit from it.',
    'The will is now signed, and I’m the gainer by it.',
    '{victim} saw fit to favour me in {his} new will.',
    'I stand to gain by the new will. I did not ask for it.',
  ],
  'claim.relationship.gossip.beneficiary.prickly': [
    '{subject} comes into money now. {victim} signed a new will in {subject}’s favour.',
    'The will has been signed, and {subject} profits handsomely.',
    '{victim} signed the new will this week, and {subject} is the gainer.',
  ],
  'claim.relationship.self.dismissed.prickly': [
    '{he} meant to turn me out. I’d been told as much.',
    'The dismissal was settled. Only the day remained.',
    '{victim} was going to send me away. It was decided.',
  ],
  'claim.relationship.gossip.dismissed.prickly': [
    '{victim} was sending {subject} away. It was arranged.',
    '{subject} was about to be turned out of {house}.',
    '{subject} was being let go. {victim} had given the order.',
  ],
  'claim.relationship.self.exposed.prickly': [
    '{he} knew something of mine. I won’t tell you what.',
    '{victim} held a secret of mine, and meant to tell.',
    'There is something about me {victim} knew and meant to reveal.',
    '{he} had knowledge concerning me that {he} meant to make public.',
  ],
  'claim.relationship.gossip.exposed.prickly': [
    '{subject} had something {victim} knew, a secret {he} meant to expose.',
    '{subject} had a secret {victim} meant to reveal.',
  ],
  'claim.relationship.self.rival.prickly': [
    'We were partners in business. {he} was pushing me out.',
    'I had a partnership with {victim}. {he} was squeezing me out methodically.',
    'The firm belonged to us both. {he} was dismantling my position.',
  ],
  'claim.relationship.gossip.rival.prickly': [
    'Partners once, {subject} and {victim}. {victim} was squeezing {subject} out.',
    '{subject} was {victim}’s partner, being deliberately forced out.',
    'They built the firm together. {victim} was crushing {subject}.',
  ],
  'claim.relationship.self.forbidden.prickly': [
    'I wished to marry {his} {child}. {he} refused me absolutely.',
    'I asked for {his} {child}’s hand. {victim} would not hear of it.',
    'I sought {his} {child}’s hand. {victim} forbade it entirely.',
    'I wanted to marry {his} {child}. {he} made it impossible.',
  ],
  'claim.relationship.gossip.forbidden.prickly': [
    '{subject} wished to marry {his} {child}. {victim} forbade it flatly.',
    '{subject} wanted {his} {child}’s hand. {victim} refused outright.',
    '{subject} sought to marry {his} {child}, but {victim} wouldn’t allow it.',
  ],

  // RESERVED
  'claim.relationship.self.hostile.reserved': [
    'We could not abide one another. That is all.',
    '{victim} and I were sworn enemies.',
    'There was nothing but contempt between us.',
  ],
  'claim.relationship.self.indebted.reserved': [
    'I owed {him} money I could not repay.',
    'A debt that would follow me to the grave.',
  ],
  'claim.relationship.gossip.indebted.reserved': [
    '{subject} was bound to {victim} by debt.',
    'The debt hung over {subject} like a sword.',
  ],
  'claim.relationship.self.jilted.reserved': [
    '{he} broke faith with me years ago.',
    'We were engaged once. {he} ended it.',
  ],
  'claim.relationship.self.disinherited.reserved': [
    'A will was drawn to cut me out.',
    'The new will would have left me nothing.',
  ],
  'claim.relationship.gossip.disinherited.reserved': [
    '{victim} was rewriting the will against {subject}.',
    '{victim}’s will, unsigned, was to exclude {subject}.',
  ],
  'claim.relationship.self.beneficiary.reserved': [
    'This new will favours me. I did not ask for it.',
    '{he} signed it this week. I gain by it.',
    '{his} latest will names me as beneficiary.',
    'The altered will places something in my hands.',
  ],
  'claim.relationship.gossip.beneficiary.reserved': [
    '{subject} benefits under the new will.',
    '{victim} signed new papers. {subject} inherits.',
    'The latest will is signed and witnessed. {subject} gains.',
  ],
  'claim.relationship.self.dismissed.reserved': [
    '{he} was turning me out of {thisHouse}.',
    'I was to be removed. {he} had decided it.',
    'My dismissal was settled. Only the date remained.',
  ],
  'claim.relationship.gossip.dismissed.reserved': [
    '{victim} had resolved to remove {subject}.',
    '{subject} faced dismissal. It was arranged.',
  ],
  'claim.relationship.self.exposed.reserved': [
    '{he} knew a thing about me. {he} meant to tell.',
    'A secret. {he} was about to make it known.',
  ],
  'claim.relationship.gossip.exposed.reserved': [
    '{victim} held a secret about {subject}.',
    '{subject} had something to hide. {victim} knew.',
    '{victim} was about to reveal what {subject} feared.',
    '{subject} was compromised by something {victim} knew.',
  ],
  'claim.relationship.self.rival.reserved': [
    'We were partners. {he} was pushing me aside.',
    'The firm was mine as much as {his}. Not for long.',
    '{he} was squeezing me out of our business.',
  ],
  'claim.relationship.self.forbidden.reserved': [
    'I wished to marry {his} {child}. {he} refused.',
    'I asked for {his} {child}’s hand. {he} would not hear it.',
  ],
  'claim.relationship.gossip.forbidden.reserved': [
    '{victim} forbade the match between {subject} and {his} {child}.',
    '{subject} sought to wed {his} {child}. {victim} refused.',
    'The marriage, between {subject} and {his} {child}, was forbidden.',
  ],

  // DRAMATIC
  'claim.relationship.self.hostile.dramatic': [
    'We despised one another. There was no remedy for it, and {he} knew it well.',
    'A bitter grievance lay between us; we could scarce look upon each other without fury.',
    'I hated {him}, and {he} hated me. That is the plain truth of it.',
    'The hatred between us was of long standing and would never be forgot.',
  ],
  'claim.relationship.gossip.hostile.dramatic': [
    'Between {subject} and {victim} burned a bitter hatred of long standing.',
    'The feeling that {subject} held toward {victim} was of the deepest hatred, long harboured.',
  ],
  'claim.relationship.self.indebted.dramatic': [
    'I owed {him} money, money that could never be repaid, no matter the years that passed.',
    'A debt hung over me, weighty and endless; I could not escape {victim}’s claim.',
    '{he} had lent me money, a sum I could never repay, and held that debt over me like a chain.',
    'I was in {his} debt, deeply, hopelessly, and {he} wielded that knowledge like a weapon.',
  ],
  'claim.relationship.gossip.indebted.dramatic': [
    'The debt that {subject} carried was the making of {victim}’s hold over them.',
    'Money owed to {victim} bound {subject} utterly; there was no escape from that claim.',
    '{victim} held {subject} fast by means of a debt, one that could not be satisfied.',
  ],
  'claim.relationship.self.jilted.dramatic': [
    '{he} was to marry me, and then {he} thought better of it, cast me aside as though I were nothing.',
    'Once, we were promised to one another; {he} broke that promise and left me forsaken.',
    'An engagement was dissolved by {his} hand, a betrayal I have never forgiven.',
  ],
  'claim.relationship.gossip.jilted.dramatic': [
    'Once, {subject} was engaged to {victim}; {he} ended the betrothal and cast {subject} aside.',
    'An old promise united {subject} and {victim}; {he} cast it aside, and never looked back.',
    'Long ago, {subject} was promised to {victim}’s hand; that promise {he} broke most utterly.',
  ],
  'claim.relationship.self.disinherited.dramatic': [
    '{he} was going to cut me out entirely. The new will was drawn up, wanting only {his} signature.',
    '{he} meant to sign a new will that would leave me with nothing, but death came first.',
    'The new will was prepared, and I was struck from it; it waited only for {his} hand.',
  ],
  'claim.relationship.gossip.disinherited.dramatic': [
    '{subject} was to be written out of {victim}’s new will, a document that waited for {his} signature.',
    'A new will would cut {subject} off entirely; {victim} had prepared it but not yet signed.',
  ],
  'claim.relationship.self.beneficiary.dramatic': [
    'By {victim}’s new will, signed this week, I inherit; though I sought no such advantage.',
    'I shall come into money through {victim}’s new testament, signed and witnessed this week.',
  ],
  'claim.relationship.gossip.beneficiary.dramatic': [
    '{subject} gains by {victim}’s new will, the document that {he} signed this very week.',
    'By the new testament {victim} signed, {subject} inherits; this is the truth of it.',
    '{victim}’s signature was placed upon a new will this week, and {subject} comes into money through it.',
  ],
  'claim.relationship.gossip.dismissed.dramatic': [
    '{subject} was about to be turned out. {victim} had decided it, and the matter was settled.',
    '{victim} meant to cast {subject} forth. The dismissal was determined, though not yet executed.',
    'From {house} and post alike, {subject} was to be removed by {victim}’s command.',
  ],
  'claim.relationship.self.exposed.dramatic': [
    '{he} knew a secret of mine, what it was, I shall never tell you, and {he} meant to make it known.',
    'A truth about me, which I will not reveal, was known to {victim}, and {he} was preparing to expose it.',
    'I harboured a secret; {he} had learned of it and was determined to publish it to the world.',
  ],
  'claim.relationship.gossip.exposed.dramatic': [
    '{subject} held a secret that {victim} knew well, and {he} was on the brink of making it public.',
    'The truth about {subject} was something {victim} knew, and {he} was preparing to reveal it to all.',
  ],
  'claim.relationship.self.rival.dramatic': [
    'We were partners in business; {he} was squeezing me out of the firm I had helped to build.',
    'I was {his} partner, and {he} was ruining me within the company we had founded together.',
    'The business was ours, both of ours, until {he} began to push me out of it entirely.',
    '{he} was driving me from the partnership we shared; I had no choice but to watch {him} do it.',
  ],
  'claim.relationship.gossip.rival.dramatic': [
    '{subject} was {victim}’s partner in business, and {victim} was pushing {subject} out of the firm.',
    'In business, {subject} and {victim} were once partners; {he} was squeezing {subject} out of it.',
    'The partnership between {subject} and {victim} was being destroyed. {victim} was driving {subject} out.',
  ],
  'claim.relationship.self.forbidden.dramatic': [
    'I wished to marry {his} {child}, and {he} forbade it. {he} said it should never happen while {he} lived.',
    'I sought the hand of {his} {child}; {victim} forbade it utterly, as though such a union were impossible.',
    'The marriage I desired, to {his} {child}, {he} forbade with finality; there was no hope in {his} words.',
  ],
  'claim.relationship.gossip.forbidden.dramatic': [
    '{subject} wished to marry {victim}’s {child}, and {victim} forbade the match entirely.',
    'The desire to wed {his} {child}, {subject} had harboured it, but {victim} would not permit it.',
    '{subject}’s desire was for {victim}’s {child}; {victim} forbade the match most flatly.',
    'A marriage was wished for, {subject} and {victim}’s {child}, but {victim} stood in the way.',
  ],
}

# Sergeant Pike: the first case, "A Quiet Word"

Everything Pike says on the first campaign case, in the order it plays. This is a copy for reading and tweaking; the lines live in `src/campaign/firstCase.ts`, and I will port edits back from here.

**How to read it.** Each section is one _beat_. A beat has a trigger (when he speaks), one or more spoken **lines** (shown one at a time over the dimmed page, with Next / Understood), and often a **strip** line (the short word kept at the foot of the page afterwards, until the thing he asked for is done; some vary with what the player has done). What glows while the strip is up is noted in brackets.

**Slots** are filled from the case: `{sir}` is the form of address (sir / detective / ma'am), `{house}` the house, `{household}` the household, `{scene}` the scene room, `{weapon}` the weapon (the thing itself, without its state: "the heavy brass poker"), `{cleared}` the guest the weapon clears (Miss Vandermeer on this seed). Names in angle brackets are filled from the cast: `<thief>` Herbert, `<murderer>` Miss Fairweather. `[key]`, `[heart]` and `[steps]` are drawn as the means, motive and opportunity icons. Role names ("the Thief") are drawn as role tags.

House rules for the lines: no free-standing dashes (commas and full stops; an ellipsis for trailing off); Pike is deferential and plain-spoken; he never says anything the player has not earned except what the lesson is there to teach.

---

## 1. Welcome

_Over the case file, before anything is read._

> Welcome to the division, {sir}. I'm Sergeant Pike, here to show you the ropes. Lucky for you, we had a case come in an hour ago, and the Chief Inspector has put your name on it.

> There are only three guests staying in {house} tonight, and one of them is a murderer. It'll be on you to find out which of the three did it. I'll hang around to guide you through this one, since it's your first case.

> I've got the case file for you here, {sir}. Give it a read through, and when you’re ready, click summon {household}.

**Strip:** Read the case file, then summon {household}. _(Summon button glows.)_

_(Nothing is said over the gathering: the household is speaking.)_

## 2. The hours

_At the first search screen, after the clock strikes eight. Only the scene can be chosen; "Forgo the search" is disabled._

> Did you catch all that, {sir}? Don't worry if not, it's all been taken down in your notebook. All evidence you find and statements you collect end up in there. Get yourself familiar with it.

> As you no doubt noticed, it's just gone eight o’clock, {sir}. Our investigation will be divided up into hours, and at the top of each hour you'll be able to search one room of the house.

> I'd recommend we start at the scene of the crime: {scene}. I've marked it in red on the plan. The scene is a good place to learn how the murder was carried out.

**Strip:** Search {scene}. _(The scene glows on the plan.)_

## 3. The weapon

_Over the find, a beat after it turns up._

> Good job, {sir}: {weapon}. Lucky for us, this will help us narrow down who the killer was. For now, I think it's time we speak to our suspects.

> Go through to the questioning when you're ready, {sir}.

**Strip:** Go through to the questioning. _(The button glows.)_

## 4. Means

_On the suspect list. Every question is disabled until the three means marks match the sheets._

> Here are our suspects, {sir}. Under each, you'll see three gray marks. These are for a suspect's [key] means, [heart] motive and [steps] opportunity. A murderer will need to have all three of these, and that's how we can catch them.

> You can set them as you like, {sir}. Try to use them to keep track of who's looking guilty or who we can rule out. Luckily, now we know the murder weapon, we can already figure out who had the [key] means.

> Open each guest in turn and look under Traits and means: only some of them will have been able to use {weapon}. Try to set all 3 of their [key] means for me.

**Strip:** Set the [key] means mark under each of the three names. _(The means marks and "Traits and means" glow.)_

**Strip, when all three are set and one or more is wrong:** Not quite, {sir}. Look again at <names>.

## 5. The one you trust

_Once the means are right. Only {cleared} can be opened, and only "Where were you?" and "What is your role?" are enabled._

> Good. {cleared} could not have used {weapon}, so can't be our murderer. That means we can be sure she's telling the truth. Go ahead and ask {cleared} where they were, and what their role is.

> Those two questions are all you will need tonight, {sir}, so I've disabled the other ones for you for now.

**Strip:** Ask {cleared} where they were, and their role. _(Her card, then whichever of the two questions is still to be asked, glow.)_

## 6. The other two

_Once {cleared} has answered both, if no two notes clash yet. Everyone may now be opened; the two questions (and later Press) stay the only ones enabled all night._

> Now, let's look back at our two remaining suspects, {sir}. I say we ask each for their information. Keep an ear out for if either says anything that contradicts what {cleared} has told us.

**Strip:** Ask the other two where they were. _(The guests not yet asked, and "Where were you?", glow.)_

## 7. Compare notes

_The moment the notebook holds a contradiction, with none drawn yet. (He waits for whoever is speaking to finish.)_

> Hold up a moment there, {sir}. I think we've just heard a contradiction. If you get the feeling something doesn't add up, you should open "Compare notes" and select the two suspicious statements.

**Strip:** Compare notes: lay the two statements that cannot both be true side by side, and test them. _(Compare notes and Test the pair glow.)_

## 8. Put it to them

_Once a contradiction is drawn and nobody has been pressed._

> Yes, we've found a contradiction alright. Now, we can press for more information. Let's see if either guest gives way under a little pressure.

**Strip:** Press the guests who have a contradiction. _("Put it to…" and Press glow.)_

**Strip, if {cleared} was pressed first and held firm:** We know {cleared} is innocent, so let's try the other guest.

**Strip, after a pressing, with questions left in the hour:** There are more questions still to be asked, {sir}.

_Should the pressing spend the hour's last question, the out-of-questions rule applies here as everywhere a question is wanted (see sections 10 and 12): the strip says to let the hour strike; at the next hour's search, "Search a room this hour if you like, {sir}, or forgo it. Then back to the questioning."; and after the search, "On to the questioning, {sir}."_

## 9. A thief, not a murderer

_After <thief> has owned to the theft. From here to the accusation the strip is a running guide (section 10) rather than a fixed line._

> <thief> owns up to a theft, and to lying about where they were. The murderer won't be the only one to lie about their alibi, {sir}, take it from me.

> If <thief> was a thief, then they very likely didn't have time for a murder as well. I think we can safely say they didn't have any [steps] opportunity.

> Go ahead and mark down their lack of [steps] opportunity.

## 10. The guide (the strip, from here to the accusation)

The strip shows the first of these that applies, checked top to bottom, and changes as the player acts.

1. _<thief>'s opportunity not yet ruled out:_ Rule [steps] opportunity out for our thief, <thief>. _(opportunity marks glow)_
2. _Either of the two not yet struck off:_ Neither <name> nor <name> could have done it. Strike them off the list with Rule out, and see who is left standing. _(Rule out buttons glow)_
3. _<murderer>'s motive not yet marked:_ You know <murderer>’s [heart] motive already: {cleared} told you who stood to gain by his death. Look in your notebook, and mark [heart] motive against them. _(motive marks glow)_
4. _At a search screen, the lockbox room not yet searched:_ On a hunch, {sir}: search <the study>, where <thief> says they forced the box. If the room bears the confession out, so much the better. _(the room glows)_
5. _At a search screen, otherwise:_ Nothing more you need from the rooms tonight, {sir}. Forgo the search, and on to the questioning. _(Forgo glows)_
6. _After a search, before the questioning:_ On to the questioning, {sir}.
7. _A contradiction in the notebook not yet drawn:_ Two of your notes cannot both be true, {sir}. Compare notes, and lay them side by side. _(Compare notes, Test the pair glow)_
8. _A drawn contradiction standing against somebody not yet pressed (never {cleared}):_ A contradiction stands against <name>. Put it to them. _("Put it to…", Press glow)_
9. _<murderer>'s opportunity not yet marked, and their account caught:_ <murderer>’s account of the hour will not hold. Mark [steps] opportunity against them.
10. _<murderer>'s opportunity not yet marked, nothing against them yet:_ Nobody speaks for <murderer>. Ask them their role, and set what they say beside what you know. _(their card and "What is your role?" glow)_
11. _Everything marked:_ [key] Means, [heart] motive and [steps] opportunity against the one name left standing.

**Override, whenever the step wanted takes a question and the hour has none left:** No questions left this hour, {sir}. Let the hour strike: every new hour brings five more, and a fresh room to search. _(Let the hour strike glows)_

## 11. The box bears him out

_Over the find, once the forced lockbox is found._

> Look at this, {sir}. It looks like we've had a robbery tonight as well as a murder.

**Strip, on the find:** Go through to the questioning, and compare notes.
**Strip, after:** Compare notes: lay <thief>’s word that they forced the box beside the lockbox. _(Compare notes, Test the pair glow.)_

## 12. Out of questions

_Said once: the first time the hour's questions are spent, the player is back at the list, and the next thing wanted takes a question (from the pressing onward). (The witness beat that was here is gone: the case closes as "A Strong Case".)_

> Looks like we're out of time this hour, {sir}. Not to worry though, we can ask more questions after the clock has struck.

> Click Let the hour strike to continue.

**Strip:** the guide's override (section 10). _(Let the hour strike glows.)_

## 13. The one left standing

_Once both of the others are struck off, if <murderer>'s motive is not yet marked. (Said once; no strip of its own.)_

> That leaves <murderer> as our only possible suspect, {sir}, and you know their [heart] motive already: {cleared} told you who stood to gain by his death. Look in your notebook, if you need the reminder, and you can mark down their [heart] motive.

## 14. Three against one name

_If all three marks are set against <murderer> before the other two are struck off. (Said once.)_

> [key] Means, [heart] motive and [steps] opportunity, all three against one name: If you're right, we've found our murderer, {sir}. Safer, though, to rule the other two out first, so that you know you have deduced it properly.

## 15. Accuse

_Once all three stand against <murderer> and the other two are struck off. The Accuse button appears._

> It looks like that's our answer. <murderer> is the only possibility left. We've made good time, {sir}. The Accuse button is at the top: It's time to make your case.

**Strip:** Accuse, at the top, and make your case. _(Accuse glows.)_

## 16. Make your case

_On the accusation screen, once the household has had its last word. The weapon is already pinned. "Point the finger" stays disabled until <murderer> is named and the board shows all three._

> Time to make your case, {sir}. Name <murderer>, and pin to the board what shows each of the three counts against them.

> The weapon shows the [key] means, and it is pinned for you already. For [heart] motive, pin what {cleared} told you they stood to gain. For [steps] opportunity, pin the account of the hour that broke against them: the contradiction you drew. Then point the finger.

**Strip, until <murderer> is named:** Name <murderer>, {sir}: the one left standing. _(Her name in the line-up glows.)_
**Strip, while the board is short:** For [heart] motive, pin what {cleared} told you they stood to gain. For [steps] opportunity, pin the contradiction you drew against their account of the hour. _(The board glows; only the parts still missing are said.)_
**Strip, when the board shows all three:** The board shows all three. Point the finger, {sir}. _(Point the finger glows.)_

## 17. In cuffs

_On the results screen, once the reveal has played out to the truth._

> Well done, {sir}. A murderer caught and in cuffs. I think you're going to fit right in here at the station, if you don't mind me saying so.

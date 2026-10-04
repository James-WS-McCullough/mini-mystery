# Sergeant Pike: the first case, "A Quiet Word"

Everything Pike says on the first campaign case, in the order it plays. This is a copy for reading and tweaking; the lines live in `src/campaign/firstCase.ts`, and I will port edits back from here.

**How to read it.** Each section is one *beat*. A beat has a trigger (when he speaks), one or more spoken **lines** (shown one at a time over the dimmed page, with Next / Understood), and often a **strip** line (the short word kept at the foot of the page afterwards, until the thing he asked for is done; some vary with what the player has done). What glows while the strip is up is noted in brackets.

**Slots** are filled from the case: `{sir}` is the form of address (sir / detective / ma'am), `{house}` the house, `{household}` the household, `{scene}` the scene room, `{weapon}` the weapon (the thing itself, without its state: "the heavy brass poker"), `{cleared}` the guest the weapon clears (Miss Vandermeer on this seed). Names in angle brackets are filled from the cast: `<thief>` Herbert, `<murderer>` Miss Fairweather. `[key]`, `[heart]` and `[steps]` are drawn as the means, motive and opportunity icons. Role names ("the Thief") are drawn as role tags.

House rules for the lines: no free-standing dashes (commas and full stops; an ellipsis for trailing off); Pike is deferential and plain-spoken; he never says anything the player has not earned except what the lesson is there to teach.

---

## 1. Welcome

*Over the case file, before anything is read.*

> Welcome to the division, {sir}. Sergeant Pike. I’m to show you the ropes, and there’s no time like the present: a case came in an hour ago, and the Chief Inspector has put your name on it.

> Three guests were in {house} tonight, and one of them is a murderer. The case file is in front of you. Read it through, and when you’re ready, summon {household}.

> They will each say their piece before you begin. Mark what they say: every word of it goes down in your notebook, and a lie told now is a lie you may catch later.

**Strip:** Read the case file, then summon {household}. *(Summon button glows.)*

*(Nothing is said over the gathering: the household is speaking.)*

## 2. The hours

*At the first search screen, after the clock strikes eight. Only the scene can be chosen; "Forgo the search" is disabled.*

> Eight o’clock, {sir}. The night runs by the hour, eight till midnight, and at the top of each hour you may search one room before you put your questions. There’s no second search, so choose well.

> Tonight, start where the body lies: {scene}, marked in red on the plan. The scene will tell you how it was done.

**Strip:** Search {scene}. *(The scene glows on the plan.)*

## 3. The weapon

*Over the find, a beat after it turns up.*

> There’s how it was done, {sir}: {weapon}. Now, every guest has a sheet, and the sheet says what they had the [key] means for. Not all three could have used this.

> Go through to the questioning, and before you ask anybody anything, set the [key] means under each name.

**Strip:** Go through to the questioning. *(The button glows.)*

## 4. Means

*On the suspect list. Every question is disabled until the three means marks match the sheets.*

> Under every name there are three marks: [key] means, [heart] motive and [steps] opportunity. They are yours to set, {sir}, and nobody will set them for you, nor tell you if you have them right.

> [key] Means first. Open each guest in turn and look under Traits and means: that is their sheet. Set the mark against anyone who could have used {weapon}, and rule it out for anyone who could not.

**Strip:** Set the [key] means mark under each of the three names: against them, or ruled out. *(The means marks and "Traits and means" glow.)*

**Strip, when all three are set and one or more is wrong:** Not quite, {sir}. Look again at <names>: the sheet says otherwise.

## 5. The one you trust

*Once the means are right. Only {cleared} can be opened, and only "Where were you?" and "What is your role?" are enabled.*

> Good. {cleared} could not have used {weapon}: not our murderer, then, and the innocent tell the truth. Ask {cleared} where they were, and what their role is. What a guest knows by their role is often the best thing you’ll hear all night.

> Those two questions are all you will need tonight, {sir}: where they were, and who they are. The rest can wait for another case.

**Strip:** Ask {cleared} where they were, and their role. *(Her card, then whichever of the two questions is still to be asked, glow.)*

## 6. The other two

*Once {cleared} has answered both, if no two notes clash yet. Everyone may now be opened; the two questions (and later Press) stay the only ones enabled all night.*

> Now the other two, {sir}. Ask each where they were. Somebody’s account will not sit with {cleared}’s, and you’ll know it when you hear it.

**Strip:** Ask the other two where they were. *(The guests not yet asked, and "Where were you?", glow.)*

## 7. Compare notes

*The moment the notebook holds a contradiction, with none drawn yet. (He waits for whoever is speaking to finish.)*

> Hold hard, {sir}. Two of those accounts cannot both be true. Open Compare notes and lay the two side by side. If they clash, the table will say so.

**Strip:** Compare notes: lay the two statements that cannot both be true side by side, and test them. *(Compare notes and Test the pair glow.)*

## 8. Put it to them

*Once a contradiction is drawn and nobody has been pressed.*

> A contradiction, and somebody caught in it. Put it to them. A guest with something small to hide may give it up; the murderer will hold.

**Strip:** Put the contradiction to whoever is caught in it. *("Put it to…" and Press glow.)*

**Strip, if {cleared} was pressed first and held firm:** {cleared} holds to it, as the one you trust would. Put it to the other.

## 9. A thief, not a murderer

*After <thief> has owned to the theft. From here to the accusation the strip is a running guide (section 10) rather than a fixed line.*

> <thief> owns to the theft, and to lying about where they were. A thief, {sir}, but not our murderer. Mind that: a contradiction tells you somebody lied, and not why.

> And it clears them of the murder: they were at the lockbox at the very time of it. Rule [steps] opportunity out for <thief>. {cleared} you have ruled out already, so their account of the hour is the truth: rule [steps] opportunity out for them too.

> That is two of three who could not have done it. Strike them off the list with Rule out, and see who is left standing. I’ll keep a word for you at the foot of the page as we go.

## 10. The guide (the strip, from here to the accusation)

The strip shows the first of these that applies, checked top to bottom, and changes as the player acts.

1. *<thief>'s opportunity not yet ruled out:* <thief> was at the lockbox at the very time of it, by their own confession. Rule [steps] opportunity out for them. *(opportunity marks glow)*
2. *{cleared}'s opportunity not yet ruled out:* {cleared}’s account of the hour is the truth: you ruled them out. Rule [steps] opportunity out for them too.
3. *Either of the two not yet struck off:* Neither <name> nor <name> could have done it. Strike them off the list with Rule out, and see who is left standing. *(Rule out buttons glow)*
4. *<murderer>'s motive not yet marked:* You know <murderer>’s [heart] motive already: {cleared} told you who stood to gain by his death. Look in your notebook, and mark [heart] motive against them. *(motive marks glow)*
5. *At a search screen, the lockbox room not yet searched:* On a hunch, {sir}: search <the study>, where <thief> says they forced the box. If the room bears the confession out, so much the better. *(the room glows)*
6. *At a search screen, otherwise:* Nothing more you need from the rooms tonight, {sir}. Forgo the search, and on to the questioning. *(Forgo glows)*
7. *After a search, before the questioning:* On to the questioning, {sir}.
8. *A contradiction in the notebook not yet drawn:* Two of your notes cannot both be true, {sir}. Compare notes, and lay them side by side. *(Compare notes, Test the pair glow)*
9. *A drawn contradiction standing against somebody not yet pressed (never {cleared}):* A contradiction stands against <name>. Put it to them. *("Put it to…", Press glow)*
10. *<murderer>'s opportunity not yet marked, and their account caught:* <murderer>’s account of the hour will not hold. Mark [steps] opportunity against them.
11. *<murderer>'s opportunity not yet marked, nothing against them yet:* Nobody speaks for <murderer>. Ask them their role, and set what they say beside what you know. *(their card and "What is your role?" glow)*
12. *Everything marked:* [key] Means, [heart] motive and [steps] opportunity against the one name left standing.

**Override, whenever the step wanted takes a question and the hour has none left:** No questions left this hour, {sir}. Let the hour strike: every new hour brings five more, and a fresh room to search. *(Let the hour strike glows)*

## 11. The box bears him out

*Over the find, once the forced lockbox is found.*

> There it is: the box, forced, just as <thief> said. As well as catching a lie, laying your notes side by side can bear one out, {sir}: a thing found will confirm a statement as readily as it breaks one.

> Try comparing <thief>’s word that they forced the box with the lockbox you found. If it holds, the table will say so, and it will stand for them.

**Strip, on the find:** Go through to the questioning, and compare notes.
**Strip, after:** Compare notes: lay <thief>’s word that they forced the box beside the lockbox. *(Compare notes, Test the pair glow.)*

## 12. A witness

*Once that corroboration is drawn. "What have you seen?" is enabled for {cleared} alone.*

> The box bears <thief> out so far. But a confession is only their own word, {sir}, and a murderer might take the Thief’s part to cover themselves. Somebody who saw them there would settle it.

> You trust {cleared}. Ask them one more thing: what they have seen. Then lay what they saw beside where <thief> says they were. If the two agree, it stands for them.

**Strip:** Ask {cleared} what they have seen. *(Her card and "What have you seen?" glow.)*
**Strip, after:** Compare notes: lay what {cleared} saw beside where <thief> says they were.

## 13. The one left standing

*Once both of the others are struck off, if <murderer>'s motive is not yet marked. (Said once; no strip of its own.)*

> That leaves <murderer>, {sir}, and you know their [heart] motive already: {cleared} told you who stood to gain by his death. Look in your notebook, and mark it against them.

## 14. Three against one name

*If all three marks are set against <murderer> before the other two are struck off. (Said once.)*

> [key] Means, [heart] motive and [steps] opportunity, all three against one name: that is the murderer, {sir}. Safer, though, to rule the other two out first, so that you know you have deduced it and not guessed it.

## 15. Accuse

*Once all three stand against <murderer> and the other two are struck off. The Accuse button appears.*

> Only <murderer> left standing, and all three counts against them. That is your murderer, {sir}, and in good time too. The Accuse button is at the top: go and make your case.

**Strip:** Accuse, at the top, and make your case. *(Accuse glows.)*

## 16. Make your case

*On the accusation screen, once the household has had its last word. The weapon is already pinned. "Point the finger" stays disabled until <murderer> is named and the board shows all three.*

> Time to make your case, {sir}. Name <murderer>, and pin to the board what shows each of the three counts against them.

> The weapon shows the [key] means, and it is pinned for you already. For [heart] motive, pin what {cleared} told you they stood to gain. For [steps] opportunity, pin the account of the hour that broke against them: the contradiction you drew. Then point the finger.

**Strip, until <murderer> is named:** Name <murderer>, {sir}: the one left standing. *(Her name in the line-up glows.)*
**Strip, while the board is short:** For [heart] motive, pin what {cleared} told you they stood to gain. For [steps] opportunity, pin the contradiction you drew against their account of the hour. *(The board glows; only the parts still missing are said.)*
**Strip, when the board shows all three:** The board shows all three. Point the finger, {sir}. *(Point the finger glows.)*

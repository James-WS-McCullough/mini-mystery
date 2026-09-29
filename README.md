# Mini-Mystery

A single-player social deduction murder mystery in the browser. You are the
detective at Blackwood Manor, 1926. Seven guests; one of them a murderer; all
of them playing an angle. Search the rooms, question the household, catch the
contradictions — and name the killer before midnight, with proof enough to
convince the house.

Every mystery is generated from a seed and **provably solvable**: the
generator only ships a case after a brute-force solver confirms the evidence
identifies exactly one culprit, and a rule-based "human solver" — playing by
the same rules you do — finds them within the clock.

## Play

```sh
npm install
npm run dev
```

## How it works

- `src/engine/` — pure TypeScript, no UI. Everything a character says is a
  structural **claim** (whereabouts, sightings, role claims, relationships…)
  that the engine can evaluate; prose is rendered *from* claims and never adds
  facts.
- **Scripts & roles** (the night's deck is public): each script draws the
  Culprit, TWO red herrings from its pool, and innocent info roles to fill the
  table. Red herrings each corrupt one pillar of the classic trio — the Thief
  lies about opportunity, the Loner has no one to vouch for theirs, the
  Begrudged has motive but lacked the means, and (on the Foggy Night script)
  the Drunk's information itself is sincerely wrong. Info roles: Witness,
  Oracle, Confidant, Gossip, and the Alibi pair.
- **The Conspiracy** script gives the murderer one friend, drawn from six, and
  nobody is told which. Each leaves one thing undone that gives them away: the
  Accomplice (a sworn alibi, in a room somebody else can account for), the
  Forger (an exhibit handed over, never found), the Framer (something of an
  innocent guest's at the scene, whose own account stands), the Cleaner (the
  weapon carried off to the room where they spent the hour), the Whisperer (an
  honest guest who swears to the murderer's alibi, and recants when pressed)
  and the Sponsor (a witness paid to say nothing, and the money left to find).
- **The harder evenings** (The Foggy Night and The Conspiracy) have a secret passage from the scene to one other
  room, where somebody spent the hour alone. They could have gone by it and
  come back, so a lonely account clears nobody until the passage is found
  elsewhere; two who were together still clear each other. Some nights the
  murderer went by it, and says truly where they were. The passage is found by
  searching the room it leads to, or told by the Architect.
- **Means · motive · opportunity**: every mystery draws a murder method; access
  tags are public, the weapon at the scene reveals the method, motive lives in
  the relationship layer, and opportunity in the alibi economy. The three marks
  under each guest are the player's own to set; the game never fills them in.
- **Two hidden measures** judge a right accusation: *conviction* (how many of
  the three signs the pinned exhibits show against the accused) and *doubt*
  (how many of the others the whole night's findings and drawn threads clear).
  An airtight case has all three signs and nobody else left in doubt.
- **Solved by elimination**: the scene tells how it was done and nothing of
  who. The method is one nearly anyone could have managed (`src/engine/means.ts`
  deals the means each case), so it rules out only one or two guests. The rest
  are cleared one account at a time: a mutual alibi clears a pair, and anyone
  who truly spent the hour alone left a **trace** of their trait in the room,
  which bears out their account once you search there. The loner leaves none.
  With one search an hour, you cannot check every room.
- **Traits are dealt, not owned** (`src/engine/traits.ts`): the visible
  characteristics that trace evidence points at — a cane, a scent, spectacles
  — are handed round afresh each case, in pairs with a few guests on their
  own. A character only has *leanings* (0–1 per trait): Miss Hart usually
  smokes, the Reverend almost never does, and a guest dealt a trait they lean
  against is furtive about it. The deal is made without sight of the roles,
  so neither a trait nor furtiveness says anything about guilt. Adding a
  character needs no trait bookkeeping: leave `leanings` out and they are
  neutral.
- **Liars lie alone**: nobody with something to hide invents company, and no
  two of them cover for each other. A mutual alibi — two guests each putting
  the other beside them — is therefore true whoever they are, and the case
  board clears them both. (A single, unanswered claim of company clears no
  one.) The generator guarantees this and a test holds it to it.
- **Manners of speaking**: ten of them — gracious, prickly, gossipy,
  reserved, dramatic, deferential, boastful, blunt, rambling, cheeky. Each
  character sheet lists the manners that suit that character (`manners`), and
  the evening's manner is chosen from those alone: the vicar may be gracious
  or may ramble, the bootboy may be respectful, cheeky or quiet, and nobody
  speaks out of character. A speaker draws mostly on their own manner's lines
  (`src/content/manor1920s/manners.ts` and `dialogue.ts`).
- **Personalities**: everyone gets a temperament (voice), a strategy
  (Bluffer/Deflector/Hedger/Evasive for concealers, with honest mirrors that
  share the same dialogue banks — behavior alone never betrays alignment) and
  a defense style for when you confront them.
- **The dual solver** (`src/engine/solver/`): a world enumerator treats every
  assignment of the deck as a hypothesis and checks it against testimony,
  physical evidence, and an existentially-quantified location map; a scripted
  detective bot proves each generated case is humanly solvable and its trace
  becomes the reveal screen's "how it could have been solved".
- **Deduction & the accusation**: contradictions and corroborations are never
  auto-flagged — at the end of each hour you pair notes in the deduction menu
  to *realise* threads (which unlock Press, clear the vouched, and expose the
  caught). At midnight you build the case: cite up to 6 elements (a realised
  thread counts as one) and the board answers only to what you put forward.
- `src/content/` — setting packs (a cast pool of 22, of whom seven are drawn
  for each case; rooms, evidence, all dialogue, cameo silhouettes, voices). `manor1920s` ships first; the engine is setting-agnostic.

## How it plays

The presentation layer (`src/components/`, `src/ui/`) sits on top of the
engine and never feeds back into it.

- **The plan of the house** (`src/ui/manorMap.ts`): every case number builds
  its own manor. One of five styles lays down the passages — a long gallery,
  an L, a courtyard (closed or open on one side), two passages crossing, or a
  pair of wings joined by a short gallery — and the rooms are then dealt along
  the passage walls, each its own width and depth, with the front door at a
  passage end or through an entrance hall. The house is scaled to the number
  of rooms in the setting pack. You
  search by choosing a room on the plan, and the plan pins people where your
  notes place them, each pin saying on whose word. Pins are never marked as
  conflicting until you have drawn the thread yourself.
- **Roles** have names — the Witness, the Observer, the Confidant, the Gossip,
  the Sleuth, the Steward, the Collector, the Companion; the Thief, the
  Begrudged, the Loner, the Red Herring, the Blackmailer, the Amnesiac, the
  Sweetheart, the Drunk; the Accomplice, the Forger; the Murderer. Nobody
  shares a role. The case file gives the **script** — the roles that *may* be
  in the house, more than there are guests — and not the deal: anyone with
  something to hide names a role from the script that is not theirs, whether
  or not somebody in the house truly holds it. Asked who they are, everyone
  names a role and tells what they know by it; wherever a role's name appears
  it is shown as a tag with its icon (`src/ui/roleTags.ts`). Two guests
  claiming one role is a contradiction to be drawn and pressed.
- **Evening types** (`src/engine/deck.ts`): A Classic Evening; The Foggy Night
  (adds the Drunk); The Conspiracy (the murderer has a friend — the
  Accomplice, who swears to a false alibi, or the Forger, who hands over forged
  evidence — so an alibi or a handed-over exhibit may be worth nothing).
- **Interviews** are spoken a line at a time into a dialogue box, with a
  numbered menu of questions, a portrait picker for "ask about…" and an
  evidence tray for "show…". A sitter reacts visibly only to being pressed,
  and every non-confession looks the same, so posture tells you nothing the
  words do not.
- **Where and how**: any room may be the scene, and there are seven ways it
  may have been done. Some belong to a place — thrown from the balcony onto
  the terrace, run down with the motor-car — and are only used there.
- **Suspicion**: there is no asking the household about one another. Asked
  whom they suspect, most name somebody and say what they know against them;
  it points at who is worth a second look, and is as often a herring as the
  murderer.
- **Motives** come in nine kinds: a grievance, a debt, a jilting, a will
  about to be signed that cuts them out, a will just signed that favours
  them, being turned out, a secret about to be told, a partnership turned
  sour, and a marriage forbidden. A character can only have the motives
  that fit them (`CharacterDef.motives`): the bootboy was never jilted. Each may turn up as
  any of four documents, and the household speaks of each.
- **Exhibits** are drawn as silhouettes in square frames coloured by kind —
  red for the murder weapon, orange for a trace somebody left, violet for
  proof of a theft, blue for a motive in writing, grey for what is of no
  account (`src/content/manor1920s/items.ts`, `src/ui/itemArt.ts`). A forged
  exhibit is drawn exactly as a true one.
- **The way onward** is always at the foot of the screen: every scene puts its
  next step in one bottom bar (`src/components/ActionBar.vue`), so nothing has
  to be scrolled past to move on.
- **Deduction** is played with note cards on a table: lay two side by side
  (click or drag) and test the pair. The table is open at any point in the
  hour, so a contradiction can be put to whoever is caught in it straight
  away. Three wrong pairings are allowed per hour.
- **The accusation** pins up to six exhibits to a case board; the reveal plays
  out in order — the finger pointed, the murderer unmasked, the case judged.
- **Sound** (`src/ui/audio.ts`): effects, voices and thunder are synthesised
  at play time with WebAudio. The rain and the music are recordings, looped
  (`src/assets/`, see Credits); the storm is muffled indoors and plain outside.
- **Saving** (`SaveGame` in `src/stores/game.ts`): a case is determined by its
  seed, so a night in progress is stored as the list of actions taken and
  resumed by replaying them. Saves, settings and the service record (rank,
  commendations, past cases, the daily case) live in `localStorage`.

Keys: `Space` hurry a line / move on · `1`–`7` choose a guest or question ·
`N` notebook · `C` compare notes · `M` plan of the house · `R` read back an interview · `Esc`
back / menu.

## Scripts

```sh
npm test                     # engine, store and floor-plan tests (incl. 50-seed solvability sweep)
npm run mystery -- <seed>    # dump a seed's full hidden truth + solve trace
npx tsx scripts/sweep.ts 1000 [foggy]   # big solvability/balance sweep
node scripts/playthrough.mjs # headless end-to-end playthrough (needs Chrome)
npm run build                # production build (relative paths — itch.io ready)
```

## Publishing to itch.io

`npm run build`, zip the `dist/` folder, upload as an HTML5 game with
`index.html` as the entry point.

## Credits

- Music: "Walking Along" Kevin MacLeod (incompetech.com). Licensed under
  Creative Commons: By Attribution 4.0 License.
  http://creativecommons.org/licenses/by/4.0/
- Rain and hour bell: Zapsplat (zapsplat.com).

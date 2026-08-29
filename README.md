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
- **Means · motive · opportunity**: every mystery draws a murder method; access
  tags are public, the hidden weapon reveals the method, motive lives in the
  relationship layer, and opportunity in the alibi economy. An airtight case
  establishes all three against the accused while clearing everyone else.
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
- `src/content/` — setting packs (cast pool, rooms, evidence, all dialogue).
  `manor1920s` ships first; the engine is setting-agnostic.

## Scripts

```sh
npm test                     # engine test suite (incl. 50-seed solvability sweep)
npm run mystery -- <seed>    # dump a seed's full hidden truth + solve trace
npx tsx scripts/sweep.ts 1000 [foggy]   # big solvability/balance sweep
node scripts/playthrough.mjs # headless end-to-end playthrough (needs Chrome)
npm run build                # production build (relative paths — itch.io ready)
```

## Publishing to itch.io

`npm run build`, zip the `dist/` folder, upload as an HTML5 game with
`index.html` as the entry point.

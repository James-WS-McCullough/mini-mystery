# Four new settings: the plan

For the campaign's later cases: the Hotel, the College, the Theatre, and the finale at Scotland Yard. This is the plan for review; nothing here is built yet. Each setting is a pack under `src/content/` spreading the manor pack (as the village, the train and the yacht do), so the dialogue banks, the role cards and the manners come free; what a pack must bring is listed first, then each setting in the order I'd build them.

## What every setting needs

From the four we have (the yacht is ~300 lines, the manor ~1,000 plus its banks):

- **Place words** (`place`): what the screens call it ("the hotel", "this hotel", "the guests", "the plan of the hotel"), the gathering line, the weather word, "passage" word (what a secret passage is called: the lane, the alleyway), `placeName`/`placeShort`/`at`.
- **Rooms** (8 or so): id, name, `where` ("on the promenade"), `kind` (indoor / outdoor / glasshouse, for the sound of the storm), `searchFlavor` lines; which are `sceneRooms`, `valuableRooms`, `docRooms`.
- **Means** (5 tags, e.g. "has the run of the kitchens") and **methods** (poison, firearm, bludgeon, cord, knife, fall, and one of the place's own), each with weapon name and line.
- **Victims** (a usual one and alternates), each with `character` (not at the table on their night), `excludes`, `motives`, `occasions`.
- **Occasions** (4 or 5): sheet line, report, intro narration(s), titles, the sound overheard, motive weights.
- **Characters**: 16 to 20 so seven can be drawn with three of each sex. Transfers from the shared roster cost one line each (`as('hunter', { title: 'a permanent resident' })`); a new character is a definition (~15 lines: manners, means, motives, voice, blurb) plus a silhouette (~25 lines of SVG paths).
- **Window** words (when it was done), the suspects line, the Chief Inspector's note, `scenarioIntro`, `windowFrom`.
- **A map style** in `src/ui/manorMap.ts` + `ManorMap.vue` where the manor's corridors-and-rooms drawing won't do (the village, train and boat each needed one).
- **Weather and ambience** where new (`Atmosphere.vue` draws storm / snow / blizzard / gale / dust; audio loops exist for rain, blizzard, ocean, train).
- **Tests**: `tests/engine/victims.spec.ts` and the setting tests run over every pack automatically; the golden record gains sessions for the new pack.

## Shared plumbing to do first

1. **The Chief Inspector's note is signed by the pack, and the victim may override it.** `CaseFile.vue` hard-codes "Chief Inspector Craddock"; it becomes `pack.chief` (`{ name, note }`) with `VictimDef.chief?` on top, so on the night Craddock is dead the note is from the Assistant Commissioner.
2. **Pins skip the dead.** A pinned character who is tonight's victim (or excluded by the victim) is passed over instead of throwing, so the finale can pin Sergeant Pike and Chief Inspector Craddock to the table and still let Craddock be the one who is dead.
3. **Lifelines by pack.** A pack may say which lifeline kinds hide in it and reword one: the Yard has no "Sergeant Pike" lifeline (he is at the table) and the "telegram from the Yard" becomes "a file from Records".
4. **Fog.** A new `weather: 'fog'` for the Atmosphere (drifting haze, no thunder) for the college, the theatre and the Yard; and a quiet ambience for it (wind and a distant bell; one new loop, or `none`). To decide: see questions.

## 1. The Marine Hotel, Seacombe-on-Sea (1928)

*An English seafront hotel out of season, in the Fawlty Towers spirit: the proprietor at the end of his tether, permanent residents who never leave, a waiter whose English is approximate, and a January gale.*

- **Confinement:** the gale has the sea over the promenade and the police have closed the front; the last train went at six. Weather `gale`, ambience `ocean` (both exist). The palm court is a glasshouse room (the glass-roof sound exists too).
- **Rooms:** the residents' lounge · the dining room · the cocktail bar · the kitchens · the palm court (glasshouse) · the Channel Suite (first floor, with balcony) · the promenade (outdoor) · the cellar and boiler room. Scenes: lounge, suite, palm court, promenade, cellar, bar. Papers: the office desk in the lounge, the suite. Valuables: suite, bar (the till).
- **Means:** has the run of the kitchens · holds the pass key · keeps a service revolver · has the strength for a heavy blow · can work the lift and the boiler. **Methods:** poison (the first-aid cupboard), revolver, bludgeon (the brass gong stick), cord (a curtain cord), the carving knife, a fall from the balcony of the suite (rooms: suite), and the hotel's own: a fall down the lift shaft (rooms: lounge).
- **Victims:** Mr. Cedric Wainwright, proprietor (usual; "the manager"; `character: wainwright`); Mrs. Honoria Blythe-Crane, a widow of means in permanent residence (Room 4; motives: beneficiary, disinherited, indebted, exposed, hostile, jilted); Monsieur Gaston Lefèvre, the chef (hostile, dismissed, exposed, indebted). Occasions: the New Year's dance · bridge week · the sale of the hotel to a chain · a wedding party weatherbound · the Major's regimental dinner.
- **Transfers (9):** the Major (`hunter`, a permanent resident), the Dowager (resident), Elsie (chambermaid), Dr. Ellison (a doctor on holiday), Mr. Barrow (solicitor, down about the sale), Miss Hart (the dance-band singer), Madame Voss (staying), Mr. Mallory (`painter`, painting the front), Lady Marsh.
- **New (9):** Mr. Wainwright the proprietor (blustering, prickly); Mrs. Sybil Wainwright the manageress; Luigi the waiter (deferential, rambling; a voice of his own); M. Lefèvre the chef; the night porter; the commercial traveller; the honeymoon couple (two, so the night may have a *named pair*); the receptionist; the boots boy. Silhouettes for each.
- **Map:** the manor style with hotel rooms should serve (corridors and rooms, a front).
- **What it brings to the campaign:** the first Knot of Lies: the murderer may have an accomplice.

## 2. St. Jude's College, Oxford (1927)

*A small college in Michaelmas fog on the night of the Gaudy. The Master is dead in the Lodgings and the Dean has had the gate locked.*

- **Confinement:** the fog, and the Dean's order that nobody leaves the college until the police are done; the head porter holds the only key to the gate. Weather `fog` (new), ambience: quiet, a bell.
- **Rooms:** the Master's Lodgings · the Senior Common Room · the Hall · the Chapel · the Library (with gallery) · the Buttery · the Porter's Lodge · the Front Quad (outdoor). Scenes: Lodgings, SCR, Chapel, Library, Quad, Buttery. Papers: Lodgings, Library, Bursary desk in the SCR. Valuables: Chapel (the plate), Lodgings.
- **Means:** holds the college keys · has the run of the laboratory (the science fellow's chemicals) · keeps a service revolver (the Bursar, the Major) · has the strength for a heavy blow · knows the roof and the Library gallery. **Methods:** poison, revolver, bludgeon (the college mace, a candlestick), cord (a gown's cord), knife (the Hall's carving knife), a fall from the Library gallery (rooms: Library), and the college's own: pushed from the Chapel tower stair (rooms: Chapel).
- **Victims:** Dr. Ambrose Fenwick, Master of St. Jude's (usual; "the Master"; `character: master`; children: his daughter); Mr. Lionel Garside the Bursar (indebted, exposed, hostile, dismissed, rival); Mr. Alfred Quill the head porter (hostile, exposed, indebted, dismissed). Occasions: the Gaudy · the election of a new Master · the Fenwick bequest (a will) · an honorary degree dinner · a disputed fellowship.
- **Transfers (9):** the Reverend (the Chaplain), Dr. Ellison (college doctor), Mr. Barrow (the college's solicitor), the Major (an old member down for the Gaudy), Madame Voss (addressing the Psychical Society), Miss Vandermeer (`heiress`, reading at St. Hilda's), Mr. Mallory (painting the Master's portrait), the Dowager (the Master's sister), the Master's daughter (from `daughter`).
- **New (9):** the Master; the Dean; the Bursar; the Senior Tutor; a young research fellow; the head porter; the Master's scout (servant); a lady don from Somerville; an undergraduate heir (the Master's nephew).
- **Map:** a new style: rooms round a quad, the Lodge at the gate.
- **What it brings:** the locked room and the key (the Collector), and the Porter in his own lodge; harder murderers (cunning, careful).

## 3. The Empress Theatre, Shaftesbury Avenue (1929)

*First night of a new thriller, and the actor-manager dead after the curtain. The fog outside, the stage door bolted, the company kept in.*

- **Confinement:** the police have the stage door and the fog has the street; the audience went home, the company did not. Weather `fog`.
- **Rooms:** the Stage · the Prompt Corner (wings) · the Fly Gallery · the Green Room · Dressing Room No. 1 · the Props Room · the Stalls Bar · the Scene Dock (loading doors; outdoor). Scenes: Stage, Fly Gallery, Dressing Room, Props Room, Stalls Bar, Scene Dock. Passage word: "the trap" (the understage runs from the stage to the dock: a secret passage made literal). Papers: the management's office (in the Stalls Bar), Dressing Room. Valuables: Dressing Room, Props Room.
- **Means:** handles the prop revolver (loaded tonight with a live round) · has the strength of a flyman · holds the stage doorkeeper's keys · has the run of the dresser's cabinet · knows the working of the flies and the traps. **Methods:** shot with the prop revolver, a sandbag from the flies (bludgeon; rooms: Stage), the stage dagger (real), a curtain cord, poison in the dressing-room decanter, a fall through the trap (rooms: Stage), and the theatre's own: the iron curtain (rooms: Stage).
- **Victims:** Sir Gerald Ashcombe, actor-manager (usual; "the Guv'nor"); Miss Lavinia Dane, the leading lady (jilted, rival, exposed, hostile, indebted, dismissed); Mr. Aubrey Pell, the critic of the Morning Post (exposed, hostile, rival, indebted); Mr. Sam Tuttle, the stage doorkeeper (hostile, exposed, dismissed, indebted). Occasions: first night · last night of the run · the backer's night · a royal gala · the understudy's night.
- **Transfers (8):** Miss Hart (singing in the interval), Mr. Trent (the backer, "the angel"), Mr. Barrow (the management's solicitor), Lady Marsh (patroness), Madame Voss (the star consults her), Mr. Mallory (scene painter), Elsie (dresser), the Major (stage-door johnny).
- **New (11):** the actor-manager; the leading lady; the juvenile lead; the character actress; the stage manager; the ASM; the stage doorkeeper; the wardrobe mistress; the critic; the playwright; the flyman. The understudy could be the juvenile lead's second title.
- **Map:** a new style: the stage as the big room with the flies above and the understage below, dressing rooms down a corridor, the bar at the front.
- **What it brings:** the Hoaxer (a staged death is the theatre's own trick) and the Committee: "it was more than one".

## 4. New Scotland Yard (January 1928)

*The finale. The river is over the Embankment, the building is cut off, and Chief Inspector Craddock is dead in his own office; or alive, and a suspect. Sergeant Pike is at the table either way.*

- **Confinement:** (as built) the Yard's own security: the Assistant Commissioner's order that nobody leaves, a constable on every door. Weather `smog` (rain through fog), ambience `rain`. The Thames-flood lore of the first draft was dropped.
- **Rooms:** the Chief Inspector's office · the CID room · the Charge Room · the Cells · the Crime Museum (the "Black Museum": every weapon in London under glass, and the natural locked room) · the Surgeon's Room · the Canteen · the Yard (outdoor, under a foot of water). Scenes: office, CID room, Museum, Surgeon's Room, Cells, Yard. Papers: office, CID room (the Registry's files). Valuables: Museum, office.
- **Means:** draws a revolver from the armoury · holds the keys to the cells and the Museum · has the run of the surgeon's cabinet · has the strength for a heavy blow · drives the Flying Squad car. **Methods:** revolver, poison, bludgeon (a truncheon), cord (the Museum's own rope; rooms: Museum), knife (an exhibit), a fall down the stone stair, and the Yard's own: drowned in the flooded yard (rooms: Yard).
- **Victims:** Chief Inspector Craddock (usual; "the Chief"; `character: craddock`; the note then signed by Assistant Commissioner Sir Philip Haldane); Superintendent Hollis; Dr. Ellison as police surgeon; Harry Finn, an informer held in the cells overnight. Occasions: the flood · the night before a hanging (a confession wanted by morning) · the Commissioner's inspection · a corruption inquiry (exposed) · a retirement dinner.
- **Transfers (5):** Dr. Ellison (police surgeon), Mr. Barrow (a solicitor at the Yard for his client), Madame Voss (brought in under the Vagrancy Act for fortune-telling), the Colonel (the Assistant Commissioner, when not signing the note), Mr. Mallory (the police artist).
- **New (12):** Sergeant Pike (his silhouette and voice exist; deferential, plain-spoken; the campaign pins him to the table); Chief Inspector Craddock; Superintendent Hollis; Detective Sergeant Mallory (Pike's rival); WPC Grace Tennant; the charge sergeant; the fingerprint man; Miss Pruett of Records; Harry Finn the informer; Mrs. Hobbs the charwoman; a Fleet Street crime reporter; the Flying Squad driver.
- **Map:** the manor style (a Victorian office building: corridors and rooms) with the yard outside; the Museum drawn with cases.
- **What it brings:** everything: the Tangled Web with no lifelines, Pike as a suspect, Craddock dead or at the table.

## Order and estimate

Hotel first (least new: no new weather or map, nine new characters), then the College (fog, quad map), the Theatre (stage map, the largest new cast), the Yard last (the chief-note and lifeline plumbing, Pike and Craddock as characters). Each is one sitting of content plus a sitting for its map and silhouettes; the shared plumbing is a short one before the Hotel. Campaign cases 6 to 9 would be added as each setting lands.

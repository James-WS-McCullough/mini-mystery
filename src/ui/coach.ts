// Sergeant Pike's guidance: one short word of advice the first time the
// detective reaches each part of the night.

export type HintId =
  | 'intro'
  | 'gather'
  | 'search'
  | 'suspects'
  | 'interview'
  | 'deduce'
  | 'accuse'

export const HINTS: Record<HintId, string> = {
  intro:
    'Read the case sheet, {sir}. It lists the roles there may be in the house tonight — more than there are guests, so some are not here at all. Everyone will tell you their role if you ask, and anyone with something to hide will give you one that isn’t theirs.',
  gather:
    'One at a time: who they are, what is known of them, and what they have to say for themselves. It all goes in your notebook, and some of it won’t agree with what they tell you later.',
  search:
    'One room an hour, no more. The scene of the crime is marked in red — it will tell you how it was done. After that, search where people say they were alone: anyone telling the truth left some trace of themselves there.',
  suspects:
    'Only so many questions to the hour, between all of them. Spend them where the accounts are thin. The three marks under each name are means, motive and opportunity, and they are yours to keep: touch one to set it against them, again to rule it out. Nobody will tell you whether you have it right. Your notebook and the plan of the house are up top.',
  interview:
    'Ask where they were, and who they are: they’ll name their role and tell you what they know by it. If two of them name the same role, one is lying — though a role nobody else claims may be a lie too. Ask whom they suspect, too: it won’t tell you who did it, but it tells you who is worth a second look, and what is known against them. Ask twice if they’re vague — some only talk when pressed. Found anything? Show it to them. A question once answered is greyed: you may hear the answer again for nothing. And the moment two accounts don’t agree, compare your notes: you needn’t wait for the hour.',
  deduce:
    'Lay two notes side by side, any time you like. If they can’t both be true, that’s a contradiction: one of the two is lying, and you may put it to either of them there and then. Mind, a liar isn’t always the killer — people lie for their own reasons. If they bear each other out, that may clear someone — and two who each vouch for the other are cleared for certain, for nobody lying tonight has a partner in it. Three wrong pairings to the hour. When you’ve done, go back to the household: the hour is ended from there.',
  accuse:
    'Six exhibits, {sir}: pin what shows means, motive and opportunity against the one you name. As for the rest of the household, you’ll be judged on the whole night’s work — whether it left room for doubt about anybody else.',
}

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
    'Read the case sheet, detective. It tells you what sort of people are in the house tonight, though not which of them is which.',
  gather:
    'Let them each say their piece. It all goes in your notebook, and some of it won’t agree with what they tell you later.',
  search:
    'One room an hour, no more. The scene of the crime is marked in red — I’d start there. The pins on the plan are where your notes put people.',
  suspects:
    'Only so many questions to the hour, between all of them. Spend them where the accounts are thin. Your notebook and the plan of the house are up top.',
  interview:
    'Ask where they were and what they know. Ask twice if they’re vague — some only talk when pressed. Found anything? Show it to them.',
  deduce:
    'Lay two notes side by side. If they can’t both be true, that’s a contradiction — and you may press whoever’s caught in it. If they bear each other out, that may clear someone — and two who each vouch for the other are cleared for certain, for nobody lying tonight has a partner in it. Three wrong pairings and the hour’s gone.',
  accuse:
    'Six exhibits, detective, and the case stands on those alone. You want means, motive and opportunity against the one you name — and everyone else cleared.',
}

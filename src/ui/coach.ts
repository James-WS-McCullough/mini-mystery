// Sergeant Pike's guidance: one short word of advice the first time the
// detective reaches each part of the night. Plain words, and few of them.
// `[key]`, `[heart]` and `[steps]` are drawn as the icons for means, motive
// and opportunity.

export type HintId = 'intro' | 'search' | 'suspects' | 'spent' | 'deduce' | 'accuse'

export const HINTS: Record<HintId, string> = {
  intro:
    'Read the case sheet, {sir}. It lists every role a guest might have tonight. Ask a guest who they are and they will name one, but a guest with something to hide will lie.',
  search:
    'One room an hour. Start with the scene, marked in red: it shows how it was done. Then search rooms where guests say they were alone. An honest guest leaves a trace there.',
  suspects:
    'Talk to the guests, and mark their [key] means, [heart] motive and [steps] opportunity under each name as you go. Nobody will tell you if you are right. If you can establish everyone’s whereabouts, you are one step closer to catching the killer!',
  spent:
    'No questions left this hour, {sir}. If two accounts do not agree, compare your notes now. Then let the hour strike.',
  deduce:
    'Lay two notes side by side. If they cannot both be true, one of the two is lying, and you may put it to them. Mind: a liar is not always the killer. Two guests who vouch for each other are both telling the truth.',
  accuse:
    'Name the killer, {sir}, and pin the exhibits that show their [key] means, [heart] motive and [steps] opportunity. You will be judged on the whole night’s work too: did you leave room for doubt?',
}

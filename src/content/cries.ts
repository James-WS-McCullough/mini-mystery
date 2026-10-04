// What somebody cries out as they stand at the gathering, before they own to
// the murder: a few words, in their own manner.

import type { Temperament } from '../engine/types'

export const CRIES: Record<Temperament, readonly string[]> = {
  gracious: ['Forgive me, wait!', 'Please, a moment!', 'No, I beg you, wait!'],
  prickly: ['Oh, enough!', 'Stop this!', 'Be quiet, all of you!'],
  gossipy: ['Oh, but wait!', 'No, no, no, listen!', 'Wait— wait!'],
  reserved: ['Wait.', 'Stop.', 'No.'],
  dramatic: ['Stop! STOP!', 'Enough. I cannot bear it!', 'No more!'],
  deferential: ['Begging your pardon, wait!', 'If you please, stop!', 'Oh, {sir}, wait!'],
  boastful: ['Hold it right there!', 'Now listen here!', 'Enough of this!'],
  blunt: ['Stop.', 'Enough.', 'Hold on.'],
  rambling: ['But— wait, wait!', 'Oh— oh, wait a moment!', 'No, but— wait!'],
  cheeky: ['Oi, wait!', 'Hang about!', 'Oh, give over!'],
  hearty: ['Now hold on!', 'Steady on!', 'Wait, wait, wait!'],
  official: ['One moment, {sir}.', 'Wait. For the record.', 'Stop there, if you please.'],
  theatrical: ['Darling, wait!', 'No, no, hold the curtain!', 'Stop, all of you, stop!'],
  donnish: ['A moment, if I may.', 'No. Wait. Strictly, no.', 'One moment, I beg you.'],
  cockney: ['Hang on, hang on!', 'Oi, wait up!', 'No, wait, I never!'],
}

/** A cry for this speaker, the same each time this night is played. */
export function cryOf(temperament: Temperament, seed: number, char: number): string {
  const list = CRIES[temperament] ?? ['But— wait!']
  return list[(seed + char * 7) % list.length]
}

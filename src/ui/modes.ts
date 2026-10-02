// How hard a case is, as the title page offers it: four ways of setting up
// the evening, each an evening's script and whether help is hidden about the
// place to be found.

import type { IconName } from '../components/Icon.vue'
import type { ScriptId } from '../stores/game'

export type ModeId = 'simple' | 'twist' | 'knot' | 'web'

export interface Mode {
  id: ModeId
  name: string
  text: string
  icon: IconName
  script: ScriptId
  lifelines: boolean
}

export const MODES: readonly Mode[] = [
  {
    id: 'simple',
    name: 'A Simple Case',
    text: 'A plain night: nobody in their cups, and nobody lying for the murderer. Lifelines are hidden about the place to help you.',
    icon: 'thread',
    script: 'classic',
    lifelines: true,
  },
  {
    id: 'twist',
    name: 'With a Twist',
    text: 'One guest may be drunk, and mistaken in all they tell you. A secret passage runs from the scene, and the murderer may be of a stranger kind.',
    icon: 'twist',
    script: 'foggy',
    lifelines: true,
  },
  {
    id: 'knot',
    name: 'A Knot of Lies',
    text: 'The murderer may have an accomplice to lie, forge or tamper for them, or one guest may be drunk. Lifelines are still hidden about the place.',
    icon: 'knot',
    script: 'both',
    lifelines: true,
  },
  {
    id: 'web',
    name: 'The Tangled Web',
    text: 'A Knot of Lies, with no lifelines to be found. You are on your own.',
    icon: 'web',
    script: 'both',
    lifelines: false,
  },
]

/** Which of the four a night was set up as. */
export function modeOf(script: ScriptId, lifelines: boolean): ModeId {
  if (script === 'classic') return 'simple'
  if (script === 'foggy') return 'twist'
  return lifelines ? 'knot' : 'web'
}

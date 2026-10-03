// How hard a case is, as the title page offers it: four evenings, each a
// name, a word of what it holds, and an icon around its script (which says
// everything else: see Script in engine/deck.ts).

import type { IconName } from '../components/Icon.vue'
import { SCRIPTS, type Script, type ScriptId } from '../engine/deck'

export type ModeId = Exclude<ScriptId, 'custom'>

export interface Mode {
  id: ModeId
  name: string
  text: string
  icon: IconName
  script: Script
}

export const MODES: readonly Mode[] = [
  {
    id: 'simple',
    name: 'A Simple Case',
    text: 'A plain night: nobody in their cups, and nobody lying for the murderer. Lifelines are hidden about the place to help you.',
    icon: 'thread',
    script: SCRIPTS.simple,
  },
  {
    id: 'twist',
    name: 'With a Twist',
    text: 'One guest may be drunk, and mistaken in all they tell you. A secret passage runs from the scene, and the murderer may be of a stranger kind.',
    icon: 'twist',
    script: SCRIPTS.twist,
  },
  {
    id: 'knot',
    name: 'A Knot of Lies',
    text: 'The murderer may have an accomplice to lie, forge or tamper for them, or one guest may be drunk. Lifelines are still hidden about the place.',
    icon: 'knot',
    script: SCRIPTS.knot,
  },
  {
    id: 'web',
    name: 'The Tangled Web',
    text: 'A Knot of Lies, with no lifelines to be found, and it may be that nobody killed him at all, or that somebody only made it look so. You are on your own.',
    icon: 'web',
    script: SCRIPTS.web,
  },
]

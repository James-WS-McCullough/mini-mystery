// Sergeant Pike's finger: `v-spot="'means'"` names a thing on the page, and
// it glows while his lesson points at it (see tutorLit in the game store). A
// page only has to name its parts; the lesson says which of them is wanted.

import { watchEffect, type Directive, type WatchStopHandle } from 'vue'
import { useGame } from '../stores/game'

const STOP = Symbol('spot')
type SpotEl = HTMLElement & { [STOP]?: WatchStopHandle }

function bind(el: SpotEl, name: string | undefined) {
  el[STOP]?.()
  if (!name) {
    el.classList.remove('spot-lit')
    return
  }
  const game = useGame()
  el[STOP] = watchEffect(() => el.classList.toggle('spot-lit', game.tutorLit.includes(name)))
}

export const spot: Directive<SpotEl, string | undefined> = {
  mounted: (el, binding) => bind(el, binding.value),
  updated: (el, binding) => {
    if (binding.value !== binding.oldValue) bind(el, binding.value)
  },
  unmounted: (el) => {
    el[STOP]?.()
    el.classList.remove('spot-lit')
  },
}

// Text that arrives a letter at a time, to the sound of keys.

import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import { sfx } from './audio'
import { charDelay, settings } from './settings'

export interface TypewriterOptions {
  /** Return false to have a text appear whole (lines already heard). */
  animate?: () => boolean
  onDone?: () => void
}

export function useTypewriter(text: Ref<string>, options: TypewriterOptions = {}) {
  const count = ref(0)
  let timer: ReturnType<typeof setTimeout> | undefined

  const done = computed(() => count.value >= text.value.length)
  const shown = computed(() => text.value.slice(0, count.value))
  const rest = computed(() => text.value.slice(count.value))

  function finish() {
    clearTimeout(timer)
    const was = done.value
    count.value = text.value.length
    if (!was) options.onDone?.()
  }

  function step() {
    const delay = charDelay(settings.textSpeed)
    if (delay === 0 || settings.reducedMotion) return finish()
    if (count.value >= text.value.length) return options.onDone?.()
    const ch = text.value[count.value]
    count.value++
    if (ch.trim() !== '' && count.value % 2 === 0) sfx('type')
    // Breathe at the punctuation, as a speaker would.
    const pause = /[.!?…]/.test(ch) ? 9 : /[,;:—]/.test(ch) ? 4 : 1
    timer = setTimeout(step, delay * pause)
  }

  watch(
    text,
    () => {
      clearTimeout(timer)
      if (options.animate && !options.animate()) {
        count.value = text.value.length
        return
      }
      count.value = 0
      step()
    },
    { immediate: true },
  )

  onBeforeUnmount(() => clearTimeout(timer))

  return { shown, rest, done, finish }
}

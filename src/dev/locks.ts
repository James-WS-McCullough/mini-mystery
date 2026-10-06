// The three lock puzzles stacked, each with seed 7, and a log of what they emitted.
// Development only: open /locks.html on the dev server.
import { createApp, defineComponent, h, ref } from 'vue'
import WordLock from '../components/locks/WordLock.vue'
import DialLock from '../components/locks/DialLock.vue'
import LampLock from '../components/locks/LampLock.vue'
import '../style.css'

const Page = defineComponent({
  setup() {
    const log = ref<string[]>([])
    const on = (name: string) => ({
      onSolved: () => log.value.push(`${name} solved`),
      onFailed: () => log.value.push(`${name} failed`),
    })
    const box = (c: unknown, name: string) =>
      h('section', { style: 'padding:1rem 16px;border-bottom:1px solid var(--line)' }, [
        h(c as never, { seed: 7, ref: name, ...on(name) }),
      ])
    return () =>
      h('div', { style: 'max-width:390px;margin:0 auto' }, [
        box(WordLock, 'word'),
        box(DialLock, 'dial'),
        box(LampLock, 'lamp'),
        h('pre', { id: 'log', style: 'padding:0 16px;color:var(--muted)' }, log.value.join('\n') || 'nothing yet'),
      ])
  },
})
createApp(Page).mount('#app')

// A contact sheet of the household, for checking the drawings: every sitter
// large and plain, then with each trait, then as the pin used on the map.
// Development only — open /portraits.html on the dev server. Add ?who=<id>
// to look at one sitter, and ?size=<px> to change the size of the large one.
import { createApp, defineComponent, h } from 'vue'
import { createPinia } from 'pinia'
import Portrait from '../components/Portrait.vue'
import { manor1920s } from '../content/manor1920s'
import { useGame } from '../stores/game'
import '../style.css'

const query = new URLSearchParams(location.search)
const only = query.get('who')?.split(',')
const size = Number(query.get('size') ?? 260)

const Sheet = defineComponent({
  setup() {
    // The portraits read the setting from a case in progress: any case will do.
    useGame().newGame(1)
    const sitters = manor1920s.characters.filter((c) => !only || only.includes(c.id))
    const traits = manor1920s.traits.map((t) => t.id)
    return () =>
      h(
        'div',
        { style: 'position:fixed;inset:0;overflow:auto;background:#0b0e12;padding:20px;color:#cfc7b0;font:14px Georgia,serif' },
        sitters.map((c) =>
          h('section', { 'data-who': c.id, style: 'display:flex;align-items:center;gap:22px;margin-bottom:26px' }, [
            h('div', { style: 'width:9rem' }, [h('strong', { style: 'color:#d4af4a;font-size:17px' }, c.shortName), h('div', c.id), h('div', { style: 'opacity:.7' }, c.title)]),
            h(Portrait, { who: c.id, trait: null, size: `${size}px` }),
            ...traits.map((t) =>
              h('figure', { style: 'margin:0;text-align:center' }, [
                h(Portrait, { who: c.id, trait: t, size: `${Math.round(size * 0.6)}px` }),
                h('figcaption', { style: 'margin-top:6px;opacity:.7' }, t),
              ]),
            ),
            h(Portrait, { who: c.id, trait: null, shape: 'token', size: '64px' }),
            h(Portrait, { who: c.id, trait: null, shape: 'token', size: '36px' }),
          ]),
        ),
      )
  },
})

createApp(Sheet).use(createPinia()).mount('#app')

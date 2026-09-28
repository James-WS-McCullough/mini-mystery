// Keyboard play. A handler returns true when it has used the key.
//
// Scenes and overlays listen on the document; the app shell listens on the
// window (`shell: true`), which hears a key last and only if nobody nearer
// the action wanted it. Esc can then mean "back" in a scene and "menu"
// everywhere else.

import { onBeforeUnmount, onMounted } from 'vue'

function typing(e: KeyboardEvent): boolean {
  const el = e.target as HTMLElement | null
  if (!el) return false
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable
}

export function useKeys(
  handler: (key: string, e: KeyboardEvent) => boolean | void,
  options: { shell?: boolean } = {},
): void {
  function listen(e: KeyboardEvent) {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || typing(e)) return
    // A focused button already answers Enter and Space itself.
    const onControl = (e.target as HTMLElement | null)?.tagName === 'BUTTON'
    if (onControl && (e.key === 'Enter' || e.key === ' ')) return
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
    if (handler(key, e)) e.preventDefault()
  }
  const target = (): Document | Window => (options.shell ? window : document)
  onMounted(() => target().addEventListener('keydown', listen as EventListener))
  onBeforeUnmount(() => target().removeEventListener('keydown', listen as EventListener))
}

// Keeping the game on the home screen. A browser that can install a web app
// itself (Chrome, Edge) says so with `beforeinstallprompt`, and the prompt is
// kept to be shown when the detective asks for it. Everywhere else, the way is
// the browser's own menu, and the game can only say which.

import { ref } from 'vue'

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** The browser's own install prompt, where it offered one. */
let deferred: InstallPromptEvent | null = null
/** Whether the browser can put the app on the home screen itself. */
export const canPrompt = ref(false)

/** Opened from the home screen already: nothing to add. */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const nav = navigator as Navigator & { standalone?: boolean }
  return window.matchMedia?.('(display-mode: standalone)').matches || nav.standalone === true
}

/** Which way the app is added here: by Safari's Share sheet, by a phone browser's menu, or by a desktop browser's. */
export type InstallWay = 'ios' | 'android' | 'desktop'
export function installWay(ua = navigator.userAgent, touchPoints = navigator.maxTouchPoints ?? 0): InstallWay {
  // (An iPad on iPadOS says it is a Mac, but has a touch screen.)
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && touchPoints > 1)
  if (ios) return 'ios'
  if (/Android|Mobile/.test(ua)) return 'android'
  return 'desktop'
}

export function watchForInstall(): void {
  if (typeof window === 'undefined') return
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as InstallPromptEvent
    canPrompt.value = true
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    canPrompt.value = false
  })
}

/** Show the browser's own prompt. True when it was shown and taken. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false
  const p = deferred
  deferred = null
  canPrompt.value = false
  await p.prompt()
  const { outcome } = await p.userChoice
  return outcome === 'accepted'
}

// A copy left open — or saved to a phone's home screen — can go on running an
// old build for days. Each build publishes its id in version.json; when the
// one on the server is not this one, the detective is offered a reload.

import { ref } from 'vue'

declare const __BUILD_ID__: string

/** A newer build is on the server. */
export const updateReady = ref(false)

async function check(): Promise<void> {
  if (import.meta.env.DEV || updateReady.value) return
  try {
    const res = await fetch(`./version.json?t=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return
    const { build } = (await res.json()) as { build?: string }
    if (build && build !== __BUILD_ID__) updateReady.value = true
  } catch {
    // Offline, or the file is not there (an itch.io upload): nothing to say.
  }
}

/** Look now, whenever the game is come back to, and every half hour while it is open. */
export function watchForUpdates(): void {
  void check()
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void check()
  })
  window.setInterval(() => void check(), 30 * 60_000)
}

/** Fetch the page afresh past any cache, then load it. */
export async function reloadForUpdate(): Promise<void> {
  try {
    await fetch('./', { cache: 'reload' })
  } catch {
    // Reload regardless.
  }
  window.location.reload()
}

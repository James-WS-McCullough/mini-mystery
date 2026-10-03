// Where a page is scrolled to. Each scene scrolls in a box of its own (see
// App.vue), which a new scene starts at the top; but a scene with pages of
// its own (the gallery and a guest, the rooms and the room searched) keeps
// one box for them all. So each new page puts it back to the top, where it
// would have started had it been a scene of its own.

/** The box the page scrolls in: the scene it is part of. */
export function sceneOf(el: Element): HTMLElement | null {
  return el.closest('.scene')
}

/** A new page, entering: from the top (or, given one, from where it was left). */
export function enterAt(el: Element, top = 0): void {
  const scene = sceneOf(el)
  if (scene) scene.scrollTop = top
}

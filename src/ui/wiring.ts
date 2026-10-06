// The electric lock's puzzle: numbered terminals in pairs on a grid, each pair
// to be joined by a wire, no two wires crossing or sharing a square, and every
// square not taken by a component wired. Made from one path that winds through
// every square of the board, cut into pieces: the long pieces are wires, their
// ends a pair; the short ones are components (a valve, a fuse, a resistor)
// fixed where they lie. So every board can be wired, filled from edge to edge.

/** A component fixed to the board: wires go round it. */
export interface Part {
  kind: 'valve' | 'fuse' | 'coil' | 'resistor' | 'switch'
  /** Its square, or its two squares side by side. */
  cells: number[]
}

export interface Board {
  size: number
  parts: Part[]
  /** Each pair's two squares (a square is `row * size + col`), numbered from 1 in this order. */
  pairs: [number, number][]
  /** One way to wire it: each pair's wire, square by square. */
  wires: number[][]
}

function mulberry32(a: number) {
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** The squares beside a square (not across a corner). */
export function besideOf(cell: number, size: number): number[] {
  const r = Math.floor(cell / size)
  const c = cell % size
  const out: number[] = []
  if (r > 0) out.push(cell - size)
  if (r < size - 1) out.push(cell + size)
  if (c > 0) out.push(cell - 1)
  if (c < size - 1) out.push(cell + 1)
  return out
}
const apart = (a: number, b: number, size: number) =>
  Math.abs(Math.floor(a / size) - Math.floor(b / size)) + Math.abs((a % size) - (b % size))

/**
 * A path through every square, wandering: begun as a snake, then bent many
 * times over by "backbites" (the end reaches to a square beside it, and the
 * stretch after that square is turned about), now and then from the other end.
 */
function wanderingPath(size: number, rand: () => number): number[] {
  const path: number[] = []
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) path.push(r * size + (r % 2 ? size - 1 - c : c))
  for (let k = 0; k < size * size * 40; k++) {
    if (rand() < 0.5) path.reverse()
    const end = path[path.length - 1]
    const choices = besideOf(end, size).filter((v) => v !== path[path.length - 2])
    const v = choices[Math.floor(rand() * choices.length)]
    const j = path.indexOf(v)
    const tail = path.splice(j + 1).reverse()
    path.push(...tail)
  }
  return path
}

/** A board from a seed: 6 by 6, with five or six pairs and three to five components. */
export function wireBoard(seed: number, size = 6): Board {
  const rand = mulberry32(seed)
  const pick = <T>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)]
  for (;;) {
    const path = wanderingPath(size, rand)
    // The pieces: components of one square or two, and wires of three or more.
    const parts = Array.from({ length: 3 + Math.floor(rand() * 3) }, () => (rand() < 0.5 ? 1 : 2))
    const count = rand() < 0.5 ? 5 : 6
    const lengths = Array(count).fill(3)
    for (let left = size * size - parts.reduce((a, b) => a + b, 0) - 3 * count; left > 0; left--) lengths[Math.floor(rand() * count)]++
    // Laid along the path in a shuffled order.
    const pieces = [...parts.map((n) => ({ n, wire: false })), ...lengths.map((n) => ({ n, wire: true }))]
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1))
      ;[pieces[i], pieces[j]] = [pieces[j], pieces[i]]
    }
    const wires: number[][] = []
    const fixed: Part[] = []
    let at = 0
    for (const { n, wire } of pieces) {
      const cells = path.slice(at, at + n)
      at += n
      if (wire) wires.push(cells)
      else fixed.push({ kind: n === 1 ? pick(['valve', 'fuse', 'coil'] as const) : pick(['resistor', 'switch'] as const), cells })
    }
    // (No pair side by side: that would be no wire at all.)
    if (wires.some((w) => apart(w[0], w[w.length - 1], size) < 2)) continue
    return { size, parts: fixed, pairs: wires.map((w) => [w[0], w[w.length - 1]]), wires }
  }
}

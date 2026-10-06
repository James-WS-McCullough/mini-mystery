// The electric lock's puzzle: numbered terminals in pairs on a grid, each pair
// to be joined by a wire, no two wires crossing or sharing a square. Made from
// one path that winds through every square of the board, cut into pieces: the
// ends of each piece are a pair. So every board can be wired (that way, at
// least: the player need not fill the board).

export interface Board {
  size: number
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

/** A board from a seed: 6 by 6, with five or six pairs. */
export function wireBoard(seed: number, size = 6): Board {
  const rand = mulberry32(seed)
  for (;;) {
    const path = wanderingPath(size, rand)
    const count = rand() < 0.5 ? 5 : 6
    // Where to cut: each piece at least three squares long.
    const lengths = Array(count).fill(3)
    for (let left = size * size - 3 * count; left > 0; left--) lengths[Math.floor(rand() * count)]++
    const wires: number[][] = []
    let at = 0
    for (const n of lengths) {
      wires.push(path.slice(at, at + n))
      at += n
    }
    // (No pair side by side: that would be no wire at all.)
    if (wires.some((w) => apart(w[0], w[w.length - 1], size) < 2)) continue
    return { size, pairs: wires.map((w) => [w[0], w[w.length - 1]]), wires }
  }
}

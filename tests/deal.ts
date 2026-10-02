// Dealing many cases for a test takes a while. Done in one breath, it keeps
// the test worker from answering the runner, which on a slow machine gives
// up on it; so the cases are dealt one by one, with a breath between.

/** `count` of whatever `make` deals, for seeds `from` onward. */
export async function deal<T>(count: number, make: (seed: number) => T, from = 1): Promise<T[]> {
  const out: T[] = []
  for (let i = 0; i < count; i++) {
    out.push(make(from + i))
    await new Promise((resolve) => setImmediate(resolve))
  }
  return out
}

/** Long enough to deal a few hundred cases on a slow machine. */
export const DEALING = 600_000

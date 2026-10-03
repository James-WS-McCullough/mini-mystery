import { describe, expect, it } from 'vitest'
import { Ties } from '../../src/engine/dealing/ties'

describe('ties: what a guest is given to do in somebody else’s story', () => {
  it('a guest with no ties is free for anything; nobody (-1) is never tied', () => {
    const ties = new Ties()
    ties.tie(-1, 'bribed')
    expect(ties.holding(['bribed'])).toEqual([])
    expect(ties.free(3, 'whisper')).toBe(true)
  })

  it('a tie rules a guest out of what it forbids, and nothing else', () => {
    const ties = new Ties()
    ties.tie(2, 'vouches')
    expect(ties.has(2, 'vouches')).toBe(true)
    for (const purpose of ['bribe', 'whisper', 'frame', 'secondVictim', 'keptRoom', 'seeClinger'] as const) {
      expect(ties.free(2, purpose), purpose).toBe(false)
    }
    // One who vouches may still be told the key's whereabouts.
    expect(ties.free(2, 'keyHint')).toBe(true)
  })

  it('whoever is paid is spared the knife, and keeps no secrets of the key', () => {
    const ties = new Ties()
    ties.tie(1, 'bribed')
    ties.tie(4, 'knowsKey')
    expect(ties.free(1, 'secondVictim')).toBe(false)
    expect(ties.free(4, 'secondVictim')).toBe(false)
    expect(ties.free(1, 'keyHint')).toBe(false)
    expect(ties.holding(['bribed', 'knowsKey']).sort()).toEqual([1, 4])
  })
})

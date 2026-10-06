import { describe, expect, it } from 'vitest'
import { installWay } from '../../src/ui/install'

describe('keeping the game on the home screen', () => {
  it('tells the way by the browser in hand', () => {
    expect(installWay('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1', 5)).toBe('ios')
    // (An iPad on iPadOS calls itself a Mac, but has a touch screen.)
    expect(installWay('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15', 5)).toBe('ios')
    expect(installWay('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15', 0)).toBe('desktop')
    expect(installWay('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36', 5)).toBe('android')
    expect(installWay('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36', 0)).toBe('desktop')
  })
})

import { describe, expect, it } from 'vitest'
import { STORE_KEYS } from './storeKeys'

describe('STORE_KEYS', () => {
  it('allows every persisted DaggerHeart store key', () => {
    expect(STORE_KEYS.has('dh-fear')).toBe(true)
    expect(STORE_KEYS.has('dh-campaigns')).toBe(true)
    expect(STORE_KEYS.has('dh-cards')).toBe(true)
    expect(STORE_KEYS.has('dh-party')).toBe(true)
    expect(STORE_KEYS.has('dh-music')).toBe(true)
    expect(STORE_KEYS.has('dh-soundboard')).toBe(true)
    expect(STORE_KEYS.has('dh-settings')).toBe(true)
  })
})
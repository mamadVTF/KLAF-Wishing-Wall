import { describe, expect, it } from 'vitest'
import { parseConfig } from './config'

describe('parseConfig', () => {
  it('accepts a config with a qrUrl string', () => {
    expect(parseConfig({ qrUrl: 'https://example.com/wish' })).toEqual({
      qrUrl: 'https://example.com/wish',
    })
  })

  it('rejects configs that are not objects', () => {
    expect(() => parseConfig(null)).toThrow()
    expect(() => parseConfig('nope')).toThrow()
    expect(() => parseConfig(42)).toThrow()
  })

  it('rejects a missing, non-string, or blank qrUrl', () => {
    expect(() => parseConfig({})).toThrow()
    expect(() => parseConfig({ qrUrl: 42 })).toThrow()
    expect(() => parseConfig({ qrUrl: '   ' })).toThrow()
  })
})
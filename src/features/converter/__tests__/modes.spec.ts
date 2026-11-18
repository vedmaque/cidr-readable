import { describe, expect, it } from 'vitest'
import { DEFAULT_MODE_ID, findMode, MODES } from '../modes'

describe('modes', () => {
  it('have unique ids and include the default one', () => {
    expect(new Set(MODES.map((m) => m.id)).size).toBe(MODES.length)
    expect(findMode(DEFAULT_MODE_ID)).toBeDefined()
    expect(findMode('unknown')).toBeUndefined()
  })

  it.each(MODES.map((mode) => [mode.id, mode] as const))(
    '%s converts its own example without issues',
    (_, mode) => {
      const result = mode.convert(mode.example)
      expect(result.issues).toEqual([])
      expect(result.entries.length).toBeGreaterThan(0)
    },
  )
})

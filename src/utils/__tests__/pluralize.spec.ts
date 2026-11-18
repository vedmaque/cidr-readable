import { describe, expect, it } from 'vitest'
import { pluralize } from '../pluralize'

describe('pluralize', () => {
  it('uses the singular form only for 1', () => {
    expect(pluralize(0, 'network')).toBe('0 networks')
    expect(pluralize(1, 'network')).toBe('1 network')
    expect(pluralize(2, 'entry', 'entries')).toBe('2 entries')
  })
})

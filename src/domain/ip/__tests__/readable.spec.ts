import { describe, expect, it } from 'vitest'
import { IPV4_MAX, parseIpv4 } from '../ipv4'
import {
  formatReadable,
  intervalToReadable,
  MAX_PATTERN_INTERVALS,
  parseReadable,
  readableToIntervals,
  type ReadablePattern,
} from '../readable'

const ip = (text: string) => parseIpv4(text) as number

function pattern(text: string): ReadablePattern {
  const result = parseReadable(text)
  if (!result.ok) throw new Error(result.error)
  return result.value
}

function expand(text: string) {
  const result = readableToIntervals(pattern(text))
  if (!result.ok) throw new Error(result.error)
  return result.value
}

describe('parseReadable', () => {
  it('parses numbers, ranges and wildcards', () => {
    expect(pattern('172.[0-15].X.x')).toEqual([
      { from: 172, to: 172 },
      { from: 0, to: 15 },
      { from: 0, to: 255 },
      { from: 0, to: 255 },
    ])
  })

  it('tolerates spaces inside a range', () => {
    expect(pattern('10.[ 1 - 2 ].X.X')[1]).toEqual({ from: 1, to: 2 })
  })

  it.each([
    ['10.X.X', 'Expected 4 octets'],
    ['10.X.0.X', 'Only X may follow an X'],
    ['10.[5-1].X.X', 'reversed'],
    ['10.[0-256].X.X', 'numbers 0–255'],
    ['10.[01-2].X.X', 'numbers 0–255'],
    ['10.abc.X.X', 'is not an octet'],
    ['10.[1-].X.X', 'is not an octet'],
  ])('rejects %s', (text, message) => {
    const result = parseReadable(text)
    expect(result.ok).toBe(false)
    expect(!result.ok && result.error).toContain(message)
  })
})

describe('readableToIntervals', () => {
  it('expands a single range with trailing wildcards into one interval', () => {
    expect(expand('172.[0-15].X.X')).toEqual([
      { start: ip('172.0.0.0'), end: ip('172.15.255.255') },
    ])
  })

  it('expands an exact address', () => {
    expect(expand('10.0.0.1')).toEqual([{ start: ip('10.0.0.1'), end: ip('10.0.0.1') }])
  })

  it('expands X.X.X.X to the whole space', () => {
    expect(expand('X.X.X.X')).toEqual([{ start: 0, end: IPV4_MAX }])
  })

  it('treats a trailing [0-255] like X', () => {
    expect(expand('10.[0-255].X.X')).toEqual(expand('10.X.X.X'))
  })

  it('expands ranges in several octets as a cartesian product', () => {
    expect(expand('10.[1-2].[5-6].X')).toEqual([
      { start: ip('10.1.5.0'), end: ip('10.1.6.255') },
      { start: ip('10.2.5.0'), end: ip('10.2.6.255') },
    ])
  })

  it('rejects patterns that expand into too many ranges', () => {
    const result = readableToIntervals(pattern('[0-255].[0-255].1.X'))
    expect(result.ok).toBe(false)
    expect(!result.ok && result.error).toContain(String(MAX_PATTERN_INTERVALS))
  })
})

describe('intervalToReadable + formatReadable', () => {
  const readable = (start: string, end: string) =>
    intervalToReadable({ start: ip(start), end: ip(end) }).map(formatReadable)

  it('formats an octet-aligned block', () => {
    expect(readable('172.0.0.0', '172.15.255.255')).toEqual(['172.[0-15].X.X'])
    expect(readable('10.0.0.0', '10.255.255.255')).toEqual(['10.X.X.X'])
    expect(readable('0.0.0.0', '255.255.255.255')).toEqual(['X.X.X.X'])
  })

  it('formats a single address and a single-value octet', () => {
    expect(readable('10.0.0.1', '10.0.0.1')).toEqual(['10.0.0.1'])
    expect(readable('10.1.0.0', '10.1.255.255')).toEqual(['10.1.X.X'])
  })

  it('formats a block that is not aligned to an octet (/20, /25)', () => {
    expect(readable('172.16.0.0', '172.16.15.255')).toEqual(['172.16.[0-15].X'])
    expect(readable('10.0.0.128', '10.0.0.255')).toEqual(['10.0.0.[128-255]'])
  })

  it('splits an unaligned interval into head, middle and tail', () => {
    expect(readable('10.0.0.200', '10.3.0.10')).toEqual([
      '10.0.0.[200-255]',
      '10.0.[1-255].X',
      '10.[1-2].X.X',
      '10.3.0.[0-10]',
    ])
  })

  it('omits an empty middle', () => {
    expect(readable('10.0.0.200', '10.0.1.10')).toEqual(['10.0.0.[200-255]', '10.0.1.[0-10]'])
  })
})

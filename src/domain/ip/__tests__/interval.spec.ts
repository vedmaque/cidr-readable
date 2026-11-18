import { describe, expect, it } from 'vitest'
import { complementIntervals, normalizeIntervals } from '../interval'
import { IPV4_MAX } from '../ipv4'

const iv = (start: number, end: number) => ({ start, end })

describe('normalizeIntervals', () => {
  it('sorts, merges overlapping and adjacent intervals, drops contained ones', () => {
    expect(normalizeIntervals([iv(20, 30), iv(0, 5), iv(6, 10), iv(3, 4), iv(25, 40)])).toEqual([
      iv(0, 10),
      iv(20, 40),
    ])
  })

  it('keeps disjoint intervals apart', () => {
    expect(normalizeIntervals([iv(5, 6), iv(0, 3)])).toEqual([iv(0, 3), iv(5, 6)])
  })

  it('handles empty input and does not mutate the argument', () => {
    const input = [iv(2, 3), iv(0, 1)]
    expect(normalizeIntervals([])).toEqual([])
    normalizeIntervals(input)
    expect(input).toEqual([iv(2, 3), iv(0, 1)])
  })
})

describe('complementIntervals', () => {
  it('returns the whole space for an empty set', () => {
    expect(complementIntervals([])).toEqual([iv(0, IPV4_MAX)])
  })

  it('returns nothing for the whole space', () => {
    expect(complementIntervals([iv(0, IPV4_MAX)])).toEqual([])
  })

  it('returns the gaps around and between intervals', () => {
    expect(complementIntervals([iv(10, 19), iv(30, 39)])).toEqual([
      iv(0, 9),
      iv(20, 29),
      iv(40, IPV4_MAX),
    ])
  })

  it('handles intervals touching the edges', () => {
    expect(complementIntervals([iv(0, 9), iv(100, IPV4_MAX)])).toEqual([iv(10, 99)])
  })
})

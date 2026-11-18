import { describe, expect, it } from 'vitest'
import { convertList } from '../convert'
import { normalizeIntervals, type Interval } from '../interval'
import { formatIpv4, IPV4_MAX } from '../ipv4'
import { parseList } from '../parse-list'

/** Small deterministic PRNG (mulberry32) so failures are reproducible. */
function createRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32
  }
}

function randomIntervals(random: () => number): Interval[] {
  const count = 1 + Math.floor(random() * 6)
  return Array.from({ length: count }, () => {
    const start = Math.floor(random() * IPV4_MAX)
    // Random magnitude so the sets mix single addresses, small blocks and huge ranges.
    const span = Math.floor(random() * 2 ** Math.floor(random() * 32))
    return { start, end: Math.min(IPV4_MAX, start + span) }
  })
}

/** Reference minimal CIDR cover, written independently of the code under test. */
function referenceCidrs({ start, end }: Interval): string[] {
  const result: string[] = []
  let cursor = start
  while (cursor <= end) {
    let size = 1
    while (cursor % (size * 2) === 0 && cursor + size * 2 - 1 <= end) size *= 2
    result.push(`${formatIpv4(cursor)}/${32 - Math.log2(size)}`)
    cursor += size
  }
  return result
}

describe('round trips on random sets', () => {
  const random = createRandom(42)
  const cases = Array.from({ length: 200 }, () => randomIntervals(random))

  it.each(cases.map((intervals, i) => [i, intervals] as const))('set #%i', (_, intervals) => {
    const expected = normalizeIntervals(intervals)
    const input = intervals.flatMap(referenceCidrs).join(', ')

    const cidrs = convertList(input, 'cidr')
    expect(cidrs.issues).toEqual([])
    expect(cidrs.entries).toEqual(expected.flatMap(referenceCidrs))

    const readable = convertList(input, 'readable')
    expect(readable.issues).toEqual([])
    const reparsed = parseList(readable.entries.join('\n'))
    expect(reparsed.issues).toEqual([])
    expect(reparsed.intervals).toEqual(expected)
  })
})

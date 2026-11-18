import { IPV4_MAX, IPV4_MIN, type Ipv4 } from './ipv4'

/** An inclusive range of IPv4 addresses. */
export interface Interval {
  readonly start: Ipv4
  readonly end: Ipv4
}

/** Sorts intervals and merges overlapping or adjacent ones into a canonical, minimal set. */
export function normalizeIntervals(intervals: readonly Interval[]): Interval[] {
  const sorted = [...intervals].sort((a, b) => a.start - b.start || a.end - b.end)
  const merged: Interval[] = []
  for (const interval of sorted) {
    const last = merged.at(-1)
    if (last && interval.start <= last.end + 1) {
      if (interval.end > last.end)
        merged[merged.length - 1] = { start: last.start, end: interval.end }
    } else {
      merged.push(interval)
    }
  }
  return merged
}

/** Everything in the IPv4 space that is not covered by the given intervals. */
export function complementIntervals(intervals: readonly Interval[]): Interval[] {
  const result: Interval[] = []
  let cursor = IPV4_MIN
  for (const { start, end } of normalizeIntervals(intervals)) {
    if (start > cursor) result.push({ start: cursor, end: start - 1 })
    cursor = end + 1
  }
  if (cursor <= IPV4_MAX) result.push({ start: cursor, end: IPV4_MAX })
  return result
}

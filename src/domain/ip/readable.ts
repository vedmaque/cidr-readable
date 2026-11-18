import type { Interval } from './interval'
import { IPV4_MAX, IPV4_MIN, OCTET_COUNT, OCTET_MAX, parseOctet, toOctets } from './ipv4'
import { failure, success, type ParseOutcome } from './result'

/** An inclusive range of values for one octet. A single value is `{ from: n, to: n }`. */
export interface OctetRange {
  readonly from: number
  readonly to: number
}

/**
 * A human-readable address pattern such as `172.[16-31].X.X`: exactly four octet ranges.
 * The set it describes is the cartesian product of the octet ranges.
 */
export type ReadablePattern = readonly OctetRange[]

const ANY: OctetRange = { from: 0, to: OCTET_MAX }
const WILDCARD_RE = /^x$/i
const RANGE_RE = /^\[\s*(\d+)\s*-\s*(\d+)\s*\]$/

/**
 * A pattern like `[0-255].[0-255].[0-255].1` is valid but describes 16M separate addresses.
 * Patterns that expand to more disjoint intervals than this are rejected.
 */
export const MAX_PATTERN_INTERVALS = 4096

function isAny(range: OctetRange): boolean {
  return range.from === 0 && range.to === OCTET_MAX
}

type OctetToken = { kind: 'any' } | { kind: 'range'; range: OctetRange }

function parseOctetToken(text: string): ParseOutcome<OctetToken> {
  if (WILDCARD_RE.test(text)) return success({ kind: 'any' })

  const single = parseOctet(text)
  if (single !== null) return success({ kind: 'range', range: { from: single, to: single } })

  const match = RANGE_RE.exec(text)
  if (match) {
    // Both groups are mandatory in RANGE_RE, so they are always present on a match.
    const [, fromText, toText] = match as unknown as [string, string, string]
    const from = parseOctet(fromText)
    const to = parseOctet(toText)
    if (from === null || to === null) return failure(`Range "${text}" must use numbers 0–255`)
    if (from > to) return failure(`Range "${text}" is reversed`)
    return success({ kind: 'range', range: { from, to } })
  }

  return failure(`"${text}" is not an octet: use a number, a range like [0-15], or X`)
}

/** Parses a pattern like `10.[0-15].X.X`. Once an `X` appears, all following octets must be `X`. */
export function parseReadable(text: string): ParseOutcome<ReadablePattern> {
  const parts = text.split('.')
  if (parts.length !== OCTET_COUNT) {
    return failure(`Expected ${OCTET_COUNT} octets separated by dots, got ${parts.length}`)
  }

  const ranges: OctetRange[] = []
  let seenWildcard = false
  for (const part of parts) {
    const token = parseOctetToken(part)
    if (!token.ok) return token
    if (token.value.kind === 'any') {
      seenWildcard = true
      ranges.push(ANY)
    } else if (seenWildcard) {
      return failure('Only X may follow an X (e.g. 10.0.X.X, not 10.X.0.X)')
    } else {
      ranges.push(token.value.range)
    }
  }
  return success(ranges)
}

/** Expands a pattern into the disjoint address intervals it covers (not merged). */
export function readableToIntervals(pattern: ReadablePattern): ParseOutcome<Interval[]> {
  // Trailing full ranges (`X` or `[0-255]`) don't split the set, so they're part of each block.
  let significant = OCTET_COUNT
  while (significant > 0 && isAny(pattern[significant - 1] as OctetRange)) significant--
  if (significant === 0) return success([{ start: IPV4_MIN, end: IPV4_MAX }])

  const leading = pattern.slice(0, significant - 1)
  const last = pattern[significant - 1] as OctetRange
  const count = leading.reduce((acc, range) => acc * (range.to - range.from + 1), 1)
  if (count > MAX_PATTERN_INTERVALS) {
    return failure(`Pattern expands to ${count} separate ranges (max ${MAX_PATTERN_INTERVALS})`)
  }

  const blockSize = 256 ** (OCTET_COUNT - significant)
  const intervals: Interval[] = []
  const visit = (index: number, base: number): void => {
    if (index === leading.length) {
      const prefix = base * 256
      intervals.push({
        start: (prefix + last.from) * blockSize,
        end: (prefix + last.to + 1) * blockSize - 1,
      })
      return
    }
    const range = leading[index] as OctetRange
    for (let value = range.from; value <= range.to; value++) visit(index + 1, base * 256 + value)
  }
  visit(0, 0)
  return success(intervals)
}

/** The minimal list of readable patterns that exactly covers the interval. */
export function intervalToReadable({ start, end }: Interval): ReadablePattern[] {
  const result: ReadablePattern[] = []

  // Invariant: `start` and `end` share all octets before `level`, which are stored in `fixed`.
  const split = (from: number, to: number, level: number, fixed: OctetRange[]): void => {
    const blockSize = 256 ** (OCTET_COUNT - 1 - level)
    const first = toOctets(from)[level] as number
    const last = toOctets(to)[level] as number
    const startsAligned = from % blockSize === 0
    const endsAligned = (to + 1) % blockSize === 0
    const rest = Array.from({ length: OCTET_COUNT - 1 - level }, () => ANY)

    if (first === last && !(startsAligned && endsAligned)) {
      split(from, to, level + 1, [...fixed, { from: first, to: first }])
      return
    }

    let middleFrom = first
    let middleTo = last
    if (!startsAligned) {
      const headEnd = from - (from % blockSize) + blockSize - 1
      split(from, headEnd, level + 1, [...fixed, { from: first, to: first }])
      middleFrom++
    }
    if (!endsAligned) middleTo--
    if (middleFrom <= middleTo) result.push([...fixed, { from: middleFrom, to: middleTo }, ...rest])
    if (!endsAligned) {
      split(to - (to % blockSize), to, level + 1, [...fixed, { from: last, to: last }])
    }
  }

  split(start, end, 0, [])
  return result
}

function formatRange({ from, to }: OctetRange): string {
  return from === to ? String(from) : `[${from}-${to}]`
}

/** Formats a pattern canonically: trailing full octets become `X`, single-value ranges a number. */
export function formatReadable(pattern: ReadablePattern): string {
  let wildcardFrom = OCTET_COUNT
  while (wildcardFrom > 0 && isAny(pattern[wildcardFrom - 1] as OctetRange)) wildcardFrom--
  return pattern.map((range, i) => (i >= wildcardFrom ? 'X' : formatRange(range))).join('.')
}

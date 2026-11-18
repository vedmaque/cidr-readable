import { cidrToInterval, parseCidr } from './cidr'
import { normalizeIntervals, type Interval } from './interval'
import { parseReadable, readableToIntervals } from './readable'
import { tokenize } from './tokenize'

export type EntryFormat = 'cidr' | 'readable'

export interface Issue {
  readonly severity: 'error' | 'warning'
  readonly line: number
  readonly entry: string
  readonly message: string
}

export interface ParsedList {
  /** Canonical (sorted, merged) set of everything the valid entries describe. */
  readonly intervals: Interval[]
  readonly issues: Issue[]
  /** Number of entries found in the input, valid or not. */
  readonly entryCount: number
}

const CIDR_LIKE_RE = /^[\d.]+(?:\/.*)?$/

/**
 * Guesses the entry format. Bare addresses (`10.0.0.1`) are valid in both formats and mean the
 * same thing, so they are treated as CIDR.
 */
export function detectFormat(entry: string): EntryFormat | 'ipv6' {
  if (entry.includes(':')) return 'ipv6'
  return CIDR_LIKE_RE.test(entry) ? 'cidr' : 'readable'
}

function parseEntry(entry: string) {
  const format = detectFormat(entry)
  if (format === 'ipv6') {
    return { ok: false, error: 'IPv6 is not supported, only IPv4' } as const
  }
  if (format === 'cidr') {
    const cidr = parseCidr(entry)
    return cidr.ok ? { ...cidr, value: [cidrToInterval(cidr.value)] } : cidr
  }
  const pattern = parseReadable(entry)
  if (!pattern.ok) return pattern
  return readableToIntervals(pattern.value)
}

/** Parses a list that may freely mix CIDR and readable entries. Invalid entries become issues. */
export function parseList(input: string): ParsedList {
  const tokens = tokenize(input)
  const intervals: Interval[] = []
  const issues: Issue[] = []

  for (const { text, line } of tokens) {
    const outcome = parseEntry(text)
    if (outcome.ok) {
      intervals.push(...outcome.value)
      if (outcome.warning !== undefined) {
        issues.push({ severity: 'warning', line, entry: text, message: outcome.warning })
      }
    } else {
      issues.push({ severity: 'error', line, entry: text, message: outcome.error })
    }
  }

  return { intervals: normalizeIntervals(intervals), issues, entryCount: tokens.length }
}

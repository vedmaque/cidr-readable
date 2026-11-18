import { formatCidr, intervalToCidrs } from './cidr'
import { complementIntervals, type Interval } from './interval'
import { parseList, type Issue } from './parse-list'
import { formatReadable, intervalToReadable } from './readable'

export interface ConversionResult {
  /** Output entries, one per line in the canonical (sorted, merged) order. */
  readonly entries: string[]
  readonly issues: Issue[]
  readonly inputEntryCount: number
}

export type OutputFormat = 'cidr' | 'readable'

function render(intervals: readonly Interval[], format: OutputFormat): string[] {
  return format === 'cidr'
    ? intervals.flatMap(intervalToCidrs).map(formatCidr)
    : intervals.flatMap(intervalToReadable).map(formatReadable)
}

/** Normalizes any mix of CIDR / readable entries into the requested output format. */
export function convertList(input: string, format: OutputFormat): ConversionResult {
  const { intervals, issues, entryCount } = parseList(input)
  return { entries: render(intervals, format), issues, inputEntryCount: entryCount }
}

/**
 * Builds the set of CIDRs that covers the whole IPv4 space except the denied entries — the value
 * WireGuard needs in `AllowedIPs` to route everything but those networks through the tunnel.
 */
export function denyToAllowed(input: string): ConversionResult {
  const { intervals, issues, entryCount } = parseList(input)
  return {
    entries: render(complementIntervals(intervals), 'cidr'),
    issues,
    inputEntryCount: entryCount,
  }
}

import type { Interval } from './interval'
import { formatIpv4, parseIpv4, type Ipv4 } from './ipv4'
import { failure, success, type ParseOutcome } from './result'

export interface Cidr {
  readonly network: Ipv4
  readonly prefix: number
}

const PREFIX_MAX = 32
const PREFIX_RE = /^(?:0|[1-9]\d?)$/

function blockSize(prefix: number): number {
  return 2 ** (PREFIX_MAX - prefix)
}

/** Parses `a.b.c.d/n` or a bare `a.b.c.d` (treated as `/32`). */
export function parseCidr(text: string): ParseOutcome<Cidr> {
  const parts = text.split('/')
  if (parts.length > 2) return failure('Too many "/" in CIDR')
  const [addressText, prefixText] = parts as [string, string?]

  const address = parseIpv4(addressText)
  if (address === null) return failure(`"${addressText}" is not a valid IPv4 address`)

  let prefix = PREFIX_MAX
  if (prefixText !== undefined) {
    if (!PREFIX_RE.test(prefixText) || Number(prefixText) > PREFIX_MAX) {
      return failure(`Prefix length must be a number from 0 to ${PREFIX_MAX}`)
    }
    prefix = Number(prefixText)
  }

  const size = blockSize(prefix)
  const network = address - (address % size)
  if (network !== address) {
    const normalized: Cidr = { network, prefix }
    return success(normalized, `Host bits are set; treated as ${formatCidr(normalized)}`)
  }
  return success({ network, prefix })
}

export function cidrToInterval({ network, prefix }: Cidr): Interval {
  return { start: network, end: network + blockSize(prefix) - 1 }
}

/** The minimal list of CIDR blocks that exactly covers the interval. */
export function intervalToCidrs({ start, end }: Interval): Cidr[] {
  const result: Cidr[] = []
  let cursor = start
  while (cursor <= end) {
    const remaining = end - cursor + 1
    let prefix = PREFIX_MAX
    // Grow the block while it stays aligned to `cursor` and fits into what's left.
    while (prefix > 0) {
      const bigger = blockSize(prefix - 1)
      if (cursor % bigger !== 0 || bigger > remaining) break
      prefix--
    }
    result.push({ network: cursor, prefix })
    cursor += blockSize(prefix)
  }
  return result
}

export function formatCidr({ network, prefix }: Cidr): string {
  return `${formatIpv4(network)}/${prefix}`
}

/** An IPv4 address as an unsigned 32-bit integer. */
export type Ipv4 = number

export const IPV4_MIN: Ipv4 = 0
export const IPV4_MAX: Ipv4 = 0xff_ff_ff_ff
export const OCTET_MAX = 255
export const OCTET_COUNT = 4

const OCTET_RE = /^(?:0|[1-9]\d{0,2})$/

/**
 * Parses a decimal octet. Leading zeros are rejected on purpose: `010` is octal in many tools,
 * so accepting it silently would be ambiguous.
 */
export function parseOctet(text: string): number | null {
  if (!OCTET_RE.test(text)) return null
  const value = Number(text)
  return value <= OCTET_MAX ? value : null
}

export function fromOctets(octets: readonly number[]): Ipv4 {
  return octets.reduce((acc, octet) => acc * 256 + octet, 0)
}

export function toOctets(address: Ipv4): [number, number, number, number] {
  return [address >>> 24, (address >>> 16) & 0xff, (address >>> 8) & 0xff, address & 0xff]
}

export function parseIpv4(text: string): Ipv4 | null {
  const parts = text.split('.')
  if (parts.length !== OCTET_COUNT) return null
  const octets: number[] = []
  for (const part of parts) {
    const octet = parseOctet(part)
    if (octet === null) return null
    octets.push(octet)
  }
  return fromOctets(octets)
}

export function formatIpv4(address: Ipv4): string {
  return toOctets(address).join('.')
}

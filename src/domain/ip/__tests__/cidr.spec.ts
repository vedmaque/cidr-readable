import { describe, expect, it } from 'vitest'
import { cidrToInterval, formatCidr, intervalToCidrs, parseCidr } from '../cidr'
import { IPV4_MAX, parseIpv4 } from '../ipv4'

const ip = (text: string) => parseIpv4(text) as number

describe('parseCidr', () => {
  it('parses a network', () => {
    expect(parseCidr('172.16.0.0/12')).toEqual({
      ok: true,
      value: { network: ip('172.16.0.0'), prefix: 12 },
    })
  })

  it('treats a bare address as /32', () => {
    expect(parseCidr('10.0.0.1')).toEqual({
      ok: true,
      value: { network: ip('10.0.0.1'), prefix: 32 },
    })
  })

  it('accepts /0 and /32', () => {
    expect(parseCidr('0.0.0.0/0').ok).toBe(true)
    expect(parseCidr('1.2.3.4/32').ok).toBe(true)
  })

  it('normalizes host bits with a warning', () => {
    expect(parseCidr('10.0.0.5/24')).toEqual({
      ok: true,
      value: { network: ip('10.0.0.0'), prefix: 24 },
      warning: 'Host bits are set; treated as 10.0.0.0/24',
    })
  })

  it.each([
    ['10.0.0.0/33', 'Prefix length'],
    ['10.0.0.0/', 'Prefix length'],
    ['10.0.0.0/08', 'Prefix length'],
    ['10.0.0.0/a', 'Prefix length'],
    ['10.0.0/8', 'not a valid IPv4 address'],
    ['10.0.0.0/8/8', 'Too many'],
  ])('rejects %s', (text, message) => {
    const result = parseCidr(text)
    expect(result.ok).toBe(false)
    expect(!result.ok && result.error).toContain(message)
  })
})

describe('cidrToInterval', () => {
  it('covers the whole block', () => {
    expect(cidrToInterval({ network: ip('172.16.0.0'), prefix: 12 })).toEqual({
      start: ip('172.16.0.0'),
      end: ip('172.31.255.255'),
    })
    expect(cidrToInterval({ network: 0, prefix: 0 })).toEqual({ start: 0, end: IPV4_MAX })
  })
})

describe('intervalToCidrs', () => {
  const cidrs = (start: string, end: string) =>
    intervalToCidrs({ start: ip(start), end: ip(end) }).map(formatCidr)

  it('returns a single block for an aligned interval', () => {
    expect(cidrs('172.16.0.0', '172.31.255.255')).toEqual(['172.16.0.0/12'])
    expect(cidrs('0.0.0.0', '255.255.255.255')).toEqual(['0.0.0.0/0'])
    expect(cidrs('1.2.3.4', '1.2.3.4')).toEqual(['1.2.3.4/32'])
  })

  it('returns the minimal decomposition for an unaligned interval', () => {
    expect(cidrs('10.0.0.1', '10.0.0.6')).toEqual([
      '10.0.0.1/32',
      '10.0.0.2/31',
      '10.0.0.4/31',
      '10.0.0.6/32',
    ])
    expect(cidrs('172.3.0.0', '172.17.255.255')).toEqual([
      '172.3.0.0/16',
      '172.4.0.0/14',
      '172.8.0.0/13',
      '172.16.0.0/15',
    ])
  })

  it('handles the top of the address space', () => {
    expect(cidrs('255.255.255.254', '255.255.255.255')).toEqual(['255.255.255.254/31'])
  })
})

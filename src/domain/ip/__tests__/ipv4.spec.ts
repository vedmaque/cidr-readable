import { describe, expect, it } from 'vitest'
import { formatIpv4, fromOctets, parseIpv4, parseOctet, toOctets } from '../ipv4'

describe('parseOctet', () => {
  it.each([
    ['0', 0],
    ['7', 7],
    ['255', 255],
  ])('parses %s', (text, expected) => {
    expect(parseOctet(text)).toBe(expected)
  })

  it.each(['256', '-1', '01', '', 'a', '1.5', '1000'])('rejects %j', (text) => {
    expect(parseOctet(text)).toBeNull()
  })
})

describe('parseIpv4 / formatIpv4', () => {
  it('round-trips boundary addresses', () => {
    for (const text of ['0.0.0.0', '255.255.255.255', '10.0.0.1', '172.16.254.3']) {
      const parsed = parseIpv4(text)
      expect(parsed).not.toBeNull()
      expect(formatIpv4(parsed as number)).toBe(text)
    }
  })

  it('maps to the expected integer', () => {
    expect(parseIpv4('255.255.255.255')).toBe(0xffffffff)
    expect(parseIpv4('1.2.3.4')).toBe(0x01020304)
  })

  it.each(['1.2.3', '1.2.3.4.5', '1.2.3.256', '1..3.4', 'a.b.c.d', ''])('rejects %j', (text) => {
    expect(parseIpv4(text)).toBeNull()
  })

  it('converts between octets and integers', () => {
    expect(toOctets(fromOctets([192, 168, 1, 254]))).toEqual([192, 168, 1, 254])
  })
})

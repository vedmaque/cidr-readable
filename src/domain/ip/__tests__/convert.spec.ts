import { describe, expect, it } from 'vitest'
import { convertList, denyToAllowed } from '../convert'
import { joinList } from '../format-list'
import { detectFormat, parseList } from '../parse-list'

describe('detectFormat', () => {
  it.each([
    ['10.0.0.0/8', 'cidr'],
    ['10.0.0.1', 'cidr'],
    ['10.0.0.0/x', 'cidr'],
    ['10.[0-1].X.X', 'readable'],
    ['10.X.X.X', 'readable'],
    ['::/0', 'ipv6'],
    ['fe80::1/64', 'ipv6'],
  ])('%s → %s', (entry, format) => {
    expect(detectFormat(entry)).toBe(format)
  })
})

describe('parseList', () => {
  it('collects errors and warnings with line numbers and keeps valid entries', () => {
    const result = parseList('10.0.0.5/24\nnope, ::/0\n10.X.0.X 1.2.3.4/33')
    expect(result.entryCount).toBe(5)
    expect(result.intervals).toHaveLength(1)
    expect(result.issues).toEqual([
      expect.objectContaining({ severity: 'warning', line: 1, entry: '10.0.0.5/24' }),
      expect.objectContaining({ severity: 'error', line: 2, entry: 'nope' }),
      expect.objectContaining({
        severity: 'error',
        line: 2,
        entry: '::/0',
        message: 'IPv6 is not supported, only IPv4',
      }),
      expect.objectContaining({ severity: 'error', line: 3, entry: '10.X.0.X' }),
      expect.objectContaining({ severity: 'error', line: 3, entry: '1.2.3.4/33' }),
    ])
  })
})

describe('convertList', () => {
  it('converts CIDR to readable', () => {
    expect(convertList('172.0.0.0/12', 'readable').entries).toEqual(['172.[0-15].X.X'])
  })

  it('converts readable to CIDR', () => {
    expect(convertList('172.[0-15].X.X', 'cidr').entries).toEqual(['172.0.0.0/12'])
    expect(convertList('172.[3-17].X.X', 'cidr').entries).toEqual([
      '172.3.0.0/16',
      '172.4.0.0/14',
      '172.8.0.0/13',
      '172.16.0.0/15',
    ])
  })

  it('merges, deduplicates and sorts', () => {
    const input = 'AllowedIPs = 10.0.1.0/24, 10.0.0.0/24, 10.0.0.0/25, 10.0.1.0/24'
    expect(convertList(input, 'readable').entries).toEqual(['10.0.[0-1].X'])
    expect(convertList(input, 'cidr').entries).toEqual(['10.0.0.0/23'])
  })

  it('accepts a mix of formats', () => {
    expect(convertList('10.0.0.0/9\n10.[128-255].X.X', 'cidr').entries).toEqual(['10.0.0.0/8'])
  })

  it('reports the number of input entries', () => {
    expect(convertList('1.1.1.1, 8.8.8.8', 'cidr').inputEntryCount).toBe(2)
  })
})

describe('denyToAllowed', () => {
  it('allows everything when nothing is denied', () => {
    expect(denyToAllowed('').entries).toEqual(['0.0.0.0/0'])
  })

  it('allows nothing when everything is denied', () => {
    expect(denyToAllowed('X.X.X.X').entries).toEqual([])
  })

  it('excludes private networks', () => {
    expect(denyToAllowed('10.0.0.0/8, 172.[16-31].X.X\n192.168.0.0/16').entries).toEqual([
      '0.0.0.0/5',
      '8.0.0.0/7',
      '11.0.0.0/8',
      '12.0.0.0/6',
      '16.0.0.0/4',
      '32.0.0.0/3',
      '64.0.0.0/2',
      '128.0.0.0/3',
      '160.0.0.0/5',
      '168.0.0.0/6',
      '172.0.0.0/12',
      '172.32.0.0/11',
      '172.64.0.0/10',
      '172.128.0.0/9',
      '173.0.0.0/8',
      '174.0.0.0/7',
      '176.0.0.0/4',
      '192.0.0.0/9',
      '192.128.0.0/11',
      '192.160.0.0/13',
      '192.169.0.0/16',
      '192.170.0.0/15',
      '192.172.0.0/14',
      '192.176.0.0/12',
      '192.192.0.0/10',
      '193.0.0.0/8',
      '194.0.0.0/7',
      '196.0.0.0/6',
      '200.0.0.0/5',
      '208.0.0.0/4',
      '224.0.0.0/3',
    ])
  })

  it('passes parse issues through', () => {
    expect(denyToAllowed('garbage').issues).toHaveLength(1)
  })
})

describe('joinList', () => {
  it('joins as lines or as a WireGuard list', () => {
    expect(joinList(['a', 'b'], 'lines')).toBe('a\nb')
    expect(joinList(['a', 'b'], 'wireguard')).toBe('a, b')
  })
})

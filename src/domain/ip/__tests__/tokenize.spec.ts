import { describe, expect, it } from 'vitest'
import { tokenize } from '../tokenize'

const texts = (input: string) => tokenize(input).map((t) => t.text)

describe('tokenize', () => {
  it('splits by newlines', () => {
    expect(tokenize('10.0.0.0/8\n\n192.168.0.0/16')).toEqual([
      { text: '10.0.0.0/8', line: 1 },
      { text: '192.168.0.0/16', line: 3 },
    ])
  })

  it('splits a WireGuard line and strips the key', () => {
    expect(texts('AllowedIPs = 10.0.0.0/8, 172.16.0.0/12,192.168.0.0/16')).toEqual([
      '10.0.0.0/8',
      '172.16.0.0/12',
      '192.168.0.0/16',
    ])
  })

  it('handles CRLF, tabs, trailing commas and comments', () => {
    expect(texts('10.0.0.0/8,\r\n\t1.1.1.1  # cloudflare\n# whole line comment')).toEqual([
      '10.0.0.0/8',
      '1.1.1.1',
    ])
  })

  it('keeps whitespace inside brackets', () => {
    expect(texts('172.[0 - 15].X.X 10.X.X.X')).toEqual(['172.[0 - 15].X.X', '10.X.X.X'])
  })

  it('recovers from a stray closing bracket', () => {
    expect(texts('a] b')).toEqual(['a]', 'b'])
  })

  it('returns nothing for blank input', () => {
    expect(tokenize('  \n , \n')).toEqual([])
  })
})

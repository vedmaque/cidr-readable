import { convertList, denyToAllowed, type ConversionResult, type OutputFormat } from '@/domain/ip'

export type ModeId = 'cidr-to-readable' | 'readable-to-cidr' | 'deny-to-allowed'

export interface ConverterMode {
  readonly id: ModeId
  /** Short label for navigation. */
  readonly label: string
  readonly description: string
  readonly inputLabel: string
  readonly inputPlaceholder: string
  readonly example: string
  readonly outputLabel: string
  readonly output: OutputFormat
  /** When set, the WireGuard style renders a full config line: `<key> = a, b, c`. */
  readonly wireguardKey?: string
  readonly convert: (input: string) => ConversionResult
}

export const MODES: readonly ConverterMode[] = [
  {
    id: 'cidr-to-readable',
    label: 'CIDR → Readable',
    description:
      'Paste CIDRs one per line or as a comma-separated WireGuard list. Overlapping and adjacent networks are merged.',
    inputLabel: 'CIDR list',
    inputPlaceholder: '10.0.0.0/8\n172.16.0.0/12\n192.168.0.0/16',
    example: 'AllowedIPs = 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 100.64.0.0/10, 10.0.0.5/32',
    outputLabel: 'Readable',
    output: 'readable',
    convert: (input) => convertList(input, 'readable'),
  },
  {
    id: 'readable-to-cidr',
    label: 'Readable → CIDR',
    description:
      'Write ranges per octet: a number, a range like [16-31], or X for any value. CIDR input works too.',
    inputLabel: 'Readable list',
    inputPlaceholder: '10.X.X.X\n172.[16-31].X.X\n192.168.X.X',
    example: '10.X.X.X\n172.[16-31].X.X\n192.168.X.X\n100.[64-127].X.X\n203.0.113.[10-20]',
    outputLabel: 'CIDR',
    output: 'cidr',
    convert: (input) => convertList(input, 'cidr'),
  },
  {
    id: 'deny-to-allowed',
    label: 'Deny → AllowedIPs',
    description:
      'List networks that must bypass the tunnel, in either format. You get AllowedIPs that cover everything else.',
    inputLabel: 'Denied networks',
    inputPlaceholder: '10.0.0.0/8\n192.168.X.X',
    example: '# local networks\n10.0.0.0/8\n172.[16-31].X.X\n192.168.X.X',
    outputLabel: 'AllowedIPs',
    output: 'cidr',
    wireguardKey: 'AllowedIPs',
    convert: denyToAllowed,
  },
]

export const DEFAULT_MODE_ID: ModeId = 'cidr-to-readable'

export function findMode(id: string): ConverterMode | undefined {
  return MODES.find((mode) => mode.id === id)
}

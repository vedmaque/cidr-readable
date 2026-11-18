export type ListStyle = 'lines' | 'wireguard'

/** One entry per line for reading, or a single comma-separated line for a WireGuard config. */
export function joinList(entries: readonly string[], style: ListStyle): string {
  return entries.join(style === 'lines' ? '\n' : ', ')
}

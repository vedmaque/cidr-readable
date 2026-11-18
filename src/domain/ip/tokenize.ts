/** One entry of a user-supplied list, with its 1-based source line for error reporting. */
export interface Token {
  readonly text: string
  readonly line: number
}

/** `AllowedIPs =`, `DisallowedIPs =` etc. — any `Key =` prefix copied along with a config line. */
const CONFIG_KEY_RE = /^\s*[A-Za-z][\w-]*\s*=/

/** A complete range written with spaces, such as `[0 - 15]`. */
const SPACED_RANGE_RE = /\[\s*(\d+)\s*-\s*(\d+)\s*\]/g
const SEPARATOR_RE = /[\s,]+/

function stripNoise(line: string): string {
  const commentStart = line.indexOf('#')
  const code = commentStart === -1 ? line : line.slice(0, commentStart)
  return code.replace(CONFIG_KEY_RE, '')
}

/**
 * Splits free-form input into entries. Entries are separated by newlines, commas or whitespace.
 * Spaces inside a complete range (`[0 - 15]`) are removed first so it stays one entry; anything
 * else, including a malformed bracket, never joins entries, so one typo can't hide the next one.
 * `# comments` and `Key =` prefixes (as in a WireGuard config) are ignored.
 */
export function tokenize(input: string): Token[] {
  return input.split(/\r?\n/).flatMap((rawLine, index) =>
    stripNoise(rawLine)
      .replace(SPACED_RANGE_RE, '[$1-$2]')
      .split(SEPARATOR_RE)
      .filter((text) => text !== '')
      .map((text) => ({ text, line: index + 1 })),
  )
}

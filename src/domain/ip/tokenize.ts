/** One entry of a user-supplied list, with its 1-based source line for error reporting. */
export interface Token {
  readonly text: string
  readonly line: number
}

/** `AllowedIPs =`, `DisallowedIPs =` etc. — any `Key =` prefix copied along with a config line. */
const CONFIG_KEY_RE = /^\s*[A-Za-z][\w-]*\s*=/

function stripNoise(line: string): string {
  const commentStart = line.indexOf('#')
  const code = commentStart === -1 ? line : line.slice(0, commentStart)
  return code.replace(CONFIG_KEY_RE, '')
}

/**
 * Splits free-form input into entries. Entries are separated by newlines, commas or whitespace;
 * whitespace inside `[...]` is kept so that `[0 - 15]` stays one entry.
 * `# comments` and `Key =` prefixes (as in a WireGuard config) are ignored.
 */
export function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  input.split(/\r?\n/).forEach((rawLine, index) => {
    const line = index + 1
    let current = ''
    let bracketDepth = 0
    const flush = (): void => {
      if (current !== '') tokens.push({ text: current, line })
      current = ''
    }
    for (const char of stripNoise(rawLine)) {
      if (char === '[') bracketDepth++
      if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1)
      const isSeparator = bracketDepth === 0 && (char === ',' || /\s/.test(char))
      if (isSeparator) flush()
      else current += char
    }
    flush()
  })
  return tokens
}

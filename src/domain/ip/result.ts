/** Outcome of parsing a single list entry. A successful parse may still carry a warning. */
export type ParseOutcome<T> =
  | { readonly ok: true; readonly value: T; readonly warning?: string }
  | { readonly ok: false; readonly error: string }

export function success<T>(value: T, warning?: string): ParseOutcome<T> {
  return warning === undefined ? { ok: true, value } : { ok: true, value, warning }
}

export function failure<T = never>(error: string): ParseOutcome<T> {
  return { ok: false, error }
}

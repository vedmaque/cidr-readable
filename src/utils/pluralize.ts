/** `pluralize(1, 'entry', 'entries')` → `1 entry`. */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}

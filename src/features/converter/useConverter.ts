import { computed } from 'vue'
import { useStorage } from '@vueuse/core'
import { joinList, type ListStyle } from '@/domain/ip'
import type { ConverterMode } from './modes'

const STORAGE_PREFIX = 'cidr-readable'

/**
 * What the output panel has to show:
 * - `idle`: nothing typed yet;
 * - `no-entries`: only comments, separators or blank lines;
 * - `only-errors`: there are entries, but none of them is valid;
 * - `has-errors`: some entries are invalid and the mode withholds partial results
 *   (`mode.blockOnErrors`);
 * - `empty-result`: valid entries that produce nothing (everything is denied);
 * - `ready`: there is a result to show.
 *
 * Errors are checked before the result: in Deny mode, invalid entries still produce a result
 * (everything is allowed), and it must never be shown as if it were correct.
 */
export type ConverterStatus =
  'idle' | 'no-entries' | 'only-errors' | 'has-errors' | 'empty-result' | 'ready'

/**
 * State of one converter screen: the input (persisted per mode), the selected list style
 * (shared across modes) and the derived conversion result.
 */
export function useConverter(mode: ConverterMode) {
  const input = useStorage(`${STORAGE_PREFIX}:input:${mode.id}`, '')
  const storedStyle = useStorage<ListStyle>(`${STORAGE_PREFIX}:list-style`, 'lines')

  const supportsListStyle = mode.output === 'cidr'
  const listStyle = computed<ListStyle>({
    get: () => (supportsListStyle ? storedStyle.value : 'lines'),
    set: (value) => {
      storedStyle.value = value
    },
  })

  const hasInput = computed(() => input.value.trim() !== '')
  const result = computed(() => mode.convert(input.value))
  const errorCount = computed(
    () => result.value.issues.filter((issue) => issue.severity === 'error').length,
  )

  const status = computed<ConverterStatus>(() => {
    const { inputEntryCount, entries } = result.value
    if (!hasInput.value) return 'idle'
    if (inputEntryCount === 0) return 'no-entries'
    if (errorCount.value === inputEntryCount) return 'only-errors'
    if (errorCount.value > 0 && mode.blockOnErrors === true) return 'has-errors'
    return entries.length > 0 ? 'ready' : 'empty-result'
  })

  const outputText = computed(() => {
    if (status.value !== 'ready') return ''
    const list = joinList(result.value.entries, listStyle.value)
    return listStyle.value === 'wireguard' && mode.wireguardKey !== undefined
      ? `${mode.wireguardKey} = ${list}`
      : list
  })

  return { input, listStyle, supportsListStyle, hasInput, result, errorCount, status, outputText }
}

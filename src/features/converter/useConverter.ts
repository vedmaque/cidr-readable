import { computed } from 'vue'
import { useStorage } from '@vueuse/core'
import { joinList, type ListStyle } from '@/domain/ip'
import type { ConverterMode } from './modes'

const STORAGE_PREFIX = 'cidr-readable'

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

  const outputText = computed(() => {
    if (!hasInput.value) return ''
    const list = joinList(result.value.entries, listStyle.value)
    return listStyle.value === 'wireguard' && mode.wireguardKey !== undefined
      ? `${mode.wireguardKey} = ${list}`
      : list
  })

  return { input, listStyle, supportsListStyle, hasInput, result, errorCount, outputText }
}

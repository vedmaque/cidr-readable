import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { findMode, type ConverterMode, type ModeId } from '../modes'
import { useConverter } from '../useConverter'

const mode = (id: ModeId) => findMode(id) as ConverterMode

describe('useConverter', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('produces no output for blank input', () => {
    const { hasInput, outputText } = useConverter(mode('cidr-to-readable'))
    expect(hasInput.value).toBe(false)
    expect(outputText.value).toBe('')
  })

  it('converts input reactively', () => {
    const { input, outputText, result } = useConverter(mode('cidr-to-readable'))
    input.value = '172.16.0.0/12\n10.0.0.0/8'
    expect(outputText.value).toBe('10.X.X.X\n172.[16-31].X.X')
    expect(result.value.inputEntryCount).toBe(2)
  })

  it('counts only errors, not warnings', () => {
    const { input, errorCount } = useConverter(mode('readable-to-cidr'))
    input.value = 'bad, 10.0.0.1/8, 10.X.X.X'
    expect(errorCount.value).toBe(1)
  })

  it('renders the WireGuard style for CIDR output, with the config key when the mode has one', async () => {
    const readableToCidr = useConverter(mode('readable-to-cidr'))
    readableToCidr.input.value = '10.X.X.X\n192.168.X.X'
    readableToCidr.listStyle.value = 'wireguard'
    expect(readableToCidr.outputText.value).toBe('10.0.0.0/8, 192.168.0.0/16')
    await nextTick()

    // The chosen style is shared between modes.
    const deny = useConverter(mode('deny-to-allowed'))
    deny.input.value = '0.0.0.0/1'
    expect(deny.listStyle.value).toBe('wireguard')
    expect(deny.outputText.value).toBe('AllowedIPs = 128.0.0.0/1')
  })

  it('always uses lines for readable output', () => {
    const { input, listStyle, supportsListStyle, outputText } = useConverter(
      mode('cidr-to-readable'),
    )
    expect(supportsListStyle).toBe(false)
    listStyle.value = 'wireguard'
    input.value = '10.0.0.0/8, 192.168.0.0/16'
    expect(listStyle.value).toBe('lines')
    expect(outputText.value).toBe('10.X.X.X\n192.168.X.X')
  })

  it('persists the input per mode', async () => {
    const first = useConverter(mode('readable-to-cidr'))
    first.input.value = '10.X.X.X'
    await nextTick()

    expect(useConverter(mode('readable-to-cidr')).input.value).toBe('10.X.X.X')
    expect(useConverter(mode('cidr-to-readable')).input.value).toBe('')
  })
})

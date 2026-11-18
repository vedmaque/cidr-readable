import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type * as VueUse from '@vueuse/core'
import { mount } from '@vue/test-utils'
import CopyButton from '../CopyButton.vue'

const clipboard = {
  copy: vi.fn<(text: string) => Promise<void>>(),
  copied: ref(false),
  isSupported: ref(true),
}

vi.mock('@vueuse/core', async (importOriginal) => ({
  ...(await importOriginal<typeof VueUse>()),
  useClipboard: () => clipboard,
}))

describe('CopyButton', () => {
  beforeEach(() => {
    clipboard.copy.mockResolvedValue(undefined)
    clipboard.copied.value = false
    clipboard.isSupported.value = true
  })

  it('copies the given text', async () => {
    const wrapper = mount(CopyButton, { props: { text: '10.0.0.0/8' } })
    await wrapper.get('button').trigger('click')
    expect(clipboard.copy).toHaveBeenCalledWith('10.0.0.0/8')
  })

  it('confirms a successful copy', async () => {
    const wrapper = mount(CopyButton, { props: { text: '10.0.0.0/8' } })
    expect(wrapper.text()).toBe('Copy')
    clipboard.copied.value = true
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toBe('Copied')
  })

  it('is disabled when there is nothing to copy', () => {
    const wrapper = mount(CopyButton, { props: { text: '' } })
    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
  })

  it('is hidden when the clipboard is unavailable', () => {
    clipboard.isSupported.value = false
    const wrapper = mount(CopyButton, { props: { text: 'x' } })
    expect(wrapper.find('button').exists()).toBe(false)
  })
})

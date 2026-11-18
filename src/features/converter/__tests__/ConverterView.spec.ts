import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ConverterView from '../ConverterView.vue'
import { findMode, type ConverterMode, type ModeId } from '../modes'

function mountView(id: ModeId) {
  return mount(ConverterView, { props: { mode: findMode(id) as ConverterMode } })
}

describe('ConverterView', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows a hint until something is typed', () => {
    const wrapper = mountView('cidr-to-readable')
    expect(wrapper.get('[data-testid="output-empty"]').text()).toContain('as you type')
    expect(wrapper.find('[data-testid="output-summary"]').exists()).toBe(false)
  })

  it('converts as you type and summarizes the result', async () => {
    const wrapper = mountView('cidr-to-readable')
    await wrapper.get('textarea').setValue('10.0.0.0/24, 10.0.1.0/24')
    expect(wrapper.get('[data-testid="output"]').text()).toBe('10.0.[0-1].X')
    expect(wrapper.get('[data-testid="output-summary"]').text()).toBe('2 entries → 1 pattern')
  })

  it('lists problems and still converts valid entries', async () => {
    const wrapper = mountView('readable-to-cidr')
    await wrapper.get('textarea').setValue('10.X.X.X\n10.X.0.X')
    expect(wrapper.get('[data-testid="output"]').text()).toBe('10.0.0.0/8')
    expect(wrapper.get('[data-testid="issues"]').text()).toContain('Line 2')
    expect(wrapper.get('[data-testid="output-summary"]').text()).toBe(
      '2 entries → 1 network · 1 entry skipped',
    )
  })

  it('explains an empty result caused by errors only', async () => {
    const wrapper = mountView('readable-to-cidr')
    await wrapper.get('textarea').setValue('nonsense')
    expect(wrapper.get('[data-testid="output-empty"]').text()).toContain('fix the problems')
  })

  it('does not report problems when the input has only comments and blank lines', async () => {
    const wrapper = mountView('cidr-to-readable')
    await wrapper.get('textarea').setValue('# office networks\n\n')
    const empty = wrapper.get('[data-testid="output-empty"]').text()
    expect(empty).toContain('no entries')
    expect(empty).not.toContain('problems')
    expect(wrapper.find('[data-testid="issues"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="output-summary"]').exists()).toBe(false)
  })

  it('explains an empty result when everything is denied', async () => {
    const wrapper = mountView('deny-to-allowed')
    await wrapper.get('textarea').setValue('X.X.X.X')
    expect(wrapper.get('[data-testid="output-empty"]').text()).toContain('whole IPv4 space')
  })

  it('fills in the example and clears it', async () => {
    const wrapper = mountView('deny-to-allowed')
    const button = (label: string) =>
      wrapper.findAll('button').find((b) => b.text() === label) ?? wrapper.get('missing')

    await button('Example').trigger('click')
    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toContain('10.0.0.0/8')
    await button('Clear').trigger('click')
    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('')
  })

  it('switches CIDR output to the WireGuard style', async () => {
    const wrapper = mountView('deny-to-allowed')
    await wrapper.get('textarea').setValue('0.0.0.0/2')
    await wrapper.get('input[value="wireguard"]').setValue()
    expect(wrapper.get('[data-testid="output"]').text()).toBe(
      'AllowedIPs = 64.0.0.0/2, 128.0.0.0/1',
    )
  })

  it('offers no style switch for readable output', () => {
    const wrapper = mountView('cidr-to-readable')
    expect(wrapper.find('[role="radiogroup"]').exists()).toBe(false)
  })
})

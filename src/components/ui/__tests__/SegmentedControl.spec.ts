import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SegmentedControl from '../SegmentedControl.vue'

describe('SegmentedControl', () => {
  const options = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
  ] as const

  it('renders an accessible radio group reflecting the model', () => {
    const wrapper = mount(SegmentedControl, {
      props: { label: 'Pick', options, modelValue: 'b' },
    })
    expect(wrapper.get('[role="radiogroup"]').attributes('aria-label')).toBe('Pick')
    expect((wrapper.get('input[value="b"]').element as HTMLInputElement).checked).toBe(true)
  })

  it('emits the selected value', async () => {
    const wrapper = mount(SegmentedControl, {
      props: { label: 'Pick', options, modelValue: 'a' },
    })
    await wrapper.get('input[value="b"]').setValue()
    expect(wrapper.emitted('update:modelValue')).toEqual([['b']])
  })
})

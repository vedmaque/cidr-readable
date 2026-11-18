import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import InputPanel from '../components/InputPanel.vue'

const props = { modelValue: '', label: 'List', placeholder: '', example: '' }

describe('InputPanel', () => {
  it('links its label to its own textarea when several panels are on the page', () => {
    const TwoPanels = defineComponent({
      render: () => [h(InputPanel, props), h(InputPanel, props)],
    })
    const wrapper = mount(TwoPanels, { attachTo: document.body })

    const textareas = wrapper.findAll('textarea').map((t) => t.element)
    const labels = wrapper.findAll('label').map((l) => l.element as HTMLLabelElement)

    expect(new Set(textareas.map((t) => t.id)).size).toBe(2)
    labels.forEach((label, i) => {
      expect(label.control).toBe(textareas[i])
    })
    wrapper.unmount()
  })
})

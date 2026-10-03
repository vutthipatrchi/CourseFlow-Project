import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Spinner from '@/components/common/Spinner.vue'

describe('Spinner', () => {
  it('renders a decorative spin icon', () => {
    const wrapper = mount(Spinner)

    const svg = wrapper.get('svg')
    expect(svg.attributes('aria-hidden')).toBe('true')
    expect(svg.classes()).toContain('animate-spin')
  })

  it('shows the label text when provided', () => {
    const wrapper = mount(Spinner, { props: { label: 'Loading courses…' } })

    expect(wrapper.text()).toContain('Loading courses…')
  })

  it('omits the label element when none is provided', () => {
    const wrapper = mount(Spinner)

    expect(wrapper.text()).toBe('')
  })

  it('applies the requested size to the icon', () => {
    const wrapper = mount(Spinner, { props: { size: 'lg' } })

    expect(wrapper.get('svg').classes()).toContain('h-16')
  })

  it('stacks the icon above the label when vertical', () => {
    const wrapper = mount(Spinner, { props: { label: 'Loading…', vertical: true } })

    expect(wrapper.get('span').classes()).toContain('flex-col')
  })

  it('uses the button text color instead of blue when inverted', () => {
    const wrapper = mount(Spinner, { props: { inverted: true } })

    const svg = wrapper.get('svg')
    expect(svg.classes()).toContain('text-current')
    expect(svg.classes()).not.toContain('text-blue-600')
  })

  it('does not force a gray text color on the wrapper when inverted', () => {
    const wrapper = mount(Spinner, { props: { inverted: true } })

    expect(wrapper.get('span').classes()).not.toContain('text-[#646D89]')
  })

  it('supports the xs size for inline button icons', () => {
    const wrapper = mount(Spinner, { props: { size: 'xs' } })

    expect(wrapper.get('svg').classes()).toContain('h-5')
  })
})

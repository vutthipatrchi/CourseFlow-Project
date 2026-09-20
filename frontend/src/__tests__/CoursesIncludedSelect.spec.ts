import { describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import CoursesIncludedSelect from '../components/admin/CoursesIncludedSelect.vue'

const courses = [
  { id: 1, name: 'Course A' },
  { id: 2, name: 'Course B' },
]

function lastEmittedModelValue(wrapper: VueWrapper): number[] | undefined {
  const events = wrapper.emitted('update:modelValue')
  return events?.[events.length - 1]?.[0] as number[] | undefined
}

describe('CoursesIncludedSelect', () => {
  it('defaults to "All courses" checked', () => {
    const wrapper = mount(CoursesIncludedSelect, { props: { modelValue: [], courses } })
    expect(wrapper.text()).toContain('All courses')
    expect(wrapper.find('[aria-label^="Remove"]').exists()).toBe(false)
  })

  it('checking a specific course unchecks "All courses" and emits that course id', async () => {
    const wrapper = mount(CoursesIncludedSelect, { props: { modelValue: [], courses } })
    await wrapper.get('button').trigger('click')

    const allCheckbox = wrapper.findAll('input[type="checkbox"]')[0]!
    const courseACheckbox = wrapper.findAll('input[type="checkbox"]')[1]!
    expect((allCheckbox.element as HTMLInputElement).checked).toBe(true)

    await courseACheckbox.setValue(true)

    expect((allCheckbox.element as HTMLInputElement).checked).toBe(false)
    expect(lastEmittedModelValue(wrapper)).toEqual([1])
  })

  it('checking "All courses" while specific courses are selected clears them all', async () => {
    const wrapper = mount(CoursesIncludedSelect, {
      props: { modelValue: [1, 2], courses },
    })
    await wrapper.get('button').trigger('click')

    const allCheckbox = wrapper.findAll('input[type="checkbox"]')[0]!
    await allCheckbox.setValue(true)

    expect(lastEmittedModelValue(wrapper)).toEqual([])
    const courseCheckboxes = wrapper.findAll('input[type="checkbox"]').slice(1)
    for (const checkbox of courseCheckboxes) {
      expect((checkbox.element as HTMLInputElement).checked).toBe(false)
    }
  })

  it('shows a removable chip per selected course when closed', () => {
    const wrapper = mount(CoursesIncludedSelect, { props: { modelValue: [1], courses } })
    expect(wrapper.text()).toContain('Course A')
    expect(wrapper.text()).not.toContain('All courses')
    expect(wrapper.find('[aria-label="Remove Course A"]').exists()).toBe(true)
  })

  it('removing the last chip reverts the selection to "All courses"', async () => {
    const wrapper = mount(CoursesIncludedSelect, { props: { modelValue: [1], courses } })
    await wrapper.get('[aria-label="Remove Course A"]').trigger('click')
    expect(lastEmittedModelValue(wrapper)).toEqual([])
  })

  it('reverts to "All courses" on blur if nothing ended up checked', async () => {
    const wrapper = mount(CoursesIncludedSelect, { props: { modelValue: [1], courses } })
    await wrapper.get('button').trigger('click')

    const courseACheckbox = wrapper.findAll('input[type="checkbox"]')[1]!
    await courseACheckbox.setValue(false)
    // still open, nothing committed as "All courses" yet
    expect(lastEmittedModelValue(wrapper)).toEqual([])

    // closing (simulated focusout to outside the component) re-normalizes if needed
    await wrapper.trigger('focusout', { relatedTarget: document.body })
    expect(wrapper.find('[aria-label^="Remove"]').exists()).toBe(false)
  })
})

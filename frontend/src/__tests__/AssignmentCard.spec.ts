import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AssignmentCard from '@/components/course/AssignmentCard.vue'
import type { Assignment } from '@/types/course'

const pending: Assignment = {
  id: '5',
  question: 'What are the 4 elements of service design?',
  status: 'pending',
  deadlineLabel: 'Assign within 2 days',
}
const answer = 'Four Key Elements of Service Design\nPeople.\nProcesses.\nProducts.\nPartners.'

describe('AssignmentCard in the course player', () => {
  it('shows the answer form and the deadline while pending', () => {
    const wrapper = mount(AssignmentCard, { props: { assignment: pending } })

    expect(wrapper.text()).toContain('Pending')
    expect(wrapper.text()).toContain('What are the 4 elements of service design?')
    expect(wrapper.text()).toContain('Assign within 2 days')
    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.text()).toContain('Send Assignment')
  })

  it('emits the trimmed answer when Send Assignment is pressed', async () => {
    const wrapper = mount(AssignmentCard, { props: { assignment: pending } })

    await wrapper.get('textarea').setValue('  People, process  ')
    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('submit')).toEqual([['People, process']])
  })

  it('does not emit an empty answer', async () => {
    const wrapper = mount(AssignmentCard, { props: { assignment: pending } })

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('shows a submitted answer as plain text that keeps its line breaks', () => {
    const wrapper = mount(AssignmentCard, {
      props: { assignment: { ...pending, status: 'submitted', answer } },
    })

    const shown = wrapper.findAll('p').find((p) => p.text().startsWith('Four Key'))!
    expect(shown.element.textContent).toBe(answer)
    expect(shown.classes()).toContain('whitespace-pre-wrap')
    expect(shown.classes()).not.toContain('bg-white')
    expect(wrapper.find('textarea').exists()).toBe(false)
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('sets the Submitted and Overdue badges at 14px and the others at 16px', () => {
    const badgeClasses = (status: Assignment['status']) =>
      mount(AssignmentCard, { props: { assignment: { ...pending, status } } })
        .get('span')
        .classes()

    expect(badgeClasses('submitted')).toContain('text-sm')
    expect(badgeClasses('overdue')).toContain('text-sm')
    expect(badgeClasses('pending')).toContain('text-base')
    expect(badgeClasses('in-progress')).toContain('text-base')
  })

  it('turns read-only when its assignment becomes submitted', async () => {
    const wrapper = mount(AssignmentCard, { props: { assignment: pending } })
    expect(wrapper.find('textarea').exists()).toBe(true)

    await wrapper.setProps({ assignment: { ...pending, status: 'submitted', answer: 'Done' } })

    expect(wrapper.find('textarea').exists()).toBe(false)
    expect(wrapper.text()).toContain('Submitted')
    expect(wrapper.text()).toContain('Done')
  })
})

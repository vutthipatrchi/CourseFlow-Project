import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AssignmentForm from '@/components/admin/AssignmentForm.vue'
import type { SubLessonOption } from '@/types/assignment'

const options: SubLessonOption[] = [
  {
    subLessonId: 1,
    subLessonName: 'Components',
    lessonName: 'Vue Basics',
    courseName: 'Web Development',
  },
]

describe('AssignmentForm', () => {
  it('emits submit with the expected payload shape when valid', async () => {
    const wrapper = mount(AssignmentForm, {
      props: { subLessonOptions: options, submitting: false },
    })

    await wrapper.get('#course').setValue('Web Development')
    await wrapper.get('#lesson').setValue('Vue Basics')
    await wrapper.get('#sub-lesson').setValue('1')
    await wrapper.get('#description').setValue('Build a todo app')
    await wrapper.get('form').trigger('submit')

    const submitted = wrapper.emitted('submit')
    expect(submitted).toHaveLength(1)
    expect(submitted![0]![0]).toEqual({
      subLessonId: 1,
      description: 'Build a todo app',
    })
  })

  it('does not emit submit when required fields are empty', async () => {
    const wrapper = mount(AssignmentForm, {
      props: { subLessonOptions: options, submitting: false },
    })

    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
  })
})

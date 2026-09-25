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
      durationDays: null,
    })
  })

  it('does not emit submit when required fields are empty', async () => {
    const wrapper = mount(AssignmentForm, {
      props: { subLessonOptions: options, submitting: false },
    })

    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('pre-fills course/lesson/sub-lesson/description from initialValue', async () => {
    const wrapper = mount(AssignmentForm, {
      props: {
        subLessonOptions: options,
        submitting: false,
        initialValue: { subLessonId: 1, description: 'Existing assignment', durationDays: null },
      },
    })

    expect((wrapper.get('#course').element as HTMLSelectElement).value).toBe('Web Development')
    expect((wrapper.get('#lesson').element as HTMLSelectElement).value).toBe('Vue Basics')
    expect((wrapper.get('#sub-lesson').element as HTMLSelectElement).value).toBe('1')
    expect((wrapper.get('#description').element as HTMLInputElement).value).toBe(
      'Existing assignment',
    )

    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('submit')![0]![0]).toEqual({
      subLessonId: 1,
      description: 'Existing assignment',
      durationDays: null,
    })
  })

  it('still resets lesson/sub-lesson when the user changes course after a pre-fill', async () => {
    const multiCourseOptions: SubLessonOption[] = [
      ...options,
      {
        subLessonId: 2,
        subLessonName: 'Routing',
        lessonName: 'Vue Router',
        courseName: 'Advanced Vue',
      },
    ]
    const wrapper = mount(AssignmentForm, {
      props: {
        subLessonOptions: multiCourseOptions,
        submitting: false,
        initialValue: { subLessonId: 1, description: 'Existing assignment', durationDays: null },
      },
    })

    await wrapper.get('#course').setValue('Advanced Vue')

    expect((wrapper.get('#lesson').element as HTMLSelectElement).value).toBe('Select a lesson')
    expect((wrapper.get('#sub-lesson').element as HTMLSelectElement).value).toBe(
      'Select a sub-lesson',
    )
  })
})

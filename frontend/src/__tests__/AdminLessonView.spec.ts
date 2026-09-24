import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { VueDraggable } from 'vue-draggable-plus'
import { createLesson, fetchLesson, updateLesson } from '@/api/lessons'
import type { SubLessonFormItem } from '@/types/lesson'
import AdminLessonView from '../views/AdminLessonView.vue'

vi.mock('@/api/lessons')
vi.mock('@/api/uploads')
vi.mock('@/admin/courseStore', () => ({
  getCourse: vi.fn<() => Promise<{ id: number; name: string }>>(async () => ({
    id: 1,
    name: 'Service Design Essentials',
  })),
}))

const lessonDetail = {
  id: 7,
  courseId: 1,
  name: 'Introduction',
  position: 1,
  subLessons: [
    { id: 11, name: 'Welcome', videoUrl: 'https://example.com/a.mp4', position: 1 },
    { id: 12, name: 'Overview', videoUrl: 'https://example.com/b.mp4', position: 2 },
    { id: 13, name: 'Getting started', videoUrl: 'https://example.com/c.mp4', position: 3 },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(fetchLesson).mockResolvedValue(lessonDetail)
  vi.mocked(updateLesson).mockResolvedValue(lessonDetail)
  vi.mocked(createLesson).mockResolvedValue(lessonDetail)
})

async function mountView(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/admin/courses/:id/edit',
        name: 'admin-course-edit',
        component: { template: '<div />' },
      },
      {
        path: '/admin/courses/new',
        name: 'admin-course-create',
        component: { template: '<div />' },
      },
      {
        path: '/admin/courses/:courseId/lessons/new',
        name: 'admin-lesson-create',
        component: AdminLessonView,
      },
      {
        path: '/admin/courses/:courseId/lessons/:lessonId',
        name: 'admin-lesson-edit',
        component: AdminLessonView,
      },
    ],
  })
  await router.push(path)
  await router.isReady()

  const wrapper = mount(AdminLessonView, {
    global: {
      plugins: [router],
      stubs: {
        AdminLayout: {
          props: ['title'],
          template: '<div>{{ title }}<slot name="actions" /><slot /></div>',
        },
      },
    },
  })
  await flushPromises()
  return wrapper
}

function subLessonNames(wrapper: Awaited<ReturnType<typeof mountView>>) {
  return wrapper
    .findAll<HTMLInputElement>('article input[type="text"]')
    .map((input) => input.element.value)
}

describe('AdminLessonView sub-lesson drag and drop', () => {
  it('only lets sub-lessons be dragged from the grip handle', async () => {
    const wrapper = await mountView('/admin/courses/1/lessons/7')

    const draggable = wrapper.getComponent(VueDraggable)
    expect(draggable.props('handle')).toBe('.sub-lesson-drag-handle')
    expect(draggable.props('forceFallback')).toBe(true)
    const rows = wrapper.findAll('article')
    expect(rows).toHaveLength(3)
    for (const row of rows) {
      expect(row.find('.sub-lesson-drag-handle').exists()).toBe(true)
    }
  })

  it('saves sub-lessons in their dragged order when editing a lesson', async () => {
    const wrapper = await mountView('/admin/courses/1/lessons/7')
    const draggable = wrapper.getComponent(VueDraggable)
    const [first, second, third] = draggable.props('modelValue') as SubLessonFormItem[]

    draggable.vm.$emit('update:modelValue', [third, first, second])
    await flushPromises()
    expect(subLessonNames(wrapper)).toEqual(['Getting started', 'Welcome', 'Overview'])

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Edit')!
      .trigger('click')
    await flushPromises()

    expect(updateLesson).toHaveBeenCalledWith(7, {
      name: 'Introduction',
      subLessons: [
        { id: 13, name: 'Getting started', videoUrl: 'https://example.com/c.mp4' },
        { id: 11, name: 'Welcome', videoUrl: 'https://example.com/a.mp4' },
        { id: 12, name: 'Overview', videoUrl: 'https://example.com/b.mp4' },
      ],
    })
  })

  it('saves sub-lessons in their dragged order when adding a lesson', async () => {
    const wrapper = await mountView('/admin/courses/1/lessons/new')

    await wrapper.get('label input[type="text"]').setValue('Basics')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '+ Add Sub-lesson')!
      .trigger('click')

    const draggable = wrapper.getComponent(VueDraggable)
    const items = draggable.props('modelValue') as SubLessonFormItem[]
    items[0]!.name = 'First'
    items[0]!.videoUrl = 'https://example.com/1.mp4'
    items[1]!.name = 'Second'
    items[1]!.videoUrl = 'https://example.com/2.mp4'
    draggable.vm.$emit('update:modelValue', [items[1], items[0]])
    await flushPromises()

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Create')!
      .trigger('click')
    await flushPromises()

    expect(createLesson).toHaveBeenCalledWith(1, {
      name: 'Basics',
      subLessons: [
        { name: 'Second', videoUrl: 'https://example.com/2.mp4' },
        { name: 'First', videoUrl: 'https://example.com/1.mp4' },
      ],
    })
  })

  it('does not reorder when the Delete button or a row input is used', async () => {
    const wrapper = await mountView('/admin/courses/1/lessons/7')

    await wrapper.findAll('article input[type="text"]')[1]!.setValue('Overview (edited)')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Delete')!
      .trigger('click')
    await flushPromises()

    expect(subLessonNames(wrapper)).toEqual(['Overview (edited)', 'Getting started'])
  })
})

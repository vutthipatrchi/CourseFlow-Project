import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import AdminAssignmentCreateView from '../views/AdminAssignmentCreateView.vue'
import {
  createAssignment,
  getAssignment,
  listSubLessonOptions,
  updateAssignment,
} from '@/api/assignments'
import type { AssignmentDetail, SubLessonOption } from '@/types/assignment'

vi.mock('@/api/assignments')

const options: SubLessonOption[] = [
  {
    subLessonId: 1,
    subLessonName: 'Components',
    lessonName: 'Vue Basics',
    courseName: 'Web Development',
  },
]

const existingAssignment: AssignmentDetail = {
  id: 5,
  subLessonId: 1,
  description: 'Existing assignment',
  durationDays: null,
  createdAt: '2026-01-01T00:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(listSubLessonOptions).mockResolvedValue(options)
})

async function mountView(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/admin/assignments', name: 'admin-assignments', component: { template: '<div />' } },
      {
        path: '/admin/assignments/create',
        name: 'admin-assignment-create',
        component: AdminAssignmentCreateView,
      },
      {
        path: '/admin/assignments/:id/edit',
        name: 'admin-assignment-edit',
        component: AdminAssignmentCreateView,
      },
    ],
  })
  await router.push(path)
  await router.isReady()

  const wrapper = mount(AdminAssignmentCreateView, {
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
  return { router, wrapper }
}

describe('AdminAssignmentCreateView', () => {
  it('creates a new assignment when there is no route id', async () => {
    vi.mocked(createAssignment).mockResolvedValue({
      id: 9,
      description: 'Build a todo app',
      courseName: 'Web Development',
      lessonName: 'Vue Basics',
      subLessonName: 'Components',
      durationDays: null,
      createdAt: '2026-01-01T00:00:00Z',
    })

    const { wrapper, router } = await mountView('/admin/assignments/create')
    expect(wrapper.text()).toContain('Add Assignment')

    await wrapper.get('#course').setValue('Web Development')
    await wrapper.get('#lesson').setValue('Vue Basics')
    await wrapper.get('#sub-lesson').setValue('1')
    await wrapper.get('#description').setValue('Build a todo app')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(createAssignment).toHaveBeenCalledWith({
      subLessonId: 1,
      description: 'Build a todo app',
      durationDays: null,
    })
    expect(updateAssignment).not.toHaveBeenCalled()
    expect(router.currentRoute.value.name).toBe('admin-assignments')
  })

  it('loads and pre-fills the assignment when editing, and saves via update', async () => {
    vi.mocked(getAssignment).mockResolvedValue(existingAssignment)
    vi.mocked(updateAssignment).mockResolvedValue({ ...existingAssignment, description: 'Edited' })

    const { wrapper, router } = await mountView('/admin/assignments/5/edit')

    expect(getAssignment).toHaveBeenCalledWith(5)
    expect(wrapper.text()).toContain('Edit Assignment')
    expect((wrapper.get('#description').element as HTMLInputElement).value).toBe(
      'Existing assignment',
    )
    expect(wrapper.text()).toContain('Save')

    await wrapper.get('#description').setValue('Edited')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(updateAssignment).toHaveBeenCalledWith(5, {
      subLessonId: 1,
      description: 'Edited',
      durationDays: null,
    })
    expect(createAssignment).not.toHaveBeenCalled()
    expect(router.currentRoute.value.name).toBe('admin-assignments')
  })
})

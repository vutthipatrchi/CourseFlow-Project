import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import AdminAssignmentsView from '../views/AdminAssignmentsView.vue'
import { deleteAssignment, listAssignments } from '@/api/assignments'
import type { Assignment } from '@/types/assignment'

vi.mock('@/api/assignments')

beforeEach(() => vi.clearAllMocks())

function makeRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/admin/assignments', name: 'admin-assignments', component: { template: '<div />' } },
      {
        path: '/admin/assignments/create',
        name: 'admin-assignment-create',
        component: { template: '<div />' },
      },
      {
        path: '/admin/assignments/:id/edit',
        name: 'admin-assignment-edit',
        component: { template: '<div />' },
      },
    ],
  })
}

const stubs = {
  AdminLayout: { template: '<div><slot name="actions" /><slot /></div>' },
}

const sampleAssignment: Assignment = {
  id: 1,
  description: 'Build a todo app',
  courseName: 'Web Development',
  lessonName: 'Vue Basics',
  subLessonName: 'Components',
  durationDays: null,
  createdAt: '2026-01-01T00:00:00Z',
}

describe('AdminAssignmentsView', () => {
  it('renders assignment rows from the API', async () => {
    vi.mocked(listAssignments).mockResolvedValue([sampleAssignment])
    const router = makeRouter()
    router.push('/admin/assignments')
    await router.isReady()

    const wrapper = mount(AdminAssignmentsView, { global: { plugins: [router], stubs } })
    await flushPromises()

    expect(wrapper.text()).toContain('Build a todo app')
    expect(wrapper.text()).toContain('Web Development')
    wrapper.unmount()
  })

  it('shows an empty state when there are no assignments', async () => {
    vi.mocked(listAssignments).mockResolvedValue([])
    const router = makeRouter()
    router.push('/admin/assignments')
    await router.isReady()

    const wrapper = mount(AdminAssignmentsView, { global: { plugins: [router], stubs } })
    await flushPromises()

    expect(wrapper.text()).toContain('No assignments yet.')
    wrapper.unmount()
  })

  it('opens a confirmation modal and only deletes once confirmed', async () => {
    vi.mocked(listAssignments).mockResolvedValue([sampleAssignment])
    vi.mocked(deleteAssignment).mockResolvedValue(undefined)
    const router = makeRouter()
    router.push('/admin/assignments')
    await router.isReady()

    const wrapper = mount(AdminAssignmentsView, { global: { plugins: [router], stubs } })
    await flushPromises()

    await wrapper.get('button[aria-label^="Delete"]').trigger('click')
    expect(wrapper.text()).toContain('Are you sure you want to delete this assignment?')
    expect(deleteAssignment).not.toHaveBeenCalled()

    vi.mocked(listAssignments).mockResolvedValue([])
    const confirmButton = wrapper.findAll('button').find((button) => button.text() === 'Delete')
    await confirmButton!.trigger('click')
    await flushPromises()

    expect(deleteAssignment).toHaveBeenCalledWith(1)
    expect(wrapper.text()).not.toContain('Confirmation')
    wrapper.unmount()
  })

  it('closing the confirmation modal does not delete the assignment', async () => {
    vi.mocked(listAssignments).mockResolvedValue([sampleAssignment])
    const router = makeRouter()
    router.push('/admin/assignments')
    await router.isReady()

    const wrapper = mount(AdminAssignmentsView, { global: { plugins: [router], stubs } })
    await flushPromises()

    await wrapper.get('button[aria-label^="Delete"]').trigger('click')
    await wrapper.get('button[aria-label="Close"]').trigger('click')

    expect(wrapper.text()).not.toContain('Are you sure you want to delete this assignment?')
    expect(deleteAssignment).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})

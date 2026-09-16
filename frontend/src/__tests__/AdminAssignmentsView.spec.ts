import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import AdminAssignmentsView from '../views/AdminAssignmentsView.vue'
import { listAssignments } from '@/api/assignments'
import type { Assignment } from '@/types/assignment'

vi.mock('@/api/assignments')

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
    ],
  })
}

const sampleAssignment: Assignment = {
  id: 1,
  description: 'Build a todo app',
  durationDays: 7,
  status: 'draft',
  courseName: 'Web Development',
  lessonName: 'Vue Basics',
  subLessonName: 'Components',
  createdAt: '2026-01-01T00:00:00Z',
}

describe('AdminAssignmentsView', () => {
  it('renders assignment rows from the API', async () => {
    vi.mocked(listAssignments).mockResolvedValue([sampleAssignment])
    const router = makeRouter()
    router.push('/admin/assignments')
    await router.isReady()

    const wrapper = mount(AdminAssignmentsView, { global: { plugins: [router] } })
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

    const wrapper = mount(AdminAssignmentsView, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.text()).toContain('No assignments yet.')
    wrapper.unmount()
  })
})

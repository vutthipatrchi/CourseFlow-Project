import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { deleteCourse } from '@/api/courses'
import { useCourseStore } from '@/stores/course'
import { makeCourseFixtures } from './courseFixtures'
import AdminCourseListView from '../views/AdminCourseListView.vue'

vi.mock('@/api/courses')

vi.mock('@clerk/vue', () => ({
  getToken: vi.fn<() => Promise<string>>(async () => 'test-clerk-token'),
  SignOutButton: { template: '<div><slot /></div>' },
  useClerk: () => ({ value: { signOut: vi.fn<() => Promise<void>>() } }),
}))

const pinia = createPinia()

beforeEach(() => {
  setActivePinia(pinia)
  useCourseStore().$patch({
    courses: makeCourseFixtures(),
    loading: false,
    error: '',
    loaded: true,
  })
  vi.mocked(deleteCourse).mockResolvedValue()
})

function mountView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/login', component: { template: '<div>Login</div>' } },
      { path: '/admin/courses', name: 'admin-courses', component: AdminCourseListView },
      {
        path: '/admin/courses/new',
        name: 'admin-course-create',
        component: { template: '<div />' },
      },
      {
        path: '/admin/courses/:id/edit',
        name: 'admin-course-edit',
        component: { template: '<div />' },
      },
    ],
  })

  return mount(AdminCourseListView, {
    global: {
      plugins: [pinia, router],
      stubs: {
        AdminLayout: {
          props: ['title'],
          template: '<div><h1>{{ title }}</h1><slot name="actions" /><slot /></div>',
        },
      },
    },
  })
}

describe('admin course list', () => {
  it('shows the supplied course table columns and eight courses', () => {
    const wrapper = mountView()

    expect(wrapper.get('h1').text()).toBe('Course')
    expect(wrapper.findAll('tbody tr')).toHaveLength(8)
    expect(wrapper.text()).toContain('Course name')
    expect(wrapper.text()).toContain('Created date')
    expect(wrapper.text()).toContain('Updated date')
    const thumbnails = wrapper.findAll('.course-image img')
    expect(thumbnails[0]?.attributes('src')).toContain('service-design.jpg')
    expect(thumbnails[1]?.attributes('src')).toContain('software-developer.jpg')
    expect(thumbnails[2]?.attributes('src')).toContain('ux-ui-design.jpg')
  })

  it('filters courses by name', async () => {
    const wrapper = mountView()

    await wrapper.get('input[type="search"]').setValue('analytics')

    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    expect(wrapper.text()).toContain('Data Analytics Foundations')
    expect(wrapper.text()).not.toContain('Service Design Essentials')
  })

  it('shows an empty state when no course matches', async () => {
    const wrapper = mountView()

    await wrapper.get('input[type="search"]').setValue('missing course')

    expect(wrapper.get('.empty-state').text()).toContain('No courses match')
  })

  it('links each edit action to the full edit page', () => {
    const wrapper = mountView()

    expect(wrapper.get('a[aria-label="Edit Service Design Essentials"]').attributes('href')).toBe(
      '/admin/courses/1/edit',
    )
  })

  it('asks for confirmation before deleting a course', async () => {
    const wrapper = mountView()

    await wrapper.get('button[aria-label="Delete Service Design Essentials"]').trigger('click')
    expect(wrapper.get('[role="alertdialog"]').text()).toContain('Service Design Essentials')
    expect(wrapper.get('.secondary-button').text()).toBe('Cancel')
    expect(wrapper.get('.danger-button').text()).toBe('Delete')

    await wrapper.get('.danger-button').trigger('click')
    await flushPromises()

    expect(wrapper.findAll('tbody tr')).toHaveLength(7)
    expect(wrapper.get('tbody').text()).not.toContain('Service Design Essentials')
    expect(wrapper.get('[role="status"]').text()).toContain('was deleted')
  })

  it('cancels deletion without removing the course', async () => {
    const wrapper = mountView()

    await wrapper.get('button[aria-label="Delete Service Design Essentials"]').trigger('click')
    await wrapper.get('.secondary-button').trigger('click')

    expect(wrapper.find('[role="alertdialog"]').exists()).toBe(false)
    expect(wrapper.findAll('tbody tr')).toHaveLength(8)
    expect(wrapper.text()).toContain('Service Design Essentials')
  })
})

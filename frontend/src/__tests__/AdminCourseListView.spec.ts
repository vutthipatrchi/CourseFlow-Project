import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { clearUserRole, hasAdminAccess, setUserRole } from '../auth/access'
import AdminCourseListView from '../views/AdminCourseListView.vue'

beforeEach(() => clearUserRole())

function mountView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/login', component: { template: '<div>Login</div>' } },
      { path: '/admin/courses', component: AdminCourseListView },
    ],
  })

  return mount(AdminCourseListView, { global: { plugins: [router] } })
}

describe('admin course access', () => {
  it('only grants access for the admin role', () => {
    expect(hasAdminAccess()).toBe(false)
    setUserRole('student')
    expect(hasAdminAccess()).toBe(false)
    setUserRole('admin')
    expect(hasAdminAccess()).toBe(true)
  })
})

describe('admin course list', () => {
  it('shows the supplied course table columns and eight courses', () => {
    const wrapper = mountView()

    expect(wrapper.get('h1').text()).toBe('Course')
    expect(wrapper.findAll('tbody tr')).toHaveLength(8)
    expect(wrapper.text()).toContain('Course name')
    expect(wrapper.text()).toContain('Created date')
    expect(wrapper.text()).toContain('Updated date')
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
})

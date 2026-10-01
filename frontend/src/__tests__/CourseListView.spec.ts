import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import CourseListView from '@/views/CourseListView.vue'
import { getCheckoutCourses } from '@/api/payments'
import type { CheckoutCourse } from '@/api/payments'
import { checkoutCourseFixture } from './checkoutCourseFixture'

vi.mock('@/api/payments', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/payments')>()
  return { ...actual, getCheckoutCourses: vi.fn<() => Promise<CheckoutCourse[]>>() }
})

async function mountView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/courses', component: CourseListView },
      { path: '/courses/:id', component: { template: '<div>Detail</div>' } },
    ],
  })
  await router.push('/courses')
  await router.isReady()
  const wrapper = mount(CourseListView, {
    global: { plugins: [router], stubs: { AppNavbar: true, AppFooter: true, CtaBanner: true } },
  })
  await flushPromises()
  return wrapper
}

describe('CourseListView', () => {
  it('lists the courses returned by the catalog', async () => {
    vi.mocked(getCheckoutCourses).mockResolvedValueOnce([
      checkoutCourseFixture({ id: 1, name: 'Software Developer' }),
    ])
    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Software Developer')
    wrapper.unmount()
  })

  it('raises a matching toast when the catalog fails to load', async () => {
    vi.mocked(getCheckoutCourses).mockRejectedValueOnce(new Error('The server is unreachable.'))
    const errorSpy = vi.spyOn(toast, 'error')
    const wrapper = await mountView()

    expect(wrapper.get('[role="alert"]').text()).toContain('The server is unreachable.')
    expect(errorSpy).toHaveBeenCalledWith('The server is unreachable.')
    wrapper.unmount()
  })
})

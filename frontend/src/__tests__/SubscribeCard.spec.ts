import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SubscribeCard from '@/components/course/SubscribeCard.vue'
import { getCourseAccess } from '@/lib/courseAccess'
import { checkoutCourseFixture } from './checkoutCourseFixture'

vi.mock('@/lib/courseAccess', () => ({
  getCourseAccess: vi.fn(),
  learningPathForSubscription: (courseId: number) => `/courses/course-${courseId}/learn/sub-1-1`,
}))

async function mountCard() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/payment', name: 'payment', component: { template: '<div>Payment</div>' } },
      { path: '/my-courses', component: { template: '<div>My Courses</div>' } },
      {
        path: '/courses/:id/learn/:subLessonId',
        name: 'course-player',
        component: { template: '<div>Player</div>' },
      },
    ],
  })
  await router.push('/')
  await router.isReady()
  const wrapper = mount(SubscribeCard, {
    props: {
      category: 'Course',
      title: 'Software Developer',
      description: 'Learn to code',
    },
    global: { plugins: [router] },
  })
  await flushPromises()
  return { wrapper, router }
}

describe('SubscribeCard', () => {
  beforeEach(() => {
    vi.mocked(getCourseAccess).mockReset()
  })

  it('uses the backend course ID and price for checkout', async () => {
    vi.mocked(getCourseAccess).mockResolvedValue({
      enrolled: false,
      checkoutCourse: checkoutCourseFixture({ id: 9, name: 'Software Developer' }),
      subscriptionCourseId: null,
    })
    const { wrapper, router } = await mountCard()

    expect(wrapper.text()).toContain('THB 3,559.00')
    await wrapper.get('button:last-of-type').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/payment?courseId=9')
    wrapper.unmount()
  })

  it('shows Start learning instead of Subscribe when already purchased', async () => {
    vi.mocked(getCourseAccess).mockResolvedValue({
      enrolled: true,
      checkoutCourse: checkoutCourseFixture({ id: 9, name: 'Software Developer' }),
      subscriptionCourseId: 9,
    })
    const { wrapper, router } = await mountCard()

    expect(wrapper.text()).toContain('Already purchased')
    expect(wrapper.text()).not.toContain('Subscribe This Course')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Start learning')!
      .trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/courses/course-9/learn/sub-1-1')
    wrapper.unmount()
  })

  it('blocks checkout when the course is absent from the catalog', async () => {
    vi.mocked(getCourseAccess).mockResolvedValue({
      enrolled: false,
      checkoutCourse: null,
      subscriptionCourseId: null,
    })
    const { wrapper } = await mountCard()

    expect(wrapper.get('[role="alert"]').text()).toContain('not available for checkout')
    expect(
      wrapper
        .findAll('button')
        .find((button) => button.text() === 'Subscribe This Course')
        ?.attributes('disabled'),
    ).toBeDefined()
    wrapper.unmount()
  })
})

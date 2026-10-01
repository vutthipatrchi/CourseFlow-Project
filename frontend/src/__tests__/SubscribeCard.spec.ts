import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import { toast } from 'vue-sonner'
import SubscribeCard from '@/components/course/SubscribeCard.vue'
import { checkoutCourseFixture } from './checkoutCourseFixture'

async function mountCard(overrides: Partial<InstanceType<typeof SubscribeCard>['$props']> = {}) {
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
      checkoutCourse: checkoutCourseFixture({ id: 9, name: 'Software Developer' }),
      enrolled: false,
      subscriptionCourseId: null,
      loadingCourse: false,
      checkoutError: '',
      ...overrides,
    },
    global: { plugins: [router] },
  })
  await flushPromises()
  return { wrapper, router }
}

describe('SubscribeCard', () => {
  it('disables checkout and asks the parent to retry an access failure', async () => {
    const { wrapper } = await mountCard({ checkoutError: 'Unable to check course access.' })
    const button = wrapper
      .findAll('button')
      .find((item) => item.text() === 'Subscribe This Course')!
    expect(button.attributes('disabled')).toBeDefined()
    await wrapper.get('[role="alert"] button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
    wrapper.unmount()
  })

  it('raises a success toast when adding the course to the wishlist', async () => {
    const successSpy = vi.spyOn(toast, 'success')
    const { wrapper } = await mountCard()
    await wrapper.get('button:first-of-type').trigger('click')
    expect(successSpy).toHaveBeenCalledWith('Added to wishlist successfully!')
    wrapper.unmount()
  })

  it('uses the backend course ID and price for checkout', async () => {
    const { wrapper, router } = await mountCard()

    expect(wrapper.text()).toContain('THB 3,559.00')
    await wrapper.get('button:last-of-type').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/payment?courseId=9')
    wrapper.unmount()
  })

  it('shows Start learning instead of Subscribe when already purchased', async () => {
    const { wrapper, router } = await mountCard({ enrolled: true, subscriptionCourseId: 9 })

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
    const { wrapper } = await mountCard({
      checkoutCourse: null,
      checkoutError: 'This course is not available for checkout yet.',
    })

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

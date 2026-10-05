import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'vue-sonner'
import SubscribeCard from '@/components/course/SubscribeCard.vue'
import { checkoutCourseFixture } from './checkoutCourseFixture'

const mocks = vi.hoisted(() => ({ list: vi.fn(), add: vi.fn(), remove: vi.fn() }))
vi.mock('@clerk/vue', async () => {
  const { ref } = await import('vue')
  return { useUser: () => ({ user: ref({ id: 'user_1' }) }) }
})
vi.mock('@/api/wishlist', () => ({
  listWishlist: mocks.list,
  addWishlistCourse: mocks.add,
  removeWishlistCourse: mocks.remove,
}))
beforeEach(() => {
  vi.clearAllMocks()
  mocks.list.mockResolvedValue([])
  mocks.add.mockResolvedValue(undefined)
  mocks.remove.mockResolvedValue(undefined)
})

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
    await flushPromises()
    expect(mocks.add).toHaveBeenCalledWith(9)
    expect(successSpy).toHaveBeenCalledWith('Added to wishlist successfully!')
    expect(wrapper.text()).toContain('Remove from Wishlist')
    wrapper.unmount()
  })

  it('shows a failure and does not report success when saving fails', async () => {
    mocks.add.mockRejectedValue(new Error('Save failed'))
    const successSpy = vi.spyOn(toast, 'success')
    const errorSpy = vi.spyOn(toast, 'error')
    const { wrapper } = await mountCard()
    await wrapper.get('button:first-of-type').trigger('click')
    await flushPromises()
    expect(successSpy).not.toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalledWith('Save failed')
    expect(wrapper.text()).toContain('Add to Wishlist')
    wrapper.unmount()
  })

  it('loads saved status from the server and removes an existing item', async () => {
    mocks.list.mockResolvedValue([checkoutCourseFixture({ id: 9, name: 'Software Developer' })])
    const { wrapper } = await mountCard()
    expect(wrapper.text()).toContain('Remove from Wishlist')
    await wrapper.get('button:first-of-type').trigger('click')
    await flushPromises()
    expect(mocks.remove).toHaveBeenCalledWith(9)
    expect(wrapper.text()).toContain('Add to Wishlist')
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

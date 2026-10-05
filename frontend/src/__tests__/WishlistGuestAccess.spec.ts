import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import SubscribeCard from '@/components/course/SubscribeCard.vue'
import { checkoutCourseFixture } from './checkoutCourseFixture'

const mocks = vi.hoisted(() => ({ list: vi.fn(), add: vi.fn(), remove: vi.fn() }))
vi.mock('@clerk/vue', () => ({ useUser: () => ({ user: ref(null) }) }))
vi.mock('@/api/wishlist', () => ({
  listWishlist: mocks.list, addWishlistCourse: mocks.add, removeWishlistCourse: mocks.remove,
}))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.list.mockResolvedValue([])
})

describe('wishlist sign-in requirement', () => {
  it('sends a guest to sign-in and returns them to the current course without saving', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/courses/:id', name: 'course-detail', component: { template: '<div />' } },
        { path: '/sign-in', name: 'sign-in', component: { template: '<div />' } },
        { path: '/payment', name: 'payment', component: { template: '<div />' } },
        { path: '/my-courses', component: { template: '<div />' } },
        { path: '/courses/:id/learn/:lesson', name: 'course-player', component: { template: '<div />' } },
      ],
    })
    await router.push('/courses/course-9')
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
      },
      global: { plugins: [router] },
    })
    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text() === 'Add to Wishlist')!.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('sign-in')
    expect(router.currentRoute.value.query.redirect).toBe('/courses/course-9')
    expect(mocks.add).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
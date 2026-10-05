import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import WishlistView from '@/views/WishlistView.vue'
import { checkoutCourseFixture } from './checkoutCourseFixture'

const mocks = vi.hoisted(() => ({ list: vi.fn(), remove: vi.fn(), add: vi.fn() }))
const user = ref<{ id: string } | null>({ id: 'alice' })
vi.mock('@clerk/vue', () => ({ useUser: () => ({ user }) }))
vi.mock('@/api/wishlist', () => ({
  listWishlist: mocks.list,
  removeWishlistCourse: mocks.remove,
  addWishlistCourse: mocks.add,
}))
vi.mock('@/components/landing/AppNavbar.vue', () => ({ default: { template: '<header />' } }))
vi.mock('@/components/landing/AppFooter.vue', () => ({ default: { template: '<footer />' } }))

async function mountView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/courses/:id', component: { template: '<div />' } },
    ],
  })
  await router.push('/')
  return mount(WishlistView, { global: { plugins: [router] } })
}

beforeEach(() => {
  vi.clearAllMocks()
  user.value = { id: 'alice' }
  mocks.list.mockResolvedValue([checkoutCourseFixture({ id: 9, name: 'Software Developer' })])
  mocks.remove.mockResolvedValue(undefined)
})

describe('WishlistView', () => {
  it('reloads saved courses from the server after remount and links to their detail', async () => {
    const first = await mountView()
    await flushPromises()
    expect(first.text()).toContain('Software Developer')
    expect(first.get('a').attributes('href')).toBe('/courses/course-9')
    first.unmount()
    const second = await mountView()
    await flushPromises()
    expect(mocks.list).toHaveBeenCalledTimes(2)
    expect(second.text()).toContain('Software Developer')
    second.unmount()
  })

  it('only removes a course after the server confirms deletion', async () => {
    let finish!: () => void
    mocks.remove.mockReturnValue(
      new Promise<void>((resolve) => {
        finish = resolve
      }),
    )
    const wrapper = await mountView()
    await flushPromises()
    await wrapper.get('button').trigger('click')
    expect(mocks.remove).toHaveBeenCalledWith(9)
    expect(wrapper.text()).toContain('Software Developer')
    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
    finish()
    await flushPromises()
    expect(wrapper.text()).toContain('No courses in your wishlist yet.')
    wrapper.unmount()
  })

  it('retains the course when deletion fails', async () => {
    mocks.remove.mockRejectedValue(new Error('Cannot save'))
    const wrapper = await mountView()
    await flushPromises()
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Software Developer')
    wrapper.unmount()
  })

  it('shows loading and error states separately from an empty wishlist, with retry', async () => {
    let reject!: (error: Error) => void
    mocks.list.mockReturnValueOnce(
      new Promise((_, fail) => {
        reject = fail
      }),
    )
    const wrapper = await mountView()
    expect(wrapper.get('[role="status"]').text()).toContain('Loading wishlist')
    expect(wrapper.text()).not.toContain('No courses')
    reject(new Error('Load failed'))
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Load failed')
    expect(wrapper.text()).not.toContain('No courses')
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Software Developer')
    wrapper.unmount()
  })

  it('clears private data on account switch and ignores a late response for the previous user', async () => {
    let aliceResponse!: (value: ReturnType<typeof checkoutCourseFixture>[]) => void
    mocks.list.mockReturnValueOnce(
      new Promise((resolve) => {
        aliceResponse = resolve
      }),
    )
    const wrapper = await mountView()
    mocks.list.mockResolvedValueOnce([checkoutCourseFixture({ id: 1, name: 'Bob course' })])
    user.value = { id: 'bob' }
    await flushPromises()
    aliceResponse([checkoutCourseFixture({ id: 9, name: 'Alice private course' })])
    await flushPromises()
    expect(wrapper.text()).toContain('Bob course')
    expect(wrapper.text()).not.toContain('Alice private course')
    user.value = null
    await flushPromises()
    expect(wrapper.text()).not.toContain('Bob course')
    wrapper.unmount()
  })

  it('ignores a pending mutation when the signed-in account changes', async () => {
    let finish!: () => void
    mocks.remove.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finish = resolve
      }),
    )
    const wrapper = await mountView()
    await flushPromises()
    await wrapper.get('button').trigger('click')
    mocks.list.mockResolvedValueOnce([checkoutCourseFixture({ id: 9, name: 'Bob course' })])
    user.value = { id: 'bob' }
    await flushPromises()
    finish()
    await flushPromises()
    expect(wrapper.text()).toContain('Bob course')
    wrapper.unmount()
  })
})

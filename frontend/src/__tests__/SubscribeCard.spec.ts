import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SubscribeCard from '@/components/course/SubscribeCard.vue'
import type { CheckoutCourse } from '@/api/payments'

const mocks = vi.hoisted(() => ({
  getCheckoutCourses: vi.fn<() => Promise<CheckoutCourse[]>>(),
}))
vi.mock('@/api/payments', () => mocks)

async function mountCard() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/payment', name: 'payment', component: { template: '<div>Payment</div>' } },
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
  beforeEach(() => mocks.getCheckoutCourses.mockReset())

  it('uses the backend course ID and price for checkout', async () => {
    mocks.getCheckoutCourses.mockResolvedValue([
      { id: 1, name: 'Service Design Essentials', price: 3559 },
      { id: 9, name: 'Software Developer', price: 3559 },
    ])
    const { wrapper, router } = await mountCard()

    expect(wrapper.text()).toContain('THB 3,559.00')
    await wrapper.get('button:last-of-type').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/payment?courseId=9')
    wrapper.unmount()
  })

  it('blocks checkout when the course is absent from the catalog', async () => {
    mocks.getCheckoutCourses.mockResolvedValue([])
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

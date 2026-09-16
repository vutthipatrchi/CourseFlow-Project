import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import PromoCodeView from '../views/admin/PromoCodeView.vue'

async function mountAndLoad() {
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/admin/promo-code', component: PromoCodeView }],
  })
  router.push('/admin/promo-code')
  await router.isReady()
  const wrapper = mount(PromoCodeView, { global: { plugins: [router] } })
  await vi.advanceTimersByTimeAsync(300)
  await flushPromises()
  return wrapper
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('PromoCodeView', () => {
  it('renders every mock promo code with all columns correct', async () => {
    const wrapper = await mountAndLoad()
    expect(wrapper.findAll('tbody tr')).toHaveLength(6)

    const text = wrapper.text()
    expect(text).toContain('NEWYEAR200')
    expect(text).toContain('Fixed amount')
    expect(text).toContain('Percent')
    expect(text).toContain('1,200')
    expect(text).toContain('3,000')
    expect(text).toContain('12/02/2022 10:30PM')
  })

  it('highlights "Promo code" as the active sidebar item', async () => {
    const wrapper = await mountAndLoad()
    const activeLink = wrapper.get('a.bg-gray-100')
    expect(activeLink.text()).toContain('Promo code')
  })

  it('filters rows by the search query', async () => {
    const wrapper = await mountAndLoad()
    await wrapper.find('input[type="search"]').setValue('newyear')
    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    expect(wrapper.text()).toContain('NEWYEAR200')

    await wrapper.find('input[type="search"]').setValue('zzz-no-match')
    expect(wrapper.text()).toContain('No promo codes found.')
  })

  it('truncates a long "Courses Included" value with an ellipsis and keeps the full text as a title', async () => {
    const wrapper = await mountAndLoad()
    const longCoursesCell = wrapper
      .findAll('td')
      .find((cell) => cell.attributes('title')?.startsWith('UX Research Basics, Service Design'))

    expect(longCoursesCell).toBeTruthy()
    expect(longCoursesCell!.classes()).toContain('truncate')
    expect(longCoursesCell!.attributes('title')).toBe(
      'UX Research Basics, Service Design Essentials, Product Strategy Foundations',
    )
  })

  it('links "+ Add Promo code" and each row\'s edit icon to their full-page routes', async () => {
    const wrapper = await mountAndLoad()
    expect(wrapper.get('a.bg-blue-600').attributes('href')).toBe('/admin/promo-code/new')
    expect(wrapper.get('a[aria-label^="Edit"]').attributes('href')).toBe(
      '/admin/promo-code/promo-1/edit',
    )
  })

  it('opens a confirmation modal on delete, and only removes the row once confirmed', async () => {
    const wrapper = await mountAndLoad()

    await wrapper.get('button[aria-label^="Delete"]').trigger('click')
    expect(wrapper.text()).toContain('Are you sure you want to delete this promo code?')
    expect(wrapper.findAll('tbody tr')).toHaveLength(6)
  })

  it('"No, keep it" closes the modal without deleting', async () => {
    const wrapper = await mountAndLoad()
    await wrapper.get('button[aria-label^="Delete"]').trigger('click')

    const keepButton = wrapper.findAll('button').find((button) => button.text() === 'No, keep it')
    await keepButton!.trigger('click')

    expect(wrapper.text()).not.toContain('Are you sure you want to delete this promo code?')
    expect(wrapper.findAll('tbody tr')).toHaveLength(6)
  })

  it('"Yes, I want to delete the promo code" removes the promo code', async () => {
    const wrapper = await mountAndLoad()
    await wrapper.get('button[aria-label^="Delete"]').trigger('click')

    const confirmButton = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Yes, I want to delete the promo code')
    await confirmButton!.trigger('click')

    expect(wrapper.findAll('tbody tr')).toHaveLength(5)
    expect(wrapper.text()).not.toContain('NEWYEAR200')
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import AdminPromoCodeListView from '../views/AdminPromoCodeListView.vue'
import { deletePromoCode, listPromoCodes } from '@/api/promoCodes'
import { resetCourses } from '@/admin/courseStore'
import type { PromoCode } from '@/types/promoCode'

vi.mock('@/api/promoCodes')

function makeRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      {
        path: '/admin/promo-codes',
        name: 'admin-promo-codes',
        component: { template: '<div />' },
      },
      {
        path: '/admin/promo-codes/new',
        name: 'admin-promo-code-create',
        component: { template: '<div />' },
      },
      {
        path: '/admin/promo-codes/:id/edit',
        name: 'admin-promo-code-edit',
        component: { template: '<div />' },
      },
    ],
  })
}

const stubs = {
  AdminLayout: { template: '<div><slot name="actions" /><slot /></div>' },
}

// courseStore's real course id 1 is "Service Design Essentials" per its test fixtures.
const samplePromoCode: PromoCode = {
  id: 1,
  code: 'NEWYEAR200',
  minimumPurchase: 500,
  discountType: 'fixed',
  discountValue: 200,
  courseIds: [1],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  resetCourses()
})

describe('AdminPromoCodeListView', () => {
  it('renders promo code rows, resolving course ids to names', async () => {
    vi.mocked(listPromoCodes).mockResolvedValue([samplePromoCode])
    const router = makeRouter()
    router.push('/admin/promo-codes')
    await router.isReady()

    const wrapper = mount(AdminPromoCodeListView, { global: { plugins: [router], stubs } })
    await flushPromises()

    expect(wrapper.text()).toContain('NEWYEAR200')
    expect(wrapper.text()).toContain('500')
    expect(wrapper.text()).toContain('Fixed amount')
    expect(wrapper.text()).toContain('Service Design Essentials')
  })

  it('shows an empty state when there are no promo codes', async () => {
    vi.mocked(listPromoCodes).mockResolvedValue([])
    const router = makeRouter()
    router.push('/admin/promo-codes')
    await router.isReady()

    const wrapper = mount(AdminPromoCodeListView, { global: { plugins: [router], stubs } })
    await flushPromises()

    expect(wrapper.text()).toContain('No promo codes yet.')
  })

  it('filters rows by the search query', async () => {
    vi.mocked(listPromoCodes).mockResolvedValue([
      samplePromoCode,
      { ...samplePromoCode, id: 2, code: 'WELCOME10' },
    ])
    const router = makeRouter()
    router.push('/admin/promo-codes')
    await router.isReady()

    const wrapper = mount(AdminPromoCodeListView, { global: { plugins: [router], stubs } })
    await flushPromises()

    await wrapper.get('input[type="text"]').setValue('newyear')
    expect(wrapper.text()).toContain('NEWYEAR200')
    expect(wrapper.text()).not.toContain('WELCOME10')
  })

  it('opens a confirmation modal and only deletes once confirmed', async () => {
    vi.mocked(listPromoCodes).mockResolvedValue([samplePromoCode])
    vi.mocked(deletePromoCode).mockResolvedValue(undefined)
    const router = makeRouter()
    router.push('/admin/promo-codes')
    await router.isReady()

    const wrapper = mount(AdminPromoCodeListView, { global: { plugins: [router], stubs } })
    await flushPromises()

    await wrapper.get('button[aria-label^="Delete"]').trigger('click')
    expect(wrapper.text()).toContain('Are you sure you want to delete this promo code?')
    expect(deletePromoCode).not.toHaveBeenCalled()

    vi.mocked(listPromoCodes).mockResolvedValue([])
    const confirmButton = wrapper.findAll('button').find((button) => button.text() === 'Delete')
    await confirmButton!.trigger('click')
    await flushPromises()

    expect(deletePromoCode).toHaveBeenCalledWith(1)
    expect(wrapper.text()).toContain('No promo codes yet.')
  })

  it('closing the confirmation modal does not delete the promo code', async () => {
    vi.mocked(listPromoCodes).mockResolvedValue([samplePromoCode])
    const router = makeRouter()
    router.push('/admin/promo-codes')
    await router.isReady()

    const wrapper = mount(AdminPromoCodeListView, { global: { plugins: [router], stubs } })
    await flushPromises()

    await wrapper.get('button[aria-label^="Delete"]').trigger('click')
    await wrapper.get('button[aria-label="Close"]').trigger('click')

    expect(wrapper.text()).not.toContain('Are you sure you want to delete this promo code?')
    expect(deletePromoCode).not.toHaveBeenCalled()
  })
})

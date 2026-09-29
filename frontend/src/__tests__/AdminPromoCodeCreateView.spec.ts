import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import AdminPromoCodeCreateView from '../views/AdminPromoCodeCreateView.vue'
import { createPromoCode, getPromoCode, listPromoCodes, updatePromoCode } from '@/api/promoCodes'
import { resetCourses } from '@/admin/courseStore'
import type { PromoCode } from '@/types/promoCode'

vi.mock('@/api/promoCodes')

const existingPromoCode: PromoCode = {
  id: 5,
  code: 'NEWYEAR200',
  minimumPurchase: 500,
  discountType: 'fixed',
  discountValue: 200,
  courseIds: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  resetCourses()
  vi.mocked(listPromoCodes).mockResolvedValue([existingPromoCode])
})

async function mountView(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/admin/promo-codes',
        name: 'admin-promo-codes',
        component: { template: '<div />' },
      },
      {
        path: '/admin/promo-codes/new',
        name: 'admin-promo-code-create',
        component: AdminPromoCodeCreateView,
      },
      {
        path: '/admin/promo-codes/:id/edit',
        name: 'admin-promo-code-edit',
        component: AdminPromoCodeCreateView,
      },
    ],
  })
  await router.push(path)
  await router.isReady()

  const wrapper = mount(AdminPromoCodeCreateView, {
    global: {
      plugins: [router],
      stubs: {
        AdminLayout: {
          props: ['title'],
          template: '<div>{{ title }}<slot name="actions" /><slot /></div>',
        },
      },
    },
  })
  await flushPromises()
  return { router, wrapper }
}

function submitButton(wrapper: Awaited<ReturnType<typeof mountView>>['wrapper']) {
  return wrapper.get('button[type="submit"]')
}

describe('AdminPromoCodeCreateView', () => {
  it('keeps Create disabled until the form is valid, then creates on submit', async () => {
    vi.mocked(createPromoCode).mockResolvedValue({ ...existingPromoCode, id: 9, code: 'SAVE20' })

    const { wrapper, router } = await mountView('/admin/promo-codes/new')
    expect(wrapper.text()).toContain('Add Promo code')
    expect((submitButton(wrapper).element as HTMLButtonElement).disabled).toBe(true)

    await wrapper.get('#promo-code').setValue('SAVE20')
    await wrapper.get('#minimum-purchase').setValue('100')
    const radios = wrapper.findAll('input[type="radio"]')
    await radios[1]!.setValue(true)
    await wrapper.get('input[placeholder="Percent"]').setValue('10')
    await wrapper.vm.$nextTick()

    expect((submitButton(wrapper).element as HTMLButtonElement).disabled).toBe(false)

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(createPromoCode).toHaveBeenCalledWith({
      code: 'SAVE20',
      minimumPurchase: 100,
      discountType: 'percent',
      discountValue: 10,
      courseIds: [],
    })
    expect(updatePromoCode).not.toHaveBeenCalled()
    expect(router.currentRoute.value.name).toBe('admin-promo-codes')
  })

  it('loads and pre-fills the promo code when editing, and saves via update', async () => {
    vi.mocked(getPromoCode).mockResolvedValue(existingPromoCode)
    vi.mocked(updatePromoCode).mockResolvedValue({ ...existingPromoCode, code: 'NEWYEAR300' })

    const { wrapper, router } = await mountView('/admin/promo-codes/5/edit')

    expect(getPromoCode).toHaveBeenCalledWith(5)
    expect(wrapper.text()).toContain('Edit Promo code')
    expect((wrapper.get('#promo-code').element as HTMLInputElement).value).toBe('NEWYEAR200')
    expect((submitButton(wrapper).element as HTMLButtonElement).disabled).toBe(false)

    await wrapper.get('#promo-code').setValue('NEWYEAR300')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(updatePromoCode).toHaveBeenCalledWith(5, {
      code: 'NEWYEAR300',
      minimumPurchase: 500,
      discountType: 'fixed',
      discountValue: 200,
      courseIds: [],
    })
    expect(createPromoCode).not.toHaveBeenCalled()
    expect(router.currentRoute.value.name).toBe('admin-promo-codes')
  })

  it('does not flag the promo code being edited as a duplicate of itself', async () => {
    vi.mocked(getPromoCode).mockResolvedValue(existingPromoCode)

    const { wrapper } = await mountView('/admin/promo-codes/5/edit')

    expect((submitButton(wrapper).element as HTMLButtonElement).disabled).toBe(false)
  })
})

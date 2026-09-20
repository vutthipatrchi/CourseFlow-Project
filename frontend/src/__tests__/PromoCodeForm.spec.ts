import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PromoCodeForm from '@/components/admin/PromoCodeForm.vue'
import type { PromoCode } from '@/types/promoCode'

const courses = [
  { id: 1, name: 'Service Design Essentials' },
  { id: 2, name: 'UX Research Basics' },
]

const existingPromoCode: PromoCode = {
  id: 1,
  code: 'NEWYEAR200',
  minimumPurchase: 500,
  discountType: 'fixed',
  discountValue: 200,
  courseIds: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

function mountForm(initialValue: PromoCode | null = null) {
  return mount(PromoCodeForm, {
    props: { existingPromoCodes: [existingPromoCode], courses, initialValue },
  })
}

async function fillValidForm(wrapper: ReturnType<typeof mountForm>, code = 'SAVE20') {
  await wrapper.get('#promo-code').setValue(code)
  await wrapper.get('#minimum-purchase').setValue('100')
  const radios = wrapper.findAll('input[type="radio"]')
  await radios[1]!.setValue(true) // percent
  await wrapper.get('input[placeholder="Percent"]').setValue('10')
}

describe('PromoCodeForm', () => {
  it('blocks special characters and spaces while typing the promo code', async () => {
    const wrapper = mountForm()
    await wrapper.get('#promo-code').setValue('AB@ 12! cd')
    expect((wrapper.get('#promo-code').element as HTMLInputElement).value).toBe('AB12cd')
  })

  it('is invalid until code, minimum purchase, discount type, and its value are all filled', async () => {
    const wrapper = mountForm()
    expect(wrapper.vm.isValid).toBe(false)

    await fillValidForm(wrapper)
    expect(wrapper.vm.isValid).toBe(true)
  })

  it('clears the THB field when switching to Percent, and vice versa', async () => {
    const wrapper = mountForm()
    const radios = wrapper.findAll('input[type="radio"]')

    await radios[0]!.setValue(true) // fixed
    await wrapper.get('input[placeholder="THB"]').setValue('250')
    expect((wrapper.get('input[placeholder="THB"]').element as HTMLInputElement).value).toBe('250')

    await radios[1]!.setValue(true) // percent
    expect((wrapper.get('input[placeholder="THB"]').element as HTMLInputElement).value).toBe('')

    await wrapper.get('input[placeholder="Percent"]').setValue('20')
    await radios[0]!.setValue(true) // back to fixed
    expect((wrapper.get('input[placeholder="Percent"]').element as HTMLInputElement).value).toBe(
      '',
    )
  })

  it('clamps a percent discount above 100 back to 100 on blur', async () => {
    const wrapper = mountForm()
    const radios = wrapper.findAll('input[type="radio"]')
    await radios[1]!.setValue(true)
    await wrapper.get('input[placeholder="Percent"]').setValue('150')
    await wrapper.get('input[placeholder="Percent"]').trigger('blur')

    expect((wrapper.get('input[placeholder="Percent"]').element as HTMLInputElement).value).toBe(
      '100',
    )
  })

  it('rejects a percent discount over 100 in validation, even before blur', async () => {
    const wrapper = mountForm()
    const radios = wrapper.findAll('input[type="radio"]')
    await radios[1]!.setValue(true)
    await wrapper.get('input[placeholder="Percent"]').setValue('150')

    expect(wrapper.vm.isValid).toBe(false)
  })

  it('rejects a fixed discount that exceeds the minimum purchase amount', async () => {
    const wrapper = mountForm()
    await wrapper.get('#minimum-purchase').setValue('100')
    const radios = wrapper.findAll('input[type="radio"]')
    await radios[0]!.setValue(true)
    await wrapper.get('input[placeholder="THB"]').setValue('150')

    expect(wrapper.vm.isValid).toBe(false)
  })

  it('rejects a promo code that already exists, case-insensitively', async () => {
    const wrapper = mountForm()
    await fillValidForm(wrapper, 'newyear200')
    expect(wrapper.vm.isValid).toBe(false)
  })

  it('does not flag a promo code as a duplicate of itself when editing', async () => {
    const wrapper = mountForm(existingPromoCode)
    // hydrated from initialValue with its own code + fixed/200/500 - already valid
    expect(wrapper.vm.isValid).toBe(true)
  })

  it('pre-fills every field from initialValue, including Courses Included', () => {
    const wrapper = mountForm({ ...existingPromoCode, courseIds: [1] })
    expect((wrapper.get('#promo-code').element as HTMLInputElement).value).toBe('NEWYEAR200')
    expect((wrapper.get('#minimum-purchase').element as HTMLInputElement).value).toBe('500')
    expect((wrapper.find('input[placeholder="THB"]').element as HTMLInputElement).value).toBe(
      '200',
    )
    expect(wrapper.text()).toContain('Service Design Essentials')
  })

  it('emits submit with the built payload when valid', async () => {
    const wrapper = mountForm()
    await fillValidForm(wrapper)
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')![0]![0]).toEqual({
      code: 'SAVE20',
      minimumPurchase: 100,
      discountType: 'percent',
      discountValue: 10,
      courseIds: [],
    })
  })

  it('does not emit submit while invalid, and shows the relevant errors', async () => {
    const wrapper = mountForm()
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.text()).toContain('Please enter a promo code.')
    expect(wrapper.text()).toContain('Please enter a minimum purchase amount.')
    expect(wrapper.text()).toContain('Please select a discount type.')
  })
})

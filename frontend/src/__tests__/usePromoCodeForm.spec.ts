import { describe, expect, it } from 'vitest'
import { usePromoCodeForm } from '../composables/usePromoCodeForm'

function inputEventFor(value: string) {
  return { target: { value } } as unknown as Event
}

describe('usePromoCodeForm', () => {
  it('strips special characters and spaces from the promo code as it is typed', () => {
    const form = usePromoCodeForm()
    form.handleCodeInput(inputEventFor('AB@ 12! cd'))
    expect(form.code.value).toBe('AB12cd')
  })

  it('only allows digits in the minimum purchase field', () => {
    const form = usePromoCodeForm()
    form.handleMinimumPurchaseInput(inputEventFor('1,200.50abc'))
    expect(form.minimumPurchase.value).toBe('120050')
  })

  it('clears the THB field when switching to Percent, and vice versa', () => {
    const form = usePromoCodeForm()
    form.selectDiscountType('fixed')
    form.handleDiscountThbInput(inputEventFor('250'))
    expect(form.discountThb.value).toBe('250')

    form.selectDiscountType('percent')
    expect(form.discountThb.value).toBe('')

    form.handleDiscountPercentInput(inputEventFor('20'))
    expect(form.discountPercent.value).toBe('20')

    form.selectDiscountType('fixed')
    expect(form.discountPercent.value).toBe('')
  })

  it('re-selecting the already-active discount type does not clear its own value', () => {
    const form = usePromoCodeForm()
    form.selectDiscountType('fixed')
    form.handleDiscountThbInput(inputEventFor('250'))
    form.selectDiscountType('fixed')
    expect(form.discountThb.value).toBe('250')
  })

  it('clamps a percent discount above 100 back to 100 on blur', () => {
    const form = usePromoCodeForm()
    form.selectDiscountType('percent')
    form.handleDiscountPercentInput(inputEventFor('150'))
    form.handleDiscountPercentBlur()
    expect(form.discountPercent.value).toBe('100')
  })

  it('leaves a percent discount of 100 or less untouched on blur', () => {
    const form = usePromoCodeForm()
    form.selectDiscountType('percent')
    form.handleDiscountPercentInput(inputEventFor('75'))
    form.handleDiscountPercentBlur()
    expect(form.discountPercent.value).toBe('75')
  })

  it('is invalid until code, minimum purchase, discount type, and its value are all filled', () => {
    const form = usePromoCodeForm()
    expect(form.isValid.value).toBe(false)

    form.handleCodeInput(inputEventFor('NEWCODE'))
    form.handleMinimumPurchaseInput(inputEventFor('100'))
    expect(form.isValid.value).toBe(false)

    form.selectDiscountType('percent')
    expect(form.isValid.value).toBe(false)

    form.handleDiscountPercentInput(inputEventFor('10'))
    expect(form.isValid.value).toBe(true)
  })

  it('does not require Courses Included to be non-empty for validity', () => {
    const form = usePromoCodeForm()
    form.handleCodeInput(inputEventFor('NEWCODE'))
    form.handleMinimumPurchaseInput(inputEventFor('100'))
    form.selectDiscountType('fixed')
    form.handleDiscountThbInput(inputEventFor('50'))
    expect(form.courseIds.value).toEqual([])
    expect(form.isValid.value).toBe(true)
  })

  it('hydrates from an existing promo code and builds back the same payload', () => {
    const form = usePromoCodeForm()
    form.hydrate({
      id: 'promo-1',
      code: 'SAVE20',
      minimumPurchase: 500,
      discountType: 'percent',
      discountValue: 20,
      courseIds: ['course-a'],
      createdAt: '2022-01-01T00:00:00',
    })

    expect(form.code.value).toBe('SAVE20')
    expect(form.minimumPurchase.value).toBe('500')
    expect(form.discountType.value).toBe('percent')
    expect(form.discountPercent.value).toBe('20')
    expect(form.courseIds.value).toEqual(['course-a'])

    expect(form.buildPayload()).toEqual({
      code: 'SAVE20',
      minimumPurchase: 500,
      discountType: 'percent',
      discountValue: 20,
      courseIds: ['course-a'],
    })
  })
})

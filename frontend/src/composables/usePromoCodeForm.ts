import { computed, reactive, ref } from 'vue'
import type { DiscountType, PromoCode } from '@/types/promoCode'

export function usePromoCodeForm() {
  const code = ref('')
  const minimumPurchase = ref('')
  const discountType = ref<DiscountType | ''>('')
  const discountThb = ref('')
  const discountPercent = ref('')
  const courseIds = ref<string[]>([])

  const touched = reactive({
    code: false,
    minimumPurchase: false,
    discountType: false,
    discountValue: false,
  })

  function handleCodeInput(event: Event) {
    const target = event.target as HTMLInputElement
    code.value = target.value.replace(/[^a-zA-Z0-9]/g, '')
  }

  function handleMinimumPurchaseInput(event: Event) {
    const target = event.target as HTMLInputElement
    minimumPurchase.value = target.value.replace(/[^0-9]/g, '')
  }

  function handleDiscountThbInput(event: Event) {
    const target = event.target as HTMLInputElement
    discountThb.value = target.value.replace(/[^0-9]/g, '')
  }

  function handleDiscountPercentInput(event: Event) {
    const target = event.target as HTMLInputElement
    discountPercent.value = target.value.replace(/[^0-9]/g, '')
  }

  function handleDiscountPercentBlur() {
    touched.discountValue = true
    if (discountPercent.value !== '' && Number(discountPercent.value) > 100) {
      discountPercent.value = '100'
    }
  }

  function handleDiscountThbBlur() {
    touched.discountValue = true
  }

  function selectDiscountType(type: DiscountType) {
    touched.discountType = true
    if (discountType.value === type) return
    discountType.value = type
    if (type === 'fixed') {
      discountPercent.value = ''
    } else {
      discountThb.value = ''
    }
  }

  const errors = computed(() => {
    const discountValueError =
      discountType.value === 'fixed'
        ? discountThb.value === ''
          ? 'Please enter a THB discount amount.'
          : ''
        : discountType.value === 'percent'
          ? discountPercent.value === ''
            ? 'Please enter a percent discount.'
            : ''
          : ''

    return {
      code: code.value === '' ? 'Please enter a promo code.' : '',
      minimumPurchase:
        minimumPurchase.value === '' ? 'Please enter a minimum purchase amount.' : '',
      discountType: discountType.value === '' ? 'Please select a discount type.' : '',
      discountValue: discountValueError,
    }
  })

  const isValid = computed(() => Object.values(errors.value).every((message) => !message))

  function hydrate(promoCode: PromoCode) {
    code.value = promoCode.code
    minimumPurchase.value = String(promoCode.minimumPurchase)
    discountType.value = promoCode.discountType
    if (promoCode.discountType === 'fixed') {
      discountThb.value = String(promoCode.discountValue)
    } else {
      discountPercent.value = String(promoCode.discountValue)
    }
    courseIds.value = promoCode.courseIds
  }

  function buildPayload(): Pick<
    PromoCode,
    'code' | 'minimumPurchase' | 'discountType' | 'discountValue' | 'courseIds'
  > {
    const type = discountType.value as DiscountType
    return {
      code: code.value,
      minimumPurchase: Number(minimumPurchase.value),
      discountType: type,
      discountValue: Number(type === 'fixed' ? discountThb.value : discountPercent.value),
      courseIds: courseIds.value,
    }
  }

  return {
    code,
    minimumPurchase,
    discountType,
    discountThb,
    discountPercent,
    courseIds,
    touched,
    errors,
    isValid,
    handleCodeInput,
    handleMinimumPurchaseInput,
    handleDiscountThbInput,
    handleDiscountPercentInput,
    handleDiscountPercentBlur,
    handleDiscountThbBlur,
    selectDiscountType,
    hydrate,
    buildPayload,
  }
}

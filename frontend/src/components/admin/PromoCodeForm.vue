<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import CoursesIncludedSelect from './CoursesIncludedSelect.vue'
import type { DiscountType, PromoCode, PromoCodePayload } from '@/types/promoCode'

const props = defineProps<{
  existingPromoCodes: PromoCode[]
  courses: { id: number; name: string }[]
  fieldErrors?: Record<string, string>
  initialValue?: PromoCode | null
}>()

const emit = defineEmits<{
  submit: [payload: PromoCodePayload]
}>()

const code = ref('')
const minimumPurchase = ref('')
const discountType = ref<DiscountType | ''>('')
const discountThb = ref('')
const discountPercent = ref('')
const courseIds = ref<number[]>([])

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

function isCodeTaken(candidate: string): boolean {
  const normalized = candidate.trim().toUpperCase()
  return props.existingPromoCodes.some(
    (promo) => promo.id !== props.initialValue?.id && promo.code.toUpperCase() === normalized,
  )
}

const errors = computed(() => {
  let discountValueError = ''
  if (discountType.value === 'fixed') {
    if (discountThb.value === '') {
      discountValueError = 'Please enter a THB discount amount.'
    } else if (Number(discountThb.value) <= 0) {
      discountValueError = 'Discount amount must be greater than 0.'
    } else if (
      minimumPurchase.value !== '' &&
      Number(discountThb.value) > Number(minimumPurchase.value)
    ) {
      discountValueError = 'Discount amount cannot exceed the minimum purchase amount.'
    }
  } else if (discountType.value === 'percent') {
    if (discountPercent.value === '') {
      discountValueError = 'Please enter a percent discount.'
    } else if (Number(discountPercent.value) <= 0) {
      discountValueError = 'Percent discount must be greater than 0.'
    } else if (Number(discountPercent.value) > 100) {
      discountValueError = 'Percent discount cannot exceed 100.'
    }
  }

  return {
    code:
      code.value === ''
        ? 'Please enter a promo code.'
        : isCodeTaken(code.value)
          ? 'This promo code already exists.'
          : '',
    minimumPurchase:
      minimumPurchase.value === ''
        ? 'Please enter a minimum purchase amount.'
        : Number(minimumPurchase.value) < 0
          ? 'Minimum purchase amount must not be negative.'
          : '',
    discountType: discountType.value === '' ? 'Please select a discount type.' : '',
    discountValue: discountValueError,
  }
})

const isValid = computed(() => Object.values(errors.value).every((message) => !message))

watch(
  () => props.initialValue,
  (initial) => {
    if (!initial) return
    code.value = initial.code
    minimumPurchase.value = String(initial.minimumPurchase)
    discountType.value = initial.discountType
    if (initial.discountType === 'fixed') {
      discountThb.value = String(initial.discountValue)
    } else {
      discountPercent.value = String(initial.discountValue)
    }
    courseIds.value = initial.courseIds
  },
  { immediate: true },
)

function handleSubmit() {
  touched.code = true
  touched.minimumPurchase = true
  touched.discountType = true
  touched.discountValue = true
  if (!isValid.value) return

  const type = discountType.value as DiscountType
  emit('submit', {
    code: code.value,
    minimumPurchase: Number(minimumPurchase.value),
    discountType: type,
    discountValue: Number(type === 'fixed' ? discountThb.value : discountPercent.value),
    courseIds: courseIds.value,
  })
}

defineExpose({ isValid })
</script>

<template>
  <form id="promo-code-form" class="mx-auto max-w-230 space-y-10" @submit.prevent="handleSubmit">
    <div class="flex flex-col gap-1">
      <label for="promo-code" class="text-base text-black">Set promo code*</label>
      <input
        id="promo-code"
        :value="code"
        type="text"
        class="h-12 rounded-lg border border-[#D6D9E4] px-3 text-base text-black"
        @input="handleCodeInput"
        @blur="touched.code = true"
      />
      <p v-if="touched.code && errors.code" class="text-sm text-red-600">{{ errors.code }}</p>
    </div>

    <div class="flex flex-col gap-1">
      <label for="minimum-purchase" class="text-base text-black">
        Minimum purchase amount (THB)*
      </label>
      <input
        id="minimum-purchase"
        :value="minimumPurchase"
        type="text"
        inputmode="numeric"
        class="h-12 rounded-lg border border-[#D6D9E4] px-3 text-base text-black"
        @input="handleMinimumPurchaseInput"
        @blur="touched.minimumPurchase = true"
      />
      <p v-if="touched.minimumPurchase && errors.minimumPurchase" class="text-sm text-red-600">
        {{ errors.minimumPurchase }}
      </p>
    </div>

    <div class="flex flex-col gap-3">
      <p class="text-base text-black">Select discount type*</p>
      <div class="flex flex-wrap items-center gap-6">
        <label class="flex items-center gap-2 text-base text-black">
          <input
            type="radio"
            name="discount-type"
            :checked="discountType === 'fixed'"
            @change="selectDiscountType('fixed')"
          />
          Discount (THB)
        </label>
        <input
          :value="discountThb"
          type="text"
          inputmode="numeric"
          placeholder="THB"
          :disabled="discountType !== 'fixed'"
          class="h-12 w-32 rounded-lg border border-[#D6D9E4] px-3 text-base text-black disabled:bg-gray-50"
          @input="handleDiscountThbInput"
          @blur="handleDiscountThbBlur"
        />

        <label class="flex items-center gap-2 text-base text-black">
          <input
            type="radio"
            name="discount-type"
            :checked="discountType === 'percent'"
            @change="selectDiscountType('percent')"
          />
          Discount (%)
        </label>
        <input
          :value="discountPercent"
          type="text"
          inputmode="numeric"
          placeholder="Percent"
          :disabled="discountType !== 'percent'"
          class="h-12 w-32 rounded-lg border border-[#D6D9E4] px-3 text-base text-black disabled:bg-gray-50"
          @input="handleDiscountPercentInput"
          @blur="handleDiscountPercentBlur"
        />
      </div>
      <p v-if="touched.discountType && errors.discountType" class="text-sm text-red-600">
        {{ errors.discountType }}
      </p>
      <p v-if="touched.discountValue && errors.discountValue" class="text-sm text-red-600">
        {{ errors.discountValue }}
      </p>
    </div>

    <div class="flex flex-col gap-1">
      <label class="text-base text-black">Courses Included</label>
      <CoursesIncludedSelect v-model="courseIds" :courses="courses" />
    </div>

    <p v-if="fieldErrors?.code" class="text-sm text-red-600">{{ fieldErrors.code }}</p>
  </form>
</template>

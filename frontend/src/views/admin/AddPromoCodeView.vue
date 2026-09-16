<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import CoursesIncludedSelect from '@/components/admin/CoursesIncludedSelect.vue'
import { fetchCourseCatalog } from '@/services/courses'
import { createPromoCode } from '@/services/promoCodes'
import { usePromoCodeForm } from '@/composables/usePromoCodeForm'
import type { CourseOption } from '@/types/course'

const router = useRouter()
const courses = ref<CourseOption[]>([])

onMounted(async () => {
  courses.value = await fetchCourseCatalog()
})

const {
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
  buildPayload,
} = usePromoCodeForm()

function handleCancel() {
  router.push('/admin/promo-code')
}

function handleCreate() {
  if (!isValid.value) return
  createPromoCode(buildPayload())
  router.push('/admin/promo-code')
}
</script>

<template>
  <AdminLayout>
    <div class="flex items-center justify-between border-b border-gray-200 pb-4">
      <h1 class="text-2xl font-bold text-gray-900">Add Promo code</h1>
      <div class="flex gap-3">
        <button
          type="button"
          class="rounded-lg border-2 border-orange-500 bg-white px-5 py-2.5 text-sm font-semibold text-orange-500 hover:bg-orange-500 hover:text-white"
          @click="handleCancel"
        >
          Cancel
        </button>
        <button
          type="button"
          :disabled="!isValid"
          class="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:bg-gray-300"
          @click="handleCreate"
        >
          Create
        </button>
      </div>
    </div>

    <div class="mt-6 rounded-xl border border-gray-200 bg-white p-6">
      <div>
        <label class="block text-sm font-medium text-gray-700" for="promo-code"
          >Set promo code*</label
        >
        <input
          id="promo-code"
          :value="code"
          type="text"
          class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          @input="handleCodeInput"
          @blur="touched.code = true"
        />
        <p v-if="touched.code && errors.code" class="mt-1 text-xs text-red-600">
          {{ errors.code }}
        </p>
      </div>

      <div class="mt-4">
        <label class="block text-sm font-medium text-gray-700" for="minimum-purchase">
          Minimum purchase amount (THB)*
        </label>
        <input
          id="minimum-purchase"
          :value="minimumPurchase"
          type="text"
          inputmode="numeric"
          class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          @input="handleMinimumPurchaseInput"
          @blur="touched.minimumPurchase = true"
        />
        <p
          v-if="touched.minimumPurchase && errors.minimumPurchase"
          class="mt-1 text-xs text-red-600"
        >
          {{ errors.minimumPurchase }}
        </p>
      </div>

      <div class="mt-4">
        <p class="block text-sm font-medium text-gray-700">Select discount type*</p>
        <div class="mt-2 flex flex-col gap-3 sm:flex-row">
          <label class="flex items-center gap-2 text-sm text-gray-700">
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
            class="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
            @input="handleDiscountThbInput"
            @blur="handleDiscountThbBlur"
          />

          <label class="flex items-center gap-2 text-sm text-gray-700">
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
            class="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
            @input="handleDiscountPercentInput"
            @blur="handleDiscountPercentBlur"
          />
        </div>
        <p v-if="touched.discountType && errors.discountType" class="mt-1 text-xs text-red-600">
          {{ errors.discountType }}
        </p>
        <p v-if="touched.discountValue && errors.discountValue" class="mt-1 text-xs text-red-600">
          {{ errors.discountValue }}
        </p>
      </div>

      <div class="mt-4">
        <label class="block text-sm font-medium text-gray-700">Courses Included</label>
        <CoursesIncludedSelect v-model="courseIds" :courses="courses" class="mt-1" />
      </div>
    </div>
  </AdminLayout>
</template>

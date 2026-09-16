<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import CoursesIncludedSelect from '@/components/admin/CoursesIncludedSelect.vue'
import DeleteConfirmationModal from '@/components/admin/DeleteConfirmationModal.vue'
import { fetchCourseCatalog } from '@/services/courses'
import { deletePromoCode, fetchPromoCodeById, updatePromoCode } from '@/services/promoCodes'
import { usePromoCodeForm } from '@/composables/usePromoCodeForm'
import type { CourseOption } from '@/types/course'
import type { PromoCode } from '@/types/promoCode'

const route = useRoute()
const router = useRouter()
const promoCodeId = route.params.id as string

const courses = ref<CourseOption[]>([])
const promoCode = ref<PromoCode | null>(null)
const isLoading = ref(true)
const isDeleteModalOpen = ref(false)

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
  hydrate,
  buildPayload,
} = usePromoCodeForm()

onMounted(async () => {
  const [catalog, found] = await Promise.all([
    fetchCourseCatalog(),
    fetchPromoCodeById(promoCodeId),
  ])
  courses.value = catalog

  if (!found) {
    router.replace('/admin/promo-code')
    return
  }

  promoCode.value = found
  hydrate(found)
  isLoading.value = false
})

function handleCancel() {
  router.push('/admin/promo-code')
}

function handleSave() {
  if (!isValid.value) return
  updatePromoCode(promoCodeId, buildPayload())
  router.push('/admin/promo-code')
}

function confirmDelete() {
  deletePromoCode(promoCodeId)
  isDeleteModalOpen.value = false
  router.push('/admin/promo-code')
}
</script>

<template>
  <AdminLayout>
    <div v-if="isLoading" class="py-8 text-center text-gray-500">Loading promo code…</div>

    <template v-else>
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="text-gray-500 hover:text-gray-700"
            aria-label="Back to Promo code"
            @click="handleCancel"
          >
            <svg viewBox="0 0 24 24" fill="none" class="h-5 w-5" aria-hidden="true">
              <path
                d="M15 18L9 12L15 6"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <div>
            <p class="text-xs text-gray-500">Promo code</p>
            <h1 class="text-lg font-bold text-gray-900">{{ promoCode?.code }}</h1>
          </div>
        </div>
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
            @click="handleSave"
          >
            Save
          </button>
        </div>
      </div>

      <div class="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <div>
          <label class="block text-sm font-medium text-gray-700" for="promo-code">
            Set promo code*
          </label>
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

      <div class="mt-4 text-right">
        <button
          type="button"
          class="text-sm font-bold text-blue-600 hover:text-blue-800"
          @click="isDeleteModalOpen = true"
        >
          Delete Promo code
        </button>
      </div>

      <DeleteConfirmationModal
        :open="isDeleteModalOpen"
        message="Are you sure you want to delete this promo code?"
        confirm-label="Yes, I want to delete the promo code"
        @cancel="isDeleteModalOpen = false"
        @confirm="confirmDelete"
      />
    </template>
  </AdminLayout>
</template>

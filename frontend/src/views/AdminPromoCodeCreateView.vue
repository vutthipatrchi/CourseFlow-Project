<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import PromoCodeForm from '@/components/admin/PromoCodeForm.vue'
import {
  createPromoCode,
  getPromoCode,
  listPromoCodes,
  updatePromoCode,
} from '@/api/promoCodes'
import { toApiError } from '@/api/client'
import { courses, loadCourses } from '@/admin/courseStore'
import type { PromoCode, PromoCodePayload } from '@/types/promoCode'

const route = useRoute()
const router = useRouter()

const promoCodeId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? Number(id) : null
})
const isEditing = computed(() => promoCodeId.value !== null)

const existingPromoCodes = ref<PromoCode[]>([])
const initialValue = ref<PromoCode | null>(null)
const loading = ref(true)
const submitting = ref(false)
const serverFieldErrors = ref<Record<string, string> | undefined>(undefined)
const serverError = ref<string | null>(null)
const formRef = ref<{ isValid: boolean } | null>(null)

const canSubmit = computed(() => !submitting.value && !loading.value && formRef.value?.isValid)

onMounted(async () => {
  try {
    const [promoCodes] = await Promise.all([
      listPromoCodes(),
      loadCourses().catch(() => undefined),
      isEditing.value
        ? getPromoCode(promoCodeId.value!).then((promoCode) => {
            initialValue.value = promoCode
          })
        : Promise.resolve(),
    ])
    existingPromoCodes.value = promoCodes
  } catch (err) {
    serverError.value = toApiError(err).message
  } finally {
    loading.value = false
  }
})

async function handleSubmit(payload: PromoCodePayload) {
  submitting.value = true
  serverError.value = null
  serverFieldErrors.value = undefined

  try {
    if (isEditing.value) {
      await updatePromoCode(promoCodeId.value!, payload)
    } else {
      await createPromoCode(payload)
    }
    router.push({ name: 'admin-promo-codes' })
  } catch (err) {
    const apiError = toApiError(err)
    serverError.value = apiError.message
    serverFieldErrors.value = apiError.fieldErrors
  } finally {
    submitting.value = false
  }
}

function handleCancel() {
  router.push({ name: 'admin-promo-codes' })
}
</script>

<template>
  <AdminLayout :title="isEditing ? 'Edit Promo code' : 'Add Promo code'">
    <template #actions>
      <button
        type="button"
        class="flex h-[60px] items-center justify-center rounded-xl border border-[#F47E20] bg-white px-8 text-base font-bold text-[#F47E20] shadow-[4px_4px_24px_rgba(0,0,0,0.08)] hover:bg-orange-50"
        @click="handleCancel"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="promo-code-form"
        :disabled="!canSubmit"
        class="flex h-[60px] items-center justify-center rounded-xl bg-[#2F5FAC] px-8 text-base font-bold text-white shadow-[4px_4px_24px_rgba(0,0,0,0.08)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {{ submitting ? 'Saving...' : isEditing ? 'Save' : 'Create' }}
      </button>
    </template>

    <div class="rounded-2xl border border-[#E6E7EB] bg-white pt-10 px-25 pb-15">
      <p v-if="serverError" class="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
        {{ serverError }}
      </p>
      <p v-if="loading" class="text-base text-[#646D89]">Loading promo code…</p>
      <PromoCodeForm
        v-else
        ref="formRef"
        :existing-promo-codes="existingPromoCodes"
        :courses="courses"
        :field-errors="serverFieldErrors"
        :initial-value="initialValue"
        @submit="handleSubmit"
      />
    </div>
  </AdminLayout>
</template>

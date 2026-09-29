<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import PromoCodeTable from '@/components/admin/PromoCodeTable.vue'
import { deletePromoCode, listPromoCodes } from '@/api/promoCodes'
import { toApiError } from '@/api/client'
import { courses, loadCourses } from '@/admin/courseStore'
import type { PromoCode } from '@/types/promoCode'

const promoCodes = ref<PromoCode[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const search = ref('')
const pendingDeletion = ref<PromoCode | null>(null)
const deleteError = ref<string | null>(null)

const filteredPromoCodes = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return promoCodes.value
  return promoCodes.value.filter((promoCode) => promoCode.code.toLowerCase().includes(term))
})

async function loadPromoCodes() {
  loading.value = true
  try {
    promoCodes.value = await listPromoCodes()
  } catch (err) {
    error.value = toApiError(err).message
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadPromoCodes(), loadCourses().catch(() => undefined)])
})

function requestDeletion(promoCode: PromoCode) {
  deleteError.value = null
  pendingDeletion.value = promoCode
}

function cancelDeletion() {
  pendingDeletion.value = null
}

async function confirmDeletion() {
  const promoCode = pendingDeletion.value
  if (!promoCode) return

  try {
    await deletePromoCode(promoCode.id)
    pendingDeletion.value = null
    await loadPromoCodes()
  } catch (err) {
    deleteError.value = toApiError(err).message
  }
}
</script>

<template>
  <AdminLayout title="Promo code">
    <template #actions>
      <div
        class="flex h-12 w-80 items-center gap-2.5 rounded-lg border border-[#CCD0D7] bg-white px-4"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          class="h-6 w-6 flex-none stroke-[#646D89]"
          stroke-width="1.5"
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="m20 20-3.8-3.8" stroke-linecap="round" />
        </svg>
        <input
          v-model="search"
          type="text"
          placeholder="Search..."
          class="w-full text-base text-[#2A2E3F] placeholder:text-[#9AA1B9] focus:outline-none"
        />
      </div>
      <RouterLink
        :to="{ name: 'admin-promo-code-create' }"
        class="flex h-[60px] items-center justify-center rounded-xl bg-[#2F5FAC] px-8 text-base font-bold text-white shadow-[4px_4px_24px_rgba(0,0,0,0.08)] hover:bg-[#274e93]"
      >
        + Add Promo code
      </RouterLink>
    </template>

    <PromoCodeTable
      :promo-codes="filteredPromoCodes"
      :courses="courses"
      :loading="loading"
      :error="error"
      @delete="requestDeletion"
    />

    <div
      v-if="pendingDeletion"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      @click.self="cancelDeletion"
    >
      <section
        class="w-full max-w-md rounded-2xl bg-white p-8"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-promo-code-title"
      >
        <div class="flex items-center justify-between">
          <h2 id="delete-promo-code-title" class="text-xl font-bold text-[#2A2E3F]">
            Confirmation
          </h2>
          <button type="button" aria-label="Close" @click="cancelDeletion">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              class="h-6 w-6 stroke-[#646D89]"
              stroke-width="1.5"
            >
              <path d="m7 7 10 10M17 7 7 17" stroke-linecap="round" />
            </svg>
          </button>
        </div>
        <hr class="my-4 border-[#D6D9E4]" />
        <p class="text-base text-[#646D89]">Are you sure you want to delete this promo code?</p>
        <p v-if="deleteError" class="mt-2 text-sm text-red-600">{{ deleteError }}</p>
        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            class="flex h-12 items-center justify-center rounded-xl border border-[#D6D9E4] px-6 text-base font-bold text-[#424C6B] hover:bg-[#F1F2F6]"
            @click="cancelDeletion"
          >
            Cancel
          </button>
          <button
            type="button"
            class="flex h-12 items-center justify-center rounded-xl bg-red-600 px-6 text-base font-bold text-white hover:bg-red-700"
            @click="confirmDeletion"
          >
            Delete
          </button>
        </div>
      </section>
    </div>
  </AdminLayout>
</template>

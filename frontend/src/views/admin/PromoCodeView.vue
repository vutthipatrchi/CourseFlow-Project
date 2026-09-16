<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import DeleteConfirmationModal from '@/components/admin/DeleteConfirmationModal.vue'
import { deletePromoCode, fetchPromoCodes } from '@/services/promoCodes'
import { fetchCourseCatalog } from '@/services/courses'
import { formatDateTime } from '@/utils/formatDateTime'
import type { PromoCode } from '@/types/promoCode'
import type { CourseOption } from '@/types/course'

const promoCodes = ref<PromoCode[]>([])
const courses = ref<CourseOption[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const deleteTarget = ref<PromoCode | null>(null)

onMounted(async () => {
  const [loadedPromoCodes, loadedCourses] = await Promise.all([
    fetchPromoCodes(),
    fetchCourseCatalog(),
  ])
  promoCodes.value = loadedPromoCodes
  courses.value = loadedCourses
  isLoading.value = false
})

function coursesIncludedLabel(courseIds: string[]): string {
  if (courseIds.length === 0) return 'All'
  return courseIds
    .map((id) => courses.value.find((course) => course.id === id)?.name ?? id)
    .join(', ')
}

const filteredPromoCodes = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return promoCodes.value
  return promoCodes.value.filter((promoCode) => promoCode.code.toLowerCase().includes(query))
})

function formatMinimumPurchase(amount: number): string {
  return new Intl.NumberFormat('en-US').format(amount)
}

function discountTypeLabel(discountType: PromoCode['discountType']): string {
  return discountType === 'percent' ? 'Percent' : 'Fixed amount'
}

function openDeleteModal(promoCode: PromoCode) {
  deleteTarget.value = promoCode
}

function closeDeleteModal() {
  deleteTarget.value = null
}

function confirmDelete() {
  if (!deleteTarget.value) return
  deletePromoCode(deleteTarget.value.id)
  promoCodes.value = promoCodes.value.filter((promoCode) => promoCode.id !== deleteTarget.value?.id)
  deleteTarget.value = null
}
</script>

<template>
  <AdminLayout>
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h1 class="text-2xl font-bold text-gray-900">Promo code</h1>

      <div class="flex w-full flex-1 flex-wrap items-center justify-end gap-4 sm:w-auto">
        <div class="relative min-w-48 flex-1 sm:max-w-xs sm:flex-none">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.5" />
            <path
              d="M21 21L16.5 16.5"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Search..."
            aria-label="Search promo codes"
            class="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-9 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <RouterLink
          to="/admin/promo-code/new"
          class="flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <span aria-hidden="true">+</span> Add Promo code
        </RouterLink>
      </div>
    </div>

    <div class="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table class="w-full min-w-max text-left text-sm">
        <thead class="bg-gray-100 text-gray-600">
          <tr>
            <th class="px-4 py-3 font-medium">Promo code</th>
            <th class="px-4 py-3 font-medium">Minimum purchase (THB)</th>
            <th class="px-4 py-3 font-medium">Discount type</th>
            <th class="px-4 py-3 font-medium">Courses Included</th>
            <th class="px-4 py-3 font-medium">Created date</th>
            <th class="px-4 py-3 font-medium">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-if="isLoading">
            <td colspan="6" class="px-4 py-8 text-center text-gray-500">Loading promo codes…</td>
          </tr>
          <tr v-else-if="filteredPromoCodes.length === 0">
            <td colspan="6" class="px-4 py-8 text-center text-gray-500">No promo codes found.</td>
          </tr>
          <tr v-for="promoCode in filteredPromoCodes" v-else :key="promoCode.id">
            <td class="px-4 py-3 font-medium text-gray-900">{{ promoCode.code }}</td>
            <td class="px-4 py-3 whitespace-nowrap">
              {{ formatMinimumPurchase(promoCode.minimumPurchase) }}
            </td>
            <td class="px-4 py-3">{{ discountTypeLabel(promoCode.discountType) }}</td>
            <td
              class="max-w-56 truncate px-4 py-3"
              :title="coursesIncludedLabel(promoCode.courseIds)"
            >
              {{ coursesIncludedLabel(promoCode.courseIds) }}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-gray-600">
              {{ formatDateTime(promoCode.createdAt) }}
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  class="text-blue-600 hover:text-blue-800"
                  :aria-label="`Delete ${promoCode.code}`"
                  @click="openDeleteModal(promoCode)"
                >
                  <svg viewBox="0 0 24 24" fill="none" class="h-4 w-4" aria-hidden="true">
                    <path
                      d="M5 7H19M10 11V16M14 11V16M6 7L7 19A2 2 0 0 0 9 21H15A2 2 0 0 0 17 19L18 7M9 7V4A1 1 0 0 1 10 3H14A1 1 0 0 1 15 4V7"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
                <RouterLink
                  :to="`/admin/promo-code/${promoCode.id}/edit`"
                  class="text-blue-600 hover:text-blue-800"
                  :aria-label="`Edit ${promoCode.code}`"
                >
                  <svg viewBox="0 0 24 24" fill="none" class="h-4 w-4" aria-hidden="true">
                    <path
                      d="M4 20L4.5 16.5L16 5C16.83 4.17 18.17 4.17 19 5C19.83 5.83 19.83 7.17 19 8L7.5 19.5L4 20Z"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linejoin="round"
                    />
                  </svg>
                </RouterLink>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <DeleteConfirmationModal
      :open="deleteTarget !== null"
      message="Are you sure you want to delete this promo code?"
      confirm-label="Yes, I want to delete the promo code"
      @cancel="closeDeleteModal"
      @confirm="confirmDelete"
    />
  </AdminLayout>
</template>

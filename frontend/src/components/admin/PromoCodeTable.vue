<script setup lang="ts">
import deleteIcon from '@/assets/admin/delete.svg'
import editIcon from '@/assets/admin/edit.svg'
import type { PromoCode } from '@/types/promoCode'

const props = defineProps<{
  promoCodes: PromoCode[]
  courses: { id: number; name: string }[]
  loading: boolean
  error: string | null
}>()

const emit = defineEmits<{
  delete: [promoCode: PromoCode]
}>()

function formatMinimumPurchase(amount: number): string {
  return new Intl.NumberFormat('en-US').format(amount)
}

function discountTypeLabel(discountType: PromoCode['discountType']): string {
  return discountType === 'percent' ? 'Percent' : 'Fixed amount'
}

function coursesIncludedLabel(courseIds: number[]): string {
  if (courseIds.length === 0) return 'All'
  return courseIds
    .map((id) => props.courses.find((course) => course.id === id)?.name ?? String(id))
    .join(', ')
}

function formatDate(value: string): string {
  const d = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  const hours = d.getHours() % 12 || 12
  const period = d.getHours() < 12 ? 'AM' : 'PM'
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(hours)}:${pad(d.getMinutes())}${period}`
}
</script>

<template>
  <div class="overflow-x-auto overflow-hidden rounded-lg bg-white">
    <table class="w-full table-fixed text-left">
      <colgroup>
        <col class="w-[18%]" />
        <col class="w-[15%]" />
        <col class="w-[15%]" />
        <col class="w-[27%]" />
        <col class="w-[15%]" />
        <col class="w-[10%]" />
      </colgroup>
      <thead class="h-[41px] bg-[#E4E6ED] text-sm text-[#424C6B]">
        <tr>
          <th class="truncate px-4 py-2.5 font-normal">Promo code</th>
          <th class="truncate px-4 py-2.5 font-normal">Minimum purchase (THB)</th>
          <th class="truncate px-4 py-2.5 font-normal">Discount type</th>
          <th class="truncate px-4 py-2.5 font-normal">Courses Included</th>
          <th class="truncate px-4 py-2.5 font-normal">Created date</th>
          <th class="px-4 py-2.5 text-center font-normal">Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td class="px-4 py-8 text-center text-[#646D89]" colspan="6">Loading promo codes…</td>
        </tr>
        <tr v-else-if="error">
          <td class="px-4 py-8 text-center text-red-600" colspan="6">{{ error }}</td>
        </tr>
        <tr v-else-if="promoCodes.length === 0">
          <td class="px-4 py-8 text-center text-[#646D89]" colspan="6">No promo codes yet.</td>
        </tr>
        <tr
          v-for="promoCode in promoCodes"
          :key="promoCode.id"
          class="border-b border-[#F1F2F6] text-base text-[#000000]"
        >
          <td class="truncate px-4 py-8">{{ promoCode.code }}</td>
          <td class="truncate px-4 py-8">{{ formatMinimumPurchase(promoCode.minimumPurchase) }}</td>
          <td class="truncate px-4 py-8">{{ discountTypeLabel(promoCode.discountType) }}</td>
          <td class="truncate px-4 py-8" :title="coursesIncludedLabel(promoCode.courseIds)">
            {{ coursesIncludedLabel(promoCode.courseIds) }}
          </td>
          <td class="truncate px-4 py-8">{{ formatDate(promoCode.createdAt) }}</td>
          <td class="px-4 py-8">
            <div class="flex items-center justify-center gap-3">
              <button
                type="button"
                :aria-label="`Delete ${promoCode.code}`"
                class="cursor-pointer"
                @click="emit('delete', promoCode)"
              >
                <img :src="deleteIcon" alt="" class="h-6 w-6" />
              </button>
              <RouterLink
                :to="{ name: 'admin-promo-code-edit', params: { id: promoCode.id } }"
                :aria-label="`Edit ${promoCode.code}`"
              >
                <img :src="editIcon" alt="" class="h-6 w-6" />
              </RouterLink>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

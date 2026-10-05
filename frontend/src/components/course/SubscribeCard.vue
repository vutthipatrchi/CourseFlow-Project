<script setup lang="ts">
// ── SubscribeCard ─────────────────────────────────────────────────────────
// Sticky price card with wishlist and checkout actions.

import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWishlist } from '@/composables/useWishlist'
import { toApiError } from '@/api/client'
import { learningPathForSubscription } from '@/lib/courseAccess'
import type { CheckoutCourse } from '@/api/payments'
import { useToast } from '@/composables/useToast'
import Spinner from '@/components/common/Spinner.vue'

type Props = {
  category: string
  title: string
  description: string
  checkoutCourse: CheckoutCourse | null
  enrolled: boolean
  subscriptionCourseId: number | null
  loadingCourse: boolean
  checkoutError: string
}

const props = defineProps<Props>()
const emit = defineEmits<{ retry: [] }>()

const router = useRouter()
const route = useRoute()
const { success, error: notifyError } = useToast()
const wishlist = useWishlist()
// ใช้ ID ของคอร์สจริงเทียบกับรายการจาก API เพื่อแสดงปุ่มเพิ่มหรือลบให้ตรงกับข้อมูลที่บันทึก
const saved = computed(() =>
  wishlist.courses.value.some((course) => course.id === props.checkoutCourse?.id),
)
const wishlistBusy = computed(() => wishlist.pending.value.has(props.checkoutCourse?.id ?? 0))
function goToPayment() {
  if (!props.checkoutCourse || props.loadingCourse || props.checkoutError) return
  router.push({ name: 'payment', query: { courseId: props.checkoutCourse.id } })
}

function goToLearning() {
  if (!props.subscriptionCourseId || props.loadingCourse || props.checkoutError) return
  router.push(learningPathForSubscription(props.subscriptionCourseId))
}

async function toggleWishlist() {
  // ผู้ที่ยังไม่ล็อกอินกลับมาหน้าคอร์สเดิมได้หลัง sign-in แล้วจึงกดบันทึกอีกครั้ง
  if (!wishlist.user.value?.id) {
    await router.push({ name: 'sign-in', query: { redirect: route.fullPath } })
    return
  }
  if (!props.checkoutCourse) return
  const shouldSave = !saved.value
  try {
    // ไม่แจ้งสำเร็จเพียงเพราะกดปุ่ม ต้องรอการบันทึกจริงและยังอยู่ในบัญชีเดิม
    if (await wishlist.setSaved(props.checkoutCourse, shouldSave)) {
      success(
        shouldSave ? 'Added to wishlist successfully!' : 'Removed from wishlist successfully!',
      )
    }
  } catch (cause) {
    notifyError(toApiError(cause).message)
  }
}
</script>

<template>
  <aside
    class="sticky top-24 flex w-full max-w-102.5 flex-col gap-10 rounded-lg bg-white p-7 shadow-[4px_4px_24px_rgba(0,0,0,0.08)]"
  >
    <p class="text-sm text-orange-500">{{ category }}</p>
    <div class="flex flex-col gap-2">
      <h3 class="text-2xl leading-tight font-medium tracking-[-0.02em] text-black">{{ title }}</h3>
      <p class="text-base text-[#646D89]">{{ description }}</p>
    </div>
    <p class="text-2xl leading-tight font-medium tracking-[-0.02em] text-[#646D89]">
      <template v-if="enrolled">Already purchased</template>
      <template v-else-if="checkoutCourse">
        THB {{ checkoutCourse.price.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
      </template>
      <template v-else-if="loadingCourse"><Spinner label="Loading price…" /></template>
      <template v-else>Price unavailable</template>
    </p>
    <p v-if="checkoutError" role="alert" class="text-sm text-red-700">
      {{ checkoutError }}
      <button type="button" class="ml-1 underline" @click="emit('retry')">Try again</button>
    </p>
    <p v-if="wishlist.error.value" role="alert" class="text-sm text-red-700">
      {{ wishlist.error.value }}
      <button type="button" class="ml-1 underline" @click="wishlist.load">Try again</button>
    </p>
    <div class="flex flex-col gap-4 border-t border-[#D6D9E4] pt-16">
      <template v-if="enrolled">
        <button
          type="button"
          :disabled="!subscriptionCourseId || loadingCourse || !!checkoutError"
          class="cursor-pointer rounded-xl bg-blue-600 px-8 py-4.5 text-base font-bold text-white shadow-[4px_4px_24px_rgba(0,0,0,0.08)] transition-all duration-200 hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          @click="goToLearning"
        >
          Start learning
        </button>
        <RouterLink
          to="/my-courses"
          class="cursor-pointer rounded-xl border border-blue-600 bg-white px-8 py-4.5 text-center text-base font-bold text-blue-600 shadow-[4px_4px_24px_rgba(0,0,0,0.08)] transition-all duration-200 hover:bg-blue-50 active:scale-95"
        >
          Go to My Courses
        </RouterLink>
      </template>
      <template v-else>
        <button
          type="button"
          class="cursor-pointer rounded-xl border border-orange-500 bg-white px-8 py-4.5 text-base font-bold text-orange-500 shadow-[4px_4px_24px_rgba(0,0,0,0.08)] transition-all duration-200 hover:bg-orange-500 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="
            !checkoutCourse ||
            loadingCourse ||
            wishlistBusy ||
            (Boolean(wishlist.user.value) && !wishlist.loaded.value)
          "
          :aria-pressed="saved"
          @click="toggleWishlist"
        >
          {{ wishlistBusy ? 'Saving…' : saved ? 'Remove from Wishlist' : 'Add to Wishlist' }}
        </button>
        <button
          type="button"
          :disabled="!checkoutCourse || loadingCourse || !!checkoutError"
          class="cursor-pointer rounded-xl bg-blue-600 px-8 py-4.5 text-base font-bold text-white shadow-[4px_4px_24px_rgba(0,0,0,0.08)] transition-all duration-200 hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          @click="goToPayment"
        >
          Subscribe This Course
        </button>
      </template>
    </div>
  </aside>
</template>

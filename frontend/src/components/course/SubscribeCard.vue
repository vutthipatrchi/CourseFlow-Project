<script setup lang="ts">
// ── SubscribeCard ─────────────────────────────────────────────────────────
// Sticky price card with wishlist and checkout actions.

import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getCheckoutCourses, type CheckoutCourse } from '@/api/payments'

type Props = {
  category: string
  title: string
  description: string
}

const props = defineProps<Props>()

const router = useRouter()
const showWishlistToast = ref(false)
const checkoutCourse = ref<CheckoutCourse | null>(null)
const loadingCourse = ref(true)
const checkoutError = ref('')

async function loadCheckoutCourse() {
  const title = props.title
  loadingCourse.value = true
  checkoutCourse.value = null
  checkoutError.value = ''
  try {
    const catalog = await getCheckoutCourses()
    if (title !== props.title) return
    checkoutCourse.value = catalog.find((course) => course.name === title) ?? null
    if (!checkoutCourse.value)
      checkoutError.value = 'This course is not available for checkout yet.'
  } catch {
    if (title === props.title)
      checkoutError.value = 'Unable to load the course price. Please try again.'
  } finally {
    if (title === props.title) loadingCourse.value = false
  }
}

watch(() => props.title, loadCheckoutCourse, { immediate: true })

function goToPayment() {
  if (!checkoutCourse.value) return
  router.push({ name: 'payment', query: { courseId: checkoutCourse.value.id } })
}

const addToWishlist = () => {
  showWishlistToast.value = true
  setTimeout(() => {
    showWishlistToast.value = false
  }, 2500)
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
      <template v-if="checkoutCourse">
        THB {{ checkoutCourse.price.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
      </template>
      <template v-else>{{ loadingCourse ? 'Loading price…' : 'Price unavailable' }}</template>
    </p>
    <p v-if="checkoutError" role="alert" class="text-sm text-red-700">
      {{ checkoutError }}
      <button type="button" class="ml-1 underline" @click="loadCheckoutCourse">Try again</button>
    </p>
    <div class="flex flex-col gap-4 border-t border-[#D6D9E4] pt-16">
      <button
        type="button"
        class="cursor-pointer rounded-xl border border-orange-500 bg-white px-8 py-4.5 text-base font-bold text-orange-500 shadow-[4px_4px_24px_rgba(0,0,0,0.08)] transition-all duration-200 hover:bg-orange-500 hover:text-white active:scale-95"
        @click="addToWishlist"
      >
        Add to Wishlist
      </button>
      <button
        type="button"
        :disabled="!checkoutCourse || loadingCourse"
        class="cursor-pointer rounded-xl bg-blue-600 px-8 py-4.5 text-base font-bold text-white shadow-[4px_4px_24px_rgba(0,0,0,0.08)] transition-all duration-200 hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        @click="goToPayment"
      >
        Subscribe This Course
      </button>
    </div>
  </aside>

  <Transition
    enter-active-class="transition-opacity duration-300"
    leave-active-class="transition-opacity duration-300"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="showWishlistToast"
      class="fixed bottom-8 left-1/2 -translate-x-1/2 rounded-lg bg-utility-green px-6 py-3 text-sm font-semibold text-white shadow-lg"
    >
      Added to wishlist successfully!
    </div>
  </Transition>
</template>

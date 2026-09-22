<script setup lang="ts">
// ── SubscribeCard ─────────────────────────────────────────────────────────
// Sticky price card with wishlist/subscribe actions, redirects to sign-in
// แก้ไขได้: price format, button labels, redirect target

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Course } from '@/types/course'

type Props = {
  category: string
  title: string
  description: string
  price: Course['price']
}

defineProps<Props>()

const router = useRouter()
const showWishlistToast = ref(false)

const goToSignIn = () => {
  router.push('/sign-in')
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
      THB {{ price.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
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
        class="cursor-pointer rounded-xl bg-blue-600 px-8 py-4.5 text-base font-bold text-white shadow-[4px_4px_24px_rgba(0,0,0,0.08)] transition-all duration-200 hover:bg-blue-700 active:scale-95"
        @click="goToSignIn"
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

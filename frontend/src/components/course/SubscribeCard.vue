<script setup lang="ts">
// ── SubscribeCard ─────────────────────────────────────────────────────────
// Sticky price card with wishlist/subscribe actions, redirects to sign-in
// แก้ไขได้: price format, button labels, redirect target

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

const goToSignIn = () => {
  router.push('/sign-in')
}
</script>

<template>
  <aside
    class="sticky top-24 flex w-full max-w-89.25 flex-col gap-6 rounded-lg bg-white p-6 shadow-[4px_4px_24px_rgba(0,0,0,0.08)]"
  >
    <p class="text-sm text-orange-500">{{ category }}</p>
    <div class="flex flex-col gap-2">
      <h3 class="text-2xl leading-tight font-medium tracking-[-0.02em] text-black">{{ title }}</h3>
      <p class="text-base text-[#646D89]">{{ description }}</p>
    </div>
    <p class="text-2xl leading-tight font-medium tracking-[-0.02em] text-[#646D89]">
      THB {{ price.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
    </p>
    <div class="flex flex-col gap-4 border-t border-[#D6D9E4] pt-10">
      <button
        type="button"
        class="rounded-xl border border-orange-500 bg-white px-8 py-4.5 text-base font-bold text-orange-500 shadow-[4px_4px_24px_rgba(0,0,0,0.08)] hover:bg-orange-500 hover:text-white"
        @click="goToSignIn"
      >
        Add to Wishlist
      </button>
      <button
        type="button"
        class="rounded-xl bg-blue-600 px-8 py-4.5 text-base font-bold text-white shadow-[4px_4px_24px_rgba(0,0,0,0.08)] hover:bg-blue-700"
        @click="goToSignIn"
      >
        Subscribe This Course
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ courseId: number }>()

const coursePath = computed(() => `/courses/course-${props.courseId}`)
const learningPath = computed(() => `${coursePath.value}/learn/sub-1-1`)
</script>

<template>
  <section
    class="w-full max-w-[740px] rounded-lg bg-white px-5 py-12 text-center shadow-[4px_4px_24px_rgba(0,0,0,0.12)] sm:px-10"
  >
    <div
      class="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#32AE8B] text-white"
      aria-hidden="true"
    >
      <svg class="h-9 w-9" viewBox="0 0 36 36" fill="none">
        <path
          d="M9.5 18.5 15.5 25 27 10.5"
          stroke="currentColor"
          stroke-width="5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>

    <h1 class="mt-8 text-2xl leading-tight font-medium text-black">Thank you for subscribing.</h1>
    <p class="mt-2 text-base text-[#646D89]">
      Your payment is complete. You can start learning the course now.
    </p>

    <div class="mt-12 grid gap-4 sm:grid-cols-2">
      <RouterLink
        :to="coursePath"
        class="flex min-h-[60px] items-center justify-center rounded-xl border border-orange-500 px-6 py-4 text-base font-bold text-orange-500 transition-colors hover:bg-orange-500 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
      >
        View Course detail
      </RouterLink>
      <RouterLink
        :to="learningPath"
        class="flex min-h-[60px] items-center justify-center rounded-xl bg-blue-600 px-6 py-4 text-base font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        Start Learning
      </RouterLink>
    </div>
  </section>
</template>

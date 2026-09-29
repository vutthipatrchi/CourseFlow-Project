<script setup lang="ts">
defineProps<{ courseId: number }>()
</script>

<template>
  <section
    class="w-full max-w-[740px] rounded-lg bg-white px-5 py-12 text-center shadow-[4px_4px_24px_rgba(0,0,0,0.12)] sm:px-10"
  >
    <div
      class="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#A52CBD] text-white"
      aria-hidden="true"
    >
      <svg class="h-9 w-9" viewBox="0 0 36 36" fill="none">
        <path
          d="m10.5 10.5 15 15m0-15-15 15"
          stroke="currentColor"
          stroke-width="4"
          stroke-linecap="round"
        />
      </svg>
    </div>

    <h1 class="mt-8 text-2xl leading-tight font-medium text-black">Payment failed.</h1>
    <p class="mt-2 text-base text-[#646D89]">Please check your payment details and try again</p>

    <RouterLink
      :to="{ name: 'payment', query: { courseId } }"
      class="mx-auto mt-12 flex min-h-[60px] w-full max-w-[322px] items-center justify-center rounded-xl bg-blue-600 px-6 py-4 text-base font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      Back to Payment
    </RouterLink>
  </section>
</template>

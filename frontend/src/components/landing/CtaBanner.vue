<script setup lang="ts">
import ctaIllustration from '@/assets/landing/cta-illustration.svg'
import dotSmall from '@/assets/landing/dot-small.svg'
</script>

<template>
  <section class="relative overflow-hidden bg-blue-600">
    <img :src="dotSmall" alt="" aria-hidden="true" class="absolute left-8 top-8 h-6 w-6" />
    <span class="absolute right-10 bottom-10 hidden text-blue-300 sm:block">
      <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none">
        <path d="M2 4L22 12L2 20V4Z" stroke="currentColor" stroke-width="1.5" />
      </svg>
    </span>
    <span class="absolute right-24 top-10 h-4 w-4 rounded-full border-2 border-blue-300/70"></span>

    <div class="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 md:grid-cols-2">
      <div>
        <h2 class="text-2xl font-bold text-white md:text-3xl">Want to start learning?</h2>
        <button
          type="button"
          class="mt-6 rounded-lg border-2 border-white px-7 py-3 text-sm font-semibold text-white hover:bg-white hover:text-blue-600"
        >
          Register here
        </button>
      </div>

      <div class="flex justify-center md:justify-end">
        <img :src="ctaIllustration" alt="Tutor and student learning online" class="w-72 md:w-80" />
      </div>
    </div>
  </section>
</template>

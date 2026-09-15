<script setup lang="ts"></script>

<template>
  <section class="relative overflow-hidden bg-blue-600">
    <span class="absolute left-8 top-8 h-6 w-6 rounded-full bg-blue-500/60"></span>
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
        <svg viewBox="0 0 320 200" class="w-72 md:w-80">
          <rect x="130" y="20" width="140" height="90" rx="6" class="fill-white" />
          <rect x="140" y="30" width="120" height="70" rx="4" class="fill-blue-800" />
          <rect x="185" y="110" width="30" height="10" class="fill-blue-900" />
          <rect x="60" y="130" width="60" height="40" rx="4" class="fill-orange-500" />
          <circle cx="90" cy="115" r="14" class="fill-blue-900" />
          <rect x="220" y="120" width="60" height="50" rx="4" class="fill-blue-900" />
          <circle cx="250" cy="105" r="14" class="fill-blue-900" />
        </svg>
      </div>
    </div>
  </section>
</template>

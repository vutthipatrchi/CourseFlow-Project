<script setup lang="ts"></script>

<template>
  <section class="relative overflow-hidden bg-blue-100">
    <!-- diagonal accent shape (desktop only; mobile stacks to a single column so the
         diagonal would otherwise cut across the text) -->
    <svg
      class="pointer-events-none absolute inset-0 hidden h-full w-full md:block"
      preserveAspectRatio="none"
      viewBox="0 0 1440 560"
      fill="none"
    >
      <path d="M900 0H1440V560H620L900 0Z" class="fill-blue-600" />
    </svg>

    <!-- decorative shapes -->
    <span class="absolute left-10 top-10 h-10 w-10 rounded-full border-4 border-blue-300/60"></span>
    <span class="absolute left-24 bottom-16 h-16 w-16 rounded-full bg-blue-500/90"></span>
    <span class="absolute right-[8%] top-16 hidden text-2xl text-blue-200 select-none md:block">+</span>
    <svg
      class="absolute bottom-16 right-[10%] hidden h-6 w-6 text-blue-300/70 md:block"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path d="M2 20L12 4L22 20H2Z" stroke="currentColor" stroke-width="1.5" />
    </svg>

    <div class="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-20 md:grid-cols-2 md:py-28">
      <div>
        <h1 class="text-4xl font-bold leading-tight text-gray-900 md:text-5xl">
          Best Virtual<br />
          Classroom Software
        </h1>
        <p class="mt-5 max-w-sm text-gray-600">
          Welcome to Schooler! The one-stop online class management system that caters to all your
          educational needs!
        </p>
        <button
          type="button"
          class="mt-8 rounded-lg bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700"
        >
          Explore Courses
        </button>
      </div>

      <div class="relative flex justify-center md:justify-end">
        <svg viewBox="0 0 320 260" class="w-72 drop-shadow-xl md:w-80">
          <rect x="20" y="150" width="180" height="18" rx="4" class="fill-blue-800" />
          <rect x="20" y="130" width="180" height="18" rx="4" class="fill-blue-500" />
          <rect x="20" y="110" width="180" height="18" rx="4" class="fill-white" stroke="#c7dbf5" />
          <rect x="70" y="20" width="150" height="100" rx="8" class="fill-gray-900" />
          <rect x="80" y="30" width="130" height="80" rx="4" class="fill-orange-500" />
          <path d="M120 30 145 15 170 30" fill="none" stroke="#1d2029" stroke-width="4" stroke-linecap="round" />
          <rect x="150" y="60" width="70" height="90" rx="4" class="fill-white" stroke="#d3d7de" />
          <rect x="160" y="72" width="50" height="6" rx="3" class="fill-blue-300" />
          <rect x="160" y="86" width="50" height="6" rx="3" class="fill-gray-200" />
          <rect x="160" y="100" width="30" height="6" rx="3" class="fill-gray-200" />
        </svg>
      </div>
    </div>
  </section>
</template>

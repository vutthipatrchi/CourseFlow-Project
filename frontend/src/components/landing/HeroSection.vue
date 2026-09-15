<script setup lang="ts">
import heroShape from '@/assets/landing/hero-shape.svg'
import heroRing from '@/assets/landing/hero-ring.svg'
import heroDot from '@/assets/landing/hero-dot.svg'
import heroCross from '@/assets/landing/hero-cross.svg'
import heroTriangle from '@/assets/landing/hero-triangle.svg'
import heroIllustration from '@/assets/landing/hero-illustration.svg'
</script>

<template>
  <section class="relative overflow-hidden bg-blue-100">
    <!-- diagonal wave background (desktop only; mobile stacks to a single column so the
         wave would otherwise cut across the text) -->
    <img
      :src="heroShape"
      alt=""
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 hidden h-full w-full object-cover object-right md:block"
    />

    <!-- decorative shapes -->
    <img :src="heroRing" alt="" aria-hidden="true" class="absolute left-10 top-10 h-8 w-8" />
    <img :src="heroDot" alt="" aria-hidden="true" class="absolute left-20 bottom-14 h-12 w-16" />
    <img
      :src="heroCross"
      alt=""
      aria-hidden="true"
      class="absolute right-[8%] top-16 hidden h-5 w-5 md:block"
    />
    <img
      :src="heroTriangle"
      alt=""
      aria-hidden="true"
      class="absolute bottom-16 right-[10%] hidden h-8 w-8 md:block"
    />

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
        <img :src="heroIllustration" alt="Online classroom illustration" class="w-80 drop-shadow-xl md:w-105" />
      </div>
    </div>
  </section>
</template>

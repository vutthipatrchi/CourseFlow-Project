<script setup lang="ts">
import heroShape from '@/assets/landing/hero-shape.svg'
import heroRing from '@/assets/landing/hero-ring.svg'
import heroDot from '@/assets/landing/hero-dot.svg'
import heroCross from '@/assets/landing/hero-cross.svg'
import heroTriangle from '@/assets/landing/hero-triangle.svg'
import dotRingGreen from '@/assets/landing/dot-ring-green.svg'
import heroIllustration from '@/assets/landing/hero-illustration.svg'
</script>

<template>
  <!-- Wrapper is not clipped, so heroDot (below) can bleed past the section's bottom edge
       into the next section, matching how it was cropped in the original design export. -->
  <div class="relative">
    <section class="relative overflow-hidden bg-blue-100">
      <!-- diagonal wave background (desktop only; mobile stacks to a single column so the
           wave would otherwise cut across the text) -->
      <img
        :src="heroShape"
        alt=""
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 hidden h-full w-full object-cover object-right md:block"
      />

      <!-- decorative shapes: positions/sizes measured directly off a 1440px-wide reference
           export of the design (percentages for left/right so they track viewport width,
           fixed px for top since the section's height doesn't scale the same way) -->
      <span
        class="absolute -left-[35px] top-[76px] h-[104px] w-[104px] rounded-full bg-blue-200"
      ></span>
      <img
        :src="heroRing"
        alt=""
        aria-hidden="true"
        class="absolute left-[41%] top-[543px] h-[27px] w-[27px]"
      />
      <img
        :src="heroCross"
        alt=""
        aria-hidden="true"
        class="absolute left-[56%] top-[159px] hidden h-[22px] w-[22px] md:block"
      />
      <img
        :src="dotRingGreen"
        alt=""
        aria-hidden="true"
        class="absolute left-[96%] top-[413px] hidden h-[18px] w-[18px] md:block"
      />
      <img
        :src="heroTriangle"
        alt=""
        aria-hidden="true"
        class="absolute left-[87%] top-[582px] hidden h-[35px] w-[35px] md:block"
      />

      <div
        class="relative mx-auto flex max-w-6xl flex-col items-center gap-10 px-6 py-20 md:flex-row md:items-center md:justify-between md:py-[124px]"
      >
        <div>
          <h1 class="text-4xl font-bold leading-tight text-gray-900 md:text-5xl">
            Best Virtual<br />
            Classroom Software
          </h1>
          <p class="mt-11 max-w-xl text-gray-600">
            Welcome to Schooler! The one-stop online class management system that caters to all your
            educational needs!
          </p>
          <button
            type="button"
            class="mt-16 rounded-lg bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700"
          >
            Explore Courses
          </button>
        </div>

        <div class="relative flex justify-center md:justify-end">
          <img
            :src="heroIllustration"
            alt="Online classroom illustration"
            class="w-80 drop-shadow-xl md:w-[455px]"
          />
        </div>
      </div>
    </section>

    <img
      :src="heroDot"
      alt=""
      aria-hidden="true"
      class="pointer-events-none absolute left-[10%] top-full h-[47px] w-[73px] -translate-y-px"
    />
  </div>
</template>

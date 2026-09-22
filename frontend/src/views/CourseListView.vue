<script setup lang="ts">
// ── CourseListView ────────────────────────────────────────────────────────
// Guest-facing page listing all available courses in a grid
// แก้ไขได้: heading text, search placeholder, grid columns, course data source

import AppNavbar from '@/components/landing/AppNavbar.vue'
import AppFooter from '@/components/landing/AppFooter.vue'
import CtaBanner from '@/components/landing/CtaBanner.vue'
import CourseCard from '@/components/course/CourseCard.vue'
import { courses } from '@/data/courses'
</script>

<template>
  <div>
    <AppNavbar />
    <main class="flex flex-col items-center">
      <section
        class="relative flex w-full flex-col items-center gap-15 overflow-hidden px-40 pt-12 pb-16"
      >
        <span
          class="absolute top-2 left-24 hidden h-2.5 w-2.5 rounded-full border-[3px] border-blue-600 md:block"
        ></span>
        <span
          class="absolute top-16 right-20 hidden h-18 w-18 rounded-full bg-[#C6DCFF] md:block"
        ></span>
        <span
          class="absolute top-32 left-10 hidden h-6.5 w-6.5 rounded-full bg-[#C6DCFF] md:block"
        ></span>
        <svg
          class="absolute top-6 right-44 hidden h-12.5 w-12.5 rotate-51 text-orange-400 md:block"
          viewBox="0 0 51 51"
          fill="none"
        >
          <path d="M25.5 3L48 45H3L25.5 3Z" stroke="currentColor" stroke-width="3" />
        </svg>
        <svg
          class="absolute bottom-4 left-56 hidden h-3.5 w-3.5 text-utility-green md:block"
          viewBox="0 0 14 14"
          fill="none"
        >
          <path
            d="M2 2L12 12M12 2L2 12"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
        <h1 class="text-4xl leading-tight font-medium tracking-[-0.02em] text-black">
          Our Courses
        </h1>
        <div
          class="flex w-full max-w-89.25 items-center gap-2.5 rounded-lg border border-[#CCD0D7] bg-white px-4 py-3"
        >
          <svg class="h-6 w-6 text-[#646D89]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
            />
          </svg>
          <span class="text-base text-[#9AA1B9]">Search...</span>
        </div>
      </section>
      <section class="mx-auto grid max-w-279.75 grid-cols-3 gap-x-6 gap-y-15 pb-20">
        <CourseCard
          v-for="course in courses"
          :key="course.id"
          :id="course.id"
          :category="course.category"
          :title="course.title"
          :description="course.description"
          :image-url="course.imageUrl"
          :lesson-count="course.lessonCount"
          :hour-count="course.hourCount"
        />
      </section>
    </main>
    <CtaBanner />
    <AppFooter />
  </div>
</template>

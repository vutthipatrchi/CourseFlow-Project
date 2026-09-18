<script setup lang="ts">
// ── CourseListView ────────────────────────────────────────────────────────
// Guest-facing page listing all available courses in a grid
// แก้ไขได้: heading text, search placeholder, grid columns, course data source

import AppNavbar from '@/components/landing/AppNavbar.vue'
import AppFooter from '@/components/landing/AppFooter.vue'
import CourseCard from '@/components/course/CourseCard.vue'
import { courses } from '@/data/courses'
</script>

<template>
  <div>
    <AppNavbar />
    <main class="flex flex-col items-center">
      <section class="flex w-full flex-col items-center gap-15 px-40 pt-12 pb-16">
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
      <section class="grid w-full grid-cols-3 gap-6 px-40 pb-20">
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
    <AppFooter />
  </div>
</template>

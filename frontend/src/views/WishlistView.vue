<script setup lang="ts">
// ── WishlistView ──────────────────────────────────────────────────────────
// User-facing page listing the courses they've added to their wishlist
// แก้ไขได้: heading text, empty-state copy, grid columns, wishlist data source
// หมายเหตุ: ไม่มี Figma spec ให้ - ออกแบบเองตาม pattern เดียวกับ CourseListView

import AppNavbar from '@/components/landing/AppNavbar.vue'
import AppFooter from '@/components/landing/AppFooter.vue'
import CourseCard from '@/components/course/CourseCard.vue'
import { wishlistCourses } from '@/data/wishlist'
</script>

<template>
  <div>
    <AppNavbar />
    <main class="flex flex-col items-center">
      <section
        class="relative flex w-full flex-col items-center gap-6 overflow-hidden px-40 pt-12 pb-16"
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
          My Wishlist
        </h1>
      </section>
      <section
        v-if="wishlistCourses.length > 0"
        class="mx-auto grid max-w-289.5 grid-cols-3 gap-x-6 gap-y-15 pb-20"
      >
        <CourseCard
          v-for="course in wishlistCourses"
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
      <p v-else class="pb-20 text-base text-[#646D89]">No courses in your wishlist yet.</p>
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
// ── WishlistView ──────────────────────────────────────────────────────────
// User-facing page listing the courses they've added to their wishlist
// แก้ไขได้: heading text, empty-state copy, grid columns, wishlist data source
// หมายเหตุ: ไม่มี Figma spec ให้ - ออกแบบเองตาม pattern เดียวกับ CourseListView

import AppNavbar from '@/components/landing/AppNavbar.vue'
import AppFooter from '@/components/landing/AppFooter.vue'
import CourseCard from '@/components/course/CourseCard.vue'
import { computed } from 'vue'
import { useWishlist } from '@/composables/useWishlist'
import { toStorefrontCourse, catalogCourseId } from '@/lib/catalogCourses'
import { toApiError } from '@/api/client'
import { useToast } from '@/composables/useToast'
import Spinner from '@/components/common/Spinner.vue'

const { courses, loading, error, pending, load, setSaved } = useWishlist()
// แปลงข้อมูลคอร์สจาก API เป็นรูปแบบของ CourseCard โดยใช้ mapper เดียวกับหน้ารายการคอร์ส
const wishlistCourses = computed(() => courses.value.map(toStorefrontCourse))
const { success, error: notifyError } = useToast()

async function remove(courseId: string) {
  // หน้าเว็บใช้ route ID เช่น course-9 แต่ API ใช้เลข ID 9 จึงแปลงก่อนหาคอร์สที่จะลบ
  const course = courses.value.find((item) => item.id === catalogCourseId(courseId))
  if (!course) return
  try {
    if (await setSaved(course, false)) success('Removed from wishlist successfully!')
  } catch (cause) {
    notifyError(toApiError(cause).message)
  }
}
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
      <p v-if="loading" role="status" class="pb-20"><Spinner label="Loading wishlist…" /></p>
      <p v-else-if="error" role="alert" class="pb-20 text-red-700">
        {{ error }} <button type="button" class="underline" @click="load">Try again</button>
      </p>
      <section
        v-else-if="wishlistCourses.length > 0"
        class="mx-auto grid max-w-289.5 w-full grid-cols-1 px-6 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-15 pb-20"
      >
        <div v-for="course in wishlistCourses" :key="course.id">
          <CourseCard
            :id="course.id"
            :category="course.category"
            :title="course.title"
            :description="course.description"
            :image-url="course.imageUrl"
            :lesson-count="course.lessonCount"
            :hour-count="course.hourCount"
          />
          <button
            type="button"
            :disabled="pending.has(catalogCourseId(course.id) ?? 0)"
            :aria-label="`Remove ${course.title} from wishlist`"
            class="mt-4 text-orange-600 underline disabled:opacity-50"
            @click="remove(course.id)"
          >
            {{
              pending.has(catalogCourseId(course.id) ?? 0) ? 'Removing…' : 'Remove from Wishlist'
            }}
          </button>
        </div>
      </section>
      <p v-else class="pb-20 text-base text-[#646D89]">No courses in your wishlist yet.</p>
    </main>
    <AppFooter />
  </div>
</template>

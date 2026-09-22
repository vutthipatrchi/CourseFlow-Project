<script setup lang="ts">
// ── CourseDetailView ──────────────────────────────────────────────────────
// Guest-facing page showing one course's detail, modules, and subscribe card
// แก้ไขได้: back link target, module list source, image placeholder

import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppNavbar from '@/components/landing/AppNavbar.vue'
import AppFooter from '@/components/landing/AppFooter.vue'
import CtaBanner from '@/components/landing/CtaBanner.vue'
import ModuleAccordion from '@/components/course/ModuleAccordion.vue'
import SubscribeCard from '@/components/course/SubscribeCard.vue'
import { courses } from '@/data/courses'

const route = useRoute()

const course = computed(() => courses.find((item) => item.id === route.params.id))
</script>

<template>
  <div v-if="course">
    <AppNavbar />
    <div class="detail-container pr-24 pt-13">
      <RouterLink
        to="/courses"
        class="inline-flex cursor-pointer items-center gap-2 rounded-full px-2 py-1 text-base font-bold text-blue-500 transition-colors duration-200 hover:bg-blue-50 active:scale-95"
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z" />
        </svg>
        Back
      </RouterLink>
    </div>
    <main class="detail-container flex flex-col gap-6 pr-24 pt-6 pb-25 lg:flex-row lg:items-start">
      <div class="flex max-w-200 flex-1 flex-col gap-25">
        <div class="relative w-full">
          <img
            :src="course.imageUrl"
            :alt="course.title"
            class="aspect-739/460 w-full rounded-lg bg-gray-100 object-cover"
          />
          <div
            class="absolute top-1/2 left-1/2 flex h-26 w-26 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/50"
          >
            <svg class="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        <div class="flex flex-col gap-6">
          <h1 class="text-4xl leading-tight font-medium tracking-[-0.02em] text-black">
            Course Detail
          </h1>
          <p class="text-base text-[#646D89]">{{ course.longDescription }}</p>
        </div>
        <div class="flex flex-col gap-6">
          <h2 class="text-4xl leading-tight font-medium tracking-[-0.02em] text-black">
            Module Samples
          </h2>
          <div class="flex flex-col">
            <ModuleAccordion
              v-for="(module, index) in course.modules"
              :key="module.id"
              :module="module"
              :index="index"
              :default-open="index === 0"
            />
          </div>
        </div>
      </div>
      <SubscribeCard
        :category="course.category"
        :title="course.title"
        :description="course.description"
        :price="course.price"
      />
    </main>
    <CtaBanner />
    <AppFooter />
  </div>
</template>

<style scoped>
/* Tailwind's arbitrary-value parser can't handle calc() nested inside max() with
   a division operator, so this mirrors AppNavbar's mx-auto max-w-6xl centering
   as a plain padding calc instead of guessing a fixed px value. */
.detail-container {
  padding-left: max(1.5rem, calc((100vw - 72rem) / 2 + 1.5rem));
}
</style>

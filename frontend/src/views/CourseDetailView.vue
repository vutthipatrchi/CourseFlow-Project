<script setup lang="ts">
// ── CourseDetailView ──────────────────────────────────────────────────────
// Guest-facing page showing one course's detail, modules, and subscribe card
// แก้ไขได้: back link target, module list source, image placeholder

import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppNavbar from '@/components/landing/AppNavbar.vue'
import AppFooter from '@/components/landing/AppFooter.vue'
import CtaBanner from '@/components/landing/CtaBanner.vue'
import ModuleAccordion from '@/components/course/ModuleAccordion.vue'
import LessonReading from '@/components/course/LessonReading.vue'
import LessonSample from '@/components/course/LessonSample.vue'
import SubscribeCard from '@/components/course/SubscribeCard.vue'
import { courses } from '@/data/courses'
import { getPublicDemoContent } from '@/api/demoContent'
import { createDemoModules } from '@/data/demoLessons'
import type { Module } from '@/types/course'
import { DEMO_VIDEO_LABEL, DEMO_VIDEO_URL } from '@/data/demoVideo'

const route = useRoute()

const course = computed(() => courses.find((item) => item.id === route.params.id))
const previewModules = ref<Module[]>([])
const previewLoading = ref(false)
const previewError = ref('')
const sampleLesson = computed(() => previewModules.value[0]?.subLessons[0]?.demoLesson)
const videoFailed = ref(false)
let previewRequest = 0

async function loadPreview() {
  const request = ++previewRequest
  const title = course.value?.title
  previewModules.value = []
  previewError.value = ''
  if (!title) return
  previewLoading.value = true
  try {
    const rows = await getPublicDemoContent(title)
    if (request === previewRequest) previewModules.value = createDemoModules(rows)
  } catch {
    if (request === previewRequest) previewError.value = 'ไม่สามารถโหลดบทเรียนตัวอย่างได้'
  } finally {
    if (request === previewRequest) previewLoading.value = false
  }
}

watch(
  course,
  () => {
    videoFailed.value = false
    void loadPreview()
  },
  { immediate: true },
)
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
        <figure class="w-full space-y-3">
          <video
            :key="course.id"
            :src="DEMO_VIDEO_URL"
            :poster="course.imageUrl"
            :aria-label="`คลิปทดสอบสำหรับ ${course.title}`"
            controls
            playsinline
            preload="metadata"
            class="aspect-video w-full rounded-lg bg-black"
            @error="videoFailed = true"
          />
          <figcaption class="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
            {{ DEMO_VIDEO_LABEL }}
          </figcaption>
          <p v-if="videoFailed" role="alert" class="text-sm text-amber-900">
            ไม่สามารถโหลดคลิปทดสอบได้ กรุณาลองใหม่ภายหลัง
          </p>
        </figure>
        <div class="flex flex-col gap-6">
          <h1 class="text-4xl leading-tight font-medium tracking-[-0.02em] text-black">
            Course Detail
          </h1>
          <p class="text-base text-[#646D89]">{{ course.longDescription }}</p>
          <details v-if="sampleLesson" class="rounded-xl border border-[#D6D9E4] p-4">
            <summary
              class="cursor-pointer font-semibold text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              อ่านบทเรียนตัวอย่างฟรี
            </summary>
            <LessonReading class="mt-4" :lesson="sampleLesson" />
          </details>
        </div>
        <div class="flex flex-col gap-6">
          <h2 class="text-4xl leading-tight font-medium tracking-[-0.02em] text-black">
            Module Samples
          </h2>
          <p class="text-base text-[#646D89]">
            ดูหัวข้อทั้งหมด และเปิดอ่านบทเรียนตัวอย่างฟรีในหัวข้อแรก
          </p>
          <p v-if="previewLoading" role="status">กำลังโหลดบทเรียนตัวอย่าง…</p>
          <div v-else-if="previewError" role="alert">
            <p>{{ previewError }}</p>
            <button type="button" class="text-blue-600 underline" @click="loadPreview">
              ลองอีกครั้ง
            </button>
          </div>
          <p v-else-if="!previewModules.length">ยังไม่มีบทเรียนตัวอย่าง</p>
          <div class="flex flex-col">
            <ModuleAccordion
              v-for="(module, index) in previewModules"
              :key="`${course.id}-${module.id}`"
              :module="module"
              :index="index"
              :default-open="index === 0"
            >
              <template #lesson="{ subLesson }">
                <LessonSample v-if="subLesson.demoLesson" :lesson="subLesson.demoLesson" />
                <span v-else>{{ subLesson.title }}</span>
              </template>
            </ModuleAccordion>
          </div>
        </div>
      </div>
      <SubscribeCard
        :category="course.category"
        :title="course.title"
        :description="course.description"
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

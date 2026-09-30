<script setup lang="ts">
// ── CourseDetailView ──────────────────────────────────────────────────────
// Guest-facing page showing one course's detail, modules, and subscribe card

import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppNavbar from '@/components/landing/AppNavbar.vue'
import AppFooter from '@/components/landing/AppFooter.vue'
import CtaBanner from '@/components/landing/CtaBanner.vue'
import ModuleAccordion from '@/components/course/ModuleAccordion.vue'
import LessonReading from '@/components/course/LessonReading.vue'
import LessonSample from '@/components/course/LessonSample.vue'
import SubscribeCard from '@/components/course/SubscribeCard.vue'
import { getCheckoutCourse } from '@/api/payments'
import { getPublicDemoContent } from '@/api/demoContent'
import { createDemoModules } from '@/data/demoLessons'
import { catalogCourseId, toStorefrontCourse } from '@/lib/catalogCourses'
import { getCourseAccess, learningPathForSubscription } from '@/lib/courseAccess'
import { useToast } from '@/composables/useToast'
import type { Course, Module } from '@/types/course'
import { DEMO_VIDEO_LABEL, DEMO_VIDEO_URL } from '@/data/demoVideo'

const route = useRoute()
const router = useRouter()
const { error: notifyError } = useToast()

const course = ref<Course | undefined>()
const courseLoading = ref(true)
const courseError = ref('')
const previewModules = ref<Module[]>([])
const previewLoading = ref(false)
const previewError = ref('')
const sampleLesson = computed(() => previewModules.value[0]?.subLessons[0]?.demoLesson)
const videoFailed = ref(false)
const enrolled = ref(false)
const subscriptionCourseId = ref<number | null>(null)
const accessLoading = ref(false)
const accessError = ref('')
const startLearningBusy = ref(false)
let previewRequest = 0
let accessRequest = 0
let courseRequest = 0

async function loadCourse() {
  const request = ++courseRequest
  const id = catalogCourseId(route.params.id)
  courseLoading.value = true
  courseError.value = ''
  course.value = undefined
  if (!id) {
    courseError.value = 'Course not found.'
    notifyError(courseError.value)
    courseLoading.value = false
    return
  }
  try {
    const catalogCourse = await getCheckoutCourse(id)
    if (request !== courseRequest) return
    course.value = toStorefrontCourse(catalogCourse)
  } catch (error) {
    if (request !== courseRequest) return
    courseError.value = error instanceof Error ? error.message : 'Unable to load this course.'
    notifyError(courseError.value)
  } finally {
    if (request === courseRequest) courseLoading.value = false
  }
}

async function loadAccess() {
  const request = ++accessRequest
  const title = course.value?.title
  enrolled.value = false
  subscriptionCourseId.value = null
  accessError.value = ''
  if (!title) return
  accessLoading.value = true
  try {
    const access = await getCourseAccess(title)
    if (request !== accessRequest) return
    enrolled.value = access.enrolled
    subscriptionCourseId.value = access.subscriptionCourseId
  } catch {
    if (request === accessRequest) enrolled.value = false
  } finally {
    if (request === accessRequest) accessLoading.value = false
  }
}

async function startLearning() {
  if (!course.value || !enrolled.value || startLearningBusy.value) return
  if (!subscriptionCourseId.value) {
    accessError.value = 'Purchase this course before you start learning.'
    notifyError(accessError.value)
    enrolled.value = false
    return
  }
  startLearningBusy.value = true
  accessError.value = ''
  try {
    const access = await getCourseAccess(course.value.title)
    if (!access.enrolled || !access.subscriptionCourseId) {
      enrolled.value = false
      subscriptionCourseId.value = null
      accessError.value = 'Purchase this course before you start learning.'
      notifyError(accessError.value)
      return
    }
    await router.push(learningPathForSubscription(access.subscriptionCourseId))
  } catch (error) {
    accessError.value = error instanceof Error ? error.message : 'Unable to open the learning page.'
    notifyError(accessError.value)
  } finally {
    startLearningBusy.value = false
  }
}

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
    if (request === previewRequest) previewError.value = 'Unable to load the sample lesson.'
  } finally {
    if (request === previewRequest) previewLoading.value = false
  }
}

watch(
  () => route.params.id,
  () => {
    videoFailed.value = false
    void loadCourse()
  },
  { immediate: true },
)

watch(course, () => {
  videoFailed.value = false
  void loadPreview()
  void loadAccess()
})
</script>

<template>
  <div
    v-if="courseLoading"
    class="grid min-h-screen place-items-center text-[#646D89]"
    role="status"
  >
    Loading course…
  </div>
  <div v-else-if="courseError || !course" class="flex min-h-screen flex-col">
    <AppNavbar />
    <main class="detail-container flex-1 py-10">
      <p role="alert" class="text-red-700">{{ courseError || 'Course not found.' }}</p>
      <RouterLink to="/courses" class="mt-4 inline-block font-semibold text-blue-600">
        Back to Our Courses
      </RouterLink>
    </main>
    <AppFooter />
  </div>
  <div v-else>
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
            :aria-label="`Sample clip for ${course.title}`"
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
            Unable to load the sample clip. Please try again later.
          </p>
        </figure>
        <div class="flex flex-col gap-6">
          <h1 class="text-4xl leading-tight font-medium tracking-[-0.02em] text-black">
            Course Detail
          </h1>
          <p class="text-base text-[#646D89]">{{ course.longDescription }}</p>
          <button
            v-if="enrolled"
            type="button"
            :disabled="startLearningBusy || accessLoading"
            class="inline-flex w-fit cursor-pointer rounded-lg bg-[#2F5FAC] px-5 py-3 text-sm font-bold text-white hover:bg-[#254F93] disabled:cursor-not-allowed disabled:opacity-60"
            @click="startLearning"
          >
            {{ startLearningBusy ? 'Opening…' : 'Start learning' }}
          </button>
          <p v-else-if="!accessLoading" class="text-sm text-[#646D89]">
            Subscribe to this course to unlock Start learning.
          </p>
          <p v-if="accessError" role="alert" class="text-sm text-red-700">
            {{ accessError }}
          </p>
          <details v-if="sampleLesson" class="rounded-xl border border-[#D6D9E4] p-4">
            <summary
              class="cursor-pointer font-semibold text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              Read a free sample lesson
            </summary>
            <LessonReading class="mt-4" :lesson="sampleLesson" />
          </details>
        </div>
        <div class="flex flex-col gap-6">
          <h2 class="text-4xl leading-tight font-medium tracking-[-0.02em] text-black">
            Module Samples
          </h2>
          <p class="text-base text-[#646D89]">
            Browse every topic and open the free sample reading in the first one.
          </p>
          <p v-if="previewLoading" role="status">Loading sample lessons…</p>
          <div v-else-if="previewError" role="alert">
            <p>{{ previewError }}</p>
            <button type="button" class="text-blue-600 underline" @click="loadPreview">
              Try again
            </button>
          </div>
          <p v-else-if="!previewModules.length">No sample lessons yet.</p>
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
.detail-container {
  padding-left: max(1.5rem, calc((100vw - 72rem) / 2 + 1.5rem));
}
</style>

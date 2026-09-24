<script setup lang="ts">
// ── CoursePlayerView ──────────────────────────────────────────────────────
// Course learning page: sidebar progress/module tree, video + assignment, prev/next nav
// แก้ไขได้: progress bar calc, play/complete simulation, assignment submit handler

import { computed, onUnmounted, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppNavbar from '@/components/landing/AppNavbar.vue'
import AppFooter from '@/components/landing/AppFooter.vue'
import CoursePlayerSidebar from '@/components/course/CoursePlayerSidebar.vue'
import AssignmentCard from '@/components/course/AssignmentCard.vue'
import { courses } from '@/data/courses'
import {
  completeSubLesson,
  getCourseProgress,
  getSubscriptions,
  type CourseProgressView,
} from '@/api/payments'
import type { Course } from '@/types/course'

const route = useRoute()
const router = useRouter()

const course = ref<Course | undefined>()

const flatSubLessons = computed(() => {
  if (!course.value) return []
  return course.value.modules.flatMap((module) =>
    module.subLessons.map((subLesson) => ({ module, subLesson })),
  )
})

const currentIndex = computed(() =>
  flatSubLessons.value.findIndex((entry) => entry.subLesson.id === route.params.subLessonId),
)

const currentEntry = computed(() =>
  currentIndex.value >= 0 ? flatSubLessons.value[currentIndex.value] : undefined,
)

const progressPercent = ref(0)
const progressError = ref('')
const backendCourseId = computed(() => {
  const match = /^course-(\d+)$/.exec(String(route.params.id ?? ''))
  return match ? Number(match[1]) : null
})
const progressLoading = ref(true)
let progressRequest = 0

function applyProgress(progress: CourseProgressView) {
  if (!course.value) return
  const lessonPositions = [...new Set(progress.subLessons.map((item) => item.lessonPosition))]
  course.value.modules = lessonPositions.map((lessonPosition) => {
    const items = progress.subLessons.filter((item) => item.lessonPosition === lessonPosition)
    return {
      id: `module-${lessonPosition}`,
      title: items[0]?.lessonTitle ?? `Lesson ${lessonPosition}`,
      subLessons: items.map((item) => ({
        id: `sub-${item.lessonPosition}-${item.subLessonPosition}`,
        title: item.title,
        description: '',
        videoUrl: item.videoUrl ?? '',
        progress: item.completed ? ('completed' as const) : ('not-started' as const),
      })),
    }
  })
  progressPercent.value = progress.progressPercent
}

async function loadProgress() {
  const request = ++progressRequest
  const requestedCourseId = backendCourseId.value
  progressLoading.value = true
  progressError.value = ''
  course.value = undefined
  if (!requestedCourseId) {
    progressError.value = 'Invalid course link.'
    progressLoading.value = false
    return
  }
  try {
    const [subscriptions, progress] = await Promise.all([
      getSubscriptions(),
      getCourseProgress(requestedCourseId),
    ])
    if (request !== progressRequest) return
    const subscription = subscriptions.find((item) => item.courseId === requestedCourseId)
    if (!subscription) throw new Error('This course is not in your courses.')
    const preview = courses.find((item) => item.title === subscription.courseTitle)
    course.value = {
      ...(preview ?? courses[0]!),
      id: `course-${subscription.courseId}`,
      title: subscription.courseTitle,
      description: preview?.description ?? 'Continue learning through the lessons in this course.',
      modules: [],
    }
    applyProgress(progress)
    progressError.value = ''
  } catch (error) {
    if (request === progressRequest)
      progressError.value =
        error instanceof Error ? error.message : 'Unable to load course progress'
  } finally {
    if (request === progressRequest) progressLoading.value = false
  }
}

watch(backendCourseId, loadProgress, { immediate: true })

const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(
  () => currentIndex.value >= 0 && currentIndex.value < flatSubLessons.value.length - 1,
)

const showSubmitToast = ref(false)
const isLoading = ref(false)
let loadingTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => route.params.subLessonId,
  () => {
    isLoading.value = true
    clearTimeout(loadingTimer)
    loadingTimer = setTimeout(() => {
      isLoading.value = false
    }, 400)
  },
)

onUnmounted(() => clearTimeout(loadingTimer))

watchEffect(() => {
  if (progressLoading.value || !course.value || flatSubLessons.value.length === 0) return
  if (currentIndex.value === -1) {
    router.replace({
      name: 'course-player',
      params: { id: course.value.id, subLessonId: flatSubLessons.value[0]!.subLesson.id },
    })
  }
})

const goToSubLesson = (subLessonId: string) => {
  if (!course.value) return
  router.push({ name: 'course-player', params: { id: course.value.id, subLessonId } })
}

const goPrev = () => {
  if (hasPrev.value) goToSubLesson(flatSubLessons.value[currentIndex.value - 1]!.subLesson.id)
}

const goNext = () => {
  if (hasNext.value) goToSubLesson(flatSubLessons.value[currentIndex.value + 1]!.subLesson.id)
}

const handlePlayClick = async () => {
  const subLesson = currentEntry.value?.subLesson
  if (!subLesson || subLesson.progress === 'completed' || !backendCourseId.value) return
  const positions = /^sub-(\d+)-(\d+)$/.exec(subLesson.id)
  if (!positions) return
  try {
    const progress = await completeSubLesson(
      backendCourseId.value,
      Number(positions[1]),
      Number(positions[2]),
    )
    applyProgress(progress)
    progressError.value = ''
  } catch (error) {
    progressError.value = error instanceof Error ? error.message : 'Unable to save course progress'
  }
}

const handleAssignmentSubmit = (answer: string) => {
  const assignment = currentEntry.value?.subLesson.assignment
  if (!assignment) return
  assignment.status = 'submitted'
  assignment.answer = answer
  showSubmitToast.value = true
  setTimeout(() => {
    showSubmitToast.value = false
  }, 2500)
}
</script>

<template>
  <div
    v-if="progressLoading"
    class="grid min-h-screen place-items-center text-gray-700"
    role="status"
  >
    Loading your course…
  </div>
  <div v-else-if="!course || !currentEntry" class="flex min-h-screen flex-col">
    <AppNavbar />
    <main class="player-container flex-1 py-10">
      <p role="alert" class="text-red-700">
        {{ progressError || 'Course lessons are unavailable.' }}
      </p>
      <RouterLink to="/my-courses" class="mt-4 inline-block font-semibold text-blue-600">
        Back to My Courses
      </RouterLink>
    </main>
    <AppFooter />
  </div>
  <div v-else>
    <AppNavbar />

    <main class="player-container flex flex-col gap-6 py-10 md:flex-row md:items-start">
      <CoursePlayerSidebar
        :course="course"
        :active-module-id="currentEntry.module.id"
        :active-sub-lesson-id="currentEntry.subLesson.id"
        :progress-percent="progressPercent"
        @select="goToSubLesson"
      />

      <div class="min-w-0 flex-1 flex flex-col gap-6">
        <p v-if="progressError" role="alert" class="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {{ progressError }}
        </p>
        <Transition
          name="fade"
          mode="out-in"
          enter-active-class="transition-opacity duration-150"
          leave-active-class="transition-opacity duration-100"
          enter-from-class="opacity-0"
          leave-to-class="opacity-0"
        >
          <div :key="currentEntry.subLesson.id" class="flex flex-col gap-6">
            <h1 class="text-4xl leading-tight font-medium tracking-[-0.02em] text-black">
              {{ currentEntry.subLesson.title }}
            </h1>
            <button
              type="button"
              class="group relative block w-full cursor-pointer"
              @click="handlePlayClick"
            >
              <img
                :src="course.imageUrl"
                :alt="currentEntry.subLesson.title"
                class="aspect-739/460 w-full rounded-lg bg-gray-100 object-cover"
              />
              <div
                class="absolute top-1/2 left-1/2 flex h-26 w-26 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 transition-transform duration-200 group-hover:scale-110"
              >
                <svg
                  v-if="currentEntry.subLesson.progress !== 'completed'"
                  class="h-8 w-8 text-white"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                <svg v-else class="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.2l-3.5-3.5L4 14.2 9 19.2 20 8.2l-1.5-1.5z" />
                </svg>
              </div>
            </button>

            <p class="text-base text-[#646D89]">{{ currentEntry.subLesson.description }}</p>

            <AssignmentCard
              v-if="currentEntry.subLesson.assignment"
              :assignment="currentEntry.subLesson.assignment"
              @submit="handleAssignmentSubmit"
            />
            <div
              v-else-if="currentEntry.subLesson.progress === 'completed'"
              class="flex items-center gap-3 rounded-lg bg-blue-100 p-6"
            >
              <svg class="h-6 w-6 shrink-0" viewBox="0 0 20 20" fill="#2FAC8E">
                <path
                  d="M10 1a9 9 0 100 18 9 9 0 000-18zm-1.2 13.2l-4-4 1.4-1.4 2.6 2.6 6-6 1.4 1.4-7.4 7.4z"
                />
              </svg>
              <p class="text-base font-medium text-black">Completed</p>
            </div>
          </div>
        </Transition>
      </div>
    </main>

    <div class="w-full bg-white shadow-[4px_4px_24px_rgba(0,0,0,0.08)]">
      <div class="player-container flex items-center justify-between py-5">
        <button
          type="button"
          class="flex cursor-pointer items-center gap-2 rounded-full px-2 py-1 text-base font-bold text-blue-500 transition-colors duration-200 hover:bg-blue-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="!hasPrev"
          @click="goPrev"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z" />
          </svg>
          Previous Lesson
        </button>
        <button
          type="button"
          class="cursor-pointer rounded-xl bg-blue-600 px-8 py-4.5 text-base font-bold text-white shadow-[4px_4px_24px_rgba(0,0,0,0.08)] transition-all duration-200 hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="!hasNext"
          @click="goNext"
        >
          Next Lesson
        </button>
      </div>
    </div>

    <AppFooter />

    <Transition
      enter-active-class="transition-opacity duration-150"
      leave-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isLoading"
        class="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-white"
      >
        <svg class="h-10 w-10 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V4a8 8 0 00-8 8H4z" />
        </svg>
        <p class="text-sm text-[#646D89]">Loading...</p>
      </div>
    </Transition>

    <Transition
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showSubmitToast"
        class="fixed bottom-8 left-1/2 -translate-x-1/2 rounded-lg bg-utility-green px-6 py-3 text-sm font-semibold text-white shadow-lg"
      >
        Assignment submitted successfully!
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Same centering technique as CourseDetailView's .detail-container — Tailwind's
   arbitrary-value parser can't handle calc() nested inside max() with division. */
.player-container {
  padding-right: max(1.5rem, calc((100vw - 72rem) / 2 + 1.5rem));
  padding-left: max(1.5rem, calc((100vw - 72rem) / 2 + 1.5rem));
}
</style>

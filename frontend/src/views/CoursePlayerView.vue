<script setup lang="ts">
// ── CoursePlayerView ──────────────────────────────────────────────────────
// Course learning page: sidebar progress/module tree, video + assignment, prev/next nav
// Demo readings and available videos use explicit, server-backed completion.

import { computed, nextTick, onMounted, onUnmounted, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppNavbar from '@/components/landing/AppNavbar.vue'
import AppFooter from '@/components/landing/AppFooter.vue'
import CoursePlayerSidebar from '@/components/course/CoursePlayerSidebar.vue'
import AssignmentCard from '@/components/course/AssignmentCard.vue'
import LessonReading from '@/components/course/LessonReading.vue'
import AuthorizedVideo from '@/components/course/AuthorizedVideo.vue'
import { getDemoLesson, getDemoLessonLabels } from '@/data/demoLessons'
import { getEnrolledDemoContent, type DemoContentRow } from '@/api/demoContent'
import { DEMO_VIDEO_LABEL, getLessonVideo } from '@/data/demoVideo'
import {
  completeSubLesson,
  getCheckoutCourse,
  getCourseProgress,
  getSubscriptions,
  type CourseProgressView,
} from '@/api/payments'
import { listMyAssignments, submitAssignment } from '@/api/submissions'
import { toApiError } from '@/api/client'
import { toCardAssignment } from '@/lib/assignmentCard'
import { catalogRouteId, toStorefrontCourse } from '@/lib/catalogCourses'
import { hasScrolledToPageBottom } from '@/lib/scrollComplete'
import { useToast } from '@/composables/useToast'
import type { Course } from '@/types/course'
import type { MyAssignment } from '@/types/submission'

const route = useRoute()
const router = useRouter()
const { success: notifySuccess, error: notifyError } = useToast()

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

const videoFailed = ref(false)
const lessonVideo = computed(() =>
  getLessonVideo(
    currentEntry.value?.subLesson.videoUrl,
    Boolean(currentEntry.value?.subLesson.demoLesson),
  ),
)
const playableVideo = computed(() => lessonVideo.value.url)
const canComplete = computed(() =>
  Boolean(currentEntry.value?.subLesson.demoLesson || (playableVideo.value && !videoFailed.value)),
)
const completionSaving = ref(false)

watch(
  () => currentEntry.value?.subLesson.id,
  (nextId, prevId) => {
    if (!nextId || nextId === prevId) return
    videoFailed.value = false
    // Only jump to the top when moving to a different lesson — not when progress
    // re-renders the current lesson (that was causing the pre-green stutter).
    if (prevId) window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  },
)

const progressPercent = ref(0)
const progressError = ref('')
const backendCourseId = computed(() => {
  const match = /^course-(\d+)$/.exec(String(route.params.id ?? ''))
  return match ? Number(match[1]) : null
})
const progressLoading = ref(true)
let progressRequest = 0

// The caller's assignments for this course, keyed by sub-lesson id (the id the progress API returns).
const myAssignments = ref<Record<number, MyAssignment>>({})
const assignmentError = ref('')
const demoContent = ref<DemoContentRow[]>([])
const demoContentError = ref('')
let lastProgress: CourseProgressView | null = null

function failProgress(message: string) {
  progressError.value = message
  notifyError(message)
}

function failAssignment(message: string) {
  assignmentError.value = message
  notifyError(message)
}

function applyProgress(progress: CourseProgressView) {
  if (!course.value) return
  lastProgress = progress
  const lessonPositions = [...new Set(progress.subLessons.map((item) => item.lessonPosition))]
  course.value.modules = lessonPositions.map((lessonPosition) => {
    const items = progress.subLessons.filter((item) => item.lessonPosition === lessonPosition)
    return {
      id: `module-${lessonPosition}`,
      title: items[0]
        ? getDemoLessonLabels(items[0], getDemoLesson(demoContent.value, items[0])).lessonTitle
        : `Lesson ${lessonPosition}`,
      subLessons: items.map((item) => {
        const assignment = myAssignments.value[item.id]
        const demoLesson = getDemoLesson(demoContent.value, item)
        return {
          id: `sub-${item.lessonPosition}-${item.subLessonPosition}`,
          title: getDemoLessonLabels(item, demoLesson).title,
          description: '',
          videoUrl: item.videoUrl ?? '',
          demoLesson,
          progress: item.completed ? ('completed' as const) : ('not-started' as const),
          assignment: assignment ? toCardAssignment(assignment) : undefined,
        }
      }),
    }
  })
  progressPercent.value = progress.progressPercent
}

/** Update completion flags in place so the lesson body is not remounted. */
function syncProgressFlags(progress: CourseProgressView) {
  lastProgress = progress
  progressPercent.value = progress.progressPercent
  if (!course.value) return
  const completedById = new Map(
    progress.subLessons.map((item) => [
      `sub-${item.lessonPosition}-${item.subLessonPosition}`,
      item.completed,
    ]),
  )
  for (const module of course.value.modules) {
    for (const subLesson of module.subLessons) {
      const completed = completedById.get(subLesson.id)
      if (completed === undefined) continue
      subLesson.progress = completed ? 'completed' : 'not-started'
    }
  }
}

async function loadProgress() {
  const request = ++progressRequest
  const requestedCourseId = backendCourseId.value
  progressLoading.value = true
  progressError.value = ''
  assignmentError.value = ''
  demoContentError.value = ''
  demoContent.value = []
  course.value = undefined
  if (!requestedCourseId) {
    failProgress('Invalid course link.')
    progressLoading.value = false
    return
  }
  try {
    const [subscriptions, progress, assignments] = await Promise.all([
      getSubscriptions(),
      getCourseProgress(requestedCourseId),
      listMyAssignments().catch((error) => {
        if (request === progressRequest) failAssignment(toApiError(error).message)
        return [] as MyAssignment[]
      }),
    ])
    if (request !== progressRequest) return
    myAssignments.value = Object.fromEntries(
      assignments
        .filter((assignment) => assignment.courseId === requestedCourseId)
        .map((assignment) => [assignment.subLessonId, assignment]),
    )
    const subscription = subscriptions.find((item) => item.courseId === requestedCourseId)
    if (!subscription) throw new Error('This course is not in your courses.')
    demoContent.value = await getEnrolledDemoContent(requestedCourseId).catch((error) => {
      if (request === progressRequest) demoContentError.value = toApiError(error).message
      return [] as DemoContentRow[]
    })
    if (request !== progressRequest) return
    const preview = await getCheckoutCourse(requestedCourseId).catch(() => null)
    if (request !== progressRequest) return
    const storefront = preview
      ? toStorefrontCourse(preview)
      : {
          id: catalogRouteId(subscription.courseId),
          category: 'Course',
          title: subscription.courseTitle,
          description: 'Continue learning through the lessons in this course.',
          longDescription: '',
          imageUrl: '',
          lessonCount: 0,
          hourCount: 0,
          price: 0,
          modules: [],
        }
    course.value = {
      ...storefront,
      id: catalogRouteId(subscription.courseId),
      title: subscription.courseTitle,
      description:
        storefront.description || 'Continue learning through the lessons in this course.',
      modules: [],
    }
    applyProgress(progress)
    progressError.value = ''
  } catch (error) {
    if (request === progressRequest)
      failProgress(error instanceof Error ? error.message : 'Unable to load course progress')
  } finally {
    if (request === progressRequest) progressLoading.value = false
  }
}

watch(backendCourseId, loadProgress, { immediate: true })

const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(
  () => currentIndex.value >= 0 && currentIndex.value < flatSubLessons.value.length - 1,
)

const isLoading = ref(false)
let loadingTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => route.params.subLessonId,
  (nextId, prevId) => {
    if (nextId === prevId) return
    isLoading.value = true
    clearTimeout(loadingTimer)
    loadingTimer = setTimeout(() => {
      isLoading.value = false
    }, 400)
  },
)

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  void nextTick().then(observeLessonEnd)
})

onUnmounted(() => {
  clearTimeout(loadingTimer)
  window.removeEventListener('scroll', onScroll)
  lessonEndObserver?.disconnect()
})

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

const handleComplete = async () => {
  const subLesson = currentEntry.value?.subLesson
  if (
    !subLesson ||
    subLesson.progress === 'completed' ||
    !backendCourseId.value ||
    !canComplete.value ||
    completionSaving.value
  )
    return
  const positions = /^sub-(\d+)-(\d+)$/.exec(subLesson.id)
  if (!positions) return
  const request = progressRequest
  completionSaving.value = true
  try {
    const progress = await completeSubLesson(
      backendCourseId.value,
      Number(positions[1]),
      Number(positions[2]),
    )
    if (request !== progressRequest) return
    syncProgressFlags(progress)
    progressError.value = ''
  } catch (error) {
    if (request === progressRequest)
      failProgress(error instanceof Error ? error.message : 'Unable to save course progress')
  } finally {
    completionSaving.value = false
  }
}

function tryCompleteFromScroll() {
  if (hasScrolledToPageBottom()) void handleComplete()
}

function onScroll() {
  tryCompleteFromScroll()
}

const lessonEndSentinel = ref<HTMLElement | null>(null)
let lessonEndObserver: IntersectionObserver | undefined

function observeLessonEnd() {
  lessonEndObserver?.disconnect()
  const target = lessonEndSentinel.value
  if (!target || typeof IntersectionObserver === 'undefined') return
  lessonEndObserver = new IntersectionObserver(
    (entries) => {
      // Require some scroll so short pages do not auto-complete on first paint.
      if (!entries.some((entry) => entry.isIntersecting)) return
      if ((Number.isFinite(window.scrollY) ? window.scrollY : 0) < 24) return
      void handleComplete()
    },
    { root: null, threshold: 0, rootMargin: '0px 0px 80px 0px' },
  )
  lessonEndObserver.observe(target)
}

watch(
  () => currentEntry.value?.subLesson.id,
  async () => {
    await nextTick()
    observeLessonEnd()
  },
)

const handleAssignmentSubmit = async (answer: string) => {
  const assignment = currentEntry.value?.subLesson.assignment
  if (!assignment) return
  const apiId = Number(assignment.id)
  if (backendCourseId.value && Number.isInteger(apiId)) {
    // Real course: the answer is saved through the API and the card shows what the server returns.
    try {
      const saved = await submitAssignment(apiId, answer)
      myAssignments.value = { ...myAssignments.value, [saved.subLessonId]: saved }
      if (lastProgress) applyProgress(lastProgress)
      assignmentError.value = ''
    } catch (error) {
      failAssignment(toApiError(error).message)
      return
    }
  } else {
    assignment.status = 'submitted'
    assignment.answer = answer
  }
  notifySuccess('Assignment submitted successfully!')
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
        <p
          v-if="assignmentError"
          role="alert"
          class="rounded-lg bg-red-50 p-4 text-sm text-red-700"
        >
          {{ assignmentError }}
        </p>
        <p
          v-if="demoContentError"
          role="alert"
          class="rounded-lg bg-amber-50 p-4 text-sm text-amber-900"
        >
          Unable to load lesson content: {{ demoContentError }}
          <button type="button" class="ml-2 underline" @click="loadProgress">Try again</button>
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
            <AuthorizedVideo
              v-if="playableVideo"
              :key="playableVideo"
              :src="playableVideo"
              :aria-label="currentEntry.subLesson.title"
              controls
              playsinline
              preload="metadata"
              class="aspect-video w-full rounded-lg bg-black"
              @error="videoFailed = true"
            />
            <p v-if="lessonVideo.isDemo" class="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
              {{ DEMO_VIDEO_LABEL }}
            </p>
            <p v-if="videoFailed" role="alert" class="rounded-lg bg-amber-50 p-4 text-amber-900">
              Unable to load the video. Please try again later.
            </p>
            <LessonReading
              v-if="currentEntry.subLesson.demoLesson"
              :key="currentEntry.subLesson.id"
              :lesson="currentEntry.subLesson.demoLesson"
            />
            <p
              v-else-if="!playableVideo"
              role="status"
              class="rounded-lg bg-gray-50 p-5 text-gray-600"
            >
              This lesson does not have a reading or video yet.
            </p>

            <p class="text-base text-[#646D89]">{{ currentEntry.subLesson.description }}</p>

            <AssignmentCard
              v-if="currentEntry.subLesson.assignment"
              :assignment="currentEntry.subLesson.assignment"
              @submit="handleAssignmentSubmit"
            />
            <!-- Marks the lesson complete once this end-of-reading marker enters view. -->
            <div ref="lessonEndSentinel" class="h-px w-full" aria-hidden="true"></div>
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

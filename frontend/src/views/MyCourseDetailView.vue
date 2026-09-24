<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppNavbar from '@/components/landing/AppNavbar.vue'
import AppFooter from '@/components/landing/AppFooter.vue'
import {
  getCourseProgress,
  getSubscriptions,
  type CourseProgressView,
  type SubscriptionView,
} from '@/api/payments'
import { courses } from '@/data/courses'

const route = useRoute()
const courseId = computed(() => Number(route.params.courseId))
const subscription = ref<SubscriptionView | null>(null)
const progress = ref<CourseProgressView | null>(null)
const loading = ref(true)
const error = ref('')

const coursePreview = computed(() =>
  courses.find((course) => course.title === subscription.value?.courseTitle),
)
const modules = computed(() => {
  const lessons = progress.value?.subLessons ?? []
  const positions = [...new Set(lessons.map((lesson) => lesson.lessonPosition))]
  return positions.map((position) => {
    const subLessons = lessons.filter((lesson) => lesson.lessonPosition === position)
    return {
      position,
      title: subLessons[0]?.lessonTitle ?? `Lesson ${position}`,
      subLessons,
    }
  })
})
const firstLesson = computed(() => {
  const lessons = progress.value?.subLessons ?? []
  return lessons.find((lesson) => !lesson.completed) ?? lessons[0]
})
const learningRoute = computed(() => {
  if (!firstLesson.value) return null
  return {
    name: 'course-player',
    params: {
      id: `course-${courseId.value}`,
      subLessonId: `sub-${firstLesson.value.lessonPosition}-${firstLesson.value.subLessonPosition}`,
    },
  }
})

async function load() {
  loading.value = true
  error.value = ''
  subscription.value = null
  progress.value = null
  if (!Number.isSafeInteger(courseId.value) || courseId.value <= 0) {
    error.value = 'Invalid course'
    loading.value = false
    return
  }
  try {
    const subscriptions = await getSubscriptions()
    subscription.value = subscriptions.find((item) => item.courseId === courseId.value) ?? null
    if (!subscription.value) {
      error.value = 'This course is not in your courses.'
      return
    }
    progress.value = await getCourseProgress(courseId.value)
  } catch (failure) {
    error.value = failure instanceof Error ? failure.message : 'Unable to load course details'
  } finally {
    loading.value = false
  }
}

watch(courseId, load, { immediate: true })
</script>

<template>
  <div class="flex min-h-screen flex-col bg-white">
    <AppNavbar />
    <main class="mx-auto w-full max-w-6xl flex-1 px-6 pt-8 pb-24">
      <RouterLink
        to="/my-courses"
        class="inline-flex items-center gap-2 rounded text-sm font-semibold text-blue-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        <span aria-hidden="true">←</span> Back to My Courses
      </RouterLink>

      <p v-if="loading" class="mt-8 text-gray-600" role="status">Loading course details…</p>
      <div v-else-if="error" class="mt-8">
        <p role="alert" class="text-red-700">{{ error }}</p>
        <button class="mt-4 text-blue-600 underline" type="button" @click="load">Try again</button>
      </div>

      <template v-else-if="subscription && progress">
        <div class="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_310px] lg:items-start">
          <div class="relative aspect-[739/460] overflow-hidden rounded-lg bg-blue-100">
            <img
              v-if="coursePreview"
              :src="coursePreview.imageUrl"
              :alt="subscription.courseTitle"
              class="h-full w-full object-cover"
            />
            <div
              v-else
              class="grid h-full place-items-center p-8 text-center text-3xl font-medium text-blue-800"
            >
              {{ subscription.courseTitle }}
            </div>
            <RouterLink
              v-if="learningRoute"
              :to="learningRoute"
              :aria-label="`Start learning ${subscription.courseTitle}`"
              class="absolute top-1/2 left-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <svg class="ml-1 h-9 w-9" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </RouterLink>
          </div>

          <aside
            class="rounded-lg bg-white p-6 shadow-[4px_4px_24px_rgba(0,0,0,0.12)] lg:sticky lg:top-6"
          >
            <p class="text-sm font-medium text-orange-500">Course</p>
            <h1 class="mt-5 text-2xl font-medium leading-tight text-gray-900">
              {{ subscription.courseTitle }}
            </h1>
            <p class="mt-2 text-sm leading-6 text-[#646D89]">
              {{
                coursePreview?.description ??
                'Continue learning through the lessons in this course.'
              }}
            </p>
            <p class="mt-6 border-b border-[#D6D9E4] pb-6 text-xl font-medium text-[#646D89]">
              <template v-if="coursePreview"
                >THB
                {{
                  coursePreview.price.toLocaleString('en-US', { minimumFractionDigits: 2 })
                }}</template
              >
              <template v-else>{{ progress.progressPercent }}% completed</template>
            </p>
            <RouterLink
              v-if="learningRoute"
              :to="learningRoute"
              class="mt-6 block rounded-xl bg-blue-600 px-6 py-4 text-center text-base font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Start Learning
            </RouterLink>
            <p v-else class="mt-6 text-sm text-[#646D89]">Lessons are not available yet.</p>
          </aside>
        </div>

        <div class="mt-16 max-w-[739px] space-y-5">
          <h2 class="text-3xl font-medium tracking-tight text-gray-900 sm:text-4xl">
            Course Detail
          </h2>
          <div class="space-y-4 text-sm leading-7 text-[#646D89] sm:text-base">
            <p v-if="coursePreview">{{ coursePreview.description }}</p>
            <p>
              Explore {{ subscription.courseTitle }} at your own pace. Follow each module in order,
              then continue with the next lesson when you are ready.
            </p>
            <p>
              You have completed {{ progress.completedLessons }} of {{ progress.totalLessons }}
              lessons. Your progress is saved as you learn.
            </p>
          </div>
        </div>

        <section class="mt-12 max-w-[739px]" aria-label="Course attachments">
          <h2 class="text-2xl font-medium tracking-tight text-gray-900 sm:text-3xl">Attach File</h2>
          <div
            class="mt-5 inline-flex min-h-16 items-center gap-4 rounded-md bg-[#EAF1FF] px-5 py-3 text-[#53617F]"
          >
            <span
              class="grid h-9 w-9 place-items-center rounded bg-white text-blue-600"
              aria-hidden="true"
            >
              <svg
                class="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path d="M6 3h8l4 4v14H6z" stroke-linejoin="round" />
                <path d="M14 3v5h4" stroke-linejoin="round" />
              </svg>
            </span>
            <span class="text-sm font-medium">No files attached yet</span>
          </div>
        </section>

        <section class="mt-14 max-w-[739px]" aria-label="Course lessons">
          <h2 class="mb-5 text-2xl font-medium tracking-tight text-gray-900 sm:text-3xl">
            Module Samples
          </h2>
          <details
            v-for="(module, index) in modules"
            :key="module.position"
            :open="index === 0"
            class="group border-b border-[#D6D9E4] first:border-t"
          >
            <summary
              class="flex cursor-pointer list-none items-center gap-4 py-4 text-left marker:hidden focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <span class="w-7 shrink-0 text-sm font-medium text-[#646D89]">{{
                String(index + 1).padStart(2, '0')
              }}</span>
              <span class="min-w-0 flex-1 text-base font-medium text-gray-900">{{
                module.title
              }}</span>
              <span
                class="grid h-6 w-6 shrink-0 place-items-center text-[#646D89] transition-transform group-open:rotate-180"
                aria-hidden="true"
                >⌄</span
              >
            </summary>
            <ul
              class="list-disc space-y-2 pb-5 pl-11 text-sm leading-6 text-[#646D89] marker:text-blue-500"
            >
              <li v-for="lesson in module.subLessons" :key="lesson.id">
                {{ lesson.title }}
              </li>
            </ul>
          </details>
          <p v-if="!modules.length" class="py-5 text-[#646D89]">No lessons are available yet.</p>
        </section>
      </template>
    </main>
    <AppFooter />
  </div>
</template>

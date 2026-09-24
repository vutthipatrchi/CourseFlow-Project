<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppFooter from '@/components/landing/AppFooter.vue'
import AppNavbar from '@/components/landing/AppNavbar.vue'
import { courses } from '@/data/courses'
import type { Assignment, SubLessonProgress } from '@/types/course'

const route = useRoute()
const course = computed(
  () => courses.find((item) => item.id === route.params.courseId) ?? courses[0],
)

type LessonItem = {
  id: string
  moduleId: string
  title: string
  progress: SubLessonProgress
  assignment?: Assignment
}

const lessons = computed<LessonItem[]>(() => {
  if (!course.value) return []
  return course.value.modules.flatMap((module) =>
    module.subLessons.map((subLesson) => ({
      id: subLesson.id,
      moduleId: module.id,
      title: subLesson.title,
      progress: subLesson.progress,
      assignment: subLesson.assignment,
    })),
  )
})

const currentId = ref(
  lessons.value.find((lesson) => lesson.progress === 'in-progress')?.id ??
    lessons.value[0]?.id ??
    '',
)
const openModuleIds = ref<string[]>([
  lessons.value.find((lesson) => lesson.id === currentId.value)?.moduleId ?? 'module-1',
])
const draftAnswer = ref('')
const submittedAnswers = ref<Record<string, string>>({})

function progressStorageKey() {
  return `courseflow.learning-progress.${course.value?.id ?? 'unknown'}`
}

function readCompletedIds() {
  try {
    const saved = JSON.parse(localStorage.getItem(progressStorageKey()) ?? '[]') as unknown
    if (!Array.isArray(saved)) return []
    return saved.filter((id): id is string => typeof id === 'string')
  } catch {
    return []
  }
}

const completedIds = ref<string[]>(readCompletedIds())

watch(completedIds, (ids) => {
  localStorage.setItem(progressStorageKey(), JSON.stringify(ids))
})

function lessonProgress(lesson: LessonItem): SubLessonProgress {
  if (lesson.progress === 'completed' || completedIds.value.includes(lesson.id)) return 'completed'
  return lesson.progress
}

const currentLesson = computed(() => lessons.value.find((lesson) => lesson.id === currentId.value))
const currentIndex = computed(() =>
  lessons.value.findIndex((lesson) => lesson.id === currentId.value),
)
const progressPercent = computed(() => {
  const completed = lessons.value.filter((lesson) => lessonProgress(lesson) === 'completed').length
  if (!lessons.value.length) return 0
  return Math.round((completed / lessons.value.length) * 100)
})
const submittedAnswer = computed(() => {
  const lesson = currentLesson.value
  if (!lesson) return undefined
  return submittedAnswers.value[lesson.id] ?? lesson.assignment?.answer
})

function selectLesson(lesson: LessonItem) {
  currentId.value = lesson.id
  draftAnswer.value = ''
  if (!openModuleIds.value.includes(lesson.moduleId)) {
    openModuleIds.value = [...openModuleIds.value, lesson.moduleId]
  }
}

function toggleModule(moduleId: string) {
  openModuleIds.value = openModuleIds.value.includes(moduleId)
    ? openModuleIds.value.filter((id) => id !== moduleId)
    : [...openModuleIds.value, moduleId]
}

function goToOffset(offset: number) {
  const next = lessons.value[currentIndex.value + offset]
  if (next) selectLesson(next)
}

function sendAssignment() {
  const lesson = currentLesson.value
  const answer = draftAnswer.value.trim()
  if (!lesson || !answer) return
  submittedAnswers.value = { ...submittedAnswers.value, [lesson.id]: answer }
  draftAnswer.value = ''
}

function markCurrentLessonComplete() {
  const lesson = currentLesson.value
  if (!lesson || lessonProgress(lesson) === 'completed') return
  completedIds.value = [...completedIds.value, lesson.id]
}

function onScroll() {
  const scrolled = window.scrollY + window.innerHeight
  const pageHeight = document.documentElement.scrollHeight
  if (pageHeight - scrolled <= 24) markCurrentLessonComplete()
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <div v-if="course" class="flex min-h-screen flex-col bg-white">
    <AppNavbar />

    <main
      class="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:items-start"
    >
      <aside
        class="w-full rounded-2xl border border-[#F1F2F6] bg-white p-6 shadow-[2px_2px_12px_rgba(64,50,133,0.08)] lg:w-[340px] lg:flex-none"
      >
        <p class="text-sm font-medium text-orange-500">{{ course.category }}</p>
        <h1 class="mt-2 text-xl font-medium tracking-[-0.02em] text-black">{{ course.title }}</h1>
        <p class="mt-2 text-sm leading-6 text-[#646D89]">{{ course.description }}</p>

        <p class="mt-6 text-sm text-[#646D89]">{{ progressPercent }}% Complete</p>
        <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E4E6ED]" aria-hidden="true">
          <div
            class="h-full rounded-full bg-[#5483D0]"
            :style="{ width: `${progressPercent}%` }"
          ></div>
        </div>

        <div class="mt-6">
          <section
            v-for="module in course.modules"
            :key="module.id"
            class="border-b border-[#F1F2F6]"
          >
            <button
              type="button"
              class="flex w-full items-center gap-4 py-4 text-left"
              :aria-expanded="openModuleIds.includes(module.id)"
              @click="toggleModule(module.id)"
            >
              <span class="w-6 text-sm text-[#646D89]">{{
                String(course.modules.findIndex((item) => item.id === module.id) + 1).padStart(
                  2,
                  '0',
                )
              }}</span>
              <span class="flex-1 text-sm font-medium text-black">{{ module.title }}</span>
              <svg
                viewBox="0 0 24 24"
                class="h-5 w-5 text-[#9AA1B9] transition-transform"
                :class="{ 'rotate-180': openModuleIds.includes(module.id) }"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="m6 9 6 6 6-6"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </button>

            <ul v-if="openModuleIds.includes(module.id)" class="pb-3">
              <li
                v-for="lesson in lessons.filter((item) => item.moduleId === module.id)"
                :key="lesson.id"
              >
                <button
                  type="button"
                  class="flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left text-sm"
                  :class="
                    lesson.id === currentId
                      ? 'bg-[#F6F7FC] text-[#2A2E3F]'
                      : 'text-[#646D89] hover:bg-[#F6F7FC]'
                  "
                  :aria-current="lesson.id === currentId ? 'true' : undefined"
                  @click="selectLesson(lesson)"
                >
                  <span class="mt-0.5 grid h-4 w-4 flex-none place-items-center" aria-hidden="true">
                    <svg
                      v-if="lessonProgress(lesson) === 'completed'"
                      viewBox="0 0 24 24"
                      class="h-4 w-4 text-[#2F9E44]"
                    >
                      <circle cx="12" cy="12" r="9" fill="currentColor" />
                      <path d="m8 12 2.5 2.5L16 9" fill="none" stroke="white" stroke-width="2" />
                    </svg>
                    <span
                      v-else-if="lesson.id === currentId"
                      class="grid h-4 w-4 place-items-center rounded-full bg-[#5483D0] text-[10px] font-bold text-white"
                      >i</span
                    >
                    <span v-else class="h-3.5 w-3.5 rounded-full border border-[#C8CCDB]"></span>
                  </span>
                  <span>{{ lesson.title }}</span>
                </button>
              </li>
            </ul>
          </section>
        </div>
      </aside>

      <section v-if="currentLesson" class="min-w-0 flex-1" :aria-label="currentLesson.title">
        <h2 class="text-3xl leading-tight font-medium tracking-[-0.02em] text-black sm:text-4xl">
          {{ currentLesson.title }}
        </h2>

        <div class="relative mt-6 overflow-hidden rounded-lg bg-[#F1F2F6]">
          <img :src="course.imageUrl" :alt="''" class="aspect-video w-full object-cover" />
          <button
            type="button"
            class="absolute top-1/2 left-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white"
            aria-label="Play lesson video"
          >
            <svg viewBox="0 0 24 24" class="ml-1 h-7 w-7" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>

        <div v-if="currentLesson.assignment" class="mt-6 rounded-xl bg-[#F6F7FC] p-6">
          <div class="flex items-center justify-between gap-4">
            <h3 class="text-lg font-medium text-black">Assignment</h3>
            <span
              class="rounded-md px-2 py-1 text-xs font-medium"
              :class="
                submittedAnswer ? 'bg-[#E5F7ED] text-[#1F8A4C]' : 'bg-[#FFF4D6] text-[#C58A00]'
              "
            >
              {{ submittedAnswer ? 'Submitted' : 'Pending' }}
            </span>
          </div>
          <p class="mt-4 text-sm font-medium text-[#2A2E3F]">
            {{ currentLesson.assignment.question }}
          </p>

          <p
            v-if="submittedAnswer"
            class="mt-4 text-sm leading-6 whitespace-pre-line text-[#646D89]"
          >
            {{ submittedAnswer }}
          </p>
          <form v-else class="mt-4" @submit.prevent="sendAssignment">
            <label class="block">
              <span class="sr-only">Your answer</span>
              <textarea
                v-model="draftAnswer"
                rows="4"
                placeholder="Answer..."
                class="w-full rounded-lg border border-[#D6D9E4] bg-white px-4 py-3 text-sm text-[#2A2E3F] outline-none placeholder:text-[#9AA1B9] focus:border-[#5483D0]"
              ></textarea>
            </label>
            <div class="mt-4 flex items-center justify-between gap-4">
              <button
                type="submit"
                class="rounded-lg bg-[#2F5FAC] px-5 py-3 text-sm font-bold text-white hover:bg-[#254F93] disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="!draftAnswer.trim()"
              >
                Send Assignment
              </button>
              <p class="text-sm text-[#9AA1B9]">{{ currentLesson.assignment.deadlineLabel }}</p>
            </div>
          </form>
        </div>
      </section>
    </main>

    <div class="border-t border-[#F1F2F6]">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
        <button
          type="button"
          class="text-sm font-bold text-[#2F5FAC] disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="currentIndex <= 0"
          @click="goToOffset(-1)"
        >
          Previous Lesson
        </button>
        <button
          type="button"
          class="rounded-lg bg-[#2F5FAC] px-5 py-3 text-sm font-bold text-white hover:bg-[#254F93] disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="currentIndex < 0 || currentIndex >= lessons.length - 1"
          @click="goToOffset(1)"
        >
          Next Lesson
        </button>
      </div>
    </div>

    <AppFooter />
  </div>
</template>

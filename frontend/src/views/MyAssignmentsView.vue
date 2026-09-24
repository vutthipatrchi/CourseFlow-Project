<script setup lang="ts">
// ── MyAssignmentsView ─────────────────────────────────────────────────────
// Aggregates the signed-in user's assignments (from /api/me/assignments) with tab filtering
// แก้ไขได้: tab list, empty-state copy, assignment submit handler

import { computed, onMounted, ref } from 'vue'
import AppNavbar from '@/components/landing/AppNavbar.vue'
import AppFooter from '@/components/landing/AppFooter.vue'
import AssignmentCard from '@/components/course/AssignmentCard.vue'
import { listMyAssignments, submitAssignment } from '@/api/submissions'
import { toApiError } from '@/api/client'
import type { Assignment, AssignmentStatus } from '@/types/course'
import type { MyAssignment } from '@/types/submission'

type Tab = 'all' | 'in-progress' | 'submitted'

const tabs: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'in-progress', label: 'In progress' },
  { key: 'submitted', label: 'Submitted' },
]

const activeTab = ref<Tab>('all')
const assignments = ref<MyAssignment[]>([])
const loading = ref(true)
const loadError = ref('')
const submitError = ref('')

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    assignments.value = await listMyAssignments()
  } catch (failure) {
    loadError.value = toApiError(failure).message
  } finally {
    loading.value = false
  }
}
onMounted(load)

const statusOrder: Record<AssignmentStatus, number> = {
  pending: 0,
  submitted: 1,
  'in-progress': 2,
  overdue: 3,
}

const sortedAssignments = computed(() =>
  [...assignments.value].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]),
)

const filteredAssignments = computed(() => {
  if (activeTab.value === 'all') return sortedAssignments.value
  if (activeTab.value === 'submitted') {
    return sortedAssignments.value.filter((assignment) => assignment.status === 'submitted')
  }
  return sortedAssignments.value.filter((assignment) => assignment.status !== 'submitted')
})

// The course player addresses real courses as course-{id} and sub-lessons as sub-{lesson}-{sub-lesson} positions.
function openInCourseHref(assignment: MyAssignment): string {
  return `/courses/course-${assignment.courseId}/learn/sub-${assignment.lessonPosition}-${assignment.subLessonPosition}`
}

function toCardAssignment(assignment: MyAssignment): Assignment {
  const days = assignment.durationDays
  return {
    id: String(assignment.id),
    question: assignment.description,
    status: assignment.status,
    answer: assignment.answer ?? undefined,
    deadlineLabel: days ? `Assign within ${days} ${days === 1 ? 'day' : 'days'}` : '',
  }
}

async function handleSubmit(assignment: MyAssignment, answer: string) {
  submitError.value = ''
  try {
    const updated = await submitAssignment(assignment.id, answer)
    const index = assignments.value.findIndex((item) => item.id === updated.id)
    if (index !== -1) assignments.value[index] = updated
  } catch (failure) {
    submitError.value = toApiError(failure).message
  }
}
</script>

<template>
  <div>
    <AppNavbar />
    <main class="flex flex-col items-center pb-36.25">
      <section class="relative flex w-full flex-col items-center gap-15 pt-25 pb-10">
        <!-- Positions are Figma coordinates on the 1440px canvas, origin just below the navbar. -->
        <div
          class="pointer-events-none absolute top-0 left-1/2 hidden h-full w-360 max-w-full -translate-x-1/2 md:block"
          aria-hidden="true"
        >
          <span
            class="absolute top-25 left-20.25 h-2.75 w-2.75 rounded-full border-[3px] border-blue-600"
          ></span>
          <span class="absolute top-54 right-0 h-18.5 w-18.5 rounded-full bg-[#C6DCFF]"></span>
          <span
            class="absolute top-39.75 left-5.5 h-[26.35px] w-[26.35px] rounded-full bg-[#C6DCFF]"
          ></span>
          <!-- Regular triangle in a 36.12px box, 3px stroke drawn inside the edge, rotated 51.33deg. -->
          <svg
            class="absolute top-31.5 right-[147.22px] h-[50.78px] w-[50.78px]"
            viewBox="0 0 50.78 50.78"
            fill="none"
          >
            <path
              d="M25.39 10.33L38.43 32.92H12.35Z"
              transform="rotate(51.33 25.39 25.39)"
              stroke="#FBAA1C"
              stroke-width="3"
            />
          </svg>
          <!-- Two corner-to-corner strokes of a 13.68px square, rotated -30deg. -->
          <svg
            class="absolute top-58 left-64.75 h-[13.68px] w-[13.68px] overflow-visible"
            viewBox="0 0 13.68 13.68"
            fill="none"
          >
            <path
              d="M0 0L13.68 13.68M13.68 0L0 13.68"
              transform="rotate(-30 6.84 6.84)"
              stroke="#2FAC61"
              stroke-width="3"
              stroke-linecap="round"
            />
          </svg>
        </div>
        <h1 class="text-4xl leading-tight font-medium tracking-[-0.02em] text-black">
          My Assignments
        </h1>
        <div class="flex items-center gap-4">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="h-10 cursor-pointer border-b px-2 py-2 text-base transition-colors duration-200"
            :class="
              activeTab === tab.key
                ? 'border-black text-black'
                : 'border-transparent text-[#9AA1B9] hover:text-black'
            "
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
      </section>

      <p v-if="submitError" role="alert" class="pb-6 text-base text-red-600">{{ submitError }}</p>
      <p v-if="loading" role="status" class="text-base text-[#646D89]">Loading your assignments…</p>
      <div v-else-if="loadError" class="flex flex-col items-center gap-3">
        <p role="alert" class="text-base text-red-600">{{ loadError }}</p>
        <button
          type="button"
          class="cursor-pointer text-base font-bold text-blue-600 hover:text-blue-700"
          @click="load"
        >
          Try again
        </button>
      </div>
      <section
        v-else-if="filteredAssignments.length > 0"
        class="flex w-full max-w-280 flex-col gap-6"
      >
        <!-- Keyed by status so the card remounts read-only once its answer is saved. -->
        <AssignmentCard
          v-for="assignment in filteredAssignments"
          :key="`${assignment.id}-${assignment.status}`"
          :assignment="toCardAssignment(assignment)"
          :course-title="assignment.courseName"
          :lesson-title="`${assignment.lessonName}: ${assignment.subLessonName}`"
          :open-in-course-href="openInCourseHref(assignment)"
          @submit="(answer) => handleSubmit(assignment, answer)"
        />
      </section>
      <p v-else class="text-base text-[#646D89]">No assignments in this tab yet.</p>
    </main>
    <AppFooter />
  </div>
</template>

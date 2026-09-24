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
          My Assignments
        </h1>
        <div class="flex items-center gap-4">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="cursor-pointer border-b-2 px-2 py-2 text-base transition-colors duration-200"
            :class="
              activeTab === tab.key
                ? 'border-black font-medium text-black'
                : 'border-transparent text-gray-600 hover:text-black'
            "
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
      </section>

      <p v-if="submitError" role="alert" class="pb-6 text-base text-red-600">{{ submitError }}</p>
      <p v-if="loading" role="status" class="pb-20 text-base text-[#646D89]">
        Loading your assignments…
      </p>
      <div v-else-if="loadError" class="flex flex-col items-center gap-3 pb-20">
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
        class="flex w-full max-w-280 flex-col gap-6 pb-20"
      >
        <!-- Keyed by status so the card remounts read-only once its answer is saved. -->
        <AssignmentCard
          v-for="assignment in filteredAssignments"
          :key="`${assignment.id}-${assignment.status}`"
          :assignment="toCardAssignment(assignment)"
          :course-title="assignment.courseName"
          :lesson-title="`${assignment.lessonName}: ${assignment.subLessonName}`"
          :open-in-course-href="`/courses/${assignment.courseId}/learn/${assignment.subLessonId}`"
          @submit="(answer) => handleSubmit(assignment, answer)"
        />
      </section>
      <p v-else class="pb-20 text-base text-[#646D89]">No assignments in this tab yet.</p>
    </main>
    <AppFooter />
  </div>
</template>

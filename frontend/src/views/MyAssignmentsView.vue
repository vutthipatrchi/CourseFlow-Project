<script setup lang="ts">
// ── MyAssignmentsView ─────────────────────────────────────────────────────
// Aggregates assignments across a user's enrolled courses with tab filtering
// แก้ไขได้: tab list, empty-state copy, assignment submit handler

import { computed, ref } from 'vue'
import AppNavbar from '@/components/landing/AppNavbar.vue'
import AppFooter from '@/components/landing/AppFooter.vue'
import AssignmentCard from '@/components/course/AssignmentCard.vue'
import { myAssignments } from '@/data/assignments'
import type { AssignmentStatus } from '@/types/course'

type Tab = 'all' | 'in-progress' | 'submitted'

const tabs: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'in-progress', label: 'In progress' },
  { key: 'submitted', label: 'Submitted' },
]

const activeTab = ref<Tab>('all')

const statusOrder: Record<AssignmentStatus, number> = {
  pending: 0,
  submitted: 1,
  'in-progress': 2,
  overdue: 3,
}

const sortedAssignments = [...myAssignments].sort(
  (a, b) => statusOrder[a.status] - statusOrder[b.status],
)

const filteredAssignments = computed(() => {
  if (activeTab.value === 'all') return sortedAssignments
  if (activeTab.value === 'submitted') {
    return sortedAssignments.filter((assignment) => assignment.status === 'submitted')
  }
  return sortedAssignments.filter((assignment) => assignment.status !== 'submitted')
})

const handleSubmit = (assignmentId: string, answer: string) => {
  const assignment = myAssignments.find((item) => item.id === assignmentId)
  if (!assignment) return
  assignment.status = 'submitted'
  assignment.answer = answer
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

      <section
        v-if="filteredAssignments.length > 0"
        class="flex w-full max-w-280 flex-col gap-6 pb-20"
      >
        <AssignmentCard
          v-for="assignment in filteredAssignments"
          :key="assignment.id"
          :assignment="assignment"
          :course-title="assignment.courseTitle"
          :lesson-title="`${assignment.moduleTitle}: ${assignment.subLessonTitle}`"
          :open-in-course-href="`/courses/${assignment.courseId}/learn/${assignment.subLessonId}`"
          @submit="(answer) => handleSubmit(assignment.id, answer)"
        />
      </section>
      <p v-else class="pb-20 text-base text-[#646D89]">No assignments in this tab yet.</p>
    </main>
    <AppFooter />
  </div>
</template>
